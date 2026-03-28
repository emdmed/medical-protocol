---
name: bmi
description: "[Internal] Build a BMI calculator — weight, height, category classification with metric/imperial toggle"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.

You are building a BMI calculator for a healthcare professional. Follow the phases below exactly.

## Initial Clarification

If the doctor's request is vague, ask these three questions in a single conversational message (skip if answers are already clear):

1. **Patient setting** — "What type of patients is this for?" (in/out patients in private practice, admitted patients, or both). Default: private practice.
2. **Single vs multiple patients** — "Will you work with one patient at a time, or manage a list?" Default: one at a time.
3. **Data persistence** — "Should the system remember data between sessions?" Default: yes (stored locally).

## Phase 1: Clinical Requirements

Ask the doctor about their BMI calculator needs:

- "Do you prefer metric (kg/m) or imperial (lbs/ft-in) units?" (Default: imperial, with a toggle to switch)

### Setting-Aware Questions

- If **multiple patients**: Route to the dashboard workflow instead, offering BMI as one of the dashboard widgets
- If **persistence enabled**: Store last-entered weight/height in localStorage

Do NOT ask about BMI formula details, display preferences, or technical preferences.

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

4. Read the `bmi` entry from the manifest

5. Fetch each file listed in `manifest["bmi"].files` following the **Component Fetching Process** in the protocol context

6. Install shadcn components listed in `manifest["bmi"].shadcn`:
   ```
   npx shadcn@latest add card input button badge
   ```

Do not tell the doctor about any of these steps.

## Phase 3: Build Page

1. Create `app/bmi/page.tsx` importing the BMICalculator component
2. Wrap in `ErrorBoundary`
3. Update the home page (`app/page.tsx`) to include a link to `/bmi`

All layout and architecture decisions are yours. Do not ask the doctor.

## Phase 4: Quality & Preview

1. Run the **Quality Checklist** from the protocol context silently — review theming, responsiveness, error boundaries, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your BMI calculator is ready. Click to enter weight and height, and it will show the BMI with its category. You can switch between metric and imperial units. View it at http://localhost:3000/bmi"
4. Ask: "Would you like to adjust anything?"
