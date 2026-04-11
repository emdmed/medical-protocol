# Troubleshoot Workflow

> `{CDN_BASE}` refers to `https://medical-protocol.vercel.app/medical-protocol` (defined in the main protocol).

This workflow is triggered when the doctor reports a problem — "it's not working", "I see an error", "blank screen", etc. Claude diagnoses silently and either fixes automatically or explains the issue in plain clinical language.

**Rule: Never show terminal output, error logs, or technical details to the doctor.** Translate everything into language a non-technical person understands.

---

## Phase 1: Silent Diagnosis

Run all of the following checks silently. Do not tell the doctor you are diagnosing — just say "Let me take a look." Collect all failing checks before moving to Phase 2.

### 1. Setup Checks

```bash
# Node.js installed and recent enough (v18+)
node --version

# npm available
npm --version

# Claude Code available
claude --version
```

- **Node missing or old** → Category: `setup-node`
- **npm missing** → Category: `setup-npm`
- **Claude Code missing** → Category: `setup-claude`

### 2. Project Checks

```bash
# package.json exists and has next dependency
cat package.json | grep '"next"'

# node_modules exists
ls node_modules/.package-lock.json

# .claude/CLAUDE.md exists (protocol configured)
ls .claude/CLAUDE.md
```

- **No `package.json` or missing `next`** → Category: `project-scaffold`
- **No `node_modules`** → Category: `project-dependencies`
- **No `.claude/CLAUDE.md`** → Category: `project-config`

### 3. Server Checks

```bash
# Is port 3000 in use?
lsof -i :3000

# Is the dev server process running?
ps aux | grep "next dev" | grep -v grep

# Can we reach the dev server?
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

- **Port 3000 occupied by another process** → Category: `server-port`
- **Dev server not running** → Category: `server-stopped`
- **Dev server running but not responding** → Category: `server-crashed`

### 4. Component Checks

```bash
# Do component directories exist?
ls components/ 2>/dev/null

# Is the medical-ui CLI available?
npx medical-ui-cli --help 2>/dev/null

# TypeScript compiles cleanly?
npx tsc --noEmit 2>&1 | head -20
```

- **No components installed** → Category: `component-missing`
- **TypeScript errors** → Category: `component-typescript`

### 5. Browser Checks

If the doctor reports a white/blank screen or "nothing shows up":

```bash
# Check if the page file exists
ls app/page.tsx app/*/page.tsx 2>/dev/null

# Check for obvious render errors in the page
grep -l "export default" app/page.tsx app/*/page.tsx 2>/dev/null

# Check if there are build errors
npm run build 2>&1 | tail -20
```

- **No page file** → Category: `browser-no-page`
- **Build errors** → Category: `browser-build`
- **Page exists but blank** → Category: `browser-render`

### 6. Data Checks

If the doctor reports data loss or "my data disappeared":

```bash
# Check if localStorage is being used in components
grep -r "localStorage" components/ app/ --include="*.tsx" --include="*.ts" -l

# Check for storage-related errors in component code
grep -r "QuotaExceededError\|storage" components/ app/ --include="*.tsx" --include="*.ts" -l
```

- **No localStorage usage when persistence was expected** → Category: `data-no-storage`
- **Storage quota issues** → Category: `data-quota`
- **Data simply cleared by browser** → Category: `data-cleared`

---

## Phase 2: Auto-Fix

For each detected category, attempt the fix silently. Do not describe the fix to the doctor — just do it.

### Setup Issues

| Category | Auto-Fix |
|---|---|
| `setup-node` | Cannot auto-fix. Go to Phase 3. |
| `setup-npm` | Cannot auto-fix. Go to Phase 3. |
| `setup-claude` | Cannot auto-fix. Go to Phase 3. |

### Project Issues

| Category | Auto-Fix |
|---|---|
| `project-scaffold` | Run the scaffold command from the main protocol: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --yes && npx shadcn@latest init -d` |
| `project-dependencies` | Run `npm install` |
| `project-config` | Re-read the protocol and ensure `.claude/CLAUDE.md` is properly set up. If this is a fresh project, the doctor may need to re-run the initial setup. |

### Server Issues

| Category | Auto-Fix |
|---|---|
| `server-port` | Find and kill the process using port 3000: `lsof -ti :3000 \| xargs kill -9`, then restart with `npm run dev` |
| `server-stopped` | Start the dev server: `npm run dev` (in background) |
| `server-crashed` | Kill any zombie process, then restart: `pkill -f "next dev"; npm run dev` |

### Component Issues

