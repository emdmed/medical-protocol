---
name: overlay-add
description: Build a NEW medical-protocol component from a free-text brief the doctor typed in the dev overlay, and place it into the region they selected — drains an "add" work order, reads its `prompt`, classifies the requested clinical concept, composes the right medprotocol component(s), and stages a diff that inserts it at the selected anchor. For adding capability to an app, not retrofitting existing markup.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
user-invocable: true
---

Read and follow: reference/core.md
Read when needed: reference/queue.md

## Purpose

Process **add** work orders from the overlay queue (`.medprotocol/queue/`). The doctor selected a
region of their app, chose "Add a component here…", and typed a free-text brief — e.g.
*"a chronic kidney disease anemia tracker"*. Unlike **implement** (which retrofits the *existing*
selected markup), **add** treats the selection as a **placement anchor** and builds a **new**
component there from the `prompt`. Lease/apply: nothing lands until the doctor approves.

## Phase 1: Drain the queue

1. Run `npx medprotocol overlay --drain --json` to claim pending work orders.
2. Keep only orders with `"action": "add"`. If none, tell the doctor to select a region in their app,
   choose "Add a component here…", and type what to build, then stop.
3. **Apply fast-path:** if a drained order has `"approved": true` **and** a staged shadow already
   exists under `.medprotocol/staged/` (the doctor clicked **Apply** in the overlay), skip Phases 2–4
   — go straight to Phase 5: land that staged diff into source, remove the shadow, mark `done`, and
   update `result` to say it was applied. Do **not** re-classify or re-build.

## Phase 2: Classify the brief (the `prompt`, not the markup)

For each order:
1. Read the order's `prompt` — that is what to build. Classify the **requested clinical concept** by
   matching the brief against `classification.md` signal words → registry component(s) in
   `components.md` (e.g. "anemia"/"CKD"/"hemoglobin"/"eGFR" → `ckd`/nephrology; "weight"/"height" →
   `bmi`; "pH"/"pCO2"/"HCO3" → `acid-base`; "SOFA"/"qSOFA" → `sepsis`).
2. **Confirm the plan in chat** before writing anything: name the component(s) you'll compose and where
   you'll place them. If the brief isn't clinical, or no medprotocol module covers it, say so and stop
   — do not invent clinical logic.

## Phase 3: Locate the placement anchor in source

1. The selection's `selector`/`html`/`text`/`classes` mark **where** the new component goes. Grep the
   project for distinctive fragments to find the file + element that renders the anchor.
2. If `source` is set (fast-path tag), open it directly. If you can't locate the anchor confidently,
   report what you searched and ask the doctor to point at the file — do not guess.

## Phase 4: Lease — stage the new component

1. If the brief maps to an existing registry component, install it (`npx medical-ui-cli add
   <component>`) and compose it. If it needs a composition not yet in the registry, build it in the
   doctor's project from the module's `lib/` validations + registry rules — never inline clinical math.
2. **Place it AT the selected anchor — literally.** Insert the component as the last child **inside**
   the located node (or immediately **after** it if inside is impossible). The doctor pointed at a
   specific element and expects it to appear *there*, with no extra click. **Do NOT** add it to a
   `SECTIONS`/tabs/router/nav array or any switch that hides it behind another click — that re-architects
   the page instead of placing it, and is wrong unless the brief explicitly asked for a tab/route. If the
   anchor lives inside a conditionally-rendered region, place it there but flag the visibility caveat.
   Scope strictly to that region.
3. **Stage a diff** (shadow file under `.medprotocol/staged/` + a unified diff for review). Do not
   modify the real source during the lease. See reference/core.md.

## Phase 5: Apply gate + close

1. Land the diff only on approval — `"approved": true` on the work order (overlay Apply) or the
   doctor's in-session sign-off. Otherwise present the diff and stop.
2. Close the order: set `status: done` **and** write a `result` (`{ report }`) summarizing what was
   built and staged — the component(s) chosen, **exactly where it was inserted relative to the selected
   anchor** (e.g. "appended inside the selected `<div class=…>`"), the diff summary, and
   "review/approve in Claude Code" if approval is still pending (reference/queue.md). If you could not
   place it literally at the anchor, say so and why.
3. Recommend `/medical-protocol:overlay-audit` on the new region to verify; don't `--clear` until the
   doctor has read the result.

## NEVER
- Write to source before approval — staging only.
- Build a component for a non-clinical brief, or one no medprotocol module covers — confirm first, else stop.
- Edit outside the located anchor region.
- Add network/runtime deps or external API calls (privacy contract).
- Invent clinical logic — it comes from the module's `lib/` validations and registry rules.
