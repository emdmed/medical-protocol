# BMI Module Context

Body Mass Index with metric/imperial toggle and WHO classification.

Logic: `lib/medprotocol/bmi.ts` — import from `@/lib/medprotocol/bmi`. Build: see `building.md`.

---

## Screen spec

**Shows:** BMI value, category badge, and the weight/height it was computed from (e.g. `154 lbs • 5'9"` or `70 kg • 1.75 m`).

**Inputs** (strings):

| Field | Imperial | Metric | Default |
|---|---|---|---|
| Weight | lbs (step 1) | kg (step 0.1) | 154 lbs |
| Height | ft + in | m | 5 ft 9 in / 1.75 m |

**Outputs:** BMI from `calculateBMI`, category from `getBMICategory`.

**Interaction:** click the card to enter edit mode, edit, save or cancel. Save is disabled until weight > 0 and height is valid. A units toggle (imperial ↔ metric) converts the current values (1 lb = 0.453592 kg, 1 in = 0.0254 m). Default unit is imperial.

**Display rules:** show units next to every value. Show "Unknown" / no category when `calculateBMI` returns `null` (out-of-range or missing input).

**Props contract:** `data?: { weight?, heightFt?, heightIn?, heightM?, isMetric? }` (strings + boolean). Sync prop changes into state so Patient weight/height updates reach it (see `composition.md`). No `onData`.

---

## Lib Functions

- `calculateBMI(w, hFt, hIn, hM, metric)` → `string | null` (1 decimal). All inputs `string`, `metric: boolean`. Returns `null` for weight ≤0 or >700 kg / >1500 lb, height ≤0 or >2.75 m / >108 in.
- `BMI_BANDS` → `{ cuts: [18.5, 25, 30, 35, 40], labels }`, the cut-offs and band names `getBMICategory` reads; use it to draw a scale.
- `getBMICategory(bmi: string | null)` → `"Underweight"` (<18.5) | `"Normal"` (18.5–24.9) | `"Overweight"` (25–29.9) | `"Obese I"` (30–34.9) | `"Obese II"` (35–39.9) | `"Obese III"` (≥40) | `"Unknown"`.

The lib does not split obesity into classes I–III. Do not derive them in the UI.

---

## Cross-Tool Data

- **← Patient:** weight (kg) and height (**cm**). Use metric mode and pass height as meters: `String(Number(height) / 100)`.
- Weight could inform water-balance/sepsis but no programmatic link.

---

## Gotchas

- **No `onData`.** Display-only
- **Patient height is cm, BMI metric height is m.** Convert before passing

---

## CLI

```bash
medprotocol bmi --weight 70 --height-m 1.75 --metric
```

---

## Guideline Reference

WHO BMI classification (2000). Metric: kg/m². Imperial: (lb/in²)×703. Citation: `sources.WHO_BMI_2000`.
