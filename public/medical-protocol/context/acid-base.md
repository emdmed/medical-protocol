# Acid-Base Component Context

## Component Summary

AcidBase — ABG analysis: primary disorder classification, anion gap (albumin-corrected), delta ratio, Henderson-Hasselbalch consistency, compensatory response.

Install: `npx medical-ui-cli add acid-base`
Files: `acid-base.tsx`, `lib.ts`, `types/interfaces.ts` — shadcn: card, input, button, badge, label, separator

---

## Props

```typescript
interface AcidBaseProps { onData?: (result: Result | null) => void; }
// Output-only (no data prop). Inputs: pH, pCO2, HCO3, Na, Cl, Albumin (all strings).
```

See `types/interfaces.ts` for `Values`, `Result`.

---

## Lib Functions

See `lib/acid-base/analyze.ts`. Single entry point: `analyze({ values, isChronic })` → full analysis object (disorder, compensation, AG, corrected AG, delta ratio, HH consistency, all disorders) or `null`.

All inputs are `string` (parsed internally via `safeParseFloat`). Na, Cl, Albumin are optional (AG/delta ratio will be `null` without them).

---

## Cross-Component Data

- **→ DKA:** DKA imports `analyze()` at code level (install acid-base first)
- **↔ Sepsis/CKD:** No direct sharing, can coexist on dashboard

---

## Gotchas

- **Fires `onData(null)` on mount.** Always guard: `if (!result) return`
- **Output-only.** No `data` prop — cannot pre-fill values
- **overflow-hidden:** Add `overflow-visible` to wrapping Card

---

## CLI

```bash
npx medprotocol abg --ph 7.25 --pco2 29 --hco3 14
npx medprotocol abg --ph 7.30 --pco2 25 --hco3 12 --na 140 --cl 105 --albumin 4.0
```

---

## Guideline Reference

Winter's formula, AG = Na-(Cl+HCO3) corrected for albumin, delta-delta ratio, Henderson-Hasselbalch. Disorders: metabolic/respiratory acidosis/alkalosis.
