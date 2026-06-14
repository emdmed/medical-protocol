# Quick Calculator

The `medprotocol` quick calculator is available for fast clinical calculations without building a full interface. It runs directly in the terminal.

## Available Calculators

| Calculator | What it does | Example |
|---|---|---|
| `bmi` | Calculates Body Mass Index from weight and height | `medprotocol bmi --weight 70 --height-m 1.75 --metric` |
| `abg` | Analyzes arterial blood gas values (pH, pCO2, HCO3) and classifies the disturbance | `medprotocol abg --ph 7.25 --pco2 29 --hco3 14` |
| `water-balance` | Calculates fluid balance from intake and output values | `medprotocol water-balance --weight 70 --oral 1500 --iv 500 --diuresis 1200 --stools 2` |
| `vitals` | Evaluates vital signs and flags abnormal values | `medprotocol vitals --bp 120/80 --hr 72 --temp 37.0` |
| `pafi` | Calculates PaO2/FiO2 ratio and classifies ARDS severity | `medprotocol pafi --pao2 60 --fio2 40` |
| `dka` | Evaluates DKA parameters: glucose reduction rate, resolution criteria | `medprotocol dka --glucose 400 --prev-glucose 460 --hours 2 --unit mgdl` |
| `cardiology` | Cardiology risk scores (ASCVD, HEART, CHA2DS2-VASc) | `medprotocol cardiology ascvd --age 55 --sex male --tc 213 --hdl 50 --sbp 120` |
| `sepsis` | Sepsis assessment (SOFA, qSOFA, lactate clearance) | `medprotocol sepsis qsofa --rr 24 --sbp 90 --gcs 13` |
| `ckd` | CKD evaluation (eGFR, KDIGO staging, KFRE) | `medprotocol ckd egfr --creatinine 1.2 --age 55 --sex male` |

## When to Suggest Calculator vs Full Interface

- **Quick calculator**: the doctor wants a one-off calculation, batch processing, or just the number -- e.g., "calculate BMI for a 70kg patient who is 1.75m tall", "what's the anion gap for these values", "just give me the fluid balance"
- **Full interface**: the doctor wants a persistent tool, visual dashboard, or something they'll use repeatedly with patients

When the doctor's request is simple enough for the quick calculator, offer it as an alternative: "I can give you that result right now, or build a full interface you can reuse -- which would you prefer?"

## Communication Rules

- Call it "quick calculator" or "command-line tool" -- never "Node.js CLI" or "npm script"
- Always use `--json` internally, then translate the output to clinical language
- Never show raw terminal output unless the doctor explicitly asks

## Dev overlay bridge (not a calculator)

`medprotocol overlay` is a developer tool, not a clinical calculator — keep it out of the table
above. It serves the overlay used to **retrofit medical protocol into any app** (hover any element →
Audit or Implement) and drains the resulting work-order queue (`.medprotocol/queue/`), emitting a
dispatch plan naming the skill to run for each selection (`/medical-protocol:overlay-audit` or
`overlay-implement`). See `context/overlay.md` for the queue schema and the Audit/Implement semantics.

```bash
npx medprotocol overlay --serve    # serve overlay.js + accept browser selections (add the printed <script> tag, dev only)
npx medprotocol overlay --serve --auto  # …and auto-process each selection via a headless Claude run (opt-in, needs `claude` CLI)
npx medprotocol overlay --list     # show pending selections
npx medprotocol overlay --drain    # claim pending selections, print dispatch plan
npx medprotocol overlay --watch    # live-report new selections
npx medprotocol overlay --clear    # remove completed work orders
```

The overlay itself is the vanilla script served at `GET /overlay.js` by `--serve` — there is no
React component to install, and the target app needs no medprotocol tags. The `data-medprotocol-*`
tags are an optional fast-path for apps already built with medical protocol.
