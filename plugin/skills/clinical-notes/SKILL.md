---
name: clinical-notes
description: "[Internal] Build a clinical notes editor — encounter notes, highlighting, evolutions, references"
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/core.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/component-fetching.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/hook-markers.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/after-workflow.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/clinical-context.md

## Component

- **Manifest entry:** `clinical-notes`
- **Route:** `app/notes/page.tsx` (or `app/clinical-notes/page.tsx`)
- **Note:** This component includes its own `page.tsx`. Create a route that imports and renders it.
- **External components:** Check `externalComponents` in the manifest — some (water-balance, acid-base, bmi) are available as their own manifest entries. Fetch those. For others (e.g., textarea-inv), create simplified versions or replace.
- **Composition guide:** Fetch `COMPOSITION.md` since clinical-notes embeds multiple sub-components.
- **Preview message:** "Your clinical notes editor is ready. It includes patient details, encounter notes with highlighting, previous evolutions, and a reference section. View it at http://localhost:3000/notes"

## Phase 1: Clinical Requirements

- "What patient information do you need at the top of each note?" (Default: name, age, date)
- "Do you need to review previous notes/evolutions?" (Default: yes)
- "Do you need a reference section for clinical guidelines or drug references?" (Default: yes)

### Setting-Aware

- **Persistence enabled**: "Should notes be organized by visit date?" (Default: yes)

Do NOT ask about database setup, authentication, layout, or technical integrations.

## NEVER
- Pre-fill notes with fictional patient data that looks realistic
- Allow saving a note without a date/timestamp
- Strip formatting from pasted clinical text without warning
- Show previous notes without clearly marking the date of each entry
