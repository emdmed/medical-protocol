# Dashboard Workflow

## Phase 1: Clinical Requirements

Present the available building blocks by category and ask which they'd like:

- "Which of these blocks would you like on your dashboard?"

  **Monitoring** — Vital signs (BP, HR, RR, Temp, SpO2)

  **Calculators** — Blood gas / acid-base analyzer · BMI calculator · Fluid balance (water balance / I&O) · PaFi calculator (PaO2/FiO2 ratio with ARDS classification)

  **Critical Care** — DKA monitoring (hourly glucose, ketones, potassium, insulin, GCS tracking)

  **Documentation** — Clinical notes (encounter note editor)

  Default: vital signs + clinical notes

- "Is this for a single patient view or a clinic overview?" (Default: single patient)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Do you want the dashboard to highlight patients with abnormal readings?" (Default: yes)

Do NOT ask about layout arrangement, navigation structure, or technical preferences.

---

## Phase 2: Fetch & Install

For each block the doctor selected, follow the **Component Installation Process** from the main protocol. Install each component with `npx medical-ui-cli add <component>`. Available components: `vital-signs`, `clinical-notes`, `acid-base`, `bmi`, `water-balance`, `pafi`, `dka`.

Check if any installed component has dependencies on other components — if so, install those too with `npx medical-ui-cli add`.

Fetch `{CDN_BASE}/components/COMPOSITION.md` for integration patterns and known gotchas (overflow clipping, circular updates, null guards).

Install all shadcn components from the selected manifests (deduplicated).

---

## Phase 3: Build Page

Create `app/dashboard/page.tsx` with:
- A header with the clinic/dashboard name
- Selected blocks arranged in a responsive grid (`grid-cols-1 lg:grid-cols-2 gap-6`)
- Wrap the entire page in `ErrorBoundary`

Layout guidance:
- Smaller widgets (acid-base, BMI, water-balance) work well grouped together
- Timeline works best as a full-width section or sidebar

Update the home page to redirect to `/dashboard`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your clinical dashboard is ready with [list selected blocks]. View it at http://localhost:3000/dashboard"
Ask: "Would you like to rearrange anything on the dashboard, or add any other clinical tools?"
