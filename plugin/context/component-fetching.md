# Component Fetching

## Workflow Execution

Once classified, fetch and follow the workflow:

1. **Fetch the workflow**: `WebFetch` the workflow markdown from `{CDN_BASE}/providers/claude-code/workflows/{domain}.md`
2. **Follow all phases** in the workflow exactly as written
3. **Fetch components** as instructed by the workflow using the manifest

### Component Fetching Process

The CDN components are **references and guidelines**, not copy-paste code. Use them to understand the architecture, clinical logic, data flow, and UI patterns — then write components that fit the doctor's actual project setup (React version, shadcn version, TypeScript config, existing code style).

> **Important:** Workflow instructions like `Write to: {project}/components/...` indicate *where* the component should live in the project, not that the CDN file should be copied verbatim. Always adapt the code to the project context.

When a workflow instructs you to install a component:

1. **Fetch manifest**: `WebFetch` from `{CDN_BASE}/components/manifest.json`
2. **Read the component entry** for the requested component name — the manifest includes `import` (import path), `types` (types path), `props` (prop summary), and `dataFlow` (how data moves in/out). Use these to understand the component before fetching files.
3. **Check the manifest `version` field** to know which version of the components you are working with
4. **Fetch and study each file** listed in `manifest[component].files`:
   - `WebFetch` the file from `{CDN_BASE}/components/{component-name}/{file-path}`
   - Each main component file has a **JSDoc header** documenting its props, usage examples, data flow, and behavior — read this first before studying the implementation
   - **If a `WebFetch` fails**, retry once. If it still fails, tell the doctor: "I'm having trouble fetching some resources. Please check your internet connection and try again." Do not attempt to build with partial components.
5. **Check `externalComponents`** (if present in the manifest entry): these are imports the component expects from the doctor's project that are *not* on the CDN. You must either create them or remove/replace those imports when adapting the code.
6. **Install shadcn dependencies**: Run `npx shadcn@latest add {manifest.shadcn components}` silently
7. **When composing multiple components**, fetch `{CDN_BASE}/components/COMPOSITION.md` for integration patterns, typed examples, and known gotchas. This is only needed when wiring components together — skip for single-component workflows.
8. **Write components to the project** using the fetched code as a guide:
   - Preserve the clinical logic, validations, data structures, and overall architecture
   - Adapt types, hooks, imports, and patterns to match the project's actual React/Next.js/shadcn/TypeScript versions
   - Follow the project's existing code style and conventions
   - Ensure all TypeScript compiles cleanly (`npx tsc --noEmit`) — don't introduce type errors
   - Make sure UI elements like popups and overlays work correctly within the layout (e.g., no overflow clipping, correct positioning)
   - **shadcn Card overflow-hidden**: When a Card contains absolutely-positioned popups or overlays, add `overflow-visible` to its className. The default Card clips content outside its bounds. This applies to the Card itself AND any parent Cards wrapping it.
   - **Result positioning — no overlap**: Calculator results (badges, analysis output) must render **below** the input fields using inline flow. Never use `absolute bottom-*` to position results above inputs — this causes them to overlap the component title. AcidBase results use inline flow; VitalSigns alerts use `absolute bottom-[-22px]` below inputs.
   - **Avoid circular update loops**: When a child component receives data via props AND reports changes back via a callback, never put `onData(values)` in a `useEffect` that depends on `values` if the parent re-renders and passes those values back as props. Use `useRef` to track the previous serialized value and skip updates when nothing changed. Store callback props in a ref (`onDataRef.current = onData`) so they don't appear in dependency arrays.
9. **Do not tell the doctor** about files being fetched or installed — just confirm the clinical capability is ready

### Manifest Schema Reference

The manifest (`{CDN_BASE}/components/manifest.json`) is a JSON object with these top-level keys:

| Key | Type | Description |
|---|---|---|
| `version` | string | Component registry version (e.g. `"0.4.0"`) |
| `description` | string | Human-readable description of the registry |
| `context` | string | How to use this file |
| `shared` | object | Shared components (medical-disclaimer, layout-disclaimer, error-boundary) — keyed by name, each has `description`, `import`, `files`, optional `shadcn` |

Each **component entry** (e.g. `manifest["vital-signs"]`) has:

| Field | Type | Description |
|---|---|---|
| `version` | string | Component version |
| `category` | string | `"monitoring"`, `"calculator"`, `"display"`, or `"documentation"` |
| `description` | string | What the component does |
| `import` | string | Import path (e.g. `"@/components/vital-signs/vital-signs"`) |
| `types` | string | Types import path (if separate types file exists) |
| `target` | string | Where to write in the doctor's project (e.g. `"components/vital-signs"`) |
| `props` | string or object | Prop summary — either `"none — self-contained"` or an object with prop names as keys and type descriptions as values |
| `dataFlow` | string | `"bidirectional"`, `"input only"`, `"output only"`, or `"none"` |
| `popups` | object | Popup/overlay positioning details (optional) |
| `shadcn` | string[] | Required shadcn components to install (e.g. `["card", "button", "input"]`) |
| `files` | string[] | Files to fetch from `{CDN_BASE}/components/{target}/{file}` |
| `dependencies` | string[] | Other manifest components this one requires (e.g. DKA depends on `["acid-base"]`) |
| `externalComponents` | string[] | Imports the component expects that are **not on the CDN** — see below |

### Understanding `externalComponents`

Some components import modules that aren't available on the CDN. These are listed in `externalComponents`. When you encounter them:

1. **Check if it's a shadcn hook or component** (e.g. `@/hooks/use-mobile`) — if so, create it using standard shadcn patterns or install via `npx shadcn@latest add`
2. **Check if it's another manifest component** (e.g. `@/components/water-balance/water-balance`) — if so, fetch and install that component first
3. **Check if it's a project-specific UI variant** (e.g. `@/components/ui/textarea-inv`) — if so, create it as a thin wrapper around the standard shadcn component

Example:
```json
"externalComponents": [
  "@/components/water-balance/water-balance",  // → fetch from manifest["water-balance"]
  "@/components/acid-base/acid-base",          // → fetch from manifest["acid-base"]
  "@/components/ui/textarea-inv"               // → create as textarea variant
]
```
