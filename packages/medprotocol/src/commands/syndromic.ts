import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { CHEST_CAVEAT, CHEST_LABELS, CHEST_PATTERN_LABELS, CHEST_REASONS, assessChestExam } from "../../../../plugin/lib/chest-exam";
import { FOCAL_CAVEAT, FOCAL_DIFFERENTIAL_LABELS, FOCAL_EVIDENCE_LABELS, FOCAL_LABELS, FOCAL_NEXT_LABELS, FOCAL_REASONS, assessFocalPulmonary } from "../../../../plugin/lib/focal-pulmonary";
import { HF_CAVEAT, HF_LABELS, HF_NEXT_LABELS, HF_REASONS, HF_SYNDROME_LABELS, assessHeartFailure } from "../../../../plugin/lib/heart-failure";
import { RF_CAVEAT, RF_DISTRESS_LABELS, RF_FAILURE_LABELS, RF_FAILURE_REASONS, RF_NEXT_LABELS, RF_SIGN_LABELS, assessRespiratoryFailure } from "../../../../plugin/lib/respiratory-failure";
import { SHOCK_CAVEAT, SHOCK_LABELS, SHOCK_REASONS, classifyShock } from "../../../../plugin/lib/shock";
import { VOLUME_CAVEAT, VOLUME_LABELS, VOLUME_REASONS, assessVolume } from "../../../../plugin/lib/volume";
import { claudeCommand, killClaude } from "../claude-spawn";
import { fail, parseFlags } from "../cli";
import { SYNDROMIC_PAGE_HTML } from "../syndromic-page";
import { ASSESSMENTS, generateWholePatient, patientCode, resultOptions, type Id, type Results, type WholePatient } from "../syndromic-patient";
import { isLocalOrigin } from "./overlay";

const USAGE = `Usage: medprotocol syndromic --serve [--port <number>]

Synthetic patients for the six bedside rules (shock, volume, heart failure, chest, focal pulmonary,
respiratory failure), on a local page: generate one at random or with the results you choose, read the
note the model drafts for it, then check what each rule says.

Options:
  --serve           Start the local page server
  --port <number>   Port (default 7333)

Every patient is synthetic. Each note is one Claude run (claude -p, no tools), which uses tokens.`;

/** One rule's result, every word from the lib. */
export interface Card {
  id: Id;
  title: string;
  result: string;
  tone: "found" | "clear" | "open";
  why?: string;
  agrees?: string;
  next: string[];
  caveat: string;
  /** The findings the rule was given, as label and value. */
  findings: [string, string][];
}

// "capillaryRefill" → "Capillary refill", "normal_or_low" → "normal or low"
const words = (s: string) => s.replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/_/g, " ").toLowerCase();
const ACRONYMS: Record<string, string> = { jvp: "JVP", ph: "pH", po2: "PO2", pco2: "PCO2", hco3: "HCO3", "cm h2o": "cmH2O", s3: "S3", "temperature c": "temperature (°C)", "days": "(days)" };
const label = (s: string) => words(s).replace(/\b(jvp|ph|po2|pco2|hco3|cm h2o|s3|temperature c|days)\b/g, (m) => ACRONYMS[m]).replace(/^./, (c) => c.toUpperCase());
const spoken = (names: readonly string[]) => names.map(words).join(", ");

const rows = (f: object, prefix = ""): [string, string][] =>
  Object.entries(f).flatMap(([k, v]): [string, string][] => {
    if (v === undefined || v === "") return [];
    if (Array.isArray(v)) return v.map((x, i) => [`${label(prefix + k)} ${i + 1}`, Object.values(x).map(String).map(words).join(", ")]);
    if (typeof v === "object") return rows(v, `${prefix}${k} `);
    return [[label(prefix + k), words(String(v))]];
  });

