import { parseArgs } from "node:util";
import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync, watch } from "node:fs";
import { join, resolve, sep } from "node:path";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { OVERLAY_CLIENT_JS } from "../overlay-client";

const USAGE = `Usage: medprotocol overlay [options]

The local bridge for the dev overlay. Serves the overlay client script, accepts
selections from the browser, and drains the resulting work-order queue
(.medprotocol/queue/) into a dispatch plan naming the skill to run for each
selection — /medical-protocol:overlay-audit, overlay-implement, or overlay-add
(the doctor selects a region, types a brief, and Add builds a new component there).

Options:
  --serve                Serve the overlay client (GET /overlay.js) and accept
                         selections (POST /queue). Add the printed <script> tag
                         to your app in dev. Ctrl-C to stop.
  --port <number>        Port for --serve (default: 7331)
  --auto                 With --serve: on each selection, spawn a headless Claude
                         Code run (claude -p) to process the order automatically —
                         closing the loop so the result appears with no terminal
                         step. Requires the 'claude' CLI; opt-in (runs unattended).
  --list                 List pending work orders without changing them
  --drain                Claim pending orders (mark "processing") and print a dispatch plan
  --watch                Watch the queue and report new orders as they arrive (Ctrl-C to stop)
  --clear                Remove completed orders (status "done")
  --dir <path>           Queue directory (default: .medprotocol/queue)
  --json                 Output as JSON
  --help                 Show this help

Examples:
  medprotocol overlay --serve
  medprotocol overlay --serve --port 8080
  medprotocol overlay --list
  medprotocol overlay --drain
  medprotocol overlay --watch
  medprotocol overlay --clear`;

// "skill" orders are minted by the result panel's "Run" triggers (POST /run): the doctor clicks a
// skill the report recommended, and we re-process the same selection with that named skill.
type Action = "audit" | "implement" | "add" | "skill";
type Status = "pending" | "processing" | "done";

interface SkillSuggestion {
  skill: string; // slash command to offer, e.g. "/medical-protocol:overlay-implement"
  label?: string; // human button text (defaults to the skill name)
  prompt?: string; // optional brief to carry into the triggered run
}

interface WorkOrder {
  action: Action;
  skill?: string | null; // "skill" action only — the slash command to run against this selection
  prompt?: string | null; // free-text brief — required for "add" (what component to build), null otherwise
  selector?: string | null;
  tag?: string | null;
  classes?: string | null;
  text?: string | null;
  html?: string | null;
  rect?: { x: number; y: number; w: number; h: number } | null;
  suggestedId?: string | null; // optional fast-path: data-medprotocol-id if the app already uses medprotocol
  source?: string | null; // optional fast-path: data-medprotocol-source
  url?: string | null;
  ts: string;
  status?: Status;
  approved?: boolean;
  // written back by the audit/implement/add skill. `suggestions` surface as clickable triggers in the panel.
  result?: { score?: string; report?: string; suggestions?: SkillSuggestion[] } | null;
}

interface QueueEntry {
  file: string;
  order: WorkOrder;
}

const SKILL_BY_ACTION: Record<Exclude<Action, "skill">, string> = {
  audit: "/medical-protocol:overlay-audit",
  implement: "/medical-protocol:overlay-implement",
  add: "/medical-protocol:overlay-add",
};

// Accept "/medical-protocol:bmi", "medical-protocol:bmi", or bare "bmi"; normalize to the slash form.
// Returns null for anything outside the medical-protocol plugin namespace.
const normalizeSkill = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  const m = raw.trim().match(/^\/?(?:medical-protocol:)?([a-z][a-z0-9-]*)$/);
  return m ? `/medical-protocol:${m[1]}` : null;
};

// Path-containment guard. `startsWith(dir)` alone matches sibling dirs like "<dir>-evil";
// require an exact match or a real path-separator boundary.
const within = (dir: string, p: string): boolean => p === dir || p.startsWith(dir + sep);

// The bridge binds to loopback, but a browser the doctor has open can still POST cross-origin
// (the request reaches us even when CORS blocks the *response*). So we gate state-changing and
// data endpoints on the Origin header: requests from a real website are refused, while the local
// dev app (http://localhost:3000, 127.0.0.1, *.localhost) and non-browser callers (no Origin) pass.
const isLocalOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true; // curl / same-process callers send no Origin; only loopback can reach us
  try {
    const host = new URL(origin).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".localhost");
  } catch {
    return false;
  }
};

