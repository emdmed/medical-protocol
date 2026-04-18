# Sepsis Component Context

## Component Summary

SepsisMonitor — SOFA scoring (6 organs, 0-24), qSOFA screening (0-3), Sepsis-3 assessment, septic shock detection, hour-1 bundle tracker, lactate clearance monitoring.

Install: `npx medical-ui-cli add sepsis`
Files installed: `sepsis-monitor.tsx`, `lib.ts`, `types/sepsis.ts`
shadcn deps: card, input, button, badge, label, separator, checkbox

---

## Props & Data Flow

```typescript
interface SepsisProps {
  data?: SepsisPatientData;          // pre-fill patient data
  onData?: (data: SepsisPatientData) => void;  // fires on every change
}
// dataFlow: bidirectional
```

### Core Types

```typescript
interface SepsisReading {
  id: string; timestamp: string;
  // Respiration SOFA
  paO2: string; fiO2: string; onVentilation: boolean;
  // Coagulation / Liver
  platelets: string; bilirubin: string;
  // Cardiovascular
  map: string; dopamine: string; dobutamine: string;
  epinephrine: string; norepinephrine: string;
  // CNS / Renal
  gcs: string; creatinine: string; urineOutput: string;
  // Screening
  respiratoryRate: string; sbp: string;
  // Sepsis assessment
  suspectedInfection: boolean; lactate: string;
}

interface Hour1Bundle {
  lactateMeasured: boolean; bloodCulturesObtained: boolean;
  antibioticsGiven: boolean; fluidBolusGiven: boolean;
  vasopressorsStarted: boolean; bundleStartTime: number | null;
}

interface SepsisPatientData {
  weight: string; baselineSOFA: string;
  readings: SepsisReading[]; hour1Bundle: Hour1Bundle;
}
```

---

## lib/sepsis.ts — Function Signatures

| Function | Inputs | Output |
|---|---|---|
| `calculateRespirationSOFA` | paO2, fiO2, onVentilation | 0-4 |
| `calculateCoagulationSOFA` | platelets | 0-4 |
| `calculateLiverSOFA` | bilirubin | 0-4 |
| `calculateCardiovascularSOFA` | map, dopa, dobu, epi, norepi | 0-4 |
| `calculateCNSSOFA` | gcs | 0-4 |
| `calculateRenalSOFA` | creatinine, urineOutput, weight, hours | 0-4 |
| `calculateTotalSOFA` | reading, weight, hours | 0-24 |
| `calculateSOFADelta` | current, baseline | number |
| `calculateQSOFA` | rr, sbp, gcs | 0-3 |
| `isQSOFAPositive` | score | boolean (≥2) |
| `assessSepsis` | sofaScore, sofaDelta, suspectedInfection | boolean |
| `assessSepticShock` | hasSepsis, vasopressorsNeeded, lactate | boolean (lactate >2) |
| `assessBundleCompliance` | bundle, currentTime | {complete, allItemsDone, withinTimeLimit} |
| `calculateLactateClearance` | initial, repeat | string % or null |
| `isLactateClearanceAdequate` | clearance | boolean (≥10%) |
| `getSOFASeverityLevel` | score | Low/Moderate/High/Very High |
| `hasVasopressors` | dopa, dobu, epi, norepi | boolean |

All inputs are `string` (parsed internally via `safeParseFloat`).

---

## Cross-Component Data Sharing

### Sepsis ↔ Vital-Signs

Shared parameters (type conversion required):

| Parameter | Vital-Signs type | Sepsis type | Mapping |
|---|---|---|---|
| Respiratory rate | `number \| null` | `string` | `String(vitals.respiratoryRate ?? "")` |
| Systolic BP | `number \| null` (in bloodPressure.systolic) | `string` (sbp) | `String(vitals.bloodPressure.systolic ?? "")` |
| SpO2 | `number \| null` (in bloodOxygen.saturation) | — | Display only; sepsis uses PaO2 not SpO2 |
| FiO2 | `number \| null` (in bloodOxygen.fiO2) | `string` | `String(vitals.bloodOxygen.fiO2 ?? "")` |