| Category | Auto-Fix |
|---|---|
| `component-missing` | Re-run the appropriate workflow to install components with `npx medical-ui-cli add <component>`. Ask the doctor what they were trying to build if unclear. |
| `component-typescript` | Read the TypeScript errors, fix them silently. Common fixes: missing imports, type mismatches from shadcn version differences, missing shadcn components (`npx shadcn@latest add {missing}`). |

### Browser Issues

| Category | Auto-Fix |
|---|---|
| `browser-no-page` | Create the missing page file with the appropriate component imports based on what's installed in `components/`. |
| `browser-build` | Read the build errors, fix them silently. Common causes: import errors, missing dependencies, syntax errors. |
| `browser-render` | Check for missing `"use client"` directive, broken imports, or components that crash on mount. Fix silently. |

### Data Issues

| Category | Auto-Fix |
|---|---|
| `data-no-storage` | Add localStorage persistence to the components following the patterns in the installed component code. |
| `data-quota` | Cannot fully auto-fix. Clear old/unused localStorage keys if safe. Go to Phase 3 if quota is genuinely full. |
| `data-cleared` | Cannot auto-fix (data is gone). Go to Phase 3. |

---

## Phase 3: Doctor Communication

If auto-fix succeeds, tell the doctor:

> "I found and fixed the issue. Everything should be working now. You can check at http://localhost:3000"

If auto-fix fails, explain the problem in plain language based on the category:

### Setup Issues

| Category | What to Tell the Doctor |
|---|---|
| `setup-node` | "Your computer needs a program called Node.js to run the system. You can download it from https://nodejs.org — choose the version marked 'LTS'. Once installed, restart this chat and we'll try again." |
| `setup-npm` | "There's a missing tool on your computer that's needed to set things up. Try restarting your computer and opening this chat again. If it still doesn't work, you may need to reinstall Node.js from https://nodejs.org." |
| `setup-claude` | "Claude Code doesn't seem to be installed properly. You can reinstall it by following the instructions at https://docs.anthropic.com/en/docs/claude-code." |

### Project Issues

| Category | What to Tell the Doctor |
|---|---|
| `project-scaffold` | "The project needs to be set up from scratch. I'll do that now — it will take about a minute." Then run the scaffold. |
| `project-dependencies` | "Some required files were missing. I'm reinstalling them now." Then run `npm install`. |
| `project-config` | "The system configuration was missing. I've restored it. Let's try again." |

### Server Issues

| Category | What to Tell the Doctor |
|---|---|
| `server-port` | "Another program was using the same connection your system needs. I've resolved the conflict and restarted your system." |
| `server-stopped` | "Your system wasn't running. I've started it up — you should see it at http://localhost:3000 in a moment." |
| `server-crashed` | "Your system had stopped unexpectedly. I've restarted it. If this happens again, let me know." |

### Component Issues

| Category | What to Tell the Doctor |
|---|---|
| `component-missing` | "The clinical tools aren't installed yet. Tell me what you need (e.g., vital signs monitor, patient records) and I'll set it up." |
| `component-typescript` | "There was a technical issue with the interface code. I've fixed it — your system should work normally now." |

### Browser Issues

| Category | What to Tell the Doctor |
|---|---|
| `browser-no-page` | "The interface page was missing. I've created it — refresh your browser to see it." |
| `browser-build` | "There was an issue building your interface. I've fixed it. Please refresh your browser." |
| `browser-render` | "The interface had a display issue. I've corrected it — please refresh your browser." |

### Data Issues

| Category | What to Tell the Doctor |
|---|---|
| `data-no-storage` | "Your system wasn't set up to save data between sessions. I've added that — going forward, your data will be saved on your computer." |
| `data-quota` | "Your browser's storage is full. You may need to clear old browsing data (not from this site) or use a different browser. Your clinical data in this system is safe." |
| `data-cleared` | "Unfortunately, the saved data was cleared — this can happen if browser data is deleted. Going forward, the system will save your data locally, but previously entered information can't be recovered." |

---

## Phase 4: Verify

After any fix (auto or manual):

1. **Re-run the failed checks** from Phase 1 to confirm the issue is resolved
2. **If the dev server should be running**, verify it responds: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
3. **If the fix worked**, tell the doctor the system is ready
4. **If the fix didn't work**, try one more approach. After two failed attempts on the same issue, tell the doctor honestly:
   > "I wasn't able to fix this automatically. Here's what seems to be wrong: [plain language explanation]. You may want to ask someone with technical experience to help with this specific issue."
5. Ask: "Is everything working now, or do you see another issue?"
