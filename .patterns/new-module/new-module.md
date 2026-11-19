# New Module Checklist

A clinical module is logic plus the docs and entry points that let agents find it. There is no UI step — screens are generated in the doctor's project from the module's context doc (see `../logic-ui-split/logic-ui-split.md`).

1. **Logic** — `plugin/lib/{module}.ts`: pure functions, string inputs parsed internally, label + severity for classifications, citations in `plugin/lib/sources.ts`. Export it from `plugin/lib/index.ts`.
2. **Tests** — `tests/{module}/*.test.ts` (Vitest), importing from `../../plugin/lib/{module}`. Cover boundaries of every classification tier, empty/invalid input, extreme values.
3. **Context doc** — `public/medical-protocol/context/{module}.md` with the function signatures, thresholds, and a **Screen spec** (inputs with units, outputs, display rules). Add the module to `context/components.md` (Available Tools + dependencies) and a signal-word row to `context/classification.md`. If the module name differs from the domain (e.g. domain `diabetes` → module `diabetes-dx`), note it.
4. **CLI command** — `packages/medprotocol/src/commands/{module}.ts`, registered in `packages/medprotocol/src/index.ts`, documented in `context/cli.md`. See `../medprotocol/medprotocol.md`.
5. **Skill** — `plugin/skills/{module}/SKILL.md` following an existing skill (e.g. `plugin/skills/bmi/`): reads `reference/building.md`, declares `Clinical logic source:`. Add its reference-doc copies to `packages/medical-protocol/build.sh`. Modules routed through a workflow file instead (nephrology, cardiology, sepsis) get `public/medical-protocol/providers/claude-code/workflows/{module}.md` and a row in the start skill's routing table.

Run `npm test` and `bash packages/medical-protocol/build.sh` before committing.

## What breaks without each step

| Step | What breaks |
|------|-------------|
| Logic | Nothing to import — the agent would invent math in the UI |
| Tests | Clinical errors ship silently |
| Context doc + classification row | Domain never matched, or agent builds the screen without a spec |
| CLI command | No terminal calculator and no CLI-vs-UI check during QA |
| Skill / workflow | No phases to guide the build |
