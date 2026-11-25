# Volume Module Context

Volume overload from the bedside examination: a count of congestion signs. A syndromic assessment like **shock**: findings in, a verdict out, and the rule says so when it cannot answer.

Logic: `lib/medprotocol/volume.ts` (uses `shock.ts` for the JVP) — import from `@/lib/medprotocol/volume`. Build: see `building.md`.

**What the result is.** The part of the Framingham heart-failure criteria that a physical examination can produce. That subset was never validated on its own, so quote no Framingham sensitivity or specificity for it. It is a pattern to check against the rest of the picture, never a diagnosis.

**Examination only.** BNP, the chest film and the echo are not inputs. Do not add fields for them, and do not let them change the verdict.

---

## The rule

Overload is **two majors**, or **one major and two minors**.

| Major | Minor |
|---|---|
| Elevated JVP | Bilateral ankle edema |
| Bilateral rales | Hepatomegaly |
| S3 gallop | Pleural effusion (on examination) |
| Hepatojugular reflux | |

- A measured JVP is elevated strictly above 7 cmH2O (shock's cut-point, through `binJvp`). The examiner's impression wins over a measured height when both are given.
- Crackles at one base are `absent`: the major is bilateral rales.
- Signs not assessed can only add. A count that reaches the threshold is `overload` whatever is missing. Below it, the verdict is `no_overload` only if every unassessed sign counted as present still would not reach it; otherwise `indeterminate`, with the signs that would settle it in `pivotal`.
- Nothing assessed is `indeterminate` (`no_exam_documented`).

---

## Screen spec

**Shows:** the verdict label, the reason when indeterminate, the pivotal signs ("Assess these to settle it"), and the line from `VOLUME_CAVEAT` with the source.

**Inputs:**

| Field | Type | Default |
|---|---|---|
| JVP | select: `SHOCK_FINDINGS.jvp` | `not_assessed` |
| JVP measured | number, cmH2O (string), optional | empty |
| Bilateral rales | select: `PRESENCE` | `not_assessed` |
| S3 gallop | select: `PRESENCE` | `not_assessed` |
| Hepatojugular reflux | select: `PRESENCE` | `not_assessed` |
| Bilateral ankle edema | select: `PRESENCE` | `not_assessed` |
| Hepatomegaly | select: `PRESENCE` | `not_assessed` |
| Pleural effusion | select: `PRESENCE` | `not_assessed` |

Every select defaults to `not_assessed`. Never preselect a finding. Group the four majors apart from the three minors.

**Outputs:** `assessVolume(exam)` → label from `VOLUME_LABELS[status]`, reason text from `VOLUME_REASONS[reason]`, `pivotal`. A null result means the measured JVP is unusable: show "Check the measured JVP" and no verdict.

**Display rules:** `overload` with warning emphasis; `no_overload` and `indeterminate` neutral. Write `no_overload` as "No volume overload on examination", never "euvolemic". Never show a treatment or a next step.

**Props contract:** none. No `onData`.

---

## Lib Functions

- `assessVolume(exam: VolumeExam)` → `VolumeAssessment | null`: `{ status, reason, pivotal }`. Null when the measured JVP is not a number ≥ 0.
- `PRESENCE` → `present | absent | not_assessed`; use it for the selects. JVP uses `SHOCK_FINDINGS.jvp`.
- `MAJOR_FINDINGS`, `MINOR_FINDINGS` → the exam keys in each group.
- `VOLUME_LIMITS` → `{ majorForPositive: 2, majorWithMinors: 1, minorsWithOneMajor: 2 }`.
- `VOLUME_LABELS`, `VOLUME_REASONS` → display text for a status and for an indeterminate reason.
- `VOLUME_CAVEAT` → the "examination subset, not validated, not a diagnosis" line; show it with every result.

Numbers are `string`. Findings are the exact strings above.

---

## Cross-Tool Data

The JVP is the same finding **shock** reads; on a combined screen, ask for it once. Coexists with **water-balance** (charted intake and output) with no programmatic link: a positive fluid balance is not overload here.

---

## Gotchas

- **Not assessed is not absent.** A sign nobody examined stays `not_assessed`.
- **`no_overload` is not euvolemia.** It means the count fell short, not that volume is normal.
- **JVP 7 cmH2O is normal.** Elevated is strictly above 7 (shock's Vazquez line). This is deliberately a different line from `cardiology jvp`, which uses McGee's strictly above 8 cmH2O; don't merge them.

---

## CLI

```bash
medprotocol volume --jvp elevated --crackles present
```

---

## Guideline Reference

McKee PA, Castelli WP, McNamara PM, Kannel WB. The natural history of congestive heart failure: the Framingham study (N Engl J Med 1971;285:1441-1446). The full criteria include radiograph, symptom, catheter, vital-capacity, weight and heart-rate items; this module keeps only the examination signs. Citation with DOI: `sources.MCKEE_1971`.
