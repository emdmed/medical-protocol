---
name: qa
description: "[Internal] Check a built screen in the browser — write or update its patient-case recipe, run it with the qa-runner agent, fix what fails, report in clinical terms"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
user-invocable: true
---

Read and follow: reference/agent-qa.md
medprotocol CLI: node "${CLAUDE_SKILL_DIR}/../../scripts/medprotocol.cjs" — run this wherever the docs say `medprotocol`

The user wants a screen checked ("check it", "is it working?", "test the BMI calculator", "check everything") or wants a patient case added ("also check a 45 kg patient"). Tell them: "Let me check that for you."

1. Find the screens: the ones the user named, the one just built or changed in this conversation, or every folder in `components/medprotocol/` if they said "everything". If nothing has been built yet, say so and offer to build one.
2. **Adding a case?** Add it to the screen's recipe as described in `reference/agent-qa.md` ("Cases the user adds"), then continue to run it.
3. Make sure the app is running: start `npm run dev` in the background if needed, then `npx wait-on http://localhost:3000 -t 30000`.
4. For each screen, run the workflow in `reference/agent-qa.md` (write or update the recipe, run it, fix, re-run).
5. Tell the user the result per patient case, as in step 4 of `reference/agent-qa.md`. Never show reports, logs or code.

If the user asks what is checked, read them the **Cases** list from the recipe — never the steps.
