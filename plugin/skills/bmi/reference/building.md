# Building a Clinical Screen

Every clinical screen has two layers. Keep them apart.

| Layer | What it is | Where it comes from | Who may change it |
|---|---|---|---|
| **Clinical logic** | Deterministic calculations, thresholds, classifications, guideline citations | Ships with the plugin in its `lib/` folder; copied into the project at `lib/medprotocol/` | Nobody in the user's project. Fixes go upstream. |
| **UI** | Layout, inputs, display, interaction | Generated per project with [UI SDK](https://ui-sdk.dev/docs) | You, freely |

There is no component registry and no component CLI. You generate the UI and import the logic.

---

## 1. Copy the clinical logic

The skill tells you the plugin's logic folder (`Clinical logic source:` line in SKILL.md). Copy all of it, every time you build. Copying again refreshes it to the plugin's version:

```bash
mkdir -p lib/medprotocol && cp -r "<clinical logic source>/." lib/medprotocol/
```

If the project uses `src/`, copy to `src/lib/medprotocol/` instead. Import from `@/lib/medprotocol/<module>`, for example `import { calculateBMI, getBMICategory } from "@/lib/medprotocol/bmi"`.

The module for each tool is listed in `components.md`. Function signatures and thresholds are in each module's context doc: `{module}.md`, in the folder on the skill's `Module docs:` line (`overlay.md` is there too).

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
- Every clinical screen starts empty and has a **Generate random patient** button and **Clear**. A screen that lists patients has **Generate patients** instead, which adds 5 at once with mixed scenarios. Each press makes a new synthetic patient with random, credible values, following the **Synthetic patient generator** section of the module's `{module}.md`: pick a scenario at random, draw each value in its range, apply the couplings, round as stated.
  - Lay the generator out top to bottom as one form, with one main button at the end: **How** (a switch: "Random" or "Choose the results"); when choosing, **Results**, one select per assessment on the screen (a combined screen has one per module), default "Any", listing that module's generator scenarios; then the button, **Generate random patient** or **Generate patient with these results**. Assessments left on "Any" are picked at random. On a screen with a narrow step rail, the form goes in the main pane, not the rail. On a combined screen whose patient is one coherent story, each select lists "Any", the results that fit a story with what is already set, and always the module's "no" result (no shock, no overload, normal…). A "no" that fits no such story takes that module's findings from a story that has it, and the screen says which assessments came from another case. Clear does not reset the selects.
  - A screen that drafts a note from the patient puts **Note tone** just above the button, so it is chosen before generating.
  - Put the generator in `components/medprotocol/<module>/generate.ts`: a pure function `generate(scenario?)` returning the screen's inputs, using `Math.random`; with no scenario it picks one at random. Its header comment lists the scenarios. It may use the coupling formulas its section gives, to keep the inputs coherent, but it never computes or shows a result: results still come only from the lib.
  - Check each generated value with the lib's `validate*` function where one exists; if one is rejected, generate again.
  - Where the section gives an **Expected verdict** per scenario (the syndromic rules: shock, volume, heart failure, chest, focal pulmonary, respiratory failure), run the lib's rule on the clean draw and keep the patient only if the verdict matches; otherwise draw again, up to 20 times, then take the last draw. Apply the deliberate noise (swapped or `not_assessed` findings) after the check, so those patients may differ. The rule is only a check here: the screen still shows what the lib returns for the final inputs.
  - Show "Synthetic patient" and the patient's 4-character code (`Synthetic patient 7K3Q`) beside the header while generated values are in. Never a name, date of birth tied to a person, or record number.
  - A screen without typed inputs (the extraction screen) has no button: see its module doc.
- Add a short header comment to the main file: purpose, props, which `lib/medprotocol` functions it calls. Later skills (`modify`, `troubleshoot`, overlay) read it.

## 4. Rules

- **Never compute a clinical value in the UI.** Every number, category, severity, and recommendation on screen comes from a `lib/medprotocol` function.
- **Never edit `lib/medprotocol/`.** If the logic seems wrong, tell the user. Do not patch it locally.
- **Never copy thresholds into the UI** (for example coloring BP red above 140). Use the severity/category the lib returns.
- **Never let an input correct a clinical value.** Do not pass a clinical range as `min`/`max` to Number Input: it clamps a typed value to the bound on commit (400 becomes 350). Leave the bounds off, check the range yourself (the lib's `validate*` function where one exists, otherwise the Screen spec's accepted range), show the error, and do not save.
- Pass inputs in the form the function expects. Most take strings and parse them internally.
- Always show units next to values, and the guideline source when the lib provides one (`lib/medprotocol/sources.ts`).
- Every input has a visible label. Everything works by keyboard. UI SDK gives you focus and keyboard behavior; don't remove it.
- Every clinical screen shows this line, word for word, where it is always visible: **"Learning prototype — not for patient care."**

## 5. Verify

1. Run the project's type check.
2. Compare a few results with the CLI: `medprotocol <cmd> ...` must give the same numbers as the screen.
3. Offer browser QA, and run it when the user wants it or before a demo (see `quality-checklist.md`).
