# Tool Registry

## Available Tools

| Tool | What it does |
|---|---|
| patient | Synthetic patient card — label and code, age, sex, weight, height |
| vital-signs | Monitor BP, HR, RR, Temp, SpO2, FiO2 |
| acid-base | Arterial blood gas analysis with anion gap |
| water-balance | Fluid intake/output tracking |
| bmi | Body mass index calculator |
| pafi | PaO2/FiO2 ratio with Berlin oxygenation range |
| dka | DKA monitoring (glucose, ketones, K+, GCS) |
| cardiology | ASCVD, HEART Score, CHA2DS2-VASc |
| ckd | eGFR, KDIGO staging, KFRE risk prediction |
| nephrology | CKD anemia, CKD-MBD, cardio-metabolic panels |
| sepsis | SOFA, qSOFA, septic shock, hour-1 bundle |
| shock | Shock category from the bedside examination (skin temperature by JVP) |
| volume | Volume overload from the bedside examination (congestion signs; no BNP, film or echo) |
| heart-failure | Heart failure from the bedside examination (left or right congestion; not ventricular function) |
| chest-exam | Chest examination syndromes, one side at a time (consolidation, effusion, atelectasis, pneumothorax; no imaging) |
| focal-pulmonary | Focal pulmonary syndrome from history, chest signs and imaging (pneumonia evidence level, differential; no treatment) |
| respiratory-failure | Respiratory failure (gas exchange) and distress (work of breathing), two separate verdicts; no treatment |
| diabetes-dx | ADA diabetes diagnosis, T1D staging, T1 vs T2, T2D/GDM screening |
| hepatology | MASLD/MASH screening: FIB-4, LSM/ELF, referral |
| extraction | Values pulled from a clinical note, each quote checked and highlighted in the note (no analysis) |
| dashboard | Combined overview of multiple tools |
| modify | Modify layout, add/remove fields |
| troubleshoot | Fix errors, blank screens, broken UI |
| test | Verify calculations and run QA |
| calc | Quick terminal-based calculations |
| cases | Synthetic worked cases to practise with, or to use as labelled demo data |
| demo | Screenshots and a walkthrough of the prototype with synthetic cases, saved locally in demo/ |
| preferences | Configure user preferences and specialty |
| protocol-audit | Audit protocol quality and compliance |
| overlay | The one overlay entry point: wires the dev overlay if missing, otherwise processes every queued selection |
| overlay-setup | Start the overlay server and wire the dev-only overlay `<script>` tag into any app |
| overlay-audit | Audit a region selected in the dev overlay against protocol guidance (drains an "audit" work order; works on untagged apps) |
| overlay-implement | Retrofit a medical-protocol component into a region selected in the dev overlay, staged as an approved diff (drains an "implement" work order) |

---

## Tool → Logic → Context

Clinical logic lives in `lib/medprotocol/` in the user's project (copied from the plugin). Import from `@/lib/medprotocol/<module>`. Each generated screen goes in `components/medprotocol/<tool>/<tool>.tsx`.

| Tool | Lib module file(s) in `lib/medprotocol/` | Context doc |
|---|---|---|
| patient | `patient.ts` | `patient.md` |
| vital-signs | `vital-signs-validations/` (`severity.ts` + one file per vital) | `vital-signs.md` |
| acid-base | `acid-base/` (`analyze.ts`, `interfaces.ts`, `index.ts`) | `acid-base.md` |
| water-balance | `water-balance.ts` | `water-balance.md` |
| bmi | `bmi.ts` | `bmi.md` |
| pafi | `pafi.ts` | `pafi.md` |
| dka | `dka.ts` + `acid-base/` | `dka.md` |
| cardiology | `cardiology.ts`, `cardiology-types.ts` | `cardiology.md` |
| ckd | `ckd.ts` | `nephrology.md` |
| nephrology | `nephrology.ts` (+ `ckd.ts`) | `nephrology.md` |
| sepsis | `sepsis.ts` | `sepsis.md` |
| shock | `shock.ts` | `shock.md` |
| volume | `volume.ts` + `shock.ts` | `volume.md` |
| heart-failure | `heart-failure.ts` + `cardiology.ts`, `cardiology-types.ts`, `shock.ts`, `volume.ts` | `heart-failure.md` |
| chest-exam | `chest-exam.ts` | `chest-exam.md` |
| focal-pulmonary | `focal-pulmonary.ts` + `chest-exam.ts` | `focal-pulmonary.md` |
| respiratory-failure | `respiratory-failure.ts` + `acid-base/`, `units.ts`, `vital-signs-validations/` | `respiratory-failure.md` |
| diabetes-dx | `diabetes-dx.ts`, `endocrine.ts` | `diabetes.md` |
| hepatology | `hepatology.ts` | `hepatology.md` |
| extraction | `extraction.ts` | `extraction.md` |
| dashboard | any of the above | `composition.md` |

Shared by all: `utils/safeParseFloat.ts`, `sources.ts` (guideline citations), `trace.ts` (calculation audit trail), `severity.ts` (shared `Severity` type).

---

## Data Dependencies

Tools that share data. Wire them with props (see `composition.md`) instead of asking for the same value twice.

- **patient** provides age, sex, weight, height. When patient and a dependent tool (ckd, nephrology, cardiology, diabetes-dx, hepatology, dka, sepsis, water-balance, bmi) share a dashboard, pass patient fields down instead of duplicating inline fields.
- **dka** uses **acid-base**: it calls `analyze()` on each reading. Both modules are always copied together.
- **volume** imports `binJvp` from **shock**: copy `shock.ts` with `volume.ts`.
- **heart-failure** imports the JVP from **cardiology** and types from **shock** and **volume**: copy `cardiology.ts`, `cardiology-types.ts`, `shock.ts` and `volume.ts` with it.
- **respiratory-failure** calls **acid-base**'s `analyze()` on an arterial gas and **vital-signs**' SpO2 validation: copy `acid-base/`, `units.ts` and `vital-signs-validations/` with it.
- **sepsis** uses **vital-signs** (RR, SBP, FiO2 → qSOFA / respiration SOFA) and **water-balance** (urine output, fluid status).
- **nephrology** is a companion to **ckd**. Wire `sex` from CKD to Anemia, `gfrCategory` (latest CKD reading) to PhosphoCalcic and CardioMetabolic, plus `age`, `hasDiabetes`, `hasPriorCVD`, `hasKidneyTransplant` to CardioMetabolic.
- **diabetes-dx** uses `diabetes-dx.ts` for the diagnosis screen and `endocrine.ts` for the sub-screens (T1D staging, T1 vs T2, T2D screening, GDM screening). The tool name is `diabetes-dx`, not `diabetes`.
- Other tools are self-contained.

---

## How to Build

Follow `building.md`: copy the logic, set up UI SDK, generate each screen from its module's **Screen spec**, verify against the CLI.
