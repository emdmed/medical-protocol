# DKA Component Context

## Component Summary

DKAMonitor — hourly DKA monitoring: glucose reduction rate, ketone clearance, bicarbonate recovery, potassium tracking, GCS, urine output, insulin adjustment, resolution criteria.

Install: `npx medical-ui-cli add dka`
**Dependency:** `acid-base` (install first)
Files: `dka-monitor.tsx`, `lib.ts`, `types/dka.ts` — shadcn: card, input, button, badge, label, separator, select

---

## Props

```typescript
interface DKAProps { data?: DKAPatientData; onData?: (data: DKAPatientData) => void; }
```

See `types/dka.ts` for `DKAReading`, `DKAPatientData`. Unit: `"mmol" | "mgdl"`.

---

## Lib Functions

See `lib/dka.ts` for all signatures. Key functions: `calculateGlucoseReductionRate`, `isGlucoseOnTarget`, `calculateKetoneReductionRate`, `calculateBicarbonateIncreaseRate`, `classifyPotassium`, `calculateUrineOutputRate`, `classifyGCS`, `assessDKAResolution`, `suggestInsulinAdjustment`.

All inputs are `string` (parsed via `safeParseFloat`).

---

## Cross-Component Data

- **DKA → Acid-Base:** Code-level dependency — DKA imports `analyze()` for pH/bicarb assessment
- **DKA ↔ Vital-Signs/Sepsis:** No data sharing, can coexist on ICU dashboard

---

## Gotchas

- **Install acid-base first** — code-level dependency
- **Unit matters.** Glucose targets differ between mmol/L and mg/dL
- **Hourly readings.** Rate calculations compare consecutive timestamped readings
- **No circular loops.** Guard `onData` → `data` with `useRef` + serialized comparison
- **Resolution:** all-or-nothing (glucose < threshold AND ketones <0.6 AND bicarb >15 AND pH >7.3)

---

## CLI

```bash
npx medprotocol dka --glucose 400 --prev-glucose 460 --hours 2 --unit mgdl
npx medprotocol dka --glucose 200 --ketones 0.4 --bicarb 18 --ph 7.35 --unit mgdl
```

---

## Guideline Reference

JBDS-IP DKA guidelines: glucose 3-5 mmol/L/hr (54-90 mg/dL/hr), ketone clearance >0.5 mmol/L/hr, bicarb recovery >3 mmol/L/hr, resolution criteria, potassium replacement if <5.5 before insulin.
