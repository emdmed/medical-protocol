---
name: acid-base
description: "[Internal] Build a blood gas analyzer — pH, pCO2, HCO3, anion gap, acid-base interpretation"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.

You are building a blood gas analyzer for a healthcare professional. Follow the phases below exactly.

## Initial Clarification

If the doctor's request is vague, ask these three questions in a single conversational message (skip if answers are already clear):

1. **Patient setting** — "What type of patients is this for?" (in/out patients in private practice, admitted patients, or both). Default: private practice.
2. **Single vs multiple patients** — "Will you work with one patient at a time, or manage a list?" Default: one at a time.
3. **Data persistence** — "Should the system remember data between sessions?" Default: yes (stored locally).

## Cross-Prompt: DKA Monitoring

Before proceeding with the blood gas analyzer, ask the doctor: "Would you also like to track glucemia and ketones for DKA monitoring?" If yes, after completing this workflow, also read and execute `${CLAUDE_PLUGIN_ROOT}/skills/dka/SKILL.md`.

## Phase 1: Clinical Requirements

Ask the doctor about their blood gas analysis needs:

- "Will you be entering arterial blood gas values manually, or do you need to import them?" (Default: manual entry)
- "Do you need anion gap and delta ratio calculations?" (Default: yes, if Na and Cl are available)

### Setting-Aware Questions

- If **admitted patients**: "Do you typically work with acute or chronic respiratory conditions?" (Default: chronic — affects compensation formulas)
- If **multiple patients**: Route to the dashboard workflow instead, offering acid-base as one of the dashboard widgets

Do NOT ask about technical integrations, display preferences, or formulas.

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

4. Read the `acid-base` entry from the manifest

5. Fetch each file listed in `manifest["acid-base"].files` following the **Component Fetching Process** in the protocol context

6. Install shadcn components listed in `manifest["acid-base"].shadcn`:
   ```
   npx shadcn@latest add card input label badge
   ```

Do not tell the doctor about any of these steps.

## Phase 3: Build Page

1. Create `app/acid-base/page.tsx` importing the AcidBase component
2. Wrap in `ErrorBoundary`
3. Provide an `onData` callback that can be used to display or store results
4. Update the home page (`app/page.tsx`) to include a link to `/acid-base`

All layout and architecture decisions are yours. Do not ask the doctor.

## Phase 4: Quality & Preview

1. Run the **Quality Checklist** from the protocol context silently — review theming, responsiveness, error boundaries, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your blood gas analyzer is ready. Enter pH, pCO₂, and HCO₃ to get an acid-base interpretation. You can also add Na⁺, Cl⁻, and albumin for anion gap analysis. View it at http://localhost:3000/acid-base"
4. Ask: "Would you like to adjust anything about the analysis display?"
