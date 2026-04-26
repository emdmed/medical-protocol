# Component Registry

## Available Tools

| Tool | What it does |
|---|---|
| patient | Patient demographics — name, DOB, age, sex, weight, height |
| vital-signs | Monitor BP, HR, RR, Temp, SpO2, FiO2 |
| acid-base | Arterial blood gas analysis with anion gap |
| water-balance | Fluid intake/output tracking |
| bmi | Body mass index calculator |
| pafi | PaO2/FiO2 ratio with ARDS classification |
| dka | DKA monitoring (glucose, ketones, K+, GCS) |
| cardiology | ASCVD, HEART Score, CHA2DS2-VASc |
| ckd | eGFR, KDIGO staging, KFRE risk prediction |
| nephrology | CKD anemia, CKD-MBD, cardio-metabolic panels |
| sepsis | SOFA, qSOFA, septic shock, hour-1 bundle |
| dashboard | Combined overview of multiple tools |
| modify | Modify layout, add/remove fields |
| troubleshoot | Fix errors, blank screens, broken UI |
| test | Verify calculations and run QA |
| calc | Quick terminal-based calculations |
| preferences | Configure doctor preferences and specialty |
| protocol-audit | Audit protocol quality and compliance |

---

## Component Reference

Run `npx medical-ui-cli list` for the canonical list of available components, groups, and sub-component aliases. The CLI resolves names in order: group → alias → standard folder.

**Base group:** `npx medical-ui-cli add base` (or alias `patient`) installs the patient demographics component.

Each installed component folder contains a JSDoc header in its main TSX file documenting props, usage, data flow, and behavior -- read this before modifying.

---

## Component Dependencies

The CLI does **not** auto-install dependent components -- you must install them separately:

- `patient` provides age, sex, weight, height to other components. When both `patient` and a dependent component (ckd, dka, sepsis, water-balance, cardiology, bmi) are on the same dashboard, wire patient data into them instead of duplicating inline fields.
- `dka` depends on `acid-base` -- install acid-base first
- `sepsis` depends on `vital-signs` and `water-balance`
- `nephrology` is a companion to `ckd` -- the `nephrology` group installs both. Wire `sex` from CKD to Anemia, `gfrCategory` from CKD to PhosphoCalcic.
- Other components are self-contained

---

## Component Installation

Components are installed via the `medical-ui-cli` -- same model as shadcn/ui. The CLI copies component files into the doctor's project and installs shadcn dependencies automatically.

**CLI commands:**
```
npx medical-ui-cli list              # Show all available components
npx medical-ui-cli add <component>   # Install a component + shadcn deps
npx medical-ui-cli debug             # Diagnostic info
```

**Prerequisite:** The doctor's project must have `components.json` (shadcn config) in the root.

### Post-Installation

1. **Install shared components**: The CLI does **not** auto-install shared components (`medical-disclaimer.tsx`, `layout-disclaimer.tsx`, `error-boundary.tsx`). After installing, check the component's imports -- if it references any of these shared files that don't exist in the project, create them as simple React components following the patterns in the installed code.
2. **Handle missing imports**: After installation, check the component's imports for modules that aren't available in the project:
   - **shadcn hook or component** (e.g. `@/hooks/use-mobile`) -- create it using standard shadcn patterns or install via `npx shadcn@latest add`
   - **Another installable component** (e.g. `@/components/water-balance/water-balance`) -- install it via `npx medical-ui-cli add {name}`
   - **Project-specific UI variant** (e.g. `@/components/ui/textarea-inv`) -- create it as a thin wrapper around the standard shadcn component
