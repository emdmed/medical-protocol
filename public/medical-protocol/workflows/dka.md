# DKA Monitoring Workflow

> `{CDN_BASE}` refers to `https://medical-protocol.vercel.app/medical-protocol` (defined in the main protocol).

## Phase 1: Clinical Requirements

Ask the doctor about their DKA monitoring needs:

- "Will you be tracking glucose in mg/dL or mmol/L?" (Default: mg/dL)
- "Do you need to monitor urine output alongside glucose and ketones?" (Default: yes)
- Note: The component includes full blood gas analysis (ABG disorder classification, compensation, anion gap, delta ratio) on every reading — no extra setup needed.

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Are you managing DKA in an ICU or general ward setting?" (Default: ICU — affects monitoring frequency expectations)
- If **multiple patients**: Route to the dashboard workflow instead, offering DKA monitoring as one of the dashboard widgets

Do NOT ask about:
- Clinical thresholds or resolution criteria (use standard DKA guidelines: glucose <200 mg/dL or <11.1 mmol/L, ketones <0.6, HCO3 ≥15, pH >7.30)
- Insulin adjustment formulas (use standard protocol)
- Display preferences (you decide)
- Technical preferences

---

## Phase 2: Fetch & Install Components

Silently perform all of the following:

1. Run the **Project Check** from the main protocol (scaffold Next.js + shadcn if needed)

2. **Fetch the component manifest:**
   ```
   WebFetch: {CDN_BASE}/components/manifest.json
   ```

3. **Read the `dka` entry** from the manifest

4. **Fetch each file** listed in `manifest["dka"].files` following the **Component Fetching Process** in the main protocol

5. **Fetch acid-base dependency files** — DKA uses the acid-base analyzer for blood gas analysis. Fetch the files listed in `manifest["acid-base"].files`:
   - `analyze.ts` — ABG analysis engine (disorders, compensation, anion gap, delta ratio)
   - `components/popup.tsx` — inline result display wrapper
   - `utils/safeFloat.ts` — safe float parsing
   - `types/interfaces.ts` — Values, Result types

6. **Install shadcn components** listed in `manifest["dka"].shadcn`:
   ```
   npx shadcn@latest add {manifest["dka"].shadcn joined by spaces}
   ```

7. **Clinical logic library:** The DKA component imports calculation functions from `lib/dka`. These must be created in the project:
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

Do not tell the doctor about any of these steps.

---

## Phase 3: Build Page

1. **Create `app/dka/page.tsx`** importing the DKAMonitor component
2. Wrap in `ErrorBoundary`
3. Provide `onData` callback for state management
4. **Update the home page** (`app/page.tsx`) to include a link to `/dka`

All layout and architecture decisions are yours. Do not ask the doctor.

---

## Phase 4: Quality & Preview

1. **Run the Quality Checklist** from the main protocol — silently review theming, responsiveness, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your DKA monitoring dashboard is ready. Enter the patient's weight, then add hourly readings with glucose, ketones, bicarbonate, pH, pCO2, Na+, Cl-, albumin, potassium, insulin rate, GCS, and urine output. It tracks reduction rates against targets, checks DKA resolution criteria, and runs full blood gas analysis (disorder classification, compensation, anion gap, delta ratio) on every reading. View it at http://localhost:3000/dka"
4. Ask: "Would you like to adjust anything about the monitoring parameters?"
