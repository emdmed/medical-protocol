# Medical Protocol — System Specification

> Status: descriptive spec of the system as built (v1.6.0). This document is the
> authoritative description of *what the system is and how its parts contract
> with each other*. Per-module clinical math, thresholds, and edge cases are
> captured by the test suite (`tests/`) and the per-module context docs
> (`public/medical-protocol/context/*.md`); this spec covers the system, not the
> medicine.

---

## 1. Purpose

The Medical Protocol system lets a **healthcare professional who does not code**
build privacy-first clinical interfaces by describing needs in clinical language.
An AI agent (Claude Code) reads bundled protocols, copies the validated clinical
logic into the doctor's project, and generates the UI for it with UI SDK. The same validated calculation logic is also
exposed as a terminal CLI for agents and clinicians.

Three properties hold the system together:

- **One source of clinical truth.** Calculation/validation logic lives once in
  `plugin/lib/`. The CLI imports it; doctor projects get an unmodified copy at
  `lib/medprotocol/` and the generated UI only calls it.
- **Privacy by construction.** Patient data never leaves the doctor's machine.
  Outbound-data commands are blocked at the tool layer.
- **Clinical-language interface.** The agent never exposes frameworks, code, or
  jargon to the doctor.

---

## 2. System Topology — Three Parts

| # | Part | Lives in | Role |
|---|------|----------|------|
| 1 | **Plugin** | `plugin/` (+ `public/medical-protocol/` doc sources) | The Claude Code plugin doctors install from the marketplace (`plugin/.claude-plugin/plugin.json`): skills, hooks, agents, `lib/` logic, built CLI. |
| 2 | **CLI calculator** | `packages/medprotocol/` | Terminal calculators importing `plugin/lib/`. No UI. Bundled into `plugin/scripts/medprotocol.cjs`; skills run it with `node`. |
| 3 | **Generated UI** | doctor's project | Screens generated per project with [UI SDK](https://ui-sdk.dev/docs) (React 19+, unstyled) following `context/building.md`. They import the copied logic from `lib/medprotocol/`. |

Nothing ships through npm.

```
  medprotocol-core (this repo)
    plugin/lib/  ← single source of clinical logic
      └─ imported by packages/medprotocol → plugin/scripts/medprotocol.cjs
    public/medical-protocol/ ──sync-reference.mjs─▶ plugin/skills/*/reference/
    plugin/  (skills, hooks, agents, lib, scripts)
        │  /plugin install medical-protocol@medical-protocol
        ▼
  Doctor's Next.js project
    lib/medprotocol/         ← copied lib
    components/medprotocol/  ← generated with UI SDK
```

---

## 3. Boundaries & Invariants

These are hard constraints. Violations are bugs.

1. **This repo contains no React/Next.js/UI code.** The target stack (React 19,
   Next.js app router, UI SDK, Tailwind, FHIR) describes what doctors end
   up with — not this repo. Never create component files here.
2. **`plugin/lib/` has no framework dependencies.** Pure TypeScript. It is the
   bridge consumed by the CLI (import) and the generated UI (unmodified copy).
3. **No production dependencies in the root.** Root has only devDependencies
   (`typescript`, `vitest`, `@types/node`). Do not add runtime packages to the
   root. (The CLI package has its own build devDependencies — see §5.)
4. **Content is markdown and JSON only.** Workflows, context, manifests. No HTML.
5. **`plugin/lib/` is the source of truth for clinical logic.** Doctor projects
   never edit their copy, and generated UI never computes or thresholds a
   clinical value itself (see §8).
6. **Versions are synced across files** via one tool (see §9). Drift in version
   numbers is a release error.

---

## 4. The `plugin/lib/` Contract — Source of Truth

`plugin/lib/` is pure calculation + validation logic. There is no barrel:
import each function from its own module, e.g.
`import { calculateBMI } from "../lib/bmi"`.

### 4.1 Conventions

- **Inputs are commonly strings.** Many functions accept raw string inputs and
  parse internally (e.g. `calculateBMI(w, hFt, hIn, hM, metric)` returns
  `string | null`). This is because the same logic backs both a CLI (argv
  strings) and React inputs. Parsing uses `safeParseFloat` /
  `safeParseFloatOrNull` (`plugin/lib/utils/safeParseFloat.ts`).
- **Invalid input → `null` (or a typed "Unknown"/error), never a throw.** E.g.
  BMI rejects non-numeric, ≤0, or out-of-realistic-bounds values by returning
  `null`; `getBMICategory(null)` returns `"Unknown"`.
