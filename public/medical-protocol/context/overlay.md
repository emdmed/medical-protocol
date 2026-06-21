# Overlay Work-Order Queue

The dev overlay exists to **retrofit medical protocol into apps built without it**. It is a thin
selector: the doctor hovers **any** element on **any** page, selects it, and chooses to **Audit** that
region, **Implement** it with medical protocol, or **Add** a brand-new component there from a
free-text brief they type into the overlay. The overlay captures the selection as DOM descriptors — a
CSS selector + `outerHTML` + text — and records the doctor's intent. It **never runs clinical logic**.
Intent lands as one JSON file per selection in the project's queue directory; the CLI bridge drains
the queue and plugin skills act on each work order.

```
overlay selection → POST /queue → .medprotocol/queue/<ts>-<slug>.json → `npx medprotocol overlay --drain` → /medical-protocol:overlay-audit | overlay-implement | overlay-add
```

The overlay does **not** require the target app to use medical protocol. The `data-medprotocol-*`
[tags](./composition.md#overlay-tagging-contract-data-medprotocol--optional-fast-path) are an optional
fast-path: when present they surface as `suggestedId`/`source` and let the skills skip classification.

## Delivery — the overlay is a CLI-served script (no UI install)

The overlay ships as a framework-agnostic vanilla script served by the CLI, **not** as an installed
React component. The doctor runs one process and adds one dev-only script tag:

```bash
npx medprotocol overlay --serve        # default port 7331; --port to change
```

```tsx
// dev only — e.g. in app/layout.tsx. Use next/script in React/Next apps:
// React 19 will NOT execute a raw <script> rendered in JSX.
import Script from "next/script";
{process.env.NODE_ENV === "development" && (
  <Script data-medprotocol-overlay src="http://localhost:7331/overlay.js" strategy="afterInteractive" />
)}
```
(Non-React apps add a plain `<script async>` to their `index.html` instead.)

The doctor never hand-edits this: `/medical-protocol:overlay-setup` starts the server, detects the
mount point (app-router `layout.tsx` → pages `_app.tsx` → `index.html`), and injects the dev-gated
tag idempotently (marked with `data-medprotocol-overlay`). Hand-paste is the documented fallback.

The `--serve` process exposes:
- `GET /overlay.js` — the selector client: hover any element → highlight (press ↑ to widen to the
  parent) → action menu (Audit / Implement / Add a component… / Copy selector). "Add" opens a textarea
  where the doctor types what to build; the brief rides along as the work order's `prompt`.
- `POST /queue` — accepts a work order from the browser and writes it to `.medprotocol/queue/`.
- `GET /status` — returns `{ auto, orders }`, where `orders` is each work order's
  `{ file, action, selector, status, hasResult }` and `auto` reports whether a processor is attached
  (the server was started with `--auto`). The client polls this and pins a **live progress marker** over
  the selected element. When `auto` is on (or the order is `processing`), it shows a spinner ("queued…" →
  "auditing…/implementing…/adding…" as the order moves `pending → processing`) that turns into a green
  "✓" when the order reaches `done`. If the order has a result it becomes a clickable "✓ — view" pill;
  otherwise it fades. When `auto` is **off** and the order is still `pending`, the marker shows a calm
  slate **"queued — needs drain"** state (no spinner) — clicking it explains how to process the order —
  so an unattended selection never looks like a hang. Skills should set `status: done` promptly when they
  finish.
- `GET /result?file=…` — the full `result` for one order, plus its `action` and `approved` flag — fetched
  when the doctor opens the result panel. The panel renders the `report` markdown and makes any
  recommended skill **runnable** (see [Triggering recommended skills](#triggering-recommended-skills-from-the-result-panel)).
- `POST /run` `{ file, skill, prompt? }` — a **skill trigger** from the result panel. The doctor clicks a
  skill the report recommended; the server reads the originating order, **inherits its selection anchor**
  (selector/html/source/url), and mints a new `skill` work order that re-processes that same region with
  the named skill. `skill` is validated against the `medical-protocol:` namespace. With `--auto` it kicks
  the dispatcher immediately; otherwise the doctor runs the overlay queue in Claude Code to process it.
- `POST /approve` `{ file }` — the result panel's **Apply** button. For a staged `add`/`implement` order
  it sets `approved: true` and re-queues it (`status → pending`) so the matching skill **lands the staged
  diff** (re-applies, does not re-stage). With `--auto` this also kicks the dispatcher to apply
  immediately; otherwise the doctor runs the overlay skill in Claude Code to land it.

The script POSTs back to the origin it was loaded from, so the browser→filesystem write seam lives
entirely in the one CLI process that already owns the queue. Nothing else needs to be installed in
the target app.

### Closing the loop: `--auto`

By default the overlay only **records** intent — a human still runs `/medical-protocol:overlay-audit`
(or `overlay-implement`) in Claude Code to actually process the queue, and the marker sits in the
slate "queued — needs drain" state until they do (the client learns there's no processor from
`/status`'s `auto: false`). `npx medprotocol overlay
--serve --auto` closes that loop: on each selection it spawns a **headless Claude Code run**
(`claude -p "<process the queue>" --permission-mode acceptEdits`) in the project directory, which
drains the order, runs the matching skill, and writes the result back — so the overlay's spinner
turns into a viewable report with no terminal step. It is **opt-in** (runs Claude unattended, needs
the `claude` CLI, costs tokens). Runs are debounced: one run drains all pending orders; selections
that arrive mid-run trigger exactly one follow-up. Implement and Add still only **stage** a diff — the
approval gate is never bypassed.

## Queue location

`.medprotocol/queue/` at the doctor's project root. Git-ignorable — transient local intent, not
source. One file per selection, named `<ISO-timestamp>-<slug>.json` (`:`/`.` replaced by `-`; slug
is `suggestedId`/`tag`), e.g. `2026-06-14T07-46-52-611Z-h1.json`.

## Work-order schema

```jsonc
{
  "action": "implement",                // REQUIRED — "audit" | "implement" | "add" | "skill"
  "skill": null,                        // skill only — slash command to run (minted by POST /run)
  "prompt": null,                       // add only — free-text brief: what component to build
  "selector": "main > section:nth-of-type(2) > div:nth-of-type(1)", // CSS path to the node
  "tag": "div",                         // tagName of the selection
  "classes": "rounded border p-4",      // class attribute (may be null)
  "text": "Weight (kg) Height (cm)…",   // trimmed visible text (≤300 chars)
  "html": "<div …>…</div>",             // outerHTML, capped (~4KB) — primary identifier
  "rect": { "x": 320, "y": 113, "w": 640, "h": 32 },
  "suggestedId": null,                  // registry id IFF a data-medprotocol-id was present (fast path)
  "source": null,                       // source path IFF a data-medprotocol-source was present
  "url": "http://localhost:3000/",      // page the selection was made on
  "ts": "2026-06-14T07:46:52.611Z",     // ISO timestamp
  "status": "pending",                  // "pending" | "processing" | "done"
  "approved": false                     // implement/add only — approval to apply the staged diff
}
```

| Field | Required | Notes |
|---|---|---|
| `action` | yes | `audit` (static, read-only), `implement` (retrofit existing markup, lease/apply diff), `add` (build a new component from `prompt`, lease/apply diff), or `skill` (re-run a report-recommended skill on the same selection — minted by `POST /run`, never posted by the browser directly). |
| `skill` | skill only | Slash command to run, e.g. `/medical-protocol:overlay-implement`. Set by `POST /run`; validated to the `medical-protocol:` namespace. |
| `prompt` | add only* | Free-text brief of the component to build. Required when `action: "add"`; for `skill` it is an optional extra brief; ignored otherwise. The selection acts as the placement anchor. |
| `selector` | yes* | CSS path to the selected node. *POST requires `selector` **or** `html`. |
| `tag` / `classes` / `text` / `html` | no | Descriptors the skills use to classify the region and locate it in source. `html` is the primary identifier. |
| `rect` | no | Bounding box at selection time — context only. |
| `suggestedId` | no | Optional fast-path: registry id from `data-medprotocol-id`. Usually `null` (foreign app). |
| `source` | no | Optional fast-path: source path from `data-medprotocol-source`. |
| `url` | no | Where the selection happened — context for the report. |
| `ts` | yes | ISO timestamp; basis for the filename. |
| `status` | yes | Lifecycle: `pending` → `processing` (claimed by `--drain`) → `done`. |
| `approved` | no | Implement/add only. The overlay's "Apply" action sets `true` to authorize landing the diff. |

## Lifecycle

1. **Record** — overlay writes a `pending` work order.
2. **Drain** — `npx medprotocol overlay --drain` claims each `pending` order (sets `processing`) and
   emits a dispatch plan naming the skill to run. A Claude Code hook or the doctor runs it.
3. **Act** — the matching skill processes the order:
   - **Audit** → classify the selection, locate it in source, **report findings** (read-only), mark `done`.
   - **Implement** → classify, locate, stage a diff (lease/apply); land it only on approval, then mark `done`.
   - **Add** → classify the `prompt`, locate the anchor, build a new component, stage a diff (lease/apply); land only on approval, then mark `done`.
4. **Clear** — `npx medprotocol overlay --clear` removes `done` orders.

## Action semantics

### Audit (static, read-only)
Classify the selection (`suggestedId` if present, else infer from `html`/`text`/`classes` via
`classification.md`), locate it in source by grepping for the captured fragments, and **report
findings** against the inferred module's rules + `lib/` validations. Never modifies files. Skill:
`/medical-protocol:overlay-audit`.

### Implement (lease / apply diff)
Classify the selection and **confirm the inferred component in chat**, locate the markup in source,
then **stage a diff** that replaces it with the medprotocol component — nothing is written until the
doctor approves (`approved: true` from the overlay's "Apply", or in-session sign-off). Same lease →
apply trust model Impeccable uses for live edits. Skill: `/medical-protocol:overlay-implement`.

### Add (lease / apply diff)
The doctor selects a region and types a **free-text brief** (`prompt`) of a component to build — e.g.
*"a chronic kidney disease anemia tracker"*. The selection is the **placement anchor**, not the thing
being replaced. Classify the brief against `classification.md` → registry component(s), **confirm the
plan in chat**, locate the anchor in source, then **stage a diff** that inserts the newly composed
component there. Same approval gate as Implement. With `--auto`, a headless Claude run builds it
unattended (still staging-only). Skill: `/medical-protocol:overlay-add`. **Add builds new capability;
Implement retrofits existing markup.**

## Triggering recommended skills from the result panel

Audit/implement/add reports routinely recommend a next step — *"Run `/medical-protocol:overlay-implement`
to replace this region"* or *"Run `/medical-protocol:modify` to fix …"*. The result panel makes those
recommendations **actionable** instead of copy-paste:

- **Inline triggers** — every `/medical-protocol:<skill>` mention in the rendered `report` becomes a
  clickable chip (code samples inside fenced/inline code are left untouched).
- **Suggested actions** — a skill may also attach a structured `result.suggestions` array; each entry
  renders as a "Run" button under the report, and can carry a `label` and a `prompt` (brief):

  ```jsonc
  "result": {
    "report": "## Overlay Audit — bmi (14/20)\n…\nRecommended: Run /medical-protocol:overlay-implement …",
    "suggestions": [
      { "skill": "/medical-protocol:overlay-implement", "label": "Replace with the bmi component" },
      { "skill": "/medical-protocol:modify", "label": "Fix the missing validation", "prompt": "add height/weight range guards" }
    ]
  }
  ```

Clicking either kind `POST`s to `/run`, which mints a `skill` work order on the **same selection**. The
loop is identical to the rest of the overlay: with `--auto` a headless run processes it; otherwise the
doctor runs the overlay queue in Claude Code. Skills that build/edit files still **stage** a diff behind
the approval gate — the panel shows an **Apply** button for a staged `skill` result just like `implement`/`add`.

## Why a queue (not a direct call)
The overlay runs in the browser; the skills run in Claude Code. The flat-file queue is the decoupling
seam: framework-agnostic, inspectable, git-ignorable, and replayable. The CLI bridge is the only
component that touches both sides.
