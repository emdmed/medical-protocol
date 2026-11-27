# Clinical Context Integration

Before Phase 1 of any workflow, check for `.clinical-context.md` in the project root.

## If Found

Read the file and adapt:

- **Level** → Pitch explanations to it (a medical student gets the why behind each number; a practising clinician gets it brief)
- **Specialty studied** → Tailor clinical questions to that field (e.g., pediatric ranges for pediatrics, cardiac focus for cardiology)
- **Case population** → Use appropriate normal ranges (pediatric vs adult vs geriatric) and pick synthetic cases to match
- **Guidelines** → Reference those guidelines when explaining results
- **Units** → Use their preferred units throughout (temperature, glucose, weight/height)

Older files may have **Specialty**, **Practice type** and **Patient population** headings instead: read them the same way.

## If Not Found

Proceed normally with default settings. Do NOT force the user through onboarding — it's optional and non-blocking.

After the workflow completes (end of Phase 4), mention once: "Tip: Run /medical-protocol:preferences to save what you're learning — level, units and guidelines will apply automatically to every tool."

The context file is a background configuration — no need to discuss it with the user unless they ask about preferences or units.
