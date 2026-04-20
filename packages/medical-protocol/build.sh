#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"

# Build TypeScript
npx tsup "$DIR/src/index.ts" --format cjs --target node18 --out-dir "$DIR/dist"

# Bundle plugin files into the package
rm -rf "$DIR/plugin"
cp -r "$DIR/../../plugin/" "$DIR/plugin/"

# Sync reference files from public/ source of truth
REFERENCE="$DIR/plugin/reference"
rm -rf "$REFERENCE"
mkdir -p "$REFERENCE/context" "$REFERENCE/workflows"

cp "$DIR/../../public/medical-protocol/context/classification.md" "$REFERENCE/context/"
cp "$DIR/../../public/medical-protocol/context/cli.md" "$REFERENCE/context/"
cp "$DIR/../../public/medical-protocol/context/components.md" "$REFERENCE/context/"
cp "$DIR/../../public/medical-protocol/context/composition.md" "$REFERENCE/context/"

cp "$DIR/../../public/medical-protocol/workflows/initial-clarification.md" "$REFERENCE/workflows/"
cp "$DIR/../../public/medical-protocol/providers/claude-code/workflows/nephrology.md" "$REFERENCE/workflows/"
cp "$DIR/../../public/medical-protocol/providers/claude-code/workflows/cardiology.md" "$REFERENCE/workflows/"
cp "$DIR/../../public/medical-protocol/providers/claude-code/workflows/sepsis.md" "$REFERENCE/workflows/"
cp "$DIR/../../public/medical-protocol/providers/claude-code/workflows/patient-privacy.md" "$REFERENCE/workflows/"
cp "$DIR/../../public/medical-protocol/providers/claude-code/workflows/quality-checklist.md" "$REFERENCE/workflows/"
cp "$DIR/../../public/medical-protocol/providers/claude-code/workflows/troubleshoot.md" "$REFERENCE/workflows/"
cp "$DIR/../../public/medical-protocol/providers/claude-code/workflows/agent-qa.md" "$REFERENCE/workflows/"
cp "$DIR/../../public/medical-protocol/providers/claude-code/protocol.md" "$REFERENCE/protocol.md"

echo "Build complete — dist/, plugin/, and reference/ ready"
