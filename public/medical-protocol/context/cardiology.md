# Cardiology Module Context

Three cardiovascular risk calculators: ASCVD 10-year risk (Pooled Cohort Equations 2013, superseded by PREVENT), HEART Score (chest pain triage), CHA2DS2-VASc (AF stroke risk).

Logic: `lib/medprotocol/cardiology.ts` + `cardiology-types.ts` — import from `@/lib/medprotocol/cardiology` and `@/lib/medprotocol/cardiology-types`. Build: see `building.md`.

---

## Screen spec

**Shows:** Tabs: ASCVD | HEART | CHA₂DS₂-VASc. Each tab is its own calculator with result, category badge and (HEART, CHA₂DS₂-VASc) guideline criterion.

**Interaction:** each tab: click to enter edit mode, edit, save or cancel. Results inline below inputs.

### ASCVD

| Input | Type / unit | Default |
|---|---|---|
| Age | years (40–79) | 55 |
| Sex | male / female | male |
| Race | white / aa (African American) / other | white |
| Total cholesterol | mg/dL | 213 |
| HDL cholesterol | mg/dL | 50 |
| Systolic BP | mmHg | 120 |
| On BP treatment | toggle | off |
| Diabetes | toggle | off |
| Smoker | toggle | off |

Outputs: 10-year risk % (`calculateASCVD`), category (`getASCVDCategory`), color (`getASCVDSeverity`). Show "Unknown" when age is outside 40–79. Label the result "Pooled Cohort Equations 2013 (superseded by PREVENT)".

### HEART

Five criteria, each a 0/1/2 choice (Segmented Control or Radio), all default 0:

| Criterion | 0 | 1 | 2 |
|---|---|---|---|
| History | Slightly suspicious | Moderately suspicious | Highly suspicious |
| ECG | Normal | Non-specific changes | Significant ST deviation |
| Age | < 45 | 45-64 | ≥ 65 |
| Risk factors | No known factors | 1-2 risk factors | ≥ 3 or history of atherosclerosis |
| Troponin | ≤ normal limit | 1-3× normal limit | > 3× normal limit |

Outputs: score 0–10, category, action, color.

### CHA₂DS₂-VASc

Checkboxes, all default off: CHF, hypertension, age ≥75 (+2), diabetes, stroke/TIA (+2), vascular disease, age 65–74, female sex. Age ≥75 and 65–74 are mutually exclusive.

Outputs: score 0–9, category, action, color (all sex-aware).

**Props contract:** `data?: { ascvd?: Partial<ASCVDInputs>; heart?: Partial<HEARTInputs>; chadsvasc?: Partial<CHADSVAScInputs> }` — merged over the defaults, read once on mount. No `onData`.

---

## Lib Functions

Types in `cardiology-types.ts`: `ASCVDInputs`, `HEARTInputs` (each field `0 | 1 | 2`), `CHADSVAScInputs`.

- **ASCVD:** `calculateASCVD(inputs: ASCVDInputs)` → `string | null` (% risk, 1 decimal; null outside age 40-79 or missing labs). `getASCVDCategory(risk)` → Low (<5) / Borderline (5–7.4) / Intermediate (7.5–19.9) / High (≥20) / Unknown. `getASCVDSeverity(risk)` → low / borderline / intermediate / high / default.
- **HEART:** `calculateHEARTScore(inputs)` → 0-10. `getHEARTCategory(score)` → Low (0–3) / Moderate (4–6) / High (7–10). `getHEARTAction(score)` → HEART pathway text for the risk band. `getHEARTSeverity(score)` → low / moderate / high.
- **CHA2DS2-VASc:** `calculateCHADSVASc(inputs)` → 0-9. `getCHADSVAScCategory(score, isFemale)` → Low / Low-Moderate / Moderate-High. `getCHADSVAScAction(score, isFemale)` → anticoagulation guideline criterion. `getCHADSVAScSeverity(score, isFemale)`.
- **JVP:** `calculateJVPcmH2O(value, reference)` → cmH2O above the right atrium (`reference` is `"right-atrium"` or `"sternal-angle"`, which adds `JVP_LIMITS.sternalAngleToRightAtriumCm` = 5), 1 decimal; null for a non-number or outside 0-40. `getJVPCategory(cmH2O)` → Normal / Elevated. `getJVPSeverity(cmH2O)` → normal / elevated. Elevated is strictly above `JVP_LIMITS.elevatedAboveCmH2O` = 8.

ASCVD numeric inputs are `string` (parsed via `safeParseFloat`). `race: "other"` uses white coefficients.

---

## Cross-Tool Data

- **← Patient:** age, sex (ASCVD; CHA₂DS₂-VASc female/age boxes)
- SBP from vital-signs could inform ASCVD but no programmatic link

---

## Gotchas

- **ASCVD age range:** 40-79 only, returns `null` outside
- **ASCVD model is superseded.** `calculateASCVD` is the 2013 Pooled Cohort Equations. The ACC estimator now defaults to PREVENT and marks the pooled cohort equations as no longer supported (2026 ACC/AHA dyslipidemia guideline). PREVENT is not in the lib; say so on the screen
- **CHA2DS2-VASc sex:** female sex adds 1 point; thresholds are sex-specific (female score 1 = Low, male score 1 = Low-Moderate). Always pass `isFemale`
- **JVP 8 cmH2O is Normal.** McGee's line (more than 3 cm above the sternal angle, i.e. more than 8 cmH2O to the right atrium) is strictly above. Only a measured height is classified; an examiner's "raised" or "flat" is not an input
- **Two JVP lines on purpose.** Shock and volume bin JVP at 7 cmH2O (Vazquez 2010, `binJvp`); this sub-command uses McGee's 8. Don't merge them

---

## CLI

```bash
medprotocol cardiology ascvd --age 55 --sex male --tc 213 --hdl 50 --sbp 120
medprotocol cardiology heart --history 1 --ecg 1 --age 2 --risk 1 --troponin 0
medprotocol cardiology chadsvasc --chf --htn --age75 --diabetes --stroke
medprotocol cardiology jvp --cmh2o 9
medprotocol cardiology jvp --sternal-angle 4   # 4 + 5 = 9 cmH2O
```

---

## Guideline Reference

ACC/AHA 2013 Pooled Cohort (ASCVD; superseded by PREVENT in the 2026 ACC/AHA dyslipidemia guideline), Six et al. 2008 (HEART), Lip et al. 2010 / ESC 2020 (CHA2DS2-VASc), McGee, Evidence-Based Physical Diagnosis (JVP; a textbook, no DOI). Citations with DOI: `sources.PCE_2013`, `HEART_2008`, `CHADSVASC_2010`.
