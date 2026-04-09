# DKA Monitoring Workflow

## Phase 1: Clinical Requirements

Ask the doctor about their DKA monitoring needs:

- "Will you be tracking glucose in mg/dL or mmol/L?" (Default: mg/dL)
- "Do you need to monitor urine output alongside glucose and ketones?" (Default: yes)
- Note: The component includes full blood gas analysis (ABG disorder classification, compensation, anion gap, delta ratio) on every reading — no extra setup needed.

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Are you managing DKA in an ICU or general ward setting?" (Default: ICU — affects monitoring frequency expectations)
- If **multiple patients**: Route to the dashboard workflow instead, offering DKA monitoring as one of the dashboard widgets

Do NOT ask about clinical thresholds, resolution criteria, insulin adjustment formulas, display preferences, or technical preferences.

---

## Phase 2: Fetch & Install

Follow the **Component Fetching Process** from the main protocol for the `dka` component.

**Acid-base dependency:** Also fetch the `acid-base` component from the manifest — DKA uses it for blood gas analysis on every reading. Files needed: `analyze.ts`, `components/popup.tsx`, `utils/safeFloat.ts`, `types/interfaces.ts`.

**Clinical logic library:** The DKA component imports calculation functions from `lib/dka`. Create in the project:
- `calculateGlucoseReductionRate(current, previous, hours)` — rate of glucose drop per hour
- `isGlucoseOnTarget(rate, unit)` — target: 50–70 mg/dL/hr or 3–4 mmol/L/hr
- `calculateKetoneReductionRate(current, previous, hours)` — rate of ketone clearance per hour
- `isKetoneOnTarget(rate)` — target: ≥0.5 mmol/L/hr
- `calculateBicarbonateIncreaseRate(current, previous, hours)` — rate of HCO3 rise per hour
- `isBicarbonateOnTarget(rate)` — target: ≥1 mEq/L/hr
- `classifyPotassium(value)` — hypokalemia / normal / hyperkalemia
- `getPotassiumSeverity(value)` — normal / warning / critical
- `calculateUrineOutputRate(volume, weight, hours)` — mL/kg/hr
- `isUrineOutputOnTarget(rate)` — target: ≥0.5 mL/kg/hr
- `classifyGCS(value)` — normal / mild / moderate / severe
- `isGCSDecreasing(current, previous)` — drop ≥2 triggers cerebral edema warning
- `assessDKAResolution(glucose, ketones, bicarbonate, pH, unit)` — checks all 4 resolution criteria
- `suggestInsulinAdjustment(glucose, rate, currentInsulin, unit)` — text suggestion based on glucose level and rate

---

## Phase 3: Build Page

Create `app/dka/page.tsx` importing the DKAMonitor component.
Wrap in `ErrorBoundary`. Provide `onData` callback for state management.
Update `app/page.tsx` with a link to `/dka`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your DKA monitoring dashboard is ready. Enter the patient's weight, then add hourly readings with glucose, ketones, bicarbonate, pH, pCO2, Na+, Cl-, albumin, potassium, insulin rate, GCS, and urine output. It tracks reduction rates against targets, checks DKA resolution criteria, and runs full blood gas analysis on every reading. View it at http://localhost:3000/dka"
Ask: "Would you like to adjust anything about the monitoring parameters?"