const readQueue = (dir: string): QueueEntry[] => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const file = join(dir, f);
      try {
        return { file, order: JSON.parse(readFileSync(file, "utf8")) as WorkOrder };
      } catch {
        return null;
      }
    })
    .filter((e): e is QueueEntry => e !== null);
};

const statusOf = (o: WorkOrder): Status => o.status ?? "pending";

const truncate = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n)}…` : s);

const targetLabel = (o: WorkOrder): string => {
  // "add" is described by the doctor's free-text brief, not the selected markup.
  if (o.action === "add" && o.prompt) return `"${truncate(o.prompt.trim(), 56)}"`;
  if (o.suggestedId) return o.suggestedId; // app already uses medprotocol
  const tag = o.tag ? `<${o.tag}>` : "selection";
  const text = o.text ? ` "${truncate(o.text, 40)}"` : "";
  return `${tag}${text}`;
};

const dispatchLine = (o: WorkOrder): string => {
  const skill =
    o.action === "skill"
      ? o.skill || "(unknown skill)"
      : (SKILL_BY_ACTION[o.action as Exclude<Action, "skill">] ?? `(unknown action: ${o.action})`);
  const where = o.source ? ` — source: ${o.source}` : o.selector ? ` — ${o.selector}` : "";
  return `${skill}  →  ${targetLabel(o)}${where}`;
};

const printOrders = (entries: QueueEntry[], json: boolean, header: string): void => {
  if (json) {
    process.stdout.write(JSON.stringify(entries.map((e) => e.order), null, 2) + "\n");
    return;
  }
  if (entries.length === 0) {
    process.stdout.write("Queue empty — no matching work orders.\n");
    return;
  }
  process.stdout.write(`${header} (${entries.length})\n\n`);
  for (const { order } of entries) {
    process.stdout.write(`  ${dispatchLine(order)}\n`);
  }
  process.stdout.write("\n");
};

const JSON_HEADER = { "Content-Type": "application/json" } as const;

const AUTO_PROMPT =
  "A medical-protocol overlay selection was just queued in .medprotocol/queue/. " +
  "Process all pending overlay work orders now, without asking for confirmation: run " +
  "`npx medprotocol overlay --drain --json` to claim them, then for each order run the matching " +
  "skill — overlay-audit for action \"audit\", overlay-implement for action \"implement\", " +
  "overlay-add for action \"add\" (build the component described in the order's `prompt` field and " +
  "stage it into the selected region). For action \"skill\", run the skill named in the order's `skill` " +
  "field against the captured selection (use `html`/`selector`/`source` to locate the region, and the " +
  "order's `prompt` as extra brief if present); if that skill builds or edits files, STAGE the diff only " +
  "(never apply without approval); if it is read-only, just gather its findings. " +
  "Write the findings into the work order's `result` field and " +
  "set `status: done` so the overlay can display them. For implement and add, stage the diff only — " +
  "never apply without approval. EXCEPTION: if a drained order already has `approved: true` and a " +
  "staged diff under .medprotocol/staged/ (the doctor clicked Apply in the overlay), do NOT re-stage — " +
  "land that staged diff into source, remove the shadow file, then set `status: done` and update " +
  "`result` to note it was applied.";

// Spawn a headless Claude Code run to process the queue. Debounced: one run drains all pending
// orders; selections that arrive mid-run trigger exactly one follow-up run.
const makeDispatcher = (cwd: string) => {
  let busy = false;
  let rerun = false;
  const spawnAgent = (): void => {
    busy = true;
    process.stdout.write("▶ dispatching headless Claude (claude -p) to process the queue…\n");
    const child = spawn(
      "claude",
      ["-p", AUTO_PROMPT, "--permission-mode", "acceptEdits", "--allowedTools", "Bash", "Read", "Edit", "Write", "Grep", "Glob"],
      { cwd, stdio: ["ignore", "pipe", "pipe"] },
    );
    child.stdout.on("data", (d) => process.stdout.write(`[claude] ${d}`));
    child.stderr.on("data", (d) => process.stderr.write(`[claude] ${d}`));
    child.on("error", (err: NodeJS.ErrnoException) => {
      busy = false;
      if (err.code === "ENOENT") {
        process.stderr.write("✗ --auto needs the 'claude' CLI on PATH (https://claude.com/claude-code). Auto-dispatch disabled for this selection.\n");
      } else {
        process.stderr.write(`✗ headless Claude failed: ${err.message}\n`);
      }
    });
    child.on("close", () => {
      busy = false;
      process.stdout.write("✓ headless Claude run finished.\n");
      if (rerun) { rerun = false; spawnAgent(); }
    });
  };
  return (): void => {
    if (busy) { rerun = true; return; }
    spawnAgent();
  };
};

const serve = (dir: string, port: number, auto: boolean): void => {
  mkdirSync(dir, { recursive: true });
  const dispatch = auto ? makeDispatcher(process.cwd()) : null;

  const server = createServer((req, res) => {
    const origin = req.headers.origin;
    const localOrigin = isLocalOrigin(origin);
    // Reflect a trusted local Origin so the dev app can read responses; never echo a remote site
    // (a wildcard would let any open website read captured selections via /status and /result).
    if (origin && localOrigin) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const path = (req.url ?? "/").split("?")[0];

    // Public: the client script is fetched via a <script> tag (no CORS read) and is inert by itself.
    if (req.method === "GET" && (path === "/overlay.js" || path === "/")) {
      res.writeHead(200, {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store", // dev tool — always serve the latest client
      });
      res.end(OVERLAY_CLIENT_JS);
      return;
    }

    // Every other endpoint either accepts selection data or hands it back. A real website the doctor
    // has open could POST here (CORS blocks the response, not the request) and, under --auto, drive a
    // headless Claude run with write/exec. Refuse anything that isn't a loopback origin.
    if (!localOrigin) {
      res.writeHead(403, JSON_HEADER);
      res.end(JSON.stringify({ error: "forbidden: cross-origin request" }));
      return;
    }

    // Live status of every work order — lets the overlay show progress on each selected element.
    if (req.method === "GET" && path === "/status") {
      const statuses = readQueue(dir).map(({ file, order }) => ({
        file,
        action: order.action,
        selector: order.selector ?? null,
        status: statusOf(order),
        hasResult: !!order.result,
      }));
      res.writeHead(200, JSON_HEADER);
      res.end(JSON.stringify(statuses));
      return;
    }

    // Full result for one work order — fetched on demand when the doctor opens the result panel.
    if (req.method === "GET" && path === "/result") {
      const fileParam = new URL(req.url ?? "/", "http://localhost").searchParams.get("file") ?? "";
      const resolved = resolve(fileParam);
      // only serve files inside the queue dir
      if (!within(dir, resolved) || !existsSync(resolved)) {
        res.writeHead(404, JSON_HEADER);
        res.end(JSON.stringify({ error: "not found" }));
        return;
      }
      try {
        const order = JSON.parse(readFileSync(resolved, "utf8")) as WorkOrder & { result?: unknown };
        res.writeHead(200, JSON_HEADER);
        res.end(
          JSON.stringify({
            result: order.result ?? null,
            status: statusOf(order as WorkOrder),
            action: order.action,
            approved: !!order.approved,
          }),
        );
      } catch {
        res.writeHead(500, JSON_HEADER);
        res.end(JSON.stringify({ error: "could not read result" }));
      }
      return;
    }

    // Approve a staged add/implement order from the overlay's "Apply" button. Marks the order
    // approved and re-queues it (status → pending) so the matching skill lands the staged diff.
    // With --auto, this also kicks the dispatcher to apply it immediately.
    if (req.method === "POST" && path === "/approve") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > 100_000) req.destroy();
      });
      req.on("end", () => {
        let fileParam = "";
        try {
          fileParam = (JSON.parse(body) as { file?: string }).file ?? "";
        } catch {
          res.writeHead(400, JSON_HEADER);
          res.end(JSON.stringify({ error: "invalid JSON" }));
          return;
        }
        const resolved = resolve(fileParam);
        if (!within(dir, resolved) || !existsSync(resolved)) {
          res.writeHead(404, JSON_HEADER);
          res.end(JSON.stringify({ error: "not found" }));
          return;
        }
        let order: WorkOrder;
        try {
          order = JSON.parse(readFileSync(resolved, "utf8")) as WorkOrder;
        } catch {
          res.writeHead(500, JSON_HEADER);
          res.end(JSON.stringify({ error: "could not read work order" }));
          return;
        }
        if (order.action !== "implement" && order.action !== "add" && order.action !== "skill") {
          res.writeHead(400, JSON_HEADER);
          res.end(JSON.stringify({ error: "only implement/add/skill orders can be applied" }));
          return;
        }
        // Approve and re-queue so the skill lands the staged diff (it re-applies rather than re-stages).
        const record: WorkOrder = { ...order, approved: true, status: "pending" };
        try {
          writeFileSync(resolved, JSON.stringify(record, null, 2) + "\n");
        } catch (err) {
          res.writeHead(500, JSON_HEADER);
          res.end(JSON.stringify({ error: `could not approve: ${(err as Error).message}` }));
          return;
        }
        process.stdout.write(`approved (apply) ${dispatchLine(record)}\n`);
        res.writeHead(200, JSON_HEADER);
        res.end(JSON.stringify({ ok: true, auto: !!dispatch }));
        if (dispatch) dispatch();
        return;
      });
      return;
    }

    // Trigger a skill the report recommended, from the result panel. Reads the originating order,
    // inherits its selection anchor, and mints a "skill" work order that re-processes that same
    // region with the named skill. With --auto, the dispatcher runs it immediately.
    if (req.method === "POST" && path === "/run") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > 100_000) req.destroy();
      });
      req.on("end", () => {
        let payload: { file?: string; skill?: string; prompt?: string };
        try {
          payload = JSON.parse(body) as typeof payload;
        } catch {
          res.writeHead(400, JSON_HEADER);
          res.end(JSON.stringify({ error: "invalid JSON" }));
          return;
        }
        const skill = normalizeSkill(payload.skill);
        if (!skill) {
          res.writeHead(400, JSON_HEADER);
          res.end(JSON.stringify({ error: "skill must be a medical-protocol skill name" }));
          return;
        }
        const resolved = resolve(payload.file ?? "");
        if (!within(dir, resolved) || !existsSync(resolved)) {
          res.writeHead(404, JSON_HEADER);
          res.end(JSON.stringify({ error: "originating order not found" }));
          return;
        }
        let src: WorkOrder;
        try {
          src = JSON.parse(readFileSync(resolved, "utf8")) as WorkOrder;
        } catch {
          res.writeHead(500, JSON_HEADER);
          res.end(JSON.stringify({ error: "could not read originating order" }));
          return;
        }
        const ts = new Date().toISOString();
        const brief = typeof payload.prompt === "string" && payload.prompt.trim() ? payload.prompt.trim() : null;
        const record: WorkOrder = {
          action: "skill",
          skill,
          prompt: brief,
          // inherit the selection anchor so the triggered skill acts on the same region
          selector: src.selector ?? null,
          tag: src.tag ?? null,
          classes: src.classes ?? null,
          text: src.text ?? null,
          html: src.html ?? null,
          rect: src.rect ?? null,
          suggestedId: src.suggestedId ?? null,
          source: src.source ?? null,
          url: src.url ?? null,
          ts,
          status: "pending",
        };
        const slug = (skill.split(":").pop() || "skill").replace(/[^a-z0-9-]/gi, "").slice(0, 24) || "skill";
        const file = join(dir, `${ts.replace(/[:.]/g, "-")}-${slug}.json`);
        try {
          mkdirSync(dir, { recursive: true });
          writeFileSync(file, JSON.stringify(record, null, 2) + "\n");
        } catch (err) {
          res.writeHead(500, JSON_HEADER);
          res.end(JSON.stringify({ error: `could not write work order: ${(err as Error).message}` }));
          return;
        }
        process.stdout.write(`queued  ${dispatchLine(record)}\n`);
        res.writeHead(200, JSON_HEADER);
        res.end(JSON.stringify({ ok: true, file, auto: !!dispatch }));
        if (dispatch) dispatch();
        return;
      });
      return;
    }

    if (req.method === "POST" && path === "/queue") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > 1_000_000) req.destroy();
      });
      req.on("end", () => {
        let order: WorkOrder;
        try {
          order = JSON.parse(body) as WorkOrder;
        } catch {
          res.writeHead(400, JSON_HEADER);
          res.end(JSON.stringify({ error: "invalid JSON" }));
          return;
        }
        if (order.action !== "audit" && order.action !== "implement" && order.action !== "add") {
          res.writeHead(400, JSON_HEADER);
          res.end(JSON.stringify({ error: 'work order needs "action" ("audit"|"implement"|"add")' }));
          return;
        }
        if (!order.selector && !order.html) {
          res.writeHead(400, JSON_HEADER);
          res.end(JSON.stringify({ error: 'work order needs a "selector" or "html" anchor' }));
          return;
        }
        if (order.action === "add" && !order.prompt?.trim()) {
          res.writeHead(400, JSON_HEADER);
          res.end(JSON.stringify({ error: '"add" work order needs a non-empty "prompt" describing the component to build' }));
          return;
        }
        const ts = order.ts || new Date().toISOString();
        const record: WorkOrder = { ...order, ts, status: "pending" };
        const slug =
          order.action === "add"
            ? "add"
            : (order.suggestedId || order.tag || "selection").replace(/[^a-z0-9-]/gi, "").slice(0, 24) || "selection";
        const file = join(dir, `${ts.replace(/[:.]/g, "-")}-${slug}.json`);
        try {
          mkdirSync(dir, { recursive: true }); // dir may have been cleared/removed since startup
          writeFileSync(file, JSON.stringify(record, null, 2) + "\n");
        } catch (err) {
          process.stderr.write(`Failed to write work order: ${(err as Error).message}\n`);
          res.writeHead(500, JSON_HEADER);
          res.end(JSON.stringify({ error: "could not write work order" }));
          return;
        }
        process.stdout.write(`queued  ${dispatchLine(record)}\n`);
        res.writeHead(200, JSON_HEADER);
        res.end(JSON.stringify({ ok: true, file }));
        if (dispatch) dispatch();
        return;
      });
      return;
    }

    res.writeHead(404, JSON_HEADER);
    res.end(JSON.stringify({ error: "not found" }));
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      process.stderr.write(`Port ${port} is in use. Pick another with --port <number>.\n`);
    } else {
      process.stderr.write(`Overlay server error: ${err.message}\n`);
    }
    process.exitCode = 1;
  });

  // Bind to loopback only — never expose the bridge (which can spawn write/exec under --auto) on the LAN.
  server.listen(port, "127.0.0.1", () => {
    process.stdout.write(`medprotocol overlay server → http://localhost:${port}\n`);
    process.stdout.write(`Queue dir: ${dir}\n\n`);
    process.stdout.write(`Add to your app (dev only), e.g. in app/layout.tsx:\n`);
    process.stdout.write(`  {process.env.NODE_ENV === "development" && (\n`);
    process.stdout.write(`    <script src="http://localhost:${port}/overlay.js" async />\n`);
    process.stdout.write(`  )}\n\n`);
    if (auto) {
      process.stdout.write(`Auto mode ON: each selection spawns a headless Claude run (claude -p) to process it. Ctrl-C to stop.\n`);
    } else {
      process.stdout.write(`Selections appear below as they arrive. Drain them with /medical-protocol:overlay-audit | overlay-implement (or use --auto). Ctrl-C to stop.\n`);
    }
  });
};

