# DKA Module Context

Hourly DKA monitoring: glucose reduction rate, ketone clearance, bicarbonate recovery, potassium tracking, GCS, urine output, insulin adjustment, resolution criteria, blood gas analysis.

Logic: `lib/medprotocol/dka.ts` + `lib/medprotocol/acid-base/` — import from `@/lib/medprotocol/dka` and `@/lib/medprotocol/acid-base`. Build: see `building.md`.

---

## Screen spec

**Shows:**
- **Header:** patient weight (kg, click to edit) and glucose unit toggle (mg/dL ↔ mmol/L, default mg/dL)
- **Current status:** latest-reading badges — glucose, ketones, K⁺ (with class), GCS (with class), urine output
- **Rates vs previous reading:** glucose reduction, ketone reduction, bicarbonate increase, urine output (mL/kg/hr), each marked on/off target
- **GCS drop alert** when `isGCSDecreasing` (cerebral edema warning)
- **Insulin suggestion** from `suggestInsulinAdjustment`
- **Blood gas:** disorders from `analyze()` on the latest reading
- **Resolution:** one badge per criterion (ketones, pH, bicarbonate) + resolved/not resolved. Glucose is not a resolution criterion.
- **Reading history:** compact list, newest last

**Add reading** (form, all strings, timestamp = now in unix seconds):

| Field | Unit | Accepted |
|---|---|---|
| Glucose | mg/dL or mmol/L (current unit) | required, > 0 |
| Ketones | mmol/L | ≥ 0 |
| Bicarbonate | mmol/L | 0–50 |
| pH | — | 6.0–8.0 |
| pCO2 | mmHg | 5–120 |
| Na⁺ | mEq/L | 100–180 |
| Cl⁻ | mEq/L | 60–140 |
| Albumin | g/dL | 0–10 |
| Potassium | mmol/L | 0.5–10 |
| Insulin rate | units/hr | ≥ 0 |
| GCS | 3–15 | 3–15 |
| Urine output | mL (since last reading) | ≥ 0 |

These are data-entry plausibility bounds, not clinical thresholds.

**Interaction:** rates need ≥2 readings; hours = timestamp difference / 3600 (fallback 1). Toggling the unit changes how glucose is read and which targets apply — it does not convert stored values.

**Display rules:** color K⁺ by `getPotassiumSeverity`; on/off target from the `is*OnTarget` functions. Results render inline below inputs.

**Props contract:** `data?: DKAPatientData`, `onData?: (data: DKAPatientData) => void` (fires on every change).

```typescript
interface DKAReading {
  id: string; timestamp: number;        // unix seconds
  glucose: string; ketones: string; bicarbonate: string; pH: string;
  potassium: string; insulinRate: string; gcs: string; urineOutput: string;
  pCO2: string; sodium: string; chloride: string; albumin: string;
  trace?: TraceEntry[];                 // from lib/medprotocol/trace
}
interface DKAPatientData { weight: string; glucoseUnit: "mmol" | "mgdl"; readings: DKAReading[]; }
```

---

## Synthetic patient generator

For the **Generate patient** button (`building.md` §3). Each press: pick a scenario at random, draw each value uniformly in its range, apply the couplings, round as stated. Fields not listed stay empty.

**Generate patient** creates the weight and a course of 4–6 hourly readings.

First reading: weight 50–100 kg; glucose 300–700 mg/dL; ketones 3.0–7.0 mmol/L; HCO3 5–15; pCO2 by Winter's (1.5 × HCO3 + 8, ± 1); pH from Henderson–Hasselbalch (6.1 + log10(HCO3 / (0.03 × pCO2))); Na⁺ 128–140; anion gap target 20–30, so Cl⁻ = Na⁺ − HCO3 − gap; albumin 3.5–4.5; K⁺ 4.0–6.0; GCS 14–15; insulin 0.1 U/kg/h; urine 60–150 mL per hour.

| Course scenario | Each hour |
|---|---|
| On target, resolving | glucose falls 50–75 mg/dL; ketones fall 0.5–1.0; HCO3 rises 1–3; K⁺ falls 0.2–0.4 |
| Glucose falling too slowly | glucose falls 15–45; ketones fall 0.2–0.4; HCO3 rises 0–1 |
| Potassium falling | as on target, but K⁺ falls 0.4–0.7, reaching 3.0–3.4 by the end |
| Cerebral oedema warning | as on target, then GCS drops by 2–4 over the last two readings |

