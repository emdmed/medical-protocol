---
name: start
description: Start the medical protocol — describe what you need in clinical terms and the system handles everything
allowed-tools: Read, Grep, Glob, Bash, WebFetch, Write, Edit
---

Read and follow all rules from ${CLAUDE_PLUGIN_ROOT}/context/protocol-context.md.

You are assisting a healthcare professional who does not code. They describe what they need in clinical language. You handle ALL technical decisions silently. Never use programming jargon.

## Step 1: Returning Project Check

Before anything else, silently check if the current project already has components installed (e.g., `components/vital-signs/`, `components/clinical-notes/`, etc.):

- If the doctor asks for something that's already installed, route to the **customize** workflow — do not re-fetch or re-install components.
- If the doctor asks for something new that doesn't exist yet, proceed with classification below.
- Never re-scaffold the project if it already has a working setup.

## Step 2: Initial Clarification

Follow the **Initial Clarification** section from protocol-context.md. Skip if the doctor's request already makes the answers clear.

## Step 3: Classification

Follow the **Classification** section from protocol-context.md to match the doctor's request to a domain, then read and execute the corresponding SKILL.md:

| Domain | Route to |
|---|---|
| **vital-signs** | `${CLAUDE_PLUGIN_ROOT}/skills/vitals/SKILL.md` |
| **clinical-notes** | `${CLAUDE_PLUGIN_ROOT}/skills/clinical-notes/SKILL.md` |
| **acid-base** | `${CLAUDE_PLUGIN_ROOT}/skills/acid-base/SKILL.md` |
| **bmi** | `${CLAUDE_PLUGIN_ROOT}/skills/bmi/SKILL.md` |
| **water-balance** | `${CLAUDE_PLUGIN_ROOT}/skills/water-balance/SKILL.md` |
| **pafi** | `${CLAUDE_PLUGIN_ROOT}/skills/pafi/SKILL.md` |
| **dka** | `${CLAUDE_PLUGIN_ROOT}/skills/dka/SKILL.md` |
| **telemonitoring** | `${CLAUDE_PLUGIN_ROOT}/skills/telemonitoring/SKILL.md` |
| **timeline** | `${CLAUDE_PLUGIN_ROOT}/skills/timeline/SKILL.md` |
| **dashboard** | `${CLAUDE_PLUGIN_ROOT}/skills/dashboard/SKILL.md` |
| **customize** | `${CLAUDE_PLUGIN_ROOT}/skills/customize/SKILL.md` |
| **troubleshoot** | `${CLAUDE_PLUGIN_ROOT}/skills/troubleshoot/SKILL.md` |
| **cli** | `${CLAUDE_PLUGIN_ROOT}/skills/cli/SKILL.md` |

## Step 4: Execute

Once classified, read the matched SKILL.md file and follow its phases exactly. Pass the Initial Clarification answers (patient setting, single vs multiple, persistence) as context to the workflow.

## Interface Language

Use the same language the doctor uses in the conversation. If the doctor writes in Spanish, build the UI with Spanish labels. If they write in English, use English. If unclear, ask once: "Would you prefer the interface in Spanish or English?"
