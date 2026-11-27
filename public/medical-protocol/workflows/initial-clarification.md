# Initial Clarification

Ask the following questions **in a single conversational message** before proceeding to Classification. They shape the prototype, not a real practice: every case in it is synthetic. Only skip if the user's request explicitly answers **all three** questions below, or the user asks for a quick prototype ("just build it", "quick", "defaults") — then use the defaults and say which ones in one line. Naming a specific module (e.g., "I need a vital signs monitor") is NOT enough to skip — the questions about patient setting, single vs multiple patients, and data persistence still need answers.

**Ask all together, conversationally — not as a numbered quiz. Provide defaults so the user can simply say "defaults are fine."**

1. **Setting the prototype imagines**
   - "Which setting should the prototype be set in?"
     - **Clinic visits** — shorter visits, quick data entry
     - **Hospital ward** — continuous monitoring, detailed records
     - **Both**
   - Default: clinic visits

2. **Single patient vs patient management**
   - "Should it show one synthetic patient at a time, or a list of them?"
     - **One patient at a time** — focused view, no patient list needed
     - **A list** — patient list or sidebar with synthetic patients, ability to switch between them
   - Default: one patient at a time

3. **Data persistence**
   - "Should the prototype remember what's entered between sessions, or start fresh each time?"
     - **Remember** — saved in the browser on your computer and there next time
     - **Start fresh** — only kept during the current session
   - Default: remember (stored locally in the browser)

**Rules:**
- Never ask more than these three questions — keep it brief
- **Always ask Q2 and Q3 explicitly**, unless the user asked for a quick prototype. Words like "track", "monitor", "manage", or plural "patients" in the user's request do NOT count as answering these questions. The user must explicitly state "multiple patients" or "save data between sessions" (or equivalent) for you to skip them.
- The answers feed into Classification and influence how each workflow is executed
- Components and component groups are chosen later during Classification — do not ask about them here
- Automatically adapt the architecture based on the answers:
  - **Hospital ward + remember** → local storage keyed by synthetic labels ("Synthetic patient A"), never names, dates of birth or record numbers; richer vital signs with alerts
  - **Clinic visits + one patient + start fresh** → simple session-based state, minimal UI
  - **A list** → patient list component, sidebar navigation, seeded with synthetic patients from the cases
