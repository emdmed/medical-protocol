---
name: pafi
description: "[Internal] Build a PaFi calculator — PaO2/FiO2 ratio with ARDS classification and FiO2 presets"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/core.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/component-fetching.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/hook-markers.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/after-workflow.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/clinical-context.md
Read when needed: ${CLAUDE_PLUGIN_ROOT}/skills/pafi/reference/ards-berlin-criteria.md
Read when needed: ${CLAUDE_PLUGIN_ROOT}/skills/pafi/reference/ventilation-targets.md

## Component

- **Manifest entry:** `pafi`
- **Route:** `app/pafi/page.tsx`
- **Preview message:** "Your PaFi calculator is ready. Enter PaO2 and FiO2 values to get the PaO2/FiO2 ratio with ARDS classification. You can use the FiO2 presets for common oxygen levels. View it at http://localhost:3000/pafi"

## Phase 1: Clinical Requirements

- "Will you be entering PaO2 and FiO2 values manually?" (Default: yes, manual entry)

### Setting-Aware

- **Admitted patients**: "Do you typically work with patients on supplemental oxygen or mechanical ventilation?" — helps decide default FiO2
- **Multiple patients**: Route to the dashboard workflow instead, offering PaFi as a dashboard widget

Do NOT ask about ARDS classification details, formulas, or technical preferences.

## NEVER
- Classify ARDS severity without confirming bilateral infiltrates and timing
- Show PaO2/FiO2 ratio without the FiO2 value used
- Use SpO2 as a substitute for PaO2 without flagging it as estimated
- Omit PEEP value when classifying ARDS severity (Berlin criteria require PEEP ≥5)