```tsx
// Feed vital-signs data into sepsis qSOFA screening
<VitalSigns onData={(data) => {
  setReading(prev => ({
    ...prev,
    respiratoryRate: String(data.respiratoryRate ?? ""),
    sbp: String(data.bloodPressure.systolic ?? ""),
    fiO2: String(data.bloodOxygen.fiO2 ?? ""),
  }));
}} />
<SepsisMonitor data={sepsisData} onData={setSepsisData} />
```

### Sepsis ↔ PaFi

Both calculate PaO2/FiO2 ratio. Sepsis uses it for respiration SOFA scoring; PaFi classifies ARDS severity. PaFi is self-contained (no props) — they coexist but don't share data programmatically.

### Sepsis ↔ Acid-Base

No direct data sharing. Acid-Base is output-only (fires `onData` with analysis `Result`). Both can coexist on a dashboard. Acid-Base does not accept PaO2/FiO2 as input — it analyzes pH/pCO2/HCO3/Na/Cl/Albumin.

### Sepsis ↔ DKA

Both track critically ill patients. No overlapping inputs. DKA depends on acid-base (imports `analyze()`); sepsis does not. Can coexist on an ICU dashboard without data wiring.

---

## Composition Patterns

### ICU Dashboard with Sepsis + Vitals

```tsx
import SepsisMonitor from "@/components/sepsis/sepsis-monitor";
import VitalSigns from "@/components/vital-signs/vital-signs";
import type { SepsisPatientData } from "@/components/sepsis/types/sepsis";
import type { IVitalSignsData } from "@/components/vital-signs/types/vital-signs";

function ICUDashboard() {
  const [sepsisData, setSepsisData] = useState<SepsisPatientData | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <VitalSigns onData={(data) => {/* feed RR, SBP into sepsis if needed */}} editable />
      <SepsisMonitor data={sepsisData ?? undefined} onData={setSepsisData} />
    </div>
  );
}
```

### Full Critical Care Dashboard

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <VitalSigns onData={handleVitals} editable />
  <SepsisMonitor data={sepsisData} onData={setSepsisData} />
  <PaFiCalculator />
  <AcidBase onData={handleABG} />
  <DKAMonitor data={dkaData} onData={setDkaData} />
  <WaterBalanceCalculator data={{ weight: 70 }} />
</div>
```

### Gotchas

- **Sepsis uses strings everywhere.** Convert `number | null` from other components with `String(value ?? "")`.
- **No circular loops.** Sepsis `onData` fires on every reading change. If you feed data back into `data` prop from another component's callback, guard with `useRef` + serialized comparison.
- **Hour-1 bundle uses Unix timestamps** (seconds). Pass `Date.now() / 1000` for `bundleStartTime` and `currentTime`.
- **AcidBase fires `onData(null)` on mount.** Guard with `if (!result) return` in your handler.
- **overflow-hidden:** Add `overflow-visible` to any shadcn `Card` wrapping sepsis if it has popups.

---

## CLI Calculator

```bash
# qSOFA screening
npx medprotocol sepsis qsofa --rr 24 --sbp 90 --gcs 13

# SOFA organ score
npx medprotocol sepsis sofa --pao2 60 --fio2 40 --vent --platelets 80 \
  --bilirubin 2.5 --map 62 --norepi 0.08 --gcs 14 \
  --creatinine 1.8 --urine-output 400 --weight 70 --hours 24

# Lactate clearance
npx medprotocol sepsis lactate --initial 4.2 --repeat 2.1
```

Always use `--json` internally, translate output to clinical language.

---

## Guideline Reference

Sepsis guidelines (SSC 2026) are chunked in `docs/sepsis-guidelines/01-08`. Only load the section matching the current clinical task. See `context-files/sepsis/sepsis-guidelines.md` for the index and agent composition rules mapping guideline sections → lib functions → code coverage.

**Key rule:** Do not build UI for guideline recommendations that lack backing functions in `lib/sepsis.ts` (sections 6 and 8 have no code coverage).
