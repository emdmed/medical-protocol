# After Any Workflow Completes

1. **Run static quality checks** (quality-checklist.md items 1–4) — automatically review and fix any issues. Read and follow `quality-checklist.md`.
2. Run `npm run dev` in the background
3. **Wait for the dev server** to be ready: `npx wait-on http://localhost:3000 -t 30000`
   - If `wait-on` times out: skip browser QA, proceed to step 5
4. **Run Browser QA** (quality-checklist.md item 5) — only if agent-browser is installed and the server is ready. Follow `agent-qa.md`. Fix any issues automatically.
5. Tell the doctor: "Your [description] is ready. You can view it at http://localhost:3000"
6. **Offer the dev overlay** — only when the dev server came up (step 3 succeeded) and the overlay isn't already wired (the mount file does not contain `data-medprotocol-overlay`). Offer it once, not after every tweak: "Want to turn on the dev overlay? You'll be able to click any component right in the browser to audit it, redo it with medical protocol, or add a new one. Say the word and I'll wire it up." If they accept, route to `/medical-protocol:overlay-setup` and follow it.
7. **On first workflow completion only**, mention: "All patient data you enter stays on your computer. I'll let you know if anything could affect privacy." Do not repeat this on subsequent workflows. For full privacy rules, read `patient-privacy.md`.
8. Ask if they'd like to adjust anything — in clinical terms only
