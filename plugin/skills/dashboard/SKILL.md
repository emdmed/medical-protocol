---
name: dashboard
description: "[Internal] Build a combined clinical dashboard — pick building blocks and compose them into one view"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
user-invocable: true
---

Read and follow: reference/core.md
Read and follow: reference/building.md
Read and follow: reference/hook-markers.md
Read and follow: reference/after-workflow.md
Read and follow: reference/clinical-context.md
Clinical logic source: ${CLAUDE_SKILL_DIR}/../../lib
Module docs: ${CLAUDE_SKILL_DIR}/../start/reference/context — each module's `{module}.md` (functions, thresholds, Screen spec)
medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever the docs say `medprotocol`
Also `Read` from `reference/composition.md` for component integration patterns and gotchas.

## Build

- **Clinical logic:** copy it first (building.md §1); each block imports its module from `@/lib/medprotocol/<module>` (module per block in `components.md`)
- **Component folders:** one per block, `components/medprotocol/<module>/`, built with UI SDK (building.md §2–3). Reuse any block that already exists.
- **Available blocks:** `vital-signs`, `acid-base`, `bmi`, `water-balance`, `pafi`, `dka`, `cardiology`, `sepsis`, `ckd`, `nephrology`
- **Route:** `app/dashboard/page.tsx`
- **Composition guide:** `Read` from `reference/composition.md` for integration patterns and known gotchas (overflow clipping, circular updates, null guards)
- **Preview message:** "Your clinical dashboard is ready with [list selected blocks]. View it at http://localhost:3000/dashboard"

## Phase 1: Clinical Requirements

Present the available building blocks by category:

- "Which of these blocks would you like on your dashboard?"

  **Monitoring** — Vital signs (BP, HR, RR, Temp, SpO2)

  **Calculators** — Blood gas / acid-base analyzer · BMI calculator · Fluid balance (water balance / I&O) · PaFi calculator (PaO2/FiO2 ratio with Berlin oxygenation range) · Cardiology risk scores (ASCVD, HEART, CHA₂DS₂-VASc)

  **Nephrology** — CKD evaluator (eGFR, KDIGO staging, KFRE, progression) · Nephrology companion (anemia, CKD-MBD, cardio-metabolic)

  **Critical Care** — DKA monitoring (hourly glucose, ketones, potassium, insulin, GCS tracking) · Sepsis assessment (SOFA, qSOFA, lactate clearance)

  Default: vital signs + acid-base

- "Is this for a single patient view or a clinic overview?" (Default: single patient)

### Setting the prototype imagines

- **Hospital ward**: "Do you want the dashboard to highlight synthetic patients with abnormal readings?" (Default: yes)

Do NOT ask about layout arrangement, navigation structure, or technical preferences.

## Build Notes

- Layout: responsive grid `grid-cols-1 lg:grid-cols-2 gap-6`
- Smaller widgets (acid-base, BMI, water-balance) work well grouped together
- Check each block's dependencies in `components.md` (e.g. DKA needs acid-base, sepsis needs vital-signs and water-balance) and build those blocks too
- Update home page to redirect to `/dashboard`

## NEVER
- **Fetch workflow files for individual blocks** — blocks are generated per building.md. There are no per-block workflow files to download.
- Combine components without testing that their data flows don't conflict
- Hide component errors — always show which block has an issue
- Use different unit systems across blocks in the same dashboard
- Remove a block without confirming with the user first
