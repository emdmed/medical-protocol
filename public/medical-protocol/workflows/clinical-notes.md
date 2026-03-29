# Clinical Notes Workflow

> `{CDN_BASE}` refers to `https://medical-protocol.vercel.app/medical-protocol` (defined in the main protocol).

## Phase 1: Clinical Requirements

Ask the doctor about their encounter note needs:

- "What patient information do you need at the top of each note?" (Default: name, age, date)
- "Do you need to review previous notes/evolutions?" (Default: yes)
- "Do you need a reference section for clinical guidelines or drug references?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **persistence enabled**: Ask "Should notes be organized by visit date?" (Default: yes)

Do NOT ask about:
- Database setup (use localStorage for MVP)
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

3. **Read the `clinical-notes` entry** from the manifest

4. **Fetch each file** listed in `manifest["clinical-notes"].files` following the **Component Fetching Process** in the main protocol

5. **Check `externalComponents`** in the manifest entry — some of these are now available as their own manifest entries on the CDN (water-balance, acid-base, bmi). Fetch those using the Component Fetching Process. For any remaining external imports that are not on the CDN (e.g., textarea-inv), create simplified versions, remove them, or replace with alternatives appropriate to the doctor's needs.

6. **Install shadcn components** listed in `manifest["clinical-notes"].shadcn`:
   ```
   npx shadcn@latest add {manifest["clinical-notes"].shadcn joined by spaces}
   ```

Do not tell the doctor about any of these steps.

---

## Phase 3: Build Page

The clinical-notes component includes its own `page.tsx`, so the page is already built after fetching.

1. **Verify** that `components/clinical-notes/page.tsx` exists and correctly imports the ClinicalNotes component
2. **Create a route** — either `app/notes/page.tsx` or `app/clinical-notes/page.tsx` that imports and renders the component
3. **Check imports** — ensure all relative imports within the clinical-notes files resolve correctly at their new location
4. **Fix any import paths** if the source files used aliases that differ from the current project setup
5. **Update the home page** (`app/page.tsx`) to include a link or redirect to the notes route

All layout and architecture decisions are yours. Do not ask the doctor.

---

## Phase 4: Quality & Preview

1. **Run the Quality Checklist** from the main protocol — silently review theming, responsiveness, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your clinical notes editor is ready. It includes patient details, encounter notes with highlighting, previous evolutions, and a reference section. You can view it at http://localhost:3000/notes"
4. Ask: "Would you like to adjust what information appears in your notes, or add any clinical tools alongside them?"
