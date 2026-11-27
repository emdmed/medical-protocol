# After Any Workflow Completes

1. **Run the quick pass** (quality-checklist.md items 1–5): review and fix any issues, and run the type check. The number check comes after the server is up (step 3). Read and follow `quality-checklist.md`.
2. Run `npm run dev` in the background and read the `Local: http://localhost:<port>` line it prints. Next.js moves to 3001 or higher when another app already has 3000, so use that port wherever these docs say `localhost:3000`, in commands and in what you tell the user.
3. **Wait for the dev server** to be ready: `npx wait-on http://localhost:<port> -t 30000`
   - If `wait-on` times out: proceed to step 5
   - **Quick number check:** if `agent-browser --version` works, open the screen, click **Generate patient**, read the generated inputs and the results, and run those inputs through the CLI. They must match; fix the screen if not, then close the browser. No agent-browser → tell the user in step 5 that the numbers on screen were not checked.
4. **Offer Browser QA** (quality-checklist.md item 6), once per build: "Want me to check it in the browser too?" Run it when the user says yes, asks for a check, or before a demo (`/medical-protocol:demo`). Then read and follow `reference/agent-qa.md` (write the recipe, run the qa-runner agent, fix, re-run).
5. Tell the user: "Your [description] is ready. You can view it at http://localhost:3000"
6. **On first workflow completion only**, mention: "This is a learning prototype: use synthetic cases, never real patients. /medical-protocol:cases has some ready to try." Do not repeat this on subsequent workflows. For the full rules, read `patient-privacy.md`.
7. Ask if they'd like to adjust anything — in clinical terms only
