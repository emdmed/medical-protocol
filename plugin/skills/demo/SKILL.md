---
name: demo
description: Get a prototype ready to show — start the app, check each screen in the browser, load a synthetic case on every screen, and save screenshots plus a short walkthrough in the project's demo/ folder, for a class, a talk or a teacher. Everything stays on this computer. Use when the user wants to demo, present, show or share their prototype, or take screenshots of it.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
user-invocable: true
---

Read and follow: reference/core.md
medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever the docs say `medprotocol`

A demo shows a learning prototype with synthetic cases. It is never a way to put the prototype in front of patients.

## Step 1: List the screens

Find the built screens (`components/medprotocol/<module>/`, also under `src/`) and the routes that show them. Ask once: "Should the demo cover all of these, or just some?" Default: all.

## Step 2: Start the app

1. Run `npm run dev` in the background and read the port from its `Local:` line (Next.js moves past 3000 when another app has it), then `npx wait-on http://localhost:<port> -t 30000`. Open one page and check it is this project's app before going on.
2. `agent-browser --version` fails → skip to Step 5 and write the walkthrough without screenshots; tell the user they can take the screenshots by hand.

## Step 3: Check before showing

For each screen, run browser QA with `../qa/SKILL.md` (recipe, qa-runner, fix, re-run). A demo must not show wrong numbers: if a screen still fails after the QA skill's fix attempts, leave it out of the demo and say why in clinical terms.

## Step 4: Capture

For each screen that passed, using the commands in `../../agents/qa-runner.md`:

1. Open its route at 1280×800 and click **Load synthetic case** (building.md §3). No such button → route to `../modify/SKILL.md` to add it, then come back.
2. Run the same case through the CLI with `--json` and check the screen shows the same results.
3. Check "Learning prototype — not for patient care." and "Synthetic case" are visible.
4. Save a screenshot to `demo/<nn>-<module>.png` (`01-bmi.png`, …). Add a second one at 768×1024 if the layout changes on a tablet.
5. Look at each screenshot yourself (Read it). Every value, badge and label must be readable against its background, in the theme the screenshot shows. Something hard to read → fix it with `../modify/SKILL.md`, then retake the screenshot. Never hand over a screenshot you have not looked at.

## Step 5: Write the walkthrough

Write `demo/README.md`:

```
# {Prototype name} — demo

> Learning prototype — not for patient care. Every patient shown is a synthetic case.

## {n}. {Screen name}
![{Screen name}]({nn}-{module}.png)
**Synthetic case:** {the case's vignette, one or two lines}
**What the screen shows:** {the key results, in clinical words, as the CLI confirmed them}
**Teaching point:** {the case's "Think about" line}
```

## Step 6: Tell the user

"Your demo is ready in the `demo/` folder: {n} screens, each with a synthetic case loaded and its numbers checked." List any screen left out and why. Mention once that the folder is plain files on this computer: they can open `demo/README.md`, or put the screenshots in slides.

## NEVER

- Upload, publish, host or push the demo anywhere, or suggest a way to (`git push` stays blocked)
- Show a screen whose numbers do not match the CLI
- Use real patient data, or names, dates of birth or record numbers, in any screenshot
- Leave the learning-only line out of a screenshot
