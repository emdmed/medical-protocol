# Cardiology Component Context

## Component Summary

CardiologyCalculator -- three cardiovascular risk calculators: ASCVD 10-year risk (Pooled Cohort Equations), HEART Score for chest pain triage, CHA2DS2-VASc for AF stroke risk.

Install: `npx medical-ui-cli add cardiology`
Files installed: `cardiology-calculator.tsx`, `lib.ts`, `types/cardiology.ts`
shadcn deps: card, input, button, badge, label, separator, select, checkbox

---

## Props & Data Flow

```typescript
interface CardiologyProps {
  // No props -- standalone multi-calculator
}
// dataFlow: none (self-contained)
```

---

## lib/cardiology.ts -- Function Signatures

### ASCVD (10-Year Atherosclerotic Cardiovascular Disease Risk)

| Function | Inputs | Output |
|---|---|---|
| `calculateASCVD` | `ASCVDInputs` | string (% risk) or `null` |
| `getASCVDCategory` | risk (string \| null) | string (Low/Borderline/Intermediate/High) |
| `getASCVDSeverity` | risk (string \| null) | string (normal/warning/critical) |

### HEART Score (Chest Pain Triage)

| Function | Inputs | Output |
|---|---|---|
| `calculateHEARTScore` | `HEARTInputs` | number (0-10) |
| `getHEARTCategory` | score (number) | string (Low/Moderate/High) |
| `getHEARTAction` | score (number) | string (clinical action) |
| `getHEARTSeverity` | score (number) | string (normal/warning/critical) |

### CHA2DS2-VASc (AF Stroke Risk)

| Function | Inputs | Output |
|---|---|---|
| `calculateCHADSVASc` | `CHADSVAScInputs` | number (0-9) |
| `getCHADSVAScCategory` | score (number), isFemale (boolean) | string (Low/Moderate/High) |
| `getCHADSVAScAction` | score (number), isFemale (boolean) | string (anticoagulation recommendation) |
| `getCHADSVAScSeverity` | score (number), isFemale (boolean) | string (normal/warning/critical) |

### Input Types (lib/cardiology-types.ts)

```typescript
interface ASCVDInputs {
  age: string; sex: "male" | "female"; race: "white" | "aa" | "other";
  totalCholesterol: string; hdlCholesterol: string; systolicBP: string;
  bpTreatment: boolean; diabetes: boolean; smoker: boolean;
}

interface HEARTInputs {
  history: 0 | 1 | 2; ecg: 0 | 1 | 2; age: 0 | 1 | 2;
  riskFactors: 0 | 1 | 2; troponin: 0 | 1 | 2;
}

interface CHADSVAScInputs {
  chf: boolean; hypertension: boolean; age75: boolean; diabetes: boolean;
  stroke: boolean; vascularDisease: boolean; age65: boolean; sexFemale: boolean;
}
```

All numeric inputs are `string` (parsed internally via `safeParseFloat`).

---

## Cross-Component Data Sharing

### Cardiology <-> Vital-Signs

Systolic BP from vital-signs is an input to ASCVD. No programmatic data link -- the doctor enters SBP separately. If composing on a dashboard, you could wire `vitals.bloodPressure.systolic` into the ASCVD form, but the component doesn't accept a `data` prop.

### Cardiology is self-contained

No component dependencies. Does not import from or share data with other modules.

---

## Composition Patterns

### Standalone

```tsx
import CardiologyCalculator from "@/components/cardiology/cardiology-calculator";

function CardioPage() {
  return <CardiologyCalculator />;
}
```

### Cardiology + Vitals Dashboard

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <CardiologyCalculator />
  <VitalSigns onData={handleVitals} editable />
</div>
```

### Gotchas

- **No data prop, no onData callback.** Cardiology is purely self-contained.
- **Three sub-calculators.** The component has internal tabs/sections for ASCVD, HEART, and CHA2DS2-VASc.
- **ASCVD age range:** Valid for ages 40-79. Outside this range, `calculateASCVD` returns `null`.
- **CHA2DS2-VASc sex adjustment:** The `isFemale` parameter affects the risk category threshold (female sex adds 1 point but doesn't change the anticoagulation threshold for low risk).

---

## CLI Calculator

```bash
# ASCVD 10-year risk
npx medprotocol cardiology ascvd --age 55 --sex male --tc 213 --hdl 50 --sbp 120

# HEART Score
npx medprotocol cardiology heart --history 1 --ecg 1 --age 2 --risk 1 --troponin 0

# CHA2DS2-VASc
npx medprotocol cardiology chadsvasc --chf --htn --age75 --diabetes --stroke
```

Always use `--json` internally, translate output to clinical language.

---

## Guideline Reference

- **ASCVD**: 2013 ACC/AHA Pooled Cohort Equations (Goff et al.)
- **HEART Score**: Six et al. (2008) -- chest pain triage in ED
- **CHA2DS2-VASc**: Lip et al. (2010) -- AF stroke risk, ESC 2020 guidelines
