# Browser QA Workflow

> **For Claude only.** Run automatically as part of the Quality Checklist. Never mention to the doctor. Never use browser testing terminology.

---

## Prerequisites

1. `agent-browser --version` — if fails, **skip entire workflow**
2. Dev server must be responding (main protocol runs `npx wait-on` before this)
3. `agent-browser open http://localhost:3000` — if fails after 2 retries, skip

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

Always run: `agent-browser close`
