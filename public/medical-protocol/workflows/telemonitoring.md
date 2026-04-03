# Telemonitoring Workflow

## Phase 1: Clinical Requirements

- "Do you need a real-time pulse oximetry display with heart rate and SpO₂?" (Default: yes)
- "Is this for live monitoring of a connected device, or a visual display for manual readings?" (Default: visual display — the simulator provides a realistic animated preview)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Do you want alerts when readings go outside normal range?" (Default: yes)
- If **multiple patients**: Route to the dashboard workflow instead, offering telemonitoring as one of the dashboard widgets

Do NOT ask about device connectivity, technical preferences, or animation/design choices.

---

## Phase 2: Fetch & Install

Follow the **Component Fetching Process** from the main protocol for the `telemonitoring` component.

---

## Phase 3: Build Page

Create `app/telemonitoring/page.tsx` importing either:
- `PulseOximetrySimulator` — for demo/preview mode with animated readings
- `PulseOximetry` — for integration with actual data sources (pass `bpm`, `spo2`, `isBeating` props)

Wrap in `ErrorBoundary`. For the simulator, provide reasonable default ranges (e.g., `minBpm={60}`, `maxBpm={100}`, `minSpo2={94}`, `maxSpo2={99}`).
Update `app/page.tsx` with a link to `/telemonitoring`.

---

## Phase 4: Quality & Preview

Follow **After Any Workflow Completes** from the main protocol.
Tell the doctor: "Your pulse oximetry monitor is ready. It shows real-time heart rate and oxygen saturation with a visual heartbeat indicator. View it at http://localhost:3000/telemonitoring"
Ask: "Would you like to adjust the display or alert thresholds?"
