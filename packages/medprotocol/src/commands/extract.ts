import type { ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { basename, dirname, extname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { FIELDS, EPISODES, checkExtraction, noteSegments, toInputs, type ExtractedItem, type Finding } from "../../../../plugin/lib/extraction";
import { formatHeader, formatTable, printResult, formatError } from "../../../../plugin/lib/format";
import { EXTRACT_ARTIFACT_HTML } from "../extract-artifact";
import { isLocalOrigin } from "./overlay";

const USAGE = `Usage: medprotocol extract --note <file> --items <file> [options]
       medprotocol extract --save <file>
       medprotocol extract --serve [--port <number>]

Checks an extraction against its note: is each quote in the note verbatim, and does it state the value?
No clinical interpretation.

Options:
  --save <file>     Store a raw note as extractions/<hash>/note.md and print the folder. The hash is the first
                    12 hex of the SHA-256 of the note with line endings and trailing whitespace evened out,
                    so the same note always lands in the same folder. A <file> directly in extractions/
                    is a staging copy and is deleted once saved.
  --note <file>     The clinical note (plain text)
  --items <file>    JSON array of { field, value, unit?, quote, episode, key?, time? }
                    episode: "current" (this illness) or "history" (before it)
  --artifact <file> Also write a page showing the note beside the extraction (HTML)
  --serve           Start the local extraction page server. Takes no other option but --port.
  --port <number>   Port for --serve (default 7332)
  --json            Output as JSON
  --help           Show this help

Output: each item's status, plus "inputs" (verified numbers by key, for the calculators) and
"review" (keyed items held back, with the reason). Keys: ${Object.keys(FIELDS).join(", ")}

Statuses: quoted (exact) · edited (case/accents differ) · approximate (within 5 characters)
          · reordered (same words, another order, within 5 characters) · mismatched (span found, value not in it) · unverified (not in note) · none (no quote)
          edited, approximate and reordered are lower confidence: highlighted, but held back from "inputs".

Example:
  medprotocol extract --note note.txt --items extraction.json --json`;

/** Stores a raw note as extractions/<hash>/note.md, once. */
export const saveNote = (raw: Buffer): { dir: string; existed: boolean } => {
  // CRLF vs LF or a trailing newline must not split one note into two folders; note.md keeps the raw bytes
  const canonical = raw.toString("utf8").replace(/^﻿/, "").replace(/\r\n?/g, "\n").trimEnd();
  const dir = join("extractions", createHash("sha256").update(canonical).digest("hex").slice(0, 12));
  const existed = existsSync(join(dir, "note.md"));
  if (!existed) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "note.md"), raw);
  }
  return { dir, existed };
};

/** Why `items` is not a usable extraction, or null when it is. */
export const itemsError = (items: unknown): string | null => {
  if (!Array.isArray(items) || items.some((i) => typeof i?.field !== "string" || typeof i?.value !== "string" || typeof i?.quote !== "string")) {
    return "--items must be a JSON array of { field, value, unit?, quote } strings";
  }
  const badEpisode = items.find((i) => !(EPISODES as readonly string[]).includes(i.episode));
  if (badEpisode) return `"${badEpisode.field}" needs episode "current" or "history"`;
  const badKey = items.find((i) => i.key !== undefined && !Object.hasOwn(FIELDS, i.key));
  if (badKey) return `unknown key "${badKey.key}" — use one of: ${Object.keys(FIELDS).join(", ")}`;
  return null;
};

/** The data block the extraction page renders. `items` are already checked against `note`. */
export const pageData = (name: string, note: string, items: ReturnType<typeof checkExtraction>) => ({
  name,
  checkedAt: new Date().toLocaleDateString("sv"),
  items,
  segments: noteSegments(note, items),
});

const readJson = (file: string): any => (existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : undefined);

/**
 * What the page shows for extractions/<hash>, worked out from the files in it. `running`: a model
 * run is going for this folder. `error` is filled in by the server, which keeps it in memory.
 */
