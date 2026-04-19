# Clinical Context Integration

Before Phase 1 of any workflow, silently check for `.clinical-context.md` in the project root.

## If Found

Read the file and adapt:

- **Specialty** → Tailor clinical questions to the doctor's field (e.g., pediatric ranges if pediatrician, cardiac focus if cardiologist)
- **Practice type** → Adjust defaults (hospital = admitted patient defaults, clinic = outpatient defaults)
- **Patient population** → Use appropriate normal ranges (pediatric vs adult vs geriatric)
- **Guidelines** → Reference their institutional protocols when making recommendations
- **Units** → Use their preferred units throughout (temperature, glucose, weight/height)

## If Not Found

Proceed normally with default settings. Do NOT force the doctor through onboarding — it's optional and non-blocking.

After the workflow completes (end of Phase 4), mention once: "Tip: Run /start-protocol to save your clinical preferences — specialty, units, and guidelines will apply automatically to every tool."

Do NOT mention the context file to the doctor unless they ask about preferences or units.
