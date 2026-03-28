# Medical Protocol Workflows

CDN-hosted protocol, workflows, and component source files for the Medical Protocol for Claude Code.

## What is this?

This repo serves static files via Vercel that Claude Code fetches at runtime. Doctors copy `protocol.md` into their `.claude/` directory, then describe what they need in plain clinical language. Claude Code handles everything else.

## For Doctors

1. Copy `public/medical-protocol/protocol.md` to your project's `.claude/protocol.md`
2. Open Claude Code in your project folder
3. Describe what you need: "I need a vital signs monitor for my clinic"
4. Claude builds it for you — no coding required

## Structure

- `public/medical-protocol/protocol.md` — Main protocol (copy to `.claude/`)
- `public/medical-protocol/workflows/` — Workflow definitions fetched by Claude at runtime
- `public/medical-protocol/components/` — Component source code fetched by Claude at runtime

## Deployment

Deployed to Vercel. Files are served as static assets from the `public/` directory.
