---
name: extract
description: "[Internal] Extract values from a clinical note, each with the exact words it came from, and build a screen showing the extraction beside the note — extraction only, no clinical analysis"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
user-invocable: true
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
- **Route:** `app/extraction/page.tsx`, loading `data/extractions/<name>.json`
- **Preview message:** "Your note extraction is ready. The note is on the left and what I pulled from it on the right — point at a value to see the words it came from. Anything I couldn't find in the note is listed under Needs review. View it at http://localhost:3000/extraction"

## Phase 1: Clinical Requirements

- **Before reading any note**, say once: "To extract values I have to read the note, so it is sent to the AI model. Use a de-identified note unless your setup allows patient data here." Wait for the doctor to confirm. (`patient-privacy.md`)
- "What should I pull out — vital signs, labs, medications, or something specific?" (Default: every value in the `extraction.md` key table that the note states)

Then extract and check as in `extraction.md` § Who extracts, steps 1–5 in order: raw note → `extractions/<name>.md`, first pass → `extractions/<name>.json`, verify with the `extraction-verifier` agent → `.verify.json` + `.corrected.json`, the doctor accepts or rejects each correction, then the screen data.

Do NOT ask about layout, colours, or matching rules.

## NEVER
- Interpret, classify, flag as abnormal, or comment on any extracted value — extraction only
- Calculate or convert a value (MAP, BMI, unit conversions) — quote what the note says
- Fix the note's wording inside a quote
- Extract before `extractions/<name>.md` is saved, or check against anything but that file
- Overwrite, edit, move or delete `extractions/<name>.json` (the first pass) — corrections go to `<name>.corrected.json`
- Apply a correction the doctor rejected
- Verify the extraction yourself in this chat — always spawn the `extraction-verifier` subagent
- Drop an item that failed the check without telling the doctor
- Show an extracted value without its quote
- Pick one of several readings, or fill a missing unit — extract them all and let `toInputs` hold them for review
- Use a key outside `FIELDS` — leave the item unkeyed instead
- Leave an item without `episode` (`current` or `history`), or tag something current when unsure — unsure is `history`
