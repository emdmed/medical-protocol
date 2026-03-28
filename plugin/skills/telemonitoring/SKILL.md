---
name: telemonitoring
description: "[Internal] Build a pulse oximetry monitor — real-time heart rate and SpO2 display with animated heartbeat"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.

You are building a pulse oximetry monitor for a healthcare professional. Follow the phases below exactly.

## Initial Clarification

If the doctor's request is vague, ask these three questions in a single conversational message (skip if answers are already clear):

1. **Patient setting** — "What type of patients is this for?" (in/out patients in private practice, admitted patients, or both). Default: private practice.
2. **Single vs multiple patients** — "Will you work with one patient at a time, or manage a list?" Default: one at a time.
3. **Data persistence** — "Should the system remember data between sessions?" Default: yes (stored locally).

## Phase 1: Clinical Requirements

Ask the doctor about their monitoring needs:

- "Do you need a real-time pulse oximetry display with heart rate and SpO₂?" (Default: yes)
- "Is this for live monitoring of a connected device, or a visual display for manual readings?" (Default: visual display — the simulator provides a realistic animated preview)

### Setting-Aware Questions

- If **admitted patients**: "Do you want alerts when readings go outside normal range?" (Default: yes)
- If **multiple patients**: Route to the dashboard workflow instead, offering telemonitoring as one of the dashboard widgets

Do NOT ask about device connectivity, technical preferences, or animation/design choices.

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

4. Read the `telemonitoring` entry from the manifest

5. Fetch each file listed in `manifest["telemonitoring"].files` following the **Component Fetching Process** in the protocol context

6. Install shadcn components listed in `manifest["telemonitoring"].shadcn` (if any)

Do not tell the doctor about any of these steps.

## Phase 3: Build Page

1. Create `app/telemonitoring/page.tsx` importing either:
   - `PulseOximetrySimulator` — for demo/preview mode with animated readings
   - `PulseOximetry` — for integration with actual data sources (pass `bpm`, `spo2`, `isBeating` props)
2. Wrap in `ErrorBoundary`
3. For the simulator, provide reasonable default ranges (e.g., `minBpm={60}`, `maxBpm={100}`, `minSpo2={94}`, `maxSpo2={99}`)
4. Update the home page (`app/page.tsx`) to include a link to `/telemonitoring`

All layout and architecture decisions are yours. Do not ask the doctor.

## Phase 4: Quality & Preview

1. Run the **Quality Checklist** from the protocol context silently — review theming, responsiveness, error boundaries, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your pulse oximetry monitor is ready. It shows real-time heart rate and oxygen saturation with a visual heartbeat indicator. View it at http://localhost:3000/telemonitoring"
4. Ask: "Would you like to adjust the display or alert thresholds?"
