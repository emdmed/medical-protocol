---
name: extract-artifact
description: "[Internal] Turn a checked note extraction into a page: the note beside the extracted values, quotes highlighted, in the Medical Protocol look. Written as a local HTML file; published as a private claude.ai Artifact only if the doctor says yes"
allowed-tools: Read, Glob, Bash, Artifact
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
4. **Offer to publish,** every time and once: "I can also publish it as a private page on claude.ai, so you can open it from another device. That uploads the note text to claude.ai, outside this computer. Only do this with a de-identified note. Publish it?" Wait for a clear yes for this extraction. A yes for an earlier extraction does not count.
5. **On yes:** publish with the Artifact tool: `file_path: <dir>/artifact.html`, `icon: "document"`, `description: "Values extracted from note <hash>, each beside the words it came from"`. Give the doctor the link. If the Artifact tool isn't available here, say so; the local file from step 3 is the result.

## NEVER
- Publish without a yes to step 4 for this extraction, or publish a note the doctor said holds patient identifiers
- Write, edit or restyle the page's HTML, or build a page some other way
- Add ranges, flags, scores or comments on the values to the page or to your reply
- Change `<dir>/note.md` or `<dir>/extraction.json` (the `extraction-guard` hook blocks it anyway)
- Commit `<dir>/artifact.html`: it holds the note (`extractions/` is git-ignored)
