# Dashboard Workflow

> `{CDN_BASE}` refers to `https://medical-protocol.vercel.app/medical-protocol` (defined in the main protocol).

## Phase 1: Clinical Requirements

The doctor wants a combined clinical dashboard. Ask:

- "Which of these would you like on your dashboard?"
  - Vital signs monitoring
  - Patient records (EHR)
  - Both (Default)

- "Is this for a single patient view or a clinic overview?" (Default: single patient)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: Ask "Do you want the dashboard to highlight patients with abnormal readings?" (Default: yes)
- If **multiple patients**: Ask "Should the dashboard show all patients at once, or one patient with a list to navigate?" (Default: one patient with a list)

Do NOT ask about:
- Layout arrangement (you decide — typically vitals on one side, records on the other)
- Navigation structure (you decide)
- Technical preferences

---

## Phase 2: Fetch & Install Components

Silently perform all of the following:

1. Run the **Project Check** from the main protocol (scaffold Next.js + shadcn if needed)

2. **Fetch the component manifest:**
   ```
   WebFetch: {CDN_BASE}/components/manifest.json
   ```

3. **For each component the doctor selected** (default: both vital-signs and ehr), follow the **Component Fetching Process** in the main protocol:

   a. **Fetch vital-signs files** (if selected):
   ```
   For each file in manifest["vital-signs"].files:
     WebFetch: {CDN_BASE}/components/vital-signs/{file}
     Write to: {project}/components/vital-signs/{file}
   ```

   b. **Fetch EHR files** (if selected):
   ```
   For each file in manifest["ehr"].files:
     WebFetch: {CDN_BASE}/components/ehr/{file}
     Write to: {project}/app/ehr/{file}
   ```

4. **Check `externalComponents`** for each manifest entry — handle missing imports by creating, removing, or replacing them as appropriate.

5. **Install all shadcn components** from the selected manifests (deduplicated):
   ```
   npx shadcn@latest add {combined unique shadcn list from manifest entries}
   ```

Do not tell the doctor about any of these steps.

---

## Phase 3: Build Page

Create a dashboard page that combines the selected components:

1. **Create `app/dashboard/page.tsx`** with a layout that includes:
   - A header with the clinic/dashboard name
   - Vital signs section (if selected)
   - Quick-access patient records link or embedded view (if selected)

2. **Example layout** (adapt as needed):
   ```tsx
   import VitalSigns from "@/components/vital-signs/vital-signs"
   import MedicalRecordsApp from "@/app/ehr/ehr"

   export default function DashboardPage() {
     return (
       <main className="min-h-screen bg-background p-6">
         <h1 className="text-2xl font-bold mb-6">Clinical Dashboard</h1>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <section>
             <VitalSigns />
           </section>
           <section>
             <MedicalRecordsApp />
           </section>
         </div>
       </main>
     )
   }
   ```

   > **Note:** The EHR component (`MedicalRecordsApp`) includes its own sidebar and layout. When embedding it in a dashboard, you may need to adapt its wrapper to fit within the grid — for example, removing `h-screen` from its root div and adjusting padding. Use the fetched source as a guide.

3. **Update the home page** to redirect to `/dashboard`

All layout decisions are yours. Optimize for clinical usability.

---

## Phase 4: Quality & Preview

1. **Run the Quality Checklist** from the main protocol — silently review theming, responsiveness, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your clinical dashboard is ready with [list selected components]. You can view it at http://localhost:3000/dashboard"
4. Ask: "Would you like to rearrange anything on the dashboard, or add any other clinical information?"
