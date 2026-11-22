# PaFi Module Context

PaO2/FiO2 ratio with its Berlin oxygenation range and FiO2 presets for oxygen delivery devices.

Logic: `lib/medprotocol/pafi.ts` — import from `@/lib/medprotocol/pafi`. Build: see `building.md`.

---

## Screen spec

**Shows:** PaFi ratio and Berlin oxygenation range badge, inline below the inputs. The badge is a range for the ratio, not an ARDS diagnosis: never label it "ARDS".

**Inputs** (strings):

| Field | Unit | Default |
|---|---|---|
| PaO2 | mmHg | 90 |
| FiO2 | % (21–100) | 21 |

**FiO2 presets** (select): 21% (room air), 28%, 35%, 40%, 50%, 60%, 80%, 100%. Free entry still allowed.

**Outputs:** ratio from `calculatePaFi`, label from `getPaFiClassification`, badge color from `getPaFiSeverity`.

**Interaction:** click the card to enter edit mode, edit, save or cancel.

**Display rules:** map severity to emphasis: `normal` → normal, `mild` → watch, `moderate` → warning, `severe` → critical, `default` → neutral.

**Props contract:** `data?: { paO2?: string; fiO2?: string }` (read once on mount). No `onData`.

---

## Lib Functions

- `calculatePaFi(paO2, fiO2)` → `string | null` (integer). Null if PaO2 ≤0 or FiO2 outside 21–100.
- `getPaFiClassification(paFi)` → `"Normal"` (>300) | `"Berlin mild range"` (201–300) | `"Berlin moderate range"` (101–200) | `"Berlin severe range"` (≤100) | `"Unknown"`.
- `getPaFiSeverity(paFi)` → `"normal"` | `"mild"` | `"moderate"` | `"severe"` | `"default"`.

FiO2 entered as percentage (21-100), not fraction. All inputs `string`.

---

## Cross-Tool Data

Self-contained. Uses PaO2 (arterial), not SpO2 (peripheral). Coexists with sepsis (both use PaO2/FiO2) but no programmatic link.

---

## Gotchas

- **FiO2 as percentage.** Enter 40 for 40%, not 0.4
- **PaO2 vs SpO2.** Different measurements — PaFi uses arterial blood gas

---

## CLI

```bash
medprotocol pafi --pao2 60 --fio2 40
```

---

## Guideline Reference

Berlin Definition of ARDS (2012): PaO2/FiO2 with PEEP ≥5 cmH2O. Mild 201–300, Moderate 101–200, Severe ≤100 (JAMA 2012;307:2526-2533). The ratio alone is not a diagnosis. Citation with DOI: `sources.BERLIN_2012`.
