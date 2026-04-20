#!/bin/bash
# Medical Protocol Hook: PostToolUse (Bash)
# Tracks workflow state for the QA reminder hook.
# Sets marker files when:
#   - QA-related actions are detected (.qa_started)
#   - Dev server is started (.dev_server_up)
#
# Plugin version: the .workflow_active marker is set explicitly by each skill
# in Phase 2, not by CDN URL detection.

set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
STATE_DIR="$PROJECT_DIR/.claude/hooks-state"

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null) || TOOL_NAME=""

# ─── Track Bash commands ───
if [ "$TOOL_NAME" = "Bash" ]; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null) || COMMAND=""
  CMD_LOWER=$(echo "$COMMAND" | tr '[:upper:]' '[:lower:]')

  # Only track if a workflow is active
  if [ ! -f "$STATE_DIR/.workflow_active" ] 2>/dev/null; then
    exit 0
  fi

  # QA indicators: tweakcn fetch, shadcn add, tsc check, eslint
  if echo "$CMD_LOWER" | grep -qE '(tweakcn|gh api.*jnsahaj|npx shadcn|npx tsc --noemit|eslint|prettier)'; then
    mkdir -p "$STATE_DIR"
    touch "$STATE_DIR/.qa_started"
  fi

  # Dev server started
  if echo "$CMD_LOWER" | grep -qE 'npm run dev|npx next dev|yarn dev|pnpm dev'; then
    mkdir -p "$STATE_DIR"
    touch "$STATE_DIR/.dev_server_up"
  fi
  exit 0
fi

exit 0
