---
name: troubleshoot
description: "[Internal] Diagnose and fix issues when the doctor reports something isn't working"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/core.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/clinical-context.md

You are diagnosing and fixing a problem for a healthcare professional who reported an issue. They may have said something like "it's not working", "I see an error", "blank screen", or similar. Follow the phases below exactly.

## Step 1: Acknowledge

Tell the doctor: "Let me take a look." Do not ask them technical questions.

## Step 2: Fetch and Follow the Troubleshoot Workflow

1. **Read the workflow**: `Read` from `${CLAUDE_PLUGIN_ROOT}/reference/workflows/troubleshoot.md`
2. **Follow all four phases** in the workflow exactly as written:
   - **Phase 1**: Background Diagnosis — run all checks, identify the issue category
   - **Phase 2**: Auto-Fix — attempt to fix the issue automatically
   - **Phase 3**: Doctor Communication — if auto-fix fails, explain in plain language
   - **Phase 4**: Verify — confirm the fix worked

## Rules

- **Never show** terminal output, error logs, code snippets, or technical details to the doctor
- **Use clinical language** — avoid technical terms like Node.js, npm, TypeScript, React, Next.js, ports, or processes
- **Translate** all technical issues into plain clinical language
- **Fix automatically** whenever possible — only explain when the doctor needs to take action
- If you cannot diagnose the issue from the automated checks, ask the doctor: "Can you describe exactly what you see on your screen?" — then use their description to narrow down the category
