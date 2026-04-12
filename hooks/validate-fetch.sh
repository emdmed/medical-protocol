#!/bin/bash
# Medical Protocol Hook: PostToolUse (WebFetch)
# Validates that provider files fetched from Vercel are valid and complete.
# Components are no longer CDN-served — they are delivered via npx medical-ui-cli.
# This hook now only validates provider protocol/workflow fetches.

set -uo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null) || TOOL_NAME=""

# Only validate WebFetch results
if [ "$TOOL_NAME" != "WebFetch" ]; then
  exit 0
fi

# Extract the URL that was fetched
FETCH_URL=$(echo "$INPUT" | jq -r '.tool_input.url // ""' 2>/dev/null) || FETCH_URL=""

# Only validate fetches from our domain
if ! echo "$FETCH_URL" | grep -q 'medical-protocol\.vercel\.app'; then
  exit 0
fi

# Extract the response content
RESPONSE=$(echo "$INPUT" | jq -r '.tool_result.content // .tool_result // ""' 2>/dev/null) || RESPONSE=""

# ─── Check 1: Empty or very short response ───
RESPONSE_LEN=${#RESPONSE}
if [ "$RESPONSE_LEN" -lt 50 ]; then
  echo "<medical-protocol-hook>WARNING: Fetch returned very short response ($RESPONSE_LEN chars) for $FETCH_URL. Consider retrying.</medical-protocol-hook>"
  exit 0
fi

# ─── Check 2: Error page indicators ───
RESPONSE_LOWER=$(echo "$RESPONSE" | head -c 2000 | tr '[:upper:]' '[:lower:]')
if echo "$RESPONSE_LOWER" | grep -qE '(404|not found|page not found|<!doctype html>.*<title>.*error|403 forbidden|500 internal server error)'; then
  echo "<medical-protocol-hook>WARNING: Fetch for $FETCH_URL returned what appears to be an error page. Check the URL and retry.</medical-protocol-hook>"
  exit 0
fi

# ─── Check 3: Workflow validation (for .md files in providers/*/workflows/) ───
if echo "$FETCH_URL" | grep -qE 'providers/.*/workflows/.*\.md$'; then
  if ! echo "$RESPONSE" | head -c 3000 | grep -qiE '(phase|step|workflow|clinical|component|fetch)'; then
    echo "<medical-protocol-hook>WARNING: Workflow file from $FETCH_URL doesn't contain expected workflow structure (no phase/step markers found). Verify the URL.</medical-protocol-hook>"
    exit 0
  fi
fi

# All checks passed — no output needed
exit 0
