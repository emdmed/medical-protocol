# Browser QA Workflow (recipes)

> **For Claude only.** Run automatically as part of the Quality Checklist. This is a background quality step — communicate results in clinical language, not browser testing terminology.

You (the main agent) write a **recipe**: a short test script for one screen. The `medical-protocol:qa-runner` agent (Haiku) runs it in the browser and writes a report. You read the report, fix the code, and run it again.

---

## Prerequisites

1. `agent-browser --version` — if it fails, **skip this workflow**
2. Dev server is responding (`npx wait-on http://localhost:3000 -t 30000`)

---

## 1. Write or update the recipe

One recipe per screen: `qa/recipes/<module>.md` (e.g. `qa/recipes/bmi.md`). If it already exists, update it to match the current screen instead of starting over — keep every case the user added.

A recipe has two parts:
- **Cases** — for the user. One line per patient case, in plain clinical words: who the patient is, what is entered, what the screen should show. No UI or code terms. A user must be able to read and edit this list.
- **Steps** — for the runner. The clicks and checks that test each case, each tagged with its case number.

Rules:
- **Made-up values only.** Never put real patient data in a recipe.
- **Expected numbers come from the CLI**, never from your own math: run `medprotocol <cmd> --json` with the recipe's inputs and copy the result. Note the command next to each expectation.
- Name elements by their **visible label** ("Weight field", "Calculate button"), so the runner can find them in the accessibility tree.
- One action or one check per step. Keep it to ~15 steps.

Recipe format:

```markdown
# Recipe: bmi
URL: http://localhost:3000/bmi

## Cases
1. Adult, 70 kg, 1.75 m → BMI 22.9, Normal          <!-- medprotocol bmi --weight 70 --height-m 1.75 --metric --json -->
2. Adult, 130 kg, 1.75 m → BMI 42.4, Obese III      <!-- medprotocol bmi --weight 130 --height-m 1.75 --metric --json -->
3. Weight left empty → no result shown, no error message
4. Screen opens cleanly on a tablet and on a desktop
5. Usable with the keyboard alone

## Steps
1. (Case 1) Open the URL. Expect: no JS errors (`agent-browser errors` is empty).
2. (Case 1) Switch units to Metric. Fill Weight with 70. Fill Height with 1.75.
3. (Case 1) Expect: BMI shows 22.9 and the category "Normal".
4. (Case 2) Fill Weight with 130.
5. (Case 2) Expect: BMI shows 42.4 and the category "Obese III".
6. (Case 3) Clear Weight. Expect: no BMI value, and no "NaN", "undefined", "null" or "[object Object]" anywhere on the page.
7. (Case 4) Set viewport 768×1024. Expect: no horizontal scroll, results do not overlap labels. Screenshot.
8. (Case 4) Set viewport 1280×800. Expect: same. Screenshot. Expect: `agent-browser errors` is empty.
9. (Case 5) Press Tab through the page. Expect: every input and button gets visible focus, in reading order.
```

Every recipe has the empty-input, tablet/desktop and keyboard cases. Add screen-specific cases, e.g. vital signs: "BP 190/120 → high blood pressure alert shown"; dashboard: "every card shows".

### Cases the user adds

The user may ask in their own words: "also check a 45 kg, 1.60 m patient". Add it as a new case:
- **No expected value given** → get it from `medprotocol <cmd> --json` and write it in.
- **User's expected value matches the CLI** → add it as stated.
- **User's expected value differs from the CLI** → do not pick one silently. Tell the user which guideline the calculation follows (see the module's context doc), e.g. "The calculator uses the WHO cut-offs, which classify a BMI of 17.6 as underweight. Should the screen follow a different guideline?" Never change `lib/medprotocol/` — if the user wants a different guideline, say it needs a change to the clinical library.

Confirm in one line: "Added: 45 kg, 1.60 m → BMI 17.6, Underweight. I'll check it every time."

Add screen-specific checks, e.g. vital signs: a dangerous value shows an alert; dashboard: every card renders.

---

## 2. Run it

Start the runner with the Agent tool, `subagent_type: "medical-protocol:qa-runner"` (or `"qa-runner"` if that is the name your agent list shows), and this prompt:

> Run the recipe `qa/recipes/<module>.md` against `<URL>`. Write the report to `qa/reports/<module>.md`.

---

## 3. Read the report and fix

Read `qa/reports/<module>.md`.

- **PASS** → done, go to step 4.
- **SKIPPED** → browser unavailable; continue without browser QA and tell the user the screen could not be checked automatically.
- **FAIL** → fix the cause in the screen's code, then run the runner again.

| Symptom | Fix |
|---|---|
| Number differs from the CLI | Use the canonical `@/lib/medprotocol/...` function; never re-implement the math |
| "undefined"/"NaN" | Null checks / defaults for empty inputs |
| Popup clipped | `overflow-visible` on the clipping container |
| Results overlap title | Move below inputs, avoid `absolute bottom-*` |
| Overflow at 768px | Responsive Tailwind classes |

If a failure is in the recipe itself (wrong label, wrong expectation), fix the recipe, not the code.

**Bail-out:** 2 fix-and-rerun rounds per screen. Still failing → report it in step 4 and move on.

---

## 4. Tell the user

Summarize by **case**, in clinical words. Never show the report, steps, screenshots, file names or technical terms.

> ✓ 5 of 5 checks passed for the BMI calculator — correct for a normal-weight and an obese patient, handles an empty weight, works on tablet and desktop, and by keyboard.

When something was fixed or still fails, say what the user would have seen:

> ✓ 4 of 5 checks passed.
> ✗ On a tablet-sized screen the result covered the weight label — fixed and re-checked.

> ✗ For a 130 kg patient the screen showed no category. I could not fix this automatically — please don't rely on the category until it's fixed.

After the first run on a screen, offer once: "You can ask me to add any patient case you'd like checked."

---

## Re-running later

Recipes stay in the project. After any change to a screen, run its recipe again (step 2). The user can ask for this in plain words ("check it", "is it working?") or with `/medical-protocol:qa`.
