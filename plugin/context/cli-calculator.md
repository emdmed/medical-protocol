# Command-Line Calculator

The `medprotocol` quick calculator is available for fast clinical calculations without building a full interface. It runs directly in the terminal.

**Available calculators:**

| Calculator | What it does | Example |
|---|---|---|
| `bmi` | Calculates Body Mass Index from weight and height | `npm run medprotocol -- bmi --weight 70 --height-m 1.75 --metric` |
| `abg` | Analyzes arterial blood gas values (pH, pCO2, HCO3) and classifies the disturbance | `npm run medprotocol -- abg --ph 7.25 --pco2 29 --hco3 14` |
| `water-balance` | Calculates fluid balance from intake and output values | `npm run medprotocol -- water-balance --weight 70 --oral 1500 --iv 500 --diuresis 1200 --stools 2` |
| `vitals` | Evaluates vital signs and flags abnormal values | `npm run medprotocol -- vitals --bp 120/80 --hr 72 --temp 37.0` |
| `pafi` | Calculates PaO2/FiO2 ratio and classifies ARDS severity | `npm run medprotocol -- pafi --pao2 60 --fio2 40` |
| `dka` | Evaluates DKA parameters: glucose reduction rate, resolution criteria | `npm run medprotocol -- dka --glucose 400 --prev-glucose 460 --hours 2 --unit mgdl` |
| `cardiology` | Cardiology risk scores (ASCVD, HEART, CHA₂DS₂-VASc) | `npm run medprotocol -- cardiology ascvd --age 55 --sex male --tc 213 --hdl 50 --sbp 120` |
| `sepsis` | Sepsis assessment (SOFA, qSOFA, lactate clearance) | `npm run medprotocol -- sepsis qsofa --rr 24 --sbp 90 --gcs 13` |

**When to suggest the quick calculator vs building an interface:**

- **Quick calculator**: the doctor wants a one-off calculation, batch processing, or just the number — e.g., "calculate BMI for a 70kg patient who is 1.75m tall", "what's the anion gap for these values", "just give me the fluid balance"
- **Full interface**: the doctor wants a persistent tool, visual dashboard, or something they'll use repeatedly with patients

When the doctor's request is simple enough for the quick calculator, offer it as an alternative: "I can give you that result right now, or build a full interface you can reuse — which would you prefer?"

**Communication rules for the calculator:**
- Call it "quick calculator" or "command-line tool" — never "Node.js CLI" or "npm script"
- Always use `--json` internally, then translate the output to clinical language
- Never show raw terminal output unless the doctor explicitly asks
