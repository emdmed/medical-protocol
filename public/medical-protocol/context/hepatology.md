# Hepatology Module Context

MASLD/MASH screening per the ADA Standards of Care 2026 Ch. 4 algorithm (Figure 4.3): FIB-4 → LSM/ELF → referral, with stage-based treatment recommendations.

Logic: `lib/medprotocol/hepatology.ts` — import from `@/lib/medprotocol/hepatology`. Build: see `building.md`.

---

## Screen spec

**Shows:**
- **Latest assessment:** FIB-4 score + tier, risk stage, action, reassessment interval
- **Treatment** (only when severity is `warning` or `critical`): obesity, diabetes, MASH recommendations
- **Risk factors:** count "N of 6" + a badge per factor present
- **History:** date, FIB-4, stage, risk-factor count
- Empty state: "No MASLD screening assessments."

**Add assessment** (strings; date = today YYYY-MM-DD):

| Field | Unit | Placeholder | Required |
|---|---|---|---|
| Age | years | 50 | yes |
| AST | U/L | 40 | yes |
| ALT | U/L | 35 | yes |
| Platelets | 10⁹/L | 200 | yes |
| LSM (liver stiffness) | kPa | optional | phase 2 |
| ELF score | — | optional | phase 2 |

Risk-factor checkboxes: Type 2 diabetes, Prediabetes, Obesity (BMI ≥30), Overweight + CV risk, Elevated transaminases, Hepatic steatosis.

**Interaction:** Add is disabled until age, AST, ALT and platelets are filled. On narrow containers a Latest / History toggle replaces the side-by-side view.

**Display rules:** colors from the lib's `severity`. Show `sources.ADA_2026_FIG_4_3` as the source.

**Props contract:** `data?: MasldScreeningReading[]`, `onData?: (data: MasldScreeningReading[]) => void`.

```typescript
interface MasldScreeningReading {
  id: string; date: string;
  age: string; ast: string; alt: string;   // U/L
  platelets: string;                       // 10^9/L
  lsm: string;                             // kPa, optional
  elf: string;                             // optional
  riskFactors: {
    t2diabetes: boolean; prediabetes: boolean; obesity: boolean;
    overweightWithCVRisk: boolean; elevatedTransaminases: boolean; hepaticSteatosis: boolean;
  };
  trace?: TraceEntry[];
}
```

---

## Synthetic patient generator

For the **Generate patient** button (`building.md` §3). Each press: pick a scenario at random, draw each value uniformly in its range, apply the couplings, round as stated. Fields not listed stay empty.

| Scenario | Age | AST (U/L) | ALT (U/L) | Platelets (10⁹/L) | Risk factors (of 6) | LSM (kPa) |
|---|---|---|---|---|---|---|
| Low risk | 35–60 | 18–35 | 20–45 | 200–350 | 0–2 | empty, or 4.0–7.9 |
| Indeterminate | 45–65 | 30–55 | 30–60 | 150–220 | 1–3 | empty, or 8.0–12.0 |
| High risk (advanced fibrosis) | 55–75 | 50–120, above ALT | 35–90 | 80–150 | 2–5 | empty, or 12.1–25.0 |

Age never below 35 (FIB-4 is not valid there). ELF stays empty, or in the high-risk scenario 1 in 3: 9.8–12.0. Rounding: LSM and ELF 1 decimal, others whole numbers.

Every generated patient is labelled "Synthetic patient" with a 4-character code, never a name. Results still come only from the lib.

## Lib Functions

`Severity = "normal" | "warning" | "critical"`. Inputs are strings, parsed internally (invalid → 0).

- `calculateFIB4(age, ast, alt, platelets)` → `{ score, tier: "low" | "indeterminate" | "high", severity }`. FIB-4 = (age × AST) / (platelets × √ALT), 2 decimals. Returns score 0 / low when any input ≤0.
- `getMASLDRiskStratification(fib4Tier, lsm?, elf?)` → `{ stage, action, severity, referral, interval }`
- `getMASLDTreatmentRecommendation(referral, severity)` → `{ obesity, diabetes, mash }`
- `countRiskFactors(riskFactors: Record<string, boolean>)` → number of `true` values

---

## Thresholds

**Phase 1 — FIB-4** (age-adjusted low cutoff):

| Tier | Age <65 | Age ≥65 | Result |
|---|---|---|---|
| Low | <1.3 | <2.0 | Low risk — reassess with FIB-4 every 1–2 years |
| Indeterminate | 1.3–2.66 | 2.0–2.66 | Go to phase 2 |
| High | ≥2.67 | ≥2.67 | Advanced fibrosis — refer to hepatologist immediately |

**Phase 2 — indeterminate FIB-4** (LSM takes precedence over ELF):
- LSM <8.0 kPa or ELF <9.8 → low risk, reassess every 1–2 years
- LSM ≥8.0 kPa or ELF ≥9.8 → at-risk, significant fibrosis — refer to hepatologist
- Neither available → "Obtain LSM or ELF"

**Treatment** (ADA Fig 4.3):
- Referral / critical: weight loss ≥10% (lifestyle ± GLP-1 RA ± metabolic surgery); pioglitazone or GLP-1 RA preferred; resmetirom may be considered if biopsy-confirmed MASH with F2–F3 fibrosis
- Warning: weight loss ≥5–7% through lifestyle; optimize glycemia, GLP-1 RA may be considered; LSM or ELF to clarify risk
- Normal: maintain healthy weight, standard glycemic management, routine monitoring

---

## Cross-Tool Data

- **← Patient:** age
- **← Diabetes-dx / BMI:** type 2 diabetes, prediabetes, obesity can pre-check the risk-factor boxes (no programmatic link in the lib)

---

## Gotchas

- **Platelets in 10⁹/L** (e.g. 200), not /µL
- **Treatment text is shown only for warning/critical**
- No CLI command for this module yet

---

## Guideline Reference

ADA Standards of Care 2026, Chapter 4, Figure 4.3 — MASLD/MASH algorithm (`sources.ADA_2026_FIG_4_3`). FIB-4 formula: `sources.FIB4_2006`.
