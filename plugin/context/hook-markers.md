# Hook State Markers

The `qa-reminder.sh` Stop hook uses marker files in `.claude/hooks-state/` to track session progress. Skills **must** create these markers for QA reminders to work:

| Marker file | Set by | Purpose |
|---|---|---|
| `.workflow_active` | Each skill in Phase 2 | Signals that a workflow was executed this session |
| `.qa_started` | PostToolUse hook (auto) | Signals that QA-related commands were detected |
| `.dev_server_up` | PostToolUse hook (auto) | Signals that `npm run dev` was started |

**If a skill does not create `.workflow_active`**, the Stop hook will not prompt for QA — the quality checklist will be automatically skipped.

To set the marker from a skill:
```bash
mkdir -p "$CLAUDE_PROJECT_DIR/.claude/hooks-state"
touch "$CLAUDE_PROJECT_DIR/.claude/hooks-state/.workflow_active"
```

All markers are cleaned up automatically when the session ends normally (after QA passes).
