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

Do NOT ask about:
- CSS, styles, or design tokens
- Component architecture
- State management
- File structure

---

## Phase 2: Identify Components

Silently determine which files need to change:

1. **Read the existing project structure** — check what components are already installed
2. **Map the doctor's request** to specific files:
   - Vital sign changes → `components/vital-signs/signs/` and related validation files
   - Patient info changes → `app/ehr/patient-details/`
   - Clinical notes changes → `app/ehr/prev-evolutions/`
   - Alert changes → `components/vital-signs/components/vital-signs-alert.tsx`
   - Layout changes → the relevant page file

3. **If the doctor requests a component that isn't installed yet**, fetch it from the CDN following the component fetching process in the main protocol

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

## Phase 4: Preview

1. If `npm run dev` is already running, the changes will appear automatically. If not, start it.
2. Tell the doctor:
   > "I've updated your interface. [Describe what changed in clinical terms]. You can see the changes at http://localhost:3000/[relevant-path]"
3. Ask: "Does this look right? Would you like any other adjustments?"
