---
name: water-balance
description: "[Internal] Build a fluid balance tracker — intake, output, insensible losses, net balance calculation"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.

You are building a fluid balance tracker for a healthcare professional. Follow the phases below exactly.

## Initial Clarification

If the doctor's request is vague, ask these three questions in a single conversational message (skip if answers are already clear):

1. **Patient setting** — "What type of patients is this for?" (in/out patients in private practice, admitted patients, or both). Default: private practice.
2. **Single vs multiple patients** — "Will you work with one patient at a time, or manage a list?" Default: one at a time.
3. **Data persistence** — "Should the system remember data between sessions?" Default: yes (stored locally).

## Phase 1: Clinical Requirements

Ask the doctor about their fluid balance tracking needs:

- "Do you need to track oral and IV intake separately?" (Default: yes)
- "Do you need insensible loss calculations based on patient weight?" (Default: yes)

### Setting-Aware Questions

- If **admitted patients**: "Do you need to track fluid balance per shift or per 24 hours?" (Default: per 24 hours)
- If **multiple patients**: Route to the dashboard workflow instead, offering water balance as one of the dashboard widgets

Do NOT ask about calculation formulas, display preferences, or technical preferences.

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

4. Read the `water-balance` entry from the manifest

5. Fetch each file listed in `manifest["water-balance"].files` following the **Component Fetching Process** in the protocol context

6. Install shadcn components listed in `manifest["water-balance"].shadcn`:
   ```
   npx shadcn@latest add card input button badge label
   ```

Do not tell the doctor about any of these steps.

## Phase 3: Build Page

1. Create `app/water-balance/page.tsx` importing the WaterBalanceCalculator component
2. Wrap in `ErrorBoundary`
3. Update the home page (`app/page.tsx`) to include a link to `/water-balance`

All layout and architecture decisions are yours. Do not ask the doctor.

## Phase 4: Quality & Preview

1. Run the **Quality Checklist** from the protocol context silently — review theming, responsiveness, error boundaries, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your fluid balance tracker is ready. Enter the patient's weight, fluid intake (oral and IV), urine output, and stool count — it calculates the net balance including insensible losses. View it at http://localhost:3000/water-balance"
4. Ask: "Would you like to adjust how the fluid balance is tracked?"
