# Sepsis Module Context

SOFA-2 scoring (Ranzani et al., JAMA 2025; 6 organs, 0-24), qSOFA (0-3, prognostic — not a screening tool on its own per SSC 2026; screen with NEWS/NEWS2, MEWS or SIRS), Sepsis-3 assessment, septic shock detection, hour-1 bundle tracker, lactate clearance.

Logic: `lib/medprotocol/sepsis.ts` — import from `@/lib/medprotocol/sepsis`. Build: see `building.md`.

---

## Screen spec

**Shows:**
- **Header:** patient weight (kg) and baseline SOFA (0–24), click to edit
- **Current status:** qSOFA (positive when ≥2; label it prognostic, never "sepsis screen"), total SOFA `/24` with severity level, SOFA delta vs baseline, Sepsis and Septic shock badges
- **SOFA-2 breakdown:** six organ scores (respiratory, hemostasis, liver, cardiovascular, brain, kidney). Label the score "SOFA-2".
- **Hour-1 bundle:** start button (records start time), 5 checkboxes (lactate measured, blood cultures, antibiotics, fluid bolus, vasopressors), elapsed timer, compliance badge
- **Lactate clearance:** first vs latest reading, % with adequate/inadequate badge
- **Reading history:** compact table (SOFA + qSOFA per reading), sticky header, horizontal scroll

**Add reading** (form, strings unless noted, timestamp = now in unix seconds):

| Organ / group | Fields (unit) |
|---|---|
| Respiratory | PaO2 (mmHg), FiO2 (% 21–100), SpO2 (% — used only without PaO2 and when <98), advanced respiratory support (toggle: HFNC, CPAP, BiPAP/NIV or invasive ventilation), ECMO (toggle) |
| Coagulation | Platelets (×10³/µL) |
| Liver | Bilirubin (mg/dL) |
| Cardiovascular | MAP (mmHg), dopamine, dobutamine, epinephrine, norepinephrine base (µg/kg/min, infusion ≥1 h), other vasopressor e.g. vasopressin (toggle), mechanical circulatory support (toggle) |
| Brain | GCS (3–15; if sedated, last GCS before sedation), drugs to treat delirium (toggle) |
| Kidney | Creatinine (mg/dL), urine output (mL for the period; scored per mL/kg/h and hours), receiving RRT (toggle, incl. chronic; not RRT for non-renal reasons), potassium (mmol/L), pH, bicarbonate (mmol/L) — the last three for RRT criteria |
| Context | Ceiling of treatment / support unavailable (toggle) |
| Screening | Respiratory rate (breaths/min), SBP (mmHg) |
| Lactate | Lactate (mmol/L) |
| Infection | Suspected infection (toggle), source (text) |

**Interaction:** kidney SOFA-2 uses hours since the previous reading (fallback 1); urine criteria need ≥6 h of collection and the patient weight. Missing values score 0. Bundle elapsed time uses `Date.now() / 1000`.

**Display rules:** SOFA color from `getSOFASeverity`; label from `getSOFASeverityLevel`. Do not build UI for guideline recommendations lacking backing functions in `sepsis.ts`.

**Props contract:** `data?: SepsisPatientData`, `onData?: (data: SepsisPatientData) => void` (fires on every change).

```typescript
interface SepsisReading {
  id: string; timestamp: number;                       // unix seconds
  paO2: string; fiO2: string; advancedRespiratorySupport: boolean; ecmo?: boolean; spO2?: string;
  platelets: string; bilirubin: string;
  map: string; dopamine: string; dobutamine: string; epinephrine: string; norepinephrine: string;
  otherVasopressor?: boolean; mechanicalCirculatorySupport?: boolean; deliriumDrugs?: boolean;
  gcs: string; creatinine: string; urineOutput: string;
  onRRT?: boolean; potassium?: string; pH?: string; bicarbonate?: string; ceilingOfTreatment?: boolean;
  respiratoryRate: string; sbp: string; lactate: string;
  suspectedInfection: boolean; infectionSource: string;
  trace?: TraceEntry[];
}
interface Hour1Bundle {
  lactateMeasured: boolean; bloodCulturesObtained: boolean; antibioticsGiven: boolean;
  fluidBolusGiven: boolean; vasopressorsStarted: boolean;
  bundleStartTime: number | null;                      // unix seconds
}
interface SepsisPatientData { weight: string; baselineSOFA: string; readings: SepsisReading[]; hour1Bundle: Hour1Bundle; }
```

