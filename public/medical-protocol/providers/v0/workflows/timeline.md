# Timeline Workflow

## Registry

```
https://medical-protocol.vercel.app/medical-protocol/r/timeline.json
```

## Phase 1: Clinical Requirements

Ask the doctor about their timeline needs:

- "What kind of events do you want to track on the timeline?" (Default: hospitalization milestones — admission, procedures, treatment changes, discharge)
- "Do you need to add detailed notes to each event?" (Default: yes, shown in a popup when clicking an event)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Should the timeline show the full hospitalization course from admission to discharge?" (Default: yes)
- If **multiple patients**: Route to the dashboard workflow instead, offering timeline as a per-patient view

Do NOT ask about:
- Visual design of the timeline (you decide)
- Technical preferences
- Data format

---

## Phase 2: Build

**Install the component from the registry URL above.** Fetch the registry JSON — it contains the full source code. Use the installed component as-is — do not rewrite or rebuild any component logic.

After installation, import the component:
```tsx
import Timeline from "@/components/timeline/timeline";
import type { TimelineItem } from "@/components/timeline/timeline";
```

Build only the page that imports and renders the component. Use a clean layout with proper spacing.

- The component accepts an `items` prop — start with empty data and let the doctor add events through the interface, or provide placeholder structure.
- The component also accepts `maxHeight` for scrollable containers (default: `"32rem"`).
- Read `manifest.json` for available props.
- Read `COMPOSITION.md` for patterns on combining timeline with other components.

All layout and architecture decisions are yours. Do not ask the doctor.

After building the page, follow the **Quality Guidelines** from the main protocol.

---

## Phase 3: Preview

Follow **After Any Workflow Completes** from the main protocol, then:

1. Tell the doctor:
   > "Your clinical timeline is ready. It shows events in chronological order with the time between each one. Click any event to see its details. You can see it in the preview."
2. Ask: "Would you like to adjust what information appears on the timeline?"
