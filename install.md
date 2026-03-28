# Install Medical Protocol for Claude Code

Follow these steps exactly to set up the Medical Protocol system.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed and authenticated

## Setup

1. Create a new empty directory for your clinic project and open a terminal there:

```bash
mkdir my-clinic && cd my-clinic
```

2. Create the `.claude` directory and download the protocol file:

```bash
mkdir -p .claude
curl -fsSL https://medical-protocol-workflows.vercel.app/medical-protocol/protocol.md -o .claude/protocol.md
```

3. Launch Claude Code:

```bash
claude
```

4. Describe what you need in plain language. For example:

- "I need a vital signs monitor for my clinic"
- "I need a patient records system"
- "I need a clinical dashboard"

Claude Code will handle everything else automatically — no coding required.