/** What each of the six rules says for these findings, in the workflow's order. */
export const assess = (f: WholePatient["findings"]): Card[] => {
  const card = (id: Id, c: Omit<Card, "id" | "title" | "findings">): Card => ({ id, title: ASSESSMENTS.find((a) => a.id === id)!.title, ...c, findings: rows(f[id]) });

  const shock = classifyShock(f.shock);
  const volume = assessVolume(f.volume);
  const hf = assessHeartFailure(f["heart-failure"]);
  const chest = assessChestExam(f["chest-exam"]);
  const focal = assessFocalPulmonary(f["focal-pulmonary"]);
  const rf = assessRespiratoryFailure(f["respiratory-failure"]);
  const sides = (["right", "left"] as const).map((s) => [s === "right" ? "Right" : "Left", chest[s]] as const);

  return [
    card("shock", shock
      ? { result: SHOCK_LABELS[shock.category], tone: shock.reason ? "open" : "found", ...(shock.reason ? { why: SHOCK_REASONS[shock.reason] + "." } : {}), agrees: spoken(shock.supporting), next: [], caveat: SHOCK_CAVEAT }
      : { result: "Check the systolic, the duration and the measured JVP", tone: "open", next: [], caveat: SHOCK_CAVEAT }),
    card("volume", volume
      ? { result: VOLUME_LABELS[volume.status], tone: ({ overload: "found", no_overload: "clear", indeterminate: "open" } as const)[volume.status], ...(volume.reason ? { why: VOLUME_REASONS[volume.reason] + "." } : {}), next: volume.pivotal.length ? [`Would settle it: ${spoken(volume.pivotal)}`] : [], caveat: VOLUME_CAVEAT }
      : { result: "Indeterminate", tone: "open", next: [], caveat: VOLUME_CAVEAT }),
    card("heart-failure", {
      result: HF_LABELS[hf.verdict], tone: hf.verdict === "indeterminate" ? "open" : hf.verdict === "no_congestion" ? "clear" : "found",
      why: [hf.reason ? HF_REASONS[hf.reason] : HF_SYNDROME_LABELS[hf.syndrome], ...hf.notCalculated].join(". ") + ".",
      agrees: [hf.leftSigns.length && `left: ${spoken(hf.leftSigns)}`, hf.rightSigns.length && `right: ${spoken(hf.rightSigns)}`].filter(Boolean).join("; "),
      next: hf.next.map((n) => HF_NEXT_LABELS[n]), caveat: HF_CAVEAT,
    }),
    card("chest-exam", {
      result: sides.map(([s, a]) => `${s}: ${CHEST_LABELS[a.verdict]}`).join(" · "),
      tone: sides.some(([, a]) => a.verdict !== "no_syndrome" && a.verdict !== "indeterminate") || chest.patterns.length ? "found" : sides.some(([, a]) => a.verdict === "indeterminate") ? "open" : "clear",
      why: sides.filter(([, a]) => a.reason).map(([s, a]) => `${s}: ${CHEST_REASONS[a.reason!]}.`).join(" ") || undefined,
      agrees: chest.patterns.map((p) => CHEST_PATTERN_LABELS[p]).join("; "),
      next: [], caveat: CHEST_CAVEAT,
    }),
    card("focal-pulmonary", {
      result: FOCAL_LABELS[focal.verdict], tone: ({ supported: "found", unsupported: "clear", indeterminate: "open" } as const)[focal.verdict],
      why: FOCAL_REASONS[focal.reason] + ".",
      agrees: [`pneumonia evidence: ${FOCAL_EVIDENCE_LABELS[focal.pneumoniaEvidence]}`, focal.differential.length && `differential: ${focal.differential.map((d) => FOCAL_DIFFERENTIAL_LABELS[d]).join(", ")}`].filter(Boolean).join("; "),
      next: focal.next.map((n) => FOCAL_NEXT_LABELS[n]), caveat: FOCAL_CAVEAT,
    }),
    card("respiratory-failure", {
      result: `${RF_FAILURE_LABELS[rf.failure]} · ${RF_DISTRESS_LABELS[rf.distress]}`,
      tone: rf.failure === "present" || rf.distress === "present" ? "found" : rf.failure === "absent" && rf.distress === "absent" ? "clear" : "open",
      why: [RF_FAILURE_REASONS[rf.failureReason], ...rf.notCalculated].join(". ") + ".",
      agrees: [rf.distressSigns.map((d) => RF_SIGN_LABELS[d]).join(", "), rf.arterialGas?.disorder && `gas: ${rf.arterialGas.disorder}`].filter(Boolean).join("; "),
      next: rf.next.map((n) => RF_NEXT_LABELS[n]), caveat: RF_CAVEAT,
    }),
  ].map((c) => (c.agrees ? c : (({ agrees, ...rest }) => rest)(c)) as Card);
};

/** Each assessment's choices for the page's selects, given what is already set. */
export const optionsFor = (want: Partial<Results>) => Object.fromEntries(ASSESSMENTS.map((a) => [a.id, resultOptions(want, a.id)]));

/** `want` as the page sent it, or an error: known assessments only, each set to a result the selects offer. */
export const readWant = (body: unknown): Partial<Results> | string => {
  if (body === undefined || body === null) return {};
  if (typeof body !== "object" || Array.isArray(body)) return "want must be an object";
  const want: Partial<Results> = {};
  for (const [id, r] of Object.entries(body)) {
    if (!ASSESSMENTS.some((a) => a.id === id)) return `unknown assessment: ${id}`;
    if (r === undefined || r === null || r === "") continue;
    if (typeof r !== "string") return `${id} must be a string`;
    want[id as Id] = r;
  }
  for (const id of Object.keys(want) as Id[]) if (!resultOptions(want, id).includes(want[id]!)) return `${id}: "${want[id]}" does not fit with the other results`;
  return want;
};

