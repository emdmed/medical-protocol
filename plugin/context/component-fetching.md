# Component Fetching

Fetch the component registry: `WebFetch` from `https://medical-protocol.vercel.app/medical-protocol/context/components.md` — full registry, dependencies, CLI commands, and post-installation steps.

For component installation details (dependencies, shared components, missing imports), see the component registry above.

When composing multiple components, fetch `https://medical-protocol.vercel.app/medical-protocol/context/composition.md` for integration patterns, typed examples, and known gotchas.

## Important — No Workflow Fetches

- **Do NOT fetch workflow `.md` files from the CDN.** Skills contain all their phases locally in SKILL.md — there is nothing extra to fetch.
- **Components are installed via CLI only** (`npx medical-ui-cli add <name>`). There is no per-component workflow to download.
- **Not every component has a CDN workflow.** Only `nephrology`, `cardiology`, and `sepsis` have CDN workflows, and those are fetched exclusively by the `start` skill's routing table. No other skill should fetch them.
- **`nephrology` workflow is fetched by the `start` skill's routing table.** The component is installed via `npx medical-ui-cli add nephrology`. No other skill should fetch the nephrology workflow directly.