export const run = (argv: string[]): void => {
  const { values } = parseArgs({
    args: argv,
    options: {
      serve: { type: "boolean", default: false },
      port: { type: "string" },
      auto: { type: "boolean", default: false },
      list: { type: "boolean", default: false },
      drain: { type: "boolean", default: false },
      watch: { type: "boolean", default: false },
      clear: { type: "boolean", default: false },
      dir: { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(USAGE + "\n");
    return;
  }

  const dir = resolve(values.dir ?? join(".medprotocol", "queue"));
  const json = values.json!;

  if (values.serve) {
    const port = Number.parseInt(values.port ?? "7331", 10);
    if (Number.isNaN(port) || port < 1 || port > 65535) {
      process.stderr.write("--port must be a number between 1 and 65535\n");
      process.exitCode = 1;
      return;
    }
    serve(dir, port, values.auto!);
    return;
  }

  if (values.clear) {
    const done = readQueue(dir).filter((e) => statusOf(e.order) === "done");
    for (const { file } of done) unlinkSync(file);
    if (json) {
      process.stdout.write(JSON.stringify({ cleared: done.length }) + "\n");
    } else {
      process.stdout.write(`Cleared ${done.length} completed work order(s).\n`);
    }
    return;
  }

  if (values.watch) {
    if (!existsSync(dir)) {
      process.stderr.write(`Queue directory does not exist yet: ${dir}\nWaiting for the overlay to create it…\n`);
    }
    const seen = new Set<string>();
    const report = () => {
      for (const entry of readQueue(dir)) {
        if (seen.has(entry.file) || statusOf(entry.order) !== "pending") continue;
        seen.add(entry.file);
        process.stdout.write(`new  ${dispatchLine(entry.order)}\n`);
      }
    };
    report();
    process.stdout.write(`Watching ${dir} … (Ctrl-C to stop)\n`);
    if (existsSync(dir)) watch(dir, report);
    return;
  }

  if (values.drain) {
    const pending = readQueue(dir).filter((e) => statusOf(e.order) === "pending");
    for (const { file, order } of pending) {
      writeFileSync(file, JSON.stringify({ ...order, status: "processing" }, null, 2) + "\n");
    }
    printOrders(pending, json, "Dispatch plan — claimed pending work orders");
    return;
  }

  // default / --list
  const pending = readQueue(dir).filter((e) => statusOf(e.order) === "pending");
  printOrders(pending, json, "Pending work orders");
};
