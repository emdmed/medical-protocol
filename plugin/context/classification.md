# Classification

When the doctor describes what they need, classify into one of these domains based on signal words:

### Clinical Tools

| Domain | Signal Words | Workflow |
|---|---|---|
| **vital-signs** | blood pressure, heart rate, pulse, oxygen, SpO2, temperature, respiratory rate, vitals, monitor | `providers/claude-code/workflows/vital-signs.md` |
| **bmi** | BMI, body mass index, weight, height, obesity, underweight, overweight | `providers/claude-code/workflows/bmi.md` |

### ICU / Critical Care

| Domain | Signal Words | Workflow |
|---|---|---|
| **acid-base** | pH, blood gas, ABG, arterial blood gas, acidosis, alkalosis, anion gap, bicarbonate, pCO2 | `providers/claude-code/workflows/acid-base.md` |
| **water-balance** | fluid balance, intake, output, I/O, diuresis, insensible loss, fluid management | `providers/claude-code/workflows/water-balance.md` |
| **pafi** | PaFi, PaO2/FiO2, ARDS, oxygenation index, respiratory failure, lung injury | `providers/claude-code/workflows/pafi.md` |
| **dka** | DKA, diabetic ketoacidosis, glucemia, ketones, insulin drip, glucose monitoring, ketone tracking | `providers/claude-code/workflows/dka.md` |
| **sepsis** | sepsis, SOFA, qSOFA, septic shock, organ failure, lactate, vasopressors, hour-1 bundle, resuscitation | `providers/claude-code/workflows/sepsis.md` |

### Cardiology

| Domain | Signal Words | Workflow |
|---|---|---|
| **cardiology** | ASCVD, cardiovascular risk, HEART score, chest pain triage, CHA₂DS₂-VASc, atrial fibrillation, AF stroke risk, cardiac risk | `providers/claude-code/workflows/cardiology.md` |

### Nephrology

| Domain | Signal Words | Workflow |
|---|---|---|
| **ckd** | CKD, chronic kidney disease, eGFR, creatinine clearance, kidney function, KDIGO, nephrology, proteinuria, albuminuria, UACR, ACR, renal, kidney failure, KFRE, dialysis referral | `providers/claude-code/workflows/ckd.md` |

### Utilities

| Domain | Signal Words | Workflow |
|---|---|---|
| **dashboard** | dashboard, overview, summary, at a glance, clinic view, combined | `providers/claude-code/workflows/dashboard.md` |
| **customize** | change, modify, add field, remove, adjust, different layout, customize | `providers/claude-code/workflows/customize.md` |
| **troubleshoot** | not working, error, broken, crashed, blank screen, white screen, won't load, stuck, help, something wrong, fix | `providers/claude-code/workflows/troubleshoot.md` |
| **test** | test, verify, check calculations, are the numbers correct, validate results, QA, make sure it works | Run the QA workflow (see Testing / Verification section below) |
| **cli** | calculate, quick calculation, from the terminal, command line, batch, just the number | Route to `cli` skill |
| **start-protocol** | teach, preferences, my practice, configure, setup preferences, learn about me, my specialty | Route to `start-protocol` skill |
| **protocol-audit** | audit, check quality, review, compliance, is it correct, verify protocol, score, protocol check | Route to `protocol-audit` skill |

**Cross-prompt:** When the doctor requests a **blood gas analyzer** (acid-base), ask: "Would you also like to track glucemia and ketones for DKA monitoring?" If yes, also route to `dka`.

**If the request matches multiple domains**, prefer `dashboard` as it combines components.

**If the doctor is reporting a problem** (signal words: not working, error, broken, crashed, blank/white screen, won't load, stuck, something wrong), always route to `troubleshoot` regardless of other domain matches.

**If no domain matches**, ask: "Could you describe what clinical information you'd like to see or manage?"

**Pass Initial Clarification answers downstream.** The answers from Initial Clarification (patient setting, single vs multiple patients, data persistence) are passed to the selected workflow as context. The workflow should silently adapt its behavior, questions, and architecture based on these answers.
