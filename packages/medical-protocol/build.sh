#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
PUBLIC="$DIR/../../public/medical-protocol"
PLUGIN="$DIR/../../plugin"

# Build TypeScript
npx tsup "$DIR/src/index.ts" --format cjs --target node18 --out-dir "$DIR/dist"

# Sync reference files from public/ source of truth into each skill's reference/ dir
# Synced into plugin/ itself, since the marketplace installs plugin/ directly

# classification.md → start
cp "$PUBLIC/context/classification.md" "$PLUGIN/skills/start/reference/"

# cli.md → cli
cp "$PUBLIC/context/cli.md" "$PLUGIN/skills/calc/reference/"

# components.md → skills that need it
for skill in start bmi pafi acid-base dka vital-signs water-balance dashboard modify; do
  cp "$PUBLIC/context/components.md" "$PLUGIN/skills/$skill/reference/"
done

# composition.md → skills that need it
for skill in start bmi pafi acid-base dka vital-signs water-balance dashboard modify; do
  cp "$PUBLIC/context/composition.md" "$PLUGIN/skills/$skill/reference/"
done

# building.md → every skill that builds UI (any skill that has a copy)
for f in "$PLUGIN"/skills/*/reference/building.md; do
  [ -e "$f" ] && cp "$PUBLIC/context/building.md" "$f"
done

# initial-clarification.md → start
cp "$PUBLIC/workflows/initial-clarification.md" "$PLUGIN/skills/start/reference/"

# Workflow files → start (for domain routing)
cp "$PUBLIC/providers/claude-code/workflows/nephrology.md" "$PLUGIN/skills/start/reference/"
cp "$PUBLIC/providers/claude-code/workflows/cardiology.md" "$PLUGIN/skills/start/reference/"
cp "$PUBLIC/providers/claude-code/workflows/sepsis.md" "$PLUGIN/skills/start/reference/"

# troubleshoot workflow → troubleshoot skill
cp "$PUBLIC/providers/claude-code/workflows/troubleshoot.md" "$PLUGIN/skills/troubleshoot/reference/"

# Bundle plugin files into the package
rm -rf "$DIR/plugin"
mkdir -p "$DIR/plugin"

# Copy skills (self-contained with reference/ dirs), hooks, clinical logic, and settings
cp -r "$PLUGIN/skills/" "$DIR/plugin/skills/"
cp -r "$PLUGIN/hooks/" "$DIR/plugin/hooks/"
cp -r "$PLUGIN/lib/" "$DIR/plugin/lib/"
cp "$PLUGIN/settings.json" "$DIR/plugin/settings.json"

# Remove old plugin dirs that are no longer needed
rm -rf "$DIR/plugin/context" "$DIR/plugin/reference" "$DIR/plugin/.claude-plugin"


echo "Build complete — dist/ and plugin/ ready"
