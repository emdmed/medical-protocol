# Patient Module Context

Basic patient demographics: name, date of birth (age calculated from it), sex, weight, height. Single source of truth for demographics on a dashboard.

Logic: `lib/medprotocol/patient.ts` — import from `@/lib/medprotocol/patient`. Build: see `building.md`.

---

## Screen spec

**Shows:** compact card with name, age (`45y`), sex, weight and height. Empty state: "Click to add patient info".

**Inputs** (strings, empty by default):

| Field | Type / unit | Placeholder |
|---|---|---|
| Full name | text | Patient name |
| Date of birth | Date Input, ISO `YYYY-MM-DD` | — |
| Sex | Select or Segmented Control: male / female | — |
| Weight | kg | 70 |
| Height | **cm** | 170 |

**Outputs:** `age` from `calculateAge(dateOfBirth)`, recomputed on save.

**Interaction:** click the card to enter edit mode, edit, save or cancel. `onData` fires when the saved data changes.

**Display rules:** hide age when `calculateAge` returns `null`. Units next to weight and height.

**Props contract:** `data?: PatientData`, `onData?: (data: PatientData) => void`. Sync the `data` prop into state when it changes (serialized comparison).

```typescript
interface PatientData {
  fullName: string;
  dateOfBirth: string;   // YYYY-MM-DD
  age: number | null;    // from calculateAge
  sex: string;           // "male" | "female"
  weight: string;        // kg
  height: string;        // cm
}
```

---

## Lib Functions

- `calculateAge(dateOfBirth: string)` → `number | null` — whole years as of today. `null` for empty, unparseable or future dates.

Other shared helpers that ship alongside:
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
