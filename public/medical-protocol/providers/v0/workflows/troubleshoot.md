# Troubleshoot Workflow

This workflow is triggered when the doctor reports a problem — "it's not working", "I see an error", "blank screen", etc. Claude diagnoses silently and either fixes automatically or explains the issue in plain clinical language.

**Rule: Never show error logs or technical details to the doctor.** Translate everything into language a non-technical person understands.

---

## Phase 1: Silent Diagnosis

When the doctor reports a problem, say "Let me take a look." Then silently classify the issue into one of these categories:

### 1. Component Not Rendering

The interface is blank, missing a section, or showing an error where a clinical tool should appear.

- Check imports and component references
- Check that all required registry components are included
- Check for missing dependencies

> Category: `component-render`

### 2. Data Not Persisting

The doctor entered data but it's gone after refreshing or reopening.

- v0 previews start fresh each time — this is expected behavior in previews
- After deployment, localStorage persists as long as the same URL is used
- If the deployment URL changed, localStorage is per-origin — data from the old URL won't appear at the new one

> Category: `data-persistence`

### 3. Layout Issues

Components are clipped, overlapping, or not displaying correctly.

- Cards with absolute-positioned popups need `overflow-visible` (VitalSigns edit buttons, AcidBase result popup, alert badges)
- Check responsive breakpoints for mobile/tablet views
- Components using shadcn portals (Timeline Popover, ClinicalNotes AlertDialog/Drawer) do NOT need overflow fixes

> Category: `layout`

### 4. Preview or Deployment Not Loading

The preview shows an error or the deployed URL doesn't work.

- Check for build errors in the v0 output
- Check for missing dependencies or incompatible imports
- Verify all registry components were fetched correctly

> Category: `preview-deploy`

### 5. Data Loss After Changes

The doctor had data, made changes to the interface, and now the data is gone.

- If the deployment URL changed, localStorage is per-origin — previous data is tied to the old URL
- Explain that data lives in the browser at the specific URL

> Category: `data-loss`

### 6. Privacy Questions

The doctor is asking about where data goes, who can see it, or whether it's safe.

- Route to the Privacy section in protocol.md
- Key message: patient data stays in the browser's localStorage, never uploaded

> Category: `privacy`

---

## Phase 2: Auto-Fix

For each detected category, attempt the fix silently. Do not describe the fix to the doctor — just do it.

| Category | Auto-Fix |
|---|---|
| `component-render` | Check and fix imports. Re-add the component from the registry if needed. Verify all dependencies are present. |
| `data-persistence` | If in preview: explain behavior (Phase 3). If deployed: add or fix localStorage usage following existing component patterns. |
| `layout` | Add `overflow-visible` to Cards wrapping components with absolute-positioned popups. Fix responsive grid/flex layouts. |
| `preview-deploy` | Read the build errors, fix them silently. Common causes: missing imports, incompatible dependencies, syntax errors. |
| `data-loss` | Cannot auto-fix (data is gone). Go to Phase 3. |
| `privacy` | No fix needed. Go to Phase 3 to explain. |

---

## Phase 3: Doctor Communication

If auto-fix succeeds, tell the doctor:

> "I found and fixed the issue. Everything should be working now. You can check the preview."

If auto-fix fails or the issue requires explanation, use the appropriate message:

| Category | What to Tell the Doctor |
|---|---|
| `component-render` | "There was a display issue with your interface. I've corrected it — you should see it working in the preview now." |
| `data-persistence` | "While you're working on the design, the preview starts fresh each time — that's normal. Once your interface is deployed, your data will be saved in your browser and available each time you open it." |
| `layout` | "Some elements weren't displaying correctly. I've fixed the layout — check the preview to confirm it looks right." |
| `preview-deploy` | "There was an issue building your interface. I've fixed it. The preview should be working now." |
| `data-loss` | "When the address of your interface changes, previously entered data stays tied to the old address. Unfortunately, the previous data can't be recovered at the new address. Going forward, your data will be saved in your browser as long as you use the same address." |
| `privacy` | "All patient data stays in your browser. The interface itself is hosted as a webpage, but the data you enter — patient names, vitals, notes — is stored only in your browser's memory. It is never uploaded, transmitted, or accessible to anyone but you on this browser." |

After any response, ask: "Is everything working now, or do you see another issue?"
