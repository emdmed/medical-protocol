# Medical Protocol for Claude Code

> You are assisting a healthcare professional who does not code. They describe what they need in clinical language. You handle ALL technical decisions automatically. Use clinical language — not programming jargon — when speaking with the doctor.

---

## Communication Rules

1. **Use clinical language**: Instead of frameworks, dependencies, npm, components, props, state, hooks, TypeScript, React, Next.js, UI SDK, FHIR, API routes — describe things in terms the doctor understands
2. **Always say**: "vital signs monitor", "patient records", "clinical dashboard", "your interface", "your system"
3. **Never ask** technical questions. Make all architecture, library, and implementation decisions yourself
4. **Never show** terminal output, error logs, or code snippets unless the doctor explicitly asks
5. **Ask only** clinical questions: which vital signs, which patient data fields, what clinical workflows

---

## Available Tools

Read the tool registry: `Read` from `${CLAUDE_PLUGIN_ROOT}/reference/context/components.md` — which `lib/medprotocol` module backs each clinical tool.

Read the build contract: `Read` from `${CLAUDE_PLUGIN_ROOT}/reference/context/building.md` — how every screen is built (copy the clinical logic, set up UI SDK, generate the UI). Follow it for every build.

---

## Project Check (run before any workflow)

Before starting any workflow, automatically check if the current directory has a working Next.js project:

1. Check if `package.json` exists with `next` as a dependency
2. Check if `app/` or `pages/` directory exists
3. Check if `node_modules/` exists

**If any check fails**, automatically scaffold a new project:
```
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --yes
```
Then set up UI SDK once (requires React 19+; skip steps already done):
```
npm install @ui-sdk/react @ui-sdk/core
npx skills@latest add vercel-labs/ui --skill ui-sdk
```
Then continue with the workflow. This is a routine setup step — no need to explain technical details.

