# Medical Protocol

AI-agent-driven clinical tools — validated calculation logic, a terminal CLI, and workflows for Claude Code. Open source, privacy-first, 801 tests.

## Quick Start

### Install the Claude Code plugin

```bash
npx medical-protocol install
```

Then describe what you need: *"I need a vital signs monitor with fluid balance tracking"* — the agent handles the rest.

#### Symlink mode (for multi-project or dev setups)

```bash
npx medical-protocol install --link
```

This clones the repo to `~/.medical-protocol` and creates symlinks instead of copying files. All linked projects update instantly when you `git pull` in the clone — no need to re-run install per project.

```bash
# Use an existing local clone
npx medical-protocol install --link --source ~/my-clone

# Check symlink health and repo status
npx medical-protocol check

# Pull latest changes
npx medical-protocol update
```

### Run the CLI

```bash
npx medprotocol abg --ph 7.25 --pco2 30 --hco3 12
```

```
ABG Analysis
────────────
  Disorder        Metabolic Acidosis
  Compensation    Inadequate compensation
  Interpretation  Primary Metabolic Acidosis, with Inadequate compensation
                  by Respiratory Alkalosis.
  Expected range  24.0–28.0
```

```bash
npx medprotocol vitals --bp 145/95 --hr 88 --rr 18 --spo2 96 --temp 37.2
```

```
Vital Signs
───────────
  Blood Pressure    145/95 mmHg (High)
  Heart Rate        88 bpm (Normal)
  Respiratory Rate  18 breaths/min (Normal)
  Temperature       37.2°C (Normal)
  SpO2              96% — SpO2/FiO2: 457
```

```bash
npx medprotocol bmi --weight 70 --height-m 1.75 --metric
```

```
BMI Calculator
──────────────
  BMI       22.9
  Category  Normal
  Weight    70 kg
  Height    1.75m
```

9 commands: `bmi`, `abg`, `vitals`, `pafi`, `dka`, `water-balance`, `cardiology`, `sepsis`, `ckd`

## Architecture

Three parts: **this repo** (workflows, plugin, `lib/` logic, CLI), **medprotocol-ui** (separate repo — shadcn-style component delivery), and the **doctor's project** (Next.js app built by the agent). Pure calculation logic lives in `lib/` — no framework deps, shared by CLI and UI. See `CLAUDE.md` for full directory structure.

## Clinical Components

9 validated clinical modules:

| Module | What it calculates |
|--------|-------------------|
| **Vital Signs** | BP, HR, RR, SpO2, Temp — validated ranges, color-coded alerts, FHIR R4 output |
| **Acid-Base** | Primary disorder, compensation, anion gap, delta ratio (Winter's, Henderson-Hasselbalch) |
| **BMI** | WHO classification — underweight, normal, overweight, obese |
| **Water Balance** | Insensible losses, endogenous water, net fluid balance |
| **PaFi (ARDS)** | PaO2/FiO2 ratio with Berlin Definition severity classification |
| **DKA** | Hourly glucose/ketone/HCO3 rates, resolution criteria, cerebral edema warnings |
| **Cardiology** | ASCVD 10-year risk, HEART score, CHA₂DS₂-VASc |
| **Sepsis** | qSOFA, full SOFA (6 organs), lactate clearance, hour-1 bundle compliance |
| **CKD** | eGFR (CKD-EPI 2021), KDIGO staging, KFRE 2/5-year risk, progression tracking |

## Tests

```bash
npm test                              # Run all 801 tests (23 files)
npx vitest run tests/acid-base/       # Run a single test directory
npx vitest run tests/bmi/bmi.test.ts  # Run a single test file
npm run test:watch                    # Watch mode
```

Covers: extreme values, negative inputs, triple acid-base disorders, zero divisors, mixed disorder detection, boundary conditions for every classification tier.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Add tests for any new clinical logic in `tests/`
4. Run `npm test` — all 801 tests must pass
5. Submit a PR

New clinical modules need three things:
1. Pure logic in `lib/`
2. Workflow file in `public/medical-protocol/providers/claude-code/workflows/`
3. Classification row in `public/medical-protocol/context/classification.md`

## License

See [LICENSE](./LICENSE).
