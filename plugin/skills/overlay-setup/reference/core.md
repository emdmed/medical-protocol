# Overlay Setup — Core Procedure

Start the overlay queue server and inject the dev-only `<script>` tag at the app's root mount point.
Idempotent, dev-gated, reversible. The agent does the edit; the CLI only serves.

## 1. Start the server

```bash
npx medprotocol overlay --serve            # default port 7331
npx medprotocol overlay --serve --port 8080  # if 7331 is taken (CLI prints EADDRINUSE)
```

Run it in the background and read the port from the first stdout line:
`medprotocol overlay server → http://localhost:<port>`. Use `<port>` in the injected tag.

## 2. Detect the mount point (first match wins)

- `app/layout.tsx` or `src/app/layout.tsx` → Next.js app router
- `pages/_app.tsx` or `src/pages/_app.tsx` → Next.js pages router
- `index.html` → Vite / CRA / plain

Use Glob/Grep to locate; read the file before editing. If none is found with confidence, skip to
the manual fallback — do **not** guess.

## 3. Inject the tag — exact forms

Every form carries `data-medprotocol-overlay` (the idempotency + teardown marker) and is dev-gated.

**Critical (React/Next):** do **not** render a raw `<script>` in JSX — React 19 does not execute
script tags rendered inside components (it warns and they silently no-op on client navigation). Use
`next/script`'s `<Script>` instead, which loads and executes the external script after hydration.

**Next.js app router** — add `import Script from "next/script";` and place inside `<body>` in
`app/layout.tsx`:
```tsx
{process.env.NODE_ENV === "development" && (
  <Script
    data-medprotocol-overlay
    src="http://localhost:<port>/overlay.js"
    strategy="afterInteractive"
  />
)}
```

**Next.js pages router** — same `<Script>` inside the root element returned by `_app.tsx` (or use
`pages/_document.tsx` with `next/script`). Never a bare `<script>`.

**Vite / CRA / plain HTML** — here a real `<script>` in the static `index.html` is correct (it's
parsed HTML, not React). Place before `</body>`. No `NODE_ENV` gate in static HTML; tell the doctor
it's dev-only and the teardown removes it:
```html
<!-- medprotocol overlay (dev only — remove before deploy) -->
<script data-medprotocol-overlay src="http://localhost:<port>/overlay.js" async></script>
```

## 4. Idempotency

Before editing, Grep the mount file for `data-medprotocol-overlay`. If present, report "Overlay
already wired — skipping" and make no change. Re-running the skill must never duplicate the tag.

## 5. Teardown

To remove: delete the `data-medprotocol-overlay` block from the mount file and stop the `--serve`
process (Ctrl-C or kill the background job). Offer this whenever the doctor is done, and always for
the static-HTML case (no env gate there).

## Failure → manual fallback

If no mount point is found, show the snippet the server already printed and ask where the root
layout lives — never edit a file you're unsure about:
```
<script data-medprotocol-overlay src="http://localhost:<port>/overlay.js" async></script>
```

## NEVER
- Inject without a dev gate (JSX `NODE_ENV` check, or the "dev only" note for static HTML).
- Edit a non-root file on a guess — fall back to manual.
- Duplicate the tag — idempotency check is mandatory.
