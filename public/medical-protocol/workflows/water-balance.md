# Water Balance Workflow

> `{CDN_BASE}` refers to `https://medical-protocol.vercel.app/medical-protocol` (defined in the main protocol).

## Phase 1: Clinical Requirements

Ask the doctor about their fluid balance tracking needs:

- "Do you need to track oral and IV intake separately?" (Default: yes)
- "Do you need insensible loss calculations based on patient weight?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Do you need to track fluid balance per shift or per 24 hours?" (Default: per 24 hours)
- If **multiple patients**: Route to the dashboard workflow instead, offering water balance as one of the dashboard widgets

Do NOT ask about:
- Calculation formulas (use standard clinical values: 12 mL/kg insensible loss, 4.5 mL/kg endogenous water, 120 mL per stool)
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

3. **Read the `water-balance` entry** from the manifest

4. **Fetch each file** listed in `manifest["water-balance"].files` following the **Component Fetching Process** in the main protocol

5. **Install shadcn components** listed in `manifest["water-balance"].shadcn`:
   ```
   npx shadcn@latest add {manifest["water-balance"].shadcn joined by spaces}
   ```

Do not tell the doctor about any of these steps.

---

## Phase 3: Build Page

1. **Create `app/water-balance/page.tsx`** importing the WaterBalanceCalculator component
2. Wrap in `ErrorBoundary`
3. **Update the home page** (`app/page.tsx`) to include a link to `/water-balance`

All layout and architecture decisions are yours. Do not ask the doctor.

---

## Phase 4: Quality & Preview

1. **Run the Quality Checklist** from the main protocol — silently review theming, responsiveness, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your fluid balance tracker is ready. Enter the patient's weight, fluid intake (oral and IV), urine output, and stool count — it calculates the net balance including insensible losses. View it at http://localhost:3000/water-balance"
4. Ask: "Would you like to adjust how the fluid balance is tracked?"
