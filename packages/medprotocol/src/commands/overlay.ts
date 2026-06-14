import { parseArgs } from "node:util";
import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync, watch } from "node:fs";
import { join, resolve } from "node:path";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { OVERLAY_CLIENT_JS } from "../overlay-client";

const USAGE = `Usage: medprotocol overlay [options]

The local bridge for the dev overlay. Serves the overlay client script, accepts
selections from the browser, and drains the resulting work-order queue
(.medprotocol/queue/) into a dispatch plan naming the skill to run for each
selection — /medical-protocol:overlay-audit or overlay-implement.

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

type Action = "audit" | "implement";
type Status = "pending" | "processing" | "done";

interface WorkOrder {
  action: Action;
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
  result?: { score?: string; report?: string } | null; // written back by the audit/implement skill
}

interface QueueEntry {
  file: string;
  order: WorkOrder;
}

const SKILL_BY_ACTION: Record<Action, string> = {
  audit: "/medical-protocol:overlay-audit",
  implement: "/medical-protocol:overlay-implement",
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

const targetLabel = (o: WorkOrder): string => {
  if (o.suggestedId) return o.suggestedId; // app already uses medprotocol
  const tag = o.tag ? `<${o.tag}>` : "selection";
  const text = o.text ? ` "${o.text.slice(0, 40)}${o.text.length > 40 ? "…" : ""}"` : "";
  return `${tag}${text}`;
};

const dispatchLine = (o: WorkOrder): string => {
  const skill = SKILL_BY_ACTION[o.action] ?? `(unknown action: ${o.action})`;
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
  "skill — overlay-audit for action \"audit\", overlay-implement for action \"implement\". Write the " +
  "findings into the work order's `result` field and set `status: done` so the overlay can display " +
  "them. For implement, stage the diff only — never apply without approval.";

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
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const path = (req.url ?? "/").split("?")[0];

    if (req.method === "GET" && (path === "/overlay.js" || path === "/")) {
      res.writeHead(200, {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store", // dev tool — always serve the latest client
      });
      res.end(OVERLAY_CLIENT_JS);
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
      if (!resolved.startsWith(dir) || !existsSync(resolved)) {
        res.writeHead(404, JSON_HEADER);
        res.end(JSON.stringify({ error: "not found" }));
        return;
      }
      try {
        const order = JSON.parse(readFileSync(resolved, "utf8")) as WorkOrder & { result?: unknown };
        res.writeHead(200, JSON_HEADER);
        res.end(JSON.stringify({ result: order.result ?? null, status: statusOf(order as WorkOrder) }));
      } catch {
        res.writeHead(500, JSON_HEADER);
        res.end(JSON.stringify({ error: "could not read result" }));
      }
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
        if ((order.action !== "audit" && order.action !== "implement") || (!order.selector && !order.html)) {
          res.writeHead(400, JSON_HEADER);
          res.end(JSON.stringify({ error: 'work order needs "action" ("audit"|"implement") and a "selector" or "html"' }));
          return;
        }
        const ts = order.ts || new Date().toISOString();
        const record: WorkOrder = { ...order, ts, status: "pending" };
        const slug = (order.suggestedId || order.tag || "selection").replace(/[^a-z0-9-]/gi, "").slice(0, 24) || "selection";
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

  server.listen(port, () => {
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
