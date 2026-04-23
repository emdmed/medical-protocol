# Nephrology Component Context

## Component Summary

CKDEvaluator — eGFR (CKD-EPI 2021), CGA staging (Cause + GFR + Albuminuria), KFRE risk, treatment eligibility (RASi, SGLT2i, finerenone), progression monitoring. Includes CKD cause categorization (glomerular, tubulointerstitial, vascular, cystic-congenital, systemic, unknown).

Install: `npx medical-ui-cli add ckd`
Files: `ckd-evaluator.tsx`, `lib.ts`, `types/ckd.ts` — shadcn: card, input, button, badge, label, separator, select, checkbox

**Companion — Nephrology** (separate install):
- **Anemia** — sex-specific Hb (KDIGO 2012), iron status (ferritin, TSAT, serum iron, reticulocytes), ESA eligibility
- **PhosphoCalcic** — Ca/P/PTH/VitD, Ca×P product, corrected Ca, CKD-MBD monitoring by GFR category
- **CardioMetabolic** — LDL, HDL, Non-HDL, Lp(a), ApoB, triglycerides, HbA1c, BP, glucose, KDIGO statin indication

Shared UI primitives in `nephrology/ui-helpers.tsx`: `useSyncedReadings`, `ValueGrid`, `AddForm`, `HistoryTable`, `V` (severity-colored value display). Uses semantic CSS severity classes (`severity-normal`, `severity-warning`, `severity-critical`, `severity-urgent`, `severity-watch`).

```bash
npx medical-ui-cli add nephrology        # GROUP — installs ckd/ + nephrology/
npx medical-ui-cli add ckd               # CKD only
npx medical-ui-cli add anemia            # ALIAS — nephrology/ folder
npx medical-ui-cli add phospho-calcic    # ALIAS — nephrology/ folder
npx medical-ui-cli add cardio-metabolic  # ALIAS — nephrology/ folder
```

**IMPORTANT:** Nephrology is a **separate** component — do NOT modify `ckd-evaluator.tsx` to add anemia or MBD logic.

---

## Props

```typescript
// CKD
interface CKDProps { data?: CKDPatientData; onData?: (data: CKDPatientData) => void; }

// Anemia
interface AnemiaProps { data?: AnemiaReading[]; onData?: (data: AnemiaReading[]) => void; sex?: string; }

// PhosphoCalcic
interface PhosphoCalcicProps { data?: PhosphoCalcicReading[]; onData?: (data: PhosphoCalcicReading[]) => void; gfrCategory?: string; }

// CardioMetabolic
interface CardioMetabolicProps {
  data?: CardioMetabolicReading[];
  onData?: (data: CardioMetabolicReading[]) => void;
  gfrCategory?: string;
  age?: number | null;
  hasDiabetes?: boolean;
  hasPriorCVD?: boolean;
  hasKidneyTransplant?: boolean;
}
```

### Key Types

```typescript
type CKDCauseCategory = "" | "glomerular" | "tubulointerstitial" | "vascular" | "cystic-congenital" | "systemic" | "unknown";

interface CKDPatientData {
  age: string;
  sex: string;
  causeCategory: CKDCauseCategory;  // CGA "C" axis
  causeDetail: string;               // free-text specific cause
  hasDiabetes: boolean;
  hasHeartFailure: boolean;
  hasPriorCVD: boolean;              // prior cardiovascular disease
  hasKidneyTransplant: boolean;      // kidney transplant recipient
  onMaxRASi: boolean;
  potassiumNormal: boolean;
  readings: CKDReading[];
}

interface AnemiaReading {
  id: string; date: string;
  hemoglobin: string;     // g/dL
  ferritin: string;       // ng/mL
  tsat: string;           // % (transferrin saturation)
  iron: string;           // µg/dL (serum iron)
  reticulocytes: string;  // %
  sex?: string;
}

interface CardioMetabolicReading {
  id: string; date: string;
  totalCholesterol: string; ldl: string; hdl: string;  // mg/dL
  triglycerides: string;                                // mg/dL
  hba1c: string;                                        // %
  glucose: string;                                      // mg/dL
  sbp: string; dbp: string;                             // mmHg
  lpa: string;                                          // mg/dL — Lp(a)
  apoB: string;                                         // mg/dL — ApoB
}
```

See `types/ckd.ts` and `nephrology/types/interfaces.ts` for full type definitions.

---

## Lib Functions

### Shared lib (`lib/ckd.ts`)

