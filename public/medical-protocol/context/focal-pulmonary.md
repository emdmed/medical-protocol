# Focal Pulmonary Module Context

Focal pulmonary syndrome: history, chest signs and imaging in, a bounded verdict out. A syndromic assessment like **chest-exam**, **volume** and **heart-failure**: findings in, a verdict out, and the rule says so when it cannot answer.

Logic: `lib/medprotocol/focal-pulmonary.ts` (uses `chest-exam.ts` for the chest signs) — import from `@/lib/medprotocol/focal-pulmonary`. Build: see `building.md`.

**What the result is.** Whether the findings point to one side of the chest, how strong pneumonia's evidence is, and which diagnoses the evidence actually supports. **Not a diagnosis and never a treatment**: `next` names a film, an examination, a saturation or a duration, never an antibiotic.

**Three streams, kept apart.** What the patient says (history), what the examiner found (chest signs, per side, in chest-exam's vocabulary) and what imaging reported are separate inputs. Pneumonia's evidence level is read off which stream a finding came from, so a film entered as a chest sign gives a wrong verdict.

---

## The rule

| Verdict | Reason | When |
|---|---|---|
| `supported` | `focal_imaging` | a current film shows a present, one-sided consolidation, effusion, atelectasis, collapse or pneumothorax |
| `supported` | `focal_signs_with_symptoms` | one side abnormal on examination, with cough, sputum, pleuritic pain, breathlessness, reported fever or a measured temperature ≥ 38 °C |
| `indeterminate` | `focal_signs_without_symptoms` | one side abnormal, no symptom stated |
| `unsupported` | `bilateral_findings` | both sides abnormal, or a bilateral current film |
| `unsupported` | `no_focal_sign` | examined, no side abnormal |
| `indeterminate` | `no_chest_evidence` | not examined and no focal current film |

The first row that matches wins. Wheeze alone does not make a side abnormal.

**Pneumonia evidence** (only from consolidation): `imaging-supported` when a current film shows consolidation; otherwise, on the focal side's consolidation signs (dull, bronchial, increased vocal resonance, crackles), `clinically-suspected` with symptoms or `physical-sign-only` without. A current film reporting no consolidation rules the examination down to `none`.

**Differential**, each only when its discriminating evidence is present, never because it is the commonest cause: pneumonia (imaging-supported or clinically-suspected), atelectasis (crackles clearing on cough, or atelectasis or collapse on film), pleural effusion (stony dull, or effusion on film), pulmonary oedema (oedema on film, or crackles on both sides).

**Conflict:** when the examination's focal side and the film's disagree, or the examination found nothing where the film did, `conflict` names both and `next` asks to re-examine. It is stated, never resolved.

- Historical films and negative films are not focal. Imaging's side wins over the chest's for `focalSide`.
- Unilateral crackles with no symptoms is `indeterminate` and names no differential.

---

## Screen spec

**Shows:** the verdict label with its reason; the focal side; the pneumonia evidence level; the differential (or "None named"); the conflict when not null; the `next` list; and the line from `FOCAL_CAVEAT`.

**Inputs:**

| Field | Type | Default |
|---|---|---|
| Cough, Reported fever, Pleuritic pain, Breathlessness | select: `HISTORY_FINDINGS.*` | none |
| Sputum | select: `HISTORY_FINDINGS.sputum` | none |
| Symptom duration (days) | number | empty |
| Temperature (°C) | number | empty |
| SpO2 (%) | number | empty |
| Chest examination, trachea, per-side signs | as in `chest-exam.md` | none |
| Imaging items (repeatable row: modality, finding, result, side, timing) | selects: `IMAGING_FINDINGS.*` | no rows |

Group the inputs as three labelled sections (History, Examination, Imaging) so a film never lands in the examination. Never preselect a finding: empty is "not stated" or "not recorded". Each imaging row needs all five selects before it counts.

**Outputs:** `assessFocalPulmonary(input)` → `FOCAL_LABELS[verdict]`, `FOCAL_REASONS[reason]`, `FOCAL_EVIDENCE_LABELS[pneumoniaEvidence]`, `FOCAL_DIFFERENTIAL_LABELS`, `FOCAL_NEXT_LABELS`.

**Display rules:** `supported` with warning emphasis; `unsupported` and `indeterminate` neutral. Show the evidence level next to "Pneumonia" whenever the differential names it. Never show a treatment.

**Props contract:** none. No `onData`.

---

## Synthetic patient generator

For the **Generate patient** button (`building.md` §3). Each press: pick a scenario at random, draw each value uniformly in its range, apply the couplings, round as stated. Fields not listed stay empty.

| Scenario | History | Temp (°C) / SpO2 (%) | Examination | Imaging |
|---|---|---|---|---|
| Lobar pneumonia | cough present, sputum purulent, fever present, pleuritic pain present, breathlessness present, 2–7 days | 38.0–39.8 / 88–95 | consolidation on one side (`chest-exam.md` sets) | chest_radiograph, consolidation, present, same side, current |
| Viral bronchitis | cough present, sputum mucoid or none, fever 1 in 2, no pleuritic pain, 2–10 days | 37.0–38.3 / 95–99 | normal both sides | chest_radiograph, normal, present, not_stated, current |
| Pleural effusion | breathlessness present, cough 1 in 2, no fever, 7–30 days | 36.5–37.5 / 91–96 | effusion on one side | chest_ultrasound or chest_radiograph, pleural_effusion, present, same side, current |
| Pneumonia, no imaging yet | as lobar pneumonia | as lobar pneumonia | consolidation on one side | no rows |

One patient in four also gets a historical imaging row (a past finding, timing `historical`), to show how timing changes the evidence. Rounding: temperature 1 decimal, SpO2 and days whole numbers.

Every generated patient is labelled "Synthetic patient" with a 4-character code, never a name. Results still come only from the lib.

## Lib Functions

- `assessFocalPulmonary(input: FocalPulmonaryInput)` → `{ verdict, reason, focalSide, pneumoniaEvidence, differential, next, conflict }`. Never null.
- `HISTORY_FINDINGS`, `IMAGING_KEYS`, `IMAGING_FINDINGS` → the selects; chest signs from chest-exam's `CHEST_EXAMINATION`, `TRACHEA`, `SIDE_FINDINGS`.
- `FOCAL_LABELS`, `FOCAL_REASONS`, `FOCAL_EVIDENCE_LABELS`, `FOCAL_DIFFERENTIAL_LABELS`, `FOCAL_NEXT_LABELS` → display text.
- `FOCAL_PULMONARY_LIMITS.feverAtLeastC` → 38 °C.
- `FOCAL_CAVEAT` → show it with every result.

Numbers go in as strings (`temperatureC`, `oxygenSaturation`, `symptomDurationDays`); findings are the exact snake_case strings; keys are camelCase.

---

## Cross-Tool Data

The per-side signs are **chest-exam**'s; on a combined screen ask for them once and pass the same `right`/`left` to both. Respiratory rate is not read here.

---

## Gotchas

- **A film is not a chest sign.** Put imaging in `imaging`, never in the side fields.
- **Reported fever is not measured fever.** "Feels feverish" goes in `reportedFever`; a thermometer reading goes in `temperatureC`.
- **SpO2 is only checked for absence** (`next: oxygen_saturation`); the value does not change the verdict.

---

## CLI

```bash
medprotocol pulmonary --cough present --temp 38.4 --right-percussion dull --right-breath-sounds bronchial
medprotocol pulmonary --left-added-sounds crackles --imaging chest_radiograph,consolidation,present,left,current
```

`--imaging` is repeatable; each takes `modality,finding,result,side,timing`.

---

## Guideline Reference

Ported from medextract's respiratory syndrome rule. The fever line (≥ 38 °C) follows NICE NG250 (pneumonia: diagnosis and management), which lists it among the signs of adult pneumonia. No study measured this rule; quote no sensitivity or specificity for it.
