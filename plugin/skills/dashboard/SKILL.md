---
name: dashboard
description: "[Internal] Build a combined clinical dashboard — pick building blocks and compose them into one view"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.
Also read ${CLAUDE_PLUGIN_ROOT}/context/composition.md for component integration patterns and gotchas.

## Component

- **Manifest entries:** Multiple — fetch each block the doctor selects from the manifest
- **Available blocks:** `vital-signs`, `clinical-notes`, `acid-base`, `bmi`, `water-balance`, `telemonitoring`, `timeline`, `pafi`, `dka`
- **Route:** `app/dashboard/page.tsx`
- **Composition guide:** Fetch `COMPOSITION.md` for integration patterns and known gotchas (overflow clipping, circular updates, null guards)
- **Preview message:** "Your clinical dashboard is ready with [list selected blocks]. View it at http://localhost:3000/dashboard"

## Phase 1: Clinical Requirements

Present the available building blocks by category:

- "Which of these blocks would you like on your dashboard?"

  **Monitoring** — Vital signs (BP, HR, RR, Temp, SpO2) · Pulse oximetry (real-time animated display)

  **Calculators** — Blood gas / acid-base analyzer · BMI calculator · Fluid balance (water balance / I&O) · PaFi calculator (PaO2/FiO2 ratio with ARDS classification)

  **Critical Care** — DKA monitoring (hourly glucose, ketones, potassium, insulin, GCS tracking)

  **Documentation** — Clinical notes (encounter note editor)

  **Display** — Clinical timeline (hospitalization course)

  Default: vital signs + clinical notes

- "Is this for a single patient view or a clinic overview?" (Default: single patient)

### Setting-Aware

- **Admitted patients**: "Do you want the dashboard to highlight patients with abnormal readings?" (Default: yes)

Do NOT ask about layout arrangement, navigation structure, or technical preferences.

## Build Notes

- Layout: responsive grid `grid-cols-1 lg:grid-cols-2 gap-6`
- Smaller widgets (acid-base, BMI, water-balance) work well grouped together
- Timeline works best as a full-width section or sidebar
- Check `externalComponents` for each manifest entry — some are available as their own manifest entries
- Update home page to redirect to `/dashboard`
