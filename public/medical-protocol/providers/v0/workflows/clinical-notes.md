# Clinical Notes Workflow

## Registry

```
https://medical-protocol.vercel.app/medical-protocol/r/clinical-notes.json
```

## Phase 1: Clinical Requirements

Ask the doctor about their documentation needs:

- "What patient information do you need at the top of each note?" (Default: name, age, date)
- "Do you need to review previous notes/evolutions?" (Default: yes)
- "Do you need a reference section for clinical guidelines or drug references?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **persistence enabled**: "Should notes be organized by visit date?" (Default: yes)

Do NOT ask about:
- Database setup or authentication
- Layout preferences (you decide)
- Technical integrations

---

## Phase 2: Build

**Install the component from the registry URL above.** Fetch the registry JSON — it contains the full source code. Use the installed component as-is — do not rewrite or rebuild any component logic.

**External components:** The clinical-notes component embeds water-balance, acid-base, and bmi sub-components. Fetch those registry JSONs too:
- `https://medical-protocol.vercel.app/medical-protocol/r/water-balance.json`
- `https://medical-protocol.vercel.app/medical-protocol/r/acid-base.json`
- `https://medical-protocol.vercel.app/medical-protocol/r/bmi-calculator.json`

After installation, import the component:
```tsx
import ClinicalNotes from "@/components/clinical-notes/clinical-notes";
```

The clinical-notes component includes its own `page.tsx`. Build a route that imports and renders it.

- Read `manifest.json` for the component's props and external dependencies.
- Read `COMPOSITION.md` for integration patterns and known gotchas.

All layout and architecture decisions are yours. Do not ask the doctor.

After building the page, follow the **Quality Guidelines** from the main protocol.

---

## Phase 3: Preview

Follow **After Any Workflow Completes** from the main protocol, then:

1. Tell the doctor:
   > "Your clinical notes editor is ready. It includes patient details, encounter notes with highlighting, previous evolutions, and a reference section. You can see it in the preview."
2. Ask: "Would you like to adjust what information appears in your notes, or add any clinical tools alongside them?"
