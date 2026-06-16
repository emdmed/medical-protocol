# Overlay Work-Order Queue (operational reference)

The dev overlay writes one JSON file per selection to `.medprotocol/queue/` at the project root.
The CLI bridge claims them; this skill acts on them. Selections are described by **DOM descriptors**,
not a registry id — the overlay works on any app, including ones built without medical protocol.

## Schema

```jsonc
{
  "action": "add",                      // "audit" | "implement" | "add"
  "prompt": "a CKD anemia tracker",     // add only — free-text brief: what component to build
  "selector": "main > section:nth-of-type(2)", // CSS path to the selected anchor node
  "tag": "section",                     // tagName of the selection
  "classes": "space-y-6",               // class attribute (may be null)
  "text": "Patient overview…",          // trimmed visible text (≤300 chars)
  "html": "<section …>…</section>",     // outerHTML, capped (~4KB) — anchor markup
  "rect": { "x": 320, "y": 113, "w": 640, "h": 280 },
  "suggestedId": null,                  // registry id IFF a data-medprotocol-id was present (fast path)
  "source": null,                       // source path IFF a data-medprotocol-source was present
  "url": "http://localhost:3000/",      // page the selection was made on
  "ts": "2026-06-14T07:46:52.611Z",     // ISO timestamp
  "status": "pending",                  // "pending" → "processing" → "done"
  "approved": false,                    // add/implement only — authorizes applying the staged diff
  "result": null                        // written back on completion — shown in the overlay panel
}
```

For **add**, `prompt` is the spec (what to build) and `selector`/`html` are the **anchor** (where to
put it). When you finish an order, write the full findings into `result` so the overlay can display
them:

```jsonc
"result": {
  "report": "## Overlay Add — built <AnemiaTracker/> …", // the report (markdown) shown in the panel
  "suggestions": [                                        // optional — recommended skills as clickable "Run" buttons
    { "skill": "/medical-protocol:overlay-implement", "label": "Wire up the inputs" }
    // each: { skill (required), label?, prompt? }. Clicking re-runs that skill on the same selection (POST /run).
  ]
}
```

Any `/medical-protocol:<skill>` mention in `report` is **also** auto-linked into a clickable trigger,
so a plain recommendation works without `suggestions`. Use `suggestions` for a labeled button or to
carry a `prompt` (brief) into the triggered run.

`suggestedId`/`source` are an **optional fast-path** for apps already using medprotocol. When null
(the common foreign-app case), locate the anchor source by grepping for `html`/`text`/`classes`
fragments, and classify the requested concept from `prompt` via `classification.md`.

## Lifecycle

1. Overlay writes a `pending` order.
2. `npx medprotocol overlay --drain --json` claims pending orders → sets `processing` and prints the
   dispatch plan. **Always drain via the CLI** — do not hand-scan the directory.
3. This skill processes each `processing` order, then sets it to `done`.
4. `npx medprotocol overlay --clear` removes `done` orders.

## Claiming and closing orders

- **Claim:** run `npx medprotocol overlay --drain --json`, parse the JSON array, filter to `add`.
- **Close:** after finishing an order, edit the file in `.medprotocol/queue/` whose `ts` matches:
  set `"status": "done"` **and** write the full findings into `"result"` (`{ report }`). The
  overlay polls `/status`, sees `hasResult`, and turns the spinner into a clickable "✓ — view" pill
  that opens the `report` in a panel. Do not `--clear` until the doctor has read it (clearing removes
  the result).

## Useful CLI

```bash
npx medprotocol overlay --serve         # serve overlay.js + accept browser selections
npx medprotocol overlay --list          # show pending orders, no changes
npx medprotocol overlay --drain --json  # claim pending orders, emit dispatch plan
npx medprotocol overlay --watch         # live-report new orders as they arrive
npx medprotocol overlay --clear         # remove completed orders
```
