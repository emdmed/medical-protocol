# Water Balance Workflow

## Phase 1: Clinical Requirements

- "Do you need to track oral and IV intake separately?" (Default: yes)
- "Do you need insensible loss calculations based on patient weight?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Do you need to track fluid balance per shift or per 24 hours?" (Default: per 24 hours)
- If **multiple patients**: Route to the dashboard workflow instead, offering water balance as one of the dashboard widgets

Do NOT ask about calculation formulas, display preferences, or technical preferences.

---

## Phase 2: Fetch & Install

Follow the **Component Installation Process** from the main protocol for the `water-balance` component.

---

## Phase 3: Build Page

Create `app/water-balance/page.tsx` importing the WaterBalanceCalculator component.
Wrap in `ErrorBoundary`.
Update `app/page.tsx` with a link to `/water-balance`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your fluid balance tracker is ready. Enter the patient's weight, fluid intake (oral and IV), urine output, and stool count — it calculates the net balance including insensible losses. View it at http://localhost:3000/water-balance"
Ask: "Would you like to adjust how the fluid balance is tracked?"
