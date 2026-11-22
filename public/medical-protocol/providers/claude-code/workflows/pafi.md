# PaFi Calculator Workflow

## Prerequisites

Check for `.clinical-context.md` in the project root.
- **If found:** Read it. Adapt specialty, practice type, patient population, guidelines, and units throughout this workflow.
- **If not found:** Proceed with defaults. After Phase 4, mention once: "Tip: Run /medical-protocol:preferences to save your clinical preferences — specialty, units, and guidelines will apply automatically to every tool."

---

## Phase 1: Clinical Requirements

- "Will you be using this for ARDS classification or general oxygenation monitoring?" (Default: ARDS classification)
- "Do you need FiO2 presets for common oxygen delivery devices?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Are you monitoring patients on mechanical ventilation?" (Default: yes — influences FiO2 range emphasis)
- If **multiple patients**: Route to the dashboard workflow instead, offering PaFi as one of the dashboard widgets

Do NOT ask about ARDS classification thresholds, display preferences, or technical preferences.

---

## Phase 2: Build the Screen

Follow **Building a Screen** from the main protocol (building.md) for the `pafi` module: copy the clinical logic, set up UI SDK, generate `components/medprotocol/pafi/pafi.tsx`.

**Clinical logic:** The PaFi screen imports these from `@/lib/medprotocol/pafi` (copied from the plugin — never reimplement or edit them):
- `calculatePaFi(paO2, fiO2)` — PaO2 / (FiO2 / 100), returns rounded number or null
- `getPaFiClassification(ratio)` — "Normal", "Berlin mild range", "Berlin moderate range", "Berlin severe range"
- `getPaFiSeverity(ratio)` — "normal", "mild", "moderate", "severe" (for badge styling)

---

## Phase 3: Build Page

Create `app/pafi/page.tsx` importing the PaFiCalculator component.
Wrap in `ErrorBoundary`.
Update `app/page.tsx` with a link to `/pafi`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your PaFi calculator is ready. Enter PaO2 and FiO2 values (with quick presets for common oxygen concentrations) to see the PaO2/FiO2 ratio and its Berlin oxygenation range. View it at http://localhost:3000/pafi"
Ask: "Would you like to adjust anything about the calculator?"

---

## Related Tools

Based on clinical context, the doctor may also benefit from:
- **/medical-protocol:acid-base** — Full arterial blood gas analysis beyond PaO2/FiO2 ratio
- **/medical-protocol:sepsis** — ARDS frequently co-occurs with sepsis; qSOFA and SOFA scoring
- **/medical-protocol:vitals** — Respiratory rate and SpO2 monitoring alongside oxygenation indices

Only mention these if the doctor asks "what else can you do?" or if the clinical scenario suggests them.
