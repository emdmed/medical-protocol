# Component Fetching

See `context/components.md` for the full component registry, dependencies, CLI commands, and post-installation steps. That is the canonical source — do not duplicate it here.

## Workflow Execution

Once classified, fetch and follow the workflow:

1. **Fetch the workflow**: `WebFetch` the workflow markdown from `{CDN_BASE}/providers/claude-code/workflows/{domain}.md`
2. **Follow all phases** in the workflow exactly as written
3. **Install components** as instructed by the workflow using `medical-ui-cli`

For component installation details (dependencies, shared components, missing imports), see `context/components.md`.

When composing multiple components, refer to `context/composition.md` for integration patterns, typed examples, and known gotchas.
