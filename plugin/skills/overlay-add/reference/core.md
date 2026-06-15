# Overlay Add — Core Procedure

Build a **new** medical-protocol component from the doctor's free-text brief and place it into the
region they selected in the dev overlay. The selection is a **placement anchor**, not the thing being
replaced. Classify the brief, locate the anchor in source, stage a diff, apply on approval. Lease →
apply, mirroring Impeccable's live-edit trust model.

`add` vs `implement`: **implement** retrofits the *existing* selected markup into a medprotocol
component; **add** builds something *new* described by `prompt` and inserts it at the anchor.

## Inputs

A drained `add` work order (`npx medprotocol overlay --drain --json`):

```jsonc
{
  "action": "add",
  "prompt": "a chronic kidney disease anemia tracker",  // REQUIRED — what to build
  "selector": "main:nth-of-type(1) > section:nth-of-type(2)", // WHERE to put it (anchor)
  "tag": "section",
  "classes": "space-y-6",
  "text": "Patient overview …",
  "html": "<section class=\"space-y-6\">…</section>",   // capped ~4KB — anchor markup
  "suggestedId": null,   // set only if the app already uses medprotocol
  "source": null,        // set only if a data-medprotocol-source tag was present
  "url": "http://localhost:3000/", "ts": "…", "status": "processing"
}
```

The **`prompt` is the spec**; the DOM descriptors say **where** the new component lands.

## 1. Classify the brief (infer → confirm)

- Parse `prompt` for clinical signal words and map them via `classification.md` → registry
  component(s) in `components.md`. Examples: anemia/CKD/hemoglobin/eGFR/creatinine → `ckd`/nephrology;
  weight/height/BMI → `bmi`; pH/pCO2/HCO3/anion gap → `acid-base`; SOFA/qSOFA/lactate → `sepsis`.
- A brief may compose **several** modules (e.g. a tracker = a calculator + a trend list). Name them.
- **Confirm in chat**: "I'll build `{component(s)}` and place it in `{anchor}` — go?" Stop if the brief
  isn't clinical or no medprotocol module covers it. Never invent clinical logic to fill a gap.

## 2. Locate the anchor in source

The work order has no file path (foreign app). Find the **exact JSX node** the doctor selected:
- Grep the project for distinctive `text` substrings, unusual `classes`, or attribute/string
  fragments from `html`. The captured `selector`/`html` describe one specific element — find *that*
  element's JSX, not just the file or some related list/registry it belongs to.
- The located node is the **literal insertion point**. That is where the component goes.
- `source` set → open it directly. Can't locate confidently → report the searches and ask the doctor;
  never guess a file.

## 3. Lease — build + stage, don't write

1. Install/compose the component(s):
   - Registry match → `npx medical-ui-cli add <component>`, then compose it.
   - No exact match → build it in the doctor's project from the module's `lib/` validations + registry
     rules. Reuse existing components; never re-implement clinical math inline.
2. **Place it AT the selected anchor — literally.** This is the contract: the doctor pointed at a
   specific element and expects the component to appear *there*. Insert the new component as the **last
   child inside the located node**, or immediately **after** it if inside is impossible (self-closing
   element, controlled list item). The rendered result must show up inside/next to the selected region
   on the page, with no extra click.
   - **Do NOT re-architect the page to place it.** Adding it to a `SECTIONS`/tabs/router/nav array, a
     menu, or any switch that hides it behind another click is **wrong** unless the doctor's brief
     explicitly asked for a tab/route. Idiomatic-but-hidden placement defeats the point of selecting an
     element. When in doubt, place it literally and inline.
   - If the anchor sits inside a conditionally-rendered region (e.g. a tab body that only shows when
     some state is active), place it there but **flag in the confirmation and the result** that it
     inherits that region's visibility — don't silently route it elsewhere.
   - Scope strictly to the anchor region; wire any obvious existing inputs into props.
3. Stage it: write the modified/new files under `.medprotocol/staged/<path>` and produce a unified
   diff (`git diff --no-index <path> .medprotocol/staged/<path>`). Present the diff. Do **not** touch
   the real files during the lease.

## 4. Apply gate

Land only when approval is present:

| Channel | Signal |
|---|---|
| Overlay "Apply" | `"approved": true` on the work order |
| Claude Code review | Doctor approves the diff in this session |

On approval: apply the staged changes to source, remove the shadow files, confirm what landed.
No approval: leave the diff staged and stop.

## 5. Close

Edit the order file: set `status: done` **and** write a `result` summarizing the outcome so the
doctor sees it in the overlay panel:

```jsonc
"status": "done",
"result": { "report": "Built a CKD anemia tracker: added <Anemia/> (components/nephrology/anemia.tsx). Placed it **inline, as the last child inside the selected `<div class=\"min-w-0\">`** (the patient main-content column) — so it renders right where you pointed, no extra click.\nDiff: +1 component import, +5 lines render block at the anchor.\nApproval pending — review/approve in Claude Code." }
```

The placement line must name the **selected element** and how the component sits relative to it
(inside / after). If you had to deviate from literal placement, state that and why.

Recommend `/medical-protocol:overlay-audit` on the new region to verify. Don't `--clear` until the
doctor has read the result (clearing removes it).

## Scope discipline
- One brief per order; insert only at the located anchor.
- No runtime/network deps, no external API calls (privacy contract).
- Clinical logic from `lib/` validations + registry rules, never invented inline.
