---
name: start
description: Start the medical protocol — describe what you need in clinical terms and the system handles everything
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/core.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/project-setup.md
Read and follow: ${CLAUDE_PLUGIN_ROOT}/context/clinical-context.md

## Step 1: Returning Project Check

Before anything else, silently check if the current project already has components installed (e.g., `components/vital-signs/`, `components/acid-base/`, etc.):

- If the doctor asks for something that's already installed, route to the **customize** workflow — do not re-install components.
- If the doctor asks for something new that doesn't exist yet, proceed below.
- Never re-scaffold the project if it already has a working setup.

### New Project Suggestion

If this is a brand-new project (no existing components found), suggest: "Would you like me to learn about your practice first so I can tailor everything to your workflow? Just say 'teach me' or we can jump straight into building."

## Step 2: Initial Clarification (BLOCKING — must complete before Step 3)

`WebFetch` from `{CDN_BASE}/workflows/initial-clarification.md` and follow it. **Ask the questions and wait for the doctor's answers before proceeding.** Do NOT classify or route to any workflow until you have answers to all four questions.

Only skip if the doctor's message explicitly addresses **all four** questions (module choice, patient setting, single vs multiple patients, and data persistence). Naming a specific module alone is NOT enough to skip — the patient-management and persistence questions still need answers. Words like "track", "monitor", or plural "patients" do NOT satisfy Q3/Q4 — the doctor must explicitly say "multiple patients" or "save data between sessions" (or equivalent).

## Step 3: Classification (only after Step 2 is complete)

`WebFetch` from `{CDN_BASE}/context/classification.md` to get the signal words and routing rules.

Use the classification table to match the doctor's request to a domain, then route to the corresponding skill or workflow:

### Domains with local skills

| Domain | Route to |
|---|---|
| **vital-signs** | `${CLAUDE_PLUGIN_ROOT}/skills/vitals/SKILL.md` |
| **acid-base** | `${CLAUDE_PLUGIN_ROOT}/skills/acid-base/SKILL.md` |
| **bmi** | `${CLAUDE_PLUGIN_ROOT}/skills/bmi/SKILL.md` |
| **water-balance** | `${CLAUDE_PLUGIN_ROOT}/skills/water-balance/SKILL.md` |
| **pafi** | `${CLAUDE_PLUGIN_ROOT}/skills/pafi/SKILL.md` |
| **dka** | `${CLAUDE_PLUGIN_ROOT}/skills/dka/SKILL.md` |
| **dashboard** | `${CLAUDE_PLUGIN_ROOT}/skills/dashboard/SKILL.md` |
| **customize** | `${CLAUDE_PLUGIN_ROOT}/skills/customize/SKILL.md` |
| **troubleshoot** | `${CLAUDE_PLUGIN_ROOT}/skills/troubleshoot/SKILL.md` |
| **cli** | `${CLAUDE_PLUGIN_ROOT}/skills/cli/SKILL.md` |
| **start-protocol** | `${CLAUDE_PLUGIN_ROOT}/skills/start-protocol/SKILL.md` |
| **protocol-audit** | `${CLAUDE_PLUGIN_ROOT}/skills/protocol-audit/SKILL.md` |
| **medical-audit** | `${CLAUDE_PLUGIN_ROOT}/skills/medical-audit/SKILL.md` |

### Domains routed via CDN workflow

These domains don't have a local SKILL.md. Fetch the workflow and follow it directly:

| Domain | Fetch |
|---|---|
| **ckd** | `WebFetch` from `{CDN_BASE}/providers/claude-code/workflows/ckd.md` |
| **cardiology** | `WebFetch` from `{CDN_BASE}/providers/claude-code/workflows/cardiology.md` |
| **sepsis** | `WebFetch` from `{CDN_BASE}/providers/claude-code/workflows/sepsis.md` |

## Step 4: Execute

Once classified, read the matched SKILL.md file and follow its phases exactly. Pass the Initial Clarification answers (patient setting, single vs multiple, persistence) as context to the workflow.

## Interface Language

Use the same language the doctor uses in the conversation. If the doctor writes in Spanish, build the UI with Spanish labels. If they write in English, use English. If unclear, ask once: "Would you prefer the interface in Spanish or English?"
