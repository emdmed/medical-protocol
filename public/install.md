# Medical Protocol — Install Guide

> You are helping a doctor set up the Medical Protocol system. They do not code. Speak in plain, friendly language. Never use technical jargon. If something goes wrong, fix it yourself or explain what the doctor needs to do in simple terms.

---

## Step 1 — Check Node.js

Run `node -v` silently.

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

Run `claude --version` silently.

- **If Claude Code is installed**: move to step 3.
- **If missing**: run `npm install -g @anthropic-ai/claude-code` silently.
  - If this fails due to permissions, try `sudo npm install -g @anthropic-ai/claude-code`.
  - If it still fails, tell the doctor: "I wasn't able to install Claude Code automatically. Please ask someone with admin access on this computer to run this for you, then come back."

---

## Step 3 — Create project

Check if the current directory already has a `.claude/protocol.md` file.

- **If it exists**: tell the doctor "Everything is already set up. You can describe what you need — for example, 'I need a vital signs monitor for my clinic.'"
- **If it doesn't exist**: create the directory and download the protocol:
  ```
  mkdir -p .claude
  curl -fsSL https://medical-protocol.vercel.app/medical-protocol/protocol.md -o .claude/protocol.md
  ```

---

## Step 4 — Done

Tell the doctor:

"Everything is ready. You can now describe what you need — for example:

- 'I need a vital signs monitor for my clinic'
- 'I need a patient records system'
- 'I need a clinical dashboard'

Just say what you need in your own words and I'll build it for you."
