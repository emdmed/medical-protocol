# Customize Workflow

> `{CDN_BASE}` refers to `https://medical-protocol.vercel.app/medical-protocol` (defined in the main protocol).

## Phase 1: Clinical Requirements

The doctor wants to modify an existing interface. Understand what they want to change:

- "What would you like to change about your current interface?"
- Listen for clinical intent:
  - Adding/removing vital signs from the monitor
  - Changing what patient information is displayed
  - Adding new sections or fields to the records
  - Changing how alerts or warnings appear
  - Adjusting the layout or arrangement of information
  - Adding an entirely new clinical tool or feature

Do NOT ask about:
- CSS, styles, or design tokens
- Component architecture
- State management
- File structure

---

## Phase 2: Identify Components

Silently determine which files need to change:

1. **Read the existing project structure** — check what components are already installed
2. **Read the JSDoc header** at the top of each component's main TSX file to understand its props, usage, data flow, and integration points before making changes

3. **If the doctor requests a component that isn't installed yet**, install it with `npx medical-ui-cli add <component>`

4. **If the project has multiple components wired together** (e.g., a dashboard with embedded calculators), review the installed component code and follow these composition rules before making changes:
   - Props down, callbacks up. Use `useRef` to skip no-op updates and prevent circular render loops.
   - Add `overflow-visible` to any shadcn Card that contains absolutely-positioned popups or overlays.
   - Null-guard all cross-component data.

6. **If the doctor requests a feature that doesn't exist in the component library** (e.g., a medication tracker, lab results viewer, scheduling system), build it from scratch:
   - Follow the patterns established in the existing project code (file structure, naming conventions, hook patterns, shadcn usage)
   - Use the same state management approach (localStorage for persistence if enabled, React state otherwise)
   - Place new components in the appropriate directory (`components/` for reusable widgets, `app/{feature}/` for pages)
   - Include clinical validation where applicable

---

## Phase 3: Apply Changes

1. **Read the relevant source files** to understand the current implementation
2. **Make the requested changes** directly in the code
3. **Preserve all existing functionality** — only modify what the doctor asked for
4. **If adding new vital signs or fields**, follow the patterns established in the existing code

Common customization patterns:
- **Remove a vital sign**: Remove its import and usage from the main vital-signs component
- **Add a field to patient details**: Add the field to the patient details component and default data
- **Change alert thresholds**: Modify the validation files in `validations/`
- **Rearrange layout**: Modify the grid/flex layout in the page file

---

## Phase 4: Quality & Preview

1. **Run the Quality Checklist** from the main protocol — silently review theming, responsiveness, and shadcn polish for any new or changed components. Fix any issues before proceeding.
2. If `npm run dev` is already running, the changes will appear automatically. If not, start it.
3. Tell the doctor:
   > "I've updated your interface. [Describe what changed in clinical terms]. You can see the changes at http://localhost:3000/[relevant-path]"
4. Ask: "Does this look right? Would you like any other adjustments?"
