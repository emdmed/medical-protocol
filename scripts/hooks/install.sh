#!/usr/bin/env bash
set -euo pipefail
#
# Activate the committed git hooks for this repo. Run once after cloning:
#   bash scripts/hooks/install.sh
#
# This points git at scripts/hooks/ for hooks (shareable, unlike .git/hooks/)
# and makes them executable. Zero dependencies.

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

chmod +x scripts/hooks/pre-push
git config core.hooksPath scripts/hooks

echo "✓ git hooks activated (core.hooksPath → scripts/hooks)"
echo "  pre-push now runs 'npm run drift:check' before every push."