Every reading recomputes pCO2 (Winter's), pH (Henderson–Hasselbalch) and Cl⁻ from the new HCO3 and gap; the gap closes 2–4 per hour in the resolving course. Glucose never below 150, ketones never below 0.2. In mmol/L mode, glucose = mg/dL ÷ 18, 1 decimal.

Rounding: glucose whole numbers; ketones, K⁺, albumin 1 decimal; pH 2 decimals; others whole numbers.

Every generated patient is labelled "Synthetic patient" with a 4-character code, never a name. Results still come only from the lib.

## Lib Functions

`dka.ts` (all inputs `string`, parsed via `safeParseFloat`):

- `calculateGlucoseReductionRate(current, previous, hours)` → `string | null`; `isGlucoseOnTarget(rate, unit)` — ≥3.0 mmol/L/hr or ≥54 mg/dL/hr
- `calculateKetoneReductionRate(current, previous, hours)`; `isKetoneOnTarget(rate)` — ≥0.5 mmol/L/hr
- `calculateBicarbonateIncreaseRate(current, previous, hours)`; `isBicarbonateOnTarget(rate)` — ≥3.0 mmol/L/hr
- `classifyPotassium(value)` → Critical Low (<3.0) / Low (<4.0) / Normal (≤5.0) / High (≤6.0) / Critical High / Unknown; `getPotassiumSeverity(value)` → critical / warning / normal / default
- `calculateUrineOutputRate(volume, weight, hours)` → mL/kg/hr; `isUrineOutputOnTarget(rate)` — ≥0.5
- `classifyGCS(value)` → Normal (15) / Mild (13–14) / Moderate (9–12) / Severe (<9) / Invalid / Unknown; `isGCSDecreasing(current, previous)` — drop ≥2
- `assessDKAResolution(ketones, bicarbonate, pH)` → `{ resolved, criteria: { ketones, bicarbonate, pH } }`. Ketones = blood β-hydroxybutyrate (mmol/L), not urine ketones.
- `suggestInsulinAdjustment(glucose, rate, insulinRate, unit, dkaResolved = false)` → guideline criterion text. Pass `assessDKAResolution(...).resolved`; subcutaneous transition is suggested only once DKA has resolved, never on glucose alone.

Blood gas: `analyze({ values: { pH, pCO2, HCO3: bicarbonate, Na: sodium, Cl: chloride, Albumin: albumin }, isChronic: false })` from `acid-base`.

---

## Cross-Tool Data

- **DKA → Acid-Base:** code-level dependency — DKA calls `analyze()` for pH/bicarb assessment. Both modules ship together in `lib/medprotocol/`
- **← Patient:** weight (kg)
- **DKA ↔ Vital-Signs/Sepsis:** No data sharing, can coexist on ICU dashboard

---

## Gotchas

- **Unit matters.** Glucose targets differ between mmol/L and mg/dL. Always pass `glucoseUnit`
- **Hourly readings.** Rate calculations compare consecutive timestamped readings
- **No circular loops.** Guard `onData` → `data` with `useRef` + serialized comparison
- **Resolution (2024 consensus):** β-hydroxybutyrate <0.6 mmol/L AND (venous pH ≥7.30 OR bicarbonate ≥18 mmol/L)

---

## CLI

```bash
medprotocol dka --glucose 400 --prev-glucose 460 --hours 2 --unit mgdl
medprotocol dka --glucose 200 --ketones 0.4 --bicarb 18 --ph 7.35 --unit mgdl
```

---

## Guideline Reference

JBDS-IP DKA guidelines: glucose 3-5 mmol/L/hr (54-90 mg/dL/hr), ketone clearance >0.5 mmol/L/hr, bicarb recovery >3 mmol/L/hr, potassium: hold insulin and replace if K⁺ <3.5, add K⁺ to fluids if 3.5–5.0, none if >5.0. Resolution thresholds: Hyperglycemic Crises in Adults consensus, Diabetes Care 2024 (`sources.ADA_DKA_2024`). Insulin adjustment: increase when glucose falls <3 mmol/L/hr, dextrose and rate reduction below 14 mmol/L (JBDS 2021, `sources.JBDS_2021`; the 2024 consensus uses 13.9 mmol/L, 250 mg/dL); subcutaneous transition with basal 1–2 h before stopping IV (2024 consensus). Citations with DOI: `sources.ADA_DKA_2024`, `KITABCHI_2009`, `JBDS_2021`, `JBDS_SAVAGE_2011`.
