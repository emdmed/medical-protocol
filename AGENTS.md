# AGENTS.md

Steps for agents changing this repo. Project layout and commands are in `CLAUDE.md`.

## After changing the CLI or installer source

`plugin/scripts/medprotocol.cjs` and `scripts/medical-protocol.cjs` are build output committed to git. The plugin ships them as they are, so stale files ship stale code.

1. Changed anything in `packages/medprotocol/src/` or `plugin/lib/`? Run `npm run build`.
2. Changed anything in `packages/medical-protocol/src/` or `public/medical-protocol/`? Run `node packages/medical-protocol/build.mjs`.
3. Run `npm test`.
4. Commit the rebuilt `.cjs` files in the same commit as the source change.

## When testing the installer

`install` also writes the plugin into the global cache at `~/.claude/plugins/cache/medical-protocol/`, which changes the real plugin that Claude Code loads on this machine.

1. Install into a throwaway project: `--dir <temp dir>`.
2. Point `HOME` (`USERPROFILE` on Windows) at a temp dir too, so the global cache write lands there: `HOME=<temp dir> node scripts/medical-protocol.cjs install -y --dir <temp dir>/project`.
3. Delete both temp dirs when done.
