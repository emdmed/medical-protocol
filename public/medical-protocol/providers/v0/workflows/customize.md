# Customize Workflow

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

Silently determine which parts need to change:

1. **Check what components are already in use** in the current project
2. **Read the installed component's source code** before modifying anything — understand its internal structure, hooks, and data flow. Also check `manifest.json` for the component's props, types, files list, and shadcn dependencies.
3. **If the doctor requests a component that isn't included yet**, add it from the registry:
   ```
   https://medical-protocol.vercel.app/medical-protocol/r/{component-name}.json
   ```
4. **If the doctor requests a feature that doesn't exist as a registry component** (e.g., a medication tracker, lab results viewer, scheduling system), build it from scratch:
   - Follow the patterns established in the existing project code
   - Always use localStorage for data persistence — never use a database
   - Include clinical validation where applicable

---

## Phase 3: Apply Changes

1. **Read the relevant source** to understand the current implementation
2. **Make the requested changes** directly in the code
3. **Preserve all existing functionality** — only modify what the doctor asked for
4. **If adding new vital signs or fields**, follow the patterns established in the existing code

Common customization patterns:
- **Remove a vital sign**: Remove its import and usage from the main vital-signs component
- **Add a field to patient details**: Add the field to the patient details component and default data
- **Change alert thresholds**: Modify the validation files
- **Rearrange layout**: Modify the grid/flex layout

---

## Phase 4: Preview

Follow **After Any Workflow Completes** from the main protocol, then:

1. Tell the doctor:
   > "I've updated your interface. [Describe what changed in clinical terms]. You can see the changes in the preview."
2. Ask: "Does this look right? Would you like any other adjustments?"
