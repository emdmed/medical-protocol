# Respiratory Failure Module Context

Respiratory failure and respiratory distress: gas exchange and bedside signs in, **two separate verdicts** out. A syndromic assessment like **focal-pulmonary** and **heart-failure**: findings in, a verdict out, and the rule says so when it cannot answer.

Logic: `lib/medprotocol/respiratory-failure.ts` (uses `acid-base/` for the gas, `units.ts` for kPa, `vital-signs-validations/` for SpO2) — import from `@/lib/medprotocol/respiratory-failure`. Build: see `building.md`.

**What the result is.** FAILURE is gas exchange, decided by numbers (a saturation or an arterial gas). DISTRESS is work of breathing, decided at the bedside (a rate and four signs). They never merge: a tiring asthmatic with a rate of 12 is in failure with no distress to show; a patient breathing 32 a minute on a probe that will not read is in distress with no measure of failure. **Not a diagnosis and never a treatment**: `next` names a measurement, never oxygen or ventilation.

---

## The rule

**Hypoxaemia** is `present` when SpO2 is below 90% (the vital-signs `critical` severity) or an arterial PaO2 is below 60 mmHg (8 kPa). It is `absent` only on **room air** with a saturation or PaO2 to read; otherwise `not_determined`.

**Hypercapnia** is `present` when an **arterial** gas reads as acid-base's "Respiratory Acidosis" (acute, `isChronic: false`) with PaCO2 above 45 mmHg (6 kPa); `absent` when an arterial gas reads otherwise (a compensated retainer is "Mixed Disorder", not acute failure); `not_determined` without an arterial gas. A venous pCO2 is never a PaCO2.

| Failure | Reason | When |
|---|---|---|
| `present` | `hypoxaemia`, `hypercapnia`, `hypoxaemia_and_hypercapnia` | either limb present |
| `absent` | `adequate_on_room_air` | hypoxaemia absent, no venous gas |
| `indeterminate` | `venous_gas_only` | hypoxaemia absent, but the gas was venous |
| `indeterminate` | `no_oxygenation_measure` | no saturation and no arterial PaO2 |
| `indeterminate` | `saturation_not_calculated` | the saturation was refused (outside 70–100% or not a number) and no PaO2 |
| `indeterminate` | `oxygen_support_not_stated` | a normal number, nothing saying what the patient breathed |
| `indeterminate` | `adequate_on_support` | a normal number on oxygen or ventilation: what the support achieves |

| Distress | When |
|---|---|
| `present` | any of: rate ≥ 30/min, accessory muscles present, speech limited, paradoxical breathing present, cyanosis present (listed in `distressSigns`) |
| `absent` | none of those, and a measured rate under 30 |
| `not_assessed` | none of those and no rate: no rate and no sign is not an assessment |

**Gas units.** `gasUnit` is `kPa` or `mmHg`. Left out, it is inferred from the pCO2 (≤ 20 is kPa). kPa converts at 7.50062 and rounds to a tenth, so 8.0 kPa is 60.0 mmHg, at the line, not below it.

**Next**, in order: `oxygen_saturation` (no oxygenation measure), `oxygen_support` (support not stated), `room_air_saturation` (normal on supplemental oxygen only), `arterial_blood_gas` (hypercapnia not determined with failure, distress or a venous gas), `respiratory_rate` (no rate and no distress).

---

## Screen spec

**Shows:** two verdict blocks side by side, never merged. Failure: `RF_FAILURE_LABELS[failure]` with `RF_FAILURE_REASONS[failureReason]`, then hypoxaemia and hypercapnia (`RF_LIMB_LABELS`) and the arterial gas in mmHg with its disorder when present. Distress: `RF_DISTRESS_LABELS[distress]` with its `distressSigns` (`RF_SIGN_LABELS`). Below both: `notCalculated` when not empty, the `next` list (`RF_NEXT_LABELS`) and the line from `RF_CAVEAT`.

**Inputs:**

| Field | Type | Default |
|---|---|---|
| Oxygen support | select: `ENUM_FIELDS.oxygenSupport` | none |
| SpO2 (%) | number | empty |
| Respiratory rate (/min) | number | empty |
| Accessory muscles, Paradoxical breathing, Cyanosis | select: `ENUM_FIELDS.*` | none |
| Speech | select: `ENUM_FIELDS.speech` | none |
| Blood gas | select: `ENUM_FIELDS.bloodGas` | none |
| Gas unit | select: `ENUM_FIELDS.gasUnit` | none |
| pH, pO2, pCO2, HCO3 | number (`GAS_FIELDS`) | empty; shown once a blood gas type is chosen |

