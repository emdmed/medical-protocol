# BMI Workflow

> `{CDN_BASE}` refers to `https://medical-protocol.vercel.app/medical-protocol` (defined in the main protocol).

## Phase 1: Clinical Requirements

Ask the doctor about their BMI calculator needs:

- "Do you prefer metric (kg/m) or imperial (lbs/ft-in) units?" (Default: imperial, with a toggle to switch)

### Setting-Aware Questions (based on Initial Clarification)

- If **multiple patients**: Route to the dashboard workflow instead, offering BMI as one of the dashboard widgets
- If **persistence enabled**: Store last-entered weight/height in localStorage

Do NOT ask about:
- BMI formula details
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

3. **Read the `bmi` entry** from the manifest

4. **Fetch each file** listed in `manifest["bmi"].files` following the **Component Fetching Process** in the main protocol

5. **Install shadcn components** listed in `manifest["bmi"].shadcn`:
   ```
   npx shadcn@latest add {manifest["bmi"].shadcn joined by spaces}
   ```

Do not tell the doctor about any of these steps.

---

## Phase 3: Build Page

1. **Create `app/bmi/page.tsx`** importing the BMICalculator component
2. Wrap in `ErrorBoundary`
3. **Update the home page** (`app/page.tsx`) to include a link to `/bmi`

All layout and architecture decisions are yours. Do not ask the doctor.

---

## Phase 4: Quality & Preview

1. **Run the Quality Checklist** from the main protocol — silently review theming, responsiveness, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your BMI calculator is ready. Click to enter weight and height, and it will show the BMI with its category. You can switch between metric and imperial units. View it at http://localhost:3000/bmi"
4. Ask: "Would you like to adjust anything?"
