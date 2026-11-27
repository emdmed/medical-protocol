# Chest Examination Module Context

Chest examination syndromes: the classic semiology table, one side at a time. A syndromic assessment like **shock**, **volume** and **heart-failure**: findings in, a verdict out, and the rule says so when it cannot answer.

Logic: `lib/medprotocol/chest-exam.ts` — import from `@/lib/medprotocol/chest-exam`. Build: see `building.md`.

**What the result is.** A bedside pattern per side. Consolidation is what pneumonia, infarction and tumour all produce, so the verdict names a syndrome, **never a cause**.

**Examination only.** No history, no vital sign and no imaging. A film reporting consolidation is not a bedside consolidation, and a chest nobody examined is `not_examined` whatever its film says. Do not add fields for imaging.

---

## The rule

Each side is read alone; the first row that matches wins.

| Syndrome | Signs |
|---|---|
| Pneumothorax | hyperresonant, breath sounds reduced or absent, trachea not pulled toward the side |
| Pleural effusion | stony dull, trachea not pulled toward the side |
| Consolidation | dull (or percussion not recorded) with bronchial breathing or increased vocal resonance |
| Atelectasis | dull, breath sounds reduced or absent, trachea pulled toward the side |

- **Whole-chest patterns** sit beside the sides: wheeze on both sides is `bronchial_obstruction`, crackles on both sides is `diffuse_crackles` (interstitial disease and pulmonary oedema both make it; the table does not split them). Crackles that clear on cough are not diffuse crackles.
- **No row, nothing abnormal** (or only what a pattern explains) is `no_syndrome`: "No focal syndrome", not "normal", since a side under diffuse crackles has one.
- **No row, something abnormal** is `indeterminate`, with the signs nothing explains (`unexplained`) and, when a row waits only on an unrecorded sign, that sign (`unrecorded`, reason `sign_not_recorded`); otherwise reason `no_row_explains`. A trachea pulled toward an effusion or a pneumothorax is a collapse sign the table cannot weigh: `indeterminate`.
- It says less than it could: crackles alone on one side, a dull quiet side with the trachea central, and a hyperresonant side with no breath sounds recorded are all `indeterminate`, never the commonest cause.
- **Not examined:** a side with no sign recorded, or `examination` anything but `performed`. Left out, the signs decide.

---

## Screen spec

**Shows:** one card per side with the verdict label, and when indeterminate the reason, the unexplained signs and each "would be {syndrome} if {sign} {values}" line; the whole-chest patterns when not empty; and the line from `CHEST_CAVEAT`.

**Inputs:**

| Field | Type | Default |
|---|---|---|
| Examination | select: `CHEST_EXAMINATION` | none (the signs decide) |
| Trachea | select: `TRACHEA` | none |
| Right / Left: Expansion | select: `SIDE_FINDINGS.expansion` | none |
| Right / Left: Percussion | select: `SIDE_FINDINGS.percussion` | none |
| Right / Left: Breath sounds | select: `SIDE_FINDINGS.breathSounds` | none |
| Right / Left: Added sounds | select: `SIDE_FINDINGS.addedSounds` | none |
| Right / Left: Vocal resonance | select: `SIDE_FINDINGS.vocalResonance` | none |

Never preselect a sign: an empty select is "not recorded", which the rule reads differently from `normal` or `resonant`. Lay the two sides out as two labelled columns (Right, Left), with the trachea above them.

**Outputs:** `assessChestExam(exam)` → per side `CHEST_LABELS[verdict]`, `CHEST_REASONS[reason]`, signs through `CHEST_SIGN_LABELS`; patterns through `CHEST_PATTERN_LABELS`.

**Display rules:** a focal syndrome with warning emphasis; `no_syndrome`, `indeterminate` and `not_examined` neutral. Never name a cause (pneumonia, tumour) and never show a treatment.

**Props contract:** none. No `onData`.

---

## Synthetic patient generator

For the **Generate patient** button (`building.md` §3). Each press: pick a scenario at random, draw each value uniformly in its range, apply the couplings, round as stated. Fields not listed stay empty.

Examination is `performed`. Pick one side for the focal syndrome (right or left); the other side gets the normal set.

| Scenario | Trachea | Expansion | Percussion | Breath sounds | Added sounds | Vocal resonance |
|---|---|---|---|---|---|---|
| Normal (both sides) | central | normal | resonant | vesicular | none | normal |
| Consolidation | central | reduced | dull | bronchial | crackles | increased |
| Pleural effusion | central (deviated away when large, 1 in 4) | reduced | stony_dull | reduced or absent | none | reduced |
| Collapse (atelectasis) | deviated toward the side | reduced | dull | reduced | none | reduced |
| Pneumothorax | central (deviated away, 1 in 4) | reduced | hyperresonant | reduced or absent | none | reduced |

Couplings: "deviated toward" the right side is `deviated_right`, away from it is `deviated_left`. One patient in four has one or two signs left unset, to show an incomplete examination. Use only the options in `SIDE_FINDINGS`, `TRACHEA` and `CHEST_EXAMINATION`.

Every generated patient is labelled "Synthetic patient" with a 4-character code, never a name. Results still come only from the lib.

## Lib Functions

- `assessChestExam(exam: ChestExam)` → `{ right, left, patterns }`, each side `{ verdict, reason, unexplained: {sign, value}[], unrecorded: {syndrome, sign, values}[] }`. Never null.
- `CHEST_EXAMINATION`, `TRACHEA`, `SIDES`, `SIDE_FIELDS`, `SIDE_FINDINGS` → the selects.
- `CHEST_LABELS`, `CHEST_PATTERN_LABELS`, `CHEST_REASONS`, `CHEST_SIGN_LABELS` → display text.
- `CHEST_CAVEAT` → show it with every result.

Findings are the exact snake_case strings above; keys are camelCase.

---

## Cross-Tool Data

Crackles on both sides are the bilateral rales **volume** and **heart-failure** read; on a combined screen ask for the added sounds once.

---

## Gotchas

- **Not recorded is not normal.** A side with only `resonant` percussion is examined and `no_syndrome`; a side with nothing is `not_examined`.
- **Right and left are the patient's.**
- **Stony dull is not dull.** Stony dull is the effusion; dull is consolidation or collapse.

---

## CLI

```bash
medprotocol chest --right-percussion dull --right-breath-sounds bronchial --left-percussion resonant
medprotocol chest --trachea deviated_left --left-percussion dull --left-breath-sounds absent
```

---

## Guideline Reference

The classic bedside semiology table as encoded in medextract's respiratory syndrome rule. No study measured this rule; quote no sensitivity or specificity for it.
