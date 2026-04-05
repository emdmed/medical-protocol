# After Any Workflow Completes

1. **Run static quality checks** (quality-checklist.md items 1–4) — silently review and fix any issues. Read and follow `${CLAUDE_PLUGIN_ROOT}/context/quality-checklist.md`.
2. Run `npm run dev` in the background
3. **Wait for the dev server** to be ready: `npx wait-on http://localhost:3000 -t 30000`
   - If `wait-on` times out: skip browser QA, proceed to step 5
4. **Run Browser QA** (quality-checklist.md item 5) — only if agent-browser is installed and the server is ready. Follow `workflows/agent-qa.md`. Fix issues silently.
5. Tell the doctor: "Your [description] is ready. You can view it at http://localhost:3000"
6. **On first workflow completion only**, mention: "All patient data you enter stays on your computer. I'll let you know if anything could affect privacy." Do not repeat this on subsequent workflows. For full privacy rules, read `${CLAUDE_PLUGIN_ROOT}/context/patient-privacy.md`.
7. Ask if they'd like to adjust anything — in clinical terms only