export const stateOf = (dir: string, running: boolean) => {
  const note = readFileSync(join(dir, "note.md"), "utf8");
  const firstPass: ExtractedItem[] | undefined = readJson(join(dir, "extraction.json"));
  const verify: { findings: Finding[] } | undefined = readJson(join(dir, "verify.json"));
  const decisions: Record<string, "accepted" | "rejected"> = readJson(join(dir, "decisions.json")) ?? {};
  const findings = (verify?.findings ?? []).map((f, n) => ({
    ...f,
    before: (f.index === undefined ? null : firstPass?.[f.index]) ?? null,
    decision: decisions[n] ?? null,
  }));
  // a remark (no index, no correction) changes no item, so it needs no decision
  const undecided = findings.some((f) => (f.correction || f.index !== undefined) && !f.decision);
  const state = verify ? (undecided ? "review" : "done") : !running ? "failed" : firstPass ? "verifying" : "extracting";
  const items = verify ? checkExtraction(note, readJson(join(dir, "corrected.json")) ?? []) : [];
  return { id: basename(dir), state, error: null as string | null, note, ...pageData(basename(dir), note, items), findings };
};

export type AskModel = (prompt: string) => Promise<string>;

/** Model runs going now; killed when the server is stopped. */
const children = new Set<ChildProcess>();

const askClaude: AskModel = () => Promise.reject(new Error("not implemented yet"));

const MAX_BODY = 1_000_000;

/** The local extraction page server. Returns the server so tests can read its port and close it. */
export const serve = (port: number, askModel: AskModel = askClaude): Server => {
  mkdirSync("extractions", { recursive: true });
  // notes are patient data: never commit them
  const ignored = existsSync(".gitignore") ? readFileSync(".gitignore", "utf8") : "";
  if (!/^\/?extractions\/?$/m.test(ignored)) appendFileSync(".gitignore", `${ignored && !ignored.endsWith("\n") ? "\n" : ""}extractions/\n`);

  const page = EXTRACT_ARTIFACT_HTML.replace("__TITLE__", "Note extraction").replace("__DATA__", '{"live":true}');
  const running = new Set<string>();
  const errors = new Map<string, string>();
  void askModel;

  const server = createServer((req, res) => {
    const send = (status: number, body: unknown, type = "application/json"): void => {
      res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
      res.end(typeof body === "string" ? body : JSON.stringify(body));
    };
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    const at = req.socket.localPort;
    // a website can point its own domain name at 127.0.0.1; the Host header gives it away
    if (req.headers.host !== `localhost:${at}` && req.headers.host !== `127.0.0.1:${at}`) return send(403, { error: "forbidden" });
    if (path.startsWith("/api") && !isLocalOrigin(req.headers.origin)) return send(403, { error: "forbidden" });

    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      // past the limit the rest is read and dropped, so the 413 reaches a client that is still sending
      if (size <= MAX_BODY) chunks.push(chunk);
    });
    req.on("end", () => {
      if (size > MAX_BODY) return send(413, { error: "body too large" });
      if (req.method === "GET" && path === "/") return send(200, page, "text/html; charset=utf-8");

      const hash = /^\/api\/extractions\/([0-9a-f]{12})$/.exec(path)?.[1];
      const dir = hash && join("extractions", hash);
      if (req.method === "GET" && dir && existsSync(join(dir, "note.md"))) {
        return send(200, { ...stateOf(dir, running.has(dir)), error: errors.get(dir) ?? null });
      }
      send(404, { error: "not found" });
    });
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      process.stderr.write(`Port ${port} is in use. Pick another with --port <number>.\n`);
    } else {
      process.stderr.write(`Extraction server error: ${err.message}\n`);
    }
    process.exitCode = 1;
  });

  const stop = (): void => {
    for (const child of children) child.kill();
    process.exit();
  };
  process.on("SIGINT", stop).on("SIGTERM", stop);
  server.on("close", () => process.off("SIGINT", stop).off("SIGTERM", stop));

  // Bind to loopback only — notes are patient data and each one starts a model run.
  server.listen(port, "127.0.0.1", () => {
    process.stdout.write(`medprotocol extraction page → http://localhost:${(server.address() as AddressInfo).port}\n`);
    process.stdout.write(`Each note pasted there starts a Claude run (claude -p) — unattended, uses tokens. Ctrl-C to stop.\n`);
  });
  return server;
};

