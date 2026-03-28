---
name: vitals
description: "[Internal] Build a vital signs monitor — blood pressure, heart rate, SpO2, temperature, respiratory rate"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.

You are building a vital signs monitor for a healthcare professional. Follow the phases below exactly.

## Initial Clarification

If the doctor's request is vague, ask these three questions in a single conversational message (skip if answers are already clear):

1. **Patient setting** — "What type of patients is this for?" (in/out patients in private practice, admitted patients, or both). Default: private practice.
2. **Single vs multiple patients** — "Will you work with one patient at a time, or manage a list?" Default: one at a time.
3. **Data persistence** — "Should the system remember data between sessions?" Default: yes (stored locally).

## Phase 1: Clinical Requirements

Ask the doctor which vital signs they need to monitor:

- Blood pressure (systolic/diastolic)
- Heart rate (pulse)
- Blood oxygen saturation (SpO2)
- Body temperature
- Respiratory rate

**Default: all five.** If the doctor says "vital signs" without specifying, include all.

Ask: "Would you like alerts when readings fall outside normal ranges?" (Default: yes)

### Setting-Aware Questions

- If **admitted patients**: "Do you need continuous monitoring with alerts, or manual entry during rounds?" (Default: manual entry during rounds)
- If **private practice**: "Do you just need to record vitals during the visit, or also review past readings?" (Default: record during visit only)

**FHIR support**: Include silently. Do not ask the doctor.

Do NOT ask about layout, color schemes, or data storage.

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

4. Read the `vital-signs` entry from the manifest

5. Fetch each file listed in `manifest["vital-signs"].files` following the **Component Fetching Process** in the protocol context

6. Install shadcn components listed in `manifest["vital-signs"].shadcn`:
   ```
   npx shadcn@latest add card button input select badge label textarea
   ```

Do not tell the doctor about any of these steps.

## Phase 3: Build Page

1. Create `app/vital-signs/page.tsx`:
   ```tsx
   import VitalSigns from "@/components/vital-signs/vital-signs"

   export default function VitalSignsPage() {
     return (
       <main className="min-h-screen bg-background p-6">
         <VitalSigns />
       </main>
     )
   }
   ```

2. If the doctor only wants specific vital signs, modify the component to conditionally render only the requested signs.

3. Update the home page (`app/page.tsx`) to include a link or redirect to `/vital-signs`.

All layout and architecture decisions are yours. Do not ask the doctor.

## Phase 4: Quality & Preview

1. Run the **Quality Checklist** from the protocol context silently — review theming, responsiveness, error boundaries, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your vital signs monitor is ready. It tracks [list the signs they requested]. You can view it at http://localhost:3000/vital-signs"
4. Ask: "Would you like to adjust which vital signs are shown, or change how any of them are displayed?"
