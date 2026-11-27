# Overlay Audit — Core Procedure

Static, read-only audit of a region selected in the dev overlay — on any app, tagged or not. Driven
by an `audit` work order whose selection is described by DOM descriptors, not a module id.

## Inputs

A drained `audit` work order (`medprotocol overlay --drain --action audit --json`):

```jsonc
{
  "action": "audit",
  "selector": "main:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(1)",
  "tag": "div", "classes": "rounded border p-4",
  "text": "Weight (kg) Height (cm)…", "html": "<div …>…</div>",
  "suggestedId": null, "source": null,
  "url": "http://localhost:3000/", "ts": "…", "status": "processing"
}
```

## 1. Classify

- `suggestedId` set → use it. Otherwise infer the clinical concept from `text`/`html`/`classes` via
  `classification.md` signal words → module.
- Not clinical → report "out of scope for a protocol audit" and skip.

## 2. Locate in source (best-effort)

- Grep the project for distinctive `text`, `classes`, or `html` fragments to find the rendering file.
  Open `source` directly if the fast-path tag is present.
- If the source can't be found, audit the captured `html` and state findings are markup-only.

## 3. Audit dimensions (scoped to the selection)

| Dimension | What to check |
|-----------|---------------|
| **Clinical Correctness** | Critical-value alerts, validation rejects out-of-range input, units shown |
| **Data Completeness** | Required fields present, no orphan calculations |
| **Synthetic Data & Local Only** | No external API calls / analytics in the region; demo data synthetic and labelled; learning-only line shown |
| **Accessibility** | Labels on inputs, color not sole indicator, keyboard navigable, aria |
| **Protocol Adherence** | Matches the inferred module's guidance + `lib/` validations |

Severities: **P0** patient-safety · **P1** clinical-accuracy · **P2** usability · **P3** polish.

## 4. Report format

```
## Overlay Audit — {inferred component or <tag>}  ({score}/20)
Selected at: {url}  ·  {selector}
Source: {located file:line, or "markup-only (source not located)"}

### Clinical Correctness: {n}/4
{findings with file:line/markup + severity}
…(all five dimensions)…

---
Recommended next step:
{fixable → "Use medical-protocol:overlay-implement to replace this region with the {component}"
          or "Use medical-protocol:modify to fix {issue}"}
```

## 5. Close

Edit the order file: set `status: done` **and** write the full report into `result`:

```jsonc
"status": "done",
"result": {
  "score": "14/20",
  "report": "## Overlay Audit — bmi (14/20)\nSelected at: …\n\n### Clinical Correctness: 3/4\n…",
  "suggestions": [ { "skill": "overlay-implement", "label": "Replace with the bmi component" } ]
}
```

`suggestions` is optional — any medical-protocol:<skill> you name (plain text, not code) in the `report` is already
auto-linked into a clickable trigger. Add `suggestions` for a labeled button or to carry a `prompt`
(brief). Clicking a trigger re-runs that skill on the **same selection** (reference/queue.md).
The overlay then shows a clickable "✓ audited — view" pill that opens `report` in its panel. Don't
suggest `--clear` until the user has read it (clearing removes the result). Never delete files
yourself.

## NEVER
- Modify code — report only.
- Audit a non-clinical selection against protocol.
- Pass a region without reading its source or captured markup.
