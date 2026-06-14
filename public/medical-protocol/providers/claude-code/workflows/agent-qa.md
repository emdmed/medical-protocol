# Browser QA Workflow

> **For Claude only.** Run automatically as part of the Quality Checklist. This is a background quality step — communicate results in clinical language, not browser testing terminology.

---

## Prerequisites

1. `agent-browser --version` — if fails, **skip entire workflow**
2. Dev server must be responding (main protocol runs `npx wait-on` before this)
3. Open the app. **Prefer connecting to an already-running Chrome** — the dev usually starts Chrome with remote debugging on port **9222**:

   ```bash
   agent-browser connect 9222            # connect once; later commands need no flag
   agent-browser open http://localhost:3000
   ```

   - If `connect` fails (no Chrome on 9222), fall back to launching a fresh browser:
     ```bash
     agent-browser open http://localhost:3000
     ```
   - `agent-browser --auto-connect open http://localhost:3000` also works — it probes common ports (9222, 9229) automatically.
   - To start Chrome with the port yourself: `google-chrome --remote-debugging-port=9222` (use the platform's Chrome binary, e.g. `chrome` / `chromium`).
   - If neither connect nor launch works after 2 retries, skip.

> **Note:** `--cdp 9222` can prefix any single command (e.g. `agent-browser --cdp 9222 snapshot -i`) instead of `connect`, but `connect` is simpler for a full QA pass.

---

## Universal Checks

### A. Page Load & Console

```bash
agent-browser errors
agent-browser console
```
JS errors → fix source, reload. Warnings → ignore. Persist after 2 fixes → log and continue.

### B. Accessibility Tree

```bash
agent-browser snapshot -i
```
Verify non-empty (interactive elements present). Blank after 10s → check hydration errors.

### C. Responsive Layout

Test at 768×1024 and 1280×800:
```bash
agent-browser set viewport 768 1024
agent-browser snapshot -i
agent-browser set viewport 1280 800
agent-browser snapshot -i
```
Check: no horizontal overflow, proper stacking/columns, accessible navigation.

### D. Empty State & Data Integrity

No "undefined", "NaN", "null", "[object Object]", or "Error" in rendered text. Proper placeholders shown.

### E. Element Overlap

Result badges, popups, alerts must not overlap titles/labels. Check at both viewports. Fix: move results below inputs, use inline flow instead of absolute positioning.

### F. Calculation Correctness (medprotocol CLI)

Build CLI: `npm run build -w packages/medprotocol`. Run `npx medprotocol <cmd> --json` with known inputs, compare against UI output. Mismatches → fix component to use canonical lib functions. After 2 failures → skip.

### G. Keyboard Navigation

Tab through elements (logical order, visible focus indicators). Escape closes modals/popups.

---

## Component-Specific Checks

Run only for built components:

- **Vital Signs:** Click-to-edit works, dangerous values trigger alerts
- **Dashboard:** Multiple card/sections render, no overlap at different viewports
- **Calculators (Acid-Base/BMI/Water Balance):** Inputs work, results appear below inputs (not overlapping title)

---

## Error Handling

**Screenshot on failure:** `agent-browser screenshot .qa-screenshots/failure-$(date +%s).png`

**Auto-fix patterns:**

| Symptom | Fix |
|---|---|
| Popup clipped | `overflow-visible` on Card |
| Results overlap title | Move below inputs, avoid `absolute bottom-*` |
| Overflow at 768px | Responsive Tailwind classes |
| "undefined"/"NaN" | Add null checks / defaults |

**Clinical translation** (for unfixable issues): describe in plain language, never technical terms.

**Bail-out:** 2 failed fixes per issue, 3 total browser crashes, or dev server down → skip and proceed.

---

## Cleanup

- **Launched a fresh browser:** run `agent-browser close`.
- **Connected to an existing Chrome (port 9222):** do **not** run `agent-browser close` — that would close the dev's own browser. Just leave it; close only the QA tab if needed.
