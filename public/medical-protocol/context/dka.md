# DKA Component Context

## Component Summary

DKAMonitor -- hourly DKA monitoring: glucose reduction rate, ketone clearance, bicarbonate recovery, potassium tracking, GCS, urine output, insulin dose adjustment, and resolution criteria assessment.

Install: `npx medical-ui-cli add dka`
Dependencies: `acid-base` (install first)
Files installed: `dka-monitor.tsx`, `lib.ts`, `types/dka.ts`
shadcn deps: card, input, button, badge, label, separator, select

---

## Props & Data Flow

```typescript
interface DKAProps {
  data?: DKAPatientData;                    // pre-fill patient data
  onData?: (data: DKAPatientData) => void;  // fires on every change
}
// dataFlow: bidirectional
```

### Core Types

```typescript
interface DKAReading {
  id: string;
  timestamp: string;
  glucose: string;
  ketones: string;
  bicarbonate: string;
  pH: string;
  potassium: string;
  gcs: string;
  urineOutput: string;
  insulinRate: string;
}

interface DKAPatientData {
  weight: string;
  unit: "mmol" | "mgdl";
  readings: DKAReading[];
}
```

---

## lib/dka.ts -- Function Signatures

| Function | Inputs | Output |
|---|---|---|
| `calculateGlucoseReductionRate` | current, previous, hours | string (rate/hr) or `null` |
| `isGlucoseOnTarget` | rate, unit ("mmol" \| "mgdl") | boolean |
| `calculateKetoneReductionRate` | current, previous, hours | string (rate/hr) or `null` |
| `isKetoneOnTarget` | rate | boolean |
| `calculateBicarbonateIncreaseRate` | current, previous, hours | string (rate/hr) or `null` |
| `isBicarbonateOnTarget` | rate | boolean |
| `classifyPotassium` | value | string (Low/Normal/High) |
| `getPotassiumSeverity` | value | string (critical/warning/normal) |
| `calculateUrineOutputRate` | volume, weight, hours | string (mL/kg/hr) or `null` |
| `isUrineOutputOnTarget` | rate | boolean |
| `classifyGCS` | value | string (Normal/Mild/Moderate/Severe) |
| `isGCSDecreasing` | current, previous | boolean |
| `assessDKAResolution` | glucose, ketones, bicarbonate, pH, unit | `{ resolved, criteria: Record<string, boolean> }` |
| `suggestInsulinAdjustment` | glucose, rate, insulinRate, unit | string (clinical suggestion) |

All inputs are `string` (parsed internally via `safeParseFloat`).

---

## Cross-Component Data Sharing

### DKA -> Acid-Base (code dependency)

DKA imports `analyze()` from acid-base for pH/bicarbonate assessment. This is a code-level dependency -- the acid-base component must be installed before DKA.

### DKA <-> Vital-Signs

No direct data sharing. GCS in DKA is entered manually -- it's not sourced from vital-signs.

### DKA <-> Sepsis

Both track critically ill patients but have no overlapping inputs. Can coexist on an ICU dashboard without data wiring.

---

## Composition Patterns

### ICU Dashboard

```tsx
import DKAMonitor from "@/components/dka/dka-monitor";
import AcidBase from "@/components/acid-base/acid-base";
import VitalSigns from "@/components/vital-signs/vital-signs";

function ICUDashboard() {
  const [dkaData, setDkaData] = useState<DKAPatientData | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <VitalSigns onData={handleVitals} editable />
      <AcidBase onData={handleABG} />
      <DKAMonitor data={dkaData ?? undefined} onData={setDkaData} />
    </div>
  );
}
```

### Gotchas

- **Install acid-base first.** DKA depends on acid-base at the code level.
- **Unit matters.** Glucose targets differ between mmol/L and mg/dL. Always pass the correct `unit` to `isGlucoseOnTarget` and `assessDKAResolution`.
- **Hourly readings.** DKA expects sequential readings with timestamps. Rate calculations compare consecutive readings.
- **No circular loops.** DKA `onData` fires on every reading change. Guard with `useRef` + serialized comparison if feeding data back.
- **Resolution criteria** are all-or-nothing: glucose < threshold AND ketones < 0.6 AND bicarbonate > 15 AND pH > 7.3.

---

## CLI Calculator

```bash
# Glucose reduction rate
npx medprotocol dka --glucose 400 --prev-glucose 460 --hours 2 --unit mgdl

# DKA resolution check
npx medprotocol dka --glucose 200 --ketones 0.4 --bicarb 18 --ph 7.35 --unit mgdl
```

Always use `--json` internally, translate output to clinical language.

---

## Guideline Reference

Based on JBDS-IP (Joint British Diabetes Societies) DKA guidelines:
- Glucose reduction target: 3-5 mmol/L/hr (54-90 mg/dL/hr)
- Ketone clearance target: > 0.5 mmol/L/hr
- Bicarbonate recovery target: > 3 mmol/L/hr
- Resolution: glucose < 14 mmol/L (250 mg/dL), ketones < 0.6, bicarb > 15, pH > 7.3
- Potassium monitoring: replace if < 5.5 mmol/L before insulin
- Hourly monitoring until resolution
