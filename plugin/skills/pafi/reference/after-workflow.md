# After Any Workflow Completes

1. **Run the quick pass** (quality-checklist.md items 1–5): review and fix any issues, run the type check, and run the screen's synthetic case through the CLI to confirm the numbers the screen shows. Read and follow `quality-checklist.md`.
2. Run `npm run dev` in the background
3. **Wait for the dev server** to be ready: `npx wait-on http://localhost:3000 -t 30000`
   - If `wait-on` times out: proceed to step 5
4. **Offer Browser QA** (quality-checklist.md item 6), once per build: "Want me to check it in the browser too?" Run it when the user says yes, asks for a check, or before a demo (`/medical-protocol:demo`). Then read and follow `reference/agent-qa.md` (write the recipe, run the qa-runner agent, fix, re-run).
5. Tell the user: "Your [description] is ready. You can view it at http://localhost:3000"
6. **On first workflow completion only**, mention: "This is a learning prototype: use synthetic cases, never real patients. /medical-protocol:cases has some ready to try." Do not repeat this on subsequent workflows. For the full rules, read `patient-privacy.md`.
7. Ask if they'd like to adjust anything — in clinical terms only
