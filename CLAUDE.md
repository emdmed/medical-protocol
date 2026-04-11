# CLAUDE.md

## What This Is

CDN-hosted medical protocol system for Claude Code. Components in `public/` are served as static assets via Vercel — no build step. Doctors copy `protocol.md` into `.claude/`, describe clinical needs, and Claude Code builds everything.

**Component delivery:** `npx medical-ui-cli add <component>` (CLI at `/home/enrique/projects/medicalui-cli`) copies component files into doctor projects and installs shadcn deps — same model as shadcn/ui. This repo hosts the source files the CLI pulls from.

## Commands

```bash
npm test                              # Run all ~246 unit tests (Vitest)
npm run test:watch                    # Watch mode
npx vitest run tests/vital-signs/     # Run a single test directory
npx vitest run tests/bmi/bmi.test.ts  # Run a single test file
npm run version:bump 0.4.0            # Bump version across 5 files
npm run registry:generate             # Regenerate public/medical-protocol/r/*.json
npm run build                         # Build medprotocol CLI
npx medprotocol <cmd> [opts]          # CLI calculators (bmi, abg, vitals, pafi, dka, water-balance, cardiology)
```

No linter. TypeScript strict mode (`tsconfig.json`).

## Architecture

```
public/medical-protocol/
├── providers/                     # Provider protocols + install guides
│   ├── manifest.json              # Provider registry
│   ├── claude-code/               # protocol.md, install.md, 16 workflows/
│   └── v0/                        # v0 protocol (stub, 13 workflows)
├── components/                    # React TSX source (CDN-served, CLI-installed)
│   ├── manifest.json              # Component registry (canonical)
│   └── {module}/                  # 12 modules (see below)
├── r/                             # shadcn-compatible registry JSONs (generated)
lib/                               # Shared calculation logic (used by components + CLI)
├── acid-base/ bmi.ts cardiology.ts dka.ts pafi.ts sepsis.ts water-balance.ts
packages/medprotocol/              # CLI calculator tool (7 commands)
plugin/                            # Claude plugin: settings.json, hooks/, skills/ (17), context/ (13)
tests/                             # Vitest — 18 test files, clinical logic only, no UI rendering
scripts/                           # bump-version.sh, generate-registry.mjs
hooks/                             # Git hooks: privacy-guard, qa-reminder, track-workflow, validate-fetch
.patterns/                         # Reusable guides: new-module checklist, medprotocol CLI
```

### Component Modules (12)

| Module | Key Files | Data Flow |
|--------|-----------|-----------|
| vital-signs | Main + 5 sign inputs, edit, alert, FHIR, hooks, validations | Bidirectional (data + onData) |
| sepsis | sepsis-monitor.tsx (829 lines, SOFA/qSOFA/hour-1 bundle) | Bidirectional |
| dka | dka-monitor.tsx (ABG integration) | Bidirectional |
| acid-base | acid-base.tsx, analyze.ts, popup.tsx | Output only (onData) |
| bmi | bmi-calculator.tsx (imperial/metric) | Self-contained |
| water-balance | water-balance.tsx (intake/output tracker) | Input only (data) |
| pafi | pafi-calculator.tsx (PaO2/FiO2, ARDS) | Self-contained |
| cardiology | Tabs: ASCVD, HEART, CHA₂DS₂-VASc | Self-contained |
| clinical-notes | Editor orchestrator, patient details, clock, prev-evolutions, references | Self-contained |
| timeline | Scrollable clinical events with popovers | Input only |
| telemonitoring | pulse-oximetry.tsx + simulator | Input only |
| shared | medical-disclaimer.tsx, layout-disclaimer.tsx, error-boundary.tsx | — |

## Key Details

- **Target stack:** React 19, Next.js (app router), shadcn/ui v4+, Tailwind, TypeScript
- **No production deps** — devDependencies only (typescript, vitest)
- **CDN:** 1h cache, CORS `*` (`vercel.json`)
- **Component docs:** JSDoc headers in TSX + `manifest.json` as canonical registry
- **Testing:** Logic-only via Vitest; UI QA via agent-browser (workflows/agent-qa.md)
- **Plugin:** 17 skills with SKILL.md + reference docs, 4 hooks (privacy, QA, workflow tracking, fetch validation), 13 context files
- **Version:** 0.4.0 (synced across package.json, both manifests, medprotocol/package.json, plugin.json)

## Patterns

- **Card + absolute popups:** Add `overflow-visible` to Card className (default clips). Applies to parent Cards too.
- **Popup positions:** Edit: `absolute bottom-10`; Alerts: `absolute bottom-[-22px]`; Overlays: `absolute top-12 z-50`; Calculator results: inline flow only (never `absolute bottom-*`). Portal-based components (Popover, AlertDialog, Drawer) need no fix.
- **Parent-child data:** Props down, callbacks up. Use `useRef` to skip no-op updates and prevent circular render loops.
- **New module:** 4 steps in [`.patterns/new-module/new-module.md`](.patterns/new-module/new-module.md) — skip any and it's invisible at runtime.
