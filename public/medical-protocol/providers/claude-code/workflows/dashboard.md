# Dashboard Workflow

## Phase 1: Clinical Requirements

Present the available building blocks by category and ask which they'd like:

- "Which of these blocks would you like on your dashboard?"

  **Base** — Patient demographics (name, DOB, age, sex, weight, height)

  **Monitoring** — Vital signs (BP, HR, RR, Temp, SpO2)

  **Calculators** — Blood gas / acid-base analyzer · BMI calculator · Fluid balance (water balance / I&O) · PaFi calculator (PaO2/FiO2 ratio with ARDS classification) · Cardiology risk scores (ASCVD, HEART, CHA₂DS₂-VASc)

  **Critical Care** — DKA monitoring (hourly glucose, ketones, potassium, insulin, GCS tracking) · Sepsis assessment (SOFA, qSOFA, lactate clearance)

  **Nephrology** — CKD evaluation (eGFR, KDIGO staging, KFRE)

  Default: vital signs + acid-base. When any selected component uses weight, age, or sex (ckd, dka, sepsis, water-balance, cardiology, bmi), include Patient automatically.

- "Is this for a single patient view or a clinic overview?" (Default: single patient)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Do you want the dashboard to highlight patients with abnormal readings?" (Default: yes)

Do NOT ask about layout arrangement, navigation structure, or technical preferences.

---

## Phase 2: Fetch & Install

For each block the doctor selected, install via CLI — do NOT fetch any workflow files from the CDN. Install each component with `npx medical-ui-cli add <component>`. Available components: `base` (patient), `vital-signs`, `acid-base`, `bmi`, `water-balance`, `pafi`, `dka`, `cardiology`, `sepsis`, `ckd`. For nephrology, use the group install `npx medical-ui-cli add nephrology` to install both `ckd/` and `nephrology/` folders at once.

If Patient was included (explicitly or auto-included), install it first: `npx medical-ui-cli add base`. Then wire patient data into dependent components following the patient data wiring pattern in the composition context.

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
- If Patient is included, place the Patient card full-width at the top (before the grid)
- Selected blocks arranged in a responsive grid (`grid-cols-1 lg:grid-cols-2 gap-6`)
- Wrap the entire page in `ErrorBoundary`

Layout guidance:
- Patient card goes at the top, full-width, outside the grid
- Smaller widgets (acid-base, BMI, water-balance) work well grouped together

Update the home page to redirect to `/dashboard`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your clinical dashboard is ready with [list selected blocks]. View it at http://localhost:3000/dashboard"
Ask: "Would you like to rearrange anything on the dashboard, or add any other clinical tools?"
