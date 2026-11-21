---
name: overlay
description: The one entry point for the dev overlay — turns it on if the app isn't wired yet, otherwise processes every selection the doctor queued in the browser (audit, implement, add, or a skill triggered from a report). Use when the doctor wants to enable, start or use the overlay / hover-to-audit tool, says "process my selections", or the overlay shows "queued — needs drain".
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
user-invocable: true
---

medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever the docs say `medprotocol`

## Purpose

The doctor runs this one skill for everything overlay. It decides what is needed and hands off to
the internal skill that does it — never ask the doctor which one to run.

## Step 1: Is the overlay wired?

Grep the app's root mount file (`app/layout.tsx`, `src/app/layout.tsx`, `pages/_app.tsx`,
`src/pages/_app.tsx`, or `index.html`) for `data-medprotocol-overlay`.

- **Not found** → read and follow `${CLAUDE_SKILL_DIR}/../overlay-setup/SKILL.md`, then stop.
- **Found** → make sure the server is up: run `medprotocol overlay --serve --port <port in the tag's src>`
  in the background. `Port <n> is in use` means it is already running — that is fine, carry on.

## Step 2: Process the queue

1. Run `medprotocol overlay --list --json` (changes nothing).
2. **Empty** → tell the doctor the overlay is on: click "Protocol select" (bottom-right) in the
   browser and pick a region; results appear there. Stop.
3. Otherwise, for each action present, read and follow the matching skill from its Phase 1. Each one
   claims only its own orders, so nothing is left stranded:

   | `action` | Follow |
   |---|---|
   | `audit` | `${CLAUDE_SKILL_DIR}/../overlay-audit/SKILL.md` |
   | `implement` | `${CLAUDE_SKILL_DIR}/../overlay-implement/SKILL.md` |
   | `add` | `${CLAUDE_SKILL_DIR}/../overlay-add/SKILL.md` |

4. `skill` orders (the doctor clicked a recommended skill in a report): claim them with
   `medprotocol overlay --drain --action skill --json`, then run the skill named in each order's
   `skill` field against the captured selection (`html`/`selector`/`source` locate the region; `prompt`
   is an extra brief). If it builds or edits files, **stage** the diff only. Write the findings into
   the order's `result` and set `status: done`.

## NEVER
- Ask the doctor which overlay skill to run — route by `action`.
- Claim orders with a bare `--drain` — it takes every action and strands the ones you don't process.
- Apply a staged diff without approval — the gates in overlay-implement / overlay-add still hold.
