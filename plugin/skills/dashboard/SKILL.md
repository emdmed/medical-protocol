---
name: dashboard
description: "[Internal] Build a combined clinical dashboard — pick building blocks and compose them into one view"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/core.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/component-fetching.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/hook-markers.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/after-workflow.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/clinical-context.md
Also read ${CLAUDE_PLUGIN_ROOT}/context/composition.md for component integration patterns and gotchas.

## Component

- **Manifest entries:** Multiple — fetch each block the doctor selects from the manifest
- **Available blocks:** `vital-signs`, `acid-base`, `bmi`, `water-balance`, `pafi`, `dka`, `cardiology`, `sepsis`
- **Route:** `app/dashboard/page.tsx`
- **Composition guide:** Fetch `COMPOSITION.md` for integration patterns and known gotchas (overflow clipping, circular updates, null guards)
- **Preview message:** "Your clinical dashboard is ready with [list selected blocks]. View it at http://localhost:3000/dashboard"

## Phase 1: Clinical Requirements

Present the available building blocks by category:

- "Which of these blocks would you like on your dashboard?"

  **Monitoring** — Vital signs (BP, HR, RR, Temp, SpO2)

  **Calculators** — Blood gas / acid-base analyzer · BMI calculator · Fluid balance (water balance / I&O) · PaFi calculator (PaO2/FiO2 ratio with ARDS classification) · Cardiology risk scores (ASCVD, HEART, CHA₂DS₂-VASc)

  **Critical Care** — DKA monitoring (hourly glucose, ketones, potassium, insulin, GCS tracking) · Sepsis assessment (SOFA, qSOFA, lactate clearance)

  Default: vital signs + acid-base

- "Is this for a single patient view or a clinic overview?" (Default: single patient)

### Setting-Aware

- **Admitted patients**: "Do you want the dashboard to highlight patients with abnormal readings?" (Default: yes)

Do NOT ask about layout arrangement, navigation structure, or technical preferences.

## Build Notes

- Layout: responsive grid `grid-cols-1 lg:grid-cols-2 gap-6`
- Smaller widgets (acid-base, BMI, water-balance) work well grouped together
- Check `externalComponents` for each manifest entry — some are available as their own manifest entries
- Update home page to redirect to `/dashboard`

## NEVER
- Combine components without testing that their data flows don't conflict
- Hide component errors silently — always show which block has an issue
- Use different unit systems across blocks in the same dashboard
- Remove a block without confirming with the doctor first
