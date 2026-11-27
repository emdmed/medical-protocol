---
name: cases
description: Practise with synthetic patient cases — get a fake worked case for any module (BMI, blood gas, fluid balance, vital signs, PaFi, DKA, sepsis, CKD, diabetes, cardiology, shock), guess the result, enter it in your screen, then see the calculated answer explained. Use when the user wants a case, an example patient, practice, a quiz, or demo data for a screen.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
user-invocable: true
---

Read and follow: reference/core.md
Read and follow: reference/cases.md
medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever the docs say `medprotocol`

Every case here is synthetic: invented for learning, not a real person. Medical Protocol is for learning and prototyping, never patient care.

## Step 1: Pick a case

- The user names a module or topic ("a DKA case", "something on acid-base") → take the matching case from `reference/cases.md`.
- The user says "any" or "surprise me" → pick one, preferring the specialty and case population in `.clinical-context.md` if it exists.
- Nothing in `reference/cases.md` fits → write a new case in the same format, run its command to check the CLI accepts it, and say it is new.

## Step 2: Present it

Start with **"Synthetic case — not a real patient."**, then the vignette and the values to enter, with units. Do not give the answer yet.

Ask what the user wants to do:

1. **Guess first:** "What do you expect the result to be?" Wait for their answer.
2. **Enter it in a screen:** they type the values into the screen they built, then tell you what it shows.
3. **Use it as demo data:** add it to the screen's sample data, labelled "Synthetic case", or as a case in its QA recipe (`../qa/SKILL.md`, "Cases the user adds").

## Step 3: Reveal

Run the case's command with `--json`. Never state a result the CLI did not give. Do not show the command or the raw output.

Explain the result in clinical language, pitched to the level in `.clinical-context.md`: what each number means, which guideline the cut-off comes from (the module's context doc names it), and the "Think about" points of the case.

- The user guessed → say what they got right and where the reasoning differs.
- Their screen shows something different from the CLI → the screen is wrong, not the library: route to `../qa/SKILL.md` to check and fix it.

## Step 4: Vary it

Offer one change that teaches something ("What if the bicarbonate were 18?"). Run the changed command and explain what moved and why. Then offer another case.

## NEVER

- Use names, dates of birth, record numbers or anything that could identify a real person
- Accept a real patient as a case: if the user describes one, say Medical Protocol is for learning only and offer a synthetic case instead
- Give a result without running the CLI
- Present a case as advice for a real patient
