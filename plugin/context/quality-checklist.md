# Quality Checklist

> **This checklist is for Claude only.** Run it silently after every workflow build. Items 1–4 run before `npm run dev`; item 5 (Browser QA) runs after the dev server is ready. Never mention it to the doctor. Fix any issues you find without discussing the technical details.

### 1. Theming & Branding (via tweakcn)

- Apply a theme from tweakcn presets:
  1. Fetch the preset list: `gh api repos/jnsahaj/tweakcn/contents/utils/theme-presets.ts --jq '.content' | base64 -d`
  2. Pick a preset that fits the project (e.g. "modern-minimal" for clinical tools)
  3. Extract the hex values for both `light` and `dark` styles
  4. Convert hex to oklch format (match the format already used in `app/globals.css`)
  5. Replace the CSS variables in `:root { }` and `.dark { }` in `app/globals.css`
  6. Update the font in `app/layout.tsx` to match the theme's `font-sans` value
- Ensure all colors use `bg-background`, `text-foreground`, `border`, `muted`, etc. — never hardcoded hex/rgb
- Ensure consistent use of semantic color tokens (`primary`, `secondary`, `destructive`, `muted`)
- If the doctor mentions their clinic name or colors, pick the closest tweakcn preset or customize the CSS variables to match

### 2. Responsiveness

- All layouts must work on tablet (768px) and desktop (1024px+) at minimum
- Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) — no fixed pixel widths for containers
- Tables: wrap in a scrollable container on mobile, or switch to card layout below `md:`
- Forms: stack inputs vertically on mobile, allow side-by-side on larger screens
- Sidebar/patient list: collapsible or hidden behind a toggle on smaller screens
- Test by checking the built page renders without horizontal overflow

### 3. Error Boundary

- Wrap the top-level page component in `ErrorBoundary` (from `components/error-boundary`) so the app shows a recovery UI instead of a white screen on crash
- If the project doesn't have the error boundary file yet, create it following the pattern in the vital-signs CDN component

### 4. shadcn Component Polish

- Use proper shadcn components for all interactive elements (Button, Input, Select, Badge, etc.) — no raw HTML `<button>` or `<input>`
- Consistent spacing: use Tailwind's spacing scale (`p-4`, `gap-4`, `space-y-4`), not arbitrary values
- Consistent border radius: rely on shadcn's `rounded-md`/`rounded-lg` defaults
- Accessible: all form inputs have labels (shadcn Label component), buttons have descriptive text or `aria-label`
- Focus states: shadcn handles this by default — don't override with `outline-none` without providing an alternative
- Loading/empty states: show a meaningful empty state when no data exists (not a blank screen)

### Dynamic Items

Apply these additional checks based on what was built:

| If built... | Also check... |
|---|---|
| Patient list / sidebar | Collapsible on mobile, proper navigation focus |
| Data tables | Scrollable container or card view on small screens |
| Alerts / badges | Use shadcn Badge with `variant="destructive"` for critical, proper color semantics |
| Forms with many fields | Group into sections, stack on mobile |
| Dashboard with multiple cards | Responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) |
| Charts / graphs | Responsive container, readable on tablet |

### 5. Browser QA (requires agent-browser)

> **Skip this entire section** if `agent-browser --version` fails. The system works without it — this is an enhancement, not a requirement.

Run the full browser QA workflow defined in `workflows/agent-qa.md`. It covers:

- **Page load:** No console errors, accessibility tree populated
- **Interactive elements:** Click-to-edit, form inputs, navigation all functional
- **Responsive layout:** Correct rendering at 768px and 1280px viewports
- **Clinical safety:** Dangerous values trigger alerts, validation rejects out-of-range input
- **Empty states:** No blank screens, no "undefined" or "NaN" text visible
- **Element overlap:** Result badges, popups, and alerts don't overlap titles or other content
- **Keyboard navigation:** Tab, Enter, and Escape work on interactive elements

**Rules:**
- Auto-fix any issues you find silently (e.g., add `overflow-visible`, fix responsive classes, move overlapping results below inputs)
- If an issue can't be auto-fixed, translate it to clinical language for the doctor (e.g., "The edit popup gets cut off" not "overflow-hidden clips the absolutely-positioned element")
- After 2 failed fix attempts on the same issue, or 3 total browser crashes: skip browser QA and proceed
- Never mention agent-browser, snapshots, accessibility trees, or any browser testing terminology to the doctor
