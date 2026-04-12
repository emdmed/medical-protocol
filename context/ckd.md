# CKD Component Context

## Component Summary

CKDEvaluator — eGFR calculation (CKD-EPI 2021), CGA staging (GFR + Albuminuria + Risk), KFRE kidney failure risk prediction, treatment eligibility (RASi, SGLT2i, finerenone), eGFR progression monitoring.

Install: `npx medical-ui-cli add ckd`
Files installed: `ckd-evaluator.tsx`, `lib.ts`, `types/ckd.ts`
shadcn deps: card, input, button, badge, label, separator, select

---

## Props & Data Flow

```typescript
interface CKDProps {
  data?: CKDPatientData;                    // pre-fill patient data
  onData?: (data: CKDPatientData) => void;  // fires on every change
}
// dataFlow: bidirectional
```

### Core Types

```typescript
interface CKDReading {
  id: string;
  timestamp: string;
  creatinine: string;
  acr: string;
  egfr: number;
  gfrCategory: string;
  albCategory: string;
}

interface CKDPatientData {
  age: string;
  sex: string;
  hasDiabetes: boolean;
  hasHeartFailure: boolean;
  onMaxRASi: boolean;
  potassiumNormal: boolean;
  readings: CKDReading[];
}
```

---

## lib/ckd.ts — Function Signatures

| Function | Inputs | Output |
|---|---|---|
| `calculateEGFR` | creatinine, age, sex | number (mL/min/1.73m²) |
| `classifyGFRCategory` | egfr | G1–G5 |
| `classifyAlbuminuriaCategory` | acr | A1–A3 |
| `getGFRCategoryLabel` | category | description string |
| `getAlbuminuriaCategoryLabel` | category | description string |
| `getCKDRiskLevel` | gfrCategory, albCategory | green/yellow/orange/red/deep-red |
| `getMonitoringFrequency` | gfrCategory, albCategory | times/year (1-4) |
| `calculateKFRE` | age, sex, egfr, acr | {twoYear, fiveYear} % |
| `assessReferralNeed` | kfre5yr | none/nephrology/multidisciplinary/krt-planning |
| `checkRASiEligibility` | gfrCategory, albCategory, hasDiabetes | {eligible, grade} |
| `checkSGLT2iEligibility` | egfr, acr, hasHeartFailure | {eligible, grade} |
| `checkFinerenoneEligibility` | egfr, acr, hasDiabetes, onMaxRASi, potassiumNormal | {eligible, grade} |
| `calculateEGFRSlope` | readings (JSON) | mL/min/1.73m²/year |
| `isRapidDecline` | slope | boolean (≤ -5) |
| `hasSignificantEGFRChange` | previous, current | boolean (>20% drop) |
| `hasACRDoubling` | previous, current | boolean (≥2×) |
| `getCKDSeverity` | gfrCategory | normal/warning/critical |

All inputs are `string` (parsed internally via `safeParseFloat`).

---

## Cross-Component Data Sharing

### CKD ↔ Vital-Signs

Shared parameters (type conversion required):

| Parameter | Vital-Signs type | CKD type | Mapping |
|---|---|---|---|
| Blood pressure | `{systolic, diastolic}: number \| null` | — | Display only; CKD uses BP for RASi dosing context, not as a direct input to lib functions |

```tsx
// Monitor BP alongside CKD for hypertension management
<VitalSigns onData={(data) => {
  // BP is informational for CKD treatment decisions
  setBpReading(data.bloodPressure);
}} />
<CKDEvaluator data={ckdData} onData={setCkdData} />
```

### CKD ↔ Acid-Base

Bicarbonate from acid-base analysis is clinically relevant for CKD metabolic acidosis assessment but not a direct lib function input. Both can coexist on a nephrology dashboard.

### CKD ↔ Sepsis

Sepsis renal SOFA uses creatinine; CKD uses creatinine for eGFR. No programmatic data sharing — different clinical contexts (acute vs. chronic).

---

## Composition Patterns

### Nephrology Dashboard

```tsx
import CKDEvaluator from "@/components/ckd/ckd-evaluator";
import VitalSigns from "@/components/vital-signs/vital-signs";

function NephrologyDashboard() {
  const [ckdData, setCkdData] = useState<CKDPatientData | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <CKDEvaluator data={ckdData ?? undefined} onData={setCkdData} />
      <VitalSigns onData={handleVitals} editable />
    </div>
  );
}
```

### Full Nephrology + Metabolic Dashboard

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <CKDEvaluator data={ckdData} onData={setCkdData} />
  <VitalSigns onData={handleVitals} editable />
  <AcidBase onData={handleABG} />
  <WaterBalanceCalculator data={{ weight: 70 }} />
</div>
```

### Gotchas

- **CKD uses strings everywhere.** Convert `number | null` from other components with `String(value ?? "")`.
- **No circular loops.** CKD `onData` fires on every reading change. If you feed data back into `data` prop from another component's callback, guard with `useRef` + serialized comparison.
- **KFRE requires eGFR, not creatinine.** Calculate eGFR first, then pass to KFRE.
- **Risk heatmap colors** map to: green=low, yellow=moderate, orange=high, red=very high, deep-red=highest risk.
- **Treatment eligibility** is informational — always confirm with clinical context before prescribing.

---

## CLI Calculator

```bash
# eGFR calculation
npx medprotocol ckd egfr --creatinine 1.2 --age 55 --sex male

# Full CGA staging
npx medprotocol ckd stage --creatinine 1.2 --age 55 --sex male --acr 45

# Kidney failure risk prediction
npx medprotocol ckd kfre --age 65 --sex female --egfr 35 --acr 300

# Treatment eligibility
npx medprotocol ckd treatment --egfr 35 --acr 300 --diabetes
```

Always use `--json` internally, translate output to clinical language.

---

## Guideline Reference

Based on KDIGO 2024 Clinical Practice Guideline for CKD Evaluation and Management:
- CKD-EPI 2021 race-free eGFR equation
- GFR categories G1–G5, Albuminuria categories A1–A3
- KDIGO risk heatmap (GFR × Albuminuria)
- 4-variable KFRE (Tangri et al.)
- Treatment eligibility: RASi (ACEi/ARB), SGLT2i, Finerenone (MRA)
- Progression monitoring: eGFR slope, rapid decline (≥5 mL/min/year), significant change (>20%)
