# CLAUDE.md

## System Overview — 3 Parts

This project is one piece of a three-part medical protocol system. Know which part you're in before making changes.

| Part | What it does | Where it lives |
|------|-------------|----------------|
| **1. Workflows & Plugin** (this repo) | Markdown protocols, workflows, context, skills, and hooks that agents like Claude Code consume. Served as static strings via Vercel CDN. Also contains `lib/` with pure calculation logic and `packages/medprotocol/` CLI. | `/home/enrique/projects/medical-protocol-workflows` |
| **2. medprotocol CLI** (this repo) | Terminal calculator tool (9 commands). Imports logic from `lib/`. No UI. | `packages/medprotocol/` in this repo |
| **3. medical-ui-cli** (separate repo) | shadcn-style React component delivery. `npx medical-ui-cli add <component>` copies components into doctor projects. | `/home/enrique/projects/medicalui-cli` |

### Boundaries — read this

- **This repo has NO React, no Next.js, no UI code.** The target stack (React 19, Next.js, shadcn/ui v4+, Tailwind) describes what doctors end up with in their projects, not this repo.
- **Never create component files here.** Components live in the medical-ui-cli repo.
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
npx medprotocol <cmd> [opts]          # CLI calculators (bmi, abg, vitals, pafi, dka, water-balance, cardiology, sepsis)
```

No linter. TypeScript strict mode (`tsconfig.json`).

## Architecture

```
public/medical-protocol/
├── providers/                     # Provider protocols + install guides
│   ├── manifest.json              # Provider registry
│   └── claude-code/               # protocol.md, install.md, 15 workflows/
context/                           # Shared medical context (provider-agnostic, 13 files)
├── components.md                  # Component registry, dependencies, installation
├── classification.md              # Signal words → domain routing
├── cli.md                         # CLI calculator reference
├── composition.md                 # Component wiring patterns, gotchas
├── {module}.md                    # Per-module context (9): acid-base, bmi, cardiology, ckd, dka, pafi, sepsis, vital-signs, water-balance
lib/                               # Shared calculation + validation logic
├── acid-base/                     # analyze.ts, interfaces.ts, index.ts
├── vital-signs-validations/       # 5 validation files + types.ts
├── bmi.ts cardiology.ts cardiology-types.ts dka.ts pafi.ts sepsis.ts water-balance.ts
packages/medprotocol/              # CLI calculator tool (9 commands)
plugin/                            # Claude plugin source: settings.json, hooks/, skills/ (14), context/ (10)
tests/                             # Vitest — test files, clinical logic only, no UI rendering
scripts/                           # bump-version.sh
hooks/                             # Git hooks: privacy-guard, qa-reminder, track-workflow, validate-fetch
.patterns/                         # Reusable guides: new-module checklist, medprotocol CLI
```

## Key Details

- **Doctor's target stack:** React 19, Next.js (app router), shadcn/ui v4+, Tailwind, TypeScript — but none of that is in this repo
- **No production deps** — devDependencies only (typescript, vitest). Do not add runtime packages.
- **Testing:** Logic-only via Vitest; UI QA via agent-browser (workflows/agent-qa.md)
- **CDN serves strings only** — markdown and JSON, no HTML
- **Plugin:** 14 skills with SKILL.md + reference docs, 4 hooks (privacy, QA, workflow tracking, fetch validation), 10 plugin context files
- **Shared context:** 13 files in `context/` — component registry, classification, CLI ref, composition patterns, and 9 per-module docs
- **Version:** 0.4.0 (synced across package.json, provider manifest, medprotocol/package.json, plugin.json)

## Patterns

- **Parent-child data:** Props down, callbacks up. Use `useRef` to skip no-op updates and prevent circular render loops.
