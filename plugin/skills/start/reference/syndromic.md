# Syndromic Assessment Workflow

Bedside findings, from a note or typed in, fed to six rules. Each rule names a syndrome and the findings behind it. None of them is a diagnosis.

## Prerequisites

Check for `.clinical-context.md` in the project root.
- **If found:** Read it. Adapt specialty, practice type and patient population throughout this workflow.
- **If not found:** Proceed with defaults. After Phase 4, mention once: "Tip: Run /medical-protocol:preferences to save your clinical preferences — specialty, units, and guidelines will apply automatically to every tool."

---

## The assessments, in order

Run them in this order, each only when its findings are there. Read each module doc (`context/{module}.md`) before using it: the rule, its limits and the Screen spec.

| # | Assessment | Module doc | CLI | Fed by |
|---|---|---|---|---|
| 1 | Shock category | `shock.md` | `medprotocol shock` | systolic below 90, skin, neck veins, capillary refill, pulse volume, chest auscultation |
| 2 | Volume overload | `volume.md` | `medprotocol volume` | neck veins, crackles, S3, hepatojugular reflux, ankle edema, hepatomegaly, effusion |
| 3 | Heart failure | `heart-failure.md` | `medprotocol heart-failure` | breathlessness, leg swelling, crackles, S3, RV signs, neck veins (or a measured height), liver, ascites, edema |
| 4 | Chest examination | `chest-exam.md` | `medprotocol chest` | trachea and, per side, expansion, percussion, breath sounds, added sounds, vocal resonance |
| 5 | Focal pulmonary syndrome | `focal-pulmonary.md` | `medprotocol pulmonary` | cough, sputum, fever, pleuritic pain, the chest signs of 4, imaging, temperature, SpO2 |
| 6 | Respiratory failure and distress | `respiratory-failure.md` | `medprotocol respiratory-failure` | oxygen support, SpO2, respiratory rate, distress signs, blood gas |

Beside them, not in the chain: **qSOFA** (`medprotocol sepsis qsofa`, `workflows/sepsis.md`) when the note has respiratory rate, systolic pressure and mental status. It is prognostic, not a screen for sepsis on its own.

A measured neck is elevated strictly above 7 cmH2O in every rule (`JVP_LIMITS.elevatedAboveCmH2O`, also `medprotocol cardiology jvp`).

---

## Phase 1: Clinical Requirements

Ask the doctor:

- "Should I read the findings from a clinical note, or will you enter them?" (Default: from a note)

Do NOT ask about thresholds, which findings count, or technical preferences.

### From a clinical note

1. Run the extract skill on the note (`../extract/SKILL.md`), with its privacy steps. Its `exam` output (`extraction.md` § Examination findings) carries the findings every rule reads, and the extraction page's "Syndromic evaluation" tab draws one card per rule the note gives a finding for. Imaging and symptom duration are not extracted: add them by hand for focal pulmonary.
2. Run each assessment from the table whose findings the note states, with `--json`. A finding the note does not state is left out, which the rule reads as not assessed. Never infer a finding from a diagnosis, a lab or imaging, and never carry one rule's verdict into another's input.
3. Tell the doctor, per assessment: the verdict, each finding with the words it came from, the findings not in the note, anything listed under `notCalculated`, and the rule's caveat line.

Build a screen only if the doctor asks for one.

---

## Phase 2: Build the Screen

Follow **Building a Screen** from the main protocol (building.md) for each module the doctor wants, from the Screen spec in its `context/{module}.md`. A combined screen shows one panel per assessment, in the order above.

**The screen renders only what the rules returned and recomputes nothing.** Every verdict, reason, sign list and label comes from the lib functions copied to `@/lib/medprotocol/` (`classifyShock`, `assessVolume`, `assessHeartFailure`, `assessChestExam`, `assessFocalPulmonary`, `assessRespiratoryFailure`) and their `*_LABELS` / `*_CAVEAT` exports. No count, threshold or side is worked out in the component.

---

## Phase 3: Build Page

Create `app/syndromic/page.tsx` (or `app/{module}/page.tsx` for a single assessment). Wrap in `ErrorBoundary`. Update `app/page.tsx` with a link to it.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your syndromic assessment screen is ready. Enter what you found on examination; each panel names the syndrome its rule points to and the findings behind it. These are bedside heuristics, not diagnoses. View it at http://localhost:3000/syndromic"

---

## NEVER

- Call a result a diagnosis, or drop a rule's caveat line
- Fill in a finding the note does not state, or recompute a verdict in the screen
