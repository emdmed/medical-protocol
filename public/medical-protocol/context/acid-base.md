# Acid-Base Module Context

ABG analysis: primary disorder classification, anion gap (albumin-corrected), delta ratio, Henderson-Hasselbalch consistency, compensatory response.

Logic: `lib/medprotocol/acid-base/` — import from `@/lib/medprotocol/acid-base`. Build: see `building.md`.

---

## Screen spec

**Shows:** a compact ABG entry panel with results inline below the inputs.

**Inputs** (strings, empty by default; placeholders show typical normals):

| Field | Unit | Placeholder | Required |
|---|---|---|---|
| pH | — | 7.40 | yes |
| pCO2 | mmHg | 40 | yes |
| HCO3 | mEq/L | 24 | yes |
| Na⁺ | mEq/L | 140 | for anion gap |
| Cl⁻ | mEq/L | 104 | for anion gap |
| Albumin | g/dL | 4 | for corrected AG |

**Outputs** (all from `analyze()`):
- Every disorder in `allDisorders` (primary + additional), shown as alert badges
- Compensation and compensatory response (hide when `compensation === "N/A"`)
- Expected values range (`expectedValues.low`–`high`) when both present
- Anion gap with status (`anionGap`, `agStatus`), delta ratio when available
- `hhConsistency.warning` when the inputs are not internally coherent

**Interaction:** analysis runs live on every change once pH, pCO2, HCO3 are filled. A show/hide results toggle and a reset button that clears all fields.

**Display rules:** results always render inline below the inputs, never overlaid. Do not color inputs against copied normal ranges; show what `analyze()` returns.

**Props contract:** `data?: Partial<Values>` (starting values, read once on mount), `onData?: (result: Result | null) => void` (fires on every analysis change, `null` while required fields are missing).

---

## Lib Functions

`analyze({ values, isChronic })` (`acid-base/analyze.ts`) — single entry point. Returns the full analysis (disorder, compensation, compensatoryResponse, expectedValues, anionGap, uncorrectedAG, correctedAG, agStatus, deltaRatio, deltaRatioInterpretation, allDisorders, hhConsistency) or `null` when pH, pCO2 or HCO3 is missing.

- `values: Values` — `{ pH, pCO2, HCO3, Na, Cl, Albumin }`, all `string`. Pass `""` for absent Na/Cl/Albumin (AG and delta ratio come back `null`).
- `isChronic: boolean` — chronic vs acute respiratory compensation. The standalone screen uses `true`; DKA uses `false`.
- Types: `Values`, `Result` in `acid-base/interfaces.ts`; `ABGValues`, `ABGResult` in `acid-base/index.ts`.

Inputs are parsed internally via `safeParseFloatOrNull`.

---

## Cross-Tool Data

- **→ DKA:** DKA calls `analyze()` on its latest reading (pH, pCO2, bicarbonate, Na, Cl, albumin) with `isChronic: false`
- **↔ Sepsis/CKD:** No direct sharing, can coexist on dashboard

---

## Gotchas

- **`onData(null)` on mount.** Analysis is `null` until the three required fields exist. Always guard: `if (!result) return`
- **`data` is read once.** Later changes to the prop do not reset the fields

---

## CLI

```bash
npx medprotocol abg --ph 7.25 --pco2 29 --hco3 14
npx medprotocol abg --ph 7.30 --pco2 25 --hco3 12 --na 140 --cl 105 --albumin 4.0
```

---

## Guideline Reference

Winter's formula, AG = Na-(Cl+HCO3) corrected for albumin, delta-delta ratio, Henderson-Hasselbalch (tolerance 0.08, Emmett & Narins, AJKD 2001). Disorders: metabolic/respiratory acidosis/alkalosis.
