# Nephrology Component Context

## Component Summary

CKDEvaluator — eGFR (CKD-EPI 2021), CGA staging, KFRE risk, treatment eligibility (RASi, SGLT2i, finerenone), progression monitoring.

Install: `npx medical-ui-cli add ckd`
Files: `ckd-evaluator.tsx`, `lib.ts`, `types/ckd.ts` — shadcn: card, input, button, badge, label, separator, select

**Companion — Nephrology** (separate install):
- **Anemia** — sex-specific Hb (KDIGO 2012), iron status, ESA eligibility
- **PhosphoCalcic** — Ca/P/PTH/VitD, CKD-MBD monitoring by GFR category
- **CardioMetabolic** — LDL, HbA1c, BP, triglycerides

```bash
npx medical-ui-cli add nephrology        # GROUP — installs ckd/ + nephrology/
npx medical-ui-cli add ckd               # CKD only
npx medical-ui-cli add anemia            # ALIAS — nephrology/ folder
npx medical-ui-cli add phospho-calcic    # ALIAS — nephrology/ folder
npx medical-ui-cli add cardio-metabolic  # ALIAS — nephrology/ folder
```

**IMPORTANT:** Nephrology is a **separate** component — do NOT modify `ckd-evaluator.tsx` to add anemia or MBD logic.

---

## Props

```typescript
// CKD
interface CKDProps { data?: CKDPatientData; onData?: (data: CKDPatientData) => void; }
// Anemia
interface AnemiaProps { data?: AnemiaReading[]; onData?: (data: AnemiaReading[]) => void; sex?: string; }
// PhosphoCalcic
interface PhosphoCalcicProps { data?: PhosphoCalcicReading[]; onData?: (data: PhosphoCalcicReading[]) => void; gfrCategory?: string; }
```

See `types/ckd.ts` and `nephrology/types/interfaces.ts` for full type definitions.

---

## Lib Functions

See `lib/ckd.ts` for all signatures. Key functions: `calculateEGFR`, `classifyGFRCategory`, `classifyAlbuminuriaCategory`, `calculateKFRE`, `checkRASiEligibility`, `checkSGLT2iEligibility`, `checkFinerenoneEligibility`, `calculateEGFRSlope`, `classifyAnemia`, `assessIronStatus`, `checkESAEligibility`, `assessPhosphate`, `correctCalcium`, `assessPTH`, `assessVitaminD`, `getCKDMBDMonitoring`.

Nephrology component has mirror functions in `nephrology/lib.ts` using local `sf()` parser.

All inputs are `string` (parsed internally via `safeParseFloat`).

---

## Cross-Component Data

- **CKD ↔ Vital-Signs:** BP informational for RASi dosing context, not a direct lib input
- **CKD ↔ Acid-Base:** Bicarbonate relevant for metabolic acidosis, no programmatic link
- **CKD ↔ Sepsis:** Both use creatinine but different contexts (chronic vs acute)

---

## Composition

Wire `sex` from CKDPatientData → Anemia (enables sex-specific Hb thresholds). Wire `gfrCategory` from latest CKD reading → PhosphoCalcic (enables stage-aware PTH + monitoring frequency). Use grid layout for dashboard.

### Gotchas

- **CKD uses strings everywhere.** Convert from other components: `String(value ?? "")`
- **No circular loops.** Guard `onData` → `data` flows with `useRef` + serialized comparison
- **Inbound sync required.** CKD evaluator (and all nephrology sub-components) must have a `useEffect` that syncs the `data` prop into local state after mount — otherwise parent updates (age/sex from Patient card) are ignored after initial render
- **KFRE requires eGFR, not creatinine.** Calculate eGFR first
- **Wire `sex` to Anemia** — without it, falls back to generic classification
- **Wire `gfrCategory` to PhosphoCalcic** — without it, PTH uses generic ranges
- Treatment eligibility is **informational** — always confirm clinically

---

## CLI

```bash
npx medprotocol ckd egfr --creatinine 1.2 --age 55 --sex male
npx medprotocol ckd stage --creatinine 1.2 --age 55 --sex male --acr 45
npx medprotocol ckd kfre --age 65 --sex female --egfr 35 --acr 300
npx medprotocol ckd anemia --hb 9.5 --sex male --ferritin 80 --tsat 15
npx medprotocol ckd mbd --phosphate 5.2 --calcium 8.5 --albumin 3.2 --pth 250 --vitamin-d 18 --gfr-category G4
```

---

## Guideline Reference

KDIGO 2024 (CKD), KDIGO 2012 (Anemia), KDIGO 2017 (CKD-MBD): CKD-EPI 2021 race-free eGFR, GFR G1-G5, Albuminuria A1-A3, KFRE (Tangri), RASi/SGLT2i/Finerenone eligibility, eGFR slope, sex-specific Hb, iron/ESA, Ca/P/PTH/VitD monitoring.
