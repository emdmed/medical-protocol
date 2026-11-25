# Shock Module Context

Shock category from the bedside examination of a hypotensive patient: skin temperature by jugular venous pressure (JVP). The first syndromic assessment: findings in, a pattern out, and the rule says so when it cannot answer.

Logic: `lib/medprotocol/shock.ts` — import from `@/lib/medprotocol/shock`. Build: see `building.md`.

**What the result is.** A bedside heuristic from a pilot study of 68 patients, right in 76% of them. It is a pattern to check against the rest of the picture, never a diagnosis. Say "septic pattern", not "septic shock".

---

## The rule

Only for systolic below 90 mmHg lasting at least 30 minutes. Outside that, the result is `indeterminate`.

| Skin | JVP | Category |
|---|---|---|
| warm | normal or low | `septic` |
| cool | elevated | `cardiogenic` |
| cool | normal or low | `hypovolemic` |
| warm | elevated | `indeterminate` (the study assigns no category) |
| either not assessed | | `indeterminate` |

- A measured JVP is elevated strictly above 7 cmH2O. The examiner's impression wins over a measured height when both are given.
- Capillary refill, pulse volume and the lung exam **never change the category**. They are reported as `supporting` or `discordant`. A discordant finding means the rule may not fit this patient: always show it.
- Obstructive shock is not a category: the study had no such patients, and it raises the JVP like cardiogenic shock does.

---

## Screen spec

**Shows:** the category label, the reason when indeterminate, the supporting and discordant findings, and the line "Bedside heuristic (76% accurate in its study). Not a diagnosis." with the source.

**Inputs:**

| Field | Type | Default |
|---|---|---|
| Systolic BP | number, mmHg (string) | empty |
| Hypotension duration | number, minutes (string) | empty |
| Skin temperature | select: `SHOCK_FINDINGS.skin` | `not_assessed` |
| JVP | select: `SHOCK_FINDINGS.jvp` | `not_assessed` |
| JVP measured | number, cmH2O (string), optional | empty |
| Capillary refill | select: `SHOCK_FINDINGS.capillaryRefill` | `not_assessed` |
| Pulse volume | select: `SHOCK_FINDINGS.pulseVolume` | `not_assessed` |
| Lung exam | select: `SHOCK_FINDINGS.lungExam` | `not_assessed` |

Every select defaults to `not_assessed`. Never preselect a finding.

**Outputs:** `classifyShock(exam)` → label from `SHOCK_LABELS[category]`, reason text from `SHOCK_REASONS[reason]`, the `jvp` it used, `supporting`, `discordant`. A null result means a number is unusable: show "Check the systolic, the duration and the measured JVP" and no category.

**Display rules:** all four categories use neutral emphasis: none is "better". Show discordant findings with warning emphasis. Never show a treatment or a next step.

**Props contract:** `data?: { systolic?: string }` (read once on mount). No `onData`.

---

## Lib Functions

- `classifyShock(exam: ShockExam)` → `ShockAssessment | null`: `{ category, reason, jvp, supporting, discordant }`. Null when the systolic is not a number above 0, or the duration or measured JVP is not a number ≥ 0.
- `binJvp(jvp, cmH2O)` → the JVP category after binning a measured height.
- `SHOCK_FINDINGS` → the allowed values of each finding; use it for the selects.
- `SHOCK_LIMITS` → `{ systolicBelow: 90, minutesAtLeast: 30, jvpElevatedAboveCmH2O: 7 }`.
- `SHOCK_LABELS`, `SHOCK_REASONS` → display text for a category and for an indeterminate reason.
- `SHOCK_CAVEAT` → the "bedside heuristic, 76%, not a diagnosis" line; show it with every result.
- `SHOCK_SUGGESTS` → which category a secondary finding points at, keyed `finding:value` (`"lungExam:bilateral_crackles"` → `cardiogenic`).

Numbers are `string`. Findings are the exact strings in `SHOCK_FINDINGS`.

---

## Cross-Tool Data

From a note: the **extraction** module hands on the systolic, the duration, a measured JVP and the five findings (`extraction.md` § Examination findings), and the local extraction page draws the result as a table. Systolic BP can also come from **vital-signs**. Coexists with **sepsis** (SOFA, Sepsis-3) with no programmatic link: a `septic` pattern here is not a Sepsis-3 result.

---

## Gotchas

- **Unknown duration declines.** No duration is `indeterminate`, not "assume sustained".
- **Systolic 90 is outside.** The cohort is below 90.
- **JVP 7 cmH2O is normal.** Elevated is strictly above 7.
- **Not assessed is not normal.** A finding nobody examined stays `not_assessed`.

---

## CLI

```bash
medprotocol shock --sbp 82 --minutes 45 --skin cool --jvp elevated
```

---

## Guideline Reference

Vazquez R, Gheorghe C, Kaufman D, Manthous CA. Accuracy of bedside physical examination in distinguishing categories of shock: a pilot study (J Hosp Med 2010;5:471-474). 68 patients hypotensive for more than 30 minutes: 37 septic, 18 cardiogenic, 13 hypovolemic; 52 classified correctly. Citation with DOI: `sources.VAZQUEZ_2010`.
