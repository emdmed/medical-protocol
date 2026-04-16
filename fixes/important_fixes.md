# Medical Protocol — Important Fixes

## Critical: Context Window Bloat

### 1. Triple-layered instructions (protocol.md + plugin context + skill files)

The same instructions exist in three places:

| Instruction | `protocol.md` | `plugin/context/protocol-context.md` | Each `SKILL.md` (x14) |
|---|---|---|---|
| Communication rules | Lines 7-14 | Lines 1-10 | Phase 1 in each |
| Component fetching process | Lines 139-166 | Lines 159-167 | Phase 2 in each |
| Quality checklist | Lines 170-177 | Items 1-5 | Phase 4 in each |
| Privacy rules | Lines 180-189 | Privacy section | Not repeated |
| "Do NOT ask about" lists | — | — | Repeated in 8 skills |

**Impact:** When a doctor says "I need vital signs", Claude loads `protocol.md` (~200 lines) + `protocol-context.md` (~320 lines) + `vitals/SKILL.md` + fetches `workflows/vital-signs.md` from CDN. That's ~800+ lines of instructions where ~60% is redundant. This wastes context and can cause Claude to get confused about which version of an instruction to follow.

### 2. Every workflow repeats Phases 2-4 verbatim

All 8 component workflows (`vital-signs.md`, `acid-base.md`, `bmi.md`, etc.) contain near-identical Phase 2 (install components via CLI), Phase 3 (create page), and Phase 4 (quality + preview). Only Phase 1 (clinical questions) differs meaningfully.

**Fix:** Extract a shared `workflow-template.md` with Phases 2-4 and have each workflow only define Phase 1 + component-specific overrides. Or better: since `protocol.md` already has the Component Fetching Process, the workflows shouldn't repeat it at all.

---

## High: Error-Prone Patterns

### 3. Inconsistent dependency handling

Each component that has dependencies handles them differently:

- **dka.md**: Previously listed acid-base files to fetch from CDN (now uses `npx medical-ui-cli add acid-base`)
- **dashboard.md**: Says "for each selected block, follow Component Fetching Process" but doesn't address transitive deps
- **pafi.md**: Requires creating `lib/pafi` with calculation functions — unique pattern not used elsewhere

**Risk:** Claude may miss dependencies, install them in wrong order, or create inconsistent `lib/` structures across projects. A doctor building DKA + dashboard could end up with duplicate acid-base code.

### 4. CDN URL hardcoded in 3+ locations

The CDN base URL `https://medical-protocol.vercel.app/medical-protocol` appears in:
- `protocol.md` line 38
- `plugin/context/protocol-context.md`
- `plugin/.claude-plugin/plugin.json` (as `userConfig.cdnBaseUrl`)
- `plugin/settings.json` (WebFetch allow-list)
- `install.md` line 83 (curl command)

`plugin.json` defines it as configurable via `userConfig.cdnBaseUrl`, but the other files hardcode it. If the CDN moves, 4 files need manual updating.

### 5. `wait-on` as an unlisted dependency

`protocol.md` line 195 uses `npx wait-on http://localhost:3000 -t 30000` but `wait-on` isn't in `package.json`. This triggers an `npx` download every time, adding ~5-10 seconds. If the network is slow, it may timeout before the package even downloads.

### 6. Scaffold command may conflict with existing projects

`protocol.md` lines 27-29 run `npx create-next-app@latest .` if checks fail. The `.` means "current directory" — if the doctor has any files there (even non-Next.js ones), `create-next-app` will either fail or overwrite them. The "Returning to an Existing Project" section (line 72) tries to prevent this, but only checks for components, not for other project types.

---

## Medium: Maintenance Burden

### 7. Clinical thresholds scattered across workflows

Normal ranges and clinical criteria are embedded in individual workflow files:
- Water-balance: `12 mL/kg insensible loss, 4.5 mL/kg endogenous water, 120 mL per stool`
- PaFi: `Berlin criteria: mild >200, moderate 100-200, severe <100`
- DKA: `glucose <200 mg/dL, ketones <0.6, HCO3 >=15, pH >7.30`
- Vital signs: ranges only in component code, not in workflow

If a clinical guideline updates, you'd need to find and change it in the workflow file, the component TSX, and potentially the CLI calculator — no single source of truth.

### 8. Two composition docs

- `public/medical-protocol/components/COMPOSITION.md` (CDN-served, fetched at runtime)
- `plugin/context/composition.md` (plugin context, loaded locally)

These cover the same topic but may drift. The plugin version is 166 lines; the CDN version is the canonical reference. Having both means Claude may see conflicting guidance.

### 9. Quality checklist references `agent-browser` but installation is "optional"

`install.md` step 2.5 tries to install `agent-browser` globally but marks it optional. Then `protocol.md` line 197 conditionally runs Browser QA "only if agent-browser is installed." But `quality-checklist.md` item 6 and `agent-qa.md` (265 lines) are written as if browser QA always runs. This creates an inconsistent expectation — the QA reminder hook (`qa-reminder.sh`) will nag about QA not being run even when `agent-browser` isn't available.

### 10. `customize.md` workflow is underspecified

It says "identify which files need to change" and "if the feature doesn't exist in the component library, build from scratch" — but gives no boundaries on scope. A doctor saying "add lab results" could trigger anything from a small field addition to a full new component. There's no decision tree for when to route to a new component workflow vs. modifying existing code.

---

## Suggested Priority Fixes

1. **Deduplicate instructions** — Make `protocol.md` the single source of truth. Skills should reference it, not repeat it. This alone could cut context consumption by ~40%.
2. **Standardize dependency resolution** — Add a `dependencies` field to every manifest entry (like dka already has) and define one resolution algorithm in `protocol.md`.
3. **Use `plugin.json` `cdnBaseUrl` everywhere** — Replace all hardcoded URLs with a reference to the configured value.
4. **Centralize clinical thresholds** — Create a `clinical-standards.json` that components and workflows both reference.
5. **Remove or merge duplicate composition docs** — Keep only the CDN version; remove `plugin/context/composition.md`.
