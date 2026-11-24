# AGENTS.md

Steps for agents changing this repo. Project layout and commands are in `CLAUDE.md`.

## After changing the CLI, the logic or the shared docs

`plugin/scripts/medprotocol.cjs` and the docs under `plugin/skills/*/reference/` that come from `public/medical-protocol/` are build output committed to git. The plugin ships them as they are, so stale files ship stale code.

1. Changed anything in `packages/medprotocol/src/`, `plugin/lib/` or `public/medical-protocol/`? Run `npm run build`.
2. Run `npm test`.
3. Commit the rebuilt files in the same commit as the source change.
