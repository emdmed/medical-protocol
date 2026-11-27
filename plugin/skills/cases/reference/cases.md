# Synthetic Cases

Invented for learning. None of these is a real person. Each case gives the values to enter and the CLI command that computes the answer; the answers are not written here, so they always match the current library. `tests/cases/cases.test.ts` runs every command.

## BMI — weight check at a routine visit

Synthetic case. A 45-year-old adult at a routine check: weight 96 kg, height 1.68 m.

**Command:** `medprotocol bmi --weight 96 --height-m 1.68 --metric`

Think about: which WHO class this falls in, and what BMI does not tell you (muscle mass, fat distribution).

## Acid-base — vomiting and fast breathing

Synthetic case. A 30-year-old with three days of vomiting, breathing fast. Blood gas: pH 7.18, pCO2 21 mmHg, HCO3 9 mEq/L. Na 138, Cl 100 mEq/L.

**Command:** `medprotocol abg --ph 7.18 --pco2 21 --hco3 9 --na 138 --cl 100`

Think about: the primary disorder, whether the pCO2 fits Winter's formula, the anion gap, and what the delta ratio adds.

## Water balance — first post-op day

Synthetic case. An 80 kg adult on the first day after surgery: oral 800 mL, IV 2000 mL, diuresis 1500 mL, one stool.

**Command:** `medprotocol water-balance --weight 80 --oral 800 --iv 2000 --diuresis 1500 --stools 1`

Think about: why insensible losses and endogenous water change the net balance compared with intake minus urine.

## Vital signs — feverish and hypotensive

Synthetic case. An adult with fever and confusion: BP 88/52 mmHg, HR 124 bpm, temperature 38.9 °C, RR 26 /min, SpO2 91 % on room air.

**Command:** `medprotocol vitals --bp 88/52 --hr 124 --temp 38.9 --rr 26 --spo2 91`

Think about: which values are abnormal, and which pattern they make together.

## PaFi — on high-flow oxygen

Synthetic case. An adult on 60 % oxygen with PaO2 72 mmHg.

**Command:** `medprotocol pafi --pao2 72 --fio2 60`

Think about: the Berlin oxygenation range, and why a range is not an ARDS diagnosis on its own.

## DKA — two hours into treatment

Synthetic case. An adult with DKA, two hours into insulin: glucose 420 → 310 mg/dL, ketones 2.1 mmol/L, HCO3 14 mEq/L, pH 7.24.

**Command:** `medprotocol dka --glucose 310 --prev-glucose 420 --hours 2 --ketones 2.1 --bicarbonate 14 --ph 7.24 --unit mgdl`

Think about: whether the glucose is falling at the target rate, and which resolution criteria are still unmet.

## Sepsis — qSOFA at the bedside

Synthetic case. An adult with suspected infection: RR 24 /min, systolic BP 95 mmHg, GCS 13.

**Command:** `medprotocol sepsis qsofa --rr 24 --sbp 95 --gcs 13`

Think about: what a positive qSOFA predicts, and why it is not a screening tool on its own.

## CKD — staging at the kidney clinic

Synthetic case. A 67-year-old woman: creatinine 1.9 mg/dL, urine albumin-to-creatinine ratio 420 mg/g.

**Command:** `medprotocol ckd stage --creatinine 1.9 --age 67 --sex female --acr 420`

Think about: the G and A categories, and how the KDIGO heat map turns them into a risk level and a monitoring frequency.

## Diabetes — two abnormal tests

Synthetic case. An adult with no symptoms: A1C 7.1 %, fasting plasma glucose 142 mg/dL, both from the same sample.

**Command:** `medprotocol diabetes diagnose --a1c 7.1 --fpg 142`

Think about: why two abnormal results from one sample are enough under ADA criteria, and when a single result needs repeating.

## Cardiology — 10-year ASCVD risk

Synthetic case. A 58-year-old man who smokes, on blood pressure treatment: total cholesterol 230 mg/dL, HDL 38 mg/dL, systolic BP 148 mmHg.

**Command:** `medprotocol cardiology ascvd --age 58 --sex male --tc 230 --hdl 38 --sbp 148 --bp-treatment --smoker`

Think about: which inputs move the risk most, and why the Pooled Cohort Equations are being replaced by PREVENT.

## Shock — cold and congested

Synthetic case. An adult hypotensive for 45 minutes: systolic BP 82 mmHg, cool skin, elevated JVP.

**Command:** `medprotocol shock --sbp 82 --minutes 45 --skin cool --jvp elevated`

Think about: how skin temperature and JVP together point to a shock category, and why this bedside heuristic is not a diagnosis.
