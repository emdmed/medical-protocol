# Nephrology Module Context

Two tools that share one context:

- **ckd** — eGFR (CKD-EPI 2021), CGA staging (Cause + GFR + Albuminuria), KFRE risk, guideline criteria (RASi, SGLT2i, finerenone), progression monitoring. Includes CKD cause categorization (glomerular, tubulointerstitial, vascular, cystic-congenital, systemic, unknown).
- **nephrology** (companion to ckd) — three panels:
  - **Anemia** — sex-specific Hb (KDIGO 2012), iron status (ferritin, TSAT, serum iron, reticulocytes), ESA criteria
  - **PhosphoCalcic** — Ca/P/PTH/VitD, Ca×P product, corrected Ca, CKD-MBD monitoring by GFR category
  - **CardioMetabolic** — LDL, HDL, Non-HDL, Lp(a), ApoB, triglycerides, HbA1c, BP, glucose

Logic: `lib/medprotocol/ckd.ts` (import `@/lib/medprotocol/ckd`) and `lib/medprotocol/nephrology.ts` (import `@/lib/medprotocol/nephrology`). Build: see `building.md`. Screens: `components/medprotocol/ckd/ckd.tsx` and `components/medprotocol/nephrology/{anemia,phospho-calcic,cardio-metabolic}.tsx`.

**IMPORTANT:** Nephrology panels are **separate** screens — do NOT add anemia or MBD logic to the CKD screen.

---

## Screen spec — CKD

**Shows:**
- **Header:** age, sex, CKD cause category + free-text detail, comorbidities (diabetes, heart failure, prior CVD, kidney transplant, on max RASi, potassium normal). Click to edit
- **Current status:** eGFR (mL/min/1.73m²), GFR category + label, albuminuria category + label, KDIGO risk heatmap color, monitoring frequency (times/year)
- **KFRE:** 2-year and 5-year kidney failure risk (%) + referral recommendation
- **Guideline criteria:** RASi, SGLT2i, finerenone criteria-met badges with evidence grade
- **Progression:** eGFR slope (mL/min/1.73m²/yr), rapid-decline alert, significant-change alert (>20% drop), ACR doubling alert
- **Reading history:** compact table with eGFR trend

**Add reading:** date (YYYY-MM-DD), creatinine (mg/dL, > 0), ACR (mg/g). eGFR, GFR category and albuminuria category are computed by the lib at save time and stored on the reading.

**Cause options:** Glomerular, Tubulointerstitial, Vascular, Cystic / Congenital, Systemic, Unknown.

**Display rules:** heatmap color from `getCKDRiskLevel`; severity from `getCKDSeverity`. Guideline criteria are informational.

**Props contract:** `data?: CKDPatientData`, `onData?: (data: CKDPatientData) => void`.

```typescript
type CKDCauseCategory = "" | "glomerular" | "tubulointerstitial" | "vascular" | "cystic-congenital" | "systemic" | "unknown";

interface CKDReading {
  id: string; date: string;           // YYYY-MM-DD
  creatinine: string;                 // mg/dL
  acr: string;                        // mg/g
  egfr: number; gfrCategory: string; albCategory: string;   // stored from lib at save
  trace?: TraceEntry[];
}

interface CKDPatientData {
  age: string;
  sex: string;                        // "male" | "female"
  causeCategory: CKDCauseCategory;    // CGA "C" axis
  causeDetail: string;
  hasDiabetes: boolean; hasHeartFailure: boolean; hasPriorCVD: boolean; hasKidneyTransplant: boolean;
  onMaxRASi: boolean; potassiumNormal: boolean;
  readings: CKDReading[];
}
```

---

## Screen spec — Nephrology panels

All three share one layout: latest-reading value grid (value + unit + lib severity), recommendation strip, history table, add-reading form. On narrow containers a Latest / History toggle replaces the side-by-side view. Each reading has `id`, `date` and optional `trace`.

| Panel | Inputs (unit) | Outputs | Extra props |
|---|---|---|---|
| **Anemia** | Hb (g/dL), ferritin (ng/mL), TSAT (%), serum iron (µg/dL), reticulocytes (%) | Hb class (sex-specific when `sex` known), ferritin + TSAT class, iron supplementation needed + reason, ESA criteria + reason | `sex?: string` |
| **PhosphoCalcic** | Calcium (mg/dL), phosphorus (mg/dL), PTH (pg/mL), 25-OH vitamin D (ng/mL), albumin (g/dL) | Corrected Ca, Ca×P product (target <55), class per value, phosphate / PTH / vitamin D recommendations (only when abnormal), monitoring schedule for `gfrCategory` | `gfrCategory?: string` |
| **CardioMetabolic** | Total cholesterol, LDL, HDL, triglycerides (mg/dL), HbA1c (%), glucose (mg/dL), SBP/DBP (mmHg), Lp(a), ApoB (mg/dL) | Class per value, BP vs CKD target, Non-HDL class | `gfrCategory?`, `age?: number \| null`, `hasDiabetes?`, `hasPriorCVD?`, `hasKidneyTransplant?` |

