# PaFi Component Context

## Component Summary

PaFiCalculator -- PaO2/FiO2 ratio calculator with Berlin criteria ARDS classification and common FiO2 presets for oxygen delivery devices.

Install: `npx medical-ui-cli add pafi`
Files installed: `pafi-calculator.tsx`
shadcn deps: card, input, button, badge, label

---

## Props & Data Flow

```typescript
interface PaFiProps {
  // No props -- standalone calculator
}
// dataFlow: none (self-contained)
```

---

## lib/pafi.ts -- Function Signatures

| Function | Inputs | Output |
|---|---|---|
| `calculatePaFi` | paO2 (string), fiO2 (string) | string (ratio) or `null` |
| `getPaFiClassification` | paFi (string \| null) | string (ARDS severity or Normal) |
| `getPaFiSeverity` | paFi (string \| null) | string (normal/warning/critical) |

### ARDS Classification (Berlin Criteria)

| Classification | PaO2/FiO2 Range |
|---|---|
| Normal | > 300 |
| Mild ARDS | 200 -- 300 |
| Moderate ARDS | 100 -- 200 |
| Severe ARDS | < 100 |

All inputs are `string` (parsed internally via `safeParseFloat`). FiO2 is entered as a percentage (21-100), not a fraction.

---

## Cross-Component Data Sharing

### PaFi <-> Vital-Signs

FiO2 from vital-signs (`bloodOxygen.fiO2`) could inform PaFi calculation, but PaFi is self-contained and does not accept a data prop. PaFi uses PaO2 (arterial, from blood gas), not SpO2 (peripheral, from pulse oximetry).

### PaFi <-> Sepsis

Both calculate PaO2/FiO2 ratio. Sepsis uses it for respiration SOFA scoring; PaFi classifies ARDS severity. They coexist but don't share data programmatically -- PaFi is self-contained.

### PaFi <-> Acid-Base

No direct relationship. Acid-Base analyzes pH/pCO2/HCO3; PaFi analyzes oxygenation. Both can coexist on an ICU dashboard.

---

## Composition Patterns

### Standalone

```tsx
import PaFiCalculator from "@/components/pafi/pafi-calculator";

function PaFiPage() {
  return <PaFiCalculator />;
}
```

### ICU Dashboard

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <VitalSigns onData={handleVitals} editable />
  <PaFiCalculator />
  <AcidBase onData={handleABG} />
</div>
```

### Gotchas

- **No data prop, no onData callback.** PaFi is purely self-contained.
- **FiO2 as percentage.** Enter 40 for 40%, not 0.4. The lib function expects percentage format.
- **PaO2 vs SpO2.** PaFi uses PaO2 (arterial blood gas), not SpO2 (pulse oximetry). These are different measurements.

---

## CLI Calculator

```bash
# Basic PaFi calculation
npx medprotocol pafi --pao2 60 --fio2 40

# Room air
npx medprotocol pafi --pao2 95 --fio2 21
```

Always use `--json` internally, translate output to clinical language.

---

## Guideline Reference

Based on Berlin Definition of ARDS (2012):
- PaO2/FiO2 ratio with PEEP >= 5 cmH2O
- Mild (200-300), Moderate (100-200), Severe (< 100)
- Acute onset (within 1 week of clinical insult)
- Bilateral opacities on imaging
