# Dashboard Workflow

> `{CDN_BASE}` refers to `https://medical-protocol.vercel.app/medical-protocol` (defined in the main protocol).

## Phase 1: Clinical Requirements

The doctor wants a combined clinical dashboard. Ask:

- "Which of these would you like on your dashboard?"
  - Vital signs monitoring
  - Patient records (EHR)
  - Blood gas / acid-base analyzer
  - BMI calculator
  - Fluid balance (water balance / I&O)
  - Pulse oximetry (real-time telemonitoring)
  - Clinical timeline (hospitalization course)
  - All core tools (vital signs + EHR) (Default)

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

3. **For each component the doctor selected**, follow the **Component Fetching Process** in the main protocol. All of the following are available in the manifest:

   - `vital-signs` → `{project}/components/vital-signs/`
   - `ehr` → `{project}/app/ehr/`
   - `acid-base` → `{project}/components/acid-base/`
   - `bmi` → `{project}/components/bmi/`
   - `water-balance` → `{project}/components/water-balance/`
   - `telemonitoring` → `{project}/components/telemonitoring/`
   - `timeline` → `{project}/components/timeline/`

   For each selected component, fetch its files from:
   ```
   For each file in manifest["{component}"].files:
     WebFetch: {CDN_BASE}/components/{component}/{file}
     Write to: {project}/{manifest["{component}"].target}/{file}
   ```

4. **Check `externalComponents`** for each manifest entry — some external imports may now be available as their own manifest entries (e.g., water-balance, acid-base, bmi). Fetch those from the CDN. For any remaining external imports not on the CDN, create simplified versions, remove them, or replace as appropriate.

5. **Install all shadcn components** from the selected manifests (deduplicated):
   ```
   npx shadcn@latest add {combined unique shadcn list from manifest entries}
   ```

6. **Fetch the composition guide** for integration patterns:
   ```
   WebFetch: {CDN_BASE}/components/COMPOSITION.md
   ```
   This contains typed examples for wiring components together and known gotchas (overflow clipping, circular updates, null guards).

Do not tell the doctor about any of these steps.

---

## Phase 3: Build Page

Create a dashboard page that combines the selected components:

1. **Create `app/dashboard/page.tsx`** with a layout that includes:
   - A header with the clinic/dashboard name
   - Selected components arranged in a responsive grid
   - Wrap the entire page in `ErrorBoundary` from `@/components/vital-signs/components/error-boundary`

2. **Example layout** (adapt based on selected components):
   ```tsx
   import VitalSigns from "@/components/vital-signs/vital-signs"
   import MedicalRecordsApp from "@/app/ehr/ehr"
   import AcidBase from "@/components/acid-base/acid-base"
   import BMICalculator from "@/components/bmi/bmi-calculator"
   import WaterBalance from "@/components/water-balance/water-balance"
   import Timeline from "@/components/timeline/timeline"
   import { ErrorBoundary } from "@/components/vital-signs/components/error-boundary"

   export default function DashboardPage() {
     return (
       <ErrorBoundary>
         <main className="min-h-screen bg-background p-6">
           <h1 className="text-2xl font-bold mb-6">Clinical Dashboard</h1>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Include only the components the doctor selected */}
             <section><VitalSigns /></section>
             <section><MedicalRecordsApp /></section>
           </div>
         </main>
       </ErrorBoundary>
     )
   }
   ```

   > **Note:** The EHR component (`MedicalRecordsApp`) includes its own sidebar and layout. When embedding it in a dashboard, you may need to adapt its wrapper to fit within the grid — for example, removing `h-screen` from its root div and adjusting padding. Use the fetched source as a guide.
   > **Note:** Smaller widgets (acid-base, BMI, water-balance) work well grouped together in a single grid cell or a flex row. The timeline works best as a full-width section or sidebar.

3. **Update the home page** to redirect to `/dashboard`

All layout decisions are yours. Optimize for clinical usability.

---

## Phase 4: Quality & Preview

1. **Run the Quality Checklist** from the main protocol — silently review theming, responsiveness, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your clinical dashboard is ready with [list selected components]. You can view it at http://localhost:3000/dashboard"
4. Ask: "Would you like to rearrange anything on the dashboard, or add any other clinical information?"
