# Cardiology Workflow

## Prerequisites

Check for `.clinical-context.md` in the project root.
- **If found:** Read it. Adapt specialty, practice type, patient population, guidelines, and units throughout this workflow.
- **If not found:** Proceed with defaults. After Phase 4, mention once: "Tip: Run /medical-protocol:start-protocol to save your clinical preferences — specialty, units, and guidelines will apply automatically to every tool."

---

## Phase 1: Clinical Requirements

- "Which cardiac risk calculators do you need?" (Options: ASCVD 10-year risk, HEART Score for chest pain, CHA₂DS₂-VASc for AF stroke risk, or all three)

### Setting-Aware Questions (based on Initial Clarification)

- If **multiple patients**: Route to the dashboard workflow instead, offering cardiology as one of the dashboard widgets
- If **persistence enabled**: Store last-entered values in localStorage

Do NOT ask about scoring formula details, display preferences, or technical preferences.

---

## Phase 2: Fetch & Install

Follow the **Component Installation Process** from the main protocol for the `cardiology` component.

**Patient demographics:** This component uses age and sex. Ask: "Would you like a Patient demographics card above the cardiology calculators?" (Default: yes). If yes, install first: `npx medical-ui-cli add base`. Wire patient age and sex into the cardiology component following the patient data wiring pattern in the composition context.

---

## Phase 3: Build Page

Create `app/cardiology/page.tsx` importing the CardiologyCalculator component.
Wrap in `ErrorBoundary`.
Update `app/page.tsx` with a link to `/cardiology`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your cardiology risk calculators are ready. Use the tabs to switch between ASCVD (10-year cardiovascular risk), HEART Score (chest pain triage), and CHA₂DS₂-VASc (AF stroke risk). View it at http://localhost:3000/cardiology"
Ask: "Would you like to adjust anything?"

---

## Related Tools

Based on clinical context, the doctor may also benefit from:
- **/medical-protocol:vitals** — Blood pressure and heart rate monitoring for ongoing cardiac assessment
- **/medical-protocol:nephrology** — Renal function evaluation for cardio-renal syndrome risk
- **/medical-protocol:bmi** — BMI as a modifiable cardiovascular risk factor

Only mention these if the doctor asks "what else can you do?" or if the clinical scenario suggests them.
