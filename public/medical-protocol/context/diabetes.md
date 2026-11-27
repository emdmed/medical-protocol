# Diabetes Module Context

Based on ADA Standards of Care in Diabetes — 2026, Sections 2 and 4.

Logic: `lib/medprotocol/diabetes-dx.ts` (import `@/lib/medprotocol/diabetes-dx`) and `lib/medprotocol/endocrine.ts` (import `@/lib/medprotocol/endocrine`). Build: see `building.md`.

**Tool name:** `diabetes-dx` (not `diabetes`). Screens: `components/medprotocol/diabetes-dx/diabetes-dx.tsx` plus optional sub-screens in `components/medprotocol/endocrine/` (`t1d-staging`, `t1-vs-t2`, `t2d-screening`, `gdm-screening`).

Categories: `endocrine`, `internal-medicine`

## Screens

| Screen | What it does | Key reference |
|-----------|-------------|---------------|
| **Diabetes Dx Evaluator** | Classifies A1C, FPG, 2h-PG, Random PG against ADA thresholds; composite diagnosis; confirmation logic | ADA Table 2.1, 2.2 |
| **T1D Staging** | Stages 1–3 based on autoantibody count + glycemia | ADA Table 2.4 |
| **T1 vs T2 Classifier** | AABBCC mnemonic scoring + C-peptide decision tree | ADA Figure 2.1 |
| **T2D Screening** | Screening eligibility based on age, BMI, ethnicity, risk factors | ADA Table 2.5 |
| **GDM Screening** | One-step (IADPSG) and two-step (Carpenter-Coustan) protocols | ADA Rec 2.26+ |

## Screen spec

All five screens are reading-based: latest result on top, history table below, add-reading form (date YYYY-MM-DD, values as strings). On narrow containers a Latest / History toggle replaces the side-by-side view. Each reading has `id`, `date`, optional `trace`. Severity colors come from the lib's `severity` (`normal | warning | critical`).

**Diabetes Dx Evaluator**
- Header: age, sex, has symptoms (toggle), click to edit
- Hero: diagnosis label from `getDiagnosis` on the latest reading + confirmation badge from `checkConfirmation` across all readings
- Latest values: A1C (%), FPG (mg/dL), 2h-PG (mg/dL), Random PG (mg/dL), each with its `classify*` label
- History: A1C, FPG, 2h-PG columns
- Props: `data?: DiabetesDxPatientData`, `onData?: (data) => void` where `DiabetesDxPatientData = { age: string; sex: string; hasSymptoms: boolean; readings: { id, date, a1c, fpg, twohPG, randomPG, trace? }[] }`

**Endocrine sub-screens** — props: `data?: <Reading>[]`, `onData?: (data: <Reading>[]) => void`

| Screen | Inputs | Output |
|---|---|---|
| T1D Staging | Autoantibodies: GAD65, IA-2, ZnT8, insulin Ab checkboxes (count = checked boxes unless entered), FPG, 2h-PG (mg/dL), A1C (%), symptoms | Stage 0–3 + label |
| T1 vs T2 | Age, BMI, autoantibodies, C-peptide (pmol/L), family Hx T1D, family Hx T2D, DKA history, other autoimmune | Classification + T1/T2 feature lists |
| T2D Screening | Age, BMI, ethnicity (free text; "Asian" lowers BMI threshold to 23), 10 risk-factor checkboxes (see T2D Screening below) | Action, interval, risk-factor count |
| GDM Screening | Strategy (Segmented Control: one-step / two-step), gestational age (weeks), fasting, 1-h, 2-h, 3-h (two-step only) (mg/dL) | Positive/negative, exceeded values |

## Synthetic patient generator

For the **Generate patient** button (`building.md` §3). Each press: pick a scenario at random, draw each value uniformly in its range, apply the couplings, round as stated. Fields not listed stay empty.

Generate for the screen that is open.

- **Diagnosis** (mg/dL, %):

| Scenario | A1C | FPG | 2-h PG |
|---|---|---|---|
| Normal | 4.8–5.6 | 75–99 | 90–139 |
| Prediabetes | 5.7–6.4 | 100–125 | 140–199 |
| Diabetes | 6.5–11.0 | 126–250 | 200–350 |
| Discordant (needs repeat) | 6.5–6.9 | 100–120 | empty |

  Random PG and symptoms only in the Diabetes scenario, 1 in 3: random PG 210–400 with symptoms on.
- **T1D staging:** stage 1 = 2–4 autoantibodies with normal glucose (FPG 75–99, A1C 4.8–5.6); stage 2 = 2–4 with dysglycemia (FPG 100–125 or A1C 5.7–6.4); stage 3 = 1–4 with symptoms and diabetes-range glucose; or 0–1 autoantibodies and normal glucose.
- **T1 vs T2:** T1-like: onset age 8–30, BMI 17–24, autoantibodies on, C-peptide 20–200 pmol/L, DKA history 1 in 3, other autoimmune 1 in 4. T2-like: age 40–70, BMI 28–40, autoantibodies off, C-peptide 600–1500, family history of T2D 3 in 5.
- **T2D screening:** age 25–75, BMI 20–40, ethnicity from a short list ("White", "Black", "Hispanic", "Asian", "Other"), 0–4 risk factors checked at random.
- **GDM:** gestational age 24–28 weeks. One-step (75 g): normal fasting 70–90, 1-h 110–175, 2-h 95–150; GDM raises one or two of them above 92 / 180 / 153. Two-step (100 g): normal 70–94 / 120–179 / 100–154 / 90–139; GDM raises two or more above 95 / 180 / 155 / 140.

