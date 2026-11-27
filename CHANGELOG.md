# Changelog

One entry per release, newest first, written for the doctors and developers who use the plugin. Releases before 1.5.0 are in the git tags.

## 1.7.0 — 2026-11-27

- **For learning and prototyping only:** every screen shows "Learning prototype — not for patient care." and uses synthetic data only. Real patient data, deployment and links to clinical systems are out of scope. Skills, hooks and the CLI say "user", not "doctor".
- **Generate random patient** on every clinical screen (Generate patients on list screens), with Clear. Each press makes a new synthetic patient with credible values from the module's generator section. Screens can also let you choose the results first, then generate a patient that has them. The syndromic rules' generators keep a patient only when the rule agrees with its scenario.
- **New `syndromic-page` skill and `medprotocol syndromic --serve`** (port 7333): a local page that makes a synthetic patient for the six bedside rules, at random or with the results you choose (each list always offers "Any" and its "no"). It drafts the patient's note as ED shorthand or a written outpatient note, which you can copy or save as a text file, and shows what each rule says beside the note.
- **New `cases` skill:** eleven synthetic worked cases to guess, enter and see explained.
- **New `demo` skill:** checks each screen, generates a patient on it, saves screenshots and a walkthrough in `demo/`, all on your computer.
- **Building:** clarification asks what the prototype imagines (setting, one patient or a list, persistence). After a build only a quick check runs; browser QA runs when you ask or before a demo. Checks use the port `npm run dev` prints, and text must read in both light and dark themes.

## 1.6.1 — 2026-11-27

- **Extraction page, syndromic tab:** rules whose findings point away from their syndrome are grouped as "Not supported by the findings stated", no longer "Not present". The note may leave findings out, so a rule never rules a syndrome out.
- **Scope:** the README lists what Medical Protocol is not for: any real patient's care (chart review and audit included), real patient notes, triage, emergencies, diagnosis or treatment.

## 1.6.0 — 2026-11-26

- **New bedside syndromic assessments**, each a quick-calculator command and a screen spec, routed by the new syndromic workflow. All are examination patterns, not diagnoses, and say "indeterminate" (with what would settle it) when signs are missing:
  - `shock`: shock category from skin temperature and JVP.
  - `volume`: volume overload from congestion signs (examination subset of Framingham).
  - `heart-failure`: left- and right-sided congestion, and whether the heart failure syndrome is present (a cardinal symptom).
  - `chest`: per-side chest examination syndromes (consolidation, pleural effusion, atelectasis, pneumothorax) and a whole-chest bronchial obstruction pattern.
  - `pulmonary`: focal pulmonary syndrome from history, chest signs and imaging, with a pneumonia evidence level (physical sign only, clinically suspected, imaging-supported) and a conflict line when examination and film disagree.
  - `respiratory-failure`: two separate reads, failure (gas exchange, SpO2 or arterial gas in mmHg or kPa) and distress (work of breathing).
- **JVP:** new `cardiology jvp` converts a height above the sternal angle or right atrium to cmH2O. One cut-point for every command: elevated means above 7 cmH2O.
- **Routing:** "respiratory failure" goes to `pafi` only with a PaO2/FiO2 ratio or ARDS; otherwise to `respiratory-failure`.
- **Extraction:** accepts creatinine in µmol/L, hemoglobin and albumin in g/L, PaO2 and pCO2 in kPa, ACR in mg/mmol, and an FiO2 from 0.21 to 1 as a fraction. Values are passed on as the note states them and converted only for a calculator. Findings the note denies ("no fever") are marked `absent: true` and listed apart. Examination findings feed the syndromic rules, and the extraction page gains a syndromic evaluation tab.
- **CKD:** an ACR in mg/mmol is staged against KDIGO's mg/mmol cut-offs (3 and 30); `ckd stage`, `kfre` and `treatment` take `--acr-unit`.

## 1.5.1 — 2026-11-24

- **Diabetes, type 1 vs type 2:** `--on-insulin` is removed. It never changed the result. Passing it now gives a one-line error.
- **Blood gas:** the summary of a compensated or overcompensated disorder reads "compensated by …" / "overcompensated by …". It used to read "with Compensated by …".
- **Internal:** unused code removed from the logic copied into your project (a few type names and exports nothing used). The quick calculator's commands share one flag parser and one table printer; what they print is unchanged, checked command by command (`scripts/compare-cli.sh`, `qa/recipes/refactor-cli.md`).

## 1.5.0 — 2026-11-24

- **Vital signs:** dangerous values are now marked as critical. `vitals --bp 190/125` used to read "High", the same as 150/95; it now reads "Hypertensive crisis, critical". The same applies to heart rate, respiratory rate and temperature, and `--json` gains `severity` and `alert`.
- **Privacy guards:** a very large command or file (over about 100 KB) could pass the privacy, extraction and note-consent guards unchecked. Fixed.
- **Quick calculator:** a mistyped flag gives a one-line error, not a crash dump.
- **Plugin only:** the clone installer and the provider layer are removed. Install from the plugin marketplace. The full privacy and quality-checklist documents now ship with every skill.
- **Internal:** shared error and sub-command helpers in the CLI, one `Severity` type, and a CLI QA recipe (`qa/recipes/cli.md`).
