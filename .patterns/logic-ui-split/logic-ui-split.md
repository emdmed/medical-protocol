# Logic / UI Split

Every clinical screen a doctor gets has two layers. This repo owns only the first.

| Layer | Lives in this repo | Lives in the doctor's project |
|---|---|---|
| **Clinical logic** — calculations, thresholds, classifications, citations | `plugin/lib/` (pure TypeScript, no deps, unit-tested in `tests/`) | `lib/medprotocol/` — copied from the plugin, never edited there |
| **UI** — layout, inputs, display | Nothing. No components, no React. | Generated per project with [UI SDK](https://ui-sdk.dev/docs) (React 19+, unstyled) into `components/medprotocol/<module>/` |

The doctor-facing contract is `public/medical-protocol/context/building.md`. Skills and workflows point agents at it; don't restate it.

## Rules for this repo

- **All clinical math goes in `plugin/lib/`.** If a screen would need a threshold or a number, the lib must export a function that returns it (value, category, severity, source). The UI never computes clinical values.
- **Describe screens, don't ship them.** Each module's context doc (`context/{module}.md`) has a Screen spec: inputs with units, outputs, display rules. That is the only UI artifact here.
- **One source.** The CLI (`packages/medprotocol/`) imports from `plugin/lib/`; the plugin ships the same folder. There are no forked copies to keep in sync.
- **Lib conventions:** inputs arrive as strings and are parsed internally; functions are pure and deterministic; classifications return a label plus a severity (`plugin/lib/vital-signs-validations/severity.ts`); every threshold cites its guideline (`plugin/lib/sources.ts`).
