# Component Fetching

Fetch the component registry: `WebFetch` from `{CDN_BASE}/context/components.md` — full registry, dependencies, CLI commands, and post-installation steps.

For component installation details (dependencies, shared components, missing imports), see the component registry above.

When composing multiple components, fetch `{CDN_BASE}/context/composition.md` for integration patterns, typed examples, and known gotchas.

## Important

Do NOT fetch workflow files from the CDN when you are already inside a skill. The skill's own SKILL.md contains all the phases you need. Workflow fetching only applies during the classification routing step in the `start` skill — see the routing table there for correct URLs.
