#!/usr/bin/env bash
set -euo pipefail
#
# Gated cross-repo push — drive both medprotocol repos from medprotocol-core
# without cd-ing around. Runs the core↔UI drift-check once as a shared gate,
# then pushes the chosen repo(s) via `git -C` (no directory navigation).
#
# Usage:
#   bash scripts/git/push.sh [target] [-- <extra git push args>]
#   npm run push -- [target] [-- <extra git push args>]
#
#   target:  all (default) | core | ui
#
# Examples:
#   bash scripts/git/push.sh                 # gate, then push both repos
#   bash scripts/git/push.sh ui              # gate, then push only medprotocol-ui
#   bash scripts/git/push.sh core -- -u origin HEAD
#   bash scripts/git/push.sh all -- --no-verify   # skip the gate (forwarded to git)
#
# UI repo location: ../medprotocol-ui by default, or set MEDPROTOCOL_UI_DIR.

CORE_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
UI_DIR="${MEDPROTOCOL_UI_DIR:-$(cd "$CORE_ROOT/.." && pwd)/medprotocol-ui}"

# --- Parse target (first non-flag arg); the rest go to `git push` ---
TARGET="all"
if [ $# -gt 0 ] && [[ "$1" != -* ]]; then
  TARGET="$1"; shift
fi
[ "${1:-}" = "--" ] && shift || true
GIT_ARGS=("$@")

case "$TARGET" in
  all|core|ui) ;;
  *) echo "✗ unknown target '$TARGET' (use: all | core | ui)"; exit 2 ;;
esac

# --- Bypass: if --no-verify is forwarded, skip the gate too ---
BYPASS=0
if [ "${#GIT_ARGS[@]}" -gt 0 ]; then
  for a in "${GIT_ARGS[@]}"; do
    [ "$a" = "--no-verify" ] && BYPASS=1
  done
fi

# --- Shared gate: drift-check (either side can introduce drift) ---
if [ "$BYPASS" -eq 1 ]; then
  echo "⚠ gate skipped (--no-verify)"
else
  echo "› running drift-check gate…"
  if ! node "$CORE_ROOT/scripts/drift-check.js"; then
    echo ""
    echo "✗ push aborted: core lib/ and the medprotocol-ui copies have drifted."
    echo "  Reconcile/acknowledge, or bypass with: $0 $TARGET -- --no-verify"
    exit 1
  fi
fi

# --- Push one repo via git -C (no cd). Extra args after the dir are forwarded. ---
push_repo() {
  local name="$1" dir="$2"; shift 2
  if [ ! -d "$dir/.git" ]; then
    echo "⚠ skip $name — no git repo at $dir"
    return 0
  fi
  local branch
  branch="$(git -C "$dir" rev-parse --abbrev-ref HEAD)"
  echo "› pushing $name ($branch) …"
  git -C "$dir" push "$@"
  echo "✓ $name pushed"
}

# medprotocol-core has a pre-push hook that runs this same drift-check. We've
# already gated above, so push core with --no-verify to avoid a redundant
# second run (unless the gate was bypassed, in which case --no-verify is
# already in GIT_ARGS). A plain `git push` still gates via the hook.
CORE_EXTRA=()
[ "$BYPASS" -eq 0 ] && CORE_EXTRA=(--no-verify)

if [ "$TARGET" = "all" ] || [ "$TARGET" = "core" ]; then
  push_repo "medprotocol-core" "$CORE_ROOT" "${GIT_ARGS[@]}" "${CORE_EXTRA[@]}"
fi
if [ "$TARGET" = "all" ] || [ "$TARGET" = "ui" ]; then
  push_repo "medprotocol-ui" "$UI_DIR" "${GIT_ARGS[@]}"
fi

echo "✓ done"
