# PaFi Calculator Workflow

> `{CDN_BASE}` refers to `https://medical-protocol.vercel.app/medical-protocol` (defined in the main protocol).

## Phase 1: Clinical Requirements

Ask the doctor about their oxygenation assessment needs:

- "Will you be using this for ARDS classification or general oxygenation monitoring?" (Default: ARDS classification)
- "Do you need FiO2 presets for common oxygen delivery devices?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Are you monitoring patients on mechanical ventilation?" (Default: yes — influences FiO2 range emphasis)
- If **multiple patients**: Route to the dashboard workflow instead, offering PaFi as one of the dashboard widgets

Do NOT ask about:
- ARDS classification thresholds (use Berlin criteria: mild >200, moderate 100–200, severe <100)
- Display preferences (you decide)
- Technical preferences

---

## Phase 2: Fetch & Install Components

Silently perform all of the following:

1. Run the **Project Check** from the main protocol (scaffold Next.js + shadcn if needed)

2. **Fetch the component manifest:**
   ```
   WebFetch: {CDN_BASE}/components/manifest.json
   ```

3. **Read the `pafi` entry** from the manifest

4. **Fetch each file** listed in `manifest["pafi"].files` following the **Component Fetching Process** in the main protocol

5. **Install shadcn components** listed in `manifest["pafi"].shadcn`:
   ```
   npx shadcn@latest add {manifest["pafi"].shadcn joined by spaces}
   ```

6. **Clinical logic library:** The PaFi component imports calculation functions from `lib/pafi`. These must be created in the project:
   - `calculatePaFi(paO2, fiO2)` — PaO2 / (FiO2 / 100), returns rounded number or null
   - `getPaFiClassification(ratio)` — "Normal", "Mild ARDS", "Moderate ARDS", "Severe ARDS"
   - `getPaFiSeverity(ratio)` — "normal", "mild", "moderate", "severe" (for badge styling)

Do not tell the doctor about any of these steps.

---

## Phase 3: Build Page

1. **Create `app/pafi/page.tsx`** importing the PaFiCalculator component
2. Wrap in `ErrorBoundary`
3. **Update the home page** (`app/page.tsx`) to include a link to `/pafi`

All layout and architecture decisions are yours. Do not ask the doctor.

---

## Phase 4: Quality & Preview

1. **Run the Quality Checklist** from the main protocol — silently review theming, responsiveness, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your PaFi calculator is ready. Enter PaO2 and FiO2 values (with quick presets for common oxygen concentrations) to see the PaO2/FiO2 ratio and ARDS classification. View it at http://localhost:3000/pafi"
4. Ask: "Would you like to adjust anything about the calculator?"
