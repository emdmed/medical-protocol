---
name: dashboard
description: "[Internal] Build a combined clinical dashboard — pick building blocks and compose them into one view"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.
Also read ${CLAUDE_PLUGIN_ROOT}/context/composition.md for component integration patterns and gotchas.

You are building a combined clinical dashboard for a healthcare professional. Follow the phases below exactly.

## Initial Clarification

If the doctor's request is vague, ask these questions in a single conversational message (skip if answers are already clear):

1. **Patient setting** — "What type of patients is this for?" (in/out patients in private practice, admitted patients, or both). Default: private practice.
2. **Data persistence** — "Should the system remember data between sessions?" Default: yes (stored locally).

## Phase 1: Clinical Requirements

The doctor wants a combined clinical dashboard. Present the available building blocks by category and ask which they'd like:

- "Which of these blocks would you like on your dashboard?"

  **Monitoring**
  - Vital signs (BP, HR, RR, Temp, SpO2)
  - Pulse oximetry (real-time animated display)

  **Calculators**
  - Blood gas / acid-base analyzer
  - BMI calculator
  - Fluid balance (water balance / I&O)

  **Documentation**
  - Clinical notes (encounter note editor)

  **Display**
  - Clinical timeline (hospitalization course)

  Default: vital signs + clinical notes

- "Is this for a single patient view or a clinic overview?" (Default: single patient)

### Setting-Aware Questions

- If **admitted patients**: "Do you want the dashboard to highlight patients with abnormal readings?" (Default: yes)

Do NOT ask about layout arrangement, navigation structure, or technical preferences.

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

4. For each block the doctor selected, follow the **Component Fetching Process** in the protocol context. All of the following are available in the manifest:
   - `vital-signs` → `{project}/components/vital-signs/`
   - `clinical-notes` → `{project}/components/clinical-notes/`
   - `acid-base` → `{project}/components/acid-base/`
   - `bmi` → `{project}/components/bmi/`
   - `water-balance` → `{project}/components/water-balance/`
   - `telemonitoring` → `{project}/components/telemonitoring/`
   - `timeline` → `{project}/components/timeline/`

5. Check `externalComponents` for each manifest entry — some external imports may now be available as their own manifest entries. Fetch those from the CDN. For remaining external imports not on the CDN, create simplified versions, remove them, or replace as appropriate.

6. Install all shadcn components from the selected manifests (deduplicated):
   ```
   npx shadcn@latest add {combined unique shadcn list}
   ```

7. Read the composition guide from `${CLAUDE_PLUGIN_ROOT}/context/composition.md` for integration patterns and known gotchas (overflow clipping, circular updates, null guards).

Do not tell the doctor about any of these steps.

## Phase 3: Build Page

Create a dashboard page that combines the selected blocks:

1. Create `app/dashboard/page.tsx` with:
   - A header with the clinic/dashboard name
   - Selected blocks arranged in a responsive grid
   - Wrap the entire page in `ErrorBoundary`

2. Layout guidance:
   - Smaller widgets (acid-base, BMI, water-balance) work well grouped together in a single grid cell or flex row
   - The timeline works best as a full-width section or sidebar
   - Use responsive grid: `grid-cols-1 lg:grid-cols-2 gap-6`

3. Update the home page to redirect to `/dashboard`

All layout decisions are yours. Optimize for clinical usability.

## Phase 4: Quality & Preview

1. Run the **Quality Checklist** from the protocol context silently — review theming, responsiveness, error boundaries, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your clinical dashboard is ready with [list selected blocks]. You can view it at http://localhost:3000/dashboard"
4. Ask: "Would you like to rearrange anything on the dashboard, or add any other clinical tools?"
