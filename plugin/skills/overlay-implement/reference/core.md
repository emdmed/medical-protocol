# Overlay Implement — Core Procedure

Retrofit a medical-protocol component into a region the doctor selected in the dev overlay — on an
app that may have been built **without** medical protocol. Classify the selection, locate it in
source, stage a diff, apply on approval. Lease → apply, mirroring Impeccable's live-edit trust model.

## Inputs

A drained `implement` work order (`npx medprotocol overlay --drain --json`):

```jsonc
{
  "action": "implement",
  "selector": "main:nth-of-type(1) > section:nth-of-type(2) > div:nth-of-type(1)",
  "tag": "div",
  "classes": "rounded border p-4",
  "text": "Weight (kg) Height (cm) Calculate BMI",
  "html": "<div class=\"rounded border p-4\">…</div>",   // capped ~4KB
  "suggestedId": null,   // set only if the app already uses medprotocol
  "source": null,        // set only if a data-medprotocol-source tag was present
  "url": "http://localhost:3000/", "ts": "…", "status": "processing"
}
```

The selection is described by **DOM descriptors, not a registry id** — the whole point is to work on
untagged foreign markup.

## 1. Classify (infer → confirm)

- `suggestedId` present → use it (fast-path; app already medprotocol-based).
- Otherwise infer from `text` + `html` + `classes` via `classification.md` signal words → registry
  component. Examples: weight/height/BMI → `bmi`; pH/pCO2/HCO3/anion gap → `acid-base`;
  creatinine/eGFR → `ckd`; SOFA/qSOFA/lactate → `sepsis`.
- **Confirm in chat**: "This looks like a `{component}` — implement that here?" Stop if the selection
  isn't clinical or the doctor declines.

## 2. Locate in source

The work order has no file path (foreign app). Find it from descriptors:
- Grep the project for distinctive `text` substrings, unusual `classes`, or attribute/string
  fragments from `html`.
- Narrow to the element that renders the selection. Confirm by matching surrounding markup.
- `source` set → open it directly. Can't locate confidently → report the searches and ask the doctor;
  never guess a file.

## 3. Lease — stage, don't write

1. Ensure the component is installed: `npx medical-ui-cli add <component>`.
2. Compose the replacement: swap the located markup for the medprotocol component, wiring any obvious
   inputs (e.g. existing weight/height fields) into its props. Scope strictly to the located region.
3. Stage it: write the modified file to `.medprotocol/staged/<path>` and produce a unified diff
   (`git diff --no-index <path> .medprotocol/staged/<path>`). Present the diff. Do **not** touch the
   real file during the lease.

## 4. Apply gate

Land only when approval is present:

| Channel | Signal |
|---|---|
| Overlay "Apply" | `"approved": true` on the work order |
| Claude Code review | Doctor approves the diff in this session |

On approval: apply the staged change to source, remove the shadow file, confirm what landed.
No approval: leave the diff staged and stop.

## 5. Close

Edit the order file: set `status: done` **and** write a `result` summarizing the outcome so the
doctor sees it in the overlay panel:

```jsonc
"status": "done",
"result": { "report": "Staged: replaced the weight/height block with <BMICalculator/> (bmi/bmi-card.tsx).\nDiff: +1 component, -12 lines of hand-rolled inputs.\nApproval pending — review/approve in Claude Code." }
```

Recommend `/medical-protocol:overlay-audit` on the same region to verify. Don't `--clear` until the
doctor has read the result (clearing removes it).

## Scope discipline
- One selection per order; only the located region.
- No runtime/network deps, no external API calls (privacy contract).
- Clinical logic from `lib/` validations + registry rules, never invented inline.
