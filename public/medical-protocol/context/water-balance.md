# Water-Balance Component Context

## Component Summary

WaterBalanceCalculator — fluid balance: oral intake, IV fluids, diuresis, insensible losses (weight-based), endogenous water, defecation losses, net balance.

Install: `npx medical-ui-cli add water-balance`
Files: `water-balance.tsx` — shadcn: card, input, button, label

---

## Props

```typescript
interface WaterBalanceProps { data?: { weight: number }; }
// Input-only (no onData). Weight is number, not string.
```

---

## Lib Functions

See `lib/water-balance.ts`. Functions: `calculateInsensibleLoss` (weight×10 mL/kg/day), `calculateEndogenousGeneration` (weight×5 mL/kg/day), `calculateDefecationLoss` (count×150 mL), `calculateWaterBalance` (net = intake - output).

All inputs `string` (parsed via `safeParseFloat`).

---

## Cross-Component Data

- **↔ Sepsis:** Both track fluid status, no programmatic link (sepsis uses urine for SOFA)
- **↔ Vital-Signs:** Weight entered separately

---

## Gotchas

- **No onData callback.** Self-contained calculator with optional weight pre-fill
- **Weight prop is `number`**, not string: `{ weight: 70 }`
- **Positive balance = overload**, negative = deficit

---

## CLI

```bash
npx medprotocol water-balance --weight 70 --oral 1500 --iv 500 --diuresis 1200 --stools 2
```

---

## Guideline Reference

Standard fluid management: insensible ~10 mL/kg/day, endogenous ~5 mL/kg/day, defecation ~150 mL/stool, goal neutral balance.
