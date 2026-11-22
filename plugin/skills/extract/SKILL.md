---
name: extract
description: "[Internal] Extract values from a clinical note, each with the exact words it came from, and build a screen showing the extraction beside the note — extraction only, no clinical analysis"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
user-invocable: true
hooks:
  UserPromptSubmit:
    - hooks:
        - type: command
          command: 'node "$CLAUDE_PLUGIN_ROOT/hooks/note-consent.mjs" --all 2>/dev/null || node "$CLAUDE_PLUGIN_ROOT/../../hooks/note-consent.mjs" --all'
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

**Default: the page.** Start `medprotocol extract --serve` in the background (Bash, `run_in_background`) and read the address it prints. Tell the doctor in a full sentence: "The extraction page is open at http://localhost:7332. Paste your note there and tick the box; the page pulls out the values, re-checks them and lets you accept or reject each correction. Only use a made-up or de-identified note: it is sent to the AI model, which runs on external servers. Tell me when you are done, or if you want a screen of it in your app." Use the address the server printed. The server does `extraction.md` § Who extracts steps 1–4 itself; don't read the note, extract, verify or edit the files in `extractions/` while the doctor works in the page. If the port is in use, start it again with `--port <number>`.

When the doctor comes back, the folder is the last `http://localhost:<port>/#<hash>` line the server printed. A screen in the doctor's app is still a chat request: only when the doctor asks for one, do step 5 and build it (§ Build).

**Fallback: the chat.** Only when `claude` is not on PATH (`command -v claude` prints nothing, or the page says the 'claude' command was not found). Then:

- **Before reading any note**, say once: "To extract values I have to read the note, so it is sent to the AI model, which runs on external servers. Only give me a de-identified or made-up note. Save it as a file and type its path; don't paste it, and don't attach it with @ or as a photo or PDF, because those are sent before I can ask." (`patient-privacy.md`) The `note-consent` hook is a net, not a guarantee: a pasted note is held back unless the message says "not real data", and the first read of `<hash>/note.md` asks the doctor (do it with `cat <hash>/note.md` in Bash: only that dialog shows the doctor the question; Read and Grep are refused until it is answered), but it cannot see an @-attached file or an image, and the doctor's own file is unguarded, so never read it before `--save`. If the doctor declines, stop, and don't read the original file either.
- "What should I pull out — vital signs, labs, medications, or something specific?" (Default: every value in the `extraction.md` key table that the note states)

Then extract and check as in `extraction.md` § Who extracts, steps 1–5 in order: hash and save the raw note (`medprotocol extract --save`) → `extractions/<hash>/note.md`, first pass → `<hash>/extraction.json`, verify with the `extraction-verifier` agent → `<hash>/verify.json` + `<hash>/corrected.json`, the doctor accepts or rejects each correction, then the screen data.

Then offer once: "Want a page of this extraction you can open in the browser? It stays on this computer." On yes, run `/medical-protocol:extract-artifact` for `<hash>`.

Do NOT ask about layout, colours, or matching rules.

## NEVER
- Interpret, classify, flag as abnormal, or comment on any extracted value — extraction only
- Calculate or convert a value (MAP, BMI, unit conversions) — quote what the note says
- Fix the note's wording inside a quote
- Name the folder yourself — the hash comes from `medprotocol extract --save`
- Extract before `extractions/<hash>/note.md` is saved, or check against anything but that file
- Overwrite, edit, move or delete `<hash>/note.md` or `<hash>/extraction.json` (the first pass) — corrections go to `<hash>/corrected.json`
- Apply a correction the doctor rejected
- Verify the extraction yourself in this chat — always spawn the `extraction-verifier` subagent (chat route; in the page the server runs it)
- Start `extract --serve` on anything but this computer, or expose its address (a tunnel, a proxy, `0.0.0.0`): the page holds the full note
- Drop an item that failed the check without telling the doctor
- Show an extracted value without its quote
- Pick one of several readings, or fill a missing unit — extract them all and let `toInputs` hold them for review
- Use a key outside `FIELDS` — leave the item unkeyed instead
- Leave an item without `episode` (`current` or `history`), or tag something current when unsure — unsure is `history`
