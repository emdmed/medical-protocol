# Quick Calculator

The `medprotocol` quick calculator is available for fast clinical calculations without building a full interface. It runs directly in the terminal.

## Available Calculators

| Calculator | What it does | Example |
|---|---|---|
| `bmi` | Calculates Body Mass Index from weight and height | `medprotocol bmi --weight 70 --height-m 1.75 --metric` |
| `abg` | Analyzes arterial blood gas values (pH, pCO2, HCO3) and classifies the disturbance | `medprotocol abg --ph 7.25 --pco2 29 --hco3 14` |
| `water-balance` | Calculates fluid balance from intake and output values | `medprotocol water-balance --weight 70 --oral 1500 --iv 500 --diuresis 1200 --stools 2` |
| `vitals` | Evaluates vital signs and flags abnormal values | `medprotocol vitals --bp 120/80 --hr 72 --temp 37.0` |
| `pafi` | Calculates PaO2/FiO2 ratio and gives its Berlin oxygenation range | `medprotocol pafi --pao2 60 --fio2 40` |
| `dka` | Evaluates DKA parameters: glucose reduction rate, resolution criteria | `medprotocol dka --glucose 400 --prev-glucose 460 --hours 2 --unit mgdl` |
| `cardiology` | Cardiology risk scores (ASCVD, HEART, CHA2DS2-VASc) and measured JVP (Normal/Elevated) | `medprotocol cardiology ascvd --age 55 --sex male --tc 213 --hdl 50 --sbp 120` |
| `sepsis` | Sepsis assessment (SOFA-2, qSOFA, lactate clearance) | `medprotocol sepsis qsofa --rr 24 --sbp 90 --gcs 13` |
| `shock` | Shock category from the bedside examination (skin temperature by JVP); a heuristic, not a diagnosis | `medprotocol shock --sbp 82 --minutes 45 --skin cool --jvp elevated` |
| `volume` | Volume overload from the bedside examination (congestion signs); exam only, not a diagnosis | `medprotocol volume --jvp elevated --crackles present` |
| `heart-failure` | Heart failure from the bedside examination (left/right congestion, cardinal symptoms); a congestion pattern, not a diagnosis | `medprotocol heart-failure --breathlessness present --crackles bilateral --jvp elevated` |
| `chest` | Chest examination syndromes per side (consolidation, pleural effusion, atelectasis, pneumothorax) and whole-chest wheeze or crackles; examination only, not a diagnosis | `medprotocol chest --right-percussion dull --right-breath-sounds bronchial` |
| `pulmonary` | Focal pulmonary syndrome from history, chest signs and imaging kept apart: verdict, pneumonia evidence level, differential and what would discriminate; not a diagnosis, never a treatment | `medprotocol pulmonary --cough present --temp 38.4 --right-percussion dull --right-breath-sounds bronchial` |
| `respiratory-failure` | Respiratory failure (gas exchange: SpO2 or arterial gas) and respiratory distress (rate and bedside signs) as two separate verdicts; not a diagnosis, never a treatment | `medprotocol respiratory-failure --oxygen-support room_air --spo2 86 --rr 34 --accessory-muscles present` |
| `extract` | Checks extracted values against the note they came from (quote in note, value in quote) — no interpretation; `--save <file>` stores a note in `extractions/<hash>/`, `--artifact <file>` writes a page of it (with BMI, PaO2/FiO2, acid-base and the CKD results when the note has their inputs), `--serve` (with `--port <number>`, default 7332) starts the local extraction page | `medprotocol extract --note note.txt --items extraction.json` |
| `syndromic` | `--serve` (with `--port <number>`, default 7333) starts the local synthetic patients page: a patient for the six bedside rules, at random or with chosen results, its note drafted by `claude -p` (Haiku, no tools), and each rule's result from plugin/lib | `medprotocol syndromic --serve` |
| `ckd` | CKD evaluation (eGFR, KDIGO staging, KFRE) | `medprotocol ckd egfr --creatinine 1.2 --age 55 --sex male` |
| `hepatology` | MASLD screening: FIB-4 tier, then LSM or ELF when indeterminate, risk stage and referral (ADA 2026 Fig 4.3) | `medprotocol hepatology --age 55 --ast 40 --alt 35 --platelets 200` |

## When to Suggest Calculator vs Full Interface

- **Quick calculator**: the user wants a one-off calculation, batch processing, or just the number -- e.g., "calculate BMI for a 70kg patient who is 1.75m tall", "what's the anion gap for these values", "just give me the fluid balance"
- **Full interface**: the user wants a persistent tool, visual dashboard, or something reusable for practice

When the user's request is simple enough for the quick calculator, offer it as an alternative: "I can give you that result right now, or build a full interface you can reuse -- which would you prefer?"

## Communication Rules

- Call it "quick calculator" or "command-line tool" -- never "Node.js CLI" or "npm script"
- Always use `--json` internally, then translate the output to clinical language
- Never show raw terminal output unless the user explicitly asks

## Dev overlay bridge (not a calculator)

`medprotocol overlay` is a developer tool, not a clinical calculator — keep it out of the table
above. It serves the overlay used to **retrofit medical protocol into any app** (hover any element →
Audit or Implement) and drains the resulting work-order queue (`.medprotocol/queue/`), emitting a
dispatch plan naming the skill to run for each selection (`/medical-protocol:overlay-audit`,
`overlay-implement` or `overlay-add`). In Claude Code, `/medical-protocol:overlay` is the one entry point. See `context/overlay.md` for the queue schema and the Audit/Implement semantics.

```bash
medprotocol overlay --serve    # serve overlay.js + accept browser selections; auto-processes each one via a headless Claude run when the `claude` CLI is found
medprotocol overlay --serve --manual  # only queue selections; process them with /medical-protocol:overlay
medprotocol overlay --list     # show pending selections
medprotocol overlay --drain    # claim pending selections, print dispatch plan (--action <name> claims one action only)
medprotocol overlay --watch    # live-report new selections
medprotocol overlay --clear    # remove completed work orders
```

The overlay itself is the vanilla script served at `GET /overlay.js` by `--serve` — there is no
React component to install, and the target app needs no medprotocol tags. The `data-medprotocol-*`
tags are an optional fast-path for apps already built with medical protocol.
