# Vital Signs Workflow

## Registry

```
https://medical-protocol.vercel.app/medical-protocol/r/vital-signs.json
```

## Phase 1: Clinical Requirements

Ask the doctor which vital signs they need to monitor. Present as a clinical checklist:

- Blood pressure (systolic/diastolic)
- Heart rate (pulse)
- Blood oxygen saturation (SpO2)
- Body temperature
- Respiratory rate

**Default: all five.** If the doctor says "vital signs" without specifying, include all.

Ask: "Would you like alerts when readings fall outside normal ranges?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: Ask "Do you need continuous monitoring with alerts, or manual entry during rounds?" (Default: manual entry during rounds)
- If **private practice**: Ask "Do you just need to record vitals during the visit, or also review past readings?" (Default: record during visit only)

**FHIR support**: Include silently. Do not ask the doctor.

Do NOT ask about:
- Layout preferences (you decide)
- Color schemes (use clinical defaults)
- Data storage (always use localStorage — never use a database)

---

## Phase 2: Build

**Install the component from the registry URL above.** Fetch the registry JSON — it contains the full source code. Use the installed component as-is — do not rewrite or rebuild any component logic.

After installation, import the component:
```tsx
import VitalSigns from "@/components/vital-signs/vital-signs";
import type { IVitalSignsData } from "@/components/vital-signs/types/vital-signs";
```

Build only the page that imports and renders the component. Use a clean layout with proper spacing.

- If the doctor only wants specific vital signs (not all five), conditionally render only the requested signs.
- Read `manifest.json` for available props (`editable`, `useFahrenheit`, `assistant`, `border`, `onData`).
- Read `COMPOSITION.md` for patterns on combining vital signs with other components.

All layout and architecture decisions are yours. Do not ask the doctor.

After building the page, follow the **Quality Guidelines** from the main protocol.

---

## Phase 3: Preview

Follow **After Any Workflow Completes** from the main protocol, then:

1. Tell the doctor:
   > "Your vital signs monitor is ready. It tracks [list the signs they requested]. You can see it in the preview."
2. Ask: "Would you like to adjust which vital signs are shown, or change how any of them are displayed?"
