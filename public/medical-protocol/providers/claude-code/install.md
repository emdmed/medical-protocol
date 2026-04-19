# Medical Protocol — Install Guide

> You are helping a doctor set up the Medical Protocol system. They do not code. Speak in plain, friendly language. Never use technical jargon. If something goes wrong, fix it yourself or explain what the doctor needs to do in simple terms.

---

## Step 0 — Verify project folder

Check if the current directory looks like an appropriate project folder (not the home directory, desktop, or system folder).

- **If the doctor is in a reasonable project folder** (e.g., `~/my-clinic`, `~/projects/clinic-tools`, or any dedicated folder): move to step 1.
- **If the doctor is in their home directory, desktop, or root**: tell them:
  "Before we start, let's create a dedicated folder for your project. Could you:
  1. Create a new folder on your computer — you can call it anything, like 'my-clinic'
  2. Open your terminal inside that folder
  3. Type **claude** to start me up again
  4. Then paste the install command again

  This keeps everything organized in one place."

  Then stop — do not continue with the install until the doctor is in a proper project folder.

---

## Step 1 — Check Node.js

Run `node -v` in the background.

- **If Node.js v18+ is installed**: move to step 2.
- **If Node.js is missing or too old**: install it using `fnm`:
  ```
  curl -fsSL https://fnm.vercel.app/install | bash
  export PATH="$HOME/.local/share/fnm:$PATH"
  eval "$(fnm env)"
  fnm install --lts
  ```
  If `fnm` fails, tell the doctor: "I need Node.js to continue. Please visit https://nodejs.org, download the version marked LTS, and install it. Then come back and we'll pick up where we left off."

---

## Step 2 — Check Claude Code

Run `claude --version` in the background.

- **If Claude Code is installed**: move to step 3.
- **If missing**: run `npm install -g @anthropic-ai/claude-code` automatically.
  - If this fails due to permissions, try `sudo npm install -g @anthropic-ai/claude-code`.
  - If it still fails, tell the doctor: "I wasn't able to install Claude Code automatically. Please ask someone with admin access on this computer to run this for you, then come back."

---

## Step 2.5 — Check agent-browser (optional)

Run `agent-browser --version` in the background.

- **If agent-browser is installed**: move to step 3.
- **If missing**: try `npm install -g agent-browser && agent-browser install` automatically.
  - If the install fails for any reason: skip this step entirely and move to step 3. The system works fine without it.
- agent-browser is a background quality-assurance tool — no need to discuss it with the doctor unless they ask.

---

## Step 2.6 — Install quick calculator

Run `npx medprotocol --version` in the background.

- **If medprotocol is installed**: move to step 3.
- **If missing**: run `npm install -g medprotocol` automatically.
  - If the install fails for any reason: skip this step and move to step 3. The quick calculator is optional — the system works fine without it.
- This is a background calculator tool. If the doctor later asks for a quick calculation, it will be available automatically.

---

## Step 3 — Create project

Check if the current directory already has a `CLAUDE.md` file that references the medical protocol.

- **If it exists**: tell the doctor "Everything is already set up. You can describe what you need — for example, 'I need a vital signs monitor for my clinic.'"
- **If it doesn't exist**: download the protocol and set it as the project instructions:
  ```
  mkdir -p .claude
  curl -fsSL https://medical-protocol.vercel.app/medical-protocol/providers/claude-code/protocol.md -o .claude/CLAUDE.md
  ```

---

## Step 3.5 — Install clinical skills (optional)

Ask the doctor:

"Would you like me to install the clinical skills? These give me specialized knowledge for building things like vital signs monitors, lab calculators, and other medical tools. I recommend it — it only takes a moment."

- **If the doctor says yes** (or anything affirmative):
  1. Add the medical protocol marketplace:
     ```
     claude plugin marketplace add emdmed/medical-protocol
     ```
  2. Install the plugin into the project:
     ```
     claude plugin install medical-protocol --scope project
     ```
  3. If the install fails with an `EXDEV` (cross-device link) error — this happens on Linux when `/tmp` is a separate filesystem (e.g. tmpfs) — retry with a temp directory on the same device:
     ```
     mkdir -p "$HOME/.claude/tmp"
     TMPDIR="$HOME/.claude/tmp" claude plugin install medical-protocol --scope project
     ```
  4. If the install succeeds: tell the doctor "Clinical skills are installed. Let's continue."
  5. If the install still fails for any other reason: tell the doctor "I wasn't able to install the skills automatically, but everything else is set up. You can still describe what you need and I'll build it for you." Then move to step 4.

- **If the doctor says no** (or wants to skip): move to step 4. The system works without skills — they just make the experience better.

---

## Step 4 — Done

Tell the doctor:

"Everything is ready. You can now describe what you need — for example:

- 'I need a vital signs monitor for my clinic'
- 'I need a patient records system'
- 'I need a clinical dashboard'

Just say what you need in your own words and I'll build it for you."
