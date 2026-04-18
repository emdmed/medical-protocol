# CKD Component Context

## Component Summary

CKDEvaluator — eGFR calculation (CKD-EPI 2021), CGA staging (GFR + Albuminuria + Risk), KFRE kidney failure risk prediction, treatment eligibility (RASi, SGLT2i, finerenone), eGFR progression monitoring.

Install: `npx medical-ui-cli add ckd`
Files installed: `ckd-evaluator.tsx`, `lib.ts`, `types/ckd.ts`
shadcn deps: card, input, button, badge, label, separator, select

**Companion component — Nephrology** (separate install):
- **Anemia** — sex-specific Hb classification (KDIGO 2012), iron status, ESA eligibility, iron supplementation indicator
- **PhosphoCalcic** — Ca/P/PTH/Vitamin D monitoring, Ca×P product, recommendations for abnormal values, CKD-MBD monitoring frequency by GFR category
- **CardioMetabolic** — LDL, HbA1c, BP in CKD, triglycerides

Install: `npx medical-ui-cli add nephrology`
Files installed: `anemia.tsx`, `phospho-calcic.tsx`, `cardio-metabolic.tsx`, `lib.ts`, `ui-helpers.tsx`, `types/interfaces.ts`
shadcn deps: card, input, button, badge, label

**IMPORTANT:** Nephrology is a **separate** component — do NOT modify `ckd-evaluator.tsx` to add anemia or MBD logic. Install nephrology alongside ckd and compose them on the page.

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

## Nephrology Component (`npx medical-ui-cli add nephrology`)

Installed **separately** from CKD. Provides anemia, phospho-calcic, and cardio-metabolic panels for nephrology workflows.

### Anemia

```typescript
interface AnemiaProps {
  data?: AnemiaReading[];
  onData?: (data: AnemiaReading[]) => void;
  sex?: string;  // patient sex — enables sex-specific Hb thresholds + ESA eligibility
}

interface AnemiaReading {
  id: string;
  date: string;
  hemoglobin: string;  // g/dL
  ferritin: string;    // ng/mL
  tsat: string;        // % (transferrin saturation)
  iron: string;        // µg/dL
  reticulocytes: string; // %
  sex?: string;        // per-reading override (male/female)
}
```

**Key behaviors:**
- When `sex` prop or per-reading `sex` is available, uses sex-specific thresholds (male <13, female <12 g/dL) instead of generic classification
- Shows ESA eligibility indicator when sex + ferritin + TSAT are present (Hb <10 + iron replete)
- When `sex` prop is NOT provided, a sex select appears in the add-reading form
- Iron supplementation indicator always shown (ferritin <100 or TSAT <20%)

### PhosphoCalcic

```typescript
interface PhosphoCalcicProps {
  data?: PhosphoCalcicReading[];
  onData?: (data: PhosphoCalcicReading[]) => void;
  gfrCategory?: string;  // G1-G5 — enables stage-specific PTH targets + monitoring frequency
}
```

**Key behaviors:**
- Recommendations section appears below values when phosphate, PTH, or vitamin D are abnormal
- Monitoring frequency footer appears when `gfrCategory` prop is provided (KDIGO CKD-MBD 2017 intervals)
- Pass `gfrCategory` from the CKD evaluator to enable stage-aware PTH interpretation (2-9× UNL for G4-G5)

---

## Nephrology lib functions (nephrology/lib.ts)

| Function | Inputs | Output |
|---|---|---|
| `classifyAnemiaBySex` | hb, sex | {label, severity, anemic} — sex-specific thresholds |
| `checkESAEligibility` | hb, ferritin, tsat, sex | {eligible, reason} |
| `getPhosphateRecommendation` | phosphorus, gfrCategory? | {status, recommendation} |
| `getPTHRecommendation` | pth, gfrCategory? | {status, recommendation} |
| `getVitaminDRecommendation` | vitaminD | {status, recommendation} |
| `getCKDMBDMonitoring` | gfrCategory | {phosphate, calcium, pth, vitaminD} intervals |

These mirror the corresponding `lib/ckd.ts` functions but use the `sf()` parser from nephrology/lib.ts.

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
| `classifyAnemia` | hemoglobin, sex | {anemic, severity} |
| `assessIronStatus` | ferritin, tsat | {ironDeficient, recommendation} |
| `checkESAEligibility` | hemoglobin, ferritin, tsat, sex | {eligible, reason} |
| `assessPhosphate` | phosphate, gfrCategory | {status, recommendation} |
| `correctCalcium` | calcium, albumin | number (corrected Ca) |
| `assessPTH` | pth, gfrCategory | {status, recommendation} |
| `assessVitaminD` | vitaminD25OH | {status, recommendation} |
| `getCKDMBDMonitoring` | gfrCategory | {phosphate, calcium, pth, vitaminD} monitoring intervals |

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

### Nephrology Dashboard (with Anemia + CKD-MBD)

Requires both: `npx medical-ui-cli add ckd` AND `npx medical-ui-cli add nephrology`

```tsx
import CKDEvaluator from "@/components/ckd/ckd-evaluator";
import Anemia from "@/components/nephrology/anemia";
import PhosphoCalcic from "@/components/nephrology/phospho-calcic";
import VitalSigns from "@/components/vital-signs/vital-signs";

function NephrologyDashboard() {
  const [ckdData, setCkdData] = useState<CKDPatientData | null>(null);

  // Derive gfrCategory from latest CKD reading for stage-aware sub-components
  const latestReading = ckdData?.readings[ckdData.readings.length - 1];
  const gfrCategory = latestReading?.gfrCategory;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <CKDEvaluator data={ckdData ?? undefined} onData={setCkdData} />
      <Anemia sex={ckdData?.sex} />
      <PhosphoCalcic gfrCategory={gfrCategory} />
      <VitalSigns onData={handleVitals} editable />
    </div>
  );
}
```

### Full Nephrology + Metabolic Dashboard

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <CKDEvaluator data={ckdData} onData={setCkdData} />
  <Anemia sex={ckdData?.sex} />
  <PhosphoCalcic gfrCategory={gfrCategory} />
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
- **Wire `sex` to Anemia.** Pass `sex` from CKDPatientData to enable sex-specific Hb thresholds. Without it, the component falls back to generic classification and shows a sex select in the form.
- **Wire `gfrCategory` to PhosphoCalcic.** Derive from latest CKD reading. Without it, PTH uses generic ranges and monitoring frequency is hidden.

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

# Anemia assessment
npx medprotocol ckd anemia --hb 9.5 --sex male --ferritin 80 --tsat 15

# CKD-MBD assessment
npx medprotocol ckd mbd --phosphate 5.2 --calcium 8.5 --albumin 3.2 --pth 250 --vitamin-d 18 --gfr-category G4
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
- Anemia of CKD (KDIGO 2012 Anemia): Hb thresholds, iron status, ESA eligibility
- CKD-MBD (KDIGO 2017 CKD-MBD): phosphate, corrected calcium, PTH, vitamin D, monitoring frequency
