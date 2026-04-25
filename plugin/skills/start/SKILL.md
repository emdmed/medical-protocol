---
name: start
description: Start the medical protocol — describe what you need in clinical terms and the system handles everything
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
user-invocable: true
---

Read and follow: reference/core.md
Read and follow: reference/project-setup.md
Read and follow: reference/clinical-context.md

## Step 1: Returning Project Check

Before anything else, check if the current project already has components installed (e.g., `components/vital-signs/`, `components/acid-base/`, etc.):

- If the doctor asks for something that's already installed, route to the **customize** workflow — do not re-install components.
- If the doctor asks for something new that doesn't exist yet, proceed below.
- Never re-scaffold the project if it already has a working setup.

### New Project Suggestion

If this is a brand-new project (no existing components found), suggest: "Would you like me to learn about your practice first so I can tailor everything to your workflow? Just say 'teach me' or we can jump straight into building."

## Step 2: Initial Clarification (BLOCKING — must complete before Step 3)

`Read` from `reference/initial-clarification.md` and follow it. **Ask the questions and wait for the doctor's answers before proceeding.** Do NOT classify or route to any workflow until you have answers to all three questions.

Only skip if the doctor's message explicitly addresses **all three** questions (patient setting, single vs multiple patients, and data persistence). Naming a specific module alone is NOT enough to skip — the patient-management and persistence questions still need answers. Words like "track", "monitor", or plural "patients" do NOT satisfy Q2/Q3 — the doctor must explicitly say "multiple patients" or "save data between sessions" (or equivalent).

## Step 3: Classification (only after Step 2 is complete)

`Read` from `reference/classification.md` to get the signal words and routing rules.

Use the classification table to match the doctor's request to a domain, then route to the corresponding skill or workflow:

### Domains with local skills

| Domain | Route to |
|---|---|
| **vital-signs** | `../vitals/SKILL.md` |
| **acid-base** | `../acid-base/SKILL.md` |
| **bmi** | `../bmi/SKILL.md` |
| **water-balance** | `../water-balance/SKILL.md` |
| **pafi** | `../pafi/SKILL.md` |
| **dka** | `../dka/SKILL.md` |
| **dashboard** | `../dashboard/SKILL.md` |
| **customize** | `../customize/SKILL.md` |
| **troubleshoot** | `../troubleshoot/SKILL.md` |
| **cli** | `../cli/SKILL.md` |
| **start-protocol** | `../start-protocol/SKILL.md` |
| **protocol-audit** | `../protocol-audit/SKILL.md` |
| **medical-audit** | `../medical-audit/SKILL.md` |

### Domains routed via workflow file

These domains don't have a local SKILL.md. Read the workflow file and follow it directly:

| Domain | Fetch |
|---|---|
| **nephrology** | `Read` from `reference/nephrology.md` |
| **cardiology** | `Read` from `reference/cardiology.md` |
| **sepsis** | `Read` from `reference/sepsis.md` |
| **diabetes** | `Read` from `reference/diabetes.md` |

## Step 4: Execute

Once classified, route to the matched destination from the tables above:
- **Local skills:** Read the matched SKILL.md file and follow its phases exactly.
- **Workflow files (nephrology, cardiology, sepsis, diabetes):** `Read` the file at the exact path from the routing table above.

Pass the Initial Clarification answers (patient setting, single vs multiple, persistence) as context to the workflow.

## Interface Language

Use the same language the doctor uses in the conversation. If the doctor writes in Spanish, build the UI with Spanish labels. If they write in English, use English. If unclear, ask once: "Would you prefer the interface in Spanish or English?"
