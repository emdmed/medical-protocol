# CLAUDE.md

## System Overview — 4 Parts

This project is one piece of a four-part medical protocol system. Know which part you're in before making changes.

| Part | What it does | Where it lives |
|------|-------------|----------------|
| **1. Workflows & Plugin** (this repo) | Markdown protocols, workflows, context, skills, and hooks that agents like Claude Code consume. Also contains `lib/` with pure calculation logic. | `/home/enrique/projects/medprotocol-core` |
| **2. medical-protocol** (this repo) | Plugin installer package. `npx medical-protocol install` bundles skills, hooks, and settings from `plugin/` and installs them into doctor projects. `build.sh` copies plugin source into the package before publish. | `packages/medical-protocol/` in this repo |
| **3. medprotocol CLI** (this repo) | Terminal calculator tool. Imports logic from `lib/`. No UI. | `packages/medprotocol/` in this repo |
| **4. medprotocol-ui** (separate repo) | shadcn-style React component delivery. `npx medical-ui-cli add <component>` copies components into doctor projects. | `/home/enrique/projects/medprotocol-ui` |

### Boundaries — read this

- **This repo has NO React, no Next.js, no UI code.** The target stack (React 19, Next.js, shadcn/ui v4+, Tailwind) describes what doctors end up with in their projects, not this repo.
- **Never create component files here.** Components live in the medprotocol-ui repo.
- **`lib/` is the shared bridge.** Pure TypeScript calculation/validation logic consumed by both the CLI (`packages/medprotocol/`) and the UI components (in the other repo). No framework deps.
- **No production deps.** Only devDependencies (typescript, vitest). Do not `npm install` runtime packages.

## Commands

```bash
npm test                              # Run all unit tests (Vitest)
npm run test:watch                    # Watch mode
npx vitest run tests/vital-signs/     # Run a single test directory
npx vitest run tests/bmi/bmi.test.ts  # Run a single test file
npm run version:bump 0.4.0            # Bump version across 5 files
npm run build                         # Build medprotocol CLI
bash packages/medical-protocol/build.sh  # Build plugin installer (bundles plugin/ into package)
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
├── components.md                  # Component registry, dependencies, installation
├── classification.md              # Signal words → domain routing
├── cli.md                         # CLI calculator reference
├── composition.md                 # Component wiring patterns, gotchas
├── {module}.md                    # Per-module context: acid-base, bmi, cardiology, diabetes, nephrology, dka, pafi, sepsis, vital-signs, water-balance
lib/                               # Shared calculation + validation logic
├── acid-base/                     # analyze.ts, interfaces.ts, index.ts
├── vital-signs-validations/       # validation files per vital sign + types.ts
├── *.ts                           # bmi, cardiology, ckd, diabetes-dx, dka, endocrine, format, pafi, sepsis, water-balance
packages/medical-protocol/         # Plugin installer (npx medical-protocol install). build.sh bundles plugin/ into package.
packages/medprotocol/              # CLI calculator tool
plugin/                            # Claude plugin source: settings.json, hooks/, skills/
tests/                             # Vitest — test files, clinical logic only, no UI rendering
scripts/                           # bump-version.sh
.patterns/                         # Reusable guides: new-module checklist, medprotocol CLI, ui-components
```

## Key Details

- **Doctor's target stack:** React 19, Next.js (app router), shadcn/ui v4+, Tailwind, TypeScript — but none of that is in this repo
- **No production deps** — devDependencies only (typescript, vitest). Do not add runtime packages.
- **Testing:** Logic-only via Vitest; UI QA via agent-browser (workflows/agent-qa.md)
- **Content is markdown and JSON only** — no HTML
- **Plugin:** 14 skills with SKILL.md + reference docs, 3 hooks in `plugin/hooks/` (privacy-guard, qa-reminder, track-workflow)
- **Shared context:** `public/medical-protocol/context/` — component registry, classification, CLI ref, composition patterns, and per-module docs (single source of truth)
- **Version:** synced across package.json files and provider manifest via `npm run version:bump`
