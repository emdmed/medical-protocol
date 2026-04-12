# CLAUDE.md

## What This Is

Medical protocol system for Claude Code. Provider protocols and workflows in `public/` are served as static assets via Vercel. Doctors copy `protocol.md` into `.claude/`, describe clinical needs, and Claude Code builds everything.

**Component delivery:** `npx medical-ui-cli add <component>` (CLI at `/home/enrique/projects/medicalui-cli`) copies component files into doctor projects and installs shadcn deps — same model as shadcn/ui. Component source files live in the medical-ui-cli repo, not here.

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
│   ├── claude-code/               # protocol.md, install.md, 15 workflows/
│   └── v0/                        # v0 protocol (stub, 10 workflows)
lib/                               # Shared calculation + validation logic
├── acid-base/                     # analyze.ts, safeFloat.ts, interfaces.ts, index.ts
├── vital-signs-validations/       # 5 validation files + types.ts
├── bmi.ts cardiology.ts cardiology-types.ts dka.ts pafi.ts sepsis.ts water-balance.ts
packages/medprotocol/              # CLI calculator tool (8 commands)
plugin/                            # Claude plugin: settings.json, hooks/, skills/ (14), context/ (12)
tests/                             # Vitest — test files, clinical logic only, no UI rendering
scripts/                           # bump-version.sh
hooks/                             # Git hooks: privacy-guard, qa-reminder, track-workflow, validate-fetch
.patterns/                         # Reusable guides: new-module checklist, medprotocol CLI
```

## Key Details

- **Target stack:** React 19, Next.js (app router), shadcn/ui v4+, Tailwind, TypeScript
- **No production deps** — devDependencies only (typescript, vitest)
- **Testing:** Logic-only via Vitest; UI QA via agent-browser (workflows/agent-qa.md)
- **Plugin:** 14 skills with SKILL.md + reference docs, 4 hooks (privacy, QA, workflow tracking, fetch validation), 12 context files
- **Version:** 0.4.0 (synced across package.json, provider manifest, medprotocol/package.json, plugin.json)

## Patterns

- **Parent-child data:** Props down, callbacks up. Use `useRef` to skip no-op updates and prevent circular render loops.
