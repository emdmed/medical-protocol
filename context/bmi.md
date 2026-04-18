# BMI Component Context

## Component Summary

BMICalculator -- Body Mass Index calculator with metric/imperial toggle, WHO category classification, and visual BMI scale.

Install: `npx medical-ui-cli add bmi`
Files installed: `bmi-calculator.tsx`
shadcn deps: card, input, button, label

---

## Props & Data Flow

```typescript
interface BMIProps {
  // No props -- standalone calculator
}
// dataFlow: none (self-contained)
```

---

## lib/bmi.ts -- Function Signatures

| Function | Inputs | Output |
|---|---|---|
| `calculateBMI` | w (weight), hFt (feet), hIn (inches), hM (meters), metric (boolean) | string (BMI value) or `null` |
| `getBMICategory` | bmi (string \| null) | string (WHO category) |

### BMI Categories

| Category | BMI Range |
|---|---|
| Underweight | < 18.5 |
| Normal | 18.5 -- 24.9 |
| Overweight | 25.0 -- 29.9 |
| Obese (Class I) | 30.0 -- 34.9 |
| Obese (Class II) | 35.0 -- 39.9 |
| Obese (Class III) | >= 40.0 |

All inputs are `string` (parsed internally via `safeParseFloat`).

---

## Cross-Component Data Sharing

BMI is self-contained. It does not share data with other components. Weight from BMI could inform water-balance or sepsis (which also take weight), but there is no programmatic data link -- the doctor enters weight separately in each tool.

---

## Composition Patterns

### Standalone

```tsx
import BMICalculator from "@/components/bmi/bmi-calculator";

function BMIPage() {
  return <BMICalculator />;
}
```

### Dashboard

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <BMICalculator />
  <VitalSigns onData={handleVitals} editable />
</div>
```

### Gotchas

- **No data prop, no onData callback.** BMI is purely self-contained -- it cannot receive or emit data.
- **Metric/imperial toggle** is internal to the component. No external control.

---

## CLI Calculator

```bash
# Metric
npx medprotocol bmi --weight 70 --height-m 1.75 --metric

# Imperial
npx medprotocol bmi --weight 154 --height-ft 5 --height-in 9
```

Always use `--json` internally, translate output to clinical language.

---

## Guideline Reference

Based on WHO BMI classification (2000):
- International BMI categories for adults
- Metric formula: weight(kg) / height(m)^2
- Imperial formula: (weight(lb) / height(in)^2) * 703
