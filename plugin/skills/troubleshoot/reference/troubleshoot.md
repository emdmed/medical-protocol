# Troubleshoot Workflow

Triggered when the user reports a problem. Diagnose automatically, fix automatically, explain in plain language.

**Rule: Never show terminal output or technical details to the user.**

---

## Phase 1: Background Diagnosis

Say "Let me take a look." Run all checks, collect failures before fixing.

| Category | Check | Failure means |
|---|---|---|
| `setup-node` | `node --version` (v18+) | Node missing/old |
| `setup-npm` | `npm --version` | npm missing |
| `project-scaffold` | `package.json` has `next` | No project |
| `project-dependencies` | `node_modules` exists | Deps missing |
| `project-config` | `.claude/CLAUDE.md` exists | Config missing |
| `server-port` | Read the `Local:` line `npm run dev` printed (Next.js moves past 3000 when another app has it). Call this `<port>` | Port taken by another app: use the port it names, and check that page is this project's |
| `server-stopped` | `pgrep -af "next dev"`, then `lsof -a -d cwd -p <pid>` shows each one's folder; this project's server is the one running in this folder | No dev server for this project |
| `server-crashed` | `curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>` | Not responding |
| `component-missing` | `ls components/` | No components |
| `component-typescript` | `npx tsc --noEmit` | TS errors |
| `browser-no-page` | `ls app/page.tsx app/*/page.tsx` | No page file |
| `browser-build` | `npm run build` | Build errors |
| `data-no-storage` | `grep -r "localStorage" components/ app/` | No persistence |

---

## Phase 2: Auto-Fix

Fix automatically. Use clinical language if you need to explain anything.

| Category | Fix |
|---|---|
| `setup-*` | Cannot auto-fix → Phase 3 |
| `project-scaffold` | Run scaffold from main protocol |
| `project-dependencies` | `npm install` |
| `project-config` | Re-read protocol, restore config |
| `server-port` | Never stop the other app. Use the port `npm run dev` printed; if none, start `npm run dev` and use the port it prints |
| `server-stopped` | `npm run dev` |
| `server-crashed` | Stop only the dev server started for this project (`kill <pid>` from `server-stopped`), then `npm run dev` and use the port it prints. Never stop a process from another folder |
| `component-missing` | Rebuild the screen per building.md (re-copy `lib/medprotocol/`, regenerate) |
| `component-typescript` | Read errors, fix (missing imports, missing UI SDK setup) |
| `browser-no-page` | Create page importing the existing screens |
| `browser-build` | Read errors, fix |
| `browser-render` | Check `"use client"`, imports, mount crashes |
| `data-no-storage` | Add localStorage persistence |
| `data-quota`/`data-cleared` | Cannot fully auto-fix → Phase 3 |

---

## Phase 3: User Communication

**If fixed:** "I found and fixed the issue. Everything should be working now at http://localhost:<port>"

**If not fixable**, explain in plain language:

| Category | Tell the user |
|---|---|
| `setup-node` | "Your computer needs Node.js — download from https://nodejs.org (LTS version)" |
| `setup-npm` | "Try restarting your computer. If it persists, reinstall Node.js" |
| `server-*` | "Your system had stopped/conflicted. I've restarted it" |
| `component-*` | "There was a technical issue. I've fixed it — should work now" |
| `browser-*` | "The interface had an issue. I've fixed it — please refresh" |
| `data-cleared` | "Saved data was cleared by browser. Going forward data will be saved locally" |

---

## Phase 4: Verify

Re-run failed checks. Verify dev server responds. After 2 failed attempts: "I wasn't able to fix this automatically. You may want to ask someone with technical experience." Ask: "Is everything working now?"
