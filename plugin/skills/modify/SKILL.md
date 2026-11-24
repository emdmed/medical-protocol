---
name: modify
description: "[Internal] Modify an existing clinical interface — add fields, change layout, adjust alerts, add new sections"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
user-invocable: true
---

Read and follow: reference/core.md
Read and follow: reference/building.md
Read and follow: reference/hook-markers.md
Read and follow: reference/after-workflow.md
Read and follow: reference/clinical-context.md
Clinical logic source: ${CLAUDE_SKILL_DIR}/../../lib
Module docs: ${CLAUDE_SKILL_DIR}/../start/reference/context — each module's `{module}.md` (functions, thresholds, Screen spec)
medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever the docs say `medprotocol`
Also `Read` from `reference/composition.md` for component integration patterns and gotchas.

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

Determine which files need to change:

1. Read the existing project structure — check which screens already exist in `components/medprotocol/`

2. Set the workflow marker:
   ```
   mkdir -p .claude/hooks-state && touch .claude/hooks-state/.workflow_active
   ```

3. Read the screens in `components/medprotocol/`. Each main file has a header comment (purpose, props, which `lib/medprotocol` functions it calls) — read it before modifying anything.

4. If the doctor requests a clinical tool the project doesn't have yet, build it per building.md (copy the logic, generate the screen with UI SDK).

5. If the doctor requests a feature no `lib/medprotocol` module covers (e.g., medication tracker, lab results viewer, scheduling system), build it from scratch:
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
- **Change alert thresholds**: Never edit `lib/medprotocol/` — thresholds come from the lib. Tell the doctor the guideline value in use; if it seems wrong, it is fixed upstream
- **Rearrange layout**: Modify the grid/flex layout in the page file

## Phase 4: Quality & Preview

1. Run the **Quality Checklist** from the protocol context automatically — review theming, responsiveness, error boundaries, and the building.md rules (no clinical math in the UI, units, labels, disclaimer) for any new or changed screens. Update the header comment of any main file you changed. Fix any issues before proceeding.
2. If `npm run dev` is already running, the changes will appear automatically. If not, start it.
3. Tell the doctor:
   > "I've updated your interface. [Describe what changed in clinical terms]. You can see the changes at http://localhost:3000/[relevant-path]"
4. Ask: "Does this look right? Would you like any other adjustments?"
