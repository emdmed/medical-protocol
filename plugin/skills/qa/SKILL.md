---
name: qa
description: "[Internal] Check a built screen in the browser — write or update its QA recipe, run it with the qa-runner agent, fix what fails"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
user-invocable: true
---

Read and follow: reference/agent-qa.md

The doctor wants a screen checked (e.g. "check the BMI calculator", "test everything"). Tell them: "Let me check that for you."

1. Find the screens to check: the ones the doctor named, or every folder in `components/medprotocol/` if they said "everything".
2. Make sure the dev server is up: start `npm run dev` in the background if needed, then `npx wait-on http://localhost:3000 -t 30000`.
3. For each screen, run the workflow in `reference/agent-qa.md` (write or update the recipe, run it, fix, re-run).
4. Tell the doctor the result in clinical terms: what was checked, and anything that still needs their attention. Never show reports, logs or code.
