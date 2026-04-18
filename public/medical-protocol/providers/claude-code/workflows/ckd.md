# CKD (Chronic Kidney Disease) Evaluation Workflow

## Phase 1: Clinical Requirements

Ask the doctor about their CKD evaluation needs:

- "Are you using this for initial CKD screening (eGFR + staging) or full monitoring with progression tracking?" (Default: full monitoring)
- "Do you need KFRE kidney failure risk prediction with referral recommendations?" (Default: yes)
- "Do you want the treatment eligibility checker (RASi, SGLT2i, finerenone)?" (Default: yes)
- "Do you need CKD anemia monitoring (hemoglobin, iron status, ESA eligibility)?" (Default: yes for nephrology, no for primary care)
- "Do you need CKD-MBD monitoring (phosphate, calcium, PTH, vitamin D)?" (Default: yes for nephrology, no for primary care)

### Setting-Aware Questions (based on Initial Clarification)

- If **primary care/screening**: Route to CGA staging view with eGFR + albuminuria + risk color. Skip anemia/MBD unless explicitly requested.
- If **nephrology clinic**: Include KFRE tracking, progression monitoring (eGFR slope), treatment eligibility, anemia monitoring, and CKD-MBD monitoring
- If **multiple patients**: Route to the dashboard workflow instead, offering CKD evaluation as one of the dashboard widgets

Do NOT ask about eGFR formula choice, KDIGO staging thresholds, KFRE coefficients, display preferences, or technical preferences.

---

## Phase 2: Fetch & Install

Follow the **Component Installation Process** from the main protocol for the `ckd` component.

**Clinical logic library:** The CKD component imports calculation functions from `lib/ckd`. Create in the project:
- `calculateEGFR(creatinine, age, sex)` — CKD-EPI 2021 race-free eGFR
- `classifyGFRCategory(egfr)` — G1–G5 staging
- `classifyAlbuminuriaCategory(acr)` — A1–A3 staging
- `getGFRCategoryLabel(category)` — human-readable label
- `getAlbuminuriaCategoryLabel(category)` — human-readable label
- `getCKDRiskLevel(gfrCategory, albCategory)` — KDIGO heatmap color
- `getMonitoringFrequency(gfrCategory, albCategory)` — times/year
- `calculateKFRE(age, sex, egfr, acr)` — 4-variable kidney failure risk
- `assessReferralNeed(kfre5yr)` — referral recommendation
- `checkRASiEligibility(gfrCategory, albCategory, hasDiabetes)` — ACEi/ARB criteria
- `checkSGLT2iEligibility(egfr, acr, hasHeartFailure)` — SGLT2i criteria
- `checkFinerenoneEligibility(egfr, acr, hasDiabetes, onMaxRASi, potassiumNormal)` — MRA criteria
- `calculateEGFRSlope(readings)` — progression rate (mL/min/1.73m²/year)
- `isRapidDecline(slope)` — true if ≥5 mL/min/year loss
- `hasSignificantEGFRChange(previous, current)` — true if >20% drop
- `hasACRDoubling(previous, current)` — true if ≥2× increase
- `getCKDSeverity(gfrCategory)` — normal/warning/critical for UI styling

**Nephrology sub-components** (installed as part of `ckd`):

The `nephrology/` folder contains `anemia.tsx`, `phospho-calcic.tsx`, `lib.ts`, `ui-helpers.tsx`, and `types/interfaces.ts`.

Nephrology lib functions (in `nephrology/lib.ts`):
- `classifyAnemiaBySex(hb, sex)` — sex-specific Hb classification (male <13, female <12 g/dL); returns `{label, severity, anemic}`
- `checkESAEligibility(hb, ferritin, tsat, sex)` — Hb <10 + iron replete → eligible; returns `{eligible, reason}`
- `getPhosphateRecommendation(phosphorus, gfrCategory?)` — target 2.5–4.5 mg/dL for G3a-G5; returns `{status, recommendation}`
- `getPTHRecommendation(pth, gfrCategory?)` — normal range G1-G3b, 2–9× UNL for G4-G5; returns `{status, recommendation}`
- `getVitaminDRecommendation(vitaminD)` — <20 deficient, 20-29 insufficient, ≥30 sufficient; returns `{status, recommendation}`
- `getCKDMBDMonitoring(gfrCategory)` — KDIGO CKD-MBD 2017 monitoring intervals; returns `{phosphate, calcium, pth, vitaminD}`

---

## Phase 3: Build Page

Create `app/ckd/page.tsx` importing the CKDEvaluator component.
Wrap in `ErrorBoundary`. Provide `onData` callback for state management.
Update `app/page.tsx` with a link to `/ckd`.

### Wiring Nephrology Sub-Components

When anemia or CKD-MBD was requested, import and wire the sub-components on the page:

```tsx
import CKDEvaluator from "@/components/ckd/ckd-evaluator";
import Anemia from "@/components/nephrology/anemia";
import PhosphoCalcic from "@/components/nephrology/phospho-calcic";

// Derive gfrCategory from latest CKD reading
const latestReading = ckdData?.readings[ckdData.readings.length - 1];
const gfrCategory = latestReading?.gfrCategory;

<CKDEvaluator data={ckdData} onData={setCkdData} />
<Anemia sex={ckdData?.sex} />
<PhosphoCalcic gfrCategory={gfrCategory} />
```

**Important wiring:**
- Pass `sex` from CKDPatientData to `<Anemia>` for sex-specific Hb thresholds and ESA eligibility. Without it, the component shows a sex select in the form and uses generic thresholds.
- Pass `gfrCategory` from the latest CKD reading to `<PhosphoCalcic>` for stage-aware PTH targets (2–9× UNL for G4-G5) and monitoring frequency footer.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your CKD evaluation dashboard is ready. Enter the patient's creatinine, age, sex, and urine ACR. It calculates eGFR using the CKD-EPI 2021 equation, stages CKD using the KDIGO GFR and albuminuria categories, shows the risk heatmap color, predicts kidney failure risk with the 4-variable KFRE, recommends referral pathways, checks treatment eligibility for RASi, SGLT2i, and finerenone, and monitors eGFR progression over time."

If anemia monitoring was included: "The anemia panel uses sex-specific hemoglobin thresholds, tracks iron status (ferritin/TSAT), indicates when iron supplementation is needed, and shows ESA eligibility when Hb drops below 10 g/dL with adequate iron stores."

If CKD-MBD was included: "The phospho-calcic panel monitors calcium, phosphorus, PTH, and vitamin D with stage-specific recommendations. It shows corrected calcium, Ca×P product, and the recommended monitoring frequency for the patient's GFR category."

Ask: "Would you like to adjust anything about the evaluation parameters?"
