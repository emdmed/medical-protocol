#!/usr/bin/env node
// Medical Protocol Hook: UserPromptSubmit + PreToolUse/PostToolUse (Read/Bash/Grep)
// A clinical note reaches the AI model only after the doctor says it is not real patient data.
// Tool checks run plugin-wide from hooks.json (plugin hooks also run inside the verifier subagent; a plugin
// agent's own frontmatter hooks are ignored) and do nothing unless a note is pending. The prompt check
// looks at every prompt only once an extract skill registered it (--all); before that, only at /extract ones.
// - a prompt that looks like a clinical note is blocked unless it says "not real data";
// - a saved note is "pending" until the doctor clears it: extractions/<hash>/ has note.md but no .consent.
//   Any Read or Grep that reaches a pending folder (real path, so symlinks and ".." count) asks; a yes
//   writes <hash>/.consent and later reads (the verifier, the page) go through. Any Bash command asks
//   while a note is pending, since a shell command can read it in too many ways to parse;
// - publishing an extraction page with the Artifact tool always asks.
// shortcut: pasted notes are spotted by vitals/units patterns, and a note file the doctor gives is
// unguarded until `extract --save` copies it into extractions/. Widen the patterns if notes slip through.

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

// Vitals or labs followed by a number, or a number followed by a clinical unit. Three or more → a note.
const looksLikeNote = (text) =>
  (text.match(/\b(HR|FC|BP|TA|PA|RR|FR|SpO2|SatO2|Sat|Temp|FiO2|PaO2|PaCO2|pH|HCO3|Na|K|Cl|Cr|BUN|Glu|Hb|GCS)\b\s*[:=]?\s*\d/gi) || []).length +
    (text.match(/\d\s*(mmHg|bpm|lpm|rpm|mg\/dl|mmol\/l|meq\/l|g\/dl|°C|kg)\b/gi) || []).length >=
  3;

if (input.hook_event_name === "UserPromptSubmit") {
  const prompt = input.prompt || "";
  const extracting = process.argv.includes("--all") || /^\s*\/(medical-protocol:)?extract\b/.test(prompt);
  if (extracting && looksLikeNote(prompt) && !CONSENT.test(prompt))
    out({
      decision: "block",
      reason:
        'This message looks like a clinical note, so it was NOT sent to the AI model (which runs on external servers). ' +
        'If it is not real patient data (made up or de-identified), send it again with the words "not real data" in it. ' +
        "If it is real, remove names, record numbers, addresses and dates first.",
    });
  process.exit(0);
}

const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const t = input.tool_input || {};

// Publishing uploads the whole note to claude.ai: ask every time, consent to the model doesn't cover it.
if (input.tool_name === "Artifact") {
  if (input.hook_event_name === "PreToolUse" && /extractions[\/\\]/.test(JSON.stringify(t)))
    out({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: "NOTE CONSENT: this publishes the extraction page, with the full note, to claude.ai. Allow only if it is not real patient data (made up or de-identified).",
      },
    });
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
let touched = [];
let clears = []; // folders a yes to this call clears
if (input.tool_name === "Read" || input.tool_name === "Grep") {
  const p = real(path.resolve(cwd, (input.tool_name === "Read" ? t.file_path : t.path) || "."));
  touched = pending.filter((h) => within(p, path.join(root, h)) || within(path.join(root, h), p));
  clears = touched;
} else if (input.tool_name === "Bash") {
  touched = pending;
  clears = pending.filter((h) => (t.command || "").includes(h));
}
if (!touched.length) process.exit(0);

if (input.hook_event_name === "PostToolUse") {
  // only runs if the call was allowed, i.e. the doctor said yes
  for (const h of clears) fs.writeFileSync(path.join(root, h, ".consent"), new Date().toISOString() + "\n");
  process.exit(0);
}

const where = touched.map((h) => `extractions/${h}/`).join(", ");
out({
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason:
      input.tool_name === "Bash"
        ? `NOTE CONSENT: a saved note (${where}) is not cleared yet and this command could send it to the AI model, which runs on external servers. Allow only if that note is not real patient data (made up or de-identified).`
        : `NOTE CONSENT: this sends the note in ${where} to the AI model, which runs on external servers. Allow only if it is not real patient data (made up or de-identified).`,
  },
});
