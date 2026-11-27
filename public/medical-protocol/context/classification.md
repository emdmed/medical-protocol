# Classification

When the user describes what they need, classify into one of these domains based on signal words. The `start` skill maps each domain to the correct workflow or skill.

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
| **pafi** | PaFi, PaO2/FiO2, ARDS, oxygenation index, lung injury |
| **dka** | DKA, diabetic ketoacidosis, glucemia, ketones, insulin drip, glucose monitoring, ketone tracking |
| **sepsis** | sepsis, SOFA, qSOFA, septic shock, organ failure, lactate, vasopressors, hour-1 bundle, resuscitation |
| **shock** | shock category, type of shock, undifferentiated shock, cardiogenic, hypovolemic, hypotension, cool or warm skin, JVP, jugular venous pressure, syndromic assessment |
| **volume** | volume overload, fluid overload, congestion, congestive, hypervolemia, crackles, rales, S3, gallop, hepatojugular reflux, ankle edema, leg swelling, Framingham |
| **heart-failure** | heart failure, left-sided, right-sided, biventricular, right heart failure, congestive heart failure, CHF, RV infarct, parasternal heave, loud P2, tricuspid regurgitation, Kussmaul, pulsatile liver, ascites, breathlessness, dyspnoea, orthopnoea |
| **chest-exam** | chest examination, chest exam, respiratory examination, percussion, dullness, stony dull, hyperresonant, breath sounds, bronchial breathing, vocal resonance, tracheal deviation, consolidation, pleural effusion, atelectasis, collapse, pneumothorax, wheeze, semiology |
| **focal-pulmonary** | pneumonia, community-acquired pneumonia, CAP, chest infection, lower respiratory tract infection, LRTI, focal chest signs, cough with fever, purulent sputum, pleuritic pain, chest X-ray consolidation, lobar, focal pulmonary syndrome |
| **respiratory-failure** | respiratory failure, type 1 respiratory failure, type 2 respiratory failure, hypoxaemia, hypoxemia, hypercapnia, CO2 retention, respiratory distress, work of breathing, tachypnoea, accessory muscles, can't complete sentences, paradoxical breathing, cyanosis, desaturation |

## Endocrinology / Diabetes

| Domain | Signal Words |
|---|---|
| **diabetes** | diabetes, diabetes diagnosis, A1C, HbA1c, fasting glucose, FPG, oral glucose tolerance, OGTT, 2-hour glucose, prediabetes, IFG, IGT, type 1 diabetes, type 2 diabetes, T1D, T2D, autoantibodies, GAD65, IA-2, ZnT8, C-peptide, AABBCC, gestational diabetes, GDM, IADPSG, Carpenter-Coustan, diabetes screening, diabetes classification, diabetes staging | <!-- UI component: diabetes-dx (not "diabetes") -->

## Cardiology

| Domain | Signal Words |
|---|---|
| **cardiology** | ASCVD, cardiovascular risk, HEART score, chest pain triage, CHA2DS2-VASc, atrial fibrillation, AF stroke risk, cardiac risk |

## Nephrology

| Domain | Signal Words |
|---|---|
| **nephrology** | CKD, chronic kidney disease, eGFR, creatinine clearance, kidney function, KDIGO, nephrology, proteinuria, albuminuria, UACR, ACR, renal, kidney failure, KFRE, dialysis referral, anemia, hemoglobin, ferritin, TSAT, ESA, erythropoietin, iron deficiency, phosphate, PTH, parathyroid, vitamin D, mineral bone disease, MBD, CKD-MBD, secondary hyperparathyroidism, calcium phosphorus, LDL, cholesterol, lipids, statin, Lp(a), lipoprotein a, ApoB, apolipoprotein B, non-HDL, triglycerides, cardio-metabolic, cardiovascular metabolic |

## Utilities

| Domain | Signal Words |
|---|---|
| **extraction** | extract, extraction, pull values from a note, from this note, read the note, clinical note, parse the note, structure the note, note vs extraction, where did this come from | <!-- skill: extract -->
| **dashboard** | dashboard, overview, summary, at a glance, clinic view, combined |
| **modify** | change, modify, add field, remove, adjust, different layout |
| **troubleshoot** | not working, error, broken, crashed, blank screen, white screen, won't load, stuck, help, something wrong, fix |
| **calc** | calculate, quick calculation, from the terminal, command line, batch, just the number |
| **cases** | give me a case, example patient, synthetic case, practise, practice case, quiz me, demo data, sample patient |
| **preferences** | teach, preferences, what I'm learning, configure, setup preferences, learn about me, my specialty |
| **protocol-audit** | audit, check quality, review, compliance, is it correct, verify protocol, score, protocol check |
| **calc-audit** | test components, verify calculations, compare results, check math, validate logic, test against CLI, run test vectors |
| **qa** | check it, is it working, try it, test the screen, test the calculator, check everything, add a case, also check a patient, what do you check |

---

## Routing Rules

**Cross-prompt:** When the user requests a **blood gas analyzer** (acid-base), ask: "Would you also like to track glucemia and ketones for DKA monitoring?" If yes, also route to `dka`.

**Syndromic assessments:** `shock`, `volume`, `heart-failure`, `chest-exam`, `focal-pulmonary` and `respiratory-failure` all route to the syndromic workflow. "Respiratory failure" with a PaO2/FiO2 ratio or ARDS is `pafi`; on its own, or with SpO2, work of breathing or a blood gas, it is `respiratory-failure`.

**If the request matches multiple domains**, prefer `dashboard` as it combines components.

**If the user is reporting a problem** (signal words: not working, error, broken, crashed, blank/white screen, won't load, stuck, something wrong), always route to `troubleshoot` regardless of other domain matches.

**If the user wants a built screen checked or a patient case added** (`qa` signal words), route to `qa` directly — skip Initial Clarification. If they describe a symptom ("it shows the wrong number"), that is `troubleshoot`.

**If no domain matches**, ask: "Could you describe what clinical information you'd like to see or manage?"

**Initial Clarification must be completed before classification.** If you haven't yet asked and received answers to the four initial clarification questions (module, patient setting, single vs multiple, persistence), stop and do that first. Do NOT use this classification table until you have the user's answers. Words like "track", "monitor", or plural "patients" do NOT count as answering the single-vs-multiple or persistence questions — those must be stated explicitly (e.g., "multiple patients", "save between sessions"). The answers are passed to the selected workflow as context. The workflow should automatically adapt its behavior, questions, and architecture based on these answers.
