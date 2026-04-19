# Acid-Base Workflow

## Prerequisites

Silently check for `.clinical-context.md` in the project root.
- **If found:** Read it. Adapt specialty, practice type, patient population, guidelines, and units throughout this workflow.
- **If not found:** Proceed with defaults. After Phase 4, mention once: "Tip: Run /medical-protocol:start-protocol to save your clinical preferences — specialty, units, and guidelines will apply automatically to every tool."

---

## Phase 1: Clinical Requirements

Ask the doctor about their blood gas analysis needs:

- "Will you be entering arterial blood gas values manually, or do you need to import them?" (Default: manual entry)
- "Do you need anion gap and delta ratio calculations?" (Default: yes, if Na and Cl are available)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Do you typically work with acute or chronic respiratory conditions?" (Default: chronic — affects compensation formulas)
- If **multiple patients**: Route to the dashboard workflow instead, offering acid-base as one of the dashboard widgets

Do NOT ask about technical integrations, display preferences, or which formulas to use.

---

## Phase 2: Fetch & Install

Follow the **Component Installation Process** from the main protocol for the `acid-base` component.

---

## Phase 3: Build Page

Create `app/acid-base/page.tsx` importing the AcidBase component.
Wrap in `ErrorBoundary`. Provide an `onData` callback for storing results.
Update `app/page.tsx` with a link to `/acid-base`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your blood gas analyzer is ready. Enter pH, pCO₂, and HCO₃ to get an acid-base interpretation. You can also add Na⁺, Cl⁻, and albumin for anion gap analysis. View it at http://localhost:3000/acid-base"
Ask: "Would you like to adjust anything about the analysis display?"

---

## Related Tools

Based on clinical context, the doctor may also benefit from:
- **/medical-protocol:dka** — If metabolic acidosis with elevated anion gap suggests diabetic ketoacidosis
- **/medical-protocol:sepsis** — If lactic acidosis or sepsis-related gas derangements are suspected
- **/medical-protocol:pafi** — If respiratory component needs PaO2/FiO2 ratio and ARDS classification

Only mention these if the doctor asks "what else can you do?" or if the clinical scenario suggests them.