Rounding: glucose whole numbers, A1C 1 decimal, BMI 1 decimal.

Every generated patient is labelled "Synthetic patient" with a 4-character code, never a name. Results still come only from the lib.

## Diagnostic Thresholds (ADA Table 2.1)

| Test | Normal | Prediabetes | Diabetes |
|------|--------|-------------|----------|
| A1C | <5.7% | 5.7–6.4% | ≥6.5% |
| FPG | <100 mg/dL | 100–125 mg/dL (IFG) | ≥126 mg/dL |
| 2h-PG (75g OGTT) | <140 mg/dL | 140–199 mg/dL (IGT) | ≥200 mg/dL |
| Random PG | — | — | ≥200 mg/dL + symptoms |

## Confirmation Logic

In the absence of unequivocal hyperglycemia, diagnosis requires **two abnormal results** — from the same test at different time points or from two different tests at the same time point.

## T1D Staging (ADA Table 2.4)

| Stage | Autoimmunity | Glycemia | Symptoms |
|-------|-------------|----------|----------|
| 1 | ≥2 autoantibodies | Normoglycemia | Presymptomatic |
| 2 | ≥2 autoantibodies | Dysglycemia (prediabetes range) | Presymptomatic |
| 3 | ≥2 autoantibodies (may wane) | Overt hyperglycemia | Symptomatic |

## T1 vs T2 — AABBCC Mnemonic (ADA Figure 2.1)

- **A**ge: <35 → T1D, ≥40 → T2D
- **A**utoantibodies: positive → T1D
- **B**MI: <25 → T1D, ≥30 → T2D
- **B**ackground: family Hx T1D → T1D, family Hx T2D → T2D
- **C**omplications: DKA history → T1D
- **C**omorbidities: other autoimmune → T1D

C-peptide decision tree: <200 pmol/L → T1D, 200–600 → Indeterminate, >600 → T2D

## T2D Screening (ADA Table 2.5)

- BMI ≥25 (≥23 for Asian ancestry) + ≥1 risk factor → Screen now
- Age ≥35 → Universal screening
- Repeat every 3 years if normal

Risk factors: first-degree relative, high-risk ethnicity, CVD history, hypertension, dyslipidemia, PCOS, physical inactivity, insulin resistance signs, prior prediabetes, prior GDM.

## GDM Screening

**One-step (IADPSG)** — 75g OGTT, any 1 exceeded → GDM:
- Fasting ≥92, 1-hr ≥180, 2-hr ≥153 mg/dL

**Two-step (Carpenter-Coustan)** — 100g OGTT, ≥2 of 4 exceeded → GDM:
- Fasting ≥95, 1-hr ≥180, 2-hr ≥155, 3-hr ≥140 mg/dL

## CLI Commands

```bash
medprotocol diabetes diagnose --a1c 6.8 --fpg 130
medprotocol diabetes t1d-stage --autoantibodies 3 --a1c 5.9
medprotocol diabetes t1-vs-t2 --age 25 --bmi 22 --autoantibodies --c-peptide 150
medprotocol diabetes t2d-screen --age 40 --bmi 28 --hypertension
medprotocol diabetes gdm --strategy one-step --fasting 95 --1h 185 --2h 160
```

## Lib Functions

All inputs `string` unless noted. `Severity = "normal" | "warning" | "critical"`.

`diabetes-dx.ts`:
- `classifyA1C(a1c)`, `classifyFPG(fpg)`, `classify2hPG(value)`, `classifyRandomPG(value, hasSymptoms)` → `{ label, severity }`
- `getDiagnosis(a1c, fpg, twohPG, randomPG, hasSymptoms)` → `{ category: "normal" | "prediabetes-ifg" | "prediabetes-igt" | "diabetes"; label }`
- `checkConfirmation(readings: { a1c, fpg, twohPG, randomPG }[], hasSymptoms)` → `{ confirmed, method }`

`endocrine.ts`:
- `classifyT1DStage(autoantibodyCount, fpg, twohPG, a1c, hasSymptoms)` → `{ stage: 0 | 1 | 2 | 3; label; severity }`
- `classifyT1vsT2(age, bmi, hasAutoantibodies, cPeptide, familyHxT1D, familyHxT2D, dkaHistory, otherAutoimmune)` → `{ classification, label, severity, features: { t1: string[]; t2: string[] } }`
- `getT2DScreeningRecommendation(age, bmi, ethnicity, riskFactors: Record<string, boolean>)` → `{ action, interval, severity, riskFactorCount }`
- `classifyGDM_OneStep(fasting, oneHour, twoHour)`, `classifyGDM_TwoStep(fasting, oneHour, twoHour, threeHour)` → `{ positive, exceededValues, exceededCount }`

Citations: `sources.ADA_2026_TABLE_2_1`, `ADA_2026_SECTION_2`, `IADPSG_2010`, `CARPENTER_COUSTAN`.

## Cross-Tool Data

- **← Patient:** age, sex (Dx Evaluator header; T1 vs T2 and T2D screening age)
- **← BMI:** BMI value for T1 vs T2 and T2D screening (pass the string from `calculateBMI`)
