# Dashboard Workflow

## Registry

Fetch the components the doctor needs from the registry:

```
https://medical-protocol.vercel.app/medical-protocol/r/{component}.json
```

Available: vital-signs, clinical-notes, acid-base, bmi-calculator, water-balance, telemonitoring, timeline, pafi, dka

## Phase 1: Clinical Requirements

The doctor wants a combined clinical dashboard. Present the available building blocks by category and ask which they'd like:

- "Which of these blocks would you like on your dashboard?"

  **Monitoring**
  - Vital signs (BP, HR, RR, Temp, SpO2)
  - Pulse oximetry (real-time animated display)

  **Calculators**
  - Blood gas / acid-base analyzer
  - BMI calculator
  - Fluid balance (water balance / I&O)
  - PaFi calculator (PaO2/FiO2 ratio with ARDS classification)

  **Critical Care**
  - DKA monitoring (hourly glucose, ketones, potassium, insulin, GCS tracking)

  **Documentation**
  - Clinical notes (encounter note editor)

  **Display**
  - Clinical timeline (hospitalization course)

  Default: vital signs + clinical notes

- "Is this for a single patient view or a clinic overview?" (Default: single patient)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: Ask "Do you want the dashboard to highlight patients with abnormal readings?" (Default: yes)

Do NOT ask about:
- Layout arrangement (you decide — typically vitals on one side, notes on the other)
- Navigation structure (you decide)
- Technical preferences

---

## Phase 2: Build

**Install every selected component from the registry.** For each component the doctor chose, fetch its registry JSON from the URL above. Use the installed components as-is — do not rewrite or rebuild any component logic.

After installation, import the components. Exact import paths for each component:
```tsx
import VitalSigns from "@/components/vital-signs/vital-signs";
import ClinicalNotes from "@/components/clinical-notes/clinical-notes";
import AcidBase from "@/components/acid-base/acid-base";
import BMICalculator from "@/components/bmi/bmi-calculator";
import WaterBalanceCalculator from "@/components/water-balance/water-balance";
import PulseOximetry from "@/components/telemonitoring/pulse-oximetry/pulse-oximetry";
import Timeline from "@/components/timeline/timeline";
import PaFiCalculator from "@/components/pafi/pafi-calculator";
import DKAMonitor from "@/components/dka/dka-monitor";
```

Build only the dashboard page that imports and renders the selected components in a responsive grid layout.

- Include a header with the clinic/dashboard name.
- Arrange selected blocks in a responsive grid — smaller widgets (acid-base, BMI, water-balance, pafi) work well grouped together; the timeline works best as a full-width section or sidebar; DKA monitoring is wide and works best full-width.
- Read `manifest.json` for each component's props, types, and data flow direction.
- Read `COMPOSITION.md` for patterns on combining components, data flow between blocks, and overflow-visible gotchas.

All layout decisions are yours. Optimize for clinical usability.

After building the page, follow the **Quality Guidelines** from the main protocol.

---

## Phase 3: Preview

Follow **After Any Workflow Completes** from the main protocol, then:

1. Tell the doctor:
   > "Your clinical dashboard is ready with [list selected blocks]. You can see it in the preview."
2. Ask: "Would you like to rearrange anything on the dashboard, or add any other clinical tools?"
