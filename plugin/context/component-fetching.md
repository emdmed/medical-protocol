# Component Fetching

## Workflow Execution

Once classified, fetch and follow the workflow:

1. **Fetch the workflow**: `WebFetch` the workflow markdown from `{CDN_BASE}/providers/claude-code/workflows/{domain}.md`
2. **Follow all phases** in the workflow exactly as written
3. **Install components** as instructed by the workflow using `medical-ui-cli`

### Component Installation Process

Components are installed via `npx medical-ui-cli add <component-name>`. This copies the full component folder into the project's `components/` directory and installs all required shadcn dependencies automatically.

When a workflow instructs you to install a component:

1. **Install the component**: Run `npx medical-ui-cli add {component-name}` silently
2. **Check for dependencies**: Some components depend on others. The CLI does **not** auto-install dependent components — you must install them separately. Known dependencies:
   - `dka` depends on `acid-base` — install acid-base first
   - `sepsis` depends on `vital-signs` and `water-balance`
   - Other components are self-contained
3. **Install shared components**: The CLI does **not** auto-install shared components (`medical-disclaimer.tsx`, `layout-disclaimer.tsx`, `error-boundary.tsx`). After installing, check the component's imports — if it references any of these shared files that don't exist in the project, create them as simple React components following the patterns in the installed code.
4. **Handle external imports**: After installation, check the component's imports for modules that aren't available:
   - **shadcn hook or component** (e.g. `@/hooks/use-mobile`) — create it using standard shadcn patterns or install via `npx shadcn@latest add`
   - **Another manifest component** (e.g. `@/components/water-balance/water-balance`) — install it via `npx medical-ui-cli add {name}`
   - **Project-specific UI variant** (e.g. `@/components/ui/textarea-inv`) — create it as a thin wrapper around the standard shadcn component
5. **When composing multiple components**, refer to the composition context (`context/composition.md` in the plugin) for integration patterns, typed examples, and known gotchas. This is only needed when wiring components together — skip for single-component workflows.
6. **Post-install review** — after installation, review the installed code and adapt if needed:
   - Ensure all TypeScript compiles cleanly (`npx tsc --noEmit`) — don't introduce type errors
   - Make sure UI elements like popups and overlays work correctly within the layout (e.g., no overflow clipping, correct positioning)
   - **shadcn Card overflow-hidden**: When a Card contains absolutely-positioned popups or overlays, add `overflow-visible` to its className. The default Card clips content outside its bounds. This applies to the Card itself AND any parent Cards wrapping it.
   - **Result positioning — no overlap**: Calculator results (badges, analysis output) must render **below** the input fields using inline flow. Never use `absolute bottom-*` to position results above inputs.
   - **Avoid circular update loops**: When a child component receives data via props AND reports changes back via a callback, never put `onData(values)` in a `useEffect` that depends on `values` if the parent re-renders and passes those values back as props. Use `useRef` to track the previous serialized value and skip updates when nothing changed. Store callback props in a ref (`onDataRef.current = onData`) so they don't appear in dependency arrays.
7. **Do not tell the doctor** about the CLI, files being installed, or any technical details — just confirm the clinical capability is ready

### Available Components

| Component | Category | Dependencies | Description |
|---|---|---|---|
| `vital-signs` | monitoring | none | BP, HR, RR, Temp, SpO2 monitor |
| `acid-base` | calculator | none | Blood gas / acid-base analyzer |
| `bmi` | calculator | none | BMI calculator |
| `water-balance` | monitoring | none | Fluid balance tracker |
| `pafi` | calculator | none | PaO2/FiO2 with ARDS classification |
| `dka` | critical-care | `acid-base` | DKA monitoring |
| `cardiology` | calculator | none | ASCVD, HEART, CHA₂DS₂-VASc |
| `sepsis` | critical-care | `vital-signs`, `water-balance` | SOFA, qSOFA, lactate clearance |
| `ckd` | calculator | none | eGFR, KDIGO staging, KFRE |

Each installed component's main TSX file has a **JSDoc header** documenting its props, usage examples, data flow, and behavior — read this before modifying or integrating.
