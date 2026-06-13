#!/usr/bin/env node
// Medical Protocol Hook: PostToolUse (Bash)
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

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    if (process.stdin.isTTY) resolve("");
  });
}

async function main() {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || ".";
  const stateDir = path.join(projectDir, ".claude", "hooks-state");

  let input = {};
  try {
    input = JSON.parse((await readStdin()) || "{}");
  } catch {
    input = {};
  }

  const toolName = input.tool_name || "";

  // ─── Track Bash commands ───
  if (toolName === "Bash") {
    const command = (input.tool_input && input.tool_input.command) || "";
    const cmd = command.toLowerCase();

    // Only track if a workflow is active
    if (!fs.existsSync(path.join(stateDir, ".workflow_active"))) {
      process.exit(0);
    }

    // QA indicators: tweakcn fetch, shadcn add, tsc check, eslint
    if (/(tweakcn|gh api.*jnsahaj|npx shadcn|npx tsc --noemit|eslint|prettier)/.test(cmd)) {
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
}

main();
