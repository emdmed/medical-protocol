# Overlay Work-Order Queue (operational reference)

The dev overlay writes one JSON file per selection to `.medprotocol/queue/` at the project root.
The CLI bridge claims them; this skill acts on them. Selections are described by **DOM descriptors**,
not a registry id — the overlay works on any app, including ones built without medical protocol.

## Schema

```jsonc
{
  "action": "audit",                    // "audit" | "implement"
  "selector": "main > section:nth-of-type(2) > div:nth-of-type(1)", // CSS path to the selected node
  "tag": "div",                         // tagName of the selection
  "classes": "rounded border p-4",      // class attribute (may be null)
  "text": "Weight (kg) Height (cm)…",   // trimmed visible text (≤300 chars)
  "html": "<div …>…</div>",             // outerHTML, capped (~4KB) — primary identifier
  "rect": { "x": 320, "y": 113, "w": 640, "h": 32 },
  "suggestedId": null,                  // registry id IFF a data-medprotocol-id was present (fast path)
  "source": null,                       // source path IFF a data-medprotocol-source was present
  "url": "http://localhost:3000/",      // page the selection was made on
  "ts": "2026-06-14T07:46:52.611Z",     // ISO timestamp
  "status": "pending",                  // "pending" → "processing" → "done"
  "approved": false,                    // implement only — authorizes applying the staged diff
  "result": null                        // written back on completion — shown in the overlay panel
}
```

When you finish an order, write the full findings into `result` so the overlay can display them:

```jsonc
"result": {
  "score": "14/20",                     // optional headline (audit)
  "report": "## Overlay Audit — bmi …"  // the full report text (markdown) the doctor reads in the panel
}
```

`suggestedId`/`source` are an **optional fast-path** for apps already using medprotocol. When null
(the common foreign-app case), classify the selection from `html`/`text`/`classes` via
`classification.md` and locate the source by grepping for those fragments.

## Lifecycle

1. Overlay writes a `pending` order.
2. `npx medprotocol overlay --drain --json` claims pending orders → sets `processing` and prints the
   dispatch plan. **Always drain via the CLI** — do not hand-scan the directory.
3. This skill processes each `processing` order, then sets it to `done`.
4. `npx medprotocol overlay --clear` removes `done` orders.

## Claiming and closing orders

- **Claim:** run `npx medprotocol overlay --drain --json`, parse the JSON array, filter to this
  skill's `action`.
- **Close:** after finishing an order, edit the file in `.medprotocol/queue/` whose `ts` matches:
  set `"status": "done"` **and** write the full findings into `"result"` (`{ score?, report }`). The
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
