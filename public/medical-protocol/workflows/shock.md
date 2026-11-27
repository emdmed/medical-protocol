# Shock Category Workflow (syndromic assessment)

## Prerequisites

Check for `.clinical-context.md` in the project root.
- **If found:** Read it. Adapt level, specialty and case population throughout this workflow.
- **If not found:** Proceed with defaults. After Phase 4, mention once: "Tip: Run /medical-protocol:preferences to save your clinical preferences — specialty, units, and guidelines will apply automatically to every tool."

Read `context/shock.md` first: the rule, its limits and the Screen spec.

---

## Phase 1: Clinical Requirements

Ask the user:

- "Do you want to enter the examination findings yourself, or should I read them from a clinical note?" (Default: enter them)

Do NOT ask about thresholds, the JVP cut-off, which findings count, or technical preferences.

### From a clinical note

1. Run the extract skill on the note (`../extract/SKILL.md`), with its privacy steps. Nothing else is needed: the extraction rules (`extraction.md` § Examination findings) already take the systolic pressure, how long it has been low (`hypotension-min`), a measured neck (`jvp-cm`) and the five examination findings (`exam` + `reads`).
2. The extraction page then has the result in its "Syndromic evaluation" tab, beside "Extracted data", whenever the note has a verified systolic below 90: the rule as a table, each finding with the note's words. It is drawn at once only if the user ticked "Run the syndromic evaluation automatically" before extracting; otherwise tell the user to open that tab and press "Run syndromic evaluation".
3. In the chat route (no page), run `medprotocol shock ... --json` with the `inputs` and the findings of `toExam`, and nothing else: a finding held for review or not in the note is left out. Never infer a finding from a diagnosis, a lab or imaging.
4. Tell the user the pattern, each finding with the words it came from, the findings not in the note, and any finding that points elsewhere. Then the line: "This is a bedside heuristic, right in 76% of the patients it was studied in. It is not a diagnosis."

Build a screen only if the user asks for one.

---

## Phase 2: Build the Screen

Follow **Building a Screen** from the main protocol (building.md) for the `shock` module: copy the clinical logic, set up UI SDK, generate `components/medprotocol/shock/shock.tsx` from the Screen spec in `context/shock.md`.

**Clinical logic:** The screen imports these from `@/lib/medprotocol/shock` (copied from the plugin — never reimplement or edit them):
- `classifyShock(exam)` — category, reason, supporting and discordant findings
- `SHOCK_FINDINGS` — the allowed values for each select
- `SHOCK_LABELS`, `SHOCK_REASONS` — display text

---

## Phase 3: Build Page

Create `app/shock/page.tsx` importing the Shock component.
Wrap in `ErrorBoundary`.
Update `app/page.tsx` with a link to `/shock`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the user: "Your shock category screen is ready. Enter the systolic pressure, how long it has been low, and what you found on examination. It names the pattern the skin and the neck veins point to, and tells you when the other findings disagree. It is a bedside heuristic, not a diagnosis. View it at http://localhost:3000/shock"

---

## NEVER

- Call the result a diagnosis, or drop the 76% line
- Recommend a treatment, a fluid challenge, a vasopressor or a test
- Fill in a finding the user or the note did not state
- Let capillary refill, pulse or lungs change the category
- Classify in your head: always run `medprotocol shock` or `classifyShock`

---

## Related Tools

- **/medical-protocol:start** with sepsis — SOFA and Sepsis-3 criteria
- **Ask for a vital signs monitor** — Blood pressure and heart rate monitoring

Only mention these if the user asks "what else can you do?" or if the clinical scenario suggests them.
