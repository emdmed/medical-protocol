# New Module Checklist

When creating a new clinical domain/module, **all four** of these must be completed or the module won't be discoverable at runtime:

1. **Component code** — Component source lives in the medprotocol-ui repo. Add the module there with TSX files, types, and registry entry.
2. **Workflow file** — Create `public/medical-protocol/providers/claude-code/workflows/{module}.md` with Phases 1–4 (Clinical Requirements, Install, Build Page, Quality & Preview).
3. **Classification row in `public/medical-protocol/context/classification.md`** — Add a row to the domain classification table with signal words that route doctors to the new workflow. If the CLI component name differs from the domain name (e.g., domain `diabetes` → component `diabetes-dx`), add a comment noting the correct CLI name.
4. **Context files** — Update `public/medical-protocol/context/components.md` (add to Available Tools table + Component Dependencies) and create `public/medical-protocol/context/{module}.md` with the correct CLI component name, install commands, and module reference. The CLI component name must match exactly what's registered in the medprotocol-ui CLI registry.

**If any step is skipped, the module exists in code but Claude Code cannot find or install it.** Steps 3–4 are the most commonly missed — without them, agents either can't route to the module or use the wrong component name (e.g., `diabetes` instead of `diabetes-dx`).

If the module includes **pure calculation/validation logic** used by tests or the CLI, add those files to `lib/` in this repo.

## Why Each Step Matters

| Step | What breaks without it |
|------|----------------------|
| Component code (in medprotocol-ui) | Nothing to install |
| Workflow file | No phases to guide the build |
| classification.md row | No signal words → domain never matched → module invisible |
| Context files (components.md + {module}.md) | Agent uses wrong component name → `Component "X" not found` |
