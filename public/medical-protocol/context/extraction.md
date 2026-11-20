# Extraction Module Context

Extraction vs note: values pulled out of a clinical note, each with the exact words it was read from, checked against the note and shown beside it with those words highlighted. **Extraction only — no clinical analysis.** No ranges, severities, scores, diagnoses or suggestions on this screen.

Logic: `lib/medprotocol/extraction.ts` — import from `@/lib/medprotocol/extraction`. Build: see `building.md`.

---

## Who extracts

The agent does, in the terminal — the doctor's app has no model. The lib only checks.

Run these steps in this order, every time. Each note gets its own folder, `extractions/<hash>/`, named by the first 12 hex characters of the SHA-256 of the raw note. `medprotocol extract --save` computes it; never make one up. Everything about that note lives in that folder:

| File in `extractions/<hash>/` | Written by | Then |
|---|---|---|
| `note.md` | step 1 — the raw note | **never changed** |
| `extraction.json` | step 2 — the first pass | **never changed** — the `extraction-guard` hook blocks any Write/Edit to it and to `note.md` |
| `verify.json` | step 3 — the mistakes found | |
| `corrected.json` | step 3 — the first pass with every proposed correction applied | step 4, if the doctor rejects a correction |
| `artifact.html` | `/medical-protocol:extract-artifact` — the page | |

Below, `<dir>` is that folder, e.g. `extractions/3f9a1c07b2e4`.

1. The doctor gives a note (pasted or a file). Treat it as patient data (`patient-privacy.md`). Make sure `extractions/` is in the project's `.gitignore` (add the line if missing). A pasted note → write it exactly as pasted to `extractions/pasted.md` first; a file → use it where it is. No cleanup, no reformatting. Then run `medprotocol extract --save <that file> --json`: it hashes the bytes, copies them to `<dir>/note.md` and prints `{ dir, existed }`. Delete `extractions/pasted.md` afterwards. `existed: true` means this exact note was saved before: if `<dir>/extraction.json` is there too, tell the doctor it was already extracted and ask whether to reuse it (go on from step 3) — the first pass can't be redone. `<dir>/note.md`, not your memory of the note, is what every quote is checked against.
2. Read `<dir>/note.md` and write one item per value the doctor asked for: `{ field, value, unit?, quote, episode, key?, time? }`. Save the JSON array to `<dir>/extraction.json`; that is the first pass.
   - `quote` is copied **character for character** from the note (the loose pass is a safety net for slips, not permission to paraphrase) — no fixing typos, case, accents or abbreviations. Quote enough words to be unique in the note.
   - `value` is what the note states, not a conversion or a calculation. No derived values (MAP unless the note writes it, BMI, eGFR, totals). For a keyed item, one number only.
   - `unit` as the note writes it; leave it out if the note gives none. Never fill in a unit you assume.
   - `key` when the value is one the calculators take (table below). Blood pressure is two items, `sbp` and `dbp`, with the same quote. Values with no key (medications, findings) are still extracted, just not handed on.
   - `episode` on **every** item, no exceptions:
     - `"current"` — the illness this note is about: its symptoms, exam, readings, results, and what was done for it in this episode (oxygen started, antibiotic given).
     - `"history"` — anything from before it: past illnesses, earlier admissions and their results, background medications, allergies, past surgery.
     - When the note doesn't make it clear, pick `"history"` — a value wrongly tagged current reaches the calculators; one wrongly tagged history only waits for the doctor.
   - `time` as the note states it ("08:00", "on admission", "yesterday"). Several readings of one value → extract each with its `time`; do not choose one.
   - Readings from an earlier admission are extracted, tagged `"history"`.
   - A family member's values, a target ("keep MAP > 65") or a negation ("no fever") are not readings of this patient — leave them out.
   - Not in the note → leave the item out. Never guess, never fill "normal".
3. **Verify.** Start the `extraction-verifier` agent (Agent tool, `subagent_type: "medical-protocol:extraction-verifier"`, or `"extraction-verifier"` if that is the name your agent list shows) with a prompt naming the files and the tools, the full paths filled in: `Verify <dir>. Rules: <path to this extraction.md>. CLI: node <path to medprotocol.cjs>`. Always a fresh-context subagent: it sees only the two files, never this chat, so it can't repeat your mistakes. Never verify in this chat yourself; if the agent can't be started, tell the doctor verification didn't run and stop before step 4. Verification never edits the first pass. It writes `<dir>/verify.json` and `<dir>/corrected.json` (§ Verification).
4. Show the doctor each finding in `<dir>/verify.json`: what is wrong, and the proposed correction. The doctor accepts or rejects each one; remove each rejected correction from `<dir>/corrected.json` (put the first-pass item back), then run `medprotocol extract` on it again. With no findings, skip this step.
5. Save `{ note, items }` to `data/extractions/<hash>.json` in the project (git-ignored — it is patient data), with `note` from `<dir>/note.md` and `items` from `<dir>/corrected.json`, and pass it to the screen.

### Verification

The verifier re-reads `<dir>/note.md` on its own, then:

