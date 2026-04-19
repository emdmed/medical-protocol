# Water Balance Workflow

## Prerequisites

Silently check for `.clinical-context.md` in the project root.
- **If found:** Read it. Adapt specialty, practice type, patient population, guidelines, and units throughout this workflow.
- **If not found:** Proceed with defaults. After Phase 4, mention once: "Tip: Run /medical-protocol:start-protocol to save your clinical preferences — specialty, units, and guidelines will apply automatically to every tool."

---

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

**Patient demographics:** This component uses weight. Ask: "Would you like a Patient demographics card above the fluid balance tracker?" (Default: yes). If yes, install first: `npx medical-ui-cli add base`. Wire patient weight into the water balance component following the patient data wiring pattern in the composition context.

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

---

## Related Tools

Based on clinical context, the doctor may also benefit from:
- **/medical-protocol:dka** — DKA fluid management with glucose and electrolyte tracking
- **/medical-protocol:sepsis** — Fluid resuscitation tracking with sepsis bundle compliance
- **/medical-protocol:vitals** — Hemodynamic response monitoring during fluid therapy

Only mention these if the doctor asks "what else can you do?" or if the clinical scenario suggests them.
