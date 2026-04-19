# PaFi Component Context

## Component Summary

PaFiCalculator — PaO2/FiO2 ratio with Berlin criteria ARDS classification and FiO2 presets for oxygen delivery devices.

Install: `npx medical-ui-cli add pafi`
Files: `pafi-calculator.tsx` — shadcn: card, input, button, badge, label

---

## Props

Self-contained — no props, no data flow.

---

## Lib Functions

See `lib/pafi.ts`. Three functions: `calculatePaFi(paO2, fiO2)` → ratio or null, `getPaFiClassification(paFi)` → Normal/>300, Mild/200-300, Moderate/100-200, Severe/<100, `getPaFiSeverity(paFi)` → normal/warning/critical.

FiO2 entered as percentage (21-100), not fraction. All inputs `string`.

---

## Cross-Component Data

Self-contained. Uses PaO2 (arterial), not SpO2 (peripheral). Coexists with sepsis (both use PaO2/FiO2) but no programmatic link.

---

## Gotchas

- **No data prop, no onData.** Self-contained
- **FiO2 as percentage.** Enter 40 for 40%, not 0.4
- **PaO2 vs SpO2.** Different measurements — PaFi uses arterial blood gas

---

## CLI

```bash
npx medprotocol pafi --pao2 60 --fio2 40
```

---

## Guideline Reference

Berlin Definition of ARDS (2012): PaO2/FiO2 with PEEP ≥5 cmH2O. Mild 200-300, Moderate 100-200, Severe <100.
