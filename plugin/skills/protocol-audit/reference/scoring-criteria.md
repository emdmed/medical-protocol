# Protocol Audit Scoring Criteria

## Clinical Safety (0–4)

| Score | Criteria |
|-------|---------|
| 0 | No input validation, no alerts for abnormal values |
| 1 | Basic input validation exists but incomplete |
| 2 | Validation present, some critical alerts, units shown inconsistently |
| 3 | All critical value alerts, validation complete, units shown — minor gaps |
| 4 | Comprehensive validation, all critical alerts with clear messaging, units on every value |

### What to Check
- Input fields reject out-of-range values (e.g., negative BP, SpO₂ > 100)
- Critical value thresholds trigger visible alerts
- All displayed values include units (mmHg, bpm, °C/°F, %)
- Calculations show the formula inputs, not just the result

## Data Completeness (0–4)

| Score | Criteria |
|-------|---------|
| 0 | Missing required fields, orphan calculations |
| 1 | Core fields present, some calculations incomplete |
| 2 | Most fields present, calculations work but missing edge cases |
| 3 | All fields present, calculations handle edge cases — minor gaps |
| 4 | Complete data model, all calculations include required inputs, no orphans |

### What to Check
- Anion gap requires Na⁺, Cl⁻, HCO₃⁻ — are all collected?
- Delta-delta ratio checked when AG is elevated?
- DKA resolution checks all 3 criteria (pH, HCO₃⁻, AG)?
- Water balance includes insensible losses?
- BMI shows WHO classification alongside the number?

## Privacy Compliance (0–4)

| Score | Criteria |
|-------|---------|
| 0 | External API calls present, analytics tracking found |
| 1 | Some external calls, no analytics but data leaves the app |
| 2 | No analytics, minimal external calls (fonts/CDN only) |
| 3 | No data transmission, local storage only — minor concerns |
| 4 | Zero external data transmission, no analytics, no realistic fake data, all local |

### What to Check
- No `fetch()` or `XMLHttpRequest` to external APIs (except CDN assets)
- No Google Analytics, Mixpanel, Sentry, or similar
- No realistic patient names, DOBs, or medical record numbers in demo data
- Data stored in localStorage/state only, not sent anywhere

## UI Accessibility (0–4)

| Score | Criteria |
|-------|---------|
| 0 | No labels, no aria attributes, color-only indicators |
| 1 | Some labels present, missing aria on interactive elements |
| 2 | Labels on most inputs, some aria attributes, keyboard partially works |
| 3 | All inputs labeled, aria attributes present, keyboard navigable — minor gaps |
| 4 | Full WCAG 2.1 AA: labels, aria, keyboard navigation, focus management, color + text |

### What to Check
- All `<input>` elements have associated labels or `aria-label`
- Abnormal value indicators use text + color (not color alone)
- Tab order follows logical reading order
- Modals/popups trap focus and can be dismissed with Escape
- Touch targets are at least 44×44px on mobile

## Protocol Adherence (0–4)

| Score | Criteria |
|-------|---------|
| 0 | Component contradicts clinical guidelines |
| 1 | Follows guidelines loosely, missing key criteria |
| 2 | Mostly correct, some guideline criteria missing |
| 3 | Follows guidelines well — minor deviations |
| 4 | Fully aligned with current clinical guidelines, all criteria implemented |

### What to Check
- DKA: Resolution requires pH > 7.3, HCO₃⁻ > 15, AG < 12 (all three)
- ARDS: Berlin criteria require bilateral infiltrates, timing, PEEP ≥ 5
- Acid-base: Compensation formulas match published references
- Vitals: Normal ranges match ACC/AHA (BP), standard references (HR, RR, Temp)
- BMI: WHO classification categories used correctly
