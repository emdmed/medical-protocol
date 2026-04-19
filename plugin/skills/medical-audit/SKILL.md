---
name: medical-audit
description: Scan installed components for calculation logic and test them against the canonical library via CLI and browser
allowed-tools: Read, Grep, Glob, Bash
user-invocable: true
---

Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/core.md
Read when needed: ${CLAUDE_PLUGIN_ROOT}/skills/medical-audit/reference/test-vectors.md

## Purpose

Discover which clinical components are installed in the doctor's project, validate their calculation logic against the canonical medprotocol CLI, and optionally verify the UI renders matching results via agent-browser.

## Phase 1: Discover

Scan the project for installed components:

1. Check for `components/` directory — list all component subdirectories found
2. Check for `app/` routes that correspond to components
3. For each found component, grep the source for calculation function calls (e.g., `calculateBMI`, `analyzeABG`, `calculatePaFi`, `calculateTotalSOFA`, `calculateQSOFA`, `calculateEGFR`, `analyzeDKA`, `calculateWaterBalance`) to confirm which lib functions are in use
4. Build a component inventory mapping each installed module to its calculation functions

If no components are found, tell the doctor: "I don't see any clinical components installed yet. Run /medical-protocol:start to build your first component, then come back to test."

## Phase 2: CLI Validation

1. Build the medprotocol CLI: `npm run build -w packages/medprotocol`
2. Read the test vectors reference file for canonical inputs and expected outputs
3. For each discovered component, run the matching `npx medprotocol <cmd> --json` command with the reference inputs from test-vectors.md
4. Parse the JSON output and verify:
   - All expected fields are present
   - Values fall within the expected ranges documented in test-vectors.md
5. Record pass/fail per module with specific findings

If a CLI command fails, note the error and continue with remaining modules.

## Phase 3: Browser Validation

Skip this phase if agent-browser is not available or no dev server is running.

1. Confirm the dev server is accessible (check for `localhost:3000` or the configured port)
2. For each discovered component:
   - Navigate to the component's route
   - Enter the same reference inputs used in Phase 2
   - Take a snapshot of the rendered results
   - Compare displayed values against the CLI output from Phase 2
3. Flag any mismatches where the UI shows different values than the canonical library

If agent-browser is not available, note: "Browser validation skipped — agent-browser not available. CLI validation covers calculation correctness."

## Phase 4: Report

### Scoring Rubric

Score each component on 4 dimensions (0–4 each, total /16):

| Score | Meaning |
|-------|---------|
| 4 | Excellent — no issues found |
| 3 | Good — minor issues, clinically safe |
| 2 | Fair — some issues that should be fixed |
| 1 | Poor — significant issues affecting reliability |
| 0 | Failing — critical errors or missing entirely |

| Dimension | What to Check |
|-----------|--------------|
| **Calculation Accuracy** | All lib functions produce correct results for test vectors |
| **Input Validation** | Rejects out-of-range values, handles edge cases (zero, negative, missing) |
| **Unit Consistency** | Functions use and return correct units, conversions match canonical lib |
| **Coverage** | All expected lib functions are imported and used by the component |

### Report Format

Output a structured report:

```
## Component Test Report

### {Component Name}: {PASS | FAIL} — Score: {n}/16

| Dimension | Score | Notes |
|-----------|-------|-------|
| Calculation Accuracy | {0-4} | {findings} |
| Input Validation | {0-4} | {findings} |
| Unit Consistency | {0-4} | {findings} |
| Coverage | {0-4} | {findings} |

**CLI Validation:** {pass/fail}
{per-field results or "All calculations match canonical library"}

**Browser Validation:** {pass/fail/skipped}
{per-field comparison or "Skipped — agent-browser not available"}

{If FAIL: specific mismatch details and recommended fix}

---
### Summary: {passed}/{total} components passing — Overall: {sum}/{ total×16}

{If any component scores ≤8: "⚠ Component {name} needs attention — score below 50%."}
{If any failures: "Run /medical-protocol:customize to update {component} calculation logic."}
Re-run /medical-protocol:medical-audit after fixes to verify.
```

## NEVER
- Show raw CLI output or test commands to the doctor
- Skip Phase 2 — CLI validation is always possible even without agent-browser
- Report passing without actually running the checks
- Modify component code — only report findings and recommend fixes
- Use vague findings — always cite specific values and expected vs actual
