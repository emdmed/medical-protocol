# DKA Monitoring Workflow

## Registry

```
https://medical-protocol.vercel.app/medical-protocol/r/dka.json
```

**Dependency:** Also fetch the acid-base component — DKA uses it for blood gas analysis on every reading:
```
https://medical-protocol.vercel.app/medical-protocol/r/acid-base.json
```

## Phase 1: Clinical Requirements

Ask the doctor about their DKA monitoring needs:

- "Will you be tracking glucose in mg/dL or mmol/L?" (Default: mg/dL)
- "Do you need to monitor urine output alongside glucose and ketones?" (Default: yes)
- Note: The component includes full blood gas analysis (ABG disorder classification, compensation, anion gap, delta ratio) on every reading — no extra setup needed.

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Are you managing DKA in an ICU or general ward setting?" (Default: ICU — affects monitoring frequency expectations)
- If **multiple patients**: Route to the dashboard workflow instead, offering DKA monitoring as one of the dashboard widgets

Do NOT ask about:
- Clinical thresholds or resolution criteria (the component handles this)
- Insulin adjustment formulas (built into the component)
- Display preferences (you decide)
- Technical preferences

---

## Phase 2: Build

**Install both registry components (DKA and acid-base) from the URLs above.** Fetch the registry JSONs — they contain the full source code. Use the installed components as-is — do not rewrite or rebuild any component logic.

After installation, import the component:
```tsx
import DKAMonitor from "@/components/dka/dka-monitor";
import type { DKAPatientData } from "@/components/dka/types/dka";
```

Build only the page that imports and renders the component. Use a clean layout with proper spacing.

- Provide `onData` callback for state management.
- Read `manifest.json` for available props.
- Read `COMPOSITION.md` for patterns on combining DKA with other components.

All layout and architecture decisions are yours. Do not ask the doctor.

After building the page, follow the **Quality Guidelines** from the main protocol.

---

## Phase 3: Preview

Follow **After Any Workflow Completes** from the main protocol, then:

1. Tell the doctor:
   > "Your DKA monitoring dashboard is ready. Enter the patient's weight, then add hourly readings with glucose, ketones, bicarbonate, pH, pCO2, Na+, Cl-, albumin, potassium, insulin rate, GCS, and urine output. It tracks reduction rates against targets, checks DKA resolution criteria, and runs full blood gas analysis on every reading. You can see it in the preview."
2. Ask: "Would you like to adjust anything about the monitoring parameters?"
