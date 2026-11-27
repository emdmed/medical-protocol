---
name: water-balance
description: "[Internal] Build a fluid balance tracker — intake, output, insensible losses, net balance calculation"
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

## Build

- **Clinical logic:** `@/lib/medprotocol/water-balance` — copy it first (building.md §1)
- **Component folder:** `components/medprotocol/water-balance/` — main file `water-balance.tsx`, built with UI SDK (building.md §2–3)
- **Route:** `app/water-balance/page.tsx`
- **Preview message:** "Your fluid balance tracker is ready. Enter the patient's weight, fluid intake (oral and IV), urine output, and stool count — it calculates the net balance including insensible losses. View it at http://localhost:3000/water-balance"

## Phase 1: Clinical Requirements

- "Do you need to track oral and IV intake separately?" (Default: yes)
- "Do you need insensible loss calculations based on patient weight?" (Default: yes)

### Setting-Aware

- **Hospital ward**: "Track fluid balance per shift or per 24 hours?" (Default: per 24 hours)
- **A list of patients**: Route to the dashboard workflow instead, offering water balance as a dashboard widget

Do NOT ask about calculation formulas, display preferences, or technical preferences.

## NEVER
- Calculate fluid balance without including insensible losses
- Show intake without output in the same view — balance requires both
- Omit body weight when it affects fluid calculations
- Display cumulative balance without hourly/per-shift breakdown option
