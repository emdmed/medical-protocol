# Water-Balance Module Context

Fluid balance: oral intake, IV fluids, diuresis, insensible losses (weight-based), endogenous water, defecation losses, net balance.

Logic: `lib/medprotocol/water-balance.ts` — import from `@/lib/medprotocol/water-balance`. Build: see `building.md`.

---

## Screen spec

**Shows:** net balance as the hero value (signed: `+350`, `-200`, `--` when empty), with IN and OUT totals in mL.

**Inputs** (empty by default):

| Group | Field | Unit |
|---|---|---|
| In | Oral | mL |
| In | IV | mL |
| Out | Urine (diuresis) | mL |
| Out | Stools | count |
| — | Weight | kg |

**Outputs:**
- Net balance from `calculateWaterBalance`
- IN = oral + IV + `calculateEndogenousGeneration(weight)`
- OUT = urine + `calculateDefecationLoss(stools)` + `calculateInsensibleLoss(weight)`

**Interaction:** click the card to enter edit mode, edit, save or cancel.

**Display rules:** positive balance = overload, negative = deficit. Show mL on every value.

**Props contract:** `data?: { weight?: number; intakeOral?: number; intakeIv?: number; diuresis?: number; defecations?: number }` (all optional). Sync prop changes into state so Patient weight updates reach it (see `composition.md`). No `onData`.

---

## Synthetic patient generator

For the **Generate random patient** button (`building.md` §3). Each press: pick a scenario at random, draw each value uniformly in its range, apply the couplings, round as stated. Fields not listed stay empty.

| Scenario | Oral (mL) | IV (mL) | Urine (mL) | Stools |
|---|---|---|---|---|
| Balanced | 1200–2000 | 0–1000 | 60–90% of oral + IV | 0–2 |
| Positive (resuscitation, post-op) | 0–800 | 2000–4000 | 500–1200 | 0–1 |
| Negative (diuresis) | 800–1500 | 0–500 | 2000–3500 | 0–1 |
| Negative (diarrhoea) | 800–1500 | 500–1500 | 600–1200 | 4–8 |

Weight 45–110 kg. Rounding: volumes to the nearest 50 mL, weight to 0.1 kg.

Every generated patient is labelled "Synthetic patient" with a 4-character code, never a name. Results still come only from the lib.

## Lib Functions

All return `string` (mL, rounded to integer). Inputs accept `string | number` and are parsed via `safeParseFloat`.

- `calculateInsensibleLoss(weightKg)` — weight × 12 mL/kg/day
- `calculateEndogenousGeneration(weightKg)` — weight × 4.5 mL/kg/day
- `calculateDefecationLoss(count)` — count × 120 mL
- `calculateWaterBalance(weight, oral, iv, diuresis, defecationCount)` — net = (oral + IV + endogenous) − (diuresis + defecation + insensible)

---

## Cross-Tool Data

- **← Patient:** weight (kg)
- **↔ Sepsis:** Both track fluid status, no programmatic link (sepsis uses urine for SOFA)

---

## Gotchas

- **`data` values are numbers**, not strings: `{ weight: 70 }`. Convert with `String()` before calling the lib
- **Net always comes from `calculateWaterBalance`**, not from subtracting the displayed totals

---

## CLI

```bash
medprotocol water-balance --weight 70 --oral 1500 --iv 500 --diuresis 1200 --stools 2
```

---

## Guideline Reference

Insensible loss ~10–15 mL/kg/day (Rose & Post, 5th ed.; lib uses 12), endogenous water ~4–5 mL/kg/day (Matz, Am J Med 2007; lib uses 4.5), stool water ~100–200 mL per bowel movement (Levitt & Bond, Gastroenterology 1980; lib uses 120). Goal: neutral balance.