**Props contract (each panel):** `data?: <Reading>[]`, `onData?: (data: <Reading>[]) => void`, plus the extra props above.

**Statin indication (KDIGO 2013, CardioMetabolic):** from `getStatinIndication`. LDL does not drive it. ≥50 y + eGFR <60 → statin or statin/ezetimibe (1A); ≥50 y + eGFR ≥60 → statin (1B); 18–49 y → statin if coronary disease, diabetes, prior ischemic stroke or 10-y coronary risk >10% (2A); kidney transplant → statin (2B); dialysis → criterion to start not met, criterion to continue met if already on one. Show the criterion text and grade.

---

## Lib Functions

### `ckd.ts`

All inputs `string` (parsed via `safeParseFloat`) unless noted.

- Staging: `calculateEGFR(creatinine, age, sex)` → `number`; `classifyGFRCategory(egfr)` → G1–G5; `getGFRCategoryLabel(category)`; `classifyAlbuminuriaCategory(acr)` → A1–A3; `getAlbuminuriaCategoryLabel(category)`; `getCKDRiskLevel(gfrCategory, albCategory)` → green / yellow / orange / red / deep-red; `getMonitoringFrequency(gfrCategory, albCategory)` → times/year; `getCKDSeverity(gfrCategory)` → normal / warning / critical
- KFRE: `calculateKFRE(age, sex, egfr, acr)` → `{ twoYear, fiveYear }` (%); `assessReferralNeed(kfre5yr)` → none / nephrology / multidisciplinary / krt-planning; `getReferralLabel(referral)`
- Treatment: `checkRASiEligibility(gfrCategory, albCategory, hasDiabetes)`, `checkSGLT2iEligibility(egfr, acr, hasHeartFailure)`, `checkFinerenoneEligibility(egfr, acr, hasDiabetes, onMaxRASi, potassiumNormal)` — each → `{ eligible, grade }`
- Progression: `calculateEGFRSlope(readings: string)` — **JSON string** of `[{ egfr, date }]`, → `number | null`; `isRapidDecline(slope: string)` — ≤ −5/yr; `hasSignificantEGFRChange(previous, current)` — >20% drop; `hasACRDoubling(previous, current)`
- Anemia / MBD (CLI-oriented, also usable): `classifyAnemia(hb, sex)`, `assessIronStatus(ferritin, tsat)`, `checkESAEligibility(hb, ferritin, tsat, sex)`, `assessPhosphate(phosphate, gfrCategory)`, `correctCalcium(calcium, albumin)`, `assessPTH(pth, gfrCategory)`, `assessVitaminD(vitaminD)`, `getCKDMBDMonitoring(gfrCategory)`

### `nephrology.ts`

Each `classify*` returns `{ label, severity }` (severity `normal | warning | critical`).

- Cardio-metabolic: `classifyLDL(ldl)`, `classifyHbA1c(hba1c)`, `classifyBPInCKD(sbp, dbp)` (target <120/80), `classifyTriglycerides(tg)`, `classifyLpa(lpa)`, `classifyNonHDL(nonHdl: number)`, `classifyApoB(apoB)`, `calculateNonHDL(totalCholesterol, hdl)` → `number | null`, `getStatinIndication({ age, gfrCategory, onDialysis?, kidneyTransplant?, alreadyOnStatin?, coronaryDisease?, hasDiabetes?, priorIschemicStroke?, tenYearCoronaryRiskOver10? })` → `{ indicated, recommendation, grade }`
- Phospho-calcic: `calculateCaPhProduct(calcium, phosphorus)` → `number | null`, `calculateCorrectedCalcium(calcium, albumin)` → `number | null` (Ca + 0.8 × (4.0 − albumin)), `classifyCalcium`, `classifyPhosphorus`, `classifyPTH(pth, gfrCategory?)` (G4–G5: 130–585 pg/mL = within target, <130 = below target; same rules as `assessPTH`), `classifyVitaminD`, `classifyCaPhProduct(product: number)`, `getPhosphateRecommendation(phosphorus, gfrCategory?)`, `getPTHRecommendation(pth, gfrCategory?)`, `getVitaminDRecommendation(vitaminD)` (each → `{ status, recommendation }`), `getCKDMBDMonitoring(gfrCategory)` (re-exported from `ckd.ts`)
- Anemia: `classifyHemoglobin(hb)` (against the ESA target: ≤11.5 on target, >13 too high; use only for patients on ESA), `classifyAnemiaBySex(hb, sex)` → `{ label, severity, anemic }`, `classifyFerritin`, `classifyTSAT`, `needsIronSupplementation(ferritin, tsat)` → `{ needed, reason }` (deficiency if ferritin <100 or TSAT <20; trial of iron if TSAT ≤30 and ferritin ≤500; not routine if ferritin >500), `checkESAEligibility(hb, ferritin, tsat, sex)` (re-exported from `ckd.ts`)

