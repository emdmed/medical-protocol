# Component Fetching

Fetch the component registry: `WebFetch` from `{CDN_BASE}/context/components.md` — full registry, dependencies, CLI commands, and post-installation steps.

## Workflow Execution

Once classified, fetch and follow the workflow:

1. **Fetch the workflow**: `WebFetch` the workflow markdown from `{CDN_BASE}/providers/claude-code/workflows/{domain}.md`
2. **Follow all phases** in the workflow exactly as written
3. **Install components** as instructed by the workflow using `medical-ui-cli`

For component installation details (dependencies, shared components, missing imports), fetch from `{CDN_BASE}/context/components.md`.

When composing multiple components, fetch `{CDN_BASE}/context/composition.md` for integration patterns, typed examples, and known gotchas.
