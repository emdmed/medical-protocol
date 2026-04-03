# Acid-Base Workflow

## Registry

```
https://medical-protocol.vercel.app/medical-protocol/r/acid-base.json
```

## Phase 1: Clinical Requirements

Ask the doctor about their blood gas analysis needs:

- "Will you be entering arterial blood gas values manually, or do you need to import them?" (Default: manual entry)
- "Do you need anion gap and delta ratio calculations?" (Default: yes, if Na and Cl are available)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Do you typically work with acute or chronic respiratory conditions?" (Default: chronic — affects compensation formulas)
- If **multiple patients**: Route to the dashboard workflow instead, offering acid-base as one of the dashboard widgets

Do NOT ask about:
- Technical integrations
- Display preferences (you decide)
- Which formulas to use (the component handles this)

---

## Phase 2: Build

**Install the component from the registry URL above.** Fetch the registry JSON — it contains the full source code. Use the installed component as-is — do not rewrite or rebuild any component logic.

After installation, import the component:
```tsx
import AcidBase from "@/components/acid-base/acid-base";
import type { Result } from "@/components/acid-base/types/interfaces";
```

Build only the page that imports and renders the component. Use a clean layout with proper spacing.

- Provide an `onData` callback for storing results. Note: `onData` fires with `null` on mount — guard against it.
- Read `manifest.json` for available props.
- Read `COMPOSITION.md` for patterns on combining acid-base with other components.

All layout and architecture decisions are yours. Do not ask the doctor.

After building the page, follow the **Quality Guidelines** from the main protocol.

---

## Phase 3: Preview

Follow **After Any Workflow Completes** from the main protocol, then:

1. Tell the doctor:
   > "Your blood gas analyzer is ready. Enter pH, pCO2, and HCO3 to get an acid-base interpretation. You can also add Na+, Cl-, and albumin for anion gap analysis. You can see it in the preview."
2. Ask: "Would you like to adjust anything about the analysis display?"
