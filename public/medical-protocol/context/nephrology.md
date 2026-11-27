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

## Synthetic patient generator

For the **Generate patient** button (`building.md` §3). Each press: pick a scenario at random, draw each value uniformly in its range, apply the couplings, round as stated. Fields not listed stay empty.

Header: age 35–85, sex at random, cause (diabetic, hypertensive, glomerular, or unknown) with comorbidities that fit it (diabetic → diabetes on; heart failure 1 in 5; prior CVD 1 in 4; transplant 1 in 20; on max RASi 1 in 2; potassium normal 4 in 5).

Readings: 3–5, 4–12 months apart, ending today.

| Scenario | First creatinine (mg/dL) female / male | ACR (mg/g) | Course |
|---|---|---|---|
| Early CKD (G1–G2) | 0.6–1.0 / 0.8–1.2 | 30–299 | creatinine rises 0–3% a year |
| Moderate (G3a–G3b) | 1.1–1.9 / 1.4–2.4 | 30–600 | rises 3–8% a year |
| Advanced (G4) | 2.0–3.2 / 2.6–4.0 | 300–2000 | rises 8–15% a year |
| Rapid decline | 1.1–1.6 / 1.4–2.0 | 300–1500 | the last reading is 25–40% higher than the first; ACR doubles |

Panels, matched to the stage (later stages lower Hb and raise phosphate and PTH):
- **Anemia:** Hb 12–14 early, 9.5–12 G3, 8–11 G4 (g/dL); ferritin 50–400 ng/mL; TSAT 12–35%; serum iron 40–120 µg/dL; reticulocytes 0.5–2.0%.
- **PhosphoCalcic:** calcium 8.4–10.2 mg/dL; phosphorus 3.0–4.5 early, 4.0–6.5 G4; PTH 40–90 early, 90–400 G4 (pg/mL); 25-OH vitamin D 10–40 ng/mL; albumin 3.4–4.5.
- **CardioMetabolic:** total cholesterol 150–260, HDL 35–65, triglycerides 80–300, LDL = total − HDL − triglycerides ÷ 5 (Friedewald); HbA1c 6.5–9.0 with diabetes, else 5.0–5.9; glucose to match; SBP 120–170, DBP 65–95; Lp(a) 5–150; ApoB 60–140 (mg/dL).

Rounding: creatinine 2 decimals; Hb, calcium, phosphorus, albumin, HbA1c 1 decimal; others whole numbers.

Every generated patient is labelled "Synthetic patient" with a 4-character code, never a name. Results still come only from the lib.

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

- Staging: `calculateEGFR(creatinine, age, sex)` → `number`; `classifyGFRCategory(egfr)` → G1–G5; `getGFRCategoryLabel(category)`; `classifyAlbuminuriaCategory(acr, unit = "mg/g")` → A1–A3 (`"mg/mmol"` uses KDIGO's cut-offs for that unit, 3 and 30); `acrInMgPerG(acr, unit)` → mg/g for KFRE, never for staging; `getAlbuminuriaCategoryLabel(category)`; `getCKDRiskLevel(gfrCategory, albCategory)` → green / yellow / orange / red / deep-red; `getMonitoringFrequency(gfrCategory, albCategory)` → times/year; `getCKDSeverity(gfrCategory)` → normal / warning / critical; `GFR_BANDS` → `{ cuts: [15, 30, 45, 60, 90], labels }` and `ACR_BANDS` → `{ cuts: [30, 300], labels }` (mg/g; `ACR_BANDS_MMOL` → `[3, 30]`), the cut-offs and category names the two classifiers read; use them to draw a scale
- KFRE: `calculateKFRE(age, sex, egfr, acr)` → `{ twoYear, fiveYear }` (%); `assessReferralNeed(kfre5yr)` → none / nephrology / multidisciplinary / krt-planning; `getReferralLabel(referral)`
- Treatment: `checkRASiEligibility(gfrCategory, albCategory, hasDiabetes)`, `checkSGLT2iEligibility(egfr, acr, hasHeartFailure, acrUnit = "mg/g")`, `checkFinerenoneEligibility(egfr, acr, hasDiabetes, onMaxRASi, potassiumNormal, acrUnit = "mg/g")` — each → `{ eligible, grade }`; with `"mg/mmol"` the ACR is read against KDIGO's cut-offs for that unit (3 and 20 instead of 30 and 200)
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
medprotocol ckd stage --creatinine 1.2 --age 55 --sex male --acr 4.5 --acr-unit mg/mmol   # stage, kfre and treatment take --acr-unit (default mg/g)
medprotocol ckd anemia --hb 9.5 --sex male --ferritin 80 --tsat 15
medprotocol ckd mbd --phosphate 5.2 --calcium 8.5 --albumin 3.2 --pth 250 --vitamin-d 18 --gfr-category G4
```

---

## Guideline Reference

KDIGO 2024 (CKD), KDIGO 2012 (Anemia), KDIGO 2017 (CKD-MBD), KDIGO 2013 (Lipids), KDIGO 2021 (BP): CKD-EPI 2021 race-free eGFR, CGA staging (Cause + GFR G1-G5 + Albuminuria A1-A3), KFRE (Tangri 2016, non-North American calibration), RASi/SGLT2i/Finerenone eligibility, eGFR slope, sex-specific Hb, iron/ESA, Ca/P/PTH/VitD monitoring, Lp(a)/ApoB/Non-HDL, statin indication by age + CKD stage. Citation strings with DOI in `lib/medprotocol/sources.ts` (`KDIGO_2024_CKD`, `CKD_EPI_2021`, `KFRE_TANGRI`, `KDIGO_2012_ANEMIA`, `KDIGO_CKD_MBD_2017`, `KDIGO_2013_LIPID`, `KDIGO_2021_BP`).
