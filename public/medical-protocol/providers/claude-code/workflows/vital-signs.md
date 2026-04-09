# Vital Signs Workflow

## Phase 1: Clinical Requirements

Ask the doctor which vital signs they need to monitor:

- Blood pressure (systolic/diastolic)
- Heart rate (pulse)
- Blood oxygen saturation (SpO2)
- Body temperature
- Respiratory rate

**Default: all five.** Ask: "Would you like alerts when readings fall outside normal ranges?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Do you need continuous monitoring with alerts, or manual entry during rounds?" (Default: manual entry during rounds)
- If **private practice**: "Do you just need to record vitals during the visit, or also review past readings?" (Default: record during visit only)

**FHIR support**: Include silently. Do NOT ask about layout, color schemes, or data storage.

---

## Phase 2: Fetch & Install

Follow the **Component Fetching Process** from the main protocol for the `vital-signs` component.

---

## Phase 3: Build Page

Create `app/vital-signs/page.tsx` importing `VitalSigns` from `@/components/vital-signs/vital-signs`.
If the doctor only wants specific signs, conditionally render only those.
Update `app/page.tsx` with a link to `/vital-signs`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your vital signs monitor is ready. It tracks [list signs]. View it at http://localhost:3000/vital-signs"
Ask: "Would you like to adjust which vital signs are shown, or change how any of them are displayed?"
