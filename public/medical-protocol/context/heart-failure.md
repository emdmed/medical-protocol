# Heart Failure Module Context

Heart failure from the bedside examination: which side is congested, and whether a cardinal symptom makes that congestion the syndrome. A syndromic assessment like **shock** and **volume**: findings in, a verdict out, and the rule says so when it cannot answer.

Logic: `lib/medprotocol/heart-failure.ts` (uses `cardiology.ts` for the JVP, and types from `shock.ts` and `volume.ts`) — import from `@/lib/medprotocol/heart-failure`. Build: see `building.md`.

**What the result is.** "Left" and "right" are bedside congestion patterns — lungs congested behind the left heart, systemic veins behind the right — **not ventricular function**. Whether a ventricle is failing is the echo's question. The right-sided signs are Ibrahim's list; the rule over them was never measured, so quote no sensitivity or specificity for the verdict.

**Examination only.** BNP, the echo and the chest film are not inputs. Do not add fields for them.

---

## The rule

- **Left:** crackles at both bases, or a third heart sound not attributed to the right ventricle. Crackles at one base are a local process (a pneumonia): a chest examined and clear. `absent` needs a chest somebody listened to.
- **Right:** the neck decides alone, either way. A raised JVP over a clear chest is enough (an RV infarct). A measured height is binned by `getJVPCategory` (elevated strictly above 7 cmH2O, the one JVP line shared with shock, volume and `cardiology jvp`) and wins over the impression. Only when nobody assessed the neck do three routes make the limb present: a positive hepatojugular reflux, a pulsatile liver, or a loaded RV sign (heave, loud P2, RV gallop, TR murmur) paired with venous congestion (liver, ascites, dependent oedema). No route makes the limb absent.
- **Verdict:** `left`, `right`, `biventricular` or `no_congestion` when both limbs are decided; otherwise `indeterminate`, with `next` naming the examination that would decide it.
- **Syndrome:** congestion is heart failure only with a cardinal symptom (ESC 2021): breathlessness or leg swelling. `congestion_without_symptoms` needs both denied; silence is `symptoms_not_recorded`. Symptoms decide no side.
- A height with no reference point ("JVP 4 cm" — right atrium or sternal angle, five centimetres apart) or out of range is not used: the impression decides the neck and the height goes into `notCalculated`. The result is never null.

---

## Screen spec

**Shows:** the verdict label, the reason when indeterminate, the syndrome line, the signs behind each limb, `notCalculated` when not empty ("Check the measured JVP"), the examinations that would decide it, and the line from `HF_CAVEAT` with the sources.

**Inputs:**

| Field | Type | Default |
|---|---|---|
| Breathlessness | select: `PRESENCE` | `not_assessed` |
| Leg swelling (history) | select: `HEART_FAILURE_FINDINGS.legSwelling` | `not_assessed` |
| Crackles | select: `HEART_FAILURE_FINDINGS.crackles` | `not_assessed` |
| Third heart sound | select: `HEART_FAILURE_FINDINGS.thirdHeartSound` | `not_assessed` |
| Parasternal heave, loud P2, TR murmur, PR murmur | select: `PRESENCE` each | `not_assessed` |
| JVP impression | select: `SHOCK_FINDINGS.jvp` | `not_assessed` |
| JVP height | number, cm (string), optional | empty |
| JVP measured from | select: right atrium / sternal angle | none |
| Kussmaul's sign, hepatojugular reflux, ascites | select: `PRESENCE` each | `not_assessed` |
| Liver | select: `HEART_FAILURE_FINDINGS.hepatomegaly` | `not_assessed` |
| Peripheral oedema (examination) | select: `HEART_FAILURE_FINDINGS.peripheralOedema` | `not_assessed` |

Never preselect a finding or a reference point. Group by symptoms, chest (left), neck and right heart, then abdomen and legs.

**Outputs:** `assessHeartFailure(exam)` → label from `HF_LABELS[verdict]`, reason from `HF_REASONS[reason]`, syndrome from `HF_SYNDROME_LABELS[syndrome]`, `next` through `HF_NEXT_LABELS`.