export const run = (argv: string[]): void => {
  const { values } = parseArgs({
    args: argv,
    options: {
      serve: { type: "boolean", default: false },
      port: { type: "string", default: "7332" },
      save: { type: "string" },
      note: { type: "string" },
      items: { type: "string" },
      artifact: { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(USAGE + "\n");
    return;
  }

  if (values.serve) {
    const port = Number(values.port);
    if (values.save || values.note || values.items || values.artifact || values.json) {
      process.stderr.write(formatError("--serve takes no other options but --port") + "\n");
    } else if (!Number.isInteger(port) || port < 0 || port > 65535) {
      process.stderr.write(formatError("--port must be a number from 0 to 65535") + "\n");
    } else {
      serve(port);
      return;
    }
    process.exitCode = 1;
    return;
  }

  if (values.save) {
    if (values.note || values.items || values.artifact) {
      process.stderr.write(formatError("--save takes no other options but --json") + "\n");
      process.exitCode = 1;
      return;
    }
    let raw: Buffer;
    try {
      raw = readFileSync(values.save);
    } catch (e) {
      process.stderr.write(formatError((e as Error).message) + "\n");
      process.exitCode = 1;
      return;
    }
    const { dir, existed } = saveNote(raw);
    // a pasted note staged at extractions/<file> is patient data; don't leave it behind
    if (dirname(resolve(values.save)) === resolve("extractions")) rmSync(values.save);
    printResult({ dir, existed }, values.json!, () => dir + (existed ? "  (already saved)" : ""));
    return;
  }

  if (!values.note || !values.items) {
    process.stderr.write(formatError("--note and --items are required") + "\n\n" + USAGE + "\n");
    process.exitCode = 1;
    return;
  }

  let note: string;
  let items: ExtractedItem[];
  try {
    note = readFileSync(values.note, "utf8");
    items = JSON.parse(readFileSync(values.items, "utf8"));
  } catch (e) {
    process.stderr.write(formatError((e as Error).message) + "\n");
    process.exitCode = 1;
    return;
  }

  const bad = itemsError(items);
  if (bad) {
    process.stderr.write(formatError(bad) + "\n");
    process.exitCode = 1;
    return;
  }

  const checked = checkExtraction(note, items);
  const counts = Object.fromEntries(
    (["quoted", "edited", "approximate", "reordered", "mismatched", "unverified", "none"] as const).map((s) => [s, checked.filter((c) => c.status === s).length]),
  );

  const { inputs, review } = toInputs(checked);

  if (values.artifact) {
    // extractions/<hash>/note.md is named by its folder
    const name = basename(values.note) === "note.md" ? basename(dirname(resolve(values.note))) : basename(values.note, extname(values.note));
    const data = pageData(name, note, checked);
    // \u003c keeps "</script>" in a note from closing the data block
    const html = EXTRACT_ARTIFACT_HTML.replace("__TITLE__", () => `${name.replace(/[<&]/g, "")} extraction`).replace("__DATA__", () => JSON.stringify(data).replace(/</g, "\\u003c"));
    try {
      writeFileSync(values.artifact, html);
    } catch (e) {
      process.stderr.write(formatError((e as Error).message) + "\n");
      process.exitCode = 1;
      return;
    }
  }

  printResult({ items: checked, counts, inputs, review }, values.json!, () =>
    [
      formatHeader("Extraction vs note"),
      formatTable(checked.map((c) => [c.field, `${c.value}${c.unit ? ` ${c.unit}` : ""}  (${c.episode})  [${c.status}${c.distance ? `, ${c.distance} chars off` : ""}${c.ambiguous ? ", ambiguous" : ""}]  "${c.quote}"`])),
      "",
      formatTable(Object.entries(counts).map(([s, n]) => [s, String(n)])),
      ...(Object.keys(inputs).length ? [formatHeader("Inputs for calculators"), formatTable(Object.entries(inputs).map(([k, v]) => [k, `${v!.value}${v!.unit ? ` ${v!.unit}` : ""}`]))] : []),
      ...(review.length ? [formatHeader("Held back"), formatTable(review.map((r) => [r.item.key!, `${r.item.value}  [${r.reason}]`]))] : []),
    ].join("\n"),
  );
};
