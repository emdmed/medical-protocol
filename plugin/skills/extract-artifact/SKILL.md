---
name: extract-artifact
description: "[Internal] Turn a checked note extraction into a page: the note beside the extracted values, quotes highlighted, in the Medical Protocol look. A local HTML file that stays on the doctor's computer; never published or hosted"
allowed-tools: Read, Glob, Bash
user-invocable: true
hooks:
  UserPromptSubmit:
    - hooks:
        - type: command
          command: 'node "$CLAUDE_PLUGIN_ROOT/hooks/note-consent.mjs" --all 2>/dev/null || node "$CLAUDE_PLUGIN_ROOT/../../hooks/note-consent.mjs" --all'
---

medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever this file says `medprotocol`

One page per extraction. Extraction only: the page shows what the note says and how each quote checked, never an interpretation.

## Steps

1. **Pick the extraction.** `<dir>` is `extractions/<hash>/`, the folder just finished by `/medical-protocol:extract`, or the one the doctor names. List `extractions/*/note.md` if unsure, show the first line of each, and ask which. It needs `<dir>/note.md` and its items, `<items>` below: `<dir>/corrected.json` if it exists, else `<dir>/extraction.json`. Neither → tell the doctor to run the extraction first and stop.
2. **Write the local page:**
   ```bash
   medprotocol extract --note <dir>/note.md --items <items> --artifact <dir>/artifact.html
   ```
   It must exit 0. It fails on a bad item (no episode, unknown key) → report the CLI's error and stop; never hand-edit the items to get past it. The page is built by the CLI from a fixed template: never write or edit its HTML yourself.
3. **Tell the doctor where it is:** "The page is saved at <dir>/artifact.html. Open it in your browser; it stays on this computer."

## NEVER
- Publish, upload or host the page anywhere (the Artifact tool, a gist, a web server): it holds the full note and stays a local file. The `note-consent` hook denies the Artifact tool for it
- Write, edit or restyle the page's HTML, or build a page some other way
- Add ranges, flags, scores or comments on the values to the page or to your reply
- Change `<dir>/note.md` or `<dir>/extraction.json` (the `extraction-guard` hook blocks it anyway)
- Commit `<dir>/artifact.html`: it holds the note (`extractions/` is git-ignored)