---

## Synthetic patient generator

For the **Generate random patient** button (`building.md` §3). Each press: pick a scenario at random, draw each value uniformly in its range, apply the couplings, round as stated. Fields not listed stay empty.

**Generate random patient** creates the header and 2–3 readings 2–6 hours apart. Weight 50–110 kg; baseline SOFA 0 (1–2 with chronic disease, 1 in 4); suspected infection on; source from: pneumonia, urinary tract, abdominal, skin and soft tissue.

| Scenario | PaO2/FiO2 | Platelets | Bilirubin | MAP / vasopressor | GCS | Creatinine | Lactate |
|---|---|---|---|---|---|---|---|
| Infection, no organ dysfunction | 320–450 | 160–350 | 0.3–1.1 | 75–95, none | 15 | 0.6–1.1 | 0.8–1.8 |
| Sepsis | 200–300 | 100–150 | 1.2–2.5 | 65–75, none | 13–15 | 1.2–2.5 | 2.0–3.5 |
| Septic shock | 100–250 (advanced support 1 in 2) | 50–120 | 1.5–4.0 | 58–65 on norepinephrine 0.1–0.5 µg/kg/min | 10–14 | 1.8–4.0 | 2.5–8.0 |

Couplings: PaO2 = ratio × FiO2 ÷ 100 with FiO2 from 21, 28, 35, 40, 50, 60; SBP = MAP + 20–35 and DBP = (3 × MAP − SBP) ÷ 2, so MAP matches; RR 18–24 (sepsis), 22–34 (shock); urine output for 6 hours: ≥ 0.5 mL/kg/h without shock, 0.2–0.5 with it. Later readings either improve (lactate down 15–40%, MAP up, vasopressor down) or worsen (lactate down < 10% or up); pick one per patient. Rounding: bilirubin, creatinine, lactate 1 decimal; vasopressor 2 decimals; others whole numbers.

Every generated patient is labelled "Synthetic patient" with a 4-character code, never a name. Results still come only from the lib.

## Lib Functions

All numeric inputs are `string` (parsed internally via `safeParseFloat`).

- Organ SOFA-2 (0–4 each):
  - `calculateRespirationSOFA(paO2, fiO2, advancedSupport, ecmo?, spO2?, ceilingOfTreatment?)` — P/F >300→0, ≤300→1, ≤225→2, ≤150+support→3, ≤75+support→4; ECMO→4; max 2 without support. S/F cut-offs 300/250/200/120.
  - `calculateCoagulationSOFA(platelets)` — >150→0, ≤150→1, ≤100→2, ≤80→3, ≤50→4
  - `calculateLiverSOFA(bilirubin)` — ≤1.2→0, ≤3→1, ≤6→2, ≤12→3, >12→4
  - `calculateCardiovascularSOFA(map, dopamine, dobutamine, epinephrine, norepinephrine, otherVasopressor?, mechanicalSupport?, ceilingOfTreatment?)` — NE+E ≤0.2→2, >0.2–0.4→3, >0.4→4; other vasopressor/inotrope alone→2, +low-dose→3, +medium-dose→4; mechanical support→4; dopamine-only ≤20/≤40/>40 → 2/3/4; no drugs MAP <70→1; MAP-only 60/50/40 cut-offs under a ceiling of treatment
  - `calculateCNSSOFA(gcs, deliriumDrugs?)` — 15→0, 13–14→1, 9–12→2, 6–8→3, 3–5→4; delirium drugs ≥1
  - `calculateRenalSOFA(creatinine, urineOutput, weight, hours, onRRT?, potassium?, pH?, bicarbonate?)` — Cr ≤1.2→0, ≤2.0→1, ≤3.5→2, >3.5→3; UO <0.5 mL/kg/h 6–12 h→1, ≥12 h→2; <0.3 ≥24 h or anuria ≥12 h→3; RRT or RRT criteria→4
