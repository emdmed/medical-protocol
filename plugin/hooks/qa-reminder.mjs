#!/usr/bin/env node
// Medical Protocol Hook: Stop
// Checks if a workflow was executed during this session and whether QA steps
// were completed. If QA was skipped, asks Claude to continue and run QA.
//
// Cross-platform: pure Node (no bash), runs identically on Windows, macOS, Linux.
// Tracks state via marker files in .claude/hooks-state/:
//   .workflow_active   - set by each skill in Phase 2
//   .qa_started        - set when QA-related commands are detected (via PostToolUse)
//   .dev_server_up     - set when npm run dev is detected

import * as fs from "fs";
import * as path from "path";

function block(reason) {
  process.stdout.write(JSON.stringify({ decision: "block", reason }, null, 2) + "\n");
  process.exit(0);
}

const projectDir = process.env.CLAUDE_PROJECT_DIR || ".";
const stateDir = path.join(projectDir, ".claude", "hooks-state");

// No state directory means no workflow was run this session — nothing to check
if (!fs.existsSync(stateDir)) process.exit(0);

const workflowActive = fs.existsSync(path.join(stateDir, ".workflow_active"));
const qaStarted = fs.existsSync(path.join(stateDir, ".qa_started"));
const devServerUp = fs.existsSync(path.join(stateDir, ".dev_server_up"));

// No workflow was run — nothing to check
if (!workflowActive) process.exit(0);

// Workflow ran but QA wasn't started — ask Claude to continue
if (!qaStarted) {
  block(
    "QUALITY CHECK REQUIRED: A workflow was executed but the Quality Checklist was not run. Before finishing, you must complete: 1) Theming & Branding (tweakcn preset), 2) Responsiveness check, 3) Error boundary wrapper, 4) shadcn component polish. Then start the dev server with 'npm run dev' and run Browser QA if agent-browser is available. Use clinical language when communicating with the doctor — these are background quality steps.",
  );
}

// QA started but dev server not up — remind to start it
if (!devServerUp) {
  block(
    "DEV SERVER NOT STARTED: QA checks were run but the dev server hasn't been started. Run 'npm run dev' in the background so the doctor can preview their interface at localhost:3000. Then run Browser QA if agent-browser is available.",
  );
}

// Everything looks good — allow stop. Clean up state for next session.
fs.rmSync(stateDir, { recursive: true, force: true });
process.exit(0);
