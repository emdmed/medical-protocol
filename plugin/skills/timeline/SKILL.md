---
name: timeline
description: "[Internal] Build a clinical timeline — hospitalization course, procedures, treatment changes, discharge events"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.

You are building a clinical timeline for a healthcare professional. Follow the phases below exactly.

## Initial Clarification

If the doctor's request is vague, ask these three questions in a single conversational message (skip if answers are already clear):

1. **Patient setting** — "What type of patients is this for?" (in/out patients in private practice, admitted patients, or both). Default: private practice.
2. **Single vs multiple patients** — "Will you work with one patient at a time, or manage a list?" Default: one at a time.
3. **Data persistence** — "Should the system remember data between sessions?" Default: yes (stored locally).

## Phase 1: Clinical Requirements

Ask the doctor about their timeline needs:

- "What kind of events do you want to track on the timeline?" (Default: hospitalization milestones — admission, procedures, treatment changes, discharge)
- "Do you need to add detailed notes to each event?" (Default: yes, shown in a popup when clicking an event)

### Setting-Aware Questions

- If **admitted patients**: "Should the timeline show the full hospitalization course from admission to discharge?" (Default: yes)
- If **multiple patients**: Route to the dashboard workflow instead, offering timeline as a per-patient view

Do NOT ask about visual design, technical preferences, or data format.

## Phase 2: Fetch & Install Components

Silently perform all of the following:

1. Run the **Project Check** from the protocol context (scaffold Next.js + shadcn if needed)

2. Set the workflow marker:
   ```
   mkdir -p .claude/hooks-state && touch .claude/hooks-state/.workflow_active
   ```

3. Fetch the component manifest:
   ```
   WebFetch: {CDN_BASE}/components/manifest.json
   ```

4. Read the `timeline` entry from the manifest

5. Fetch each file listed in `manifest["timeline"].files` following the **Component Fetching Process** in the protocol context

6. Install shadcn components listed in `manifest["timeline"].shadcn`:
   ```
   npx shadcn@latest add button popover badge
   ```

Do not tell the doctor about any of these steps.

## Phase 3: Build Page

1. Create `app/timeline/page.tsx` importing the Timeline component
2. Wrap in `ErrorBoundary`
3. The component accepts an `items` prop — start with empty data and let the doctor add events through the interface, or provide placeholder structure
4. The component also accepts `maxHeight` for scrollable containers (default: `"32rem"`)
5. Update the home page (`app/page.tsx`) to include a link to `/timeline`

All layout and architecture decisions are yours. Do not ask the doctor.

## Phase 4: Quality & Preview

1. Run the **Quality Checklist** from the protocol context silently — review theming, responsiveness, error boundaries, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your clinical timeline is ready. It shows events in chronological order with the time between each one. Click any event to see its details. View it at http://localhost:3000/timeline"
4. Ask: "Would you like to adjust what information appears on the timeline?"
