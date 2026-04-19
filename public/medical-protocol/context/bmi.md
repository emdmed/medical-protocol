# BMI Component Context

## Component Summary

BMICalculator — Body Mass Index with metric/imperial toggle, WHO classification, visual BMI scale.

Install: `npx medical-ui-cli add bmi`
Files: `bmi-calculator.tsx` — shadcn: card, input, button, label

---

## Props

Self-contained — no props, no data flow.

---

## Lib Functions

See `lib/bmi.ts`. Two functions: `calculateBMI(w, hFt, hIn, hM, metric)` → BMI or null, `getBMICategory(bmi)` → Underweight/<18.5, Normal/18.5-24.9, Overweight/25-29.9, Obese I/30-34.9, Obese II/35-39.9, Obese III/≥40.

All inputs `string` (parsed via `safeParseFloat`).

---

## Cross-Component Data

Self-contained. Weight could inform water-balance/sepsis but no programmatic link.

---

## Gotchas

- **No data prop, no onData.** Self-contained
- **Metric/imperial toggle** is internal, no external control

---

## CLI

```bash
npx medprotocol bmi --weight 70 --height-m 1.75 --metric
```

---

## Guideline Reference

WHO BMI classification (2000). Metric: kg/m². Imperial: (lb/in²)×703.
