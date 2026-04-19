# Vital-Signs Component Context

## Component Summary

VitalSigns — BP (systolic/diastolic), HR, RR, temperature (C/F), SpO2, FiO2. Inline editing, FHIR R4 bundle export, abnormal value flagging.

Install: `npx medical-ui-cli add vital-signs`
Files: `vital-signs.tsx`, `types/vital-signs.ts`, `VitalSignsFhir.tsx` — shadcn: card, input, button, badge, label, popover

---

## Props

```typescript
interface VitalSignsProps {
  data?: IVitalSignsData; onData?: (data: IVitalSignsData, fhir?: FhirBundle) => void;
  editable?: boolean; assistant?: boolean; border?: boolean;
}
```

All values in `IVitalSignsData` are `number | null`. See `types/vital-signs.ts` for full type.

---

## Lib Functions

See `lib/vital-signs-validations/` (5 files). Ranges:
- **BP:** systolic 40-350, diastolic 10-130. High ≥130/90, Low <90/60
- **HR:** 30-220 bpm. Elevated >100, Low <60
- **RR:** 8-40 breaths/min. Elevated >18, Low <12
- **Temp:** C 30-45 (fever ≥38, low <35), F 86-113 (fever ≥100.4, low <95)
- **SpO2:** 70-100% (low <95, critical <90). **FiO2:** 21-100%

---

## Cross-Component Data

- **→ Sepsis:** RR, SBP, FiO2 (convert `number | null` → `String(value ?? "")`)
- **→ CKD:** BP informational for RASi dosing, not direct lib input

---

## Gotchas

- **Circular updates.** If parent passes `data` and listens to `onData`, don't re-pass same data in useEffect. Use ref-based dedup
- **Temperature units.** Stores in current unit (C/F). Normalize before cross-source use
- **FHIR bundle** is the second `onData` argument (LOINC-coded, always available)
- **overflow-hidden:** Add `overflow-visible` to wrapping Card (edit popups use absolute positioning)
- **Numeric types.** All values `number | null` — other components use strings, convert accordingly

---

## CLI

```bash
npx medprotocol vitals --bp 120/80 --hr 72 --temp 37.0
npx medprotocol vitals --bp 90/60 --hr 110 --rr 24 --temp 38.5 --spo2 92 --fio2 40
```

---

## Guideline Reference

AHA/ACC 2017 (BP), standard adult reference ranges (HR, RR, Temp), SpO2 ≥95% normal / <90% critical.
