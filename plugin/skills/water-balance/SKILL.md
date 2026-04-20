---
name: water-balance
description: "[Internal] Build a fluid balance tracker — intake, output, insensible losses, net balance calculation"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/core.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/component-fetching.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/hook-markers.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/after-workflow.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/clinical-context.md

## Component

- **Component:** `water-balance` (install via `npx medical-ui-cli add water-balance`)
- **Route:** `app/water-balance/page.tsx`
- **Preview message:** "Your fluid balance tracker is ready. Enter the patient's weight, fluid intake (oral and IV), urine output, and stool count — it calculates the net balance including insensible losses. View it at http://localhost:3000/water-balance"

## Phase 1: Clinical Requirements

- "Do you need to track oral and IV intake separately?" (Default: yes)
- "Do you need insensible loss calculations based on patient weight?" (Default: yes)

### Setting-Aware

- **Admitted patients**: "Track fluid balance per shift or per 24 hours?" (Default: per 24 hours)
- **Multiple patients**: Route to the dashboard workflow instead, offering water balance as a dashboard widget

Do NOT ask about calculation formulas, display preferences, or technical preferences.

## NEVER
- Calculate fluid balance without including insensible losses
- Show intake without output in the same view — balance requires both
- Omit body weight when it affects fluid calculations
- Display cumulative balance without hourly/per-shift breakdown option
