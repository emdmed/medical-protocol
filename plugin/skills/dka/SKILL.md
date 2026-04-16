---
name: dka
description: "[Internal] Build a DKA monitoring module — hourly tracking of glucose, ketones, potassium, insulin, GCS, urine output with resolution criteria"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/core.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/component-fetching.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/hook-markers.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/after-workflow.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/clinical-context.md
Read when needed: ${CLAUDE_PLUGIN_ROOT}/skills/dka/reference/resolution-criteria.md
Read when needed: ${CLAUDE_PLUGIN_ROOT}/skills/dka/reference/insulin-protocol.md
Read when needed: ${CLAUDE_PLUGIN_ROOT}/skills/dka/reference/potassium-management.md

## Component

- **Manifest entry:** `dka`
- **Route:** `app/dka/page.tsx`
- **Dependencies:** Also install `acid-base` via `npx medical-ui-cli add acid-base` (DKA uses it for blood gas analysis on every reading)
- **Preview message:** "Your DKA monitoring tool is ready. You can set the patient's weight, choose glucose units, and add hourly readings. It tracks glucose reduction rates, resolution criteria, potassium levels, and alerts you to GCS changes. View it at http://localhost:3000/dka"

## Phase 1: Clinical Requirements

- "Do you prefer glucose in mg/dL or mmol/L?" (Default: mg/dL)
- "Which parameters do you want to track hourly?" Present options:
  - Glucose + ketones (minimum)
  - Glucose, ketones, bicarbonate, pH, potassium (standard DKA protocol)
  - All: glucose, ketones, bicarbonate, pH, potassium, insulin rate, GCS, urine output (full ICU-level tracking)
  - Default: standard DKA protocol

### Setting-Aware

- **Admitted patients** (default for DKA): Full parameter set recommended — include GCS for cerebral edema detection and urine output for kidney function
- **Multiple patients**: Route to the dashboard workflow instead, offering DKA as a dashboard widget

Do NOT ask about formulas, resolution criteria details, or technical preferences.

## NEVER
- Omit potassium tracking — hypokalemia during insulin therapy is life-threatening
- Show glucose reduction rate without the time interval
- Mark DKA as "resolved" without checking ALL resolution criteria (pH >7.3, HCO3 >15, AG <12)
- Hide GCS tracking for admitted patients — cerebral edema detection requires it
- Allow insulin dose changes without displaying current glucose trend
