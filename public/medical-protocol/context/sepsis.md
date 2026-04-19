# Sepsis Component Context

## Component Summary

SepsisMonitor — SOFA scoring (6 organs, 0-24), qSOFA screening (0-3), Sepsis-3 assessment, septic shock detection, hour-1 bundle tracker, lactate clearance.

Install: `npx medical-ui-cli add sepsis`
Files: `sepsis-monitor.tsx`, `lib.ts`, `types/sepsis.ts` — shadcn: card, input, button, badge, label, separator, checkbox

---

## Props

```typescript
interface SepsisProps { data?: SepsisPatientData; onData?: (data: SepsisPatientData) => void; }
```

See `types/sepsis.ts` for `SepsisReading`, `Hour1Bundle`, `SepsisPatientData`.

---

## Lib Functions

See `lib/sepsis.ts` for all signatures. Key functions: `calculateTotalSOFA`, `calculateQSOFA`, `assessSepsis`, `assessSepticShock`, `assessBundleCompliance`, `calculateLactateClearance`, organ-specific SOFA (`calculateRespirationSOFA`, `calculateCoagulationSOFA`, `calculateLiverSOFA`, `calculateCardiovascularSOFA`, `calculateCNSSOFA`, `calculateRenalSOFA`).

All inputs are `string` (parsed internally via `safeParseFloat`).

---

## Cross-Component Data

- **Sepsis ↔ Vital-Signs:** RR → `respiratoryRate`, SBP → `sbp`, FiO2 → `fiO2` (convert: `String(value ?? "")`)
- **Sepsis ↔ PaFi:** Both use PaO2/FiO2 but independently (SOFA vs ARDS)
- **Sepsis ↔ Acid-Base/DKA:** No data sharing, can coexist on dashboard

---

## Gotchas

- **Strings everywhere.** Convert `number | null` from other components: `String(value ?? "")`
- **No circular loops.** Guard `onData` → `data` with `useRef` + serialized comparison
- **Hour-1 bundle uses Unix timestamps** (seconds): `Date.now() / 1000`
- **AcidBase fires `onData(null)` on mount.** Guard: `if (!result) return`
- **overflow-hidden:** Add `overflow-visible` to wrapping Card

---

## CLI

```bash
npx medprotocol sepsis qsofa --rr 24 --sbp 90 --gcs 13
npx medprotocol sepsis sofa --pao2 60 --fio2 40 --vent --platelets 80 --bilirubin 2.5 --map 62 --norepi 0.08 --gcs 14 --creatinine 1.8 --urine-output 400 --weight 70 --hours 24
npx medprotocol sepsis lactate --initial 4.2 --repeat 2.1
```

---

## Guideline Reference

SSC 2026 guidelines. Chunked docs in `docs/sepsis-guidelines/01-08` — load only the section matching the current task. Do not build UI for guideline recommendations lacking backing functions in `lib/sepsis.ts`.