- **Calculation and classification are separate functions.** Pattern:
  `calculateX(...)` produces a number/score; `getXCategory(...)` /
  `classifyX(...)` maps it to a clinical tier; `getXSeverity(...)` maps it to a
  severity level used for color-coding.
- **Realistic bounds reject data-entry errors** (e.g. `MAX_WEIGHT_KG = 700`,
  `MAX_HEIGHT_M = 2.75`).
- **Named constants carry citations.** Thresholds are named consts with comments
  referencing the clinical standard; `sources.ts` holds citations the UI shows.

### 4.2 Module Inventory

| Module | File(s) | Public surface (representative) |
|--------|---------|-------------------------------|
| **BMI** | `plugin/lib/bmi.ts` | `calculateBMI`, `getBMICategory` (WHO tiers) |
| **Acid-Base / ABG** | `plugin/lib/acid-base/` (`analyze.ts`, `interfaces.ts`, `index.ts`) | `analyze({ values, isChronic })` → primary disorder, compensation (Winter's), anion gap, delta ratio |
| **PaFi (ARDS)** | `plugin/lib/pafi.ts` | `calculatePaFi`, `getPaFiClassification` (Berlin), `getPaFiSeverity` |
| **Water Balance** | `plugin/lib/water-balance.ts` | `calculateInsensibleLoss`, `calculateEndogenousGeneration`, `calculateDefecationLoss`, `calculateWaterBalance` |
| **DKA** | `plugin/lib/dka.ts` | glucose/ketone/HCO3 rate calcs + on-target checks, `classifyPotassium`, `classifyGCS`, `assessDKAResolution`, `suggestInsulinAdjustment` |
| **Cardiology** | `plugin/lib/cardiology.ts`, `plugin/lib/cardiology-types.ts` | `calculateASCVD` (Cox + `COEFFICIENTS`), `calculateHEARTScore`, `calculateCHADSVASc`, each with category/action/severity helpers |
| **Sepsis** | `plugin/lib/sepsis.ts` | per-organ SOFA-2 (`calculate*SOFA`), `calculateTotalSOFA`, `calculateSOFADelta`, `calculateQSOFA`, `assessSepsis`, `assessSepticShock`, `assessBundleCompliance`, `calculateLactateClearance` |
| **CKD / Nephrology** | `plugin/lib/ckd.ts` | `calculateEGFR` (CKD-EPI 2021), GFR/albuminuria classification, `calculateKFRE`, drug-eligibility checks (RASi/SGLT2i/finerenone), eGFR-slope/progression, plus CKD-MBD & anemia management (CLI-only block) |
| **Diabetes Dx** | `plugin/lib/diabetes-dx.ts` | `classifyA1C`/`FPG`/`2hPG`/`RandomPG`, `getDiagnosis`, `checkConfirmation` (ADA) |
| **Endocrine** | `plugin/lib/endocrine.ts` | `classifyT1DStage`, `classifyT1vsT2`, `getT2DScreeningRecommendation`, `classifyGDM_OneStep`/`TwoStep` |
| **Vital Signs** | `plugin/lib/vital-signs-validations/` | per-vital validate/parse/category + limits consts for BP, HR, RR, SpO2, Temp; shared `types.ts` |
| **Nephrology panels** | `plugin/lib/nephrology.ts` | CKD anemia, CKD-MBD, cardio-metabolic classifications (re-exports ESA/MBD helpers from `ckd.ts`) |
| **Hepatology** | `plugin/lib/hepatology.ts` | `calculateFIB4`, `getMASLDRiskStratification`, `getMASLDTreatmentRecommendation` |
| **Patient** | `plugin/lib/patient.ts` | `calculateAge` |
| **Severity** | `plugin/lib/vital-signs-validations/severity.ts` | shared vital-sign severity levels for UI display |
| **Sources / Trace** | `plugin/lib/sources.ts`, `plugin/lib/trace.ts` | guideline citations shown in the UI; calculation trace |
| **Formatting** | `plugin/lib/format.ts` | `formatTable`, `formatHeader`, `formatError`, `printResult` — CLI output helpers (not clinical) |

> Per-module clinical detail (formulas, thresholds, tiers) is documented in
> `public/medical-protocol/context/<module>.md` and pinned by `tests/`.

---

## 5. Part 2 — CLI (`medprotocol`)

- **Entry:** `packages/medprotocol/src/index.ts`. Dispatches `argv[2]` to a
  lazy-loaded command module: `commands: Record<string, () => Promise<{ run }>>`.
  Unknown command → stderr + exit 1. `--version`/`--help` handled before dispatch.
- **Commands (10):** `bmi`, `abg`, `vitals`, `pafi`, `dka`, `water-balance`,
  `cardiology`, `sepsis`, `ckd`, `diabetes`. Some have subcommands (e.g.
  `cardiology ascvd|heart|chadsvasc`; `sepsis sofa|qsofa|lactate`;
  `ckd egfr|stage|kfre|treatment|anemia|mbd`; `diabetes diagnose|t1d-stage|
  t1-vs-t2|t2d-screen|gdm`).
- **Each command module** exports `run(argv)` and a `USAGE` string, parses flags,
  calls `plugin/lib/` functions, and prints via `plugin/lib/format.ts`.
- **Global `--json` contract:** every command accepts `--json` for
  machine-readable output. This is the integration point for QA: the agent runs
  the CLI with `--json` and compares against the UI to verify the UI's math.
- **Build:** `npm run build` bundles it with tsup into the committed
  `plugin/scripts/medprotocol.cjs`. Not published to npm.

---

## 6. Reference sync — `scripts/sync-reference.mjs`

Run by `npm run build` after the CLI build. It copies the shared docs from
`public/medical-protocol/` (the single source of truth) into the plugin:

- `context/` shared docs (`building.md`, `components.md`, `composition.md`,
  `classification.md`, `cli.md`, `extraction.md`) → the `reference/` dir of each
  skill that uses them.
- `context/` module docs (Screen specs) → one copy in
  `plugin/skills/start/reference/context/`, which every build skill points at
  with its `Module docs:` line.
- `workflows/` (`agent-qa`, `quality-checklist`, `patient-privacy`,
  `troubleshoot`, `initial-clarification`, `nephrology`/`cardiology`/`sepsis`)
  → the skills that read them.

> Invariant: those copies under `plugin/skills/*/reference/` are **generated**.
> Edit the source under `public/`, not the per-skill copies. CI fails if they
> are out of date.

---

## 7. Plugin Runtime (skills, hooks, classification)

What the marketplace installs.

### 7.1 Agent contract

Every skill reads `reference/core.md` (clinical language only — never expose
frameworks, code, or terminal output unless asked; interface in the doctor's
language). The `start` skill then runs: **Project check / scaffold**
(`reference/project-setup.md`: ensure a Next.js project, set up UI SDK, write a
project `CLAUDE.md` with QA rules) → **Initial Clarification (blocking)** →
**Classification** → **Workflow execution** (screens built per
`context/building.md`) → **Quality Checklist** → **Browser QA**.

### 7.2 Classification & routing

`public/medical-protocol/context/classification.md` maps **signal words → domain**
(vital-signs, bmi, acid-base, water-balance, pafi, dka, sepsis, diabetes,
cardiology, nephrology, dashboard, modify, troubleshoot, calc, preferences,
protocol-audit, calc-audit). Routing rules: initial clarification must complete
first; multi-domain → prefer `dashboard`; problem reports → always
`troubleshoot`; CKD routes to the **nephrology** domain. The `start` skill holds
the domain→skill/workflow routing table.

### 7.3 Skills

Each skill is a directory under `plugin/skills/<name>/` with a `SKILL.md`
(frontmatter: `name`, `description`, `allowed-tools`, `user-invocable`) plus a
`reference/` dir of supporting docs. `SKILL.md` files delegate via
`Read and follow: reference/<file>`; build skills also declare
`Clinical logic source:` (the plugin's `lib/` folder) and `Module docs:`. Skills: `start`, `bmi`,
`acid-base`, `vital-signs`, `water-balance`, `pafi`, `dka`, `dashboard`,
`modify`, `troubleshoot`, `calc`, `calc-audit`, `preferences`,
`protocol-audit`, `overlay`, `overlay-setup`, `overlay-audit`, `overlay-implement`,
`overlay-add`.
(`start` is the entry router; `nephrology`/`cardiology`/`sepsis`/`diabetes`
domains route to workflow files inside `start/reference/` rather than their own
skill.)

### 7.4 Hooks (3) — `plugin/hooks/`

| Hook | Event | Behavior |
|------|-------|----------|
| `privacy-guard.mjs` | PreToolUse (Bash) | **Denies** outbound-data commands: `git push`, `npm/yarn/pnpm publish`, `scp/sftp/ftp`, `nc/netcat`, `rsync` to remote, `curl`/`wget`/`httpie` with data-sending methods, `docker push`, non-local `ssh`, base64/env piped to network. Allows GET, local dev, git add/commit, tsc. |
| `track-workflow.mjs` | PostToolUse (Bash) | When a workflow is active, sets marker files in `.claude/hooks-state/`: `.qa_started` (on `tsc --noEmit`/a `medprotocol.cjs` run/eslint/prettier), `.dev_server_up` (on `npm run dev`). |
| `qa-reminder.mjs` | Stop | If a workflow ran but QA/dev-server markers are missing, **blocks** stop and instructs the agent to finish the Quality Checklist + start dev server. On success, clears the state dir. |

The hooks are dependency-free Node (`.mjs`) scripts — no bash/jq/grep — so they run identically on Windows, macOS, and Linux. `hooks.json` invokes each via `node "${CLAUDE_PLUGIN_ROOT}/hooks/<name>.mjs"`.

---

## 8. Part 3 — Generated UI

There is no component package. The UI for each clinical tool is generated in the
doctor's project by the agent, following `public/medical-protocol/context/building.md`:

1. **Copy logic:** `cp -r <plugin lib>/. lib/medprotocol/` on every build
   (refreshes it to the plugin's version).
2. **Set up UI SDK** once (`@ui-sdk/react`, `@ui-sdk/core`, React 19+).
3. **Generate** `components/medprotocol/<module>/<module>.tsx` from UI SDK
   parts, following the module's Screen spec in `context/<module>.md`.

Rules: every clinical value on screen comes from a `lib/medprotocol` function;
`lib/medprotocol/` is never edited locally (fixes go upstream to `plugin/lib/`);
no thresholds in the UI; units and guideline sources shown; disclaimer on every
clinical screen. Correctness is checked by comparing the screen against
`medprotocol <cmd> --json` during QA.

Because the doctor's project holds an unmodified copy rather than a hand-ported
fork, there is nothing to keep in sync.

---

## 9. Versioning & Build

**One version** flows across the files via `npm run version:bump <X.Y.Z>`
(`scripts/bump-version.sh`): root `package.json`,
`packages/medprotocol/package.json`, `plugin/.claude-plugin/plugin.json`, this
file's status line and the lockfile. The script validates semver, then runs
`npm run build`. Release is a commit plus a `v<X.Y.Z>` git tag; the marketplace
serves `plugin/` from the repo.

---

## 10. Privacy Model

- **All patient data stays local.** No production deps, no telemetry, local
  storage only in doctor projects.
- **Enforced at the tool layer**, not by convention: `privacy-guard.mjs` denies
  any Bash command that could exfiltrate data (see §7.4). This is why
  `npm publish` and `git push` are blocked inside doctor projects.
- The skills instruct the agent to warn the doctor if they paste real patient
  data into chat, and to state on first completion that data stays on the machine.

---

## 11. Testing

- **Vitest, logic-only.** `npm test` runs all suites under `tests/` (per-module
  clinical tests + `tests/cli/` per-command tests). Watch: `npm run test:watch`.
  Single dir/file: `npx vitest run tests/<dir>/[file].test.ts`.
- **No UI tests in this repo.** UI verification is the agent's **Browser QA**
  workflow (`agent-qa.md`) plus calculation cross-checks against `medprotocol
  --json`.
- **Coverage intent:** extreme/negative/zero-divisor inputs, boundary conditions
  for every classification tier, mixed/triple acid-base disorders.
- TypeScript strict mode (`tsconfig.json`). No linter.

---

## 12. End-to-End Data Flow

1. **Author** edits clinical logic in `plugin/lib/` (source of truth) and/or markdown
   context in `public/medical-protocol/`.
2. **Tests** (`tests/`) pin the logic; CLI commands surface it via `--json`.
3. **`npm run build`** bundles the CLI and syncs the docs into `plugin/skills`;
   both are committed.
4. **Doctor** installs the plugin from the marketplace.
5. **Agent** (Claude Code) runs the `start` skill, clarifies, classifies, routes to a
   skill/workflow, copies the logic into `lib/medprotocol/`, generates the
   screens with UI SDK, and wires them — communicating only in clinical language.
6. **Privacy guard + QA hooks** enforce data locality and quality at runtime.

---

## 13. Adding a New Clinical Module (checklist)

Per `.patterns/new-module/` and the README contributing section:

1. **Pure logic** in `plugin/lib/<module>.ts`.
2. **Tests** in `tests/<module>/`.
3. **CLI command** in `packages/medprotocol/src/commands/<module>.ts` (+ register
   in `index.ts`, add `--json`), with `tests/cli/<module>-cli.test.ts`.
4. **Context doc** `public/medical-protocol/context/<module>.md`.
5. **Classification row** in `public/.../context/classification.md` and routing
   in the `start` skill.
6. **Skill** under `plugin/skills/<module>/` (or a workflow file under
   `public/medical-protocol/workflows/`), plus its reference copies in
   `scripts/sync-reference.mjs`.
7. Bump version via `npm run version:bump`.
```
