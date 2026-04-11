# PaFi Calculator Workflow

## Phase 1: Clinical Requirements

- "Will you be using this for ARDS classification or general oxygenation monitoring?" (Default: ARDS classification)
- "Do you need FiO2 presets for common oxygen delivery devices?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Are you monitoring patients on mechanical ventilation?" (Default: yes — influences FiO2 range emphasis)
- If **multiple patients**: Route to the dashboard workflow instead, offering PaFi as one of the dashboard widgets

Do NOT ask about ARDS classification thresholds, display preferences, or technical preferences.

---

## Phase 2: Fetch & Install

Follow the **Component Installation Process** from the main protocol for the `pafi` component.

**Clinical logic library:** The PaFi component imports calculation functions from `lib/pafi`. Create in the project:
- `calculatePaFi(paO2, fiO2)` — PaO2 / (FiO2 / 100), returns rounded number or null
- `getPaFiClassification(ratio)` — "Normal", "Mild ARDS", "Moderate ARDS", "Severe ARDS"
- `getPaFiSeverity(ratio)` — "normal", "mild", "moderate", "severe" (for badge styling)

---

## Phase 3: Build Page

Create `app/pafi/page.tsx` importing the PaFiCalculator component.
Wrap in `ErrorBoundary`.
Update `app/page.tsx` with a link to `/pafi`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your PaFi calculator is ready. Enter PaO2 and FiO2 values (with quick presets for common oxygen concentrations) to see the PaO2/FiO2 ratio and ARDS classification. View it at http://localhost:3000/pafi"
Ask: "Would you like to adjust anything about the calculator?"
