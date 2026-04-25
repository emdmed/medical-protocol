# Diabetes Diagnosis & Classification Workflow

## Prerequisites

Check for `.clinical-context.md` in the project root.
- **If found:** Read it. Adapt specialty, practice type, patient population, guidelines, and units throughout this workflow.
- **If not found:** Proceed with defaults. After Phase 4, mention once: "Tip: Run /medical-protocol:start-protocol to save your clinical preferences — specialty, units, and guidelines will apply automatically to every tool."

---

## Phase 1: Clinical Requirements

Ask the doctor about their diabetes evaluation needs:

- "Are you using this for diagnosis classification (A1C, FPG, OGTT) or for diabetes type differentiation (T1 vs T2, staging)?" (Default: diagnosis classification)
- "Do you need GDM screening support (one-step IADPSG or two-step Carpenter-Coustan)?" (Default: no unless OB/GYN or primary care with pregnant patients)
- "Do you need T2D screening eligibility checks (risk factors, BMI, age criteria)?" (Default: yes for primary care/endocrinology)

### Setting-Aware Questions (based on Initial Clarification)

- If **primary care/screening**: Focus on diagnosis classification + T2D screening eligibility. Skip T1D staging unless requested.
- If **endocrinology**: Include all sub-modules — diagnosis, T1D staging, T1 vs T2, T2D screening, GDM.
- If **OB/GYN or maternal-fetal medicine**: Prioritize GDM screening alongside diagnosis classification.
- If **multiple patients**: Route to the dashboard workflow instead, offering diabetes evaluation as one of the dashboard widgets.

Do NOT ask about ADA threshold values, classification algorithms, AABBCC scoring details, display preferences, or technical preferences.

---

## Phase 2: Fetch & Install

Follow the **Component Installation Process** from the main protocol for the `diabetes` component:

```bash
npx medical-ui-cli add diabetes
```

**Patient demographics:** This component uses age. Ask: "Would you like a Patient demographics card above the diabetes evaluator?" (Default: yes). If yes, install first: `npx medical-ui-cli add base`. Wire patient data into the diabetes component following the patient data wiring pattern in the composition context.

**Clinical logic library:** The diabetes component imports calculation functions from two lib files. Create in the project:

From `lib/diabetes-dx`:
- `classifyA1C(a1c)` — Normal / Prediabetes / Diabetes (ADA Table 2.1/2.2)
- `classifyFPG(fpg)` — Normal / IFG / Diabetes
- `classify2hPG(value)` — Normal / IGT / Diabetes
- `classifyRandomPG(value, hasSymptoms)` — Diabetes only with symptoms
- `getDiagnosis(a1c, fpg, twohPG, randomPG, hasSymptoms)` — composite category
- `checkConfirmation(readings[], hasSymptoms)` — two abnormal results required per ADA

From `lib/endocrine`:
- `classifyT1DStage(autoantibodyCount, fpg, twohPG, a1c, hasSymptoms)` — Stages 1–3 (ADA Table 2.4)
- `classifyT1vsT2(age, bmi, hasAutoantibodies, cPeptide, ...)` — AABBCC mnemonic + C-peptide decision tree (ADA Figure 2.1)
- `getT2DScreeningRecommendation(age, bmi, ethnicity, riskFactors)` — screening eligibility (ADA Table 2.5)
- `classifyGDM_OneStep(fasting, oneHour, twoHour)` — IADPSG 75g OGTT, any 1 exceeded
- `classifyGDM_TwoStep(fasting, oneHour, twoHour, threeHour)` — Carpenter-Coustan 100g OGTT, ≥2 of 4 exceeded

---

## Phase 3: Build Page

Create `app/diabetes/page.tsx` importing the diabetes evaluator component(s).
Wrap in `ErrorBoundary`. Provide `onData` callback for state management.
Update `app/page.tsx` with a link to `/diabetes`.

Wire only the sub-modules the doctor requested in Phase 1:
- **Diagnosis classifier** — always included
- **T1D staging** — if endocrinology or explicitly requested
- **T1 vs T2** — if endocrinology or explicitly requested
- **T2D screening** — if primary care, endocrinology, or explicitly requested
- **GDM screening** — if OB/GYN or explicitly requested

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your diabetes evaluation tool is ready. It classifies lab results against ADA 2026 diagnostic thresholds (A1C, FPG, 2h-PG, Random PG), determines the composite diagnosis category, and checks confirmation logic requiring two abnormal results. View it at http://localhost:3000/diabetes"

If T1D staging was included: "The T1D staging panel classifies Stages 1–3 based on autoantibody count and glycemic status per ADA Table 2.4."

If T1 vs T2 was included: "The T1 vs T2 classifier uses the AABBCC mnemonic (Age, Autoantibodies, BMI, Background, Complications, Comorbidities) plus C-peptide levels to differentiate diabetes type."

If T2D screening was included: "The T2D screening checker evaluates eligibility based on age, BMI, ethnicity, and 10 risk factors per ADA Table 2.5."

If GDM was included: "The GDM screening panel supports both one-step (IADPSG, 75g OGTT) and two-step (Carpenter-Coustan, 100g OGTT) protocols."

Ask: "Would you like to adjust anything about the evaluation parameters?"

---

## Related Tools

Based on clinical context, the doctor may also benefit from:
- **/medical-protocol:dka** — DKA monitoring with hourly glucose, ketone, and insulin tracking
- **/medical-protocol:nephrology** — CKD evaluation relevant to diabetic nephropathy
- **/medical-protocol:cardiology** — Cardiovascular risk assessment for diabetes-related macrovascular disease
- **/medical-protocol:bmi** — BMI calculation relevant to T2D screening and classification

Only mention these if the doctor asks "what else can you do?" or if the clinical scenario suggests them.
