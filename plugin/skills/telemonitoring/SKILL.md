---
name: telemonitoring
description: "[Internal] Build a pulse oximetry monitor — real-time heart rate and SpO2 display with animated heartbeat"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/core.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/component-fetching.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/hook-markers.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/after-workflow.md

## Component

- **Manifest entry:** `telemonitoring`
- **Route:** `app/telemonitoring/page.tsx`
- **Preview message:** "Your pulse oximetry monitor is ready. It shows real-time heart rate and oxygen saturation with a visual heartbeat indicator. View it at http://localhost:3000/telemonitoring"

## Phase 1: Clinical Requirements

- "Do you need a real-time pulse oximetry display with heart rate and SpO₂?" (Default: yes)
- "Is this for live monitoring of a connected device, or a visual display for manual readings?" (Default: visual display — the simulator provides a realistic animated preview)

### Setting-Aware

- **Admitted patients**: "Do you want alerts when readings go outside normal range?" (Default: yes)
- **Multiple patients**: Route to the dashboard workflow instead, offering telemonitoring as a dashboard widget

Do NOT ask about device connectivity, technical preferences, or animation/design choices.
