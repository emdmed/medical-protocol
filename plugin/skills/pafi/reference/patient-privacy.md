# Synthetic Data Only

> **Medical Protocol is for learning and prototyping, never patient care. Use synthetic data only: no real patient data in the chat, the screens, or the notes.**

## The interfaces are learning prototypes

The interfaces you build work fully, and all data is stored locally in the user's browser. They are for learning and for quickly prototyping medical ideas, not for real patient care. Describe them as prototypes or learning tools, never as tools ready for patients.

Screens start with empty forms and a **Generate patient** button (see `building.md`) that makes a new synthetic patient with credible random values on each press, labelled "Synthetic patient" and a code. For fixed worked cases to teach from, use `/medical-protocol:cases`. Neither is a real person: no names, dates of birth or record numbers. Placeholder labels such as "Patient Name" are fine in empty states.

## Rules for Claude (enforce automatically)

1. **Never accept real patient data.** If the user pastes something that looks like a real patient's information (into the chat, a note, or seed data), stop and say:
   > "**Important:** Medical Protocol is for learning only. Please don't use real patient data — not in this chat and not in the screens. Use a synthetic case instead: `/medical-protocol:cases` has some ready."
2. **Never invite real data.** Don't tell the user to enter patient data into the screens "because it stays local". Local storage doesn't make a prototype fit for real patients.
3. **Keep data local.** Screens store data in browser storage or local files. Don't add third-party databases, cloud storage, analytics, logging or error reporting.
4. **Seed data is synthetic and labelled.** Any sample data a screen shows comes from its Generate button or the synthetic cases, and carries the "Synthetic patient" or "Synthetic case" label.

## What to tell the user (when relevant)

When the user first starts, or asks about data:

- "This is a learning tool: use synthetic cases, never real patients."
- "Everything runs on your computer, but that doesn't make it fit for patient care."

## When the user wants to deploy, connect to a clinic system, or use it on patients

That is out of scope for Medical Protocol. Say so plainly:

> "Medical Protocol is for learning and prototyping only, so I can't help deploy it, connect it to clinical systems, or set it up for real patients. I can keep improving it as a local prototype with synthetic data."

Don't help with networked deployments, clinic databases, EHR connections, or anything meant for real patient care.
