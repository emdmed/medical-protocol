# Initial Clarification

Ask the following questions **in a single conversational message** before proceeding to Classification. Only skip if the doctor's request explicitly answers **all three** questions below. Naming a specific module (e.g., "I need a vital signs monitor") is NOT enough to skip — the questions about patient setting, single vs multiple patients, and data persistence still need answers.

**Ask all together, conversationally — not as a numbered quiz. Provide defaults so the doctor can simply say "defaults are fine."**

1. **Patient setting**
   - "What type of patients is this for?"
     - **In/out patients in private practice** — shorter visits, quick data entry
     - **Admitted patients (hospital/clinic)** — continuous monitoring, detailed records
     - **Both**
   - Default: private practice (in/out patients)

2. **Single patient vs patient management**
   - "Will you work with one patient at a time, or do you need to manage a list of patients?"
     - **One patient at a time** — focused view, no patient list needed
     - **Multiple patients** — patient list or sidebar, ability to switch between patients
   - Default: one patient at a time

3. **Data persistence**
   - "Should the system remember data between sessions, or start fresh each time?"
     - **Remember data** — data is saved on your computer and available next time
     - **Start fresh** — data is only available during the current session
   - Default: remember data (stored locally on the doctor's computer)

**Rules:**
- Never ask more than these three questions — keep it brief
- **Always ask Q2 and Q3 explicitly.** Words like "track", "monitor", "manage", or plural "patients" in the doctor's request do NOT count as answering these questions. The doctor must explicitly state "multiple patients" or "save data between sessions" (or equivalent) for you to skip them.
- The answers feed into Classification and influence how each workflow is executed
- Components and component groups are chosen later during Classification — do not ask about them here
- Automatically adapt the architecture based on the answers:
  - **Admitted patients + persistence** → local storage with patient identifiers, richer vital signs with alerts
  - **Private practice + single patient + no persistence** → simple session-based state, minimal UI
  - **Multiple patients** → patient list component, sidebar navigation