1. Runs `medprotocol extract --note <dir>/note.md --items <dir>/extraction.json --json` on the first pass.
2. Checks every item against the note and the rules in step 2: is each quote verbatim (`quoted`), is the value the one the quote states, is the unit as written, is the key right, is the episode right (unsure is `history`), is the time stated. It also looks for values the first pass missed and items that should not be there (a target, a negation, a family member's value).
3. Writes `<dir>/verify.json`:

```json
{
  "findings": [
    { "index": 3, "problem": "quote has HR 112, note says HR 102", "correction": { "field": "Heart rate", "key": "hr", "value": "102", "unit": "bpm", "quote": "HR 102 bpm", "episode": "current" } },
    { "index": 5, "problem": "target, not a reading: keep MAP > 65", "correction": null },
    { "problem": "missed: creatinine 1.4 mg/dL", "correction": { "field": "Creatinine", "key": "creatinine", "value": "1.4", "unit": "mg/dL", "quote": "Cr 1.4 mg/dL", "episode": "current" } }
  ]
}
```

   - `index` is the item's position in the first pass (from 0). No `index` means a missed item; `correction: null` means remove the item.
   - `problem` is one plain line saying what is wrong. Mistakes only; no clinical comment.
   - Every `correction` follows the step 2 rules and must check `quoted`. A correction that can't be found verbatim in the note is not offered: keep the finding, with `correction: null` and "no verbatim quote found" in `problem`.
4. Writes `<dir>/corrected.json`: the first pass with every correction applied (replace by `index`, remove the nulls, add the missed items at the end), and runs `medprotocol extract` on it.
5. Reports the findings, one line each. No findings → `findings: []`, and `corrected.json` is a copy of the first pass.

### Field keys

Named after the calculator inputs (`cli.md`). The first unit is the one the calculators expect; others listed are accepted as stated but **not converted**.

| Key | Value | Units accepted |
|---|---|---|
| `sbp` / `dbp` / `map` | Systolic / diastolic / mean arterial pressure | mmHg |
| `hr` | Heart rate | bpm, /min, lpm, beats/min |
| `rr` | Respiratory rate | breaths/min, /min, rpm, resp/min |
| `temp` | Temperature | °C, °F (also º) |
| `spo2` / `fio2` | SpO2 / FiO2 | % |
| `gcs` | Glasgow Coma Scale total | /15 |
| `weight` / `height` | Weight / height | kg, lb, lbs / cm, m, in |
| `ph` | pH | none |
| `pco2` / `pao2` | pCO2 / PaO2 | mmHg |
| `hco3`, `na`, `potassium`, `cl` | Bicarbonate, sodium, potassium, chloride | mEq/L, mmol/L |
| `lactate`, `ketones` | Lactate, ketones | mmol/L |
| `glucose` | Glucose | mg/dL, mmol/L |
| `albumin`, `hb` | Albumin, hemoglobin | g/dL |
| `creatinine`, `bilirubin`, `tc`, `hdl` | Creatinine, bilirubin, total / HDL cholesterol | mg/dL |
| `platelets` | Platelets | ×10³/µL, x10^3/uL, 10^3/µL, /mm³, ×10⁹/L, x10^9/L |
| `a1c` | HbA1c | % |
| `egfr` | eGFR, only when the note states it | mL/min/1.73m², mL/min |
| `acr` | Albumin-to-creatinine ratio | mg/g |
| `urine-output` | Urine output | mL |

The source of truth is `FIELDS` in `extraction.ts`.

### Handing on to another tool

`toInputs(checkExtraction(note, items))` → `{ inputs, review }`:

- `inputs[key]` = `{ value: number, unit?, quote, time? }` — only `current`, `quoted` items with one number in an accepted unit, and only when the key was extracted once. Pass `inputs.sbp.value`, `inputs.creatinine.value`… to the calculator, checking `unit` first (e.g. `temp` in °F → the calculator's Fahrenheit option; `glucose` in mmol/L → its mmol option).
- `review` = `{ item, reason }[]` for every keyed current item held back: `low-confidence` (`edited`, `approximate` or `reordered` — found, but not word for word; a later tool may use it only after the doctor confirms), `not-verified` (`mismatched`, `unverified` or `none`), `no-episode` (missing tag — the CLI rejects these, but a hand-edited data file may not), `not-a-number` (e.g. "120/80" under `sbp`, or an ambiguous "1,200"), `unit` (a unit not in the table), `repeated` (several readings for one key — the doctor or the next tool picks one by `time`).

`history` items are in neither list. They stay in the checked items with their tag, so a later tool can read them on purpose (e.g. a baseline creatinine) with `checked.filter(c => c.episode === "history")`; they never count as a repeat of a current reading.

Extraction stops here. Whatever reads `inputs` does the analysis; this module never does.

---

## Screen spec

**Shows:** two panes — the note (left, the document as written, monospace off, line breaks kept) and the extraction (right, one row per item).

**Inputs:** none typed. Props only.

**Outputs:** `checkExtraction(note, items)` for each row's status; `noteSegments(note, checked)` for the note text and its highlights.

**Interaction:** pointing at (hover or focus) a row highlights its quote in the note and scrolls it into view; pointing at a highlight highlights its row(s). Rows are keyboard-focusable.

**Display rules:**
- Render the note only from `noteSegments` (never re-slice the note in the UI). Plain runs (`items: []`) are plain text; others are `<mark>`.
- Row: field, value + unit, episode tag ("Current illness" / "History") in text, time if stated, the quote in quotation marks, status label in text (not colour alone):
  - `quoted` → "Found in note"
  - `edited` → "Close match: case or accents differ" — the note span is highlighted in a lower-confidence style (e.g. dashed)
  - `approximate` → "Close match: N characters off" (`distance`) — same lower-confidence style; show the note's own words for the span next to the quote, so the doctor sees both
  - `reordered` → "Close match: words in another order" — same lower-confidence style, with the note's own words
  - `mismatched` → "Quote doesn't state this value" — span still highlighted, styled as a warning
  - `unverified` → "Not found in note" — nothing highlighted
  - `none` → "No quote"
- Group rows: "Needs review" (every status but `quoted`) first, then "Current illness", then "History". Never hide a failing item.
- Highlight history quotes in a different style from current ones (e.g. outlined vs filled), plus the text tag — not colour alone.
- `ambiguous` → add "appears more than once — first occurrence marked".
- Header counts: "N of M found in note".
- No reference ranges, colours by clinical severity, or interpretation of any value.

**Props contract:** `data: { note: string; items: ExtractedItem[] }`. `onData?(toInputs(checked))` so a calculator on the same dashboard can take `inputs` as its props (`composition.md`); the extraction screen itself shows no calculator result.

---

## Lib Functions

- `checkItem(note, item)` / `checkExtraction(note, items)` → `CheckedItem` = item + `status: "quoted" | "edited" | "approximate" | "reordered" | "mismatched" | "unverified" | "none"`, `start`/`end` (offsets of the span found in the NFC note, set whenever one was found), `match?: "exact" | "loose" | "words"`, `distance?` (loose and words only, characters off), `ambiguous?` (exact only).
- `noteSegments(note, checked)` → `{ text, items: number[] }[]`; joined, the texts are the note (NFC). `items` are indices into `checked`, so overlapping quotes (systolic and diastolic from one "BP 120/80") share a run.
- `toInputs(checked)` → `{ inputs, review }` (see § Handing on).
- `MAX_EDITS` → 5.
- `EPISODES` → `["current", "history"]`.
- `FIELDS` → the key table above, `{ label, units }` per key.
- `valueInQuote(value, quote)` → every number in the value appears in the quote, in order. `36,5` reads as 36.5; `1,200` as 1.2 or 1200.

Matching runs in three passes, each only when the one before fails, never with a regex built from the quote:

1. **Exact** — a literal substring check after collapsing whitespace (a quote across a line break matches). Gives `quoted` or `mismatched`.
2. **Loose**, only when exact fails — the stretch of the note closest to the quote by character edits (one character added, removed or changed counts 1), ignoring case and accents. Accepted when it is at most `MAX_EDITS` (5) characters off **and** at most a quarter of the quote's length, so a short quote ("K 5.1") cannot match any five characters. 0 edits (case or accents only) gives `edited`, 1–5 gives `approximate`. The value's numbers are then checked against the note's own words, so a quote with a changed digit ("HR 112" for "HR 102") ends `mismatched`.

It catches copying slips (a dropped letter, `µL` for `uL`, a changed ending). It does not catch moved words: each move costs many characters.
3. **Word order** — the quote's words against every run of the same number of note words, in any order. Each quote word pairs with one note word (cheapest pairs first); the summed character slips must fit the same budget, and words holding a digit pair only with an identical word. Gives `reordered`, or `mismatched` if the span doesn't state the value. Example: "4 L/min oxygen via nasal cannula" for "Oxygen 4 L/min via nasal cannulae" → `reordered`, 1 character off ("cannula"/"cannulae").

It does not catch added or dropped words ("via a Venturi mask" vs "via Venturi mask" in another order): the run must have exactly as many words as the quote.

---

## Gotchas

- **Status is computed, never stored.** Don't save `status` in the data file; the screen re-checks on every render.
- **`edited`, `approximate` and `reordered` are not a pass.** They are tracked and shown, at lower confidence, and never reach `inputs`. A reworded quote is not proof the note says exactly that.
- **A number in the quote is not checked against the note's meaning** — only that it is written there. "HR 88 yesterday" quoted for today's HR passes; the agent must quote the right sentence.

---

## CLI

```bash
medprotocol extract --save note.txt --json      # → { "dir": "extractions/<hash>", "existed": false }
medprotocol extract --note extractions/<hash>/note.md --items extractions/<hash>/extraction.json --json
medprotocol extract --note extractions/<hash>/note.md --items extractions/<hash>/corrected.json --artifact extractions/<hash>/artifact.html
```

`--artifact` also writes a standalone page of the extraction (note beside items, same display rules as the Screen spec), for `/medical-protocol:extract-artifact`.

---

## Source

Quote check ported from medextract (`src/core/verify.ts`).
