---
name: overlay-implement
description: Implement a medical-protocol component into a region the doctor selected in the dev overlay — drains an "implement" work order, classifies the selected UI, finds it in source, and stages a diff that replaces it with a screen built on the right medprotocol module. For retrofitting medical protocol into apps built without it.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
user-invocable: false
---

Read and follow: reference/core.md
Read and follow: reference/building.md
Clinical logic source: ${CLAUDE_SKILL_DIR}/../../lib
Module docs: ${CLAUDE_SKILL_DIR}/../start/reference/context — each module's `{module}.md` (functions, thresholds, Screen spec)
Read when needed: reference/queue.md
medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever the docs say `medprotocol`

## Purpose

Process **implement** work orders from the overlay queue (`.medprotocol/queue/`). The doctor pointed
at any region of an app — usually one built **without** medical protocol — and chose "Implement with
medical protocol". The work order describes the selected DOM (selector, `outerHTML`, text, classes),
not a module id. This skill classifies that region, picks the right medprotocol module, locates
the markup in source, and **stages a diff** that swaps it for a screen built on that module. Lease/apply: nothing
lands until the doctor approves.

## Phase 1: Drain the queue

1. Run `medprotocol overlay --drain --action implement --json` to claim pending `implement` orders (other actions stay queued for their own skill).
2. If none, tell the doctor to select a region in
   their app and choose Implement, then stop.
3. **Apply fast-path:** if a drained order has `"approved": true` **and** a staged shadow already
   exists under `.medprotocol/staged/` (the doctor clicked **Apply** in the overlay), skip Phases 2–4
   — go straight to Phase 5: land that staged diff into source, remove the shadow, mark `done`, and
   update `result` to say it was applied. Do **not** re-classify or re-stage.

## Phase 2: Classify the selection (infer, then confirm in chat)

For each order:
1. Read the captured `html` + `text` + `classes`. If `suggestedId` is set (app already uses
   medprotocol), use it directly. Otherwise **infer** the clinical concept by matching the content
   against `classification.md` signal words → module in `components.md` (e.g. "weight"/"height" → `bmi`;
   "pH"/"pCO2"/"HCO3" → `acid-base`; "SOFA"/"qSOFA" → `sepsis`).
2. **Confirm the inferred target with the doctor in chat** before writing anything: "This looks like
   a {component} — implement that here?" If the selection isn't clinical, say so and stop.

## Phase 3: Locate the region in source

1. Build a search from the captured descriptors: grep the project for distinctive `text`, class
   names, or nearby strings from `html` to find the file + element that renders the selection.
2. If `source` is set (fast-path tag), open it directly. If you can't locate the source confidently,
   report what you searched and ask the doctor to point you at the file — do not guess.

## Phase 4: Lease — stage the swap

1. Copy the clinical logic and build the screen per building.md (`components/medprotocol/<module>/`); reuse it if it already exists. Staged like any other change.
2. Replace the selected markup with that screen, scoped to the located region only.
3. **Stage a diff** (shadow file under `.medprotocol/staged/` + a unified diff for review). Do not
   modify the real source during the lease. See reference/core.md.

## Phase 5: Apply gate + close

1. Land the diff only on approval — `"approved": true` on the work order (overlay Apply) or the
   doctor's in-session sign-off. Otherwise present the diff and stop.
2. Close the order: set `status: done` **and** write a `result` (`{ report }`) summarizing what was
   staged/applied so the doctor sees it in the overlay panel — the component chosen, the diff summary,
   and "review/approve in Claude Code" if approval is still pending (reference/queue.md).
3. Recommend `/medical-protocol:overlay-audit` on the same region to verify; don't `--clear` until the
   doctor has read the result.

## NEVER
- Write to source before approval — staging only.
- Implement a component for a non-clinical selection — confirm the inference first.
- Edit outside the located region.
- Add network/runtime deps or external API calls (privacy contract).
- Invent clinical logic or edit `lib/medprotocol/` — every clinical value comes from the lib.
