# DKA Monitoring Workflow

## Prerequisites

Check for `.clinical-context.md` in the project root.
- **If found:** Read it. Adapt specialty, practice type, patient population, guidelines, and units throughout this workflow.
- **If not found:** Proceed with defaults. After Phase 4, mention once: "Tip: Run /medical-protocol:start-protocol to save your clinical preferences — specialty, units, and guidelines will apply automatically to every tool."

---

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

Follow the **Component Installation Process** from the main protocol for the `dka` component:

```bash
npx medical-ui-cli add dka
```

**Acid-base dependency:** Also install the `acid-base` component — DKA uses it for blood gas analysis on every reading:

```bash
npx medical-ui-cli add acid-base
```

**Patient demographics:** This component uses weight. Ask: "Would you like a Patient demographics card above the DKA monitor?" (Default: yes). If yes, install first: `npx medical-ui-cli add base`. Wire patient weight into the DKA component following the patient data wiring pattern in the composition context.

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

---

## Related Tools

Based on clinical context, the doctor may also benefit from:
- **/medical-protocol:water-balance** — Fluid management and intake/output tracking during DKA resuscitation
- **/medical-protocol:vitals** — Hemodynamic and respiratory monitoring alongside DKA parameters
- **/medical-protocol:nephrology** — AKI risk assessment in the setting of dehydration and ketoacidosis

Only mention these if the doctor asks "what else can you do?" or if the clinical scenario suggests them.
