---
name: extract
description: "[Internal] Extract values from a clinical note, each with the exact words it came from, and build a screen showing the extraction beside the note — extraction only, no clinical analysis"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
user-invocable: true
hooks:
  UserPromptSubmit:
    - hooks:
        - type: command
          command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/note-consent.mjs" --all'
  PreToolUse:
    - matcher: "Read|Bash|Grep|Artifact"
      hooks:
        - type: command
          command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/note-consent.mjs" --all'
  PostToolUse:
    - matcher: "Read|Bash|Grep"
      hooks:
        - type: command
          command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/note-consent.mjs" --all'
---

Read and follow: reference/core.md
Read and follow: reference/building.md
Read and follow: reference/hook-markers.md
Read and follow: reference/after-workflow.md
Read and follow: reference/clinical-context.md
Read and follow: reference/extraction.md
Clinical logic source: ${CLAUDE_SKILL_DIR}/../../lib
medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever the docs say `medprotocol`

## Build

- **Clinical logic:** `@/lib/medprotocol/extraction` — copy it first (building.md §1)
- **Component folder:** `components/medprotocol/extraction/` — main file `extraction.tsx`, built with UI SDK (building.md §2–3)
- **Route:** `app/extraction/page.tsx`, loading `data/extractions/<hash>.json`
- **Preview message:** "Your note extraction is ready. The note is on the left and what I pulled from it on the right — point at a value to see the words it came from. Anything I couldn't find in the note is listed under Needs review. View it at http://localhost:3000/extraction"

## Phase 1: Clinical Requirements

- **Before reading any note**, say once: "To extract values I have to read the note, so it is sent to the AI model. Use a de-identified or made-up note, and give it to me as a file path rather than pasting it." (`patient-privacy.md`) The `note-consent` hook enforces this: a pasted note is held back unless the message says "not real data", and the first read of `<hash>/note.md` asks the doctor. If the doctor declines, stop.
- "What should I pull out — vital signs, labs, medications, or something specific?" (Default: every value in the `extraction.md` key table that the note states)

Then extract and check as in `extraction.md` § Who extracts, steps 1–5 in order: hash and save the raw note (`medprotocol extract --save`) → `extractions/<hash>/note.md`, first pass → `<hash>/extraction.json`, verify with the `extraction-verifier` agent → `<hash>/verify.json` + `<hash>/corrected.json`, the doctor accepts or rejects each correction, then the screen data.

Then offer once: "Want a page of this extraction you can open in the browser, or share as a private claude.ai link?" On yes, run `/medical-protocol:extract-artifact` for `<hash>`.

Do NOT ask about layout, colours, or matching rules.

## NEVER
- Interpret, classify, flag as abnormal, or comment on any extracted value — extraction only
- Calculate or convert a value (MAP, BMI, unit conversions) — quote what the note says
- Fix the note's wording inside a quote
- Name the folder yourself — the hash comes from `medprotocol extract --save`
- Extract before `extractions/<hash>/note.md` is saved, or check against anything but that file
- Overwrite, edit, move or delete `<hash>/note.md` or `<hash>/extraction.json` (the first pass) — corrections go to `<hash>/corrected.json`
- Apply a correction the doctor rejected
- Verify the extraction yourself in this chat — always spawn the `extraction-verifier` subagent
- Drop an item that failed the check without telling the doctor
- Show an extracted value without its quote
- Pick one of several readings, or fill a missing unit — extract them all and let `toInputs` hold them for review
- Use a key outside `FIELDS` — leave the item unkeyed instead
- Leave an item without `episode` (`current` or `history`), or tag something current when unsure — unsure is `history`
