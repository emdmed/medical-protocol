# BMI Workflow

## Prerequisites

Silently check for `.clinical-context.md` in the project root.
- **If found:** Read it. Adapt specialty, practice type, patient population, guidelines, and units throughout this workflow.
- **If not found:** Proceed with defaults. After Phase 4, mention once: "Tip: Run /medical-protocol:start-protocol to save your clinical preferences — specialty, units, and guidelines will apply automatically to every tool."

---

## Phase 1: Clinical Requirements

- "Do you prefer metric (kg/m) or imperial (lbs/ft-in) units?" (Default: imperial, with a toggle to switch)

### Setting-Aware Questions (based on Initial Clarification)

- If **multiple patients**: Route to the dashboard workflow instead, offering BMI as one of the dashboard widgets
- If **persistence enabled**: Store last-entered weight/height in localStorage

Do NOT ask about BMI formula details, display preferences, or technical preferences.

---

## Phase 2: Fetch & Install

Follow the **Component Installation Process** from the main protocol for the `bmi` component.

**Patient demographics:** This component uses weight and height. Ask: "Would you like a Patient demographics card above the BMI calculator?" (Default: yes). If yes, install first: `npx medical-ui-cli add base`. Wire patient weight and height into the BMI component following the patient data wiring pattern in the composition context.

---

## Phase 3: Build Page

Create `app/bmi/page.tsx` importing the BMICalculator component.
Wrap in `ErrorBoundary`.
Update `app/page.tsx` with a link to `/bmi`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your BMI calculator is ready. Click to enter weight and height, and it will show the BMI with its category. You can switch between metric and imperial units. View it at http://localhost:3000/bmi"
Ask: "Would you like to adjust anything?"

---

## Related Tools

Based on clinical context, the doctor may also benefit from:
- **/medical-protocol:vitals** — Complete vital signs assessment alongside anthropometrics
- **/medical-protocol:cardiology** — Cardiovascular risk scoring where BMI is a contributing factor

Only mention these if the doctor asks "what else can you do?" or if the clinical scenario suggests them.
