---
name: overlay-setup
description: Turn on the dev overlay in the doctor's app — start the queue server and inject the dev-only overlay <script> tag into the right mount point, idempotently and reversibly. Use when the doctor wants to enable, install, wire up, or start the medical-protocol overlay / hover-to-audit tool.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
user-invocable: true
---

Read and follow: reference/core.md

## Purpose

Wire the dev overlay into the doctor's running app so they can hover a component, select it, and
queue an Audit or Redo. The overlay is a vanilla script served by the CLI — this skill starts that
server and injects the dev-only `<script>` tag at the correct mount point. The doctor never hand-edits.

The agent does the React-aware edit; the `medprotocol` CLI stays a framework-agnostic bridge.

## Phase 1: Start the queue server

1. **Ask the doctor how selections should be processed** (this decides whether the loop closes by
   itself) before starting the server:
   - **Automatic (`--auto`)** — every selection spawns a headless Claude run (`claude -p`) that
     processes the order end-to-end, so the result appears in the overlay with no terminal step.
     Requires the `claude` CLI on PATH and runs unattended (it can stage diffs). **Recommend this** —
     without it, selections only queue and the overlay shows "queued — needs drain" until you act.
   - **Manual drain** — `--serve` only captures selections; you process them by running
     `/medical-protocol:overlay-audit | overlay-implement | overlay-add` in Claude Code.
2. Run the server in the background. Default port `7331` — use `--port` if taken (`EADDRINUSE`):
   - Automatic: `npx medprotocol overlay --serve --auto`
   - Manual: `npx medprotocol overlay --serve`
3. Capture the port from the server's first line (`medprotocol overlay server → http://localhost:<port>`).

## Phase 2: Find the mount point

Detect the framework and pick exactly one mount point (first match wins):

| Framework | Mount file | Where to inject |
|---|---|---|
| Next.js app router | `app/layout.tsx` (or `src/app/layout.tsx`) | inside `<body>` |
| Next.js pages router | `pages/_app.tsx` (or `src/pages/_app.tsx`) | inside the returned root element |
| Vite / CRA / plain | `index.html` | before `</body>` |

If none can be found with confidence, **do not edit** — print the manual snippet (Phase 4 fallback) and stop.

## Phase 3: Inject the tag (idempotent, dev-gated, reversible)

1. **Idempotency check first:** if the file already contains `data-medprotocol-overlay`, report
   "Overlay already wired" and skip the edit.
2. Insert a **dev-gated** tag carrying the `data-medprotocol-overlay` marker (exact forms in
   reference/core.md). Never insert it unconditionally — it must not reach production.
3. Confirm what file changed and show the inserted lines.

## Phase 4: Confirm + teardown note

1. Tell the doctor: start the dev server (or reload), then click the "Protocol select" button
   (bottom-right) and pick a component.
2. Give the teardown: remove the `data-medprotocol-overlay` block from the mount file, and stop the
   `--serve` process. The tag is dev-gated, but teardown keeps the source clean.
3. Point them onward: selections drain via `/medical-protocol:overlay-audit`,
   `/medical-protocol:overlay-implement`, and `/medical-protocol:overlay-add`.

**Manual fallback** (when Phase 2 finds no mount point): show the snippet the server printed —
`<script src="http://localhost:<port>/overlay.js" async></script>`, dev-gated — and ask the doctor
where their root layout lives.

## NEVER
- Inject the tag without the `NODE_ENV === "development"` gate (or equivalent) — it must not ship.
- Edit a file you're not confident is the app's root mount point — fall back to manual instead.
- Bake the injection into the `medprotocol` CLI binary — source edits belong to this skill.
- Duplicate the tag — always run the idempotency check first.
