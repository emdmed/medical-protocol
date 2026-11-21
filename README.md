# Medical Protocol

**Clinical skills for Claude Code. For learning and prototyping, not patient care.**

Tell Claude Code what you want in clinical language, and it builds a working screen for you. The numbers on that screen come from a tested clinical library, so the model never does the math.

![Four steps: you describe the tool, the tested clinical logic is copied into your project, the agent builds the screen, and the agent checks it with made-up patient cases](.github/readme/how-it-works.svg)

Medical Protocol is open source and made for studying calculations, practising on made-up cases and trying out medical ideas quickly. It is privacy-first: the screens it builds keep what you type on your computer.

## Try saying

- *"I need a vital signs monitor with fluid balance tracking, to practise on teaching cases."*
- *"Build me a DKA tracker with hourly glucose and ketones."*
- *"What's the anion gap for Na 140, Cl 100, HCO3 12?"*
- *"Pull the values out of this admission note. It's not real data."*

The agent sets up the project, builds the screen and checks it in the browser.

## Medical disclaimer

Medical Protocol is an open-source educational project. It and the tools it generates are for learning, prototyping and experimentation only and must not be used for real patient care, diagnosis or treatment decisions. They are not certified medical devices and do not replace professional clinical judgment. The authors make no warranty about accuracy and accept no liability for any use of this software.

## Install

In Claude Code:

```
/plugin marketplace add emdmed/medical-protocol
/plugin install medical-protocol@medical-protocol
```

Then run `/medical-protocol:start` and describe what you need. That's it.

### Or install from a clone

The installer is a single Node script in this repo. It needs only Node and git.

```bash
node scripts/medical-protocol.cjs install --dir ~/my-clinic-app          # copy into the project's .claude/
node scripts/medical-protocol.cjs install --link --dir ~/my-clinic-app   # symlink to the clone instead
node scripts/medical-protocol.cjs check --dir ~/my-clinic-app            # is it up to date?
node scripts/medical-protocol.cjs update --dir ~/my-clinic-app
```

## How it works

1. **You describe the tool.** The `start` skill sends your request to the right clinical module(s).
2. **The agent copies the clinical logic** from the plugin into your project at `lib/medprotocol/`. It is plain TypeScript with no dependencies, and you don't edit it.
3. **The agent builds the screen** with [UI SDK](https://ui-sdk.dev/docs) (React 19, Next.js, Tailwind), styled to match your project.
4. **The agent checks the screen.** It writes a list of made-up patient cases (`qa/recipes/<module>.md`), gets the expected values from the `medprotocol` CLI, and a small `qa-runner` agent runs the cases in the browser. You can read the cases and add your own in plain clinical words.

The calculations in your app are the same code the tests cover: more than 1,000 of them.

## Reading a clinical note

Paste a note (a made-up one, please) and ask for the values. Each value comes back with the exact words it was taken from, a second agent re-checks the first pass, and you get a page with the note on one side and the values on the other. Anything that doesn't match the note word for word is flagged for you to review.

![The extraction page: a fictional admission note on the left with the quoted words highlighted, and the extracted values on the right, grouped into needs review, current illness and history](.github/readme/extraction-page.png)

The page is a local file. It is never published, and the note only reaches the model after you confirm it is not real patient data.

## Point at your app

Already have an app? Run `/medical-protocol:overlay`, then hover over any part of it in the browser. You can audit that part against the protocol, replace it with a medical-protocol screen, or add a new one right there. Changes are staged first and only land when you click Apply.

## What's in the plugin

### Skills

| Skill | Use it to |
|-------|-----------|
| `start` | Describe what you need. Everything starts here. |
| `extract` | Pull the values out of a clinical note, each with the words it came from |
| `preferences` | Set your specialty, patient population, guidelines and units |
| `protocol-audit` | Audit the project for safety, completeness, privacy and accessibility |
| `calc-audit` | Test the clinical calculations in your screens against the library |
| `overlay` | Turn on the dev overlay, or process what you selected in it: hover over any part of your app to audit it, replace it with a medical-protocol screen, or add a new one |

Internal skills (called by the agent): `vital-signs`, `acid-base`, `bmi`, `pafi`, `dka`, `water-balance`, `dashboard`, `modify`, `calc`, `qa`, `extract-artifact`, `troubleshoot`, `overlay-setup`, `overlay-audit`, `overlay-implement`, `overlay-add`.

### Hooks

| Hook | When | What it does |
|------|------|--------------|
| `privacy-guard` | Before every shell command | Blocks commands that could send data off the machine (`git push`, `curl` POST, `scp`, `nc`, `npm publish`…) |
| `note-consent` | Before a clinical note is read | Keeps the note from the model until you say it is not real patient data |
| `extraction-guard` | Before every file write | Keeps a saved note and its first extraction from being changed afterwards |
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

Commands: `bmi`, `abg`, `vitals`, `pafi`, `dka`, `water-balance`, `cardiology`, `sepsis`, `ckd`, `diabetes`, `extract`, `overlay`. Add `--json` to any command, `--help` for its options.

## Repository layout

```
plugin/                    # The Claude Code plugin
├── .claude-plugin/        # plugin.json
├── skills/                # SKILL.md + reference/ per skill
├── agents/                # qa-runner (browser QA), extraction-verifier
├── scripts/medprotocol.cjs # Built CLI
├── hooks/                 # privacy-guard, note-consent, extraction-guard, track-workflow, qa-reminder
└── lib/                   # Clinical logic (copied into doctor projects)
public/medical-protocol/   # Shared context docs: build contract, routing, per-module specs
packages/medprotocol/      # CLI source
packages/medical-protocol/ # Installer source
scripts/                   # Built installer, version bump
tests/                     # Vitest, clinical logic only
```

This repo has no UI code. Screens are generated in each doctor's project. See `CLAUDE.md` for details.

## Contributing

Contributions are welcome, especially new clinical modules and corrections from clinicians.

1. Fork and create a feature branch
2. Add tests in `tests/` for any new clinical logic
3. Make sure all tests pass. If you changed the CLI or installer source, rebuild (`npm run build`, `node packages/medical-protocol/build.mjs`) and commit the `.cjs` files
4. Open a PR

New clinical module: follow `.patterns/new-module/new-module.md` (logic in `plugin/lib/`, tests, context doc, CLI command, skill, classification row).

## License

See [LICENSE](./LICENSE).