// --- the note -------------------------------------------------------------------------------------------

export type NoteStyle = "ed" | "outpatient";
export type AskModel = (system: string, prompt: string) => Promise<string>;

export const FIRST_LINE = "SYNTHETIC NOTE — invented for learning, not real data.";

const RULES = `The findings you are given are the patient's symptoms and examination. Rules:
- Every given finding appears once: symptoms (breathlessness, leg swelling, cough, sputum, reported fever, pleuritic pain, how long symptoms lasted) in the history (HPI or History), signs and measurements in the examination (O/E or Examination). Same meaning, and the same meaning. Each number is written exactly as given, with its unit (for example 93 min, not ~90 min; 4 cmH2O, not 4 cm).
- A finding that is missing or not_assessed is simply not mentioned.
- The findings are grouped by assessment. They are one patient: a finding repeated in several groups (the systolic, the JVP, crackles, the chest signs, SpO2) is one finding, written once. Imaging rows are reports to state in the note.
- Field meanings: durationMinutes is how long the systolic has been that low (e.g. "SBP 80 mmHg, hypotensive for 93 min"), not how long symptoms lasted; symptomDurationDays is how long symptoms lasted; jvpCmH2O and jvpHeightCm are a measured JVP; imaging rows are reports of current or past imaging (timing historical = an old report).
- You may invent only context no bedside rule reads: age and sex (e.g. "72M"), the presenting complaint and its timing, past history, medications, social history. Keep them plausible for these findings and never let them add or contradict an examination finding.
- Never add an examination finding, mental state or consciousness (drowsy, confused, GCS, alert), vital sign, saturation, temperature, lab, imaging, ECG, impression, differential, diagnosis, syndrome name or plan.
- No name, date, place, hospital, ward bed or record number.`;

export const SYSTEM: Record<NoteStyle, string> = {
  ed: `You write EHR entries for synthetic teaching patients, the way a busy emergency doctor types them. Reply with the entry only, plain text, no markdown.

First line, exactly: ${FIRST_LINE}
Then the entry:
- A header line: setting, who is writing and a time of day, e.g. "ED — Medical SHO review, 02:40" or "Ward 7 — FY1 review, 14:15".
- "PC:" one line, then "HPI:" two to four lines, then "PMH:", "DHx:" (meds) and "SH:" as short lines, then "O/E:" with the examination.
- Write as doctors do: abbreviations (SOB, CRT, JVP, HS I+II+0, bibasal creps, PEA, ↓, ↑, R/L), fragments instead of sentences, the examination grouped by system (General, CVS, Resp, Abdo, Peripheries).

${RULES}`,
  outpatient: `You write outpatient consultation notes for synthetic teaching patients, the way a consultant writes them up after a clinic appointment. Reply with the note only, plain text, no markdown.

First line, exactly: ${FIRST_LINE}
Then the note:
- A header line: clinic and who saw the patient, e.g. "Cardiology outpatient clinic — Consultant review" (no date).
- Short headed sections in full sentences and paragraphs: "History", "Past medical history", "Medications", "Social history", "Examination". Few abbreviations, spelled out on first use. Read like a written record, not a list.
- If the findings could not be seen in a clinic (on non-invasive ventilation, hypotensive for an hour), write it as a medical day unit or ward review in the same written style.

${RULES}`,
};

// every number the generator drew must reach the note unchanged
const numbersOf = (findings: object): string[] => JSON.stringify(findings).match(/"-?\d+(\.\d+)?"/g)?.map((n) => n.slice(1, -1)) ?? [];
export const keepsNumbers = (note: string, findings: object) =>
  numbersOf(findings).every((n) => new RegExp(`(^|[^\\d.])${n.replace(".", "\\.")}(?![\\d])`).test(note));

/** A note for the patient, or null when the model twice dropped a number or the first line. */
export const draftNote = async (findings: object, style: NoteStyle, askModel: AskModel): Promise<string | null> => {
  const prompt = `Patient: all six assessments\nFindings (JSON):\n${JSON.stringify(findings)}`;
  // shortcut: one retry when the model drops or rounds a number; raise if notes keep failing
  for (let attempt = 0; attempt < 2; attempt++) {
    const note = (await askModel(SYSTEM[style], prompt)).trim();
    if (note.startsWith(FIRST_LINE) && keepsNumbers(note, findings)) return note;
  }
  return null;
};

/** Model runs going now; killed when the server is stopped. */
const children = new Set<ChildProcess>();

