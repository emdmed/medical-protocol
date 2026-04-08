# New Module Checklist

When creating a new clinical domain/module, **all four** of these must be completed or the module won't be discoverable at runtime:

1. **Component code** — `public/medical-protocol/components/{module}/` with TSX files and types
2. **manifest.json entry** — Add the module to `public/medical-protocol/components/manifest.json` with version, category, description, import path, props, dataFlow, shadcn deps, and files list
3. **Workflow file** — Create `public/medical-protocol/workflows/{module}.md` with Phases 1–4 (Clinical Requirements, Fetch & Install, Build Page, Quality & Preview)
4. **Classification row in protocol.md** — Add a row to the domain classification table in `public/medical-protocol/providers/claude-code/protocol.md` with signal words that route doctors to the new workflow

**If any step is skipped, the module exists in code but Claude Code cannot find or install it.** Step 4 is the most commonly missed — without it, the protocol has no signal words to match and will never route to the module.

## Why Each Step Matters

| Step | What breaks without it |
|------|----------------------|
| Component code | Nothing to install |
| manifest.json | Fetch process can't locate or download files |
| Workflow file | No phases to guide the build |
| protocol.md row | No signal words → domain never matched → module invisible |
