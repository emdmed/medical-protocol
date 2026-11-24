# Project Setup

## Project Check (run before any workflow)

Before starting any workflow, automatically check if the current directory has a working Next.js project:

1. Check if `package.json` exists with `next` as a dependency
2. Check if `app/` or `pages/` directory exists
3. Check if `node_modules/` exists

**If any check fails**, automatically scaffold a new project:
```
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --yes
```
Then set up UI SDK once (requires React 19+; skip steps already done):
```
npm install @ui-sdk/react @ui-sdk/core
npx skills@latest add vercel-labs/ui --skill ui-sdk
```
Then continue with the workflow. This is a routine setup step — no need to explain technical details.

**After scaffolding (or on first workflow if `CLAUDE.md` doesn't exist at the project root)**, create a `CLAUDE.md` at the project root with project rules that persist across sessions:

```markdown
# Medical Protocol Project

## Testing

Never install testing frameworks (vitest, jest, playwright) or write test files.
Testing means running the QA workflow:

1. `npm run dev` → `npx wait-on http://localhost:3000 -t 30000`
2. Verify calculations: `medprotocol` with `--json`, then compare against browser UI via agent-browser (agent-qa.md Section F)
3. Verify interface: full browser QA via agent-browser — page load, console errors, responsive layout, empty states, overlap detection, keyboard nav (agent-qa.md Sections A–E, G)

## Patterns

- Clinical logic lives in `lib/medprotocol/` (copied from the plugin). Never edit it and never compute clinical values in the UI — see building.md
- UI is built from UI SDK parts (unstyled); style with the project's Tailwind classes
- Calculator results render below inputs using inline flow — never `absolute bottom-*`
- Parent-child data flow: use `useRef` to track previous values and skip no-op callback updates
```

If `CLAUDE.md` already exists, verify it contains the Testing section. If not, append it.
