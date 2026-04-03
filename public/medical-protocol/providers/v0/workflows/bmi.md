# BMI Workflow

## Registry

```
https://medical-protocol.vercel.app/medical-protocol/r/bmi-calculator.json
```

## Phase 1: Clinical Requirements

- "Do you prefer metric (kg/m) or imperial (lbs/ft-in) units?" (Default: imperial, with a toggle to switch)

### Setting-Aware Questions (based on Initial Clarification)

- If **multiple patients**: Route to the dashboard workflow instead, offering BMI as one of the dashboard widgets
- If **persistence enabled**: Store last-entered weight/height in localStorage

Do NOT ask about:
- BMI formula details (the component handles this)
- Display preferences (you decide)
- Technical preferences

---

## Phase 2: Build

**Install the component from the registry URL above.** Fetch the registry JSON — it contains the full source code. Use the installed component as-is — do not rewrite or rebuild any component logic.

After installation, import the component:
```tsx
import BMICalculator from "@/components/bmi/bmi-calculator";
```

Build only the page that imports and renders the component. Use a clean layout with proper spacing.

- Read `manifest.json` for available props.
- Read `COMPOSITION.md` for patterns on combining BMI with other components.

All layout and architecture decisions are yours. Do not ask the doctor.

After building the page, follow the **Quality Guidelines** from the main protocol.

---

## Phase 3: Preview

Follow **After Any Workflow Completes** from the main protocol, then:

1. Tell the doctor:
   > "Your BMI calculator is ready. Click to enter weight and height, and it will show the BMI with its category. You can switch between metric and imperial units. You can see it in the preview."
2. Ask: "Would you like to adjust anything?"
