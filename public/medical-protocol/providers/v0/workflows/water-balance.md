# Water Balance Workflow

## Registry

```
https://medical-protocol.vercel.app/medical-protocol/r/water-balance.json
```

## Phase 1: Clinical Requirements

Ask the doctor about their fluid balance tracking needs:

- "Do you need to track oral and IV intake separately?" (Default: yes)
- "Do you need insensible loss calculations based on patient weight?" (Default: yes)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Do you need to track fluid balance per shift or per 24 hours?" (Default: per 24 hours)
- If **multiple patients**: Route to the dashboard workflow instead, offering water balance as one of the dashboard widgets

Do NOT ask about:
- Calculation formulas (use standard clinical values: 12 mL/kg insensible loss, 4.5 mL/kg endogenous water, 120 mL per stool)
- Display preferences (you decide)
- Technical preferences

---

## Phase 2: Build

**Install the component from the registry URL above.** Fetch the registry JSON — it contains the full source code. Use the installed component as-is — do not rewrite or rebuild any component logic.

After installation, import the component:
```tsx
import WaterBalanceCalculator from "@/components/water-balance/water-balance";
```

Build only the page that imports and renders the component. Use a clean layout with proper spacing.

- Read `manifest.json` for available props (`data` with weight, intake, output fields).
- Read `COMPOSITION.md` for patterns on combining water balance with other components.

All layout and architecture decisions are yours. Do not ask the doctor.

After building the page, follow the **Quality Guidelines** from the main protocol.

---

## Phase 3: Preview

Follow **After Any Workflow Completes** from the main protocol, then:

1. Tell the doctor:
   > "Your fluid balance tracker is ready. Enter the patient's weight, fluid intake (oral and IV), urine output, and stool count — it calculates the net balance including insensible losses. You can see it in the preview."
2. Ask: "Would you like to adjust how the fluid balance is tracked?"
