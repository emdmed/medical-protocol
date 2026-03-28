#!/bin/bash
# Medical Protocol Hook: PostToolUse (WebFetch)
# Validates that components fetched from the CDN are valid and complete.
# Checks: non-empty response, expected file structure, no error pages.
# Outputs warnings to stderr (non-blocking) so Claude can retry if needed.

set -uo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null) || TOOL_NAME=""

# Only validate WebFetch results
if [ "$TOOL_NAME" != "WebFetch" ]; then
  exit 0
fi

# Extract the URL that was fetched
FETCH_URL=$(echo "$INPUT" | jq -r '.tool_input.url // ""' 2>/dev/null) || FETCH_URL=""

# Only validate fetches from our CDN
if ! echo "$FETCH_URL" | grep -q 'medical-protocol\.vercel\.app'; then
  exit 0
fi

# Extract the response content
RESPONSE=$(echo "$INPUT" | jq -r '.tool_result.content // .tool_result // ""' 2>/dev/null) || RESPONSE=""

# ─── Check 1: Empty or very short response ───
RESPONSE_LEN=${#RESPONSE}
if [ "$RESPONSE_LEN" -lt 50 ]; then
  echo "<medical-protocol-hook>WARNING: CDN fetch returned very short response ($RESPONSE_LEN chars) for $FETCH_URL. The component may not have downloaded correctly. Consider retrying the fetch.</medical-protocol-hook>"
  exit 0
fi

# ─── Check 2: Error page indicators ───
RESPONSE_LOWER=$(echo "$RESPONSE" | head -c 2000 | tr '[:upper:]' '[:lower:]')
if echo "$RESPONSE_LOWER" | grep -qE '(404|not found|page not found|<!doctype html>.*<title>.*error|403 forbidden|500 internal server error)'; then
  echo "<medical-protocol-hook>WARNING: CDN fetch for $FETCH_URL returned what appears to be an error page, not a component file. Check the URL and retry. If this persists, the component may have been moved or removed.</medical-protocol-hook>"
  exit 0
fi

# ─── Check 3: Component file validation (for .tsx/.ts files) ───
if echo "$FETCH_URL" | grep -qE '\.(tsx?|js|jsx)$'; then
  HAS_IMPORT=false
  HAS_EXPORT=false

  if echo "$RESPONSE" | head -c 5000 | grep -qE '(import\s|from\s)'; then
    HAS_IMPORT=true
  fi
  if echo "$RESPONSE" | grep -qE '(export\s+(default\s+)?function|export\s+(default\s+)?const|export\s+\{|export\s+type|export\s+interface)'; then
    HAS_EXPORT=true
  fi

  if [ "$HAS_IMPORT" = false ] && [ "$HAS_EXPORT" = false ]; then
    echo "<medical-protocol-hook>WARNING: Fetched file from $FETCH_URL doesn't appear to be a valid TypeScript/React component (no imports or exports found). Verify the URL points to the correct component file.</medical-protocol-hook>"
    exit 0
  fi
fi

# ─── Check 4: Manifest validation (for manifest.json) ───
if echo "$FETCH_URL" | grep -qE 'manifest\.json$'; then
  if ! echo "$RESPONSE" | jq empty 2>/dev/null; then
    echo "<medical-protocol-hook>WARNING: manifest.json from CDN is not valid JSON. Component installation may fail. Retry the fetch.</medical-protocol-hook>"
    exit 0
  fi

  # Check manifest has expected structure
  HAS_VERSION=$(echo "$RESPONSE" | jq -r '.version // empty' 2>/dev/null)
  if [ -z "$HAS_VERSION" ]; then
    echo "<medical-protocol-hook>WARNING: manifest.json is missing 'version' field. This may be an outdated or malformed manifest.</medical-protocol-hook>"
    exit 0
  fi
fi

# ─── Check 5: Workflow validation (for .md files in workflows/) ───
if echo "$FETCH_URL" | grep -qE 'workflows/.*\.md$'; then
  if ! echo "$RESPONSE" | head -c 3000 | grep -qiE '(phase|step|workflow|clinical|component|fetch)'; then
    echo "<medical-protocol-hook>WARNING: Workflow file from $FETCH_URL doesn't contain expected workflow structure (no phase/step markers found). Verify the URL.</medical-protocol-hook>"
    exit 0
  fi
fi

# All checks passed — no output needed
exit 0
