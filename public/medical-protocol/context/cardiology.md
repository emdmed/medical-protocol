# Cardiology Component Context

## Component Summary

CardiologyCalculator — three cardiovascular risk calculators: ASCVD 10-year risk (Pooled Cohort Equations), HEART Score (chest pain triage), CHA2DS2-VASc (AF stroke risk).

Install: `npx medical-ui-cli add cardiology`
Files: `cardiology-calculator.tsx`, `lib.ts`, `types/cardiology.ts` — shadcn: card, input, button, badge, label, separator, select, checkbox

---

## Props

Self-contained — no props, no data flow. Three internal sub-calculators with tabs/sections.

---

## Lib Functions

See `lib/cardiology.ts` and `lib/cardiology-types.ts` for interfaces.

- **ASCVD:** `calculateASCVD(inputs)` → % risk or null. `getASCVDCategory` → Low/Borderline/Intermediate/High. Valid ages 40-79.
- **HEART:** `calculateHEARTScore(inputs)` → 0-10. `getHEARTCategory` → Low/Moderate/High. `getHEARTAction` → clinical action.
- **CHA2DS2-VASc:** `calculateCHADSVASc(inputs)` → 0-9. `getCHADSVAScCategory(score, isFemale)` → Low/Moderate/High.

All numeric inputs are `string` (parsed via `safeParseFloat`).

---

## Cross-Component Data

Self-contained. SBP from vital-signs could inform ASCVD but no programmatic link.

---

## Gotchas

- **No data prop, no onData.** Purely self-contained
- **ASCVD age range:** 40-79 only, returns `null` outside
- **CHA2DS2-VASc sex:** `isFemale` adds 1 point but doesn't change low-risk anticoagulation threshold

---

## CLI

```bash
npx medprotocol cardiology ascvd --age 55 --sex male --tc 213 --hdl 50 --sbp 120
npx medprotocol cardiology heart --history 1 --ecg 1 --age 2 --risk 1 --troponin 0
npx medprotocol cardiology chadsvasc --chf --htn --age75 --diabetes --stroke
```

---

## Guideline Reference

ACC/AHA 2013 Pooled Cohort (ASCVD), Six et al. 2008 (HEART), Lip et al. 2010 / ESC 2020 (CHA2DS2-VASc).
