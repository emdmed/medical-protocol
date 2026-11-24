# Recipe: simplify-cli

QA for the cleanup on `plan/simplify-the-cli-commands-and` (diff against `main`). Same rules as `qa/recipes/cli.md`: expected values are worked out by hand, never copied from CLI output. Made-up values only.

What changed, and so what this recipe checks:

- `diabetes t1-vs-t2` lost `--on-insulin` (it never affected the result).
- The ABG interpretation of an overcompensation reads "overcompensated by …" instead of "with Overcompensated by …".
- Unused code was removed (`ABGValues`/`ABGResult`/`Result` types, the default and `BloodOxygenValidations` exports, two unused `getMASLDRiskStratification` arguments, three `extract` exports). Nothing else may behave differently.

Run every CLI command from the repo root as `node plugin/scripts/medprotocol.cjs <command>`, except the `extract` steps, which say where to run.

## Cases
1. Onset at 25 y, BMI 22, autoantibodies, C-peptide 150 pmol/L, family history of T1D, past DKA → Type 1 <!-- C-peptide < 200 → T1; all five features on the T1 side -->
2. Onset at 55 y, BMI 32, no autoantibodies, C-peptide 700 pmol/L, family history of T2D → Type 2 <!-- C-peptide > 600 and no autoantibodies -->
3. `--on-insulin` is gone: help does not list it, and passing it gives a short error, never a crash dump
4. pH 7.34, pCO2 60, HCO3 31, acute → respiratory acidosis, overcompensated by metabolic alkalosis <!-- acute: expected HCO3 = 24 + (60 − 40)/10 = 26 ± 3 → 23–29; 31 is above it -->
5. pH 7.25, pCO2 29, HCO3 14 → metabolic acidosis, compensated; wording unchanged <!-- Winter: 1.5 × 14 + 8 = 29 ± 2 -->
6. `extract` still checks a quote, rejects a malformed items file, saves a note once, and writes the page
7. The removed names are gone from code and docs, and the committed build matches the source
8. Everything else behaves as before

## Steps
1. (Case 1) Run `diabetes t1-vs-t2 --age 25 --bmi 22 --autoantibodies --c-peptide 150 --fhx-t1d --dka-history`. Expect: exit code 0, classification Type 1, T1 features list young onset, autoantibody+, normal BMI, family Hx T1D and DKA history, no T2 features.
2. (Case 2) Run `diabetes t1-vs-t2 --age 55 --bmi 32 --c-peptide 700 --fhx-t2d --json`. Expect: exit code 0, valid JSON, classification Type 2, T2 features list older onset, autoantibody−, obese and family Hx T2D, no T1 features, no `onInsulin` key anywhere.
3. (Case 3) Run `diabetes --help`. Expect: exit code 0, no line mentions `--on-insulin`; the other T1 vs T2 options (`--age`, `--bmi`, `--autoantibodies`, `--c-peptide`, `--fhx-t1d`, `--fhx-t2d`, `--dka-history`, `--autoimmune`) are still listed.
4. (Case 3) Run `diabetes t1-vs-t2 --age 25 --bmi 22 --on-insulin`. Expect: exit code 1, an error naming the unknown option `--on-insulin`, no line starting with `    at `.
5. (Case 4) Run `abg --ph 7.34 --pco2 60 --hco3 31`. Expect: exit code 0, disorder Respiratory Acidosis, compensation Overcompensated, expected range 23–29, Metabolic Alkalosis as additional disorder, and the interpretation is exactly `Primary Respiratory Acidosis, overcompensated by Metabolic Alkalosis.` (no "with Overcompensated").
6. (Case 4) Run the same command with `--json`. Expect: exit code 0, valid JSON, `compensation` is still `Overcompensated` (capitalised; only the sentence changed), same `interpretation` as step 5.
7. (Case 5) Run `abg --ph 7.25 --pco2 29 --hco3 14`. Expect: exit code 0, metabolic acidosis, pCO2 29 inside the expected range, interpretation `Primary Metabolic Acidosis, compensated by Respiratory Alkalosis.`
8. (Case 6) Make an empty temp folder and work inside it for steps 8–12, calling the CLI by its absolute path. Write `note.txt` containing `Made-up patient. BP 118/76, HR 72.` and `items.json` containing `[{"field":"Heart rate","value":"72","quote":"HR 72","episode":"current","key":"hr"}]`. Run `extract --note note.txt --items items.json --json`. Expect: exit code 0, valid JSON, the item has status `quoted`, `inputs.hr.value` is 72, `review` is empty.
9. (Case 6) Write `bad.json` containing `{"a":1}` and run `extract --note note.txt --items bad.json`. Expect: exit code 1, an error saying `--items` must be a JSON array, no line starting with `    at `.
10. (Case 6) Run `extract --save note.txt`. Expect: exit code 0, prints a folder `extractions/<12 hex characters>`, and that folder holds `note.md` with the note text.
11. (Case 6) Run `extract --save note.txt` again. Expect: exit code 0, the same folder as step 10, marked as already saved; still one folder under `extractions/`.
12. (Case 6) Run `extract --note note.txt --items items.json --artifact page.html`. Expect: exit code 0, `page.html` exists and contains `HR 72`.
13. (Case 7) From the repo root, search `plugin/`, `public/`, `packages/medprotocol/src/`, `tests/` and `SPEC.md` for `on-insulin`, `onInsulin`, `ABGValues`, `ABGResult`, `BloodOxygenValidations` (capital B) and `with Overcompensated`. Expect: no match.
14. (Case 7) Run `npm run build`, then `git status --short`. Expect: build exits 0 and the list of changed files is the same as before the build (the committed `plugin/scripts/medprotocol.cjs` and `plugin/skills/**/reference/` already match the source).
15. (Case 8) Run `npm test` and `npx tsc --noEmit`. Expect: both exit 0, no failed test.
16. (Case 8) Run the whole of `qa/recipes/cli.md`. Expect: every step passes.
