# Telemonitoring Workflow

## Registry

```
https://medical-protocol.vercel.app/medical-protocol/r/telemonitoring.json
```

## Phase 1: Clinical Requirements

Ask the doctor about their monitoring needs:

- "Do you need a real-time pulse oximetry display with heart rate and SpO2?" (Default: yes)
- "Is this for live monitoring of a connected device, or a visual display for manual readings?" (Default: visual display — the simulator provides a realistic animated preview)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Do you want alerts when readings go outside normal range?" (Default: yes)
- If **multiple patients**: Route to the dashboard workflow instead, offering telemonitoring as one of the dashboard widgets

Do NOT ask about:
- Device connectivity (the component provides a display — device integration is out of scope)
- Technical preferences
- Animation or design choices

---

## Phase 2: Build

**Install the component from the registry URL above.** Fetch the registry JSON — it contains the full source code. Use the installed component as-is — do not rewrite or rebuild any component logic.

After installation, import the component:
```tsx
import PulseOximetry from "@/components/telemonitoring/pulse-oximetry/pulse-oximetry";
import PulseOximetrySimulator from "@/components/telemonitoring/pulse-oximetry/pulse-oximetry-simulator";
```

Build only the page that imports and renders the component. Use a clean layout with proper spacing.

- Use `PulseOximetrySimulator` for demo/preview mode with animated readings, or `PulseOximetry` for integration with actual data sources (pass `bpm`, `spo2`, `isBeating` props).
- For the simulator, provide reasonable default ranges (e.g., `minBpm={60}`, `maxBpm={100}`, `minSpo2={94}`, `maxSpo2={99}`).
- Read `manifest.json` for available props.
- Read `COMPOSITION.md` for patterns on combining telemonitoring with other components.

All layout and architecture decisions are yours. Do not ask the doctor.

After building the page, follow the **Quality Guidelines** from the main protocol.

---

## Phase 3: Preview

Follow **After Any Workflow Completes** from the main protocol, then:

1. Tell the doctor:
   > "Your pulse oximetry monitor is ready. It shows real-time heart rate and oxygen saturation with a visual heartbeat indicator. You can see it in the preview."
2. Ask: "Would you like to adjust the display or alert thresholds?"