Group as Oxygenation, Work of breathing and Blood gas. Never preselect room air: an unstated support is a reason, not a default.

**Outputs:** `assessRespiratoryFailure(input)` → the labels above.

**Display rules:** `present` (either verdict) with warning emphasis; `absent`, `indeterminate` and `not_assessed` neutral. Never show a treatment.

**Props contract:** none. No `onData`.

---

## Synthetic patient generator

For the **Generate patient** button (`building.md` §3). Each press: pick a scenario at random, draw each value uniformly in its range, apply the couplings, round as stated. Fields not listed stay empty.

| Scenario | Oxygen support | SpO2 (%) | RR (/min) | Accessory / paradoxical / cyanosis | Speech | Arterial gas: pO2, pCO2 (mmHg), HCO3 |
|---|---|---|---|---|---|---|
| No respiratory failure | room_air | 95–99 | 12–18 | absent / absent / absent | full_sentences | none, or 85–100, 36–44, 22–26 |
| Hypoxaemic (type 1) | supplemental_oxygen | 85–91 | 24–34 | present / absent / absent | limited | 50–59, 30–38, 22–26 |
| Hypercapnic, chronic (COPD) | supplemental_oxygen | 84–90 | 22–30 | present / absent / present 1 in 3 | limited | 50–62, 55–75, 30–36 |
| Hypercapnic, acute | non_invasive_ventilation | 85–92 | 26–36 | present / present / present 1 in 2 | limited | 55–70, 60–85, 24–28 |
| Distress, gas exchange normal | room_air | 94–98 | 26–34 | present / absent / absent | limited | 80–95, 30–36, 22–26 |

Couplings: pH from Henderson–Hasselbalch, 6.1 + log10(HCO3 / (0.03 × pCO2)), with pCO2 in mmHg. Blood gas type arterial. One patient in four reports the gas in kPa: pO2 and pCO2 ÷ `MMHG_PER_KPA`, 1 decimal. Rounding: pH 2 decimals, mmHg values whole numbers.

Every generated patient is labelled "Synthetic patient" with a 4-character code, never a name. Results still come only from the lib.

## Lib Functions

- `assessRespiratoryFailure(input: RespiratoryFailureInput)` → `{ failure, failureReason, hypoxaemia, hypercapnia, distress, distressSigns, next, measured, arterialGas, notCalculated }`. Never null.
- `ENUM_FIELDS`, `GAS_FIELDS` → the selects and gas fields; `FAILURE_REASONS`, `DISTRESS_SIGNS`, `NEXT` → the closed lists.
- `RF_FAILURE_LABELS`, `RF_FAILURE_REASONS`, `RF_LIMB_LABELS`, `RF_DISTRESS_LABELS`, `RF_SIGN_LABELS`, `RF_NEXT_LABELS` → display text.
- `RESPIRATORY_FAILURE_LIMITS` → the lines (rate 30, PaO2 60, PaCO2 45 mmHg).
- `RF_CAVEAT` → show it with every result.

Numbers go in as strings (`respiratoryRate`, `oxygenSaturation`, `ph`, `po2`, `pco2`, `hco3`); findings are the exact snake_case strings; keys are camelCase.

---

## Cross-Tool Data

- **vital-signs** measures the same RR and SpO2; on a combined screen ask once and pass them in.
- **acid-base** reads the same gas; pass the same pH, pCO2 (in mmHg) and HCO3.
- **pafi** grades oxygenation by PaO2/FiO2; this tool does not read FiO2.

---

## Gotchas

- **A normal SpO2 on oxygen is not "no failure".** It is `adequate_on_support`.
- **Venous is not arterial.** A venous gas never decides hypercapnia and never enters `arterialGas`.
- **Gas numbers need `bloodGas`.** Without it they are ignored (the CLI refuses them).
- **A refused saturation is listed, not guessed around**: it goes in `notCalculated` and the verdict says `saturation_not_calculated`.

---

## CLI

```bash
medprotocol respiratory-failure --oxygen-support room_air --spo2 86 --rr 34 --accessory-muscles present
medprotocol respiratory-failure --blood-gas arterial --gas-unit kPa --ph 7.28 --po2 7.5 --pco2 8.1 --hco3 28
```

---

## Guideline Reference

Ported from medextract's respiratory-failure rule. The lines are the conventional definitions: hypoxaemic failure at PaO2 below 8 kPa (60 mmHg), hypercapnic at PaCO2 above 6 kPa (45 mmHg) with acidaemia; the distress rate of 30/min is the one BTS and CURB-65 treat as severe in an adult. No study measured this rule; quote no sensitivity or specificity for it.
