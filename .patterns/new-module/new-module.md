# New Module Checklist

When creating a new clinical domain/module, **all three** of these must be completed or the module won't be discoverable at runtime:

1. **Component code** — Component source lives in the medical-ui-cli repo. Add the module there with TSX files, types, and registry entry.
2. **Workflow file** — Create `public/medical-protocol/providers/claude-code/workflows/{module}.md` with Phases 1–4 (Clinical Requirements, Install, Build Page, Quality & Preview).
3. **Classification row in `public/medical-protocol/context/classification.md`** — Add a row to the domain classification table with signal words that route doctors to the new workflow

**If any step is skipped, the module exists in code but Claude Code cannot find or install it.** Step 3 is the most commonly missed — without it, the protocol has no signal words to match and will never route to the module.

If the module includes **pure calculation/validation logic** used by tests or the CLI, add those files to `lib/` in this repo.

## Why Each Step Matters

| Step | What breaks without it |
|------|----------------------|
| Component code (in medical-ui-cli) | Nothing to install |
| Workflow file | No phases to guide the build |
| classification.md row | No signal words → domain never matched → module invisible |
