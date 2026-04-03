# PaFi Calculator Workflow

## Registry

```
https://medical-protocol.vercel.app/medical-protocol/r/pafi.json
```

## Phase 1: Clinical Requirements

- "Will you be using this for ARDS classification or general oxygenation monitoring?" (Default: ARDS classification)
- "Do you need FiO2 presets for common oxygen delivery devices?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Are you monitoring patients on mechanical ventilation?" (Default: yes — influences FiO2 range emphasis)
- If **multiple patients**: Route to the dashboard workflow instead, offering PaFi as one of the dashboard widgets

Do NOT ask about:
- ARDS classification thresholds (the component handles this)
- Display preferences (you decide)
- Technical preferences

---

## Phase 2: Build

**Install the component from the registry URL above.** Fetch the registry JSON — it contains the full source code. Use the installed component as-is — do not rewrite or rebuild any component logic.

After installation, import the component:
```tsx
import PaFiCalculator from "@/components/pafi/pafi-calculator";
```

Build only the page that imports and renders the component. Use a clean layout with proper spacing.

- Read `manifest.json` for available props.
- Read `COMPOSITION.md` for patterns on combining PaFi with other components.

All layout and architecture decisions are yours. Do not ask the doctor.

After building the page, follow the **Quality Guidelines** from the main protocol.

---

## Phase 3: Preview

Follow **After Any Workflow Completes** from the main protocol, then:

1. Tell the doctor:
   > "Your PaFi calculator is ready. Enter PaO2 and FiO2 values (with quick presets for common oxygen concentrations) to see the PaO2/FiO2 ratio and ARDS classification. You can see it in the preview."
2. Ask: "Would you like to adjust anything about the calculator?"
