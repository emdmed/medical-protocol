# Initial Clarification

When the doctor's request is vague or general (e.g., "I need something to track vitals" or "build me a patient system"), ask the following questions **in a single conversational message** before proceeding to Classification. If the request already makes the answers clear (e.g., "I need a vital signs monitor for admitted patients with data saved"), skip this section entirely.

**Ask all together, conversationally — not as a numbered quiz. Provide defaults so the doctor can simply say "defaults are fine."**

1. **What do you need to track or calculate?** Present the available building blocks as a menu:

   | Block | What it does |
   |-------|-------------|
   | Vital signs | Blood pressure, heart rate, respiratory rate, temperature, oxygen saturation |
   | Clinical notes | Encounter note editor with highlighting and local storage |
   | Blood gas analyzer | ABG interpretation — disorders, compensation, anion gap |
   | BMI calculator | Body mass index with category classification |
   | Fluid balance | Intake/output tracking with insensible loss |
   | PaFi calculator | PaO2/FiO2 ratio with ARDS classification |
   | DKA monitoring | Hourly glucose, ketones, potassium, insulin, GCS tracking |
   | Pulse oximetry | Real-time animated SpO2/BPM display |
   | Clinical timeline | Day-by-day hospitalization course with event details |
   | **Dashboard** | Combine any of the above into one view |

   Default: vital signs + clinical notes (as a dashboard)

2. **Patient setting**
   - "What type of patients is this for?"
     - **In/out patients in private practice** — shorter visits, quick data entry
     - **Admitted patients (hospital/clinic)** — continuous monitoring, detailed records
     - **Both**
   - Default: private practice (in/out patients)

3. **Data persistence**
   - "Should the system remember data between sessions, or start fresh each time?"
     - **Remember data** — data is saved on your computer and available next time
     - **Start fresh** — data is only available during the current session
   - Default: remember data (stored locally on the doctor's computer)

**Rules:**
- Never ask more than these three questions — keep it brief
- The answers feed into Classification and influence how each workflow is executed
- Silently adapt the architecture based on the answers:
  - **Admitted patients + persistence** → local storage with patient identifiers, richer vital signs with alerts
  - **Private practice + no persistence** → simple session-based state, minimal UI
