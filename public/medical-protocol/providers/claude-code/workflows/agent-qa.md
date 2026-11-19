# Browser QA Workflow (recipes)

> **For Claude only.** Run automatically as part of the Quality Checklist. This is a background quality step — communicate results in clinical language, not browser testing terminology.

You (the main agent) write a **recipe**: a short test script for one screen. The `medical-protocol:qa-runner` agent (Haiku) runs it in the browser and writes a report. You read the report, fix the code, and run it again.

---

## Prerequisites

1. `agent-browser --version` — if it fails, **skip this workflow**
2. Dev server is responding (`npx wait-on http://localhost:3000 -t 30000`)

---

## 1. Write or update the recipe

One recipe per screen: `qa/recipes/<module>.md` (e.g. `qa/recipes/bmi.md`). If it already exists, update it to match the current screen instead of starting over.

- **Made-up values only.** Never put real patient data in a recipe.
- **Expected numbers come from the CLI**, never from your own math: run `npx medprotocol <cmd> --json` with the recipe's inputs and copy the result. Note the command next to each expectation.
- Name elements by their **visible label** ("Weight field", "Calculate button"), so the runner can find them in the accessibility tree.
- One action or one check per step. Keep it to ~15 steps.

Recipe format:

```markdown
# Recipe: bmi
URL: http://localhost:3000/bmi

## Steps
1. Open the URL. Expect: no JS errors (`agent-browser errors` is empty).
2. Expect: a Weight field and a Height field are visible.
3. Switch units to Metric.
4. Fill Weight with 70.
5. Fill Height with 1.75.
6. Expect: BMI shows 22.9 and the category "Normal".          <!-- npx medprotocol bmi --weight 70 --height-m 1.75 --metric --json -->
7. Fill Weight with 130.
8. Expect: BMI shows 42.4 and the category "Obese III".        <!-- npx medprotocol bmi --weight 130 --height-m 1.75 --metric --json -->
9. Clear Weight. Expect: no "NaN", "undefined", "null" or "[object Object]" anywhere on the page.

## Every recipe ends with
10. Set viewport 768×1024. Expect: no horizontal scroll, results do not overlap labels. Screenshot.
11. Set viewport 1280×800. Expect: same. Screenshot.
12. Press Tab through the page. Expect: every input and button gets visible focus, in reading order.
13. Expect: `agent-browser errors` is empty.
```

Add screen-specific checks, e.g. vital signs: a dangerous value shows an alert; dashboard: every card renders.

---

## 2. Run it

Start the runner with the Agent tool, `subagent_type: "medical-protocol:qa-runner"` (or `"qa-runner"` if that is the name your agent list shows), and this prompt:

> Run the recipe `qa/recipes/<module>.md` against `<URL>`. Write the report to `qa/reports/<module>.md`.

---

## 3. Read the report and fix

Read `qa/reports/<module>.md`.

- **PASS** → done.
- **SKIPPED** → browser unavailable; continue without browser QA.
- **FAIL** → fix the cause in the screen's code, then run the runner again.

| Symptom | Fix |
|---|---|
| Number differs from the CLI | Use the canonical `@/lib/medprotocol/...` function; never re-implement the math |
| "undefined"/"NaN" | Null checks / defaults for empty inputs |
| Popup clipped | `overflow-visible` on the clipping container |
| Results overlap title | Move below inputs, avoid `absolute bottom-*` |
| Overflow at 768px | Responsive Tailwind classes |

If a failure is in the recipe itself (wrong label, wrong expectation), fix the recipe, not the code.

**Bail-out:** 2 fix-and-rerun rounds per screen. Still failing → describe the remaining problem to the doctor in plain clinical language and move on.

---

## Re-running later

Recipes stay in the project. After any change to a screen, run its recipe again (step 2). The doctor can ask for this with `/medical-protocol:qa`.
