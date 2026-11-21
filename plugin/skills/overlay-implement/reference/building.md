# Building a Clinical Screen

Every clinical screen has two layers. Keep them apart.

| Layer | What it is | Where it comes from | Who may change it |
|---|---|---|---|
| **Clinical logic** | Deterministic calculations, thresholds, classifications, guideline citations | Ships with the plugin in its `lib/` folder; copied into the project at `lib/medprotocol/` | Nobody in the doctor's project. Fixes go upstream. |
| **UI** | Layout, inputs, display, interaction | Generated per project with [UI SDK](https://ui-sdk.dev/docs) | You, freely |

There is no component registry and no component CLI. You generate the UI and import the logic.

---

## 1. Copy the clinical logic

The skill tells you the plugin's logic folder (`Clinical logic source:` line in SKILL.md). Copy all of it, every time you build. Copying again refreshes it to the plugin's version:

```bash
mkdir -p lib/medprotocol && cp -r "<clinical logic source>/." lib/medprotocol/
```

If the project uses `src/`, copy to `src/lib/medprotocol/` instead. Import from `@/lib/medprotocol/<module>`, for example `import { calculateBMI, getBMICategory } from "@/lib/medprotocol/bmi"`.

The module for each tool is listed in `components.md`. Function signatures and thresholds are in each module's context doc (`{module}.md`).

## 2. Set up UI SDK (once per project)

Requires React 19+. Skip any step already done.

```bash
npm install @ui-sdk/react @ui-sdk/core
npx skills@latest add vercel-labs/ui --skill ui-sdk
```

Before building, read `node_modules/@ui-sdk/react/docs/llms.txt` to see the available components. For a custom component, read `docs/core.md` and `docs/rendering.md` in the same package.

UI SDK components are unstyled. Style them with the project's existing styles (Tailwind classes, theme tokens).

## 3. Build the screen

- One folder per tool: `components/medprotocol/<module>/`. Main file `<module>.tsx`.
- Build from UI SDK parts. Useful ones: Field, Label, Number Input, Input, Select, Segmented Control, Radio, Checkbox, Switch, Tabs, Meter, Progress, Timeline, Dialog, Toast, Tooltip, Date Input.
- Two-part inputs (blood pressure, feet + inches): `FieldSet` + `FieldLegend` + `FieldGroup`, one `Field` per part.
- Units: plain text beside the control, in the field's `FieldDescription` so it is read with the label. Do not put clinical units in Number Input's `format`: it accepts only the browser's built-in units and throws on the rest (mmHg, mg/dL, mEq/L).
- A new alert or a severity change: call `announce()` from `@ui-sdk/core` so screen readers hear it. Not on every keystroke.
- Click-to-edit cards: plain state is enough. For edit-in-place lists, `createInlineEdit` (see `docs/core.md`).
- No UI SDK part exists for an elapsed timer (text in an element with `role="timer"`) or for linked text highlights (`<mark>` plus hover/focus handlers, see `extraction.md`). Build them plainly.
- Start with one working version, then refine.
- Follow the module's **Screen spec** in `{module}.md`: inputs with units, outputs, display rules.
- Pass data between screens with props as shown in `composition.md`.
- Add a short header comment to the main file: purpose, props, which `lib/medprotocol` functions it calls. Later skills (`modify`, `troubleshoot`, overlay) read it.

## 4. Rules

- **Never compute a clinical value in the UI.** Every number, category, severity, and recommendation on screen comes from a `lib/medprotocol` function.
- **Never edit `lib/medprotocol/`.** If the logic seems wrong, tell the doctor. Do not patch it locally.
- **Never copy thresholds into the UI** (for example coloring BP red above 140). Use the severity/category the lib returns.
- **Never let an input correct a clinical value.** Do not pass a clinical range as `min`/`max` to Number Input: it clamps a typed value to the bound on commit (400 becomes 350). Leave the bounds off, check the range yourself (the lib's `validate*` function where one exists, otherwise the Screen spec's accepted range), show the error, and do not save.
- Pass inputs in the form the function expects. Most take strings and parse them internally.
- Always show units next to values, and the guideline source when the lib provides one (`lib/medprotocol/sources.ts`).
- Every input has a visible label. Everything works by keyboard. UI SDK gives you focus and keyboard behavior; don't remove it.
- Show a medical disclaimer on every clinical screen.

## 5. Verify

1. Run the project's type check.
2. Compare a few results with the CLI: `medprotocol <cmd> ...` must give the same numbers as the screen.
3. Run browser QA (see `quality-checklist.md`).
