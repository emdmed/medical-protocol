#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
PUBLIC="$DIR/../../public/medical-protocol"

# Build TypeScript
npx tsup "$DIR/src/index.ts" --format cjs --target node18 --out-dir "$DIR/dist"

# Bundle plugin files into the package
rm -rf "$DIR/plugin"
mkdir -p "$DIR/plugin"

# Copy skills (self-contained with reference/ dirs), hooks, and settings
cp -r "$DIR/../../plugin/skills/" "$DIR/plugin/skills/"
cp -r "$DIR/../../plugin/hooks/" "$DIR/plugin/hooks/"
cp "$DIR/../../plugin/settings.json" "$DIR/plugin/settings.json"

# Remove old plugin dirs that are no longer needed
rm -rf "$DIR/plugin/context" "$DIR/plugin/reference" "$DIR/plugin/.claude-plugin"

# Sync reference files from public/ source of truth into each skill's reference/ dir
# These overwrite the copies from plugin/skills/*/reference/ to ensure they match the canonical source

# classification.md → start
cp "$PUBLIC/context/classification.md" "$DIR/plugin/skills/start/reference/"

# cli.md → cli
cp "$PUBLIC/context/cli.md" "$DIR/plugin/skills/cli/reference/"

# components.md → skills that need it
for skill in start bmi pafi acid-base dka vitals water-balance dashboard customize; do
  cp "$PUBLIC/context/components.md" "$DIR/plugin/skills/$skill/reference/"
done

# composition.md → skills that need it
for skill in start bmi pafi acid-base dka vitals water-balance dashboard customize; do
  cp "$PUBLIC/context/composition.md" "$DIR/plugin/skills/$skill/reference/"
done

# initial-clarification.md → start
cp "$PUBLIC/workflows/initial-clarification.md" "$DIR/plugin/skills/start/reference/"

# Workflow files → start (for domain routing)
cp "$PUBLIC/providers/claude-code/workflows/nephrology.md" "$DIR/plugin/skills/start/reference/"
cp "$PUBLIC/providers/claude-code/workflows/cardiology.md" "$DIR/plugin/skills/start/reference/"
cp "$PUBLIC/providers/claude-code/workflows/sepsis.md" "$DIR/plugin/skills/start/reference/"

# troubleshoot workflow → troubleshoot skill
cp "$PUBLIC/providers/claude-code/workflows/troubleshoot.md" "$DIR/plugin/skills/troubleshoot/reference/"

echo "Build complete — dist/ and plugin/ ready"
