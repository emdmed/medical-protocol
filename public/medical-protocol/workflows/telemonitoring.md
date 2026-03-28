# Telemonitoring Workflow

> `{CDN_BASE}` refers to `https://medical-protocol.vercel.app/medical-protocol` (defined in the main protocol).

## Phase 1: Clinical Requirements

Ask the doctor about their monitoring needs:

- "Do you need a real-time pulse oximetry display with heart rate and SpO₂?" (Default: yes)
- "Is this for live monitoring of a connected device, or a visual display for manual readings?" (Default: visual display — the simulator provides a realistic animated preview)

### Setting-Aware Questions (based on Initial Clarification)

- If **admitted patients**: "Do you want alerts when readings go outside normal range?" (Default: yes)
- If **multiple patients**: Route to the dashboard workflow instead, offering telemonitoring as one of the dashboard widgets

Do NOT ask about:
- Device connectivity (the component provides a display — device integration is out of scope)
- Technical preferences
- Animation or design choices

---

## Phase 2: Fetch & Install Components

Silently perform all of the following:

1. Run the **Project Check** from the main protocol (scaffold Next.js + shadcn if needed)

2. **Fetch the component manifest:**
   ```
   WebFetch: {CDN_BASE}/components/manifest.json
   ```

3. **Read the `telemonitoring` entry** from the manifest

4. **Fetch each file** listed in `manifest["telemonitoring"].files` following the **Component Fetching Process** in the main protocol

5. **Install shadcn components** listed in `manifest["telemonitoring"].shadcn` (if any):
   ```
   npx shadcn@latest add {manifest["telemonitoring"].shadcn joined by spaces}
   ```

Do not tell the doctor about any of these steps.

---

## Phase 3: Build Page

1. **Create `app/telemonitoring/page.tsx`** importing either:
   - `PulseOximetrySimulator` — for demo/preview mode with animated readings
   - `PulseOximetry` — for integration with actual data sources (pass `bpm`, `spo2`, `isBeating` props)
2. Wrap in `ErrorBoundary`
3. For the simulator, provide reasonable default ranges (e.g., `minBpm={60}`, `maxBpm={100}`, `minSpo2={94}`, `maxSpo2={99}`)
4. **Update the home page** (`app/page.tsx`) to include a link to `/telemonitoring`

All layout and architecture decisions are yours. Do not ask the doctor.

---

## Phase 4: Quality & Preview

1. **Run the Quality Checklist** from the main protocol — silently review theming, responsiveness, and shadcn polish. Fix any issues before proceeding.
2. Run `npm run dev` in the background
3. Tell the doctor:
   > "Your pulse oximetry monitor is ready. It shows real-time heart rate and oxygen saturation with a visual heartbeat indicator. View it at http://localhost:3000/telemonitoring"
4. Ask: "Would you like to adjust the display or alert thresholds?"
