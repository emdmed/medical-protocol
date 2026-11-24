#!/usr/bin/env node
// Medical Protocol Hook: PostToolUse (Bash, PowerShell)
// Tracks workflow state for the QA reminder hook.
// Sets marker files when:
//   - QA-related actions are detected (.qa_started)
//   - Dev server is started (.dev_server_up)
//
// Cross-platform: pure Node (no bash/jq), runs identically on Windows, macOS, Linux.
// Plugin version: the .workflow_active marker is set explicitly by each skill
// in Phase 2, not by URL detection.

import * as fs from "fs";
import * as path from "path";

const projectDir = process.env.CLAUDE_PROJECT_DIR || ".";
const stateDir = path.join(projectDir, ".claude", "hooks-state");

let input = {};
try {
  input = JSON.parse((process.stdin.isTTY ? "" : fs.readFileSync(0, "utf8")) || "{}");
} catch {
  input = {};
}

const toolName = input.tool_name || "";

// ─── Track shell commands ───
if (/^(Bash|PowerShell)$/.test(toolName)) {
  const command = (input.tool_input && input.tool_input.command) || "";
  const cmd = command.toLowerCase();

  // Only track if a workflow is active
  if (!fs.existsSync(path.join(stateDir, ".workflow_active"))) {
    process.exit(0);
  }

  // QA indicators: tsc check, CLI comparison (not overlay drains), eslint, prettier
  if (/(npx tsc --noemit|medprotocol\.cjs"? (?!overlay)|eslint|prettier)/.test(cmd)) {
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(path.join(stateDir, ".qa_started"), "");
  }

  // Dev server started
  if (/npm run dev|npx next dev|yarn dev|pnpm dev/.test(cmd)) {
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(path.join(stateDir, ".dev_server_up"), "");
  }
}

process.exit(0);
