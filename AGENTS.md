# AGENTS.md

Steps for agents changing this repo. Project layout and commands are in `CLAUDE.md`.

## After changing the CLI, the logic or the shared docs

`plugin/scripts/medprotocol.cjs` and the docs under `plugin/skills/*/reference/` that come from `public/medical-protocol/` are build output committed to git. The plugin ships them as they are, so stale files ship stale code.

1. Changed anything in `packages/medprotocol/src/`, `plugin/lib/` or `public/medical-protocol/`? Run `npm run build`.
2. Run `npm test`.
3. Commit the rebuilt files in the same commit as the source change.

## Releasing

1. Add a `## X.Y.Z — YYYY-MM-DD` entry at the top of `CHANGELOG.md`: what changed for the people using the plugin, in plain words. `git log vPREVIOUS..HEAD` lists what to cover.
2. Run `npm run version:bump X.Y.Z`. It refuses to run when the changelog has no entry for that version.
3. Run `npm test`, commit as `chore: release X.Y.Z` (changelog included), tag `vX.Y.Z`, push `main` and the tag.
