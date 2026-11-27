# Patient Module Context

Basic synthetic patient demographics: a synthetic label and code, age, sex, weight, height. No real identity: no name, date of birth or record number. Single source of truth for demographics on a dashboard.

Logic: `lib/medprotocol/patient.ts` — import from `@/lib/medprotocol/patient`. Build: see `building.md`.

---

## Screen spec

**Shows:** compact card with the synthetic label and code (`Synthetic patient 7K3Q`), age (`45y`), sex, weight and height. Empty state: "Click to add patient info".

**Inputs** (strings, empty by default):

| Field | Type / unit | Placeholder |
|---|---|---|
| Age | years, whole number 0–120; saved as a number, `null` when empty | 45 |
| Sex | Select or Segmented Control: male / female | — |
| Weight | kg | 70 |
| Height | **cm** | 170 |

**Outputs:** none. `label` is always `Synthetic patient`; `code` is 4 random characters (A–Z without I and O, 2–9) set on first save and kept after.

**Interaction:** click the card to enter edit mode, edit, save or cancel. `onData` fires when the saved data changes.

**Display rules:** hide age when it is `null`. Units next to weight and height.

**Props contract:** `data?: PatientData`, `onData?: (data: PatientData) => void`. Sync the `data` prop into state when it changes (serialized comparison).

```typescript
interface PatientData {
  label: string;         // always "Synthetic patient"
  code: string;          // 4 characters, e.g. "7K3Q"
  age: number | null;    // whole years
  sex: string;           // "male" | "female"
  weight: string;        // kg
  height: string;        // cm
}
```

---

## Synthetic patient generator

For the **Generate random patient** button (`building.md` §3). Each press: pick a scenario at random, draw each value uniformly in its range, apply the couplings, round as stated. Fields not listed stay empty.

- **Label and code:** `Synthetic patient` and a new 4-character code (`Synthetic patient 7K3Q`).
- **Age:** 18–90 years, whole number.
- **Sex:** male or female at random.
- **Height:** 150–180 cm for a female, 160–195 cm for a male.
- **Weight:** target BMI 18.5–38 × height² (height in m), rounded to 0.1 kg.

Every generated patient is labelled "Synthetic patient" with a 4-character code, never a name. Results still come only from the lib.

## Lib Functions

The card needs no lib call. Shared helpers that ship alongside:
- `sources.ts` — guideline citation strings (e.g. `KDIGO_2024_CKD`, `ADA_2026_TABLE_2_1`, `SEPSIS_3_2016`). Show the one a screen's lib call cites.
- `trace.ts` — `Trace` class: `t.record(fn, inputs, output, source?)` returns `output` and logs the call; `t.toJSON()` → `TraceEntry[]`, stored on readings as `trace` for audit.

---

## Cross-Tool Data

Patient feeds every tool that needs demographics. Pass its fields down instead of collecting them again on each screen.

| Tool | Fields |
|---|---|
| ckd / nephrology | age, sex |
| cardiology | age, sex |
| diabetes-dx | age, sex |
| hepatology | age |
| dka | weight |
| sepsis | weight |
| water-balance | weight |
| bmi | weight, height (cm → m) |

Convert types at the boundary: `String(patient.age ?? "")` for string inputs; `Number(patient.weight)` for water-balance's numeric `data`; `String(Number(patient.height) / 100)` for BMI height in meters.

---

## Gotchas

- **Height is cm here**, BMI's metric input is meters
- **Age is a number** (`number | null`); most lib functions take strings
- **Multi-patient dashboards:** add `key={activeId}` on every screen so switching patients remounts them cleanly
