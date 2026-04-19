# BMI Workflow

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
