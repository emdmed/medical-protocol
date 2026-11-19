# Vital-Signs Module Context

BP (systolic/diastolic), HR, RR, temperature (C/F), SpO2, FiO2. Inline editing, FHIR R4 bundle export, abnormal value flagging.

Logic: `lib/medprotocol/vital-signs-validations/` — import from `@/lib/medprotocol/vital-signs-validations/<file>`. Build: see `building.md`.

---

## Screen spec

**Shows:** one row/tile per vital with value, unit, and a severity badge when abnormal.

**Inputs** (`number | null`, empty by default):

| Vital | Unit | Valid entry range |
|---|---|---|
| Blood pressure | mmHg (systolic/diastolic) | 40–350 / 10–130 |
| Heart rate | bpm | 30–220 |
| Respiratory rate | breaths/min | 8–40 |
| Temperature | °F (default) or °C | 86–113 °F / 30–45 °C |
| SpO2 | % | 70–100 |
| FiO2 | % | 21–100, default 21 |

**FiO2 presets** (select): 21, 24, 28, 35, 40, 50, 60, 70, 80, 90, 100 %.

**Outputs:** per-vital severity and label from `severity.ts` (`normal` / `warning` / `critical`). Validation error messages from the `validate*` functions.

**Interaction:** click a vital to edit it in place (when `editable`); invalid entries show the lib's error message and are not saved. `onData` fires on every change with the data and a FHIR bundle.

**FHIR R4 bundle** (second `onData` argument): one Observation per filled vital, LOINC-coded — BP panel 85354-9 (systolic 8480-6, diastolic 8462-4), HR 8867-4, RR 9279-1, temperature 8310-5, SpO2 59408-5, FiO2 3150-0 (inhaled oxygen concentration, `%`; not 3151-8, which is O2 flow rate in L/min). Units in UCUM (`mm[Hg]`, `/min`, `%`, `[degF]`/`Cel`).

**Display rules:** badge text = the lib's `label`; color = the lib's `severity`. Never compare values against thresholds in the UI.

**Props contract:**

```typescript
interface VitalSignsProps {
  data?: IVitalSignsData;
  onData?: (data: IVitalSignsData, fhir?: FhirBundle) => void;
  editable?: boolean;        // default true
  useFahrenheit?: boolean;   // default true
  border?: boolean;          // default true
  assistant?: boolean;       // optional AI-analysis button
  assistantRoute?: string;   // API route for it
}

interface IVitalSignsData {
  bloodPressure: { systolic: number | null; diastolic: number | null };
  heartRate: number | null;
  respiratoryRate: number | null;
  temperature: number | null;          // in the unit set by useFahrenheit
  bloodOxygen: { saturation: number | null; fiO2: number | null };
  timestamp?: string;
}
```

---

## Lib Functions

**Severity** (`vital-signs-validations/severity.ts`) — each returns `{ severity: "normal" | "warning" | "critical"; label: string | null }`:
- `getBloodPressureSeverity(systolic, diastolic)` — critical ≥180/120 ("Hypertensive crisis") or <80/50 ("Severe hypotension")
- `getHeartRateSeverity(hr)` — critical >130 or <45
- `getRespiratoryRateSeverity(rr)` — critical >30 or <8
- `getTemperatureSeverity(temp, useFahrenheit = true)` — critical ≥105.8 °F / 41 °C ("Hyperpyrexia") or <89.6 °F / 32 °C ("Severe hypothermia")
- `getBloodOxygenSeverity(spo2)` — critical <90 ("Severe hypoxemia"), warning <95
- `CRITICAL_LIMITS` — the critical cutoffs above

**Validation / category** (one file per vital):
- `blood-pressure-validations.ts`: `validateBloodPressureInput`, `isValidBloodPressureInput`, `getBloodPressureCategory`, `parseBloodPressureValues`, `BLOOD_PRESSURE_LIMITS`
- `heart-rate-validations.ts`: `validateHeartRateInput`, `getHeartRateCategory`, `parseHeartRateValue`, `HEART_RATE_LIMITS`
- `respiratory-rate-validations.ts`: `validateRespiratoryRateInput`, `isValidRespiratoryRateInput`, `getRespiratoryRateCategory`, `parseRespiratoryRateValue`, `RESPIRATORY_RATE_LIMITS`
- `temperature-validations.ts`: `validateTemperatureInput`, `isElevatedTemperature`, `isLowTemperature`, `getTemperatureStatus`, `parseTemperatureValue`, `getTemperatureLimits`, `TEMPERATURE_LIMITS`
- `blood-oxygen-validations.ts`: `bloodOxygenValidations` (`spo2.*`, `fio2.*`), `hasValidBloodOxygenInput`, `hasValidFio2Input`

Category ranges (warning level):
- **BP:** High ≥130/90, Low <90/60
- **HR:** Elevated >100, Low <60
- **RR:** Elevated >18, Low <12
- **Temp:** fever ≥38 °C / ≥100.4 °F, low <35 °C / <95 °F
- **SpO2:** low <95, critical <90. **FiO2:** 21-100%

---

## Cross-Tool Data

- **→ Sepsis:** RR, SBP, FiO2 (convert `number | null` → `String(value ?? "")`)
- **→ CKD:** BP informational for RASi dosing, not direct lib input

---

## Gotchas

- **Circular updates.** If parent passes `data` and listens to `onData`, don't re-pass same data in useEffect. Dedup with a ref + serialized comparison
- **Temperature units.** Stores in current unit (C/F). Normalize before cross-source use
- **Numeric types.** All values `number | null` — most other tools take strings, convert accordingly

---

## CLI

```bash
medprotocol vitals --bp 120/80 --hr 72 --temp 37.0
medprotocol vitals --bp 90/60 --hr 110 --rr 24 --temp 38.5 --spo2 92 --fio2 40
```

---

## Guideline Reference

AHA/ACC 2017 (BP), standard adult reference ranges (HR, RR, Temp), SpO2 ≥95% normal / <90% critical. Critical cutoffs are common adult reference values that drive display emphasis only; review them against local protocol.
