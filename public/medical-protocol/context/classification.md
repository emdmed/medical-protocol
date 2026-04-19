# Classification

When the doctor describes what they need, classify into one of these domains based on signal words. The provider is responsible for mapping each domain to the correct workflow or skill.

## Base

| Domain | Signal Words |
|---|---|
| **patient** | patient, demographics, patient info, patient data, name, date of birth, DOB, age, sex, gender |

## Clinical Tools

| Domain | Signal Words |
|---|---|
| **vital-signs** | blood pressure, heart rate, pulse, oxygen, SpO2, temperature, respiratory rate, vitals, monitor |
| **bmi** | BMI, body mass index, weight, height, obesity, underweight, overweight |

## ICU / Critical Care

| Domain | Signal Words |
|---|---|
| **acid-base** | pH, blood gas, ABG, arterial blood gas, acidosis, alkalosis, anion gap, bicarbonate, pCO2 |
| **water-balance** | fluid balance, intake, output, I/O, diuresis, insensible loss, fluid management |
| **pafi** | PaFi, PaO2/FiO2, ARDS, oxygenation index, respiratory failure, lung injury |
| **dka** | DKA, diabetic ketoacidosis, glucemia, ketones, insulin drip, glucose monitoring, ketone tracking |
| **sepsis** | sepsis, SOFA, qSOFA, septic shock, organ failure, lactate, vasopressors, hour-1 bundle, resuscitation |

## Cardiology

| Domain | Signal Words |
|---|---|
| **cardiology** | ASCVD, cardiovascular risk, HEART score, chest pain triage, CHA2DS2-VASc, atrial fibrillation, AF stroke risk, cardiac risk |

## Nephrology

| Domain | Signal Words |
|---|---|
| **nephrology** | CKD, chronic kidney disease, eGFR, creatinine clearance, kidney function, KDIGO, nephrology, proteinuria, albuminuria, UACR, ACR, renal, kidney failure, KFRE, dialysis referral, anemia, hemoglobin, ferritin, TSAT, ESA, erythropoietin, iron deficiency, phosphate, PTH, parathyroid, vitamin D, mineral bone disease, MBD, CKD-MBD, secondary hyperparathyroidism, calcium phosphorus |

## Utilities

| Domain | Signal Words |
|---|---|
| **dashboard** | dashboard, overview, summary, at a glance, clinic view, combined |
| **customize** | change, modify, add field, remove, adjust, different layout, customize |
| **troubleshoot** | not working, error, broken, crashed, blank screen, white screen, won't load, stuck, help, something wrong, fix |
| **cli** | calculate, quick calculation, from the terminal, command line, batch, just the number |
| **start-protocol** | teach, preferences, my practice, configure, setup preferences, learn about me, my specialty |
| **protocol-audit** | audit, check quality, review, compliance, is it correct, verify protocol, score, protocol check |
| **medical-audit** | test components, verify calculations, compare results, check math, validate logic, test against CLI, run test vectors |

---

## Routing Rules

**Cross-prompt:** When the doctor requests a **blood gas analyzer** (acid-base), ask: "Would you also like to track glucemia and ketones for DKA monitoring?" If yes, also route to `dka`.

**If the request matches multiple domains**, prefer `dashboard` as it combines components.

**If the doctor is reporting a problem** (signal words: not working, error, broken, crashed, blank/white screen, won't load, stuck, something wrong), always route to `troubleshoot` regardless of other domain matches.

**If no domain matches**, ask: "Could you describe what clinical information you'd like to see or manage?"

**Initial Clarification must be completed before classification.** If you haven't yet asked and received answers to the four initial clarification questions (module, patient setting, single vs multiple, persistence), stop and do that first. Do NOT use this classification table until you have the doctor's answers. Words like "track", "monitor", or plural "patients" do NOT count as answering the single-vs-multiple or persistence questions — those must be stated explicitly (e.g., "multiple patients", "save between sessions"). The answers are passed to the selected workflow as context. The workflow should silently adapt its behavior, questions, and architecture based on these answers.
