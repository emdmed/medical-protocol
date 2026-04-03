# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

CDN-hosted medical protocol system for Claude Code. Serves static files via Vercel that Claude Code fetches at runtime. Doctors copy `protocol.md` into `.claude/`, describe clinical needs in plain language, and Claude Code builds everything — no coding required.

**Not a typical web app.** Components live in `public/` (served as static assets via CDN), not in a `src/` directory. There's no build step for production — Vercel serves files directly from `public/`.

## Commands

```bash
npm test                              # Run all ~246 unit tests (Vitest)
npm run test:watch                    # Watch mode
npx vitest run tests/vital-signs/     # Run a single test directory
npx vitest run tests/bmi/bmi.test.ts  # Run a single test file
npm run version:bump 0.4.0            # Bump version in package.json, manifest.json, plugin.json
```

No linter configured. TypeScript strict mode only (`tsconfig.json`).

## Architecture

```
public/medical-protocol/           # CDN deliverable (https://medical-protocol.vercel.app/medical-protocol/)
├── protocol.md                    # Main protocol doctors copy to .claude/
├── components/                    # React component source (TSX)
│   ├── manifest.json              # Component registry with props/data-flow docs
│   ├── COMPOSITION.md             # Usage patterns for combining components
│   ├── vital-signs/               # BP, HR, RR, Temp, SpO2, FiO2
│   ├── acid-base/                 # ABG analyzer
│   ├── bmi/                       # BMI calculator
│   ├── water-balance/             # Fluid intake/output tracker
│   ├── timeline/                  # Clinical timeline with popovers
│   ├── telemonitoring/            # Pulse oximetry animation
│   └── clinical-notes/             # Encounter note editor with highlighting
└── workflows/                     # Doctor-facing workflow docs fetched at runtime

plugin/                            # Claude plugin definition
├── .claude-plugin/plugin.json     # Plugin manifest
├── settings.json                  # Permission whitelist (blocks git push, npm publish)
├── hooks/                         # Pre/post-tool hooks (privacy guard, QA reminder)
├── skills/                        # Medical workflow skills (start, vitals, clinical-notes, etc.)
└── context/                       # Plugin context files

tests/                             # Vitest unit tests for clinical logic
├── __mocks__/                     # Mocks for shadcn UI, hooks, lucide-react
└── [component]/                   # Test files per component
```

## Testing

Tests cover **clinical logic only** (validations, calculations, classifications) — not UI rendering. Vitest aliases mock out shadcn/ui components, hooks, and lucide-react icons so tests run without React DOM.

Test pattern: `tests/**/*.test.ts`

## Key Technical Details

- **Target stack for generated projects:** React 19, Next.js (app router), shadcn/ui v4+, Tailwind CSS, TypeScript
- **No production dependencies** — devDependencies only (typescript, vitest)
- **CDN caching:** 1 hour (3600s) with CORS `*` (configured in `vercel.json`)
- **Component docs:** Each TSX file has a JSDoc header with props, data flow, and popup positioning info. The `manifest.json` is the canonical component registry.

## Patterns to Follow

**shadcn Card + absolute positioning:** Default Card uses `overflow-hidden`. When a Card contains absolutely-positioned popups or overlays, add `overflow-visible` to its className (and any parent Cards wrapping it).

**Popup positioning conventions:**
- Edit popups: `absolute bottom-10` (above inputs)
- Alert badges: `absolute bottom-[-22px]` (below inputs)
- Analysis overlays: `absolute top-12 z-50` (below source card)
- Calculator results (AcidBase): inline flow below inputs — no absolute positioning
- Timeline/Clinical Notes use portal-based shadcn components (Popover, AlertDialog, Drawer) — no overflow fix needed.

**Result overlap prevention:** Calculator result badges must render **below** inputs using inline flow. Never use `absolute bottom-*` to position results above inputs — this overlaps the component title.

**Parent-child data flow:** Components receive data via props and report changes via callbacks. Use `useRef` to track previous values and skip no-op updates to avoid circular render loops.
