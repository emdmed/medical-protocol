---
name: dka
description: "[Internal] Build a DKA monitoring module — hourly tracking of glucose, ketones, potassium, insulin, GCS, urine output with resolution criteria"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.

You are building a DKA (Diabetic Ketoacidosis) monitoring module for a healthcare professional. Follow the phases below exactly.

## Initial Clarification

If the doctor's request is vague, ask these three questions in a single conversational message (skip if answers are already clear):

1. **Patient setting** — "What type of patients is this for?" (in/out patients in private practice, admitted patients, or both). Default: admitted patients (DKA is typically managed inpatient).
2. **Single vs multiple patients** — "Will you work with one patient at a time, or manage a list?" Default: one at a time.
3. **Data persistence** — "Should the system remember data between sessions?" Default: yes (stored locally).

## Phase 1: Clinical Requirements

Ask the doctor about their DKA monitoring needs:

- "Do you prefer glucose in mg/dL or mmol/L?" (Default: mg/dL)
- "Which parameters do you want to track hourly?" Present options:
  - Glucose + ketones (minimum)
  - Glucose, ketones, bicarbonate, pH, potassium (standard DKA protocol)
  - All: glucose, ketones, bicarbonate, pH, potassium, insulin rate, GCS, urine output (full ICU-level tracking)
  - Default: standard DKA protocol

### Setting-Aware Questions

- If **admitted patients**: The full parameter set is recommended — include GCS monitoring for cerebral edema detection and urine output for kidney function
- If **multiple patients**: Route to the dashboard workflow instead, offering DKA as one of the dashboard widgets

Do NOT ask about formulas, resolution criteria details, or technical preferences.

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

4. Read the `dka` entry from the manifest

5. Fetch each file listed in `manifest["dka"].files` following the **Component Fetching Process** in the protocol context

6. Install shadcn components listed in `manifest["dka"].shadcn`:
   ```
   npx shadcn@latest add card input button badge label separator
   ```

Do not tell the doctor about any of these steps.

## Phase 3: Build Page

1. Create `app/dka/page.tsx` importing the DKAMonitor component
2. Wrap in `ErrorBoundary`
3. Provide an `onData` callback to persist readings if persistence is enabled
4. Update the home page (`app/page.tsx`) to include a link to `/dka`

All layout and architecture decisions are yours. Do not ask the doctor.

## Phase 4: Quality & Preview

1. Run the **Quality Checklist** from the protocol context silently — review theming, responsiveness, error boundaries, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your DKA monitoring tool is ready. You can set the patient's weight, choose glucose units, and add hourly readings. It will track glucose reduction rates, resolution criteria, potassium levels, and alert you to GCS changes. View it at http://localhost:3000/dka"
4. Ask: "Would you like to adjust anything about the monitoring parameters?"