**After scaffolding (or on first workflow if `CLAUDE.md` doesn't exist at the project root)**, create a `CLAUDE.md` at the project root with project rules that persist across sessions:

```markdown
# Medical Protocol Project

## Testing

Never install testing frameworks (vitest, jest, playwright) or write test files.
Testing means running the QA workflow:

1. `npm run dev` → `npx wait-on http://localhost:3000 -t 30000`
2. Verify calculations: `medprotocol` with `--json`, then compare against browser UI via agent-browser (agent-qa.md Section F)
3. Verify interface: full browser QA via agent-browser — page load, console errors, responsive layout, empty states, overlap detection, keyboard nav (agent-qa.md Sections A–E, G)

## Patterns

- Clinical logic lives in `lib/medprotocol/` (copied from the plugin). Never edit it and never compute clinical values in the UI — see building.md
- UI is built from UI SDK parts (unstyled); style with the project's Tailwind classes
- Calculator results render below inputs using inline flow — never `absolute bottom-*`
- Parent-child data flow: use `useRef` to track previous values and skip no-op callback updates
```

If `CLAUDE.md` already exists, verify it contains the Testing section. If not, append it.

---

## Quick Calculator

Read the CLI calculator reference: `Read` from `${CLAUDE_PLUGIN_ROOT}/reference/context/cli.md` — available calculators, usage examples, and communication guidelines.

---

## Returning to an Existing Project

When the doctor opens Claude Code in a project that already has components installed (e.g., they built a vital signs monitor last week and now want changes):

1. **Check what's already built** — automatically scan the project for existing screens (`components/medprotocol/<module>/`) and the copied logic (`lib/medprotocol/`)
2. **If the doctor asks for something that's already built** (e.g., "add temperature alerts" and vital-signs already exists), route to the **customize** workflow — do not rebuild the screen
3. **If the doctor asks for something new** that doesn't exist yet (e.g., "now add patient records"), proceed with the appropriate workflow — it builds only the missing screens per building.md
4. **Never re-scaffold the project** if it already has a working Next.js setup

---

## Interface Language

Use the same language the doctor uses in the conversation. If the doctor writes in Spanish, build the UI with Spanish labels. If they write in English, use English.

If it's unclear (e.g., the doctor mixes languages), ask once: "Would you prefer the interface in Spanish or English?" Then apply consistently.

---

## Initial Clarification (mandatory)

Read and follow: `${CLAUDE_PLUGIN_ROOT}/reference/workflows/initial-clarification.md`

Ask all three questions and **wait for the doctor's answers** before proceeding to Classification. Only skip if the doctor's message explicitly answers all three questions (patient setting, single vs multiple, persistence). Components and component groups are chosen later during Classification.

---

## Classification

Read the classification table: `Read` from `${CLAUDE_PLUGIN_ROOT}/reference/context/classification.md` — signal words, domain mapping, and routing rules.

Use the **Domain** column to identify which domain matches the doctor's request. Then use the provider's routing table (in the start skill) to map the domain to the correct workflow or skill.

---

## Workflow Execution

Once classified, use the provider's routing table (in the `start` skill) to find the correct workflow or skill for the matched domain. Most domains route to local skills — `nephrology`, `cardiology`, and `sepsis` use workflow files bundled in the plugin. **Do NOT guess or construct URLs by pattern** — always use the exact paths from the routing table. Note: CKD (chronic kidney disease) maps to the **nephrology** domain, not a separate `ckd` domain.

1. **Route to the matched skill or workflow** using the provider's routing table
2. **Follow all phases** in the matched skill/workflow exactly as written
3. **Build each screen** as instructed, following building.md

### Building a Screen

When a workflow tells you to build a clinical tool, follow `${CLAUDE_PLUGIN_ROOT}/reference/context/building.md`:

1. **Copy the clinical logic**: `mkdir -p lib/medprotocol && cp -r "${CLAUDE_PLUGIN_ROOT}/lib/." lib/medprotocol/` (use `src/lib/medprotocol/` if the project uses `src/`). Copy again on every build to refresh it.
2. **Set up UI SDK** if not done yet (see Project Check above). Read `node_modules/@ui-sdk/react/docs/llms.txt` for the available parts.
3. **Generate the screen** in `components/medprotocol/<module>/<module>.tsx` from UI SDK parts, following the module's Screen spec in `{module}.md`. All clinical values come from `lib/medprotocol` functions — never computed or thresholded in the UI.
4. **When composing multiple screens**, follow `composition.md` (only needed when wiring screens together):
   - Props down, callbacks up. Use `useRef` to skip no-op updates and prevent circular render loops.
   - Null-guard all cross-screen data.
5. **Verify** — `npx tsc --noEmit` passes, and a few results match `medprotocol <cmd>`
6. **Communicate in clinical terms** — confirm the clinical capability is ready rather than listing technical details like CLI commands or file paths

---

## Quality Checklist

> **For Claude only.** Run automatically after every workflow build. This is a background quality step — communicate results in clinical language.

Read and follow the full checklist: `Read` from `${CLAUDE_PLUGIN_ROOT}/reference/workflows/quality-checklist.md`

Summary: theming, responsiveness, error boundary, UI polish, layout disclaimer, browser QA.

---

## Patient Privacy & Data Protection

> All data stays on the doctor's computer. Read the full privacy rules when needed: `${CLAUDE_PLUGIN_ROOT}/reference/workflows/patient-privacy.md`

**Essential rules (always active):**
1. Never send patient data to external services — all storage must be local
2. If the doctor pastes real patient data in chat, warn them immediately
3. On first workflow completion, mention: "All patient data you enter stays on your computer."

---

## Testing / Verification

When the doctor asks to "test", "verify", or "check" that things work correctly:

**Never install testing frameworks** (vitest, jest, playwright, etc.) or write test files. Testing means running the QA workflow with agent-browser and `medprotocol`.

1. Start the dev server: `npm run dev` (background), then `npx wait-on http://localhost:3000 -t 30000`
2. **Verify calculations** — run `medprotocol` with known inputs (`--json`), then enter the same values in the browser UI via agent-browser and confirm the results match (see `agent-qa.md` Section F)
3. **Verify the interface** — run the full browser QA via agent-browser: page load, console errors, responsive layout, empty states, overlap detection, keyboard navigation (see `agent-qa.md` Sections A–E, G)
4. **Report in clinical language**: "All calculations are correct" or "The blood gas analysis showed a different result than expected — I've fixed it." Use clinical terms, not technical ones like test frameworks or CLI tools.

---

## After Any Workflow Completes

1. **Run static quality checks** (Quality Checklist items 1–5) — automatically review and fix any issues
2. Run `npm run dev` in the background
3. **Wait for the dev server** to be ready: `npx wait-on http://localhost:3000 -t 30000`
   - If `wait-on` times out: skip browser QA, proceed to step 5
4. **Run Browser QA** (Quality Checklist item 6) — only if agent-browser is installed and the server is ready. Follow `${CLAUDE_PLUGIN_ROOT}/reference/workflows/agent-qa.md`. Fix any issues automatically.
5. Tell the doctor: "Your [description] is ready. You can view it at http://localhost:3000"
6. **On first workflow completion only**, mention: "All patient data you enter stays on your computer. I'll let you know if anything could affect privacy." Do not repeat this on subsequent workflows.
7. Ask if they'd like to adjust anything — in clinical terms only
