# Cardiology Workflow

## Phase 1: Clinical Requirements

- "Which cardiac risk calculators do you need?" (Options: ASCVD 10-year risk, HEART Score for chest pain, CHA₂DS₂-VASc for AF stroke risk, or all three)

### Setting-Aware Questions (based on Initial Clarification)

- If **multiple patients**: Route to the dashboard workflow instead, offering cardiology as one of the dashboard widgets
- If **persistence enabled**: Store last-entered values in localStorage

Do NOT ask about scoring formula details, display preferences, or technical preferences.

---

## Phase 2: Fetch & Install

Follow the **Component Fetching Process** from the main protocol for the `cardiology` component.

---

## Phase 3: Build Page

Create `app/cardiology/page.tsx` importing the CardiologyCalculator component.
Wrap in `ErrorBoundary`.
Update `app/page.tsx` with a link to `/cardiology`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your cardiology risk calculators are ready. Use the tabs to switch between ASCVD (10-year cardiovascular risk), HEART Score (chest pain triage), and CHA₂DS₂-VASc (AF stroke risk). View it at http://localhost:3000/cardiology"
Ask: "Would you like to adjust anything?"
