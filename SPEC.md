# Medical Protocol — System Specification

> Status: descriptive spec of the system as built (v0.7.7). This document is the
> authoritative description of *what the system is and how its parts contract
> with each other*. Per-module clinical math, thresholds, and edge cases are
> captured by the test suite (`tests/`) and the per-module context docs
> (`public/medical-protocol/context/*.md`); this spec covers the system, not the
> medicine.

---

## 1. Purpose

The Medical Protocol system lets a **healthcare professional who does not code**
build privacy-first clinical interfaces by describing needs in clinical language.
An AI agent (Claude Code) reads bundled protocols, installs validated UI
components, and wires them up. The same validated calculation logic is also
exposed as a terminal CLI for agents and clinicians.

Three properties hold the system together:

- **One source of clinical truth.** Calculation/validation logic lives once in
  `lib/`. Everything else (CLI, UI components) consumes or mirrors it.
- **Privacy by construction.** Patient data never leaves the doctor's machine.
  Outbound-data commands are blocked at the tool layer.
- **Clinical-language interface.** The agent never exposes frameworks, code, or
  jargon to the doctor.

---

## 2. System Topology — Four Parts

| # | Part | npm name | Lives in | Role |
|---|------|----------|----------|------|
| 1 | **Core** (this repo) | `medprotocol-core` (private root) | repo root | Source of truth: `lib/` logic, markdown protocols/workflows/context, plugin source, build/release tooling. |
| 2 | **Plugin installer** | `medical-protocol` | `packages/medical-protocol/` | `npx medical-protocol install` — bundles `plugin/` + context and installs skills/hooks/settings into a doctor's project. |
| 3 | **CLI calculator** | `medprotocol` | `packages/medprotocol/` | `npx medprotocol <cmd>` — terminal calculators importing `lib/`. No UI. |
| 4 | **UI delivery** | `medical-ui-cli` (separate repo) | `../medprotocol-ui` | shadcn-style React component delivery copied into doctor projects. Vendors its own copy of `lib/` logic. |

```
                        ┌─────────────────────────────────┐
                        │  medprotocol-core (this repo)    │
                        │                                  │
                        │   lib/  ← single source of truth │
                        │     │                            │
                        │     ├──────────────┐             │
                        │     │ imports      │ mirrored    │
                        │     ▼              ▼ (drift-check)│
                        │  packages/      (vendored copy)   │
                        │  medprotocol      in UI repo      │
                        │  (CLI)                            │
                        │                                  │
                        │  plugin/  ──build.sh──▶ packages/ │
                        │  (skills,            medical-     │
                        │   hooks,             protocol     │
                        │   settings)          (installer)  │
                        └───────────────┬──────────────────┘
                                        │ npx medical-protocol install
                                        ▼
                        ┌─────────────────────────────────┐
                        │  Doctor's Next.js project        │
                        │   .claude/ (skills, hooks)       │
                        │   components/ ← medical-ui-cli   │
                        └─────────────────────────────────┘
```

---

## 3. Boundaries & Invariants

These are hard constraints. Violations are bugs.

1. **This repo contains no React/Next.js/UI code.** The target stack (React 19,
   Next.js app router, shadcn/ui v4+, Tailwind, FHIR) describes what doctors end
   up with — not this repo. Never create component files here.
2. **`lib/` has no framework dependencies.** Pure TypeScript. It is the bridge
   consumed by the CLI (import) and the UI (vendored copy).
3. **No production dependencies in the root.** Root has only devDependencies
   (`typescript`, `vitest`, `@types/node`). Do not add runtime packages to the
   root. (Sub-packages may have their own build/CLI deps — see §6–7.)
4. **Content is markdown and JSON only.** Protocols, workflows, context,
   manifests. No HTML.
5. **`lib/` is the source of truth for clinical logic.** The UI's vendored copies
   must not diverge except at the reviewed string↔typed boundary (see §8).
6. **Versions are synced across files** via one tool (see §9). Drift in version
   numbers is a release error.

---

## 4. The `lib/` Contract — Source of Truth

`lib/` is pure calculation + validation logic. A single barrel (`lib/index.ts`)
re-exports every public function, giving one import point:
`import { calculateBMI, analyze, ... } from "../lib"`.

