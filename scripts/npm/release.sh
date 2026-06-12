#!/usr/bin/env bash
set -euo pipefail
#
# Gated full release for the two npm packages — bump, test, build, publish from
# medprotocol-core without cd-ing into the package dirs. Parallels the push
# script: a shared gate, then the action.
#
# Usage:
#   bash scripts/npm/release.sh <version> [target] [-- <extra npm publish args>]
#   npm run release -- <version> [target] [-- <extra npm publish args>]
#
#   target:  all (default) | cli | installer
#   cli       → packages/medprotocol      (npm: medprotocol)
#   installer → packages/medical-protocol (npm: medical-protocol)
#
# Examples:
#   bash scripts/npm/release.sh 0.7.7                 # bump+test+build+publish both
#   bash scripts/npm/release.sh 0.7.7 cli             # only the CLI
#   bash scripts/npm/release.sh 0.7.7 all -- --dry-run
#
# Gates (all must pass before anything publishes):
#   1. npm auth present
#   2. <version> is valid semver and > each TARGET package's published version
#   3. full test suite passes
# Only then: version:bump (all files) → build → publish.

CORE_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$CORE_ROOT"

# pkg key → "dir|npm-name"
pkg_dir()  { case "$1" in cli) echo "packages/medprotocol";; installer) echo "packages/medical-protocol";; esac; }
pkg_name() { case "$1" in cli) echo "medprotocol";; installer) echo "medical-protocol";; esac; }

# --- Args ---
VERSION="${1:-}"
if [ -z "$VERSION" ]; then echo "✗ usage: $0 <version> [all|cli|installer] [-- <npm publish args>]"; exit 2; fi
shift
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "✗ '$VERSION' is not valid semver (X.Y.Z)"; exit 2
fi

TARGET="all"
if [ $# -gt 0 ] && [[ "$1" != -* ]]; then TARGET="$1"; shift; fi
[ "${1:-}" = "--" ] && shift || true
PUBLISH_ARGS=("$@")

case "$TARGET" in all) TARGETS=(cli installer);; cli) TARGETS=(cli);; installer) TARGETS=(installer);;
  *) echo "✗ unknown target '$TARGET' (use: all | cli | installer)"; exit 2;; esac

# Is this a dry run? (don't require auth / version sanity to be publishable)
DRY=0
if [ "${#PUBLISH_ARGS[@]}" -gt 0 ]; then
  for a in "${PUBLISH_ARGS[@]}"; do [ "$a" = "--dry-run" ] && DRY=1; done
fi

# --- Gate 1: auth ---
if [ "$DRY" -eq 0 ]; then
  if ! npm whoami >/dev/null 2>&1; then
    echo "✗ not logged in to npm. Run this in your prompt first:  ! npm login"
    exit 1
  fi
  echo "✓ npm auth: $(npm whoami)"
fi

# --- Gate 2: version must be > each target's published version ---
# numeric semver compare: returns 0 if $1 > $2
ver_gt() { [ "$1" = "$2" ] && return 1; [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | tail -1)" = "$1" ]; }

for t in "${TARGETS[@]}"; do
  name="$(pkg_name "$t")"
  published="$(npm view "$name" version 2>/dev/null || echo "none")"
  if [ "$published" = "none" ]; then
    echo "✓ $name: not yet on npm — any version ok"
  elif ver_gt "$VERSION" "$published"; then
    echo "✓ $name: $published → $VERSION"
  else
    echo "✗ $name: requested $VERSION is not greater than published $published."
    echo "  Pick a higher version (npm will reject a re-publish or downgrade)."
    exit 1
  fi
done

# --- Gate 3: tests (on the current tree, before mutating versions) ---
echo "› running test suite…"
npm test --silent >/dev/null
echo "✓ tests passed"

# --- Bump all version files + sync lockfile ---
echo "› bumping versions to $VERSION…"
npm run version:bump "$VERSION" >/dev/null
npm install --package-lock-only >/dev/null 2>&1 || true
echo "✓ versions synced to $VERSION"

# --- Build + publish each target (subshell cd keeps the user's cwd untouched) ---
for t in "${TARGETS[@]}"; do
  dir="$(pkg_dir "$t")"; name="$(pkg_name "$t")"
  echo "› building $name…"
  ( cd "$dir" && npm run build >/dev/null )
  echo "› publishing $name@$VERSION…"
  ( cd "$dir" && npm publish "${PUBLISH_ARGS[@]}" )
  echo "✓ $name@$VERSION published"
done

echo "✓ release complete ($VERSION)"
