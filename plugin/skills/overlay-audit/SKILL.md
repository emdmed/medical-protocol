---
name: overlay-audit
description: Audit a region the doctor selected in the dev overlay against medical-protocol guidance — drains an "audit" work order, classifies the selected UI, locates it in source, and reports findings. Read-only. Works on any app, tagged or not.
allowed-tools: Read, Grep, Glob, Bash
user-invocable: true
---

Read and follow: reference/core.md
Read when needed: reference/queue.md

## Purpose

Process **audit** work orders from the overlay queue (`.medprotocol/queue/`). The doctor pointed at
any region of an app — possibly one built **without** medical protocol — and chose "Audit this with
medical protocol". The work order describes the selected DOM (selector, `outerHTML`, text, classes),
not a registry id. This skill classifies the region, finds it in source, and **reports findings**
against the relevant protocol guidance. Static and read-only — it never modifies files.

## Phase 1: Drain the queue

1. Run `npx medprotocol overlay --drain --json` to claim pending work orders.
2. Keep only orders with `"action": "audit"`. If none, tell the doctor to select a region in their
   app and choose Audit, then stop.

## Phase 2: Classify the selection

For each order:
1. If `suggestedId` is set (app already uses medprotocol), use it. Otherwise **infer** the clinical
   concept from `html` + `text` + `classes` via `classification.md` signal words → registry module.
2. If the selection isn't clinical, say so and skip it — there's nothing to audit against protocol.

## Phase 3: Locate in source (best-effort)

1. Grep the project for distinctive `text`, class names, or `html` fragments to find the file +
   element that renders the selection. Open `source` directly if the fast-path tag is set.
2. If you can't locate the source, audit what the work order captured (`html`) against the rules and
   note that findings are based on the rendered markup only.

## Phase 4: Audit (static, read-only)

Evaluate the located region against the inferred module's guidance and the relevant `lib/`
validations: Clinical Safety, Data Completeness, Privacy, Accessibility, Protocol Adherence — scoped
to this one selection. Cite file:line (or the captured markup) with P0–P3 severities.

## Phase 5: Report & close

1. Output a per-selection report (format in reference/core.md), citing the `url` and selector.
2. For fixable findings, recommend `/medical-protocol:overlay-implement` (replace the region with the
   real component) or `/medical-protocol:modify`. These mentions render as **clickable triggers** in
   the overlay panel — clicking one re-runs that skill on the same selection. Add a `result.suggestions`
   entry to give a recommendation a labeled button or a `prompt` (reference/queue.md).
3. Close the order: set `status: done` **and** write the full report into `result` (`{ score, report }`)
   so the doctor sees it in the overlay panel (reference/queue.md). Don't suggest `--clear` until they've
   read it — clearing deletes the result.

## NEVER
- Modify any file — this skill only reports. Implement is a separate, gated skill.
- Audit a non-clinical selection against protocol — say it's out of scope and skip.
- Report a passing result without reading the source or the captured markup.
- Use vague findings — cite the file:line or the specific markup, expected vs actual.
