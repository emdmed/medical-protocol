---
name: clinical-notes
description: "[Internal] Build a clinical notes editor — encounter notes, highlighting, evolutions, references"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.

You are building a clinical notes editor for a healthcare professional. Follow the phases below exactly.

## Initial Clarification

If the doctor's request is vague, ask these questions in a single conversational message (skip if answers are already clear):

1. **Patient setting** — "What type of patients is this for?" (in/out patients in private practice, admitted patients, or both). Default: private practice.
2. **Data persistence** — "Should the system remember data between sessions?" Default: yes (stored locally).

## Phase 1: Clinical Requirements

Ask the doctor about their encounter note needs:

- "What patient information do you need at the top of each note?" (Default: name, age, date)
- "Do you need to review previous notes/evolutions?" (Default: yes)
- "Do you need a reference section for clinical guidelines or drug references?" (Default: yes)

### Setting-Aware Questions

- If **persistence enabled**: "Should notes be organized by visit date?" (Default: yes)

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

4. Read the `clinical-notes` entry from the manifest

5. Fetch each file listed in `manifest["clinical-notes"].files` following the **Component Fetching Process** in the protocol context

6. Check `externalComponents` in the manifest entry — some are available as their own manifest entries on the CDN (water-balance, acid-base, bmi). Fetch those using the Component Fetching Process. For remaining external imports not on the CDN (e.g., textarea-inv), create simplified versions, remove them, or replace with alternatives.

7. Install shadcn components listed in `manifest["clinical-notes"].shadcn`:
   ```
   npx shadcn@latest add card button input textarea select tabs separator scroll-area alert-dialog badge
   ```

Do not tell the doctor about any of these steps.

## Phase 3: Build Page

The clinical-notes component includes its own `page.tsx`, so the page is already built after fetching.

1. Create a route — either `app/notes/page.tsx` or `app/clinical-notes/page.tsx` that imports and renders the component
2. Check imports — ensure all relative imports within the clinical-notes files resolve correctly
3. Fix any import paths if the source files used aliases that differ from the project setup
4. Update the home page (`app/page.tsx`) to include a link or redirect to the notes route

All layout and architecture decisions are yours. Do not ask the doctor.

## Phase 4: Quality & Preview

1. Run the **Quality Checklist** from the protocol context silently — review theming, responsiveness, error boundaries, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your clinical notes editor is ready. It includes patient details, encounter notes with highlighting, previous evolutions, and a reference section. You can view it at http://localhost:3000/notes"
4. Ask: "Would you like to adjust what information appears in your notes, or add any clinical tools alongside them?"
