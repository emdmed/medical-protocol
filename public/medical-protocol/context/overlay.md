# Overlay Work-Order Queue

The dev overlay exists to **retrofit medical protocol into apps built without it**. It is a thin
selector: the doctor hovers **any** element on **any** page, selects it, and chooses to **Audit** that
region or **Implement** it with medical protocol. The overlay captures the selection as DOM
descriptors — a CSS selector + `outerHTML` + text — and records the doctor's intent. It **never runs
clinical logic**. Intent lands as one JSON file per selection in the project's queue directory; the
CLI bridge drains the queue and plugin skills act on each work order.

```
overlay selection → POST /queue → .medprotocol/queue/<ts>-<slug>.json → `npx medprotocol overlay --drain` → /medical-protocol:overlay-audit | overlay-implement
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
  parent) → action menu (Audit / Implement / Copy selector).
- `POST /queue` — accepts a work order from the browser and writes it to `.medprotocol/queue/`.
- `GET /status` — returns each work order's `{ file, action, selector, status }`. The client polls
  this and pins a **live progress marker** over the selected element: a spinner ("queued…" →
  "auditing…/implementing…" as the order moves `pending → processing`) that turns into a green "✓"
  when the order reaches `done`, then fades. This is the doctor's feedback that the agent is working
  — so the Audit/Implement skills should set `status: done` promptly when they finish.

The script POSTs back to the origin it was loaded from, so the browser→filesystem write seam lives
entirely in the one CLI process that already owns the queue. Nothing else needs to be installed in
the target app.

### Closing the loop: `--auto`

By default the overlay only **records** intent — a human still runs `/medical-protocol:overlay-audit`
(or `overlay-implement`) in Claude Code to actually process the queue. `npx medprotocol overlay
--serve --auto` closes that loop: on each selection it spawns a **headless Claude Code run**
(`claude -p "<process the queue>" --permission-mode acceptEdits`) in the project directory, which
drains the order, runs the matching skill, and writes the result back — so the overlay's spinner
turns into a viewable report with no terminal step. It is **opt-in** (runs Claude unattended, needs
the `claude` CLI, costs tokens). Runs are debounced: one run drains all pending orders; selections
that arrive mid-run trigger exactly one follow-up. Implement still only **stages** a diff — the
approval gate is never bypassed.

## Queue location

`.medprotocol/queue/` at the doctor's project root. Git-ignorable — transient local intent, not
source. One file per selection, named `<ISO-timestamp>-<slug>.json` (`:`/`.` replaced by `-`; slug
is `suggestedId`/`tag`), e.g. `2026-06-14T07-46-52-611Z-h1.json`.

## Work-order schema

```jsonc
{
  "action": "implement",                // REQUIRED — "audit" | "implement"
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
  "approved": false                     // implement only — approval to apply the staged diff
}
```

| Field | Required | Notes |
|---|---|---|
| `action` | yes | `audit` (static, read-only) or `implement` (lease/apply diff). |
| `selector` | yes* | CSS path to the selected node. *POST requires `selector` **or** `html`. |
| `tag` / `classes` / `text` / `html` | no | Descriptors the skills use to classify the region and locate it in source. `html` is the primary identifier. |
| `rect` | no | Bounding box at selection time — context only. |
| `suggestedId` | no | Optional fast-path: registry id from `data-medprotocol-id`. Usually `null` (foreign app). |
| `source` | no | Optional fast-path: source path from `data-medprotocol-source`. |
| `url` | no | Where the selection happened — context for the report. |
| `ts` | yes | ISO timestamp; basis for the filename. |
| `status` | yes | Lifecycle: `pending` → `processing` (claimed by `--drain`) → `done`. |
| `approved` | no | Implement only. The overlay's "Apply" action sets `true` to authorize landing the diff. |

## Lifecycle

1. **Record** — overlay writes a `pending` work order.
2. **Drain** — `npx medprotocol overlay --drain` claims each `pending` order (sets `processing`) and
   emits a dispatch plan naming the skill to run. A Claude Code hook or the doctor runs it.
3. **Act** — the matching skill processes the order:
   - **Audit** → classify the selection, locate it in source, **report findings** (read-only), mark `done`.
   - **Implement** → classify, locate, stage a diff (lease/apply); land it only on approval, then mark `done`.
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

## Why a queue (not a direct call)
The overlay runs in the browser; the skills run in Claude Code. The flat-file queue is the decoupling
seam: framework-agnostic, inspectable, git-ignorable, and replayable. The CLI bridge is the only
component that touches both sides.
