---
name: protocol-audit
description: Audit your clinical prototype for correct results, completeness, synthetic-data use, accessibility, and protocol adherence
allowed-tools: Read, Grep, Glob, Bash
user-invocable: true
---

Read and follow: reference/core.md
Read when needed: reference/scoring-criteria.md

## Purpose

Score a built prototype against the protocol's quality criteria, produce a structured report with severity ratings, and recommend fixes. The score measures how well the prototype teaches and follows the protocol, never whether it is fit for patient care.

## Phase 1: Scan

Scan the project for clinical screens:

1. Check for `components/medprotocol/` — list all module folders found (also check `src/`)
2. Check for clinical context file (`.clinical-context.md`)
3. Check for `app/` routes that correspond to them
4. Build a component inventory: which screens exist, which routes exist, which `lib/medprotocol` functions each calls (from its header comment and imports)

If no screens are found, tell the user: "I don't see any clinical tools built yet. Run /medical-protocol:start to build your first component, then come back for an audit."

## Phase 2: Score

Evaluate 5 dimensions (0–4 points each, total /20). Read the scoring criteria reference file for detailed rubrics.

| Dimension | What to Check |
|-----------|--------------|
| **Clinical Correctness** | Critical value alerts present, validation rejects out-of-range input, units always shown |
| **Data Completeness** | All required fields present, no orphan calculations (e.g., AG without Na/Cl) |
| **Synthetic Data & Local Only** | No external API calls, no analytics, data stays local, demo data synthetic and labelled, learning-only line shown |
| **UI Accessibility** | Labels on all inputs, color not sole indicator, keyboard navigable, aria attributes |
| **Protocol Adherence** | Component matches clinical guidelines (e.g., DKA resolution uses all 3 criteria) |

### How to Score

For each screen:
1. Read the component source files. Check the building.md rules: no clinical value computed or threshold hardcoded in the UI, `lib/medprotocol/` unedited, units and disclaimer shown
2. Check against the scoring criteria
3. Note specific findings with severity levels
4. Calculate dimension scores

### Severity Levels

| Level | Meaning |
|-------|---------|
| **P0** | Wrong clinical result, or input that should be rejected is accepted — fix first |
| **P1** | Clinical accuracy issue — fix next |
| **P2** | Usability problem — fix when possible |
| **P3** | Polish/enhancement — nice to have |

## Phase 3: Report

Output a structured report in clinical language:

```
## Protocol Audit — Score: {total}/20

### Clinical Correctness: {score}/4 {✓ if 4/4}
{findings or "All critical value alerts working. Units displayed on all measurements."}

### Data Completeness: {score}/4 {✓ if 4/4}
{findings with severity and recommendations}

### Synthetic Data & Local Only: {score}/4 {✓ if 4/4}
{findings or "No external data transmission. All storage is local. Demo data is synthetic and labelled."}

### UI Accessibility: {score}/4 {✓ if 4/4}
{findings with severity and recommendations}

### Protocol Adherence: {score}/4 {✓ if 4/4}
{findings with severity and recommendations}

---
This score is about the prototype's quality, not fitness for patient care: Medical Protocol is for learning and prototyping only.
Re-run /medical-protocol:protocol-audit after fixes to see your score improve.
```

## Phase 4: Recommend

For each finding, map to the skill that can fix it:

| Finding Type | Recommendation |
|-------------|---------------|
| Missing component feature | "Run /medical-protocol:modify to add {feature}" |
| Component not built | "Run /medical-protocol:{skill-name} to add {component}" |
| Accessibility issue | "Run /medical-protocol:modify to fix {issue}" |
| Clinical logic error | UI computes its own value → "Run /medical-protocol:modify to use the lib function"; error inside `lib/medprotocol` → report it upstream, never patch locally |

## NEVER
- Report a passing score without actually reading the source code
- Skip any of the 5 dimensions — all must be evaluated
- Use vague findings — always cite specific files and line numbers
- Suggest fixes that require the user to write code
- Mark the data dimension as passing without checking for external network calls
- Describe a passing score as safe or ready for patients
