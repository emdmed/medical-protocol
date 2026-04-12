# Medical Protocol Workflows

Medical protocol workflows, calculation logic, and CLI for Claude Code.

## What is this?

This repo contains provider protocols and workflows served via Vercel, plus shared calculation logic and a CLI tool. Components are delivered separately via `npx medical-ui-cli add <component>`.

Doctors copy `protocol.md` into their `.claude/` directory, then describe what they need in plain clinical language. Claude Code handles everything else.

## For Doctors

1. Copy `public/medical-protocol/protocol.md` to your project's `.claude/protocol.md`
2. Open Claude Code in your project folder
3. Describe what you need: "I need a vital signs monitor for my clinic"
4. Claude builds it for you — no coding required

## Structure

- `public/medical-protocol/providers/` — Provider-specific protocols, install guides, and workflows
  - `claude-code/` — Claude Code provider (protocol.md, install.md, workflows/)
- `lib/` — Shared calculation and validation logic (acid-base, cardiology, vital signs, etc.)
- `packages/medprotocol/` — CLI calculator tool
- `tests/` — Vitest test suite

## Deployment

Deployed to Vercel. Provider files are served as static assets from `public/medical-protocol/providers/`.