- `calculateTotalSOFA(reading: SOFAReading, weight, hours)` → 0–24; `calculateSOFADelta(current: number, baseline: string)`
- `getSOFASeverityLevel(score)` → Low (≤5) / Moderate (≤10) / High (≤15) / Very High; `getSOFASeverity(score)` → normal / warning / critical
- `calculateQSOFA(respiratoryRate, sbp, gcs)` → 0–3 (RR ≥22, SBP ≤100, GCS <15); `isQSOFAPositive(score)` — ≥2
- `assessSepsis(sofaScore, sofaDelta, suspectedInfection)` — infection + SOFA rise ≥2 from baseline (baseline 0 if unknown, so a known chronic baseline is not counted)
- `hasVasopressors(dopamine, dobutamine, epinephrine, norepinephrine, otherVasopressor?)` — dobutamine (inotrope) does not count
- `assessSepticShock(hasSepsis, vasopressorsNeeded, lactate)` — sepsis + vasopressors + lactate >2
- `assessBundleCompliance(bundle, currentTime)` → `{ complete, allItemsDone, withinTimeLimit, pending, timeLimitMinutes }`. Optional bundle context: `hypotension`, `initialLactate`, `persistentHypotension`, `possibleSepsisWithoutShock`. Fluids are required only with hypotension or lactate ≥4; vasopressors only if hypotension persists after fluids; 60 min limit (180 min for possible sepsis without shock). Omitted context keeps the item required. Show `pending` items.
- `calculateLactateClearance(initial, repeat)` → % or null; `isLactateClearanceAdequate(clearance)` — ≥10%

---

## Cross-Tool Data

- **← Patient:** weight (kg)
- **Sepsis ↔ Vital-Signs:** RR → `respiratoryRate`, SBP → `sbp`, FiO2 → `fiO2` (convert: `String(value ?? "")`)
- **Sepsis ↔ Water-Balance:** both track fluid status; urine output feeds renal SOFA
- **Sepsis ↔ PaFi:** Both use PaO2/FiO2 but independently (SOFA vs ARDS)
- **Sepsis ↔ Acid-Base/DKA:** No data sharing, can coexist on dashboard

---

## Gotchas

- **Strings everywhere.** Convert `number | null` from other tools: `String(value ?? "")`
- **No circular loops.** Guard `onData` → `data` with `useRef` + serialized comparison
- **Hour-1 bundle uses Unix timestamps** (seconds): `Date.now() / 1000`

---

## CLI

```bash
medprotocol sepsis qsofa --rr 24 --sbp 90 --gcs 13
medprotocol sepsis sofa --pao2 60 --fio2 40 --vent --platelets 80 --bilirubin 2.5 --map 62 --norepi 0.08 --gcs 14 --creatinine 1.8 --urine-output 400 --weight 70 --hours 24
medprotocol sepsis lactate --initial 4.2 --repeat 2.1
```

---

## Guideline Reference

Sepsis-3 (JAMA 2016, `sources.SEPSIS_3_2016`). SOFA-2 (`sources.SOFA_2_2025`), SSC 2026 guidelines (`sources.SSC_2026`); no DOI found for these two. Chunked docs in `docs/sepsis-guidelines/01-08` — load only the section matching the current task. Do not build UI for guideline recommendations lacking backing functions in `lib/medprotocol/sepsis.ts`.
