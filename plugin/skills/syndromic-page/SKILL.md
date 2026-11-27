---
name: syndromic-page
description: Open the synthetic patients page — a local page in the browser that makes a synthetic patient for the six bedside rules (shock, volume, heart failure, chest, focal pulmonary, respiratory failure), at random or with the results the user chooses, drafts its note in the chosen tone, and shows what each rule says beside that note. Use when the user wants to open, start or use the synthetic patients page, practise the syndromic rules on generated patients, or generate a patient and its note in the browser.
allowed-tools: Bash
user-invocable: true
---

medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever this file says `medprotocol`

## Steps

1. **Check `claude` is on PATH** (`command -v claude`). The page uses it to draft each note. Prints nothing → tell the user the page can't draft notes here; the patients and the rules still work, but every note will fail. Ask whether to start it anyway.
2. **Start the server** in the background (Bash, `run_in_background`): `medprotocol syndromic --serve`. Read the address it prints. The two local pages have their own ports: the extraction page 7332, this one 7333. `Port 7333 is in use` → this page is probably already running: give the user `http://localhost:7333`; if they say it is not the synthetic patients page, start again with `--port <number>`.
3. **Tell the user**, in a full sentence, with the address the server printed: "The synthetic patients page is open at http://localhost:7333 (the extraction page, when you use it, is on 7332). Pick Random or Choose the results, pick the note's tone, and press the button; the page makes a synthetic patient, drafts its note and shows what each of the six rules says beside it. Every patient is made up. Each note is one short Claude run, which uses tokens. Under each note you can copy it or save it as a text file."
4. **While the user works in the page, do nothing.** The server generates the patients, runs the rules from `plugin/lib` and drafts the notes by itself.
5. **When the user comes back**, each patient the server made is a `Synthetic patient <code> · <story>` line in its output. A screen of the six rules in their app → `/medical-protocol:start` with the syndromic workflow (`workflows/syndromic.md`).

## NEVER
- Start `syndromic --serve` on anything but this computer, or expose its address (a tunnel, a proxy, `0.0.0.0`): each note is a model run
- Publish, upload or host the page anywhere (the Artifact tool, a gist, any other web server)
- Call a rule's result a diagnosis, or present a generated patient or note as a real person
