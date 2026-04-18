# Medical Protocol

AI-agent-driven clinical tools — validated calculation logic, a terminal CLI, and workflows for Claude Code. Open source, privacy-first, 751 tests.

## Quick Start

### Install the Claude Code plugin

```bash
claude plugin add --url https://medical-protocol-workflows.vercel.app/plugin/plugin.json
```

Then describe what you need: *"I need a vital signs monitor with fluid balance tracking"* — the agent handles the rest.

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

This project is one piece of a three-part system:

| Part | What it does | Where |
|------|-------------|-------|
| **Workflows & Plugin** (this repo) | Markdown protocols, workflows, hooks, skills, and `lib/` with pure calculation logic | Here |
| **medprotocol CLI** (this repo) | Terminal calculator — 9 commands, imports logic from `lib/` | `packages/medprotocol/` |
| **medical-ui-cli** (separate repo) | shadcn-style React component delivery via `npx medical-ui-cli add <component>` | Separate repo |

### Key directories

```
lib/                               Pure calculation + validation logic (shared by CLI and UI)
├── acid-base/                     ABG analysis — Winter's, Henderson-Hasselbalch, anion gap, delta ratio
├── vital-signs-validations/       Range validation, alerts, FHIR R4 output
├── cardiology-types.ts            ASCVD, HEART score, CHA₂DS₂-VASc interfaces
├── ckd.ts                         eGFR (CKD-EPI 2021), KDIGO staging, KFRE risk
├── bmi.ts cardiology.ts dka.ts pafi.ts sepsis.ts water-balance.ts
packages/medprotocol/              CLI tool (9 commands)
context/                           Shared medical context (13 files): registry, classification, CLI ref, per-module docs
public/medical-protocol/providers/ Protocol files, workflows, install guides
plugin/                            Claude Code plugin: 14 skills, 4 hooks, 10 plugin context files
tests/                             Vitest — 23 test files, 751 tests
```

### The `lib/` layer

Pure TypeScript — no framework dependencies. This is the shared bridge between the CLI and the UI components. If you want to use the clinical logic in your own project, start here.

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
npm test                              # Run all 751 tests (23 files)
npx vitest run tests/acid-base/       # Run a single test directory
npx vitest run tests/bmi/bmi.test.ts  # Run a single test file
npm run test:watch                    # Watch mode
```

Covers: extreme values, negative inputs, triple acid-base disorders, zero divisors, mixed disorder detection, boundary conditions for every classification tier.

## Development

```bash
npm install          # Install dev dependencies (TypeScript, Vitest only)
npm test             # Run tests
npm run build        # Build medprotocol CLI
```

No production dependencies. TypeScript strict mode. No linter.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Add tests for any new clinical logic in `tests/`
4. Run `npm test` — all 751 tests must pass
5. Submit a PR

New clinical modules need three things:
1. Pure logic in `lib/`
2. Workflow file in `public/medical-protocol/providers/claude-code/workflows/`
3. Classification row in `context/classification.md`

## License

See [LICENSE](./LICENSE).
