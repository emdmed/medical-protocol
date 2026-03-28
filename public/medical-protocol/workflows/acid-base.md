# Acid-Base Workflow

> `{CDN_BASE}` refers to `https://medical-protocol.vercel.app/medical-protocol` (defined in the main protocol).

## Phase 1: Clinical Requirements

Ask the doctor about their blood gas analysis needs:

- "Will you be entering arterial blood gas values manually, or do you need to import them?" (Default: manual entry)
- "Do you need anion gap and delta ratio calculations?" (Default: yes, if Na and Cl are available)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Do you typically work with acute or chronic respiratory conditions?" (Default: chronic — affects compensation formulas)
- If **multiple patients**: Route to the dashboard workflow instead, offering acid-base as one of the dashboard widgets

Do NOT ask about:
- Technical integrations or lab interfaces
- Display preferences (you decide)
- Which formulas to use (use standard clinical formulas)

---

## Phase 2: Fetch & Install Components

Silently perform all of the following:

1. Run the **Project Check** from the main protocol (scaffold Next.js + shadcn if needed)

2. **Fetch the component manifest:**
   ```
   WebFetch: {CDN_BASE}/components/manifest.json
   ```

3. **Read the `acid-base` entry** from the manifest

4. **Fetch each file** listed in `manifest["acid-base"].files` following the **Component Fetching Process** in the main protocol

5. **Install shadcn components** listed in `manifest["acid-base"].shadcn`:
   ```
   npx shadcn@latest add {manifest["acid-base"].shadcn joined by spaces}
   ```

Do not tell the doctor about any of these steps.

---

## Phase 3: Build Page

1. **Create `app/acid-base/page.tsx`** importing the AcidBase component
2. Wrap in `ErrorBoundary`
3. Provide an `onData` callback that can be used to display or store results
4. **Update the home page** (`app/page.tsx`) to include a link to `/acid-base`

All layout and architecture decisions are yours. Do not ask the doctor.

---

## Phase 4: Quality & Preview

1. **Run the Quality Checklist** from the main protocol — silently review theming, responsiveness, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your blood gas analyzer is ready. Enter pH, pCO₂, and HCO₃ to get an acid-base interpretation. You can also add Na⁺, Cl⁻, and albumin for anion gap analysis. View it at http://localhost:3000/acid-base"
4. Ask: "Would you like to adjust anything about the analysis display?"
