---
name: check
description: Check your clinical prototype — tests every calculation against the canonical library (terminal and browser) and scores correctness, completeness, synthetic-data use, accessibility and protocol adherence in one report
allowed-tools: Read, Grep, Glob, Bash
user-invocable: true
---

Read and follow: reference/core.md
Clinical logic source: ${CLAUDE_SKILL_DIR}/../../lib
Module docs: ${CLAUDE_SKILL_DIR}/../start/reference/context — each module's `{module}.md` (functions, thresholds, Screen spec)
Read when needed: reference/test-vectors.md, reference/scoring-criteria.md
medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever the docs say `medprotocol`

## Purpose

Test the calculations on every clinical screen in the user's project and score the prototype against the protocol's quality criteria, as one report with one score. The score measures how well the prototype teaches and follows the protocol, never whether it is fit for patient care.

## Report Mode

Pick one before starting:

- **Clinical (default)** — plain clinical words, per reference/core.md: name screens and values ("the BMI screen shows 24.1, expected 24.2"), never file names, line numbers, code or commands.
- **Developer** — add `file:line` for every finding and the lib function involved. Use it when the user asks for file or code detail, says they are working as a developer, or the check was started from the dev overlay.

## Phase 1: Discover

1. Check for `components/medprotocol/` — list all module folders found (also check `src/`)
2. Check for `app/` routes that correspond to them, and the clinical context file (`.clinical-context.md`)
3. Confirm `lib/medprotocol/` matches the clinical logic source (`diff -r <clinical logic source> lib/medprotocol`). Any local edit is a Clinical Correctness finding.
4. For each screen, read its source and grep for calculation functions imported from `lib/medprotocol` (e.g., `calculateBMI`, `analyzeABG`, `calculatePaFi`, `calculateTotalSOFA`, `calculateQSOFA`, `calculateEGFR`, `analyzeDKA`, `calculateWaterBalance`). Any clinical value computed or threshold hardcoded in the UI instead of the lib is a finding.
5. Build an inventory: which screens exist, their routes, and the lib functions each calls

If no screens are found, tell the user: "I don't see any clinical tools built yet. Ask me to build your first one, then come back for a check."

## Phase 2: Test Calculations

1. For each screen, run the matching `medprotocol <cmd> --json` with the inputs from reference/test-vectors.md
2. Verify all expected fields are present and values fall within the documented ranges
3. If a command fails, note the error and continue with the remaining screens

Then, if agent-browser is available and a dev server is running (`localhost:3000` or the configured port):

1. Open each screen's route, enter the same inputs, and snapshot the results
2. Compare displayed values against the terminal results — any mismatch is a P0 finding

If agent-browser is not available, note: "Browser test skipped — calculations were still checked against the canonical library."

## Phase 3: Score

Evaluate 5 dimensions (0–4 each, total /20) using reference/scoring-criteria.md. Phase 2 results feed Clinical Correctness (wrong values, accepted out-of-range input, wrong units) and Data Completeness (lib functions the screen should use but doesn't).

| Dimension | What to Check |
|-----------|--------------|
| **Clinical Correctness** | Test results match the library, critical value alerts present, validation rejects out-of-range input, units always shown |
| **Data Completeness** | All required fields present, expected lib functions used, no orphan calculations (e.g., AG without Na/Cl) |
| **Synthetic Data & Local Only** | No external API calls, no analytics, data stays local, demo data synthetic and labelled, learning-only line shown |
| **UI Accessibility** | Labels on all inputs, color not sole indicator, keyboard navigable, aria attributes |
| **Protocol Adherence** | Screen matches clinical guidelines (e.g., DKA resolution uses all 3 criteria) |

### Severity Levels

| Level | Meaning |
|-------|---------|
| **P0** | Wrong clinical result, or input that should be rejected is accepted — fix first |
| **P1** | Clinical accuracy issue — fix next |
| **P2** | Usability problem — fix when possible |
| **P3** | Polish/enhancement — nice to have |

## Phase 4: Report

```
## Prototype Check — Score: {total}/20

### Calculations: {passed}/{total} screens match the library
{per screen: "BMI ✓" or the mismatch, expected vs shown; browser line or "Browser test skipped"}

### Clinical Correctness: {score}/4 {✓ if 4/4}
{findings with severity}

### Data Completeness: {score}/4 {✓ if 4/4}
{findings with severity}

### Synthetic Data & Local Only: {score}/4 {✓ if 4/4}
{findings or "No external data transmission. All storage is local. Demo data is synthetic and labelled."}

### UI Accessibility: {score}/4 {✓ if 4/4}
{findings with severity}

### Protocol Adherence: {score}/4 {✓ if 4/4}
{findings with severity}

### What to fix
{one line per finding, most severe first, with the fix below}

---
This score is about the prototype's quality, not fitness for patient care: Medical Protocol is for learning and prototyping only.
Run the check again after fixes to see your score improve.
```

In developer mode, each finding also carries its `file:line`.

### Fixes

| Finding Type | Recommendation |
|-------------|---------------|
| Missing feature, accessibility issue, or value computed in the UI | "Ask me to change the {screen} to {fix}" |
| Screen not built | "Ask me to build a {screen}" |
| Error inside `lib/medprotocol` | Report it upstream, never patch locally |

## NEVER
- Report a passing score without running the tests and reading the source
- Skip Phase 2 — the terminal test always runs, even without agent-browser
- Skip any of the 5 dimensions
- Use vague findings — always give expected vs actual values (and `file:line` in developer mode)
- Show raw command output, file names or code in clinical mode
- Modify the project's code — only report and recommend
- Mark the data dimension as passing without checking for external network calls
- Describe a passing score as safe or ready for patients
