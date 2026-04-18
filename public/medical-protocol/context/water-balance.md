# Water-Balance Component Context

## Component Summary

WaterBalanceCalculator -- fluid balance tracker: oral intake, IV fluids, diuresis, insensible losses (weight-based), endogenous water generation, defecation losses (stool count), net balance calculation.

Install: `npx medical-ui-cli add water-balance`
Files installed: `water-balance.tsx`
shadcn deps: card, input, button, label

---

## Props & Data Flow

```typescript
interface WaterBalanceProps {
  data?: { weight: number };  // pre-fill patient weight
}
// dataFlow: input-only (no onData callback)
```

---

## lib/water-balance.ts -- Function Signatures

| Function | Inputs | Output |
|---|---|---|
| `calculateInsensibleLoss` | weightKg (string \| number \| null) | string (mL/day) |
| `calculateEndogenousGeneration` | weightKg (string \| number \| null) | string (mL/day) |
| `calculateDefecationLoss` | count (string \| number \| null) | string (mL) |
| `calculateWaterBalance` | weight, fluidIntakeOral, fluidIntakeIV, diuresis, defecationCount | string (net mL) |

### Formulas

- **Insensible loss**: weight * 10 mL/kg/day (skin + respiratory)
- **Endogenous generation**: weight * 5 mL/kg/day (metabolic water)
- **Defecation loss**: count * 150 mL per stool
- **Net balance**: (oral + IV + endogenous) - (diuresis + insensible + defecation)

All inputs are `string` (parsed internally via `safeParseFloat`).

---

## Cross-Component Data Sharing

### Water-Balance <-> Sepsis

Sepsis depends on water-balance at the component level (install dependency). Both track fluid status in critically ill patients but don't share data programmatically. Sepsis tracks urine output for renal SOFA; water-balance tracks total fluid balance.

### Water-Balance <-> Vital-Signs

No direct data sharing. Weight in water-balance is entered separately from vital signs.

---

## Composition Patterns

### Standalone

```tsx
import WaterBalanceCalculator from "@/components/water-balance/water-balance";

function FluidPage() {
  return <WaterBalanceCalculator data={{ weight: 70 }} />;
}
```

### ICU Dashboard

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <VitalSigns onData={handleVitals} editable />
  <WaterBalanceCalculator data={{ weight: 70 }} />
  <SepsisMonitor data={sepsisData} onData={setSepsisData} />
</div>
```

### Gotchas

- **No onData callback.** Water-balance does not emit data. It's a self-contained calculator with optional weight pre-fill.
- **Weight prop is number, not string.** Pass `{ weight: 70 }`, not `{ weight: "70" }`.
- **Insensible loss is automatic.** It's calculated from weight -- the doctor doesn't enter it manually.
- **Positive balance = fluid overload.** Negative balance = deficit. Display in clinical language.

---

## CLI Calculator

```bash
# Basic fluid balance
npx medprotocol water-balance --weight 70 --oral 1500 --iv 500 --diuresis 1200 --stools 2

# Minimal inputs (weight only calculates insensible loss)
npx medprotocol water-balance --weight 70 --oral 1000 --diuresis 800
```

Always use `--json` internally, translate output to clinical language.

---

## Guideline Reference

Based on standard fluid management principles:
- Insensible losses: ~10 mL/kg/day (skin evaporation + respiratory)
- Endogenous water generation: ~5 mL/kg/day (oxidative metabolism)
- Defecation: ~150 mL per formed stool
- Goal: maintain neutral balance in most hospitalized patients
