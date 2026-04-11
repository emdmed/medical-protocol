# Clinical Notes Workflow

## Phase 1: Clinical Requirements

- "What patient information do you need at the top of each note?" (Default: name, age, date)
- "Do you need to review previous notes/evolutions?" (Default: yes)
- "Do you need a reference section for clinical guidelines or drug references?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **persistence enabled**: "Should notes be organized by visit date?" (Default: yes)

Do NOT ask about database setup, authentication, layout, or technical integrations.

---

## Phase 2: Fetch & Install

Follow the **Component Installation Process** from the main protocol for the `clinical-notes` component:

```bash
npx medical-ui add clinical-notes
```

**External components:** Some dependencies (water-balance, acid-base, bmi) are available as their own CLI components — install them with `npx medical-ui add <component>`. For remaining external imports not in the CLI (e.g., textarea-inv), create simplified versions or replace.

**Composition guide:** Since clinical-notes embeds multiple sub-components, fetch `{CDN_BASE}/components/COMPOSITION.md` for integration patterns and known gotchas.

---

## Phase 3: Build Page

The clinical-notes component includes its own `page.tsx`.

1. Create a route — `app/notes/page.tsx` or `app/clinical-notes/page.tsx` — that imports and renders the component
2. Check all relative imports resolve correctly
3. Fix any import path mismatches
4. Update `app/page.tsx` with a link to the notes route

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your clinical notes editor is ready. It includes patient details, encounter notes with highlighting, previous evolutions, and a reference section. View it at http://localhost:3000/notes"
Ask: "Would you like to adjust what information appears in your notes, or add any clinical tools alongside them?"
