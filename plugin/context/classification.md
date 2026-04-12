# Classification

When the doctor describes what they need, classify into one of these domains based on signal words:

| Domain | Signal Words | Workflow |
|---|---|---|
| **vital-signs** | blood pressure, heart rate, pulse, oxygen, SpO2, temperature, respiratory rate, vitals, monitor | `providers/claude-code/workflows/vital-signs.md` |
| **acid-base** | pH, blood gas, ABG, arterial blood gas, acidosis, alkalosis, anion gap, bicarbonate, pCO2 | `providers/claude-code/workflows/acid-base.md` |
| **bmi** | BMI, body mass index, weight, height, obesity, underweight, overweight | `providers/claude-code/workflows/bmi.md` |
| **water-balance** | fluid balance, intake, output, I/O, diuresis, insensible loss, fluid management | `providers/claude-code/workflows/water-balance.md` |
| **pafi** | PaFi, PaO2/FiO2, ARDS, oxygenation index, respiratory failure, lung injury | `providers/claude-code/workflows/pafi.md` |
| **dka** | DKA, diabetic ketoacidosis, glucemia, ketones, insulin drip, glucose monitoring, ketone tracking | `providers/claude-code/workflows/dka.md` |
| **dashboard** | dashboard, overview, summary, at a glance, clinic view, combined | `providers/claude-code/workflows/dashboard.md` |
| **customize** | change, modify, add field, remove, adjust, different layout, customize | `providers/claude-code/workflows/customize.md` |
| **cli** | calculate, quick calculation, from the terminal, command line, batch, just the number | Route to `cli` skill |
| **start-protocol** | teach, preferences, my practice, configure, setup preferences, learn about me, my specialty | Route to `start-protocol` skill |
| **protocol-audit** | audit, check quality, review, compliance, is it correct, verify, score, protocol check | Route to `protocol-audit` skill |

**Cross-prompt:** When the doctor requests a **blood gas analyzer** (acid-base), ask: "Would you also like to track glucemia and ketones for DKA monitoring?" If yes, also route to `dka`.

**If the request matches multiple domains**, prefer `dashboard` as it combines components.

**If no domain matches**, ask: "Could you describe what clinical information you'd like to see or manage?"

**Pass Initial Clarification answers downstream.** The answers from Initial Clarification (patient setting, single vs multiple patients, data persistence) are passed to the selected workflow as context. The workflow should silently adapt its behavior, questions, and architecture based on these answers.
