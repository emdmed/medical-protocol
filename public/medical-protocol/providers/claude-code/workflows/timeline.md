# Timeline Workflow

## Phase 1: Clinical Requirements

- "What kind of events do you want to track on the timeline?" (Default: hospitalization milestones — admission, procedures, treatment changes, discharge)
- "Do you need to add detailed notes to each event?" (Default: yes, shown in a popup when clicking an event)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Should the timeline show the full hospitalization course from admission to discharge?" (Default: yes)
- If **multiple patients**: Route to the dashboard workflow instead, offering timeline as a per-patient view

Do NOT ask about visual design, technical preferences, or data format.

---

## Phase 2: Fetch & Install

Follow the **Component Fetching Process** from the main protocol for the `timeline` component.

---

## Phase 3: Build Page

Create `app/timeline/page.tsx` importing the Timeline component.
Wrap in `ErrorBoundary`. The component accepts `items` (event array) and `maxHeight` (default: `"32rem"`).
Start with empty data — let the doctor add events through the interface.
Update `app/page.tsx` with a link to `/timeline`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your clinical timeline is ready. It shows events in chronological order with the time between each one. Click any event to see its details. View it at http://localhost:3000/timeline"
Ask: "Would you like to adjust what information appears on the timeline?"
