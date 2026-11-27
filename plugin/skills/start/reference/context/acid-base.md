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

## Synthetic patient generator

For the **Generate random patient** button (`building.md` §3). Each press: pick a scenario at random, draw each value uniformly in its range, apply the couplings, round as stated. Fields not listed stay empty.

| Scenario | HCO3 (mEq/L) | pCO2 (mmHg) | Anion gap target | Na⁺ | Albumin (g/dL) |
|---|---|---|---|---|---|
| Normal | 23–25 | 38–42 | 8–12 | 136–144 | 3.6–4.8 |
| High-AG metabolic acidosis (ketoacidosis, lactic) | 8–18 | Winter's: 1.5 × HCO3 + 8, ± 1 | 18–30 | 132–142 | 3.0–4.5 |
| Normal-AG metabolic acidosis (diarrhoea) | 12–18 | Winter's ± 1 | 8–12 | 134–142 | 3.5–4.5 |
| Metabolic alkalosis (vomiting) | 30–40 | 40 + 0.7 × (HCO3 − 24), ± 2 | 8–14 | 134–142 | 3.5–4.8 |
| Acute respiratory acidosis | 24 + 0.1 × (pCO2 − 40), ± 1 | 55–75 | 8–12 | 136–144 | 3.6–4.8 |
| Chronic respiratory acidosis (COPD) | 24 + 0.35 × (pCO2 − 40), ± 1 | 50–70 | 8–12 | 136–144 | 3.4–4.5 |
| Acute respiratory alkalosis | 24 − 0.2 × (40 − pCO2), ± 1 | 25–34 | 8–12 | 136–144 | 3.6–4.8 |
| Mixed: metabolic + respiratory acidosis | 10–16 | Winter's + 6 to 10 | 18–28 | 132–142 | 3.0–4.2 |

Couplings: draw the scenario's free value first, then the other from its formula. pH comes from Henderson–Hasselbalch, pH = 6.1 + log10(HCO3 / (0.03 × pCO2)), so `hhConsistency` never warns on a generated patient. Cl⁻ = Na⁺ − HCO3 − anion gap target.

Rounding: pH 2 decimals; HCO3, pCO2, Na⁺, Cl⁻ whole numbers; albumin 1 decimal.

The standalone screen reads respiratory compensation as chronic (`isChronic: true`), so the two acute respiratory scenarios show "Inadequate compensation" there. That is the lib's correct reading against chronic expectations, and worth explaining when one comes up; do not change the screen's mode to hide it.

Every generated patient is labelled "Synthetic patient" with a 4-character code, never a name. Results still come only from the lib.

## Lib Functions

`analyze({ values, isChronic })` (`acid-base/analyze.ts`) — single entry point. Returns the full analysis (disorder, compensation, compensatoryResponse, expectedValues, anionGap, uncorrectedAG, correctedAG, agStatus, deltaRatio, deltaRatioInterpretation, allDisorders, hhConsistency) or `null` when pH, pCO2 or HCO3 is missing.

- `values: Values` — `{ pH, pCO2, HCO3, Na, Cl, Albumin }`, all `string`. Pass `""` for absent Na/Cl/Albumin (AG and delta ratio come back `null`).
- `isChronic: boolean` — chronic vs acute respiratory compensation. The standalone screen uses `true`; DKA uses `false`.
- Types: `Values` in `acid-base/interfaces.ts`; the result type is `ReturnType<typeof analyze>`.

Inputs are parsed internally via `safeParseFloatOrNull`.

Compensation outside the expected range always names a second disorder in `additionalDisorders`: too much is the compensating disorder itself (listed once in `allDisorders`), too little is the opposite one (e.g. bicarbonate under the expected range in respiratory acidosis → `Metabolic Acidosis`), even when the value is still inside its normal range.

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
medprotocol abg --ph 7.25 --pco2 29 --hco3 14
medprotocol abg --ph 7.30 --pco2 25 --hco3 12 --na 140 --cl 105 --albumin 4.0
```

---

## Guideline Reference

Winter's formula, AG = Na-(Cl+HCO3) corrected for albumin, delta-delta ratio, Henderson-Hasselbalch (tolerance 0.08, Emmett & Narins, AJKD 2001). Disorders: metabolic/respiratory acidosis/alkalosis. Citation with DOI for Winters' formula: `sources.WINTERS_1967`.
