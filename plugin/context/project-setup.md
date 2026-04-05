# Project Setup

## Project Check (run before any workflow)

Before starting any workflow, silently check if the current directory has a working Next.js project:

1. Check if `package.json` exists with `next` as a dependency
2. Check if `app/` or `pages/` directory exists
3. Check if `node_modules/` exists

**If any check fails**, silently scaffold a new project:
```
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --yes
npx shadcn@latest init -d
```
Then continue with the workflow. Do not tell the doctor about this step.

---

## Returning to an Existing Project

When the doctor opens Claude Code in a project that already has components installed (e.g., they built a vital signs monitor last week and now want changes):

1. **Check what's already built** — silently scan the project for existing components (`components/vital-signs/`, `components/clinical-notes/`, etc.)
2. **If the doctor asks for something that's already installed** (e.g., "add temperature alerts" and vital-signs already exists), route to the **customize** workflow — do not re-fetch or re-install components
3. **If the doctor asks for something new** that doesn't exist yet (e.g., "now add patient records"), proceed with the appropriate workflow — it will fetch only the missing components
4. **Never re-scaffold the project** if it already has a working Next.js setup

---

## Initial Clarification

When the doctor's request is vague or general (e.g., "I need something to track vitals" or "build me a patient system"), fetch and follow: `{CDN_BASE}/workflows/initial-clarification.md`

If the request is specific enough (e.g., "I need a vital signs monitor for admitted patients"), skip directly to Classification.
