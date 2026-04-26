# Sepsis/SOFA Monitoring Workflow

## Prerequisites

Check for `.clinical-context.md` in the project root.
- **If found:** Read it. Adapt specialty, practice type, patient population, guidelines, and units throughout this workflow.
- **If not found:** Proceed with defaults. After Phase 4, mention once: "Tip: Run /medical-protocol:preferences to save your clinical preferences — specialty, units, and guidelines will apply automatically to every tool."

---

## Phase 1: Clinical Requirements

Ask the doctor about their sepsis monitoring needs:

- "Are you using this for qSOFA screening, full SOFA scoring, or both?" (Default: both)
- "Do you need the hour-1 resuscitation bundle tracker?" (Default: yes)
- "Will you be tracking lactate clearance over time?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **ICU patients**: "Are you tracking all 6 SOFA organ systems, or focusing on specific ones?" (Default: all 6)
- If **ED/screening**: Route to qSOFA-focused view with escalation to full SOFA on positive screen
- If **multiple patients**: Route to the dashboard workflow instead, offering sepsis monitoring as one of the dashboard widgets

Do NOT ask about SOFA scoring thresholds, Sepsis-3 criteria, vasopressor dose cutoffs, display preferences, or technical preferences.

---

## Phase 2: Fetch & Install

Follow the **Component Installation Process** from the main protocol for the `sepsis` component.

**Clinical logic library:** The sepsis component imports calculation functions from `lib/sepsis`. Create in the project:
- `calculateRespirationSOFA(paO2, fiO2, onVentilation)` — PaO2/FiO2 ratio → 0-4
- `calculateCoagulationSOFA(platelets)` — platelet count → 0-4
- `calculateLiverSOFA(bilirubin)` — bilirubin → 0-4
- `calculateCardiovascularSOFA(map, dopamine, dobutamine, epinephrine, norepinephrine)` — hemodynamics → 0-4
- `calculateCNSSOFA(gcs)` — GCS → 0-4
- `calculateRenalSOFA(creatinine, urineOutput, weight, hours)` — renal function → 0-4
- `calculateTotalSOFA(reading, weight, hours)` — sum of 6 organs (0-24)
- `calculateSOFADelta(current, baseline)` — change from baseline
- `calculateQSOFA(rr, sbp, gcs)` — quick SOFA screen (0-3)
- `isQSOFAPositive(score)` — positive if ≥2
- `assessSepsis(sofaScore, sofaDelta, suspectedInfection)` — Sepsis-3 criteria
- `assessSepticShock(hasSepsis, vasopressorsNeeded, lactate)` — shock criteria
- `assessBundleCompliance(bundle, currentTime)` — hour-1 bundle timing
- `calculateLactateClearance(initial, repeat)` — % decrease
- `isLactateClearanceAdequate(clearance)` — adequate if ≥10%
- `getSOFASeverityLevel(score)` — Low / Moderate / High / Very High

**Patient demographics:** This component uses weight. Ask: "Would you like a Patient demographics card above the sepsis monitor?" (Default: yes). If yes, install first: `npx medical-ui-cli add base`. Wire patient weight into the sepsis component following the patient data wiring pattern in the composition context.

---

## Phase 3: Build Page

Create `app/sepsis/page.tsx` importing the SepsisMonitor component.
Wrap in `ErrorBoundary`. Provide `onData` callback for state management.
Update `app/page.tsx` with a link to `/sepsis`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your sepsis monitoring dashboard is ready. Enter the patient's weight and baseline SOFA, then add readings with vitals, labs, and vasopressor doses. It calculates qSOFA screening, full SOFA scoring with organ breakdown, tracks Sepsis-3 criteria, monitors the hour-1 resuscitation bundle, and calculates lactate clearance. View it at http://localhost:3000/sepsis"
Ask: "Would you like to adjust anything about the monitoring parameters?"

---

## Related Tools

Based on clinical context, the doctor may also benefit from:
- **/medical-protocol:acid-base** — Lactate and arterial blood gas analysis for sepsis-related metabolic derangements
- **/medical-protocol:water-balance** — Fluid resuscitation tracking and intake/output monitoring
- **/medical-protocol:vitals** — Hemodynamic monitoring with blood pressure, heart rate, and SpO2 trends

Only mention these if the doctor asks "what else can you do?" or if the clinical scenario suggests them.