/** One `claude -p` run on Haiku with every tool off; resolves with the reply text. */
const askClaude: AskModel = (system, prompt) =>
  new Promise((done, reject) => {
    const cmd = claudeCommand(["-p", "--model", "haiku", "--output-format", "json", "--tools", "", "--no-session-persistence", "--system-prompt", system]);
    const child = spawn(cmd.command, cmd.args, { shell: cmd.shell });
    children.add(child);
    let out = "";
    const timer = setTimeout(() => killClaude(child), 90_000);
    child.stdout.on("data", (d) => (out += d));
    child.on("error", (e: NodeJS.ErrnoException) => reject(new Error(e.code === "ENOENT" ? "The 'claude' command was not found" : e.message)));
    child.on("close", (code) => {
      clearTimeout(timer);
      children.delete(child);
      try {
        const reply = JSON.parse(out);
        if (code !== 0 || reply.is_error || typeof reply.result !== "string") return reject(new Error(`claude failed: ${reply.result ?? `exit code ${code}`}`));
        done(reply.result);
      } catch {
        reject(new Error(`claude exited with code ${code}`));
      }
    });
    child.stdin.on("error", () => {});
    child.stdin.end(prompt);
  });

// --- the server -----------------------------------------------------------------------------------------

const MAX_BODY = 20_000;

/** The local synthetic-patients page server. Returns the server so tests can read its port and close it. */
export const serve = (port: number, askModel: AskModel = askClaude): Server => {
  const server = createServer((req, res) => {
    const send = (status: number, body: unknown, type = "application/json"): void => {
      res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
      res.end(typeof body === "string" ? body : JSON.stringify(body));
    };
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    const at = req.socket.localPort;
    // a website can point its own domain name at 127.0.0.1; the Host header gives it away
    if (req.headers.host !== `localhost:${at}` && req.headers.host !== `127.0.0.1:${at}`) return send(403, { error: "forbidden" });
    // each note is a model run: only this computer's pages may ask
    if (path.startsWith("/api") && !isLocalOrigin(req.headers.origin)) return send(403, { error: "forbidden" });

    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size <= MAX_BODY) chunks.push(chunk);
    });
    req.on("end", () => {
      if (size > MAX_BODY) return send(413, { error: "body too large" });
      if (req.method === "GET" && path === "/") return send(200, SYNDROMIC_PAGE_HTML, "text/html; charset=utf-8");
      if (req.method !== "POST" || !["/api/options", "/api/patients", "/api/notes"].includes(path)) return send(404, { error: "not found" });

      let body: any;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      } catch {
        return send(400, { error: "the body must be JSON" });
      }

      if (path === "/api/notes") {
        if (body?.style !== "ed" && body?.style !== "outpatient") return send(400, { error: 'style must be "ed" or "outpatient"' });
        if (!body.findings || typeof body.findings !== "object" || Array.isArray(body.findings)) return send(400, { error: "findings must be an object" });
        draftNote(body.findings, body.style, askModel)
          .then((note) => (note ? send(200, { note }) : send(502, { error: "The model did not return a usable note. Try again." })))
          .catch((e: Error) => send(502, { error: e.message }));
        return;
      }

      const want = readWant(body?.want);
      if (typeof want === "string") return send(400, { error: want });
      if (path === "/api/options") return send(200, { assessments: ASSESSMENTS, options: optionsFor(want) });

      const patient = generateWholePatient(want);
      const code = patientCode();
      process.stdout.write(`Synthetic patient ${code} · ${patient.story}\n`);
      send(200, { code, ...patient, cards: assess(patient.findings) });
    });
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    process.stderr.write(err.code === "EADDRINUSE" ? `Port ${port} is in use. Pick another with --port <number>.\n` : `Synthetic patients server error: ${err.message}\n`);
    process.exitCode = 1;
  });

  const stop = (): void => {
    for (const child of children) killClaude(child);
    process.exit();
  };
  process.on("SIGINT", stop).on("SIGTERM", stop);
  server.on("close", () => process.off("SIGINT", stop).off("SIGTERM", stop));

  // loopback only: each note starts a model run
  server.listen(port, "127.0.0.1", () => {
    process.stdout.write(`medprotocol synthetic patients page → http://localhost:${(server.address() as AddressInfo).port}\n`);
    process.stdout.write(`Each note drafted there starts a Claude run (claude -p, Haiku) — uses tokens. Ctrl-C to stop.\n`);
  });
  return server;
};

export const run = (argv: string[]): void => {
  const values = parseFlags(argv, { serve: { type: "boolean", default: false }, port: { type: "string", default: "7333" } }, USAGE);
  if (!values) return;
  if (!values.serve) return fail("--serve is required", USAGE);
  if (values.json) return fail("--serve takes no other options but --port");
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 0 || port > 65535) return fail("--port must be a number from 0 to 65535");
  serve(port);
};
