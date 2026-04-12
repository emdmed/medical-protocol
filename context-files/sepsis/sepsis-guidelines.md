# Surviving Sepsis Campaign: International Guidelines 2026

> **Source:** Prescott HC et al. *Critical Care Medicine* 2026;54(4):725-812.
> Also published in *Intensive Care Medicine*. DOI: 10.1097/CCM.0000000000007075
> **Endorsed by:** 24 professional societies | 69 panelists from 23 countries (38% LMIC)

## Overview

The 2026 SSC guidelines update the 2021 edition with **129 statements** (46 new), covering prehospital through post-discharge sepsis care. Recommendations use GRADE methodology:

| Strength | Language | Meaning |
|----------|----------|---------|
| **Strong** | "We recommend..." | Benefits clearly outweigh risks; most patients should receive this |
| **Conditional** | "We suggest..." | Benefits probably outweigh risks; consider patient-specific factors |
| **Good Practice** | "In our practice..." | Expert consensus, no formal evidence grading |

---

## Guideline Sections

This guideline is organized into 8 context files for chunked retrieval:

| # | Section | File | Key Topics |
|---|---------|------|------------|
| 1 | [Screening & Diagnosis](../../docs/sepsis-guidelines/01-screening-diagnosis.md) | `01-screening-diagnosis.md` | Screening tools, biomarkers, blood cultures, code sepsis protocols |
| 2 | [Antimicrobial Therapy](../../docs/sepsis-guidelines/02-antimicrobial-therapy.md) | `02-antimicrobial-therapy.md` | Timing, empiric coverage, de-escalation, antifungals, beta-lactam infusion |
| 3 | [Hemodynamics & Fluid Resuscitation](../../docs/sepsis-guidelines/03-hemodynamics-fluids.md) | `03-hemodynamics-fluids.md` | Crystalloid volume/type, MAP targets, lactate, capillary refill, fluid removal |
| 4 | [Vasopressors & Inotropes](../../docs/sepsis-guidelines/04-vasopressors-inotropes.md) | `04-vasopressors-inotropes.md` | Norepinephrine, vasopressin, epinephrine, dopamine, beta-blockers |
| 5 | [Ventilation & Respiratory Support](../../docs/sepsis-guidelines/05-ventilation-respiratory.md) | `05-ventilation-respiratory.md` | HFNC, NIV, ARDS management, tidal volume, PEEP, prone positioning, ECMO |
| 6 | [Adjunctive Therapies](../../docs/sepsis-guidelines/06-adjunctive-therapies.md) | `06-adjunctive-therapies.md` | Corticosteroids, vitamin C, immunoglobulins, blood purification, glucose control |
| 7 | [Supportive Care](../../docs/sepsis-guidelines/07-supportive-care.md) | `07-supportive-care.md` | VTE prophylaxis, stress ulcer prophylaxis, RRT, nutrition, transfusion, sedation |
| 8 | [Post-Acute & Discharge Care](../../docs/sepsis-guidelines/08-post-acute-care.md) | `08-post-acute-care.md` | Medication reconciliation, discharge planning, rehab, mental health, follow-up |

---

## Quick-Reference: Major Changes from 2021

### Upgraded / New Recommendations
- **Fluid volume:** Now recommends at least 30 mL/kg crystalloid in first 3 hours (was less specific)
- **MAP in elderly:** New conditional recommendation for 60-65 mmHg in patients >=65 years
- **Beta-lactam infusion:** Prolonged infusion recommended over bolus (new)
- **HFNC:** Now suggested over conventional O2 and over NIV as initial therapy
- **Fluid removal:** Active fluid removal recommended after acute resuscitation (new)
- **POCUS:** New conditional recommendation for point-of-care ultrasound
- **Screening tools:** NEWS/NEWS2/MEWS/SIRS recommended over qSOFA for hospital screening
- **Prehospital antibiotics:** New recommendation for definite/probable sepsis with hypotension and >=60 min transport
- **Post-discharge care:** Expanded section on rehabilitation, mental health, and follow-up services

### Recommendations Against (New or Reinforced)
- Beta-blockers for septic shock
- IV vitamin C
- Vitamin D therapy
- Probiotics
- Antipyretics for outcome improvement
- Blood purification therapies
- Empirical antifungal without risk factors

---

## Agent Composition Guide

### Guideline-to-Code Mapping

Load **only** the section matching the current clinical domain. Do not build features for recommendations that lack corresponding functions in `lib/sepsis.ts`.

| Guideline Section | `lib/sepsis.ts` Functions | Component Surface | Code Coverage |
|---|---|---|---|
| 1 — Screening & Diagnosis | `calculateQSOFA()`, `isQSOFAPositive()` | qSOFA inputs (RR, SBP, GCS), positive/negative badge | Partial — qSOFA only; NEWS/MEWS/SIRS not implemented |
| 2 — Antimicrobial Therapy | `assessBundleCompliance()` (antibiotics item) | Bundle checklist: "Antibiotics given" toggle + timestamp | Partial — timing tracked, no drug selection logic |
| 3 — Hemodynamics & Fluids | `calculateCardiovascularSOFA()`, `assessBundleCompliance()` (fluid item), `calculateLactateClearance()`, `isLactateClearanceAdequate()` | MAP input, fluid bolus toggle, lactate trend chart | High — MAP thresholds, lactate clearance, bundle fluid item |
| 4 — Vasopressors & Inotropes | `calculateCardiovascularSOFA()`, `hasVasopressors()`, `assessSepticShock()` | Vasopressor dose inputs (dopamine, dobutamine, epi, norepi) | High — dose-based SOFA scoring and shock detection |
| 5 — Ventilation & Respiratory | `calculateRespirationSOFA()` | PaO2, FiO2, ventilation toggle | Partial — PaO2/FiO2 ratio only; no HFNC/NIV/PEEP logic |
| 6 — Adjunctive Therapies | — | — | None — no backing code |
| 7 — Supportive Care | `calculateRenalSOFA()`, `calculateCoagulationSOFA()` | Creatinine, urine output, platelets inputs | Partial — organ scoring only; no RRT/VTE/nutrition logic |
| 8 — Post-Acute & Discharge | — | — | None — no backing code |

### Rules for Agents

1. **Only load what you need.** If the task involves vasopressor UI, read `04-vasopressors-inotropes.md` — skip unrelated sections.
2. **Do not invent features beyond the code surface.** Sections 6 and 8 have no backing functions — display guideline text as reference only, never wire up interactive calculators for them.
3. **Use guidelines to inform UI decisions, not to override code logic.** Example: guideline 1.3 suggests NEWS over qSOFA for screening, but the component only implements qSOFA. Show a clinical note referencing the recommendation; do not build a NEWS calculator unless explicitly requested.
4. **Map thresholds to the correct functions.** When a guideline mentions a threshold (e.g., MAP 60-65 for elderly, lactate >2 for shock), verify it matches the corresponding `lib/sepsis.ts` function before surfacing it in the UI.
5. **Respect recommendation strength in UI tone.** Strong recommendations ("We recommend") warrant prominent alerts. Conditional recommendations ("We suggest") should appear as softer suggestions or tooltips, not hard warnings.

---

## How to Use These Files

**For Claude Code workflows:** When building sepsis-related components, reference the specific section file relevant to the clinical domain. The section files contain recommendation-level detail with strength of evidence ratings. Always check the **Agent Composition Guide** above to verify code coverage before composing UI for a guideline recommendation.

**For clinical reference:** Each section is self-contained and can be read independently. Cross-references between sections are noted where relevant.
