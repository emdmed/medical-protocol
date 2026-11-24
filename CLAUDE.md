# CLAUDE.md

> Before changing the CLI, the logic or the shared docs, follow `AGENTS.md`.

## System Overview — 3 Parts

This project is a three-part medical protocol system. Know which part you're in before making changes.

| Part | What it does | Where it lives |
|------|-------------|----------------|
| **1. Workflows & Plugin** (this repo) | Markdown protocols, workflows, context, skills, and hooks that agents like Claude Code consume. Also contains `plugin/lib/` with pure calculation logic, shipped inside the plugin. | `/home/enrique/projects/medprotocol-core` |
| **2. medprotocol CLI** (this repo) | Terminal calculator tool. Imports logic from `plugin/lib/`. No UI. Bundled into the committed `plugin/scripts/medprotocol.cjs`, which ships with the plugin; skills run it with `node`. | `packages/medprotocol/` in this repo |
| **3. Generated UI** (no repo) | The agent generates each screen in the doctor's project with [UI SDK](https://ui-sdk.dev/docs) (React 19+, unstyled), importing the logic copied to `lib/medprotocol/`. Contract: `public/medical-protocol/context/building.md`. | Doctor's project only |

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
npm run version:bump 0.4.0            # Bump version everywhere + rebuild
npm run build                         # Build CLI → plugin/scripts/medprotocol.cjs, sync reference docs into skills (commit both)
node plugin/scripts/medprotocol.cjs <cmd> [opts]  # CLI calculators (abg, bmi, cardiology, ckd, diabetes, dka, extract, pafi, sepsis, vitals, water-balance, overlay)
```

No linter. TypeScript strict mode (`tsconfig.json`).

## Architecture

```
public/medical-protocol/workflows/ # Shared workflows: initial-clarification, agent-qa, quality-checklist, patient-privacy, troubleshoot, cardiology, nephrology, sepsis
public/medical-protocol/context/   # Shared medical context (single source of truth)
├── building.md                    # How every screen is built: copy logic, set up UI SDK, generate
├── components.md                  # Tool registry and dependencies
├── classification.md              # Signal words → domain routing
├── cli.md                         # CLI calculator reference
├── composition.md                 # Screen wiring patterns, gotchas
├── {module}.md                    # Per-module context + Screen spec: acid-base, bmi, cardiology, diabetes, extraction, nephrology, dka, pafi, sepsis, vital-signs, water-balance
plugin/                            # Claude plugin source
├── .claude-plugin/plugin.json     # Marketplace manifest
├── lib/                           # Shared calculation + validation logic (copied into doctor projects)
│   ├── acid-base/                 # analyze.ts, interfaces.ts, index.ts
│   ├── vital-signs-validations/   # validation files per vital sign, severity.ts, types.ts
│   └── *.ts                       # bmi, cardiology, ckd, diabetes-dx, dka, endocrine, format, hepatology, nephrology, pafi, patient, sepsis, sources, trace, water-balance
├── agents/                        # qa-runner (Haiku): browser QA report; extraction-verifier: re-checks a first-pass extraction
├── hooks/                         # privacy-guard, extraction-guard, note-consent, qa-reminder, track-workflow
├── scripts/medprotocol.cjs        # Built CLI (skills run it via node; nothing is published to npm)
├── skills/                        # SKILL.md + reference/ per skill
└── settings.json
packages/medprotocol/              # CLI source → plugin/scripts/medprotocol.cjs
tests/                             # Vitest — test files, clinical logic only, no UI rendering
scripts/                           # bump-version.sh, sync-reference.mjs (copies public/ docs into plugin/skills)
.patterns/                         # Reusable guides: new-module checklist, medprotocol CLI, logic/UI split
```

## Key Details

- **Doctor's target stack:** React 19, Next.js (app router), UI SDK, Tailwind, TypeScript — but none of that is in this repo
- **No production deps** — devDependencies only (typescript, vitest). Do not add runtime packages.
- **Testing:** Logic-only via Vitest; UI QA via agent-browser (workflows/agent-qa.md)
- **Content is markdown and JSON only** — no HTML
- **Plugin:** skills in `plugin/skills/` (SKILL.md + reference docs), 5 hooks in `plugin/hooks/` (privacy-guard, extraction-guard, note-consent, qa-reminder, track-workflow)
- **Shared context:** `public/medical-protocol/context/` — build contract, tool registry, classification, CLI ref, composition patterns, and per-module docs (single source of truth; `scripts/sync-reference.mjs` copies them into skill `reference/` dirs)
- **Version:** synced across package.json files and plugin.json via `npm run version:bump`
