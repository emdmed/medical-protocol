# Recipe: refactor-cli

QA for the readability refactor of the CLI: one shared `parseFlags` helper, one shared `printTable` helper, `commands/extract.ts` split into three files, and the guide `.patterns/medprotocol/medprotocol.md` brought up to date.

A refactor must change nothing the CLI prints. So one rule differs from `qa/recipes/cli.md`: here the expected value of a command is **what the build before the refactor printed**, compared by `scripts/compare-cli.sh`. Whether those values are clinically right stays the job of `qa/recipes/cli.md` (hand-worked values), which step 12 runs.

`BASE` is the last commit before the refactor. The person starting the run gives it; do not guess it. Run everything from the repo root. Made-up values only.

## Cases
1. `BASE` really is the code before the refactor, and the working tree really is the code after it
2. Every command prints the same as before: plain output, `--json`, `--help`, an unknown flag, missing flags <!-- 25 places parse flags; each is run 6 ways, plus routing, error and file-writing commands -->
3. `--json` works wherever it sits among the flags of a sub-command <!-- before, `runSubcommand` looked for it in the arguments; after, only the parser does -->
4. The files `extract` and `overlay` write are the same as before
5. The comparison can fail: against a build known to differ it reports differences
6. `extract.ts` is split and nothing was lost on the way
7. The guide describes the CLI as it is now
8. The committed build matches the source, and tests and types pass

## Steps
1. (Case 1) Run `git grep -c "parseArgs({" BASE -- packages/medprotocol/src/commands` (with the real ref in place of `BASE`). Expect: 12 files listed, counts adding up to 25.
2. (Case 1) Search `packages/medprotocol/src/commands/` for `parseArgs(` and for `help: { type: "boolean"`. Expect: no match for either. Then search `packages/medprotocol/src/cli.ts` for `parseArgs(`. Expect: exactly one match.
3. (Case 1) Search `packages/medprotocol/src/commands/` for `printTable(` and for `formatHeader(`. Expect: `printTable(` appears in every command file except `overlay.ts`. List each remaining `formatHeader(` line in the report; each must sit at a place that prints more than one title and one table.
4. (Cases 2, 4) Run `npm run build`, then `bash scripts/compare-cli.sh BASE`. Expect: exit code 0 and a last line reading `196 commands compared, 0 differences`. Any line starting with `DIFFERENT` is a failure: copy it and the lines under it into the report.
5. (Case 3) Run `node plugin/scripts/medprotocol.cjs ckd egfr --json --creatinine 1.2 --age 55 --sex male` and `node plugin/scripts/medprotocol.cjs sepsis lactate --initial 4.2 --json --repeat 2.1`. Expect: exit code 0 and valid JSON for both; eGFR between 70 and 72 with category G2; clearance 50. <!-- CKD-EPI 2021: 142 × (1.2/0.9)^−1.2 × 0.9938^55 ≈ 71; (4.2 − 2.1) / 4.2 = 50% -->
6. (Case 5) Run `bash scripts/compare-cli.sh v1.5.0`. Expect: exit code 1, and `DIFFERENT` lines for `abg --ph 7.34 --pco2 60 --hco3 31` and for `diabetes t1-vs-t2 --age 25 --bmi 22 --on-insulin`. <!-- 1.5.0 still said "with Overcompensated by" and still accepted --on-insulin -->
7. (Case 6) List `packages/medprotocol/src/`. Expect: `extract-calculations.ts` and `extract-serve.ts` exist, and `commands/extract.ts` is under 250 lines.
8. (Case 6) Run `git diff BASE --stat -- tests/cli/extract-cli.test.ts tests/cli/extract-serve.test.ts`, then read the diff. Expect: only `import` lines changed; no test, `expect` or fixture was removed or edited.
9. (Case 7) Read `.patterns/medprotocol/medprotocol.md`. Expect: its command table has the same 12 commands as the `commands` map in `packages/medprotocol/src/index.ts`; it does not mention `tsup`, `dist/` or `src/format.ts`; its "how to add a command" part uses `parseFlags` and `printTable`.
10. (Case 8) Run `git status --short` after the build of step 4. Expect: the same list of changed files as before the build (the committed `plugin/scripts/medprotocol.cjs` already matches the source).
11. (Case 8) Run `npm test` and `npx tsc --noEmit`. Expect: both exit 0, no failed test, and at least 1169 tests passed. <!-- the count before the refactor; the helpers add tests, nothing removes any -->
12. (Case 8) Run the whole of `qa/recipes/cli.md`. Expect: every step passes.
