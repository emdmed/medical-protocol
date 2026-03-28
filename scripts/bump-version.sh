#!/usr/bin/env bash
set -euo pipefail

# Unified version bump script
# Usage: ./scripts/bump-version.sh <version>
# Example: ./scripts/bump-version.sh 0.4.0

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# --- Validate input ---
if [ $# -eq 0 ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 0.4.0"
  exit 1
fi

VERSION="$1"

if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "Error: '$VERSION' is not valid semver (expected X.Y.Z)"
  exit 1
fi

CURRENT=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
echo "Bumping version: $CURRENT -> $VERSION"
echo ""

CHANGED=0

# --- Helper: update a JSON file's version field using node ---
update_json() {
  local file="$1"
  local jq_filter="$2"
  local rel="${file#$ROOT/}"

  if [ ! -f "$file" ]; then
    echo "  SKIP  $rel (not found)"
    return
  fi

  node -e "
    const fs = require('fs');
    const raw = fs.readFileSync('$file', 'utf8');
    const obj = JSON.parse(raw);
    $jq_filter
    const out = JSON.stringify(obj, null, 2) + '\n';
    if (raw !== out) {
      fs.writeFileSync('$file', out);
      process.stdout.write('  UPDATED  $rel\n');
      process.exit(0);
    } else {
      process.stdout.write('  OK       $rel (already $VERSION)\n');
      process.exit(1);
    }
  " && CHANGED=$((CHANGED + 1)) || true
}

# --- 1. package.json ---
update_json "$ROOT/package.json" "obj.version = '$VERSION';"

# --- 2. manifest.json (top-level + each component) ---
update_json "$ROOT/public/medical-protocol/components/manifest.json" "
  obj.version = '$VERSION';
  for (const key of Object.keys(obj)) {
    if (obj[key] && typeof obj[key] === 'object' && 'version' in obj[key]) {
      obj[key].version = '$VERSION';
    }
  }
"

# --- 3. plugin.json ---
update_json "$ROOT/plugin/.claude-plugin/plugin.json" "obj.version = '$VERSION';"

echo ""
if [ "$CHANGED" -gt 0 ]; then
  echo "Done. $CHANGED file(s) updated to $VERSION."
  echo "Run 'npm install --package-lock-only' to sync package-lock.json."
else
  echo "Nothing to update — all files already at $VERSION."
fi
