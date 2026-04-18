# Acid-Base Component Context

## Component Summary

AcidBase -- arterial blood gas analysis with full acid-base classification, anion gap calculation, delta ratio, Henderson-Hasselbalch consistency check, and compensatory response assessment.

Install: `npx medical-ui-cli add acid-base`
Files installed: `acid-base.tsx`, `lib.ts`, `types/interfaces.ts`
shadcn deps: card, input, button, badge, label, separator

---

## Props & Data Flow

```typescript
interface AcidBaseProps {
  onData?: (result: Result | null) => void;  // fires with analysis result or null
}
// dataFlow: output-only (no data prop)
```

### Core Types

```typescript
interface Values {
  pH: string;
  pCO2: string;
  HCO3: string;
  Na: string;
  Cl: string;
  Albumin: string;
}

interface ExpectedValues {
  low?: string;
  high?: string;
}

interface Result {
  disorder: string;
  compensation: string;
  expectedValues: ExpectedValues;
  anionGap: string | null;
  agStatus: string | null;
  allDisorders: string[];
  compensatoryResponse: string;
  hhConsistency?: {
    expectedPH: string;
    measured: string;
    deviation: string;
    isCoherent: boolean;
    warning: string | null;
  };
}
```

---

## lib/acid-base/ -- Function Signatures

| Function | Inputs | Output |
|---|---|---|
| `analyze` | `{ values: Values; isChronic: boolean }` | Full analysis object (disorder, compensation, AG, delta ratio, HH consistency) or `null` |

The `analyze` function returns:

| Field | Type | Description |
|---|---|---|
| `disorder` | string | Primary acid-base disorder |
| `compensatoryResponse` | string | Expected compensatory mechanism |
| `additionalDisorders` | string[] | Mixed disorders detected |
| `compensation` | string | Compensation status |
| `interpretation` | string | Clinical interpretation |
| `expectedValues` | `{ low?, high? }` | Expected compensatory ranges |
| `anionGap` / `correctedAG` | string \| null | Anion gap (uncorrected / albumin-corrected) |
| `agStatus` | string \| null | Normal / Elevated |
| `deltaRatio` | string \| null | Delta-delta ratio |
| `deltaRatioInterpretation` | string \| null | Clinical meaning of delta ratio |
| `allDisorders` | string[] | Complete list of identified disorders |
| `hhConsistency` | object | Henderson-Hasselbalch equation check |

All inputs are `string` (parsed internally via `safeParseFloat`).

---

## Cross-Component Data Sharing

### Acid-Base -> DKA

DKA imports `analyze()` from acid-base. When both are installed, DKA uses acid-base analysis internally for bicarbonate tracking and pH assessment. No manual wiring needed -- the dependency is code-level.

### Acid-Base -> Sepsis

No direct data sharing. Acid-Base analyzes pH/pCO2/HCO3/Na/Cl/Albumin; sepsis uses different inputs (PaO2/FiO2 for respiration SOFA). Both can coexist on a dashboard without data wiring.

### Acid-Base -> CKD

Bicarbonate from acid-base analysis is clinically relevant for CKD metabolic acidosis assessment but not a direct lib function input. Both can coexist on a nephrology dashboard.

---

## Composition Patterns

### Standalone

```tsx
import AcidBase from "@/components/acid-base/acid-base";

function ABGPage() {
  return <AcidBase onData={(result) => {
    if (!result) return; // fires null on mount
    console.log(result.disorder);
  }} />;
}
```

### ICU Dashboard with DKA

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <AcidBase onData={handleABG} />
  <DKAMonitor data={dkaData} onData={setDkaData} />
</div>
```

### Gotchas

- **AcidBase fires `onData(null)` on mount.** Always guard with `if (!result) return` in your handler.
- **Output-only component.** AcidBase has no `data` prop -- it only fires results via `onData`. You cannot pre-fill values.
- **Na, Cl, Albumin are optional.** If omitted, anion gap and delta ratio will be `null`.
- **overflow-hidden:** Add `overflow-visible` to any shadcn `Card` wrapping acid-base if it has popups.

---

## CLI Calculator

```bash
# Basic ABG analysis
npx medprotocol abg --ph 7.25 --pco2 29 --hco3 14

# With anion gap inputs
npx medprotocol abg --ph 7.30 --pco2 25 --hco3 12 --na 140 --cl 105 --albumin 4.0
```

Always use `--json` internally, translate output to clinical language.

---

## Guideline Reference

Based on standard acid-base physiology:
- Primary disorders: metabolic acidosis/alkalosis, respiratory acidosis/alkalosis
- Winter's formula for metabolic acidosis compensation
- Anion gap = Na - (Cl + HCO3), corrected for albumin
- Delta-delta ratio for mixed disorders
- Henderson-Hasselbalch consistency check
