#!/usr/bin/env node
// Medical Protocol Hook: PreToolUse (Write/Edit/MultiEdit)
// Keeps the first extraction pass and its note immutable: once extractions/<hash>/note.md or
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
const guarded = path.dirname(path.dirname(file)) === path.resolve(projectDir, "extractions") && ["note.md", "extraction.json"].includes(path.basename(file));
if (!guarded || !fs.existsSync(file)) process.exit(0);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `EXTRACTION GUARD: ${file} is the original note or the first extraction pass and is never changed. Write corrections to corrected.json in the same folder instead.`,
    },
  }) + "\n",
);
