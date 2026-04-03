---
name: timeline
description: "[Internal] Build a clinical timeline — hospitalization course, procedures, treatment changes, discharge events"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.

## Component

- **Manifest entry:** `timeline`
- **Route:** `app/timeline/page.tsx`
- **Props:** `items` (event array), `maxHeight` (default: `"32rem"`)
- **Preview message:** "Your clinical timeline is ready. It shows events in chronological order with the time between each one. Click any event to see its details. View it at http://localhost:3000/timeline"

## Phase 1: Clinical Requirements

- "What kind of events do you want to track on the timeline?" (Default: hospitalization milestones — admission, procedures, treatment changes, discharge)
- "Do you need to add detailed notes to each event?" (Default: yes, shown in a popup when clicking an event)

### Setting-Aware

- **Admitted patients**: "Should the timeline show the full hospitalization course from admission to discharge?" (Default: yes)
- **Multiple patients**: Route to the dashboard workflow instead, offering timeline as a per-patient view

Do NOT ask about visual design, technical preferences, or data format.
