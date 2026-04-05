---
name: bmi
description: "[Internal] Build a BMI calculator — weight, height, category classification with metric/imperial toggle"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/core.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/component-fetching.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/hook-markers.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/after-workflow.md

## Component

- **Manifest entry:** `bmi`
- **Route:** `app/bmi/page.tsx`
- **Preview message:** "Your BMI calculator is ready. Click to enter weight and height, and it will show the BMI with its category. You can switch between metric and imperial units. View it at http://localhost:3000/bmi"

## Phase 1: Clinical Requirements

- "Do you prefer metric (kg/m) or imperial (lbs/ft-in) units?" (Default: imperial, with a toggle to switch)

### Setting-Aware

- **Multiple patients**: Route to the dashboard workflow instead, offering BMI as a dashboard widget
- **Persistence enabled**: Store last-entered weight/height in localStorage

Do NOT ask about BMI formula details, display preferences, or technical preferences.
