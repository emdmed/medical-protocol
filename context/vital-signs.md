# Vital-Signs Component Context

## Component Summary

VitalSigns -- real-time vital signs monitor: blood pressure (systolic/diastolic), heart rate, respiratory rate, temperature (C/F toggle), SpO2, FiO2. Includes inline editing, FHIR R4 bundle export, and abnormal value flagging.

Install: `npx medical-ui-cli add vital-signs`
Files installed: `vital-signs.tsx`, `types/vital-signs.ts`, `VitalSignsFhir.tsx`
shadcn deps: card, input, button, badge, label, popover

---

## Props & Data Flow

```typescript
interface VitalSignsProps {
  data?: IVitalSignsData;                                    // pre-fill values
  onData?: (data: IVitalSignsData, fhir?: FhirBundle) => void;  // fires on every change
  editable?: boolean;                                         // enable inline edit (default true)
  assistant?: boolean;                                        // AI assistant mode
  border?: boolean;                                           // show card border (default true)
}
// dataFlow: bidirectional
```

### Core Types

```typescript
interface IVitalSignsData {
  bloodPressure: { systolic: number | null; diastolic: number | null };
  heartRate: number | null;
  respiratoryRate: number | null;
  temperature: number | null;
  bloodOxygen: { saturation: number | null; fiO2: number | null };
}
```

---

## lib/vital-signs-validations/ -- Function Signatures

### Blood Pressure (blood-pressure-validations.ts)

| Function | Inputs | Output |
|---|---|---|
| `validateBloodPressureInput` | BloodPressureValue | string (error) or `null` |
| `isValidBloodPressureInput` | value (string), type ("systolic" \| "diastolic") | boolean |
| `getBloodPressureCategory` | systolic (number), diastolic (number) | `{ category: "High" \| "Low" }` or `null` |
| `parseBloodPressureValues` | BloodPressureValue | `{ systolic, diastolic }` or `null` |

Limits: systolic 40-350, diastolic 10-130. High >= 130/90, Low < 90/60.

### Heart Rate (heart-rate-validations.ts)

| Function | Inputs | Output |
|---|---|---|
| `validateHeartRateInput` | value (string) | boolean |
| `getHeartRateCategory` | heartRate (number \| null) | `{ category: "Elevated" \| "Low" \| "Normal" }` or `null` |
| `parseHeartRateValue` | value (string) | number or `null` |

Limits: 30-220 bpm. Elevated > 100, Low < 60.

### Respiratory Rate (respiratory-rate-validations.ts)

| Function | Inputs | Output |
|---|---|---|
| `validateRespiratoryRateInput` | value (string \| number) | string (error) or `null` |
| `isValidRespiratoryRateInput` | value (string) | boolean |
| `getRespiratoryRateCategory` | rate (string \| number \| null) | `{ category: "Elevated" \| "Low" \| "Normal" }` or `null` |
| `parseRespiratoryRateValue` | value (string \| number \| null) | number or `null` |

Limits: 8-40 breaths/min. Elevated > 18, Low < 12.

### Temperature (temperature-validations.ts)

| Function | Inputs | Output |
|---|---|---|
| `validateTemperatureInput` | value (string \| number), useFahrenheit (boolean) | boolean |
| `isElevatedTemperature` | temperature (string \| number), useFahrenheit (boolean) | boolean |
| `isLowTemperature` | temperature (string \| number), useFahrenheit (boolean) | boolean |
| `getTemperatureStatus` | temperature (string \| number), useFahrenheit (boolean) | `TemperatureStatus` or `null` |
| `getTemperatureStatusCli` | temperature (string \| number), useFahrenheit (boolean) | `TemperatureStatusCli` or `null` |
| `parseTemperatureValue` | value (string \| number) | number or `null` |
| `getTemperatureLimits` | useFahrenheit (boolean) | limits object |

Limits: C 30-45 (fever >= 38, low < 35), F 86-113 (fever >= 100.4, low < 95).

