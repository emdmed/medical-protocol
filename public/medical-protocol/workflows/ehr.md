# EHR Workflow

## Phase 1: Clinical Requirements

Ask the doctor about their patient record needs:

- "What patient information do you need to see at a glance?" (Default: name, age, sex, blood type, allergies, conditions)
- "Do you need to write and review clinical notes/evolutions?" (Default: yes)
- "Do you need to search through previous clinical notes?" (Default: yes)
- "Do you need a reference section for clinical guidelines or drug references?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **multiple patients**: Ask "Do you need a patient list to switch between records, or will you search by name?" (Default: patient list)
- If **persistence enabled**: Ask "Should records be organized by visit date?" (Default: yes)

Do NOT ask about:
- Database setup (use local demo data for MVP)
- Authentication (not in MVP scope)
- Layout or design preferences (you decide)
- Technical integrations

---

## Phase 2: Fetch & Install Components

Silently perform all of the following:

1. Run the **Project Check** from the main protocol (scaffold Next.js + shadcn if needed)

2. **Fetch the component manifest:**
   ```
   WebFetch: {CDN_BASE}/components/manifest.json
   ```

3. **Read the `ehr` entry** from the manifest

4. **Fetch each file** listed in `manifest["ehr"].files`:
   ```
   For each file in files:
     WebFetch: {CDN_BASE}/components/ehr/{file}
     Write to: {project}/app/ehr/{file}
   ```

5. **Install shadcn components** from `manifest["ehr"].shadcn`:
   ```
   npx shadcn@latest add card button input textarea select tabs separator scroll-area sheet sidebar skeleton
   ```

6. **Install additional dependencies** if needed:
   ```
   npm install lucide-react
   ```

Do not tell the doctor about any of these steps.

---

## Phase 3: Build Page

The EHR component includes its own `page.tsx`, so the page is already built after fetching.

1. **Verify** that `app/ehr/page.tsx` exists and correctly imports the EHR component
2. **Check imports** — ensure all relative imports within the EHR files resolve correctly at their new location
3. **Fix any import paths** if the source files used aliases that differ from the current project setup
4. **Update the home page** (`app/page.tsx`) to include a link or redirect to `/ehr`

All layout and architecture decisions are yours. Do not ask the doctor.

---

## Phase 4: Preview

1. Run `npm run dev` in the background
2. Tell the doctor:
   > "Your electronic health records system is ready. It includes patient details, clinical notes, previous evolutions, and a reference section. You can view it at http://localhost:3000/ehr"
3. Ask: "Would you like to adjust what patient information is shown, or change how the clinical notes work?"