### 4.1 Conventions

- **Inputs are commonly strings.** Many functions accept raw string inputs and
  parse internally (e.g. `calculateBMI(w, hFt, hIn, hM, metric)` returns
  `string | null`). This is because the same logic backs both a CLI (argv
  strings) and React inputs. Parsing uses `safeParseFloat` /
  `safeParseFloatOrNull` (`lib/utils/safeParseFloat.ts`).
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
  referencing the clinical standard (these comments are intentionally dropped in
  the UI copy — see §8).

### 4.2 Module Inventory

| Module | File(s) | Public surface (representative) |
|--------|---------|-------------------------------|
| **BMI** | `lib/bmi.ts` | `calculateBMI`, `getBMICategory` (WHO tiers) |
| **Acid-Base / ABG** | `lib/acid-base/` (`analyze.ts`, `interfaces.ts`, `index.ts`) | `analyze({ values, isChronic })` → primary disorder, compensation (Winter's), anion gap, delta ratio; types `ABGValues`, `ABGResult` |
| **PaFi (ARDS)** | `lib/pafi.ts` | `calculatePaFi`, `getPaFiClassification` (Berlin), `getPaFiSeverity` |
| **Water Balance** | `lib/water-balance.ts` | `calculateInsensibleLoss`, `calculateEndogenousGeneration`, `calculateDefecationLoss`, `calculateWaterBalance` |
| **DKA** | `lib/dka.ts` | glucose/ketone/HCO3 rate calcs + on-target checks, `classifyPotassium`, `classifyGCS`, `assessDKAResolution`, `suggestInsulinAdjustment` |
| **Cardiology** | `lib/cardiology.ts`, `lib/cardiology-types.ts` | `calculateASCVD` (Cox + `COEFFICIENTS`), `calculateHEARTScore`, `calculateCHADSVASc`, each with category/action/severity helpers |
| **Sepsis** | `lib/sepsis.ts` | per-organ SOFA (`calculate*SOFA`), `calculateTotalSOFA`, `calculateSOFADelta`, `calculateQSOFA`, `assessSepsis`, `assessSepticShock`, `assessBundleCompliance`, `calculateLactateClearance` |
| **CKD / Nephrology** | `lib/ckd.ts` | `calculateEGFR` (CKD-EPI 2021), GFR/albuminuria classification, `calculateKFRE`, drug-eligibility checks (RASi/SGLT2i/finerenone), eGFR-slope/progression, plus CKD-MBD & anemia management (CLI-only block) |
| **Diabetes Dx** | `lib/diabetes-dx.ts` | `classifyA1C`/`FPG`/`2hPG`/`RandomPG`, `getDiagnosis`, `checkConfirmation` (ADA) |
| **Endocrine** | `lib/endocrine.ts` | `classifyT1DStage`, `classifyT1vsT2`, `getT2DScreeningRecommendation`, `classifyGDM_OneStep`/`TwoStep` |
| **Vital Signs** | `lib/vital-signs-validations/` | per-vital validate/parse/category + limits consts for BP, HR, RR, SpO2, Temp; shared `types.ts` |
| **Formatting** | `lib/format.ts` | `formatJson`, `formatTable`, `formatHeader`, `formatError`, `printResult` — CLI output helpers (not clinical) |

> Per-module clinical detail (formulas, thresholds, tiers) is documented in
> `public/medical-protocol/context/<module>.md` and pinned by `tests/`.

---

## 5. Part 3 — CLI (`medprotocol`)

- **Entry:** `packages/medprotocol/src/index.ts`. Dispatches `argv[2]` to a
  lazy-loaded command module: `commands: Record<string, () => Promise<{ run }>>`.
  Unknown command → stderr + exit 1. `--version`/`--help` handled before dispatch.
- **Commands (10):** `bmi`, `abg`, `vitals`, `pafi`, `dka`, `water-balance`,
  `cardiology`, `sepsis`, `ckd`, `diabetes`. Some have subcommands (e.g.
  `cardiology ascvd|heart|chadsvasc`; `sepsis sofa|qsofa|lactate`;
  `ckd egfr|stage|kfre|treatment|anemia|mbd`; `diabetes diagnose|t1d-stage|
  t1-vs-t2|t2d-screen|gdm`).
- **Each command module** exports `run(argv)` and a `USAGE` string, parses flags,
  calls `lib/` functions, and prints via `lib/format.ts`.
- **Global `--json` contract:** every command accepts `--json` for
  machine-readable output. This is the integration point for QA: the agent runs
  the CLI with `--json` and compares against the UI to verify the UI's math.
- **Build:** `tsup src/index.ts --format cjs --target node18 --out-dir dist`.
  Published with only `dist/`. Bin: `medprotocol`.

---

## 6. Part 2 — Plugin Installer (`medical-protocol`)

CLI built with `commander`. Entry: `packages/medical-protocol/src/index.ts`.

### 6.1 Commands

| Command | Purpose | Key options |
|---------|---------|-------------|
| `install` | Install plugin into a project | `--dir`, `--force`, `--link`, `--source <path>`, `--json`, `-y/--yes` |
| `check` | Report whether the installed plugin is up to date / symlinks healthy | `--dir`, `--json` |
| `update` | Update installed plugin to bundled version | `--dir`, `--force`, `--json` |

### 6.2 Install modes

- **Copy mode (default):** files are copied into the project's `.claude/`. A
  **manifest** (`src/manifest.ts`: `hashFile`, `readManifest`, `writeManifest`,
  `FileManifest`) records SHA hashes so `update`/`check` can detect locally
  modified files and avoid clobbering them (prompts via `confirmOverwriteModified`).
- **Symlink mode (`--link`):** clones the repo to `~/.medical-protocol` (or
  `--source`) and symlinks instead of copying, so all linked projects update on
  `git pull`. `files.ts` provides `cloneOrPullRepo`, `symlinkDir/File`,
  `isSymlink`, `getRepoStatus`, `getDefaultSourceDir`, `REPO_URL`.
- **Settings/hooks merge:** `mergeSettings` and `mergeHooksJson` merge bundled
  `settings.json` / `hooks.json` into existing project files rather than
  overwriting, so doctor customizations survive updates.
- **Interactivity:** `prompts.ts` (`@clack/prompts`) drives interactive flows;
  `-y`/`--json` force non-interactive.

### 6.3 Build & bundling — `build.sh`

`packages/medical-protocol/build.sh` is the bridge from source to publishable
package. It:

1. Builds `src/index.ts` with tsup.
2. Wipes and repopulates `packages/medical-protocol/plugin/` from the repo's
   `plugin/` (skills, hooks, settings.json).
3. **Syncs canonical context into each skill's `reference/`** from
   `public/medical-protocol/context/` (the single source of truth):
   `classification.md` → `start`; `cli.md` → `calc`; `components.md` &
   `composition.md` → a fixed list of skills; plus workflow files
   (`nephrology`/`cardiology`/`sepsis`/`troubleshoot`/`initial-clarification`).

> Invariant: `plugin/skills/*/reference/*.md` copies of shared context are
> **generated** at build time from `public/.../context/`. Edit the source under
> `public/`, not the per-skill copies.

Published with `dist/` + `plugin/`. Bin: `medical-protocol`.

---

## 7. Plugin Runtime (skills, hooks, classification)

What gets installed into the doctor's project.

### 7.1 Protocol entry & agent contract

`public/medical-protocol/providers/claude-code/protocol.md` is the top-level
agent instruction. It mandates:

- **Communication in clinical language only** — never expose frameworks, code,
  or terminal output unless asked.
- **Project check / scaffold** — ensure a Next.js + shadcn project exists, else
  scaffold; write a project `CLAUDE.md` with QA rules.
- **Initial Clarification (blocking)** → **Classification** → **Workflow
  execution** → **Quality Checklist** → **Browser QA**.
- `providers/manifest.json` registers providers (currently only `claude-code`,
  `status: active`).

### 7.2 Classification & routing

`public/medical-protocol/context/classification.md` maps **signal words → domain**
(vital-signs, bmi, acid-base, water-balance, pafi, dka, sepsis, diabetes,
cardiology, nephrology, dashboard, modify, troubleshoot, calc, preferences,
protocol-audit, calc-audit). Routing rules: initial clarification must complete
first; multi-domain → prefer `dashboard`; problem reports → always
`troubleshoot`; CKD routes to the **nephrology** domain. The `start` skill holds
the domain→skill/workflow routing table.

### 7.3 Skills (14)

Each skill is a directory under `plugin/skills/<name>/` with a `SKILL.md`
(frontmatter: `name`, `description`, `allowed-tools`, `user-invocable`) plus a
`reference/` dir of supporting docs. `SKILL.md` files delegate via
`Read and follow: reference/<file>`. Skills: `start`, `bmi`, `acid-base`,
`vital-signs`, `water-balance`, `pafi`, `dka`, `dashboard`, `modify`,
`troubleshoot`, `calc`, `calc-audit`, `preferences`, `protocol-audit`.
(`start` is the entry router; `nephrology`/`cardiology`/`sepsis`/`diabetes`
domains route to workflow files inside `start/reference/` rather than their own
skill.)

### 7.4 Hooks (3) — `plugin/hooks/`

| Hook | Event | Behavior |
|------|-------|----------|
| `privacy-guard.sh` | PreToolUse (Bash) | **Denies** outbound-data commands: `git push`, `npm/yarn/pnpm publish`, `scp/sftp/ftp`, `nc/netcat`, `rsync` to remote, `curl`/`wget`/`httpie` with data-sending methods, `docker push`, non-local `ssh`, base64/env piped to network. Allows GET, local dev, git add/commit, tsc. |
| `track-workflow.sh` | PostToolUse (Bash) | When a workflow is active, sets marker files in `.claude/hooks-state/`: `.qa_started` (on tweakcn/shadcn/tsc/eslint), `.dev_server_up` (on `npm run dev`). |
| `qa-reminder.sh` | Stop | If a workflow ran but QA/dev-server markers are missing, **blocks** stop and instructs the agent to finish the Quality Checklist + start dev server. On success, clears the state dir. |

`hooks.json` wires the three matchers; `settings.json` carries plugin settings.

---

## 8. Part 4 — UI Delivery & the Drift-Check Contract

The UI repo (`medprotocol-ui`) ships shadcn-style components copied into doctor
projects. Because copied components can't import an external package at runtime,
the UI **vendors its own copy** of each `lib/` module as a per-component
`lib.ts`/`.tsx`. This duplication is deliberate and is guarded by
`scripts/drift-check.js`.

### 8.1 Contract

- **`lib/` is canonical; the UI copy must match its clinical logic.**
- `drift-check.js` holds a `PAIRS` table mapping each core file to its UI copy
  (e.g. `lib/bmi.ts ↔ components/bmi/lib.ts`). It extracts exported functions,
  **normalizes away cosmetic deltas** (comments, semicolons, whitespace, and the
  `safeParseFloatOrNull`→`safeFloat` rename), and compares per function.
- An **`ACK` table** whitelists *reviewed-benign* divergence:
  - `coreOnly` — functions intentionally absent from the UI (e.g. CKD-MBD/anemia
    block, CLI-only temperature helper). The UI must not import them.
  - `boundary` — shared functions whose bodies differ *only* at the
    string-vs-typed input / null-handling boundary, with identical clinical math.
- **Anything not acknowledged fails.** New, unreviewed drift trips the alarm.
  Known live bugs are intentionally left red (e.g. blood-oxygen S/F ratio off by
  100× in the UI; two temperature functions awaiting a UI fix).
- **Exit codes:** `0` in sync (also when the UI repo isn't checked out beside
  this one — so machines without the sibling repo don't break), `1` drift, `2`
  setup error (a mapped file is missing).
- **Resolution:** UI dir is `../medprotocol-ui`, overridable via `--ui <path>`
  or `MEDPROTOCOL_UI_DIR`.

### 8.2 Adding/changing shared logic

When you change a `PAIRS`-mapped `lib/` file, you must reconcile the UI copy (or
add a reviewed `ACK` entry) or the push gate (§9) will block.

---

## 9. Versioning, Build & Release

**One version** flows across four files via `npm run version:bump <X.Y.Z>`
(`scripts/bump-version.sh`): root `package.json`,
`public/medical-protocol/providers/manifest.json`,
`packages/medprotocol/package.json`,
`packages/medical-protocol/package.json`. The script validates semver and is
idempotent; follow with `npm install --package-lock-only` to sync the lockfile.

### 9.1 Gated push — `scripts/git/push.sh` (`npm run push`)

Drives both repos (`core`, `ui`, or `all`) from core. Runs `drift-check.js` once
as a **shared gate**, then pushes via `git -C` (no `cd`). `--no-verify` bypasses
the gate (and skips the redundant pre-push hook run). A pre-push git hook
(`scripts/hooks/pre-push`, installed via `scripts/hooks/install.sh`) runs the same
drift-check so a plain `git push` is also gated.

### 9.2 Gated release — `scripts/npm/release.sh` (`npm run release`)

`release.sh <version> [all|cli|installer] [-- <npm args>]`. Gates, all must pass
before anything publishes:

1. **npm auth** present (`npm whoami`).
2. **Version sanity** — valid semver and strictly greater than each target's
   published version.
3. **Full test suite passes** (`npm test`).

Then: `version:bump` (all files) → lockfile sync → per-target `build` →
`npm publish`. `--dry-run` relaxes gates 1–2. Targets map: `cli` →
`packages/medprotocol` (npm `medprotocol`); `installer` →
`packages/medical-protocol` (npm `medical-protocol`).

---

## 10. Privacy Model

- **All patient data stays local.** No production deps, no telemetry, local
  storage only in doctor projects.
- **Enforced at the tool layer**, not by convention: `privacy-guard.sh` denies
  any Bash command that could exfiltrate data (see §7.4). This is why
  `npm publish` and `git push` are blocked inside doctor projects — release from
  this repo uses the gated scripts in §9 instead.
- The protocol instructs the agent to warn the doctor if they paste real patient
  data into chat, and to state on first completion that data stays on the machine.

---

## 11. Testing

- **Vitest, logic-only.** `npm test` runs all suites under `tests/` (per-module
  clinical tests + `tests/cli/` per-command tests). Watch: `npm run test:watch`.
  Single dir/file: `npx vitest run tests/<dir>/[file].test.ts`.
- **No UI tests in this repo.** UI verification is the agent's **Browser QA**
  workflow (`agent-qa.md`) plus calculation cross-checks against `npx medprotocol
  --json`.
- **Coverage intent:** extreme/negative/zero-divisor inputs, boundary conditions
  for every classification tier, mixed/triple acid-base disorders.
- TypeScript strict mode (`tsconfig.json`). No linter.

---

## 12. End-to-End Data Flow

1. **Author** edits clinical logic in `lib/` (source of truth) and/or markdown
   context in `public/medical-protocol/`.
2. **Tests** (`tests/`) pin the logic; CLI commands surface it via `--json`.
3. **drift-check** ensures the UI repo's vendored copies still match `lib/`.
4. **`build.sh`** bundles `plugin/` + canonical context into the installer
   package; **`release.sh`** gates and publishes `medprotocol` (CLI) and
   `medical-protocol` (installer).
5. **Doctor** runs `npx medical-protocol install` → skills/hooks/settings land in
   their project's `.claude/`.
6. **Agent** (Claude Code) reads the protocol, clarifies, classifies, routes to a
   skill/workflow, installs UI components via `npx medical-ui-cli add`, and wires
   them — communicating only in clinical language.
7. **Privacy guard + QA hooks** enforce data locality and quality at runtime.

---

## 13. Adding a New Clinical Module (checklist)

Per `.patterns/new-module/` and the README contributing section:

1. **Pure logic** in `lib/<module>.ts`, exported from `lib/index.ts`.
2. **Tests** in `tests/<module>/`.
3. **CLI command** in `packages/medprotocol/src/commands/<module>.ts` (+ register
   in `index.ts`, add `--json`), with `tests/cli/<module>-cli.test.ts`.
4. **Context doc** `public/medical-protocol/context/<module>.md`.
5. **Classification row** in `public/.../context/classification.md` and routing
   in the `start` skill.
6. **Workflow file** under `providers/claude-code/workflows/`.
7. If the module gets a UI component: add a `PAIRS` entry to `drift-check.js`
   (and `ACK` for any reviewed boundary divergence).
8. Bump version via `npm run version:bump`.
```
