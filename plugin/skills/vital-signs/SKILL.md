---
name: vital-signs
description: "Build a vital signs monitor — blood pressure, heart rate, SpO2, temperature, respiratory rate"
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
Read when needed: reference/normal-ranges.md
Read when needed: reference/critical-values.md
Read when needed: reference/pediatric-ranges.md
medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever the docs say `medprotocol`

## Build

- **Clinical logic:** `@/lib/medprotocol/vital-signs-validations/*` — copy it first (building.md §1)
- **Component folder:** `components/medprotocol/vital-signs/` — main file `vital-signs.tsx`, built with UI SDK (building.md §2–3)
- **Route:** `app/vital-signs/page.tsx`
- **Preview message:** "Your vital signs monitor is ready. It tracks [list signs]. View it at http://localhost:3000/vital-signs"

## Phase 1: Clinical Requirements

Ask which vital signs to monitor:

- Blood pressure (systolic/diastolic)
- Heart rate (pulse)
- Blood oxygen saturation (SpO2)
- Body temperature
- Respiratory rate

**Default: all five.** Ask: "Would you like alerts for abnormal ranges?" (Default: yes)

### Setting the prototype imagines

- **Hospital ward**: "Should the prototype imagine continuous monitoring with alerts, or manual entry during rounds?" (Default: manual)
- **Clinic visits**: "Record vitals during the visit, or also review past readings?" (Default: record only)

**FHIR**: leave it out. Build the FHIR bundle only if the user asks, as a way to learn the format. Do NOT ask about layout, colors, or storage.

## NEVER
- Display vital sign values without units (always show mmHg, bpm, °F/°C, %, breaths/min)
- Use color alone to indicate abnormal values — always include text labels
- Show "normal" ranges without citing the source (adult vs pediatric vs geriatric)
- Default to metric if user's context specifies imperial, or vice versa
- Suppress alerts for critical values (e.g., systolic >180 or <90)
