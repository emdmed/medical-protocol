# Diabetes — Module Context

Based on ADA Standards of Care in Diabetes — 2026, Sections 2 and 4.

## Components

| Component | What it does | Key reference |
|-----------|-------------|---------------|
| **Diabetes Dx Evaluator** | Classifies A1C, FPG, 2h-PG, Random PG against ADA thresholds; composite diagnosis; confirmation logic | ADA Table 2.1, 2.2 |
| **T1D Staging** | Stages 1–3 based on autoantibody count + glycemia | ADA Table 2.4 |
| **T1 vs T2 Classifier** | AABBCC mnemonic scoring + C-peptide decision tree | ADA Figure 2.1 |
| **T2D Screening** | Screening eligibility based on age, BMI, ethnicity, risk factors | ADA Table 2.5 |
| **GDM Screening** | One-step (IADPSG) and two-step (Carpenter-Coustan) protocols | ADA Rec 2.26+ |

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

## Lib Files

| File | Functions |
|------|-----------|
| `lib/diabetes-dx.ts` | classifyA1C, classifyFPG, classify2hPG, classifyRandomPG, getDiagnosis, checkConfirmation |
| `lib/endocrine.ts` | classifyT1DStage, classifyT1vsT2, getT2DScreeningRecommendation, classifyGDM_OneStep, classifyGDM_TwoStep |
