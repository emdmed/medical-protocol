#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"

# Build TypeScript
npx tsup "$DIR/src/index.ts" --format cjs --target node18 --out-dir "$DIR/dist"

# Bundle plugin files into the package
rm -rf "$DIR/plugin"
cp -r "$DIR/../../plugin/" "$DIR/plugin/"

echo "Build complete — dist/ and plugin/ ready"
