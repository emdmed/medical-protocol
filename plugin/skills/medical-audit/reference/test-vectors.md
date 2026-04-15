# Test Vectors

Canonical test inputs and expected outputs for each module. These are the single source of truth for "known good" test cases used by the test-components skill.

## BMI

**Command:** `medprotocol bmi --weight 70 --height-m 1.75 --metric --json`

| Field | Expected |
|-------|----------|
| bmi | 22.9 |
| category | "Normal" |

## Acid-Base (ABG)

**Command:** `medprotocol abg --ph 7.25 --pco2 29 --hco3 14 --json`

| Field | Expected |
|-------|----------|
| disorder | "Metabolic Acidosis" |
| compensation | "Compensated" |
| compensatoryResponse | "Respiratory Alkalosis" |

## Water Balance

**Command:** `medprotocol water-balance --weight 70 --oral 1500 --iv 500 --diuresis 1200 --stools 2 --json`

| Field | Expected |
|-------|----------|
| balance | 35 |
| totalIntake | 2315 |
| totalOutput | 2280 |

## PaFi

**Command:** `medprotocol pafi --pao2 60 --fio2 40 --json`

| Field | Expected |
|-------|----------|
| paFi | 150 |
| classification | "Moderate ARDS" |

## Vital Signs

**Command:** `medprotocol vitals --bp 150/95 --hr 110 --temp 38.5 --json`

| Field | Expected |
|-------|----------|
| bloodPressure.category | "High" |
| heartRate.category | "Elevated" |
| temperature.value | 38.5 |
| temperature.status | "fever" |

## DKA

**Command:** `medprotocol dka --glucose 400 --prev-glucose 460 --hours 2 --unit mgdl --json`

| Field | Expected |
|-------|----------|
| glucoseRate | 30 |
| glucoseOnTarget | false |

## Cardiology — ASCVD

**Command:** `medprotocol cardiology ascvd --age 55 --sex male --race white --tc 220 --hdl 45 --sbp 140 --bp-treatment --json`

| Field | Expected |
|-------|----------|
| risk | 9.3 |
| category | "Intermediate" |

## Sepsis — SOFA

**Command:** `medprotocol sepsis sofa --pao2 80 --fio2 40 --platelets 90 --gcs 13 --creatinine 2.5 --infection --json`

| Field | Expected |
|-------|----------|
| score | 7 |
| sepsis | true |
| severityLevel | "Moderate" |

## Sepsis — qSOFA

**Command:** `medprotocol sepsis qsofa --rr 24 --sbp 90 --gcs 13 --json`

| Field | Expected |
|-------|----------|
| score | 3 |
| positive | true |

## CKD — eGFR

**Command:** `medprotocol ckd egfr --creatinine 1.2 --age 55 --sex male --json`

| Field | Expected |
|-------|----------|
| egfr | 71.4 |
| gfrCategory | "G2" |
| gfrLabel | "Mildly decreased" |