Key functions: `calculateEGFR`, `classifyGFRCategory`, `classifyAlbuminuriaCategory`, `getGFRCategoryLabel`, `getAlbuminuriaCategoryLabel`, `getCKDRiskLevel`, `getMonitoringFrequency`, `calculateKFRE`, `assessReferralNeed`, `getReferralLabel`, `checkRASiEligibility`, `checkSGLT2iEligibility`, `checkFinerenoneEligibility`, `calculateEGFRSlope`, `isRapidDecline`, `hasSignificantEGFRChange`, `hasACRDoubling`, `classifyAnemia`, `assessIronStatus`, `checkESAEligibility`, `assessPhosphate`, `correctCalcium`, `assessPTH`, `assessVitaminD`, `getCKDMBDMonitoring`, `getCKDSeverity`.

### Nephrology component lib (`nephrology/lib.ts`)

Cardio-metabolic: `classifyLDL`, `classifyHbA1c`, `classifyBPInCKD`, `classifyTriglycerides`, `classifyLpa`, `classifyNonHDL`, `classifyApoB`.

Phospho-calcic: `calculateCaPhProduct`, `calculateCorrectedCalcium`, `classifyCalcium`, `classifyPhosphorus`, `classifyPTH`, `classifyVitaminD`, `classifyCaPhProduct`, `getPhosphateRecommendation`, `getPTHRecommendation`, `getVitaminDRecommendation`, `getCKDMBDMonitoring`.

Anemia: `classifyHemoglobin`, `classifyFerritin`, `classifyTSAT`, `needsIronSupplementation`, `classifyAnemiaBySex`, `checkESAEligibility`.

All inputs are `string` (parsed internally via local `sf()` parser).

---

## Cross-Component Data

- **CKD ↔ Vital-Signs:** BP informational for RASi dosing context, not a direct lib input
- **CKD ↔ Acid-Base:** Bicarbonate relevant for metabolic acidosis, no programmatic link
- **CKD ↔ Sepsis:** Both use creatinine but different contexts (chronic vs acute)
- **CKD ↔ CardioMetabolic:** Statin indication uses `age`, `gfrCategory`, `hasDiabetes`, `hasPriorCVD`, `hasKidneyTransplant` from CKD

---

## Composition

Wire `sex` from CKDPatientData → Anemia (enables sex-specific Hb thresholds). Wire `gfrCategory` from latest CKD reading → PhosphoCalcic (enables stage-aware PTH + monitoring frequency). Wire `gfrCategory`, `age`, `hasDiabetes`, `hasPriorCVD`, `hasKidneyTransplant` from CKD → CardioMetabolic (enables KDIGO statin indication). Use grid layout for dashboard.

### Gotchas

- **CKD uses strings everywhere.** Convert from other components: `String(value ?? "")`
- **No circular loops.** Guard `onData` → `data` flows with `useRef` + serialized comparison
- **Inbound sync required.** CKD evaluator (and all nephrology sub-components) must have a `useEffect` that syncs the `data` prop into local state after mount — otherwise parent updates (age/sex from Patient card) are ignored after initial render. Nephrology sub-components use shared `useSyncedReadings` hook for this.
- **KFRE requires eGFR, not creatinine.** Calculate eGFR first
- **Wire `sex` to Anemia** — without it, falls back to generic classification
- **Wire `gfrCategory` to PhosphoCalcic** — without it, PTH uses generic ranges
- **Wire CKD comorbidities to CardioMetabolic** — without them, statin indication logic is incomplete
- Treatment eligibility is **informational** — always confirm clinically
- **CKD Cause is CGA, not optional.** KDIGO recommends classifying cause as part of staging (Cause-GFR-Albuminuria)

---

## CLI

```bash
npx medprotocol ckd egfr --creatinine 1.2 --age 55 --sex male
npx medprotocol ckd stage --creatinine 1.2 --age 55 --sex male --acr 45
npx medprotocol ckd kfre --age 65 --sex female --egfr 35 --acr 300
npx medprotocol ckd anemia --hb 9.5 --sex male --ferritin 80 --tsat 15
npx medprotocol ckd mbd --phosphate 5.2 --calcium 8.5 --albumin 3.2 --pth 250 --vitamin-d 18 --gfr-category G4
```

---

## Guideline Reference

KDIGO 2024 (CKD), KDIGO 2012 (Anemia), KDIGO 2017 (CKD-MBD), KDIGO 2013 (Lipids): CKD-EPI 2021 race-free eGFR, CGA staging (Cause + GFR G1-G5 + Albuminuria A1-A3), KFRE (Tangri), RASi/SGLT2i/Finerenone eligibility, eGFR slope, sex-specific Hb, iron/ESA, Ca/P/PTH/VitD monitoring, Lp(a)/ApoB/Non-HDL, statin indication by age + CKD stage.
