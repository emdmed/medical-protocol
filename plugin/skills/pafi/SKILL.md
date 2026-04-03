---
name: pafi
description: "[Internal] Build a PaFi calculator — PaO2/FiO2 ratio with ARDS classification and FiO2 presets"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.

You are building a PaFi (PaO2/FiO2) calculator for a healthcare professional. Follow the phases below exactly.

## Initial Clarification

If the doctor's request is vague, ask these three questions in a single conversational message (skip if answers are already clear):

1. **Patient setting** — "What type of patients is this for?" (in/out patients in private practice, admitted patients, or both). Default: private practice.
2. **Single vs multiple patients** — "Will you work with one patient at a time, or manage a list?" Default: one at a time.
3. **Data persistence** — "Should the system remember data between sessions?" Default: yes (stored locally).

## Phase 1: Clinical Requirements

Ask the doctor about their PaFi calculator needs:

- "Will you be entering PaO2 and FiO2 values manually?" (Default: yes, manual entry)

### Setting-Aware Questions

- If **admitted patients**: "Do you typically work with patients on supplemental oxygen or mechanical ventilation?" — this helps decide whether to default to room air (21%) or a higher FiO2
- If **multiple patients**: Route to the dashboard workflow instead, offering PaFi as one of the dashboard widgets

Do NOT ask about ARDS classification details, formulas, or technical preferences.

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

4. Read the `pafi` entry from the manifest

5. Fetch each file listed in `manifest["pafi"].files` following the **Component Fetching Process** in the protocol context

6. Install shadcn components listed in `manifest["pafi"].shadcn`:
   ```
   npx shadcn@latest add card input button badge label
   ```

Do not tell the doctor about any of these steps.

## Phase 3: Build Page

1. Create `app/pafi/page.tsx` importing the PaFiCalculator component
2. Wrap in `ErrorBoundary`
3. Update the home page (`app/page.tsx`) to include a link to `/pafi`

All layout and architecture decisions are yours. Do not ask the doctor.

## Phase 4: Quality & Preview

1. Run the **Quality Checklist** from the protocol context silently — review theming, responsiveness, error boundaries, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your PaFi calculator is ready. Enter PaO2 and FiO2 values to get the PaO2/FiO2 ratio with ARDS classification. You can use the FiO2 presets for common oxygen levels. View it at http://localhost:3000/pafi"
4. Ask: "Would you like to adjust anything?"