Non-HDL: `classifyNonHDL(calculateNonHDL(tc, hdl) ?? 0)`. Do not subtract in the UI.

---

## Cross-Tool Data

- **← Patient:** age, sex → CKD
- **CKD → Anemia:** `sex` (enables sex-specific Hb thresholds)
- **CKD → PhosphoCalcic:** `gfrCategory` from latest CKD reading (enables stage-aware PTH + monitoring frequency)
- **CKD → CardioMetabolic:** `gfrCategory`, `age`, `hasDiabetes`, `hasPriorCVD`, `hasKidneyTransplant`
- **CKD ↔ Vital-Signs:** BP informational for RASi dosing context, not a direct lib input
- **CKD ↔ Acid-Base:** Bicarbonate relevant for metabolic acidosis, no programmatic link
- **CKD ↔ Sepsis:** Both use creatinine but different contexts (chronic vs acute)

---

## Gotchas

- **CKD uses strings everywhere.** Convert from other tools: `String(value ?? "")`. CardioMetabolic `age` is a number: `Number(ckd.age) || null`
- **No circular loops.** Guard `onData` → `data` flows with `useRef` + serialized comparison
- **Inbound sync required.** CKD and every nephrology panel must sync the `data` prop into local state after mount — otherwise parent updates (age/sex from Patient) are ignored
- **KFRE requires eGFR, not creatinine.** Calculate eGFR first
- **`calculateEGFR` returns a whole number, and 0 when it cannot calculate** (age under 18, creatinine missing or ≤ 0). On 0 show "not calculated" and do not stage: `classifyGFRCategory("0")` would say G5
- **KFRE uses the non-North American calibration** (Tangri 2016). The kidneyfailurerisk.com calculator set to North America gives higher risks
- **`calculateEGFRSlope` takes a JSON string**, not an array; `isRapidDecline` takes the slope as a string
- **Wire `sex` to Anemia** — without it, falls back to generic classification
- **Wire `gfrCategory` to PhosphoCalcic** — without it, PTH uses generic ranges
- Guideline criteria are **informational** — always confirm clinically
- **CKD Cause is CGA, not optional.** KDIGO recommends classifying cause as part of staging (Cause-GFR-Albuminuria)

---

## CLI

```bash
medprotocol ckd egfr --creatinine 1.2 --age 55 --sex male
medprotocol ckd stage --creatinine 1.2 --age 55 --sex male --acr 45
medprotocol ckd kfre --age 65 --sex female --egfr 35 --acr 300
medprotocol ckd anemia --hb 9.5 --sex male --ferritin 80 --tsat 15
medprotocol ckd mbd --phosphate 5.2 --calcium 8.5 --albumin 3.2 --pth 250 --vitamin-d 18 --gfr-category G4
```

---

## Guideline Reference

KDIGO 2024 (CKD), KDIGO 2012 (Anemia), KDIGO 2017 (CKD-MBD), KDIGO 2013 (Lipids), KDIGO 2021 (BP): CKD-EPI 2021 race-free eGFR, CGA staging (Cause + GFR G1-G5 + Albuminuria A1-A3), KFRE (Tangri 2016, non-North American calibration), RASi/SGLT2i/Finerenone eligibility, eGFR slope, sex-specific Hb, iron/ESA, Ca/P/PTH/VitD monitoring, Lp(a)/ApoB/Non-HDL, statin indication by age + CKD stage. Citation strings with DOI in `lib/medprotocol/sources.ts` (`KDIGO_2024_CKD`, `CKD_EPI_2021`, `KFRE_TANGRI`, `KDIGO_2012_ANEMIA`, `KDIGO_CKD_MBD_2017`, `KDIGO_2013_LIPID`, `KDIGO_2021_BP`).
