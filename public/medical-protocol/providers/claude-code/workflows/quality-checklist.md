# Quality Checklist

> **For Claude only.** Run automatically after every workflow build. Items 1–5 run before `npm run dev`; item 6 (Browser QA) runs after the dev server is ready. This is a background quality step — fix any issues found and communicate results in clinical language, not technical details.

## 1. Theming & Branding

UI SDK components are unstyled, so the project's theme tokens carry the look.

- If `app/globals.css` has no semantic color tokens yet, add them once:
  1. Pick a calm clinical palette — a tweakcn preset works well as a source (`gh api repos/jnsahaj/tweakcn/contents/utils/theme-presets.ts --jq '.content' | base64 -d`, e.g. "modern-minimal")
  2. Define `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--destructive`, `--border` (oklch) in `:root { }` and `.dark { }`
  3. Register them with Tailwind via `@theme inline { --color-background: var(--background); ... }`
  4. Update the font in `app/layout.tsx` to match the palette's `font-sans` value
- Ensure all colors use `bg-background`, `text-foreground`, `border`, `muted`, etc. — never hardcoded hex/rgb
- Ensure consistent use of semantic color tokens (`primary`, `secondary`, `destructive`, `muted`)
- If the doctor mentions their clinic name or colors, pick the closest tweakcn preset or customize the CSS variables to match

## 2. Responsiveness

- All layouts must work on tablet (768px) and desktop (1024px+) at minimum
- Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) — no fixed pixel widths for containers
- Tables: wrap in a scrollable container on mobile, or switch to card layout below `md:`
- Forms: stack inputs vertically on mobile, allow side-by-side on larger screens
- Sidebar/patient list: collapsible or hidden behind a toggle on smaller screens
- Test by checking the built page renders without horizontal overflow

## 3. Error Boundary

- Wrap the top-level page component in `ErrorBoundary` so the app shows a recovery UI instead of a white screen on crash
- If `{project}/components/error-boundary.tsx` does not exist, create it as a simple React error boundary component (class component with `getDerivedStateFromError` + `componentDidCatch`, renders a "Something went wrong — try again" recovery UI with a retry button)

## 4. UI Polish

- Build interactive elements from UI SDK parts (Field, Label, Number Input, Select, Checkbox, Dialog, etc.) — no raw HTML `<input>` where a UI SDK part exists
- Consistent spacing: use Tailwind's spacing scale (`p-4`, `gap-4`, `space-y-4`), not arbitrary values
- Consistent border radius: pick one scale (`rounded-md`/`rounded-lg`) and use it everywhere
- Accessible: all form inputs have a visible label (UI SDK Label/Field), buttons have descriptive text or `aria-label`
- Focus states: UI SDK provides focus and keyboard behavior — style a visible focus ring, never remove it with `outline-none` alone
- Clinical values: every number, category and severity on screen comes from a `lib/medprotocol` function — no thresholds or calculations in the UI (building.md §4)
- Units next to every value; guideline source shown when the lib provides one
- Loading/empty states: show a meaningful empty state when no data exists (not a blank screen)

## Dynamic Items

Apply these additional checks based on what was built:

| If built... | Also check... |
|---|---|
| Patient list / sidebar | Collapsible on mobile, proper navigation focus |
| Data tables | Scrollable container or card view on small screens |
| Alerts / badges | Color from the severity the lib returns (`destructive` token for critical), never from a threshold in the UI |
| Forms with many fields | Group into sections, stack on mobile |
| Dashboard with multiple cards | Responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) |
| Charts / graphs | Responsive container, readable on tablet |

## 5. Layout Disclaimer

- If `{project}/components/layout-disclaimer.tsx` does not exist, create it as a collapsible disclaimer banner (a native `<details>`/`<summary>` is enough) with text: "For educational and clinical decision-support purposes only. Not a substitute for professional medical judgment."
- Write the component to `{project}/components/layout-disclaimer.tsx`
- Add `<LayoutDisclaimer />` to `app/layout.tsx` inside `<body>`, above `{children}`
- Import: `import { LayoutDisclaimer } from "@/components/layout-disclaimer"`

## 6. Browser QA (requires agent-browser)

> **Skip this entire section** if `agent-browser --version` fails. The system works without it — this is an enhancement, not a requirement.

Run the full browser QA workflow defined in `${CLAUDE_PLUGIN_ROOT}/reference/workflows/agent-qa.md`. It covers:

- **Page load:** No console errors, accessibility tree populated
- **Interactive elements:** Click-to-edit, form inputs, navigation all functional
- **Responsive layout:** Correct rendering at 768px and 1280px viewports
- **Calculation correctness:** CLI (`medprotocol`) output matches UI results for the same inputs
- **Clinical safety:** Dangerous values trigger alerts, validation rejects out-of-range input
- **Empty states:** No blank screens, no "undefined" or "NaN" text visible
- **Keyboard navigation:** Tab, Enter, and Escape work on interactive elements

**Rules:**
- Auto-fix any issues you find (e.g., clipped popups, responsive classes)
- If an issue can't be auto-fixed, translate it to clinical language for the doctor (e.g., "The edit popup gets cut off" not "overflow-hidden clips the absolutely-positioned element")
- After 2 failed fix attempts on the same issue, or 3 total browser crashes: skip browser QA and proceed
- Use clinical language when reporting results — avoid technical terms like agent-browser, snapshots, or accessibility trees
