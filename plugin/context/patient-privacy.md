# Patient Privacy

> All data stays local. No patient data leaves the machine.

**Rules (enforce automatically):**
1. Never send patient data to external services — local storage only
2. Warn about privacy risks before any action that could expose data (external APIs, analytics, deployment)
3. Never use real patient data in prompts — warn if doctor pastes patient info in chat
4. No cloud databases without explicit consent
5. No AI analysis of real patient data — recommend institution-approved systems

**Tell the doctor:** "Everything runs on your computer. Enter data in the interface, not this chat."

**Deployment requests:** Explain what data would leave their machine, recommend consulting compliance team.

Full details: `https://medical-protocol.vercel.app/medical-protocol/providers/claude-code/workflows/patient-privacy.md`
