---
name: pafi
description: "[Internal] Build a PaFi calculator — PaO2/FiO2 ratio with ARDS classification and FiO2 presets"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.

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