### Blood Oxygen (blood-oxygen-validations.ts)

| Function/Method | Inputs | Output |
|---|---|---|
| `spo2.isValid` | value (string \| number) | boolean |
| `spo2.isLow` | value (string \| number) | boolean (< 95) |
| `spo2.isCritical` | value (string \| number) | boolean (< 90) |
| `spo2.getSeverity` | value (string \| number) | "critical" \| "low" \| "normal" \| "invalid" |
| `fio2.isValid` | value (string \| number) | boolean |
| `fio2.isSupplemental` | value (string \| number) | boolean (> 21) |
| `fio2.isRoomAir` | value (string \| number) | boolean (= 21) |
| `fio2.getDeliveryMethod` | value (string \| number) | "room air" \| "low flow" \| "high flow" \| "invalid" |
| `utils.calculateRatio` | spo2, fio2 | string (SpO2/FiO2 ratio) or `null` |

SpO2 limits: 70-100%. FiO2 limits: 21-100%.

---

## Cross-Component Data Sharing

### Vital-Signs -> Sepsis

Shared parameters (type conversion required):

| Parameter | Vital-Signs type | Sepsis type | Mapping |
|---|---|---|---|
| Respiratory rate | `number \| null` | `string` | `String(vitals.respiratoryRate ?? "")` |
| Systolic BP | `number \| null` (bloodPressure.systolic) | `string` (sbp) | `String(vitals.bloodPressure.systolic ?? "")` |
| FiO2 | `number \| null` (bloodOxygen.fiO2) | `string` | `String(vitals.bloodOxygen.fiO2 ?? "")` |

Note: Sepsis uses PaO2 (arterial), not SpO2 (peripheral). SpO2 from vital-signs is display-only in sepsis context.

### Vital-Signs -> CKD

BP is informational for CKD treatment decisions (RASi dosing context), not a direct input to lib functions.

---

## Composition Patterns

### Standalone

```tsx
import VitalSigns from "@/components/vital-signs/vital-signs";

function VitalsPage() {
  return <VitalSigns onData={(data, fhir) => {
    console.log(data.heartRate, data.bloodPressure);
  }} editable />;
}
```

### Read-Only (no editing, no border)

```tsx
<VitalSigns
  data={{
    bloodPressure: { systolic: 120, diastolic: 80 },
    heartRate: 72,
    respiratoryRate: 16,
    temperature: 98.6,
    bloodOxygen: { saturation: 98, fiO2: 21 },
  }}
  editable={false}
  assistant={false}
  border={false}
/>
```

### Gotchas

- **VitalSigns circular updates.** If your parent passes `data` and listens to `onData`, don't re-pass the same data back down in a useEffect loop. The hook uses ref-based dedup internally, but external effect chains can still infinite-loop.
- **Temperature units.** VitalSigns stores temperature in the unit set by `useFahrenheit`. Normalize before passing cross-source data.
- **FHIR bundle.** The second argument to `onData` is a FHIR R4 Bundle with LOINC codes. Always available.
- **overflow-hidden.** Add `overflow-visible` to any shadcn `Card` wrapping VitalSigns -- its edit popups use absolute positioning.
- **Numeric types.** All values in `IVitalSignsData` are `number | null`, not strings. Other components (sepsis, DKA) use strings -- convert with `String(value ?? "")`.

---

## CLI Calculator

```bash
# Evaluate vital signs
npx medprotocol vitals --bp 120/80 --hr 72 --temp 37.0

# With SpO2 and FiO2
npx medprotocol vitals --bp 90/60 --hr 110 --rr 24 --temp 38.5 --spo2 92 --fio2 40
```

Always use `--json` internally, translate output to clinical language.

---

## Guideline Reference

Based on standard clinical vital sign ranges:
- Blood pressure: AHA/ACC 2017 guidelines
- Heart rate, respiratory rate, temperature: standard adult reference ranges
- SpO2: normal >= 95%, critical < 90%
- FiO2: room air = 21%, supplemental > 21%
