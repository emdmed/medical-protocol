# Recipe: cli

QA for the quick calculator in this repo. Same recipe/runner split as `public/medical-protocol/workflows/agent-qa.md`, with one difference: here the CLI is the thing under test, so **expected values are worked out by hand from the guideline in the module's context doc**, never copied from CLI output.

Run every command from the repo root as `node plugin/scripts/medprotocol.cjs <command>`. Made-up values only.

## Cases
1. Adult, 70 kg, 1.75 m → BMI 22.9, normal weight <!-- 70 / 1.75² = 22.86 -->
2. PaO2 60 mmHg on FiO2 40% → PaO2/FiO2 150, moderate (Berlin 100–200) <!-- 60 / 0.40 -->
3. pH 7.25, pCO2 29, HCO3 14 → metabolic acidosis with adequate respiratory compensation <!-- Winter: 1.5 × 14 + 8 = 29 ± 2 -->
4. 70 kg, oral 1500, IV 500, urine 1200, 2 stools → balance +35 mL <!-- in 1500 + 500 + 70×4.5 = 2315; out 1200 + 70×12 + 2×120 = 2280 -->
5. BP 118/76, HR 72, temp 37.0 °C → nothing flagged as abnormal
6. BP 190/125, SpO2 84% → both flagged as dangerous (hypertensive crisis; low oxygen)
7. DKA: glucose 460 → 400 mg/dL in 2 h → falling 30 mg/dL/h, below target (≥ 54) <!-- (460 − 400) / 2 -->
8. HEART: history 1, ECG 1, age 2, risk factors 1, troponin 0 → score 5, moderate risk (4–6)
9. Atrial fibrillation, woman 65–74 with hypertension → CHA₂DS₂-VASc 3
10. qSOFA: RR 24, SBP 90, GCS 13 → 3 of 3, positive
11. Lactate 4.2 → 2.1 mmol/L → clearance 50%, adequate (≥ 10%)
12. Man, 55 y, creatinine 1.2 mg/dL → eGFR 71 (accept 70–72), G2 <!-- CKD-EPI 2021: 142 × (1.2/0.9)^−1.2 × 0.9938^55 -->
13. A1C 7.0% and fasting glucose 130 mg/dL → diabetes (two abnormal tests)
14. A missing or wrong input gives a short readable error, never a crash dump
15. `--json` gives the same numbers as the plain output

## Steps
1. (Case 1) Run `bmi --weight 70 --height-m 1.75 --metric`. Expect: exit code 0, BMI 22.9 (or 22.86), a normal-weight category.
2. (Case 2) Run `pafi --pao2 60 --fio2 40`. Expect: exit code 0, ratio 150, moderate.
3. (Case 3) Run `abg --ph 7.25 --pco2 29 --hco3 14`. Expect: exit code 0, metabolic acidosis, compensated (pCO2 29 inside the expected range).
4. (Case 4) Run `water-balance --weight 70 --oral 1500 --iv 500 --diuresis 1200 --stools 2`. Expect: exit code 0, net balance +35 mL.
5. (Case 5) Run `vitals --bp 118/76 --hr 72 --temp 37.0`. Expect: exit code 0, every value reported normal.
6. (Case 6) Run `vitals --bp 190/125 --spo2 84`. Expect: exit code 0, blood pressure marked as hypertensive crisis and critical, SpO2 marked critical.
7. (Case 7) Run `dka --glucose 400 --prev-glucose 460 --hours 2 --unit mgdl`. Expect: exit code 0, reduction rate 30 mg/dL/h, not on target.
8. (Case 8) Run `cardiology heart --history 1 --ecg 1 --age 2 --risk-factors 1 --troponin 0`. Expect: exit code 0, score 5, moderate.
9. (Case 9) Run `cardiology chadsvasc --age65 --female --hypertension`. Expect: exit code 0, score 3.
10. (Case 10) Run `sepsis qsofa --rr 24 --sbp 90 --gcs 13`. Expect: exit code 0, score 3, positive.
11. (Case 11) Run `sepsis lactate --initial 4.2 --repeat 2.1`. Expect: exit code 0, clearance 50%, adequate.
12. (Case 12) Run `ckd egfr --creatinine 1.2 --age 55 --sex male`. Expect: exit code 0, eGFR between 70 and 72, category G2.
13. (Case 13) Run `diabetes diagnose --a1c 7 --fpg 130`. Expect: exit code 0, diagnosis of diabetes.
14. (Case 14) Run `bmi --weight 70 --metric`. Expect: exit code 1, an error naming the missing height, no line starting with `    at `.
15. (Case 14) Run `sepsis nope`. Expect: exit code 1, an error that lists the sub-commands, no line starting with `    at `.
16. (Case 14) Run `bmi --weight 70 --height 175 --metric`. Expect: exit code 1, an error naming the unknown option `--height`, no line starting with `    at `.
17. (Case 15) Run `bmi --weight 70 --height-m 1.75 --metric --json` and `ckd egfr --creatinine 1.2 --age 55 --sex male --json`. Expect: exit code 0, valid JSON, same BMI and eGFR as steps 1 and 12.
