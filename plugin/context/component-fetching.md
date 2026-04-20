# Component Fetching

Read the component registry: `${CLAUDE_PLUGIN_ROOT}/reference/context/components.md`

For composition patterns (wiring multiple components): `${CLAUDE_PLUGIN_ROOT}/reference/context/composition.md`

## Rules

- **Do NOT fetch workflow `.md` files from external URLs.** Skills contain all their phases locally in SKILL.md.
- **Components are installed via CLI only** (`npx medical-ui-cli add <name>`). No per-component workflow to download.
- **Only `nephrology`, `cardiology`, and `sepsis` have dedicated workflows**, read exclusively by the `start` skill's routing table.
