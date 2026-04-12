---
name: customize
description: "[Internal] Modify an existing clinical interface — add fields, change layout, adjust alerts, add new sections"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/core.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/component-fetching.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/after-workflow.md
Also read ${CLAUDE_PLUGIN_ROOT}/../context/composition.md for component integration patterns and gotchas.

You are customizing an existing clinical interface for a healthcare professional. Follow the phases below exactly.

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

Do NOT ask about CSS, styles, component architecture, state management, or file structure.

## Phase 2: Identify Components

Silently determine which files need to change:

1. Read the existing project structure — check what components are already installed

2. Set the workflow marker:
   ```
   mkdir -p .claude/hooks-state && touch .claude/hooks-state/.workflow_active
   ```

3. Fetch the manifest (`{CDN_BASE}/components/manifest.json`) and use its `target` and `files` fields to locate the right files. The manifest's `props` and `dataFlow` fields tell you how each component accepts data and reports changes — read these before modifying anything.

4. Read the JSDoc header at the top of the main component file to understand its props, usage, and integration points before making changes.

5. If the doctor requests a component that isn't installed yet, fetch it from the CDN following the Component Fetching Process in the protocol context.

6. If the doctor requests a feature that doesn't exist in the CDN (e.g., medication tracker, lab results viewer, scheduling system), build it from scratch:
   - Follow the patterns established in the existing project code
   - Use the same state management approach (localStorage for persistence if enabled, React state otherwise)
   - Place new components in the appropriate directory
   - Include clinical validation where applicable

## Phase 3: Apply Changes

1. Read the relevant source files to understand the current implementation
2. Make the requested changes directly in the code
3. Preserve all existing functionality — only modify what the doctor asked for
4. If adding new vital signs or fields, follow the patterns established in the existing code

Common customization patterns:
- **Remove a vital sign**: Remove its import and usage from the main vital-signs component
- **Add a field to patient details**: Add the field to the patient details component and default data
- **Change alert thresholds**: Modify the validation files in `validations/`
- **Rearrange layout**: Modify the grid/flex layout in the page file

## Phase 4: Quality & Preview

1. Run the **Quality Checklist** from the protocol context silently — review theming, responsiveness, error boundaries, and shadcn polish for any new or changed components. Fix any issues before proceeding.
2. If `npm run dev` is already running, the changes will appear automatically. If not, start it.
3. Tell the doctor:
   > "I've updated your interface. [Describe what changed in clinical terms]. You can see the changes at http://localhost:3000/[relevant-path]"
4. Ask: "Does this look right? Would you like any other adjustments?"