**Display rules:** `left`, `right`, `biventricular` with warning emphasis; `no_congestion` and `indeterminate` neutral. On `right`, say a clear chest does not exclude left-sided congestion. Never write "left ventricular failure" or "right ventricular failure", and never show a treatment.

**Props contract:** none. No `onData`.

---

## Synthetic patient generator

For the **Generate random patient** button (`building.md` §3). Each press: pick a scenario at random, draw each value uniformly in its range, apply the couplings, round as stated. Fields not listed stay empty.

| Scenario | Left signs | Right signs | JVP (cm above the sternal angle) | Expected verdict |
|---|---|---|---|---|
| No heart failure | breathlessness absent or present, crackles none, third heart sound absent | oedema absent, liver absent, HJR absent, ascites absent | normal_or_low, 0–2 | no_congestion |
| Left-sided congestion | breathlessness present, crackles bilateral, third heart sound left_or_unsided 1 in 2 | oedema dependent 1 in 3, others absent | normal_or_low, 0–2 | left |
| Right-sided congestion | breathlessness present 1 in 2, crackles none | oedema dependent, hepatomegaly present (pulsatile 1 in 4), HJR present, ascites 1 in 3, loud P2 and TR murmur 1 in 2, parasternal heave 1 in 3 | elevated, 4–10 | right |
| Biventricular | as left-sided | as right-sided | elevated, 4–10 | biventricular |

Couplings: JVP impression and height agree (elevated when above 2 cm over the sternal angle: the 7 cmH2O line, `JVP_LIMITS.elevatedAboveCmH2O`, minus the 5 cm to the right atrium; the measured height wins over the impression); "measured from" is the sternal angle. Leg swelling (history) is present when peripheral oedema is dependent. One patient in four has two or three signs left `not_assessed`. Use only the options in `PRESENCE`, `HEART_FAILURE_FINDINGS` and `SHOCK_FINDINGS.jvp`.

Every generated patient is labelled "Synthetic patient" with a 4-character code, never a name. Results still come only from the lib.

## Lib Functions

- `assessHeartFailure(exam: HeartFailureExam)` → `{ verdict, reason, left, right, leftSigns, rightSigns, systemicSigns, rightVentricularSigns, symptoms, syndrome, jvp, notCalculated, next }`. Never null.
- `HEART_FAILURE_FINDINGS` → the non-presence selects; `PRESENCE` (from `volume.ts`) for the rest; `SHOCK_FINDINGS.jvp` for the impression.
- `HF_LABELS`, `HF_REASONS`, `HF_SYNDROME_LABELS`, `HF_NEXT_LABELS` → display text.
- `HF_CAVEAT` → show it with every result.

Numbers are `string`. Findings are the exact strings above.

---

## Cross-Tool Data

The JVP, crackles, S3, hepatojugular reflux, liver and oedema are the findings **volume** reads too; on a combined screen ask for them once (volume's `rales` is crackles `bilateral`). A measured height converts as `cardiology jvp` does.

---

## Gotchas

- **Not assessed is not absent.** A limb is absent only when somebody listened to the chest or looked at the neck.
- **An RV gallop is a right-sided sign**, not a left S3.
- **JVP 7 cmH2O is normal.** Elevated is strictly above 7 (`JVP_LIMITS.elevatedAboveCmH2O`).

---

## CLI

```bash
medprotocol heart-failure --breathlessness present --crackles bilateral --jvp elevated
medprotocol heart-failure --crackles none --jvp-cm 4 --jvp-ref sternal-angle
```

---

## Guideline Reference

- Ibrahim BS. Right ventricular failure (ESC e-Journal of Cardiology Practice, Vol 14, 2016): the right-heart signs. `sources.IBRAHIM_2016`
- McDonagh TA et al. 2021 ESC heart-failure guideline: the cardinal symptoms. `sources.ESC_HF_2021`
- StatPearls, Right Heart Failure: the hepatojugular reflux route. `sources.STATPEARLS_RHF`
