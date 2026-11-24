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

# --- 2. packages/medprotocol/package.json ---
update_json "$ROOT/packages/medprotocol/package.json" "obj.version = '$VERSION';"

# --- 3. plugin/.claude-plugin/plugin.json ---
update_json "$ROOT/plugin/.claude-plugin/plugin.json" "obj.version = '$VERSION';"

# --- 4. SPEC.md status line ---
# -i.bak: the one in-place form both GNU (Linux) and BSD (macOS) sed accept
sed -i.bak -E "s/\(v[0-9]+\.[0-9]+\.[0-9]+\)/(v$VERSION)/" "$ROOT/SPEC.md" && rm "$ROOT/SPEC.md.bak"

# --- 5. lockfile + committed bundle (it embeds the version at build time) ---
cd "$ROOT"
# edit versions directly; `npm install --package-lock-only` would also re-resolve deps
node -e "
  const fs = require('fs');
  const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
  lock.version = '$VERSION';
  for (const p of ['', 'packages/medprotocol'])
    if (lock.packages[p]) lock.packages[p].version = '$VERSION';
  fs.writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\\n');
"
npm run build --silent

echo ""
echo "Done. All parts at $VERSION. Commit, then: git tag v$VERSION"
