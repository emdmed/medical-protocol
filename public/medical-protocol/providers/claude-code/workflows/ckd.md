# CKD (Chronic Kidney Disease) Evaluation Workflow

## Phase 1: Clinical Requirements

Ask the doctor about their CKD evaluation needs:

- "Are you using this for initial CKD screening (eGFR + staging) or full monitoring with progression tracking?" (Default: full monitoring)
- "Do you need KFRE kidney failure risk prediction with referral recommendations?" (Default: yes)
- "Do you want the treatment eligibility checker (RASi, SGLT2i, finerenone)?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **primary care/screening**: Route to CGA staging view with eGFR + albuminuria + risk color
- If **nephrology clinic**: Include KFRE tracking, progression monitoring (eGFR slope), and treatment eligibility
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

---

## Phase 3: Build Page

Create `app/ckd/page.tsx` importing the CKDEvaluator component.
Wrap in `ErrorBoundary`. Provide `onData` callback for state management.
Update `app/page.tsx` with a link to `/ckd`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your CKD evaluation dashboard is ready. Enter the patient's creatinine, age, sex, and urine ACR. It calculates eGFR using the CKD-EPI 2021 equation, stages CKD using the KDIGO GFR and albuminuria categories, shows the risk heatmap color, predicts kidney failure risk with the 4-variable KFRE, recommends referral pathways, checks treatment eligibility for RASi, SGLT2i, and finerenone, and monitors eGFR progression over time. View it at http://localhost:3000/ckd"
Ask: "Would you like to adjust anything about the evaluation parameters?"
