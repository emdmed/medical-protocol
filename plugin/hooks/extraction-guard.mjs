#!/usr/bin/env node
// Medical Protocol Hook: PreToolUse (Write/Edit/MultiEdit)
// Keeps the first extraction pass and its note immutable: extractions/<hash>/note.md is only ever written
// by `medprotocol extract --save` (so the folder is the note's real hash), and once
// extractions/<hash>/extraction.json exists, writes to it are denied. Corrections go to corrected.json.
// shortcut: Bash writes (cp, >, sed -i) are not checked; add them if agents start bypassing Write/Edit.

import * as fs from "fs";
import * as path from "path";

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const file = path.resolve(projectDir, (input.tool_input && input.tool_input.file_path) || "");
// Only <project>/extractions/<hash>/, not data/extractions/.
const inFolder = path.dirname(path.dirname(file)) === path.resolve(projectDir, "extractions");
const name = path.basename(file);
// .consent is written only by the note-consent hook or the `extract --serve` server, after the doctor said yes
if (!inFolder || !(name === "note.md" || name === ".consent" || (name === "extraction.json" && fs.existsSync(file)))) process.exit(0);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `EXTRACTION GUARD: ${file} is the original note or the first extraction pass and is never changed. Notes are saved only with \`medprotocol extract --save\`; write corrections to corrected.json in the same folder instead.`,
    },
  }) + "\n",
);
