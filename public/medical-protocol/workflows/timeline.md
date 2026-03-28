# Timeline Workflow

> `{CDN_BASE}` refers to `https://medical-protocol.vercel.app/medical-protocol` (defined in the main protocol).

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

## Phase 2: Fetch & Install Components

Silently perform all of the following:

1. Run the **Project Check** from the main protocol (scaffold Next.js + shadcn if needed)

2. **Fetch the component manifest:**
   ```
   WebFetch: {CDN_BASE}/components/manifest.json
   ```

3. **Read the `timeline` entry** from the manifest

4. **Fetch each file** listed in `manifest["timeline"].files` following the **Component Fetching Process** in the main protocol

5. **Install shadcn components** listed in `manifest["timeline"].shadcn`:
   ```
   npx shadcn@latest add {manifest["timeline"].shadcn joined by spaces}
   ```

Do not tell the doctor about any of these steps.

---

## Phase 3: Build Page

1. **Create `app/timeline/page.tsx`** importing the Timeline component
2. Wrap in `ErrorBoundary`
3. The component accepts an `items` prop — start with empty data and let the doctor add events through the interface, or provide placeholder structure
4. The component also accepts `maxHeight` for scrollable containers (default: `"32rem"`)
5. **Update the home page** (`app/page.tsx`) to include a link to `/timeline`

All layout and architecture decisions are yours. Do not ask the doctor.

---

## Phase 4: Quality & Preview

1. **Run the Quality Checklist** from the main protocol — silently review theming, responsiveness, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your clinical timeline is ready. It shows events in chronological order with the time between each one. Click any event to see its details. View it at http://localhost:3000/timeline"
4. Ask: "Would you like to adjust what information appears on the timeline?"
