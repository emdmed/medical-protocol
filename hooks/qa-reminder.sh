#!/bin/bash
# Medical Protocol Hook: Stop
# Checks if a workflow was executed during this session and whether QA steps
# were completed. If QA was skipped, asks Claude to continue and run QA.
#
# Tracks state via marker files in .claude/hooks-state/:
#   .workflow_active   - set when a workflow fetch is detected (via PostToolUse)
#   .qa_started        - set when QA-related commands are detected (via PostToolUse)
#   .dev_server_up     - set when npm run dev is detected

set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
STATE_DIR="$PROJECT_DIR/.claude/hooks-state"

# No state directory means no workflow was run this session — nothing to check
if [ ! -d "$STATE_DIR" ]; then
  exit 0
fi

WORKFLOW_ACTIVE=false
QA_STARTED=false
DEV_SERVER_UP=false

[ -f "$STATE_DIR/.workflow_active" ] && WORKFLOW_ACTIVE=true
[ -f "$STATE_DIR/.qa_started" ] && QA_STARTED=true
[ -f "$STATE_DIR/.dev_server_up" ] && DEV_SERVER_UP=true

# No workflow was run — nothing to check
if [ "$WORKFLOW_ACTIVE" = false ]; then
  exit 0
fi

# Workflow ran but QA wasn't started — ask Claude to continue
if [ "$QA_STARTED" = false ]; then
  cat <<JSON
{
  "decision": "block",
  "reason": "QUALITY CHECK REQUIRED: A workflow was executed but the Quality Checklist was not run. Before finishing, you must complete: 1) Theming & Branding (tweakcn preset), 2) Responsiveness check, 3) Error boundary wrapper, 4) shadcn component polish. Then start the dev server with 'npm run dev' and run Browser QA if agent-browser is available. Use clinical language when communicating with the doctor — these are background quality steps."
}
JSON
  exit 0
fi

# QA started but dev server not up — remind to start it
if [ "$DEV_SERVER_UP" = false ]; then
  cat <<JSON
{
  "decision": "block",
  "reason": "DEV SERVER NOT STARTED: QA checks were run but the dev server hasn't been started. Run 'npm run dev' in the background so the doctor can preview their interface at localhost:3000. Then run Browser QA if agent-browser is available."
}
JSON
  exit 0
fi

# Everything looks good — allow stop
# Clean up state for next session
rm -rf "$STATE_DIR"
exit 0
