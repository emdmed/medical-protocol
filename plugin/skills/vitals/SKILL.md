---
name: vitals
description: "[Internal] Build a vital signs monitor — blood pressure, heart rate, SpO2, temperature, respiratory rate"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/core.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/component-fetching.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/hook-markers.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/after-workflow.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/clinical-context.md
Read when needed: ${CLAUDE_PLUGIN_ROOT}/skills/vitals/reference/normal-ranges.md
Read when needed: ${CLAUDE_PLUGIN_ROOT}/skills/vitals/reference/critical-values.md
Read when needed: ${CLAUDE_PLUGIN_ROOT}/skills/vitals/reference/pediatric-ranges.md

## Component

- **Manifest entry:** `vital-signs`
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

### Setting-Aware

- **Admitted patients**: "Continuous monitoring with alerts, or manual entry during rounds?" (Default: manual)
- **Private practice**: "Record vitals during the visit, or also review past readings?" (Default: record only)

**FHIR support**: Include silently. Do NOT ask about layout, colors, or storage.

## NEVER
- Display vital sign values without units (always show mmHg, bpm, °F/°C, %, breaths/min)
- Use color alone to indicate abnormal values — always include text labels
- Show "normal" ranges without citing the source (adult vs pediatric vs geriatric)
- Default to metric if doctor's context specifies imperial, or vice versa
- Suppress alerts for critical values (e.g., systolic >180 or <90)
