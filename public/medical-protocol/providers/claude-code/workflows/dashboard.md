# Dashboard Workflow

## Phase 1: Clinical Requirements

Present the available building blocks by category and ask which they'd like:

- "Which of these blocks would you like on your dashboard?"

  **Monitoring** — Vital signs (BP, HR, RR, Temp, SpO2)

  **Calculators** — Blood gas / acid-base analyzer · BMI calculator · Fluid balance (water balance / I&O) · PaFi calculator (PaO2/FiO2 ratio with ARDS classification) · Cardiology risk scores (ASCVD, HEART, CHA₂DS₂-VASc)

  **Critical Care** — DKA monitoring (hourly glucose, ketones, potassium, insulin, GCS tracking) · Sepsis assessment (SOFA, qSOFA, lactate clearance)

  Default: vital signs + acid-base

- "Is this for a single patient view or a clinic overview?" (Default: single patient)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Do you want the dashboard to highlight patients with abnormal readings?" (Default: yes)

Do NOT ask about layout arrangement, navigation structure, or technical preferences.

---

## Phase 2: Fetch & Install

For each block the doctor selected, follow the **Component Installation Process** from the main protocol. Install each component with `npx medical-ui-cli add <component>`. Available components: `vital-signs`, `acid-base`, `bmi`, `water-balance`, `pafi`, `dka`, `cardiology`, `sepsis`, `ckd`. For nephrology workflows, use the group install `npx medical-ui-cli add nephrology` to install both `ckd/` and `nephrology/` folders at once.

Check if any installed component has dependencies on other components — if so, install those too with `npx medical-ui-cli add`.

Refer to the composition context for integration patterns and known gotchas (overflow clipping, circular updates, null guards). Key rules:
- Props down, callbacks up. Use `useRef` to skip no-op updates and prevent circular render loops.
- Add `overflow-visible` to any shadcn Card that contains absolutely-positioned popups or overlays.
- When wiring multiple components on a single page, null-guard all cross-component data.

Install all selected components via `npx medical-ui-cli add <name>` (deduplicated — skip any already installed).

---

## Phase 3: Build Page

Create `app/dashboard/page.tsx` with:
- A header with the clinic/dashboard name
- Selected blocks arranged in a responsive grid (`grid-cols-1 lg:grid-cols-2 gap-6`)
- Wrap the entire page in `ErrorBoundary`

Layout guidance:
- Smaller widgets (acid-base, BMI, water-balance) work well grouped together

Update the home page to redirect to `/dashboard`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your clinical dashboard is ready with [list selected blocks]. View it at http://localhost:3000/dashboard"
Ask: "Would you like to rearrange anything on the dashboard, or add any other clinical tools?"
