# Hepatology Workflow

## Prerequisites

Check for `.clinical-context.md` in the project root.
- **If found:** Read it. Adapt level, specialty, case population, guidelines, and units throughout this workflow.
- **If not found:** Proceed with defaults. After Phase 4, mention once: "Tip: Run /medical-protocol:preferences to save your clinical preferences — specialty, units, and guidelines will apply automatically to every tool."

---

## Phase 1: Clinical Requirements

- "Do you have liver stiffness (LSM) or ELF results to enter, or only FIB-4 labs (age, AST, ALT, platelets)?" (Default: FIB-4 only, with LSM and ELF as optional fields)

### Setting-Aware Questions (based on Initial Clarification)

- If **multiple patients**: Route to the dashboard workflow instead, offering hepatology as one of the dashboard widgets
- If **persistence enabled**: Store assessments in localStorage

Do NOT ask about scoring formula details, display preferences, or technical preferences.

---

## Phase 2: Build the Screen

Follow **Building a Screen** from the main protocol (building.md) for the `hepatology` module: copy the clinical logic, set up UI SDK, generate `components/medprotocol/hepatology/hepatology.tsx`.

**Patient demographics:** This component uses age. Ask: "Would you like a Patient demographics card above the MASLD screening?" (Default: yes). If yes, build the `patient` screen first (`components/medprotocol/patient/`). Wire patient age into the hepatology screen following the patient data wiring pattern in the composition context.

---

## Phase 3: Build Page

Create `app/hepatology/page.tsx` importing the hepatology component.
Wrap in `ErrorBoundary`.
Update `app/page.tsx` with a link to `/hepatology`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the user: "Your MASLD screening is ready. Enter age, AST, ALT and platelets for FIB-4; add LSM or ELF when FIB-4 is indeterminate. View it at http://localhost:3000/hepatology"
Ask: "Would you like to adjust anything?"

---

## Related Tools

Based on clinical context, the user may also benefit from:
- **/medical-protocol:bmi** — Obesity is a MASLD risk factor
- **Ask for a diabetes diagnosis screen** — Type 2 diabetes and prediabetes are MASLD risk factors
- **Ask for a cardiovascular risk calculator** — Cardiovascular disease is the main cause of death in MASLD

Only mention these if the user asks "what else can you do?" or if the clinical scenario suggests them.
