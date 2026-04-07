---
name: protocol-audit
description: Audit your clinical project for safety, completeness, privacy, accessibility, and protocol adherence
allowed-tools: Read, Grep, Glob, Bash
user-invocable: true
---

Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/core.md
Read when needed: ${CLAUDE_PLUGIN_ROOT}/skills/protocol-audit/reference/scoring-criteria.md

## Purpose

Score a built project against clinical compliance criteria, produce a structured report with severity ratings, and recommend fixes.

## Phase 1: Scan

Silently scan the project for installed components:

1. Check for `components/` directory — list all component subdirectories found
2. Check for clinical context file (`.clinical-context.md`)
3. Check for `app/` routes that correspond to components
4. Build a component inventory: which components are installed, which routes exist

If no components are found, tell the doctor: "I don't see any clinical components installed yet. Run /start to build your first component, then come back for an audit."

## Phase 2: Score

Evaluate 5 dimensions (0–4 points each, total /20). Read the scoring criteria reference file for detailed rubrics.

| Dimension | What to Check |
|-----------|--------------|
| **Clinical Safety** | Critical value alerts present, validation rejects dangerous input, units always shown |
| **Data Completeness** | All required fields present, no orphan calculations (e.g., AG without Na/Cl) |
| **Privacy Compliance** | No external API calls, no analytics, data stays local, no realistic fake patient data |
| **UI Accessibility** | Labels on all inputs, color not sole indicator, keyboard navigable, aria attributes |
| **Protocol Adherence** | Component matches clinical guidelines (e.g., DKA resolution uses all 3 criteria) |

### How to Score

For each installed component:
1. Read the component source files
2. Check against the scoring criteria
3. Note specific findings with severity levels
4. Calculate dimension scores

### Severity Levels

| Level | Meaning |
|-------|---------|
| **P0** | Patient safety risk — must fix immediately |
| **P1** | Clinical accuracy issue — fix before use |
| **P2** | Usability problem — fix when possible |
| **P3** | Polish/enhancement — nice to have |

## Phase 3: Report

Output a structured report in clinical language:

```
## Protocol Audit — Score: {total}/20

### Clinical Safety: {score}/4 {✓ if 4/4}
{findings or "All critical value alerts working. Units displayed on all measurements."}

### Data Completeness: {score}/4 {✓ if 4/4}
{findings with severity and recommendations}

### Privacy Compliance: {score}/4 {✓ if 4/4}
{findings or "No external data transmission. All storage is local."}

### UI Accessibility: {score}/4 {✓ if 4/4}
{findings with severity and recommendations}

### Protocol Adherence: {score}/4 {✓ if 4/4}
{findings with severity and recommendations}

---
Re-run /protocol-audit after fixes to see your score improve.
```

## Phase 4: Recommend

For each finding, map to the skill that can fix it:

| Finding Type | Recommendation |
|-------------|---------------|
| Missing component feature | "Run /customize to add {feature}" |
| Component not installed | "Run /{skill-name} to add {component}" |
| Accessibility issue | "Run /customize to fix {issue}" |
| Clinical logic error | "Update {component} {specific file}" |

## NEVER
- Report a passing score without actually reading the source code
- Skip any of the 5 dimensions — all must be evaluated
- Use vague findings — always cite specific files and line numbers
- Suggest fixes that require the doctor to write code
- Mark privacy as passing without checking for external network calls
