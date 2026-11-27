---
name: dka
description: "Build a DKA monitoring module — hourly tracking of glucose, ketones, potassium, insulin, GCS, urine output with resolution criteria"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
user-invocable: false
---

Read and follow: reference/core.md
Read and follow: reference/building.md
Read and follow: reference/hook-markers.md
Read and follow: reference/after-workflow.md
Read and follow: reference/clinical-context.md
Clinical logic source: ${CLAUDE_SKILL_DIR}/../../lib
Module docs: ${CLAUDE_SKILL_DIR}/../start/reference/context — each module's `{module}.md` (functions, thresholds, Screen spec)
Read when needed: reference/resolution-criteria.md
Read when needed: reference/insulin-protocol.md
Read when needed: reference/potassium-management.md
medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever the docs say `medprotocol`

## Build

- **Clinical logic:** `@/lib/medprotocol/dka` + `@/lib/medprotocol/acid-base` — copy it first (building.md §1)
- **Component folder:** `components/medprotocol/dka/` — main file `dka.tsx`, built with UI SDK (building.md §2–3)
- **Route:** `app/dka/page.tsx`
- **Dependencies:** Every reading also runs blood gas analysis through `@/lib/medprotocol/acid-base` — reuse `components/medprotocol/acid-base/` if it exists, otherwise build it
- **Preview message:** "Your DKA monitoring tool is ready. You can set the patient's weight, choose glucose units, and add hourly readings. It tracks glucose reduction rates, resolution criteria, potassium levels, and alerts you to GCS changes. View it at http://localhost:3000/dka"

## Phase 1: Clinical Requirements

- "Do you prefer glucose in mg/dL or mmol/L?" (Default: mg/dL)
- "Which parameters do you want to track hourly?" Present options:
  - Glucose + ketones (minimum)
  - Glucose, ketones, bicarbonate, pH, potassium (standard DKA protocol)
  - All: glucose, ketones, bicarbonate, pH, potassium, insulin rate, GCS, urine output (full ICU-level tracking)
  - Default: standard DKA protocol

### Setting the prototype imagines

- **Hospital ward** (default for DKA): Full parameter set recommended — include GCS for cerebral edema detection and urine output for kidney function
- **A list of patients**: Route to the dashboard workflow instead, offering DKA as a dashboard widget

Do NOT ask about formulas, resolution criteria details, or technical preferences.

## NEVER
- Omit potassium tracking — hypokalemia during insulin therapy is life-threatening
- Show glucose reduction rate without the time interval
- Mark DKA as "resolved" without checking ALL resolution criteria (pH >7.3, HCO3 >15, AG <12)
- Hide GCS tracking for ward cases — cerebral edema detection requires it
- Allow insulin dose changes without displaying current glucose trend
