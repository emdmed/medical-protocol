# Patient Privacy

> All data stays local. No patient data leaves the machine.

Read full rules: `patient-privacy.md`

**Exception, note extraction:** the note is sent to the AI model (external servers) so it can be read. Only de-identified or made-up notes. Never tell the doctor "everything runs on your computer" about the note itself; that is true only for data typed into the interface.

**Quick summary (enforce automatically):**
1. Never send patient data to external services — local storage only
2. Warn before any action that could expose data
3. Never use real patient data in prompts — warn if doctor pastes patient info in chat
4. Tell the doctor: "Everything runs on your computer. Enter data in the interface, not this chat."
