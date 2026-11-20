#!/usr/bin/env node
// Medical Protocol Hook: UserPromptSubmit + PreToolUse/PostToolUse (Read/Bash/Grep)
// A clinical note reaches the AI model only after the doctor says it is not real patient data.
// Tool checks run plugin-wide from hooks.json (plugin hooks also run inside the verifier subagent; a plugin
// agent's own frontmatter hooks are ignored) and do nothing unless a note is pending. The prompt check
// looks at every prompt only once an extract skill registered it (--all); before that, only at /extract ones.
// Prompts outside the extract flow are not ours to guard.
// - a prompt that looks like a clinical note, or has an image attached (it can't be looked into), is
//   blocked unless it says "not real data";
// - a saved note is "pending" until the doctor clears it: extractions/<hash>/ has note.md but no .consent.
//   Any Read or Grep that reaches a pending folder (real path, so symlinks and ".." count) is denied and
//   sent to `cat` in Bash: only the Bash permission dialog shows the doctor this hook's question. Any Bash
//   command asks while a note is pending, since a shell command can read it in too many ways to parse; a
//   yes to one naming the folder writes <hash>/.consent and later reads (the verifier, the page) go through;
// - publishing an extraction page with the Artifact tool always asks, wherever the page was copied to.
// shortcut: pasted notes are spotted by vitals/units/ID patterns; @-attached files and images are not seen,
// and a note file the doctor gives is unguarded until `extract --save` copies it into extractions/.
// Widen the patterns if notes slip through.

import * as fs from "fs";
import * as path from "path";

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const out = (o) => process.stdout.write(JSON.stringify(o) + "\n");
const CONSENT = /not real data/i;
const ask = (reason) => out({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: reason } });

const count = (text, re) => (text.match(re) || []).length;
// A labelled ID number (DNI, MRN, record number) is a note on its own. Otherwise three or more of: vitals or
// labs followed by a number, a number followed by a clinical unit, an age, a day/month date.
const looksLikeNote = (text) =>
  /\b(DNI|MRN|NHC|HC|SSN|DOB|record\s*(no|number)|historia\s+cl[ií]nica)\b[\s.:#]*\d/i.test(text) ||
  count(text, /\b(HR|FC|BP|TA|PA|RR|FR|SpO2|SatO2|Sats?|Temp|FiO2|PaO2|PaCO2|pH|HCO3|Na|K|Cl|Cr|BUN|Glu|Hb|GCS|pulse|creatinine|glucose|lactate)\b\s*[:=]?\s*\d/gi) +
    count(text, /\d\s*(mmHg|bpm|lpm|rpm|mg\/dl|mmol\/l|meq\/l|g\/dl|°C|kg)\b|\d\s*%/gi) +
    count(text, /\b\d{1,3}\s*(years?[\s-]old|y\/o|yo|años)\b/gi) +
    count(text, /\b(0?[1-9]|[12]\d|3[01])[\/-](0?[1-9]|1[0-2])([\/-]\d{2,4})?\b/g) >=
  3;

if (input.hook_event_name === "UserPromptSubmit") {
  const prompt = input.prompt || "";
  const extracting = process.argv.includes("--all") || /^\s*\/(medical-protocol:)?extract\b/.test(prompt);
  // an attached image shows in the prompt only as its "[Image #N]" placeholder
  const image = /\[Image #\d+\]/.test(prompt);
  if (extracting && (image || looksLikeNote(prompt)) && !CONSENT.test(prompt))
    out({
      decision: "block",
      reason:
        `This message ${image ? "has an image that could be a clinical note" : "looks like a clinical note"}, so it was NOT sent to the AI model (which runs on external servers). ` +
        'If it is not real patient data (made up or de-identified), send it again with the words "not real data" in it. ' +
        "If it is real, remove names, record numbers, addresses and dates first.",
    });
  process.exit(0);
}

const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const t = input.tool_input || {};

// Publishing uploads the whole note to claude.ai: ask every time, consent to the model doesn't cover it.
if (input.tool_name === "Artifact") {
  // the page can be copied out of extractions/, so also look in the file for the CLI template's data block
  let page = "";
  try {
    page = fs.readFileSync(path.resolve(input.cwd || projectDir, t.file_path || ""), "utf8");
  } catch {}
  if (input.hook_event_name === "PreToolUse" && (/extractions[\/\\]/.test(JSON.stringify(t)) || page.includes('<script type="application/json" id="data">')))
    ask("NOTE CONSENT: this publishes the extraction page, with the full note, to claude.ai. Allow only if it is not real patient data (made up or de-identified).");
  process.exit(0);
}

const cwd = input.cwd || projectDir;
const real = (p) => {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
};
const root = real(path.join(projectDir, "extractions"));
const pending = fs.existsSync(root)
  ? fs
      .readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(root, d.name, "note.md")) && !fs.existsSync(path.join(root, d.name, ".consent")))
      .map((d) => d.name)
  : [];
if (!pending.length) process.exit(0);

const within = (inner, outer) => {
  const r = path.relative(outer, inner);
  return r === "" || (!r.startsWith("..") && !path.isAbsolute(r));
};
const where = (hashes) => hashes.map((h) => `extractions/${h}/`).join(", ");

if (input.tool_name === "Bash") {
  if (input.hook_event_name === "PostToolUse") {
    // only runs if the call was allowed, i.e. the doctor said yes; clears the folders the command names
    for (const h of pending) if ((t.command || "").includes(h)) fs.writeFileSync(path.join(root, h, ".consent"), new Date().toISOString() + "\n");
  } else
    ask(`NOTE CONSENT: a saved note (${where(pending)}) is not cleared yet and this command could send it to the AI model, which runs on external servers. Allow only if that note is not real patient data (made up or de-identified).`);
  process.exit(0);
}

// Read or Grep
const p = real(path.resolve(cwd, (input.tool_name === "Read" ? t.file_path : t.path) || "."));
const touched = pending.filter((h) => within(p, path.join(root, h)) || within(path.join(root, h), p));
if (touched.length && input.hook_event_name === "PreToolUse")
  out({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `NOTE CONSENT: the note in ${where(touched)} is not cleared yet. Read it first with Bash, one folder per command (cat extractions/<hash>/note.md): that shows the doctor the consent question, which this tool's dialog does not.`,
    },
  });
