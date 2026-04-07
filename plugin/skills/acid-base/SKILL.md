---
name: acid-base
description: "[Internal] Build a blood gas analyzer — pH, pCO2, HCO3, anion gap, acid-base interpretation"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/core.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/component-fetching.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/hook-markers.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/after-workflow.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/clinical-context.md
Read when needed: ${CLAUDE_PLUGIN_ROOT}/skills/acid-base/reference/compensation-formulas.md
Read when needed: ${CLAUDE_PLUGIN_ROOT}/skills/acid-base/reference/anion-gap-interpretation.md
Read when needed: ${CLAUDE_PLUGIN_ROOT}/skills/acid-base/reference/mixed-disorders.md

## Component

- **Manifest entry:** `acid-base`
- **Route:** `app/acid-base/page.tsx`
- **Preview message:** "Your blood gas analyzer is ready. Enter pH, pCO₂, and HCO₃ to get an acid-base interpretation. You can also add Na⁺, Cl⁻, and albumin for anion gap analysis. View it at http://localhost:3000/acid-base"

## Cross-Prompt: DKA Monitoring

Before proceeding, ask: "Would you also like to track glucemia and ketones for DKA monitoring?" If yes, after completing this workflow, also read and execute `${CLAUDE_PLUGIN_ROOT}/skills/dka/SKILL.md`.

## Phase 1: Clinical Requirements

Ask the doctor about their blood gas analysis needs:

- "Will you be entering arterial blood gas values manually, or do you need to import them?" (Default: manual entry)
- "Do you need anion gap and delta ratio calculations?" (Default: yes, if Na and Cl are available)

### Setting-Aware

- **Admitted patients**: "Do you typically work with acute or chronic respiratory conditions?" (Default: chronic — affects compensation formulas)
- **Multiple patients**: Route to the dashboard workflow instead, offering acid-base as a dashboard widget

Do NOT ask about technical integrations, display preferences, or formulas.

## NEVER
- Show an acid-base interpretation without displaying the input values used
- Classify a disorder without checking for compensation
- Ignore anion gap when Na⁺ and Cl⁻ are available
- Display pH without at least 2 decimal places
- Skip delta-delta ratio when anion gap is elevated
