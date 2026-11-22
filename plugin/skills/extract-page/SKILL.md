---
name: extract-page
description: Open the extraction page — a local page in the browser where the doctor pastes a clinical note, gets the values with the words they came from, and accepts or rejects each correction, instead of doing it in the chat. Use when the doctor wants to open, start or use the extraction page, or to extract a note in the browser.
allowed-tools: Bash
user-invocable: true
hooks:
  UserPromptSubmit:
    - hooks:
        - type: command
          command: 'node "$CLAUDE_PLUGIN_ROOT/hooks/note-consent.mjs" --all 2>/dev/null || node "$CLAUDE_PLUGIN_ROOT/../../hooks/note-consent.mjs" --all'
---

medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever this file says `medprotocol`

## Steps

1. **Check `claude` is on PATH** (`command -v claude`). The page uses it to read the note. Prints nothing → tell the doctor the page can't run here and offer the chat route, `/medical-protocol:extract`. Stop.
2. **Start the server** in the background (Bash, `run_in_background`): `medprotocol extract --serve`. Read the address it prints. `Port <n> is in use` → the page is probably already running: give the doctor `http://localhost:<n>`; if they say it is not the extraction page, start again with `--port <number>`.
3. **Tell the doctor**, in a full sentence, with the address the server printed: "The extraction page is open at http://localhost:7332. Paste your note there and tick the box; the page pulls out the values, re-checks them and lets you accept or reject each correction. Only use a made-up or de-identified note: it is sent to the AI model, which runs on external servers. Tell me when you are done, or if you want a screen of it in your app."
4. **While the doctor works in the page, do nothing.** The server extracts, verifies and saves by itself: don't read the note, extract, verify or edit the files in `extractions/`.
5. **When the doctor comes back**, the folder is the last `http://localhost:<port>/#<hash>` line the server printed. A screen of it in their app → `/medical-protocol:extract` (§ Build). One saved file of it → `/medical-protocol:extract-artifact`.

## NEVER
- Start `extract --serve` on anything but this computer, or expose its address (a tunnel, a proxy, `0.0.0.0`): the page holds the full note
- Publish, upload or host the page anywhere (the Artifact tool, a gist, any other web server)
- Interpret, classify, flag as abnormal, or comment on any extracted value — extraction only
- Ask the doctor to paste the note in the chat — it goes in the page
