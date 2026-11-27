---
name: calc
description: "Run any quick clinical calculation from the terminal — BMI, blood gas, vitals, sepsis, CKD, shock and every other medprotocol calculator"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
user-invocable: true
---

Read and follow: reference/core.md
medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever the docs say `medprotocol`

You are running quick clinical calculations for a healthcare professional using the command-line calculator. Follow the phases below exactly.

## Phase 1: Identify the Calculation

Read reference/cli.md: its Available Calculators table lists every calculator (and sub-commands such as `sepsis qsofa` or `ckd egfr`). Pick the one that matches the request.

If the request could match multiple calculators, ask: "Which calculation would you like me to run?" and list the options in clinical language.

If the request doesn't match any calculator, suggest building a full interface instead and route to the appropriate workflow skill.

## Phase 2: Gather Clinical Inputs

Run `medprotocol <command> --help` (or `medprotocol <command> <sub-command> --help`) to see the required and optional flags. Do not show the help text to the user.

Ask the user for the required values **conversationally** — do not present a form or list of parameters. Adapt to what they've already provided, and ask which units they use when a flag accepts more than one.

If the user has already provided all needed values in their initial message, skip to Phase 3.

## Phase 3: Run the Calculation

Build and execute the command automatically. Always append `--json` for structured output.

```bash
medprotocol <command> <flags> --json
```

**Command examples:**
```bash
medprotocol bmi --weight 70 --height-m 1.75 --metric --json
medprotocol abg --ph 7.25 --pco2 29 --hco3 14 --json
medprotocol water-balance --weight 70 --oral 1500 --iv 500 --diuresis 1200 --stools 2 --json
medprotocol vitals --bp 120/80 --hr 72 --temp 37.0 --json
medprotocol pafi --pao2 60 --fio2 40 --json
medprotocol dka --glucose 400 --prev-glucose 460 --hours 2 --unit mgdl --json
medprotocol sepsis qsofa --rr 24 --sbp 90 --gcs 13 --json
medprotocol ckd egfr --creatinine 1.2 --age 55 --sex male --json
medprotocol shock --sbp 82 --minutes 45 --skin cool --jvp elevated --json
```

Do not show the command or raw output to the user.

## Phase 4: Present Results

Translate the JSON output into clear clinical language. For any calculator not listed below, state the score or category it returns and what it means in one or two sentences.

Bedside syndromic rules (`shock`, `volume`, `heart-failure`, `chest`, `pulmonary`, `respiratory-failure`) give a pattern, never a diagnosis: say so, and repeat that rule's caveat from the cli.md table (for example, "a bedside heuristic, not a diagnosis" for `shock`).

- **BMI**: State the BMI value and WHO category (e.g., "The patient's BMI is 22.9 — normal weight")
- **ABG**: State the primary disturbance, compensation status, and anion gap if calculated (e.g., "This shows a metabolic acidosis with respiratory compensation. The anion gap is elevated at 18.")
- **Water Balance**: State the net balance and whether the patient is positive or negative (e.g., "The fluid balance is +300 mL — the patient is slightly positive for the day")
- **Vitals**: State which values are normal and flag any abnormal readings (e.g., "Blood pressure and heart rate are within normal limits. Temperature is elevated at 38.5°C — low-grade fever.")
- **PaFi**: State the PaFi ratio and its Berlin oxygenation range, never an ARDS diagnosis (e.g., "The PaFi ratio is 150 — in the Berlin moderate range. This indicates significant oxygenation impairment.")
- **DKA**: State the glucose reduction rate and whether on target, resolution criteria status, and insulin suggestion if applicable (e.g., "Glucose is dropping at 30 mg/dL/hr — below the target of 54 mg/dL/hr. DKA not yet resolved: ketones and pH still abnormal.")

After presenting results, offer two options:

1. "Would you like to run another calculation?"
2. "Would you like me to build a full interface for this instead?" — if yes, route to the appropriate workflow skill (`bmi`, `acid-base`, `water-balance`, `vital-signs`, `pafi`, or `dka`)
