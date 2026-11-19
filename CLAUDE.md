# CLAUDE.md

> Before changing the CLI or installer source, or testing the installer, follow `AGENTS.md`.

## System Overview — 4 Parts

This project is one piece of a four-part medical protocol system. Know which part you're in before making changes.

| Part | What it does | Where it lives |
|------|-------------|----------------|
| **1. Workflows & Plugin** (this repo) | Markdown protocols, workflows, context, skills, and hooks that agents like Claude Code consume. Also contains `plugin/lib/` with pure calculation logic, shipped inside the plugin. | `/home/enrique/projects/medprotocol-core` |
| **2. medical-protocol installer** (this repo) | Optional local installer. `node scripts/medical-protocol.cjs install --dir <project>` copies (or `--link`s) skills, hooks, settings, lib and scripts from `plugin/` into a project's `.claude/`. The main install is the marketplace (`plugin/.claude-plugin/plugin.json`). Source in `packages/medical-protocol/src/`, bundled by `build.mjs` into the committed `scripts/medical-protocol.cjs`. | `packages/medical-protocol/` in this repo |
| **3. medprotocol CLI** (this repo) | Terminal calculator tool. Imports logic from `plugin/lib/`. No UI. Bundled into the committed `plugin/scripts/medprotocol.cjs`, which ships with the plugin; skills run it with `node`. | `packages/medprotocol/` in this repo |
| **4. Generated UI** (no repo) | The agent generates each screen in the doctor's project with [UI SDK](https://ui-sdk.dev/docs) (React 19+, unstyled), importing the logic copied to `lib/medprotocol/`. Contract: `public/medical-protocol/context/building.md`. | Doctor's project only |

### Boundaries — read this

- **This repo has NO React, no Next.js, no UI code.** The target stack (React 19, Next.js, UI SDK, Tailwind) describes what doctors end up with in their projects, not this repo.
- **Never create component files here.** UI is generated per doctor project; this repo only describes screens (Screen spec in each `context/{module}.md`).
- **`plugin/lib/` is the single source of clinical logic.** Pure TypeScript, no framework deps. The CLI imports it; doctor projects get an unmodified copy at `lib/medprotocol/`. There are no forked copies to keep in sync.
- **No production deps.** Only devDependencies (typescript, vitest). Do not `npm install` runtime packages.
- **Nothing ships through npm.** The plugin is self-contained: doctors install it from the marketplace, and skills never call `npx`/`npm` for our own tools. npm is only for the doctor's generated app (Next.js, UI SDK) and for developing this repo.

## Commands

```bash
npm test                              # Run all unit tests (Vitest)
npm run test:watch                    # Watch mode
npx vitest run tests/vital-signs/     # Run a single test directory
npx vitest run tests/bmi/bmi.test.ts  # Run a single test file
npm run version:bump 0.4.0            # Bump version everywhere + rebuild both bundles
npm run build                         # Build CLI → plugin/scripts/medprotocol.cjs (commit it)
node packages/medical-protocol/build.mjs  # Sync reference docs into skills + build installer → scripts/medical-protocol.cjs (commit it)
node plugin/scripts/medprotocol.cjs <cmd> [opts]  # CLI calculators (abg, bmi, cardiology, ckd, diabetes, dka, pafi, sepsis, vitals, water-balance, overlay)
```

No linter. TypeScript strict mode (`tsconfig.json`).

## Architecture

```
public/medical-protocol/
├── providers/                     # Provider protocols + install guides
│   ├── manifest.json              # Provider registry
│   └── claude-code/               # protocol.md, install.md, workflows/
public/medical-protocol/context/   # Shared medical context (single source of truth)
├── building.md                    # How every screen is built: copy logic, set up UI SDK, generate
├── components.md                  # Tool registry and dependencies
├── classification.md              # Signal words → domain routing
├── cli.md                         # CLI calculator reference
├── composition.md                 # Screen wiring patterns, gotchas
├── {module}.md                    # Per-module context + Screen spec: acid-base, bmi, cardiology, diabetes, nephrology, dka, pafi, sepsis, vital-signs, water-balance
plugin/                            # Claude plugin source
├── .claude-plugin/plugin.json     # Marketplace manifest
├── lib/                           # Shared calculation + validation logic (copied into doctor projects)
│   ├── acid-base/                 # analyze.ts, interfaces.ts, index.ts
│   ├── vital-signs-validations/   # validation files per vital sign, severity.ts, types.ts
│   └── *.ts                       # bmi, cardiology, ckd, diabetes-dx, dka, endocrine, format, hepatology, nephrology, pafi, patient, sepsis, sources, trace, water-balance
├── agents/                        # qa-runner (Haiku): runs a QA recipe in the browser, writes a report
├── hooks/                         # privacy-guard, qa-reminder, track-workflow
├── scripts/medprotocol.cjs        # Built CLI (skills run it via node; nothing is published to npm)
├── skills/                        # SKILL.md + reference/ per skill
└── settings.json
packages/medical-protocol/         # Installer source → scripts/medical-protocol.cjs. build.mjs also syncs reference docs into plugin/skills.
packages/medprotocol/              # CLI source → plugin/scripts/medprotocol.cjs
tests/                             # Vitest — test files, clinical logic only, no UI rendering
scripts/                           # bump-version.sh, medical-protocol.cjs (built installer)
.patterns/                         # Reusable guides: new-module checklist, medprotocol CLI, logic/UI split
```

## Key Details

- **Doctor's target stack:** React 19, Next.js (app router), UI SDK, Tailwind, TypeScript — but none of that is in this repo
- **No production deps** — devDependencies only (typescript, vitest). Do not add runtime packages.
- **Testing:** Logic-only via Vitest; UI QA via agent-browser (workflows/agent-qa.md)
- **Content is markdown and JSON only** — no HTML
- **Plugin:** skills in `plugin/skills/` (SKILL.md + reference docs), 3 hooks in `plugin/hooks/` (privacy-guard, qa-reminder, track-workflow)
- **Shared context:** `public/medical-protocol/context/` — build contract, tool registry, classification, CLI ref, composition patterns, and per-module docs (single source of truth; `build.mjs` copies them into skill `reference/` dirs)
- **Version:** synced across package.json files, provider manifest, and plugin.json via `npm run version:bump`
