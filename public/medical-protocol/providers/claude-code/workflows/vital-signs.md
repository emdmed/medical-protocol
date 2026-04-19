# Vital Signs Workflow

## Prerequisites

Check for `.clinical-context.md` in the project root.
- **If found:** Read it. Adapt specialty, practice type, patient population, guidelines, and units throughout this workflow.
- **If not found:** Proceed with defaults. After Phase 4, mention once: "Tip: Run /medical-protocol:start-protocol to save your clinical preferences — specialty, units, and guidelines will apply automatically to every tool."

---

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

**FHIR support**: Include automatically. Do NOT ask about layout, color schemes, or data storage.

---

## Phase 2: Fetch & Install

Follow the **Component Installation Process** from the main protocol for the `vital-signs` component.

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

---

## Related Tools

Based on clinical context, the doctor may also benefit from:
- **/medical-protocol:sepsis** — If abnormal vitals suggest infection, screen with qSOFA and full SOFA scoring
- **/medical-protocol:pafi** — If SpO2 is low, calculate PaO2/FiO2 ratio for ARDS classification
- **/medical-protocol:cardiology** — If BP or heart rate abnormalities warrant cardiovascular risk assessment

Only mention these if the doctor asks "what else can you do?" or if the clinical scenario suggests them.
