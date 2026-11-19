# DKA Resolution Criteria

Computed by `assessDKAResolution(ketones, bicarbonate, pH)` in `lib/medprotocol/dka`. Never re-implement in the UI.

## Resolution (2024 consensus)

| Criterion | Target | Notes |
|-----------|--------|-------|
| Blood β-hydroxybutyrate | < 0.6 mmol/L | Required. Not urine ketones |
| Venous pH | ≥ 7.30 | Either this… |
| Serum bicarbonate | ≥ 18 mmol/L | …or this |

Resolved = β-hydroxybutyrate < 0.6 AND (pH ≥ 7.30 OR bicarbonate ≥ 18).

## Additional Markers (supportive, not required)

- Blood glucose falling (often normalizes hours before acidosis). Glucose is not a resolution criterion.
- Anion gap closing
- Patient tolerating oral intake

## Common Pitfalls

- **Do NOT mark resolved based on glucose** — hyperglycemia resolves hours before ketosis and acidosis
- **Ketones must clear** — pH or bicarbonate alone is not enough
- **Transition timing** — switch to subcutaneous insulin only after resolution AND the patient can eat; give basal insulin 1–2 hours before stopping the IV infusion

## Sources

- Umpierrez GE et al. Hyperglycemic Crises in Adults With Diabetes: A Consensus Report. Diabetes Care 2024 (`sources.ADA_DKA_2024`)
- Joint British Diabetes Societies (JBDS) Inpatient Care Group guidelines
