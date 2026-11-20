#!/usr/bin/env node
// Medical Protocol Hook: UserPromptSubmit + PreToolUse/PostToolUse (Read/Bash/Grep)
// A clinical note reaches the AI model only after the doctor says it is not real patient data.
// Registered by the extract skills' frontmatter (with --all), so it runs once extraction starts; hooks.json
// adds only the prompt check without --all, for a note pasted into the /extract message itself.
// - a prompt that looks like a clinical note is blocked unless it says "not real data";
// - the first read of extractions/<hash>/note.md asks the doctor; after a yes, <hash>/.consent
//   is written and later reads (the verifier, the page) go through;
// - publishing an extraction page with the Artifact tool always asks.
// shortcut: notes are spotted by vitals/units patterns and paths by name; a note in another file, or a
// Grep over the whole extractions/ folder, is not caught. Widen the patterns if notes slip through.

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

const target = [t.file_path, t.path, t.command].filter(Boolean).join(" ");
const m = target.match(/extractions[\/\\]([^\/\\\s"']+)[\/\\]note\.md/);
if (!m) process.exit(0);
const consent = path.join(projectDir, "extractions", m[1], ".consent");

if (input.hook_event_name === "PostToolUse") {
  // only runs if the read was allowed, i.e. the doctor said yes
  if (fs.existsSync(path.dirname(consent))) fs.writeFileSync(consent, new Date().toISOString() + "\n");
  process.exit(0);
}

if (!fs.existsSync(consent))
  out({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: `NOTE CONSENT: this sends the note in extractions/${m[1]}/ to the AI model, which runs on external servers. Allow only if it is not real patient data (made up or de-identified).`,
    },
  });
