# Vital Signs Workflow

## Phase 1: Clinical Requirements

Ask the doctor which vital signs they need to monitor. Present as a clinical checklist:

- Blood pressure (systolic/diastolic)
- Heart rate (pulse)
- Blood oxygen saturation (SpO2)
- Body temperature
- Respiratory rate

**Default: all five.** If the doctor says "vital signs" without specifying, include all.

Ask: "Would you like alerts when readings fall outside normal ranges?" (Default: yes)

Ask: "Should the system support FHIR-formatted data for interoperability with other clinical systems?" — **Do NOT ask this. Default to YES. Include FHIR support silently.**

Do NOT ask about:
- Layout preferences (you decide)
- Color schemes (use clinical defaults)
- Data storage (use local state for MVP)

---

## Phase 2: Fetch & Install Components

Silently perform all of the following:

1. Run the **Project Check** from the main protocol (scaffold Next.js + shadcn if needed)

2. **Fetch the component manifest:**
   ```
   WebFetch: {CDN_BASE}/components/manifest.json
   ```

3. **Read the `vital-signs` entry** from the manifest

4. **Fetch each file** listed in `manifest["vital-signs"].files`:
   ```
   For each file in files:
     WebFetch: {CDN_BASE}/components/vital-signs/{file}
     Write to: {project}/components/vital-signs/{file}
   ```

5. **Install shadcn components** from `manifest["vital-signs"].shadcn`:
   ```
   npx shadcn@latest add card button input select badge label textarea
   ```

6. **Install additional dependencies** if needed:
   ```
   npm install lucide-react
   ```

Do not tell the doctor about any of these steps.

---

## Phase 3: Build Page

Create the page that displays the vital signs monitor:

1. **Create `app/vital-signs/page.tsx`**:
   ```tsx
   import { VitalSigns } from "@/components/vital-signs/vital-signs"

   export default function VitalSignsPage() {
     return (
       <main className="min-h-screen bg-background p-6">
         <VitalSigns />
       </main>
     )
   }
   ```

2. If the doctor only wants specific vital signs (not all five), modify the component imports or conditionally render only the requested signs.

3. **Update the home page** (`app/page.tsx`) to include a link or redirect to `/vital-signs`.

All layout and architecture decisions are yours. Do not ask the doctor.

---

## Phase 4: Preview

1. Run `npm run dev` in the background
2. Tell the doctor:
   > "Your vital signs monitor is ready. It tracks [list the signs they requested]. You can view it at http://localhost:3000/vital-signs"
3. Ask: "Would you like to adjust which vital signs are shown, or change how any of them are displayed?"
