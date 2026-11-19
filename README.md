# Medical Protocol

A Claude Code plugin that lets doctors build clinical tools by describing them in clinical language. The agent writes the screens. The math comes from a tested clinical library that ships with the plugin. Open source, privacy-first, 989 tests.

> *"I need a vital signs monitor with fluid balance tracking"* — the agent sets up the project, builds the screen and checks it in the browser.

## Install

In Claude Code:

```
/plugin marketplace add emdmed/medical-protocol
/plugin install medical-protocol@medical-protocol
```

Then run `/medical-protocol:start` and describe what you need.

### Or install from a clone

The installer is a single Node script in this repo. It needs only Node and git.

```bash
node scripts/medical-protocol.cjs install --dir ~/my-clinic-app          # copy into the project's .claude/
node scripts/medical-protocol.cjs install --link --dir ~/my-clinic-app   # symlink to the clone instead
node scripts/medical-protocol.cjs check --dir ~/my-clinic-app            # is it up to date?
node scripts/medical-protocol.cjs update --dir ~/my-clinic-app
```

## How it works

1. **You describe the tool.** The `start` skill routes your request to the right clinical module(s).
2. **The agent copies the clinical logic** from the plugin into your project at `lib/medprotocol/`. This is pure TypeScript with no dependencies, and you don't edit it.
3. **The agent generates the UI** with [UI SDK](https://ui-sdk.dev/docs) (React 19, Next.js, Tailwind), styled to match your project.
4. **The agent checks the screen.** It writes a QA recipe of made-up patient cases (`qa/recipes/<module>.md`), takes the expected values from the `medprotocol` CLI, and a Haiku `qa-runner` agent runs the cases in the browser. You can read and add cases in plain clinical words.

The calculations in your app are the same code the tests cover. Nothing is recomputed by the model.

## What's in the plugin

### Skills

| Skill | Use it to |
|-------|-----------|
| `start` | Describe what you need. Everything starts here. |
| `preferences` | Set your specialty, patient population, guidelines and units |
| `protocol-audit` | Audit the project for safety, completeness, privacy and accessibility |
| `calc-audit` | Test the clinical calculations in your screens against the library |
| `overlay-setup` | Turn on the dev overlay: hover over any part of your app to audit it, replace it with a medical-protocol screen, or add a new one |

Internal skills (called by the agent): `vital-signs`, `acid-base`, `bmi`, `pafi`, `dka`, `water-balance`, `dashboard`, `modify`, `calc`, `qa`, `troubleshoot`, `overlay-audit`, `overlay-implement`, `overlay-add`.

### Hooks

| Hook | When | What it does |
|------|------|--------------|
| `privacy-guard` | Before every shell command | Blocks commands that could send data off the machine (`git push`, `curl` POST, `scp`, `nc`, `npm publish`…) |
| `track-workflow` | After every shell command | Records build and QA progress |
| `qa-reminder` | When the agent stops | Sends it back to finish the quality checks if a screen was built without them |

### Clinical modules

| Module | What it calculates |
|--------|-------------------|
| **Vital Signs** | BP, HR, RR, SpO2, temperature: validated ranges, severity alerts, FHIR R4 output |
| **Acid-Base** | Primary disorder, compensation (Winter's), anion gap, delta ratio |
| **BMI** | WHO classification |
| **Water Balance** | Insensible losses, endogenous water, net fluid balance |
| **PaFi (ARDS)** | PaO2/FiO2 ratio with Berlin severity |
| **DKA** | Hourly glucose/ketone/HCO3 rates, resolution criteria, cerebral edema warnings |
| **Cardiology** | ASCVD 10-year risk, HEART score, CHA₂DS₂-VASc |
| **Sepsis** | qSOFA, SOFA-2 (6 organs), lactate clearance, hour-1 bundle |
| **CKD** | eGFR (CKD-EPI 2021), KDIGO staging, KFRE 2/5-year risk, treatment |
| **Diabetes** | ADA 2026 diagnosis, T1D staging, T1 vs T2, T2D screening, gestational diabetes |

## The `medprotocol` CLI

The same clinical library, from the terminal. It ships inside the plugin as one Node script (`plugin/scripts/medprotocol.cjs`), and the skills run it with `node`. The QA step uses it as the source of expected values. Below, `medprotocol` stands for `node plugin/scripts/medprotocol.cjs`.

```bash
medprotocol abg --ph 7.25 --pco2 30 --hco3 12
```

```
ABG Analysis
────────────
  Disorder        Metabolic Acidosis
  Compensation    Inadequate compensation
  Interpretation  Primary Metabolic Acidosis, with Inadequate compensation by Respiratory Alkalosis.
  Expected range  24.0–28.0
```

```bash
medprotocol sepsis qsofa --rr 24 --sbp 90 --gcs 13
```

```
Quick SOFA (qSOFA)
──────────────────
  Score             3/3
  Positive          Yes
  Respiratory Rate  24
  Systolic BP       90 mmHg
  GCS               13
```

Commands: `bmi`, `abg`, `vitals`, `pafi`, `dka`, `water-balance`, `cardiology`, `sepsis`, `ckd`, `diabetes`, `overlay`. Add `--json` to any command, `--help` for its options.

## Repository layout

```
plugin/                    # The Claude Code plugin
├── .claude-plugin/        # plugin.json
├── skills/                # SKILL.md + reference/ per skill
├── agents/qa-runner.md    # Haiku browser-QA runner
├── scripts/medprotocol.cjs # Built CLI
├── hooks/                 # privacy-guard, track-workflow, qa-reminder
└── lib/                   # Clinical logic (copied into doctor projects)
public/medical-protocol/   # Shared context docs: build contract, routing, per-module specs
packages/medprotocol/      # CLI source
packages/medical-protocol/ # Installer source
scripts/                   # Built installer, version bump
tests/                     # Vitest, clinical logic only
```

This repo has no UI code. Screens are generated in each doctor's project. See `CLAUDE.md` for details.

## Contributing

1. Fork and create a feature branch
2. Add tests in `tests/` for any new clinical logic
3. Make sure all tests pass. If you changed the CLI or installer source, rebuild (`npm run build`, `node packages/medical-protocol/build.mjs`) and commit the `.cjs` files
4. Open a PR

New clinical module: follow `.patterns/new-module/new-module.md` (logic in `plugin/lib/`, tests, context doc, CLI command, skill, classification row).

## License

See [LICENSE](./LICENSE).
