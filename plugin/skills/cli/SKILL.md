---
name: cli
description: "[Internal] Run quick clinical calculations from the terminal — BMI, blood gas analysis, fluid balance, vital signs"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.

You are running quick clinical calculations for a healthcare professional using the command-line calculator. Follow the phases below exactly.

## Phase 1: Identify the Calculation

Determine which calculator the doctor needs based on their request:

| Calculator | Signal Words |
|---|---|
| `bmi` | BMI, body mass index, weight, height, obesity |
| `abg` | pH, blood gas, ABG, acidosis, alkalosis, anion gap, bicarbonate, pCO2 |
| `water-balance` | fluid balance, intake, output, I/O, diuresis, fluid management |
| `vitals` | blood pressure, heart rate, pulse, oxygen, SpO2, temperature, respiratory rate |

If the request could match multiple calculators, ask: "Which calculation would you like me to run?" and list the options in clinical language.

If the request doesn't match any calculator, suggest building a full interface instead and route to the appropriate workflow skill.

## Phase 2: Gather Clinical Inputs

Ask the doctor for the required values **conversationally** — do not present a form or list of parameters. Adapt to what they've already provided.

**BMI:**
- Weight and height (ask which units they prefer — metric or imperial)
- Example prompt: "What's the patient's weight and height?"

**ABG (Arterial Blood Gas):**
- pH, pCO2 (mmHg), HCO3 (mEq/L)
- Optional: Na, Cl (for anion gap)
- Example prompt: "What are the blood gas values? I need pH, pCO2, and bicarbonate at minimum."

**Water Balance:**
- Patient weight (kg), oral intake (mL), IV fluids (mL)
- Outputs: diuresis (mL), number of stools
- Optional: emesis, other losses
- Example prompt: "What's the patient's weight and the intake/output values?"

**Vitals:**
- Blood pressure (systolic/diastolic), heart rate, temperature
- Optional: respiratory rate, SpO2, FiO2
- Example prompt: "What vital signs do you have?"

If the doctor has already provided all needed values in their initial message, skip to Phase 3.

## Phase 3: Run the Calculation

Build and execute the command silently. Always append `--json` for structured output.

```bash
npm run medprotocol -- <command> <flags> --json
```

**Command examples:**
```bash
npm run medprotocol -- bmi --weight 70 --height-m 1.75 --metric --json
npm run medprotocol -- abg --ph 7.25 --pco2 29 --hco3 14 --json
npm run medprotocol -- water-balance --weight 70 --oral 1500 --iv 500 --diuresis 1200 --stools 2 --json
npm run medprotocol -- vitals --bp 120/80 --hr 72 --temp 37.0 --json
```

Do not show the command or raw output to the doctor.

## Phase 4: Present Results

Translate the JSON output into clear clinical language:

- **BMI**: State the BMI value and WHO category (e.g., "The patient's BMI is 22.9 — normal weight")
- **ABG**: State the primary disturbance, compensation status, and anion gap if calculated (e.g., "This shows a metabolic acidosis with respiratory compensation. The anion gap is elevated at 18.")
- **Water Balance**: State the net balance and whether the patient is positive or negative (e.g., "The fluid balance is +300 mL — the patient is slightly positive for the day")
- **Vitals**: State which values are normal and flag any abnormal readings (e.g., "Blood pressure and heart rate are within normal limits. Temperature is elevated at 38.5°C — low-grade fever.")

After presenting results, offer two options:

1. "Would you like to run another calculation?"
2. "Would you like me to build a full interface for this instead?" — if yes, route to the appropriate workflow skill (`bmi`, `acid-base`, `water-balance`, or `vitals`)
