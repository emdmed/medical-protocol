# After Any Workflow Completes

1. **Run the quick pass** (quality-checklist.md items 1–5): review and fix any issues, run the type check, and run the screen's synthetic case through the CLI to confirm the numbers the screen shows. Read and follow `quality-checklist.md`.
2. Run `npm run dev` in the background
3. **Wait for the dev server** to be ready: `npx wait-on http://localhost:3000 -t 30000`
   - If `wait-on` times out: proceed to step 5
4. **Offer Browser QA** (quality-checklist.md item 6), once per build: "Want me to check it in the browser too?" Run it when the user says yes, asks for a check, or before a demo (`/medical-protocol:demo`). Then read and follow `reference/agent-qa.md` (write the recipe, run the qa-runner agent, fix, re-run).
5. Tell the user: "Your [description] is ready. You can view it at http://localhost:3000"
6. **Offer the dev overlay** — only when the dev server came up (step 3 succeeded) and the overlay isn't already wired (the mount file does not contain `data-medprotocol-overlay`). Offer it once, not after every tweak: "Want to turn on the dev overlay? You'll be able to click any component right in the browser to audit it, redo it with medical protocol, or add a new one. Say the word and I'll wire it up." If they accept, route to `/medical-protocol:overlay` and follow it.
7. **On first workflow completion only**, mention: "This is a learning prototype: use synthetic cases, never real patients. /medical-protocol:cases has some ready to try." Do not repeat this on subsequent workflows. For the full rules, read `patient-privacy.md`.
8. Ask if they'd like to adjust anything — in clinical terms only
