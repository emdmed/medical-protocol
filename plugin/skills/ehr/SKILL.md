---
name: ehr
description: "[Internal] Build an electronic health records system — patient details, clinical notes, evolutions, references"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.

You are building an electronic health records system for a healthcare professional. Follow the phases below exactly.

## Initial Clarification

If the doctor's request is vague, ask these three questions in a single conversational message (skip if answers are already clear):

1. **Patient setting** — "What type of patients is this for?" (in/out patients in private practice, admitted patients, or both). Default: private practice.
2. **Single vs multiple patients** — "Will you work with one patient at a time, or manage a list?" Default: one at a time.
3. **Data persistence** — "Should the system remember data between sessions?" Default: yes (stored locally).

## Phase 1: Clinical Requirements

Ask the doctor about their patient record needs:

- "What patient information do you need to see at a glance?" (Default: name, age, sex, blood type, allergies, conditions)
- "Do you need to write and review clinical notes/evolutions?" (Default: yes)
- "Do you need to search through previous clinical notes?" (Default: yes)
- "Do you need a reference section for clinical guidelines or drug references?" (Default: yes)

### Setting-Aware Questions

- If **multiple patients**: "Do you need a patient list to switch between records, or will you search by name?" (Default: patient list)
- If **persistence enabled**: "Should records be organized by visit date?" (Default: yes)

Do NOT ask about database setup, authentication, layout, or technical integrations.

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

4. Read the `ehr` entry from the manifest

5. Fetch each file listed in `manifest["ehr"].files` following the **Component Fetching Process** in the protocol context

6. Check `externalComponents` in the manifest entry — some are available as their own manifest entries on the CDN (water-balance, acid-base, bmi). Fetch those using the Component Fetching Process. For remaining external imports not on the CDN (e.g., theme-toggle, textarea-inv), create simplified versions, remove them, or replace with alternatives.

7. Install shadcn components listed in `manifest["ehr"].shadcn`:
   ```
   npx shadcn@latest add card button input textarea select tabs separator scroll-area sheet sidebar skeleton alert-dialog badge
   ```

Do not tell the doctor about any of these steps.

## Phase 3: Build Page

The EHR component includes its own `page.tsx`, so the page is already built after fetching.

1. Verify that `app/ehr/page.tsx` exists and correctly imports the EHR component
2. Check imports — ensure all relative imports within the EHR files resolve correctly
3. Fix any import paths if the source files used aliases that differ from the project setup
4. Update the home page (`app/page.tsx`) to include a link or redirect to `/ehr`

All layout and architecture decisions are yours. Do not ask the doctor.

## Phase 4: Quality & Preview

1. Run the **Quality Checklist** from the protocol context silently — review theming, responsiveness, error boundaries, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your electronic health records system is ready. It includes patient details, clinical notes, previous evolutions, and a reference section. You can view it at http://localhost:3000/ehr"
4. Ask: "Would you like to adjust what patient information is shown, or change how the clinical notes work?"
