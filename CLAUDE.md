# CLAUDE.md

## System Overview — 4 Parts

This project is one piece of a four-part medical protocol system. Know which part you're in before making changes.

| Part | What it does | Where it lives |
|------|-------------|----------------|
| **1. Workflows & Plugin** (this repo) | Markdown protocols, workflows, context, skills, and hooks that agents like Claude Code consume. Also contains `plugin/lib/` with pure calculation logic, shipped inside the plugin. | `/home/enrique/projects/medprotocol-core` |
| **2. medical-protocol** (this repo) | Plugin installer package. `npx medical-protocol install` installs skills, hooks, settings, and lib from `plugin/` into a doctor's project `.claude/`. `build.mjs` copies plugin source into the package before publish. Also installable from the marketplace (`plugin/.claude-plugin/plugin.json`). | `packages/medical-protocol/` in this repo |
| **3. medprotocol CLI** (this repo) | Terminal calculator tool. Imports logic from `plugin/lib/`. No UI. | `packages/medprotocol/` in this repo |
| **4. Generated UI** (no repo) | The agent generates each screen in the doctor's project with [UI SDK](https://ui-sdk.dev/docs) (React 19+, unstyled), importing the logic copied to `lib/medprotocol/`. Contract: `public/medical-protocol/context/building.md`. | Doctor's project only |

### Boundaries — read this

- **This repo has NO React, no Next.js, no UI code.** The target stack (React 19, Next.js, UI SDK, Tailwind) describes what doctors end up with in their projects, not this repo.
- **Never create component files here.** UI is generated per doctor project; this repo only describes screens (Screen spec in each `context/{module}.md`).
- **`plugin/lib/` is the single source of clinical logic.** Pure TypeScript, no framework deps. The CLI imports it; doctor projects get an unmodified copy at `lib/medprotocol/`. There are no forked copies to keep in sync.
- **No production deps.** Only devDependencies (typescript, vitest). Do not `npm install` runtime packages.

## Commands

```bash
npm test                              # Run all unit tests (Vitest)
npm run test:watch                    # Watch mode
npx vitest run tests/vital-signs/     # Run a single test directory
npx vitest run tests/bmi/bmi.test.ts  # Run a single test file
npm run version:bump 0.4.0            # Bump version across 5 files
npm run build                         # Build medprotocol CLI
node packages/medical-protocol/build.mjs  # Build plugin installer (bundles plugin/ into package)
npm run release <version>             # Gated publish (auth, version, tests)
npx medprotocol <cmd> [opts]          # CLI calculators (abg, bmi, cardiology, ckd, diabetes, dka, pafi, sepsis, vitals, water-balance)
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
├── skills/                        # SKILL.md + reference/ per skill
└── settings.json
packages/medical-protocol/         # Plugin installer (npx medical-protocol install). build.mjs bundles plugin/ into package.
packages/medprotocol/              # CLI calculator tool
tests/                             # Vitest — test files, clinical logic only, no UI rendering
scripts/                           # bump-version.sh, npm/release.sh
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
