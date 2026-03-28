#!/bin/bash
# Medical Protocol Hook: PreToolUse (Bash)
# Enforces patient data privacy by blocking commands that could exfiltrate data.
# Allows safe operations: npm install/dev, curl GET from CDN, git add/commit, tsc.
# Blocks: git push, curl POST, scp, nc, npm publish, and other outbound data commands.
#
# Plugin version: no CLAUDE.md activation guard — plugin enabled = hooks active.

set -uo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null) || TOOL_NAME=""

# Only guard Bash commands
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null) || COMMAND=""

# Normalize: collapse whitespace, lowercase for matching
CMD_LOWER=$(echo "$COMMAND" | tr '[:upper:]' '[:lower:]' | tr -s '[:space:]' ' ')

deny() {
  local reason="$1"
  cat <<JSON
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "PRIVACY GUARD: $reason All patient data must stay on this machine. If the doctor explicitly requested this action, ask them to confirm they understand the privacy implications."
  }
}
JSON
  exit 0
}

# ─── Block: git push (any form) ───
if echo "$CMD_LOWER" | grep -qE '\bgit\s+push\b'; then
  deny "Blocked 'git push'. The project may contain patient data or references to local patient records."
fi

# ─── Block: npm/yarn/pnpm publish ───
if echo "$CMD_LOWER" | grep -qE '\b(npm|yarn|pnpm)\s+publish\b'; then
  deny "Blocked 'publish'. Publishing could expose patient data or clinical configurations."
fi

# ─── Block: outbound data transfer commands ───
# scp, rsync (to remote), nc/ncat/netcat, sftp, ftp
if echo "$CMD_LOWER" | grep -qE '\b(scp|sftp|ftp)\s'; then
  deny "Blocked file transfer command. Patient data must not be sent to external systems."
fi
if echo "$CMD_LOWER" | grep -qE '\b(nc|ncat|netcat)\s'; then
  deny "Blocked netcat. Raw network connections could leak patient data."
fi
if echo "$CMD_LOWER" | grep -qE '\brsync\s.*:'; then
  deny "Blocked rsync to remote. Patient data must not be synced to external systems."
fi

# ─── Block: curl/wget/httpie with data-sending methods ───
# Block POST, PUT, PATCH, DELETE (data-sending HTTP methods)
# Allow GET requests (fetching components from CDN is fine)
if echo "$CMD_LOWER" | grep -qE '\bcurl\b'; then
  # Block explicit data-sending flags
  if echo "$CMD_LOWER" | grep -qE '(\s|^)(-X\s*(POST|PUT|PATCH|DELETE)|--request\s*(POST|PUT|PATCH|DELETE)|-d\s|--data|--data-raw|--data-binary|--data-urlencode|-F\s|--form|--upload-file)'; then
    deny "Blocked curl with outbound data. Use curl only for fetching (GET) from the CDN."
  fi
fi
if echo "$CMD_LOWER" | grep -qE '\bwget\s.*--post'; then
  deny "Blocked wget POST. Patient data must not be sent externally."
fi
if echo "$CMD_LOWER" | grep -qE '\bhttpie?\b.*\b(post|put|patch|delete)\b'; then
  deny "Blocked HTTP client with outbound data method."
fi

# ─── Block: docker push ───
if echo "$CMD_LOWER" | grep -qE '\bdocker\s+push\b'; then
  deny "Blocked 'docker push'. Container images may contain patient data or clinical configs."
fi

# ─── Block: ssh with command execution (tunneling data out) ───
if echo "$CMD_LOWER" | grep -qE '\bssh\s.*\s[^-]'; then
  # ssh with a remote command (not just flags) could tunnel data
  if echo "$CMD_LOWER" | grep -qvE '\bssh-keygen\b'; then
    deny "Blocked SSH command execution. Remote commands could exfiltrate patient data."
  fi
fi

# ─── Block: base64 piped to network commands (encoding + exfil pattern) ───
if echo "$CMD_LOWER" | grep -qE 'base64.*\|\s*(curl|wget|nc|ssh)'; then
  deny "Blocked encoded data exfiltration pattern."
fi

# ─── Block: environment variable dumps to external (could contain secrets) ───
if echo "$CMD_LOWER" | grep -qE '\benv\b.*\|\s*(curl|wget|nc)'; then
  deny "Blocked environment variable exfiltration."
fi

# ─── Everything else: allow ───
# Safe by default: npm install, npm run dev, npx, tsc, git add, git commit,
# curl GET (CDN fetches), node, next dev, etc.
exit 0
