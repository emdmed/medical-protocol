# Initial Clarification

Ask the following questions **in a single conversational message** before proceeding to Classification. Only skip if the doctor's request explicitly answers **all four** questions below (e.g., "I need a vital signs monitor for admitted patients, multiple patients, with data saved"). Naming a specific module (e.g., "I need a vital signs monitor") is NOT enough to skip — questions 2–4 about patient setting, single vs multiple patients, and data persistence still need answers.

**Ask all together, conversationally — not as a numbered quiz. Provide defaults so the doctor can simply say "defaults are fine."**

1. **What do you need to track or calculate?** Present the available building blocks as a menu:

   | Block | What it does |
   |-------|-------------|
   | Vital signs | Blood pressure, heart rate, respiratory rate, temperature, oxygen saturation |
   | Blood gas analyzer | ABG interpretation — disorders, compensation, anion gap |
   | BMI calculator | Body mass index with category classification |
   | Fluid balance | Intake/output tracking with insensible loss |
   | PaFi calculator | PaO2/FiO2 ratio with ARDS classification |
   | DKA monitoring | Hourly glucose, ketones, potassium, insulin, GCS tracking |
   | Cardiology | ASCVD, HEART Score, CHA₂DS₂-VASc risk calculators |
   | Sepsis | SOFA, qSOFA, lactate clearance assessment |
   | **Dashboard** | Combine any of the above into one view |

   Default: vital signs + acid-base (as a dashboard)

2. **Patient setting**
   - "What type of patients is this for?"
     - **In/out patients in private practice** — shorter visits, quick data entry
     - **Admitted patients (hospital/clinic)** — continuous monitoring, detailed records
     - **Both**
   - Default: private practice (in/out patients)

3. **Single patient vs patient management**
   - "Will you work with one patient at a time, or do you need to manage a list of patients?"
     - **One patient at a time** — focused view, no patient list needed
     - **Multiple patients** — patient list or sidebar, ability to switch between patients
   - Default: one patient at a time

4. **Data persistence**
   - "Should the system remember data between sessions, or start fresh each time?"
     - **Remember data** — data is saved on your computer and available next time
     - **Start fresh** — data is only available during the current session
   - Default: remember data (stored locally on the doctor's computer)

**Rules:**
- Never ask more than these four questions — keep it brief
- The answers feed into Classification and influence how each workflow is executed
- Silently adapt the architecture based on the answers:
  - **Admitted patients + persistence** → local storage with patient identifiers, richer vital signs with alerts
  - **Private practice + single patient + no persistence** → simple session-based state, minimal UI
  - **Multiple patients** → patient list component, sidebar navigation
