import { describe, it, expect } from 'vitest';
import { analyze } from '../../public/medical-protocol/components/acid-base/analyze';

// Helper to create ABG values
const abg = (
  pH: string,
  pCO2: string,
  HCO3: string,
  Na = '',
  Cl = '',
  Albumin = ''
) => ({
  values: { pH, pCO2, HCO3, Na, Cl, Albumin },
  isChronic: false,
});

const abgChronic = (
  pH: string,
  pCO2: string,
  HCO3: string,
  Na = '',
  Cl = '',
  Albumin = ''
) => ({
  values: { pH, pCO2, HCO3, Na, Cl, Albumin },
  isChronic: true,
});

describe('analyze — returns null for incomplete input', () => {
  it('returns null when pH is missing', () => {
    expect(analyze(abg('', '40', '24'))).toBeNull();
  });

  it('returns null when pCO2 is missing', () => {
    expect(analyze(abg('7.40', '', '24'))).toBeNull();
  });

  it('returns null when HCO3 is missing', () => {
    expect(analyze(abg('7.40', '40', ''))).toBeNull();
  });
});

describe('analyze — normal ABG', () => {
  it('identifies normal acid-base status', () => {
    const result = analyze(abg('7.40', '40', '24'));
    expect(result).not.toBeNull();
    expect(result!.disorder).toBe('Normal');
    expect(result!.interpretation).toContain('Normal');
  });
});

describe('analyze — metabolic acidosis', () => {
  it('identifies primary metabolic acidosis (pH 7.25, low HCO3)', () => {
    const result = analyze(abg('7.25', '30', '14'));
    expect(result!.disorder).toBe('Metabolic Acidosis');
  });

  it('checks Winter\'s formula compensation', () => {
    // Winter's: expected pCO2 = 1.5 * 14 + 8 = 29 ± 2 → 27-31
    const result = analyze(abg('7.25', '29', '14'));
    expect(result!.disorder).toBe('Metabolic Acidosis');
    expect(result!.compensation).toBe('Compensated');
    expect(result!.expectedValues.low).toBeDefined();
    expect(result!.expectedValues.high).toBeDefined();
  });

  it('detects overcompensation (pCO2 too low)', () => {
    // Winter's: expected pCO2 = 1.5 * 14 + 8 = 29 ± 2 → 27-31
    // Actual pCO2 = 25 → overcompensated (below 27)
    // H-H: 6.1 + log10(14 / (0.03 * 25)) = 7.371, pH 7.30 → deviation 0.071
    const result = analyze(abg('7.30', '25', '14'));
    expect(result!.disorder).toBe('Metabolic Acidosis');
    expect(result!.compensation).toBe('Overcompensated');
  });

  it('detects inadequate compensation (pCO2 too high)', () => {
    // Winter's: expected pCO2 = 1.5 * 14 + 8 = 29 ± 2 → 27-31
    // Actual pCO2 = 50 → inadequate
    const result = analyze(abg('7.15', '50', '14'));
    expect(result!.disorder).toBe('Metabolic Acidosis');
    expect(result!.compensation).toBe('Inadequate compensation');
  });
});

describe('analyze — metabolic alkalosis', () => {
  it('identifies primary metabolic alkalosis (pH 7.50, high HCO3)', () => {
    const result = analyze(abg('7.50', '42', '32'));
    expect(result!.disorder).toBe('Metabolic Alkalosis');
  });

  it('checks compensation formula', () => {
    // Expected pCO2 = 0.7 * (32 - 24) + 40 = 45.6 ± 2
    const result = analyze(abg('7.50', '46', '32'));
    expect(result!.disorder).toBe('Metabolic Alkalosis');
    expect(result!.compensation).toBe('Compensated');
  });
});

describe('analyze — respiratory acidosis', () => {
  it('identifies acute respiratory acidosis', () => {
    const result = analyze(abg('7.28', '60', '25'));
    expect(result!.disorder).toBe('Respiratory Acidosis');
  });

  it('calculates acute compensation (ΔHCO3 = 0.1 × ΔpCO2)', () => {
    // Expected HCO3 = 24 + 0.1 * (60 - 40) = 26 ± 3
    const result = analyze(abg('7.28', '60', '26'));
    expect(result!.disorder).toBe('Respiratory Acidosis');
    expect(result!.compensation).toBe('Compensated');
  });

  it('calculates chronic compensation (ΔHCO3 = 0.35 × ΔpCO2)', () => {
    // Expected HCO3 = 24 + 0.35 * (60 - 40) = 31 ± 3
    const result = analyze(abgChronic('7.33', '60', '31'));
    expect(result!.disorder).toBe('Respiratory Acidosis');
    expect(result!.compensation).toBe('Compensated');
  });
});

describe('analyze — respiratory alkalosis', () => {
  it('identifies acute respiratory alkalosis', () => {
    const result = analyze(abg('7.50', '28', '22'));
    expect(result!.disorder).toBe('Respiratory Alkalosis');
  });

  it('calculates acute compensation (ΔHCO3 = 0.2 × ΔpCO2)', () => {
    // Expected HCO3 = 24 - 0.2 * (40 - 28) = 21.6 ± 2
    const result = analyze(abg('7.50', '28', '22'));
    expect(result!.disorder).toBe('Respiratory Alkalosis');
    expect(result!.compensation).toBe('Compensated');
  });

  it('calculates chronic compensation (ΔHCO3 = 0.5 × ΔpCO2)', () => {
    // Expected HCO3 = 24 - 0.5 * (40 - 28) = 18 ± 2
    const result = analyze(abgChronic('7.48', '28', '18'));
    expect(result!.disorder).toBe('Respiratory Alkalosis');
    expect(result!.compensation).toBe('Compensated');
  });
});

describe('analyze — anion gap', () => {
  it('calculates uncorrected anion gap', () => {
    // AG = 140 - (104 + 14) = 22 (high)
    const result = analyze(abg('7.25', '29', '14', '140', '104'));
    expect(result!.uncorrectedAG).toBe('22.0');
    expect(result!.agStatus).toBe('High');
  });

  it('calculates normal anion gap', () => {
    // AG = 140 - (106 + 24) = 10 (normal, 8-12)
    const result = analyze(abg('7.40', '40', '24', '140', '106'));
    expect(result!.uncorrectedAG).toBe('10.0');
    expect(result!.agStatus).toBe('Normal');
  });

  it('calculates low anion gap', () => {
    // AG = 135 - (110 + 24) = 1 (low, < 8)
    const result = analyze(abg('7.40', '40', '24', '135', '110'));
    expect(result!.uncorrectedAG).toBe('1.0');
    expect(result!.agStatus).toBe('Low');
  });

  it('applies albumin correction', () => {
    // Uncorrected AG = 140 - (104 + 24) = 12
    // Corrected AG = 12 + 2.5 * (4.0 - 2.0) = 17 → High
    const result = analyze(abg('7.40', '40', '24', '140', '104', '2.0'));
    expect(result!.correctedAG).toBe('17.0');
    expect(result!.agStatus).toBe('High');
  });

  it('returns null anion gap when Na or Cl missing', () => {
    const result = analyze(abg('7.40', '40', '24'));
    expect(result!.anionGap).toBeNull();
    expect(result!.agStatus).toBeNull();
  });
});

describe('analyze — delta ratio', () => {
  it('calculates delta ratio for HAGMA', () => {
    // AG = 140 - (104 + 14) = 22, delta AG = 22-12=10, delta HCO3 = 24-14=10
    // Delta ratio = 10/10 = 1.00 → pure HAGMA
    const result = analyze(abg('7.25', '29', '14', '140', '104'));
    expect(result!.deltaRatio).toBe('1.00');
    expect(result!.deltaRatioInterpretation).toContain('Pure high AG');
  });

  it('delta ratio < 1 indicates concurrent NAGMA', () => {
    // AG = 140 - (110 + 14) = 16 (High), delta AG = 4, delta HCO3 = 10
    // ratio = 0.4 < 1 → NAGMA also present
    // H-H: 6.1 + log10(14 / (0.03 * 29)) = 7.307 → pH 7.25, deviation 0.057
    const result = analyze(abg('7.25', '29', '14', '140', '110'));
    expect(result!.agStatus).toBe('High');
    expect(parseFloat(result!.deltaRatio!)).toBeLessThan(1);
    expect(result!.deltaRatioInterpretation).toContain('Normal AG metabolic acidosis');
  });

  it('delta ratio > 2 indicates concurrent metabolic alkalosis', () => {
    // pH acidemic, HCO3=20, pCO2=40 → Metabolic Acidosis
    // AG = 140 - (96 + 20) = 24 (High), delta AG = 12, delta HCO3 = 4
    // ratio = 3.0 > 2 → met alkalosis also present
    // H-H: 6.1 + log10(20 / (0.03 * 40)) = 7.322, use pH 7.32
    const result = analyze(abg('7.32', '40', '20', '140', '96'));
    expect(result!.disorder).toBe('Metabolic Acidosis');
    expect(result!.agStatus).toBe('High');
    expect(parseFloat(result!.deltaRatio!)).toBeGreaterThan(2);
    expect(result!.deltaRatioInterpretation).toContain('alkalosis');
  });

  it('does not calculate delta ratio for non-HAGMA', () => {
    const result = analyze(abg('7.40', '40', '24', '140', '106'));
    expect(result!.deltaRatio).toBeNull();
  });
});

describe('analyze — mixed disorders', () => {
  it('flags incoherent values but still provides disorder analysis', () => {
    // pH 7.30, pCO2 40, HCO3 24 → H-H predicts ~7.40, deviation ~0.10
    // Incoherent but analysis still runs — classified as Mixed Disorder with flag
    const result = analyze(abg('7.30', '40', '24'));
    expect(result!.disorder).toBe('Mixed Disorder');
    expect(result!.hhConsistency!.isCoherent).toBe(false);
    expect(result!.hhConsistency!.warning).toContain('verify lab values');
  });
});

describe('analyze — Henderson-Hasselbalch coherence validator', () => {
  it('passes coherence for consistent values and proceeds with analysis', () => {
    // H-H: 6.1 + log10(24 / (0.03 * 40)) = 7.401, measured 7.40 → deviation 0.001
    const result = analyze(abg('7.40', '40', '24'));
    expect(result!.hhConsistency!.isCoherent).toBe(true);
    expect(result!.hhConsistency!.warning).toBeNull();
    expect(result!.disorder).toBe('Normal');
  });

  it('flags incoherent values with warning but still runs full analysis', () => {
    // H-H predicts ~7.40 but measured is 7.30 → deviation ~0.10
    const result = analyze(abg('7.30', '40', '24'));
    expect(result!.hhConsistency!.isCoherent).toBe(false);
    expect(result!.hhConsistency!.warning).toContain('verify lab values');
    // Analysis still proceeds — disorder is determined, not blocked
    expect(result!.disorder).not.toBeNull();
    expect(result!.disorder).toBe('Mixed Disorder');
  });

  it('includes expected pH, measured pH, and deviation', () => {
    const result = analyze(abg('7.40', '40', '24'));
    expect(result!.hhConsistency!.expectedPH).toBeDefined();
    expect(result!.hhConsistency!.measured).toBe('7.40');
    expect(parseFloat(result!.hhConsistency!.deviation)).toBeLessThanOrEqual(0.08);
  });

  it('tolerates small deviations within ±0.08', () => {
    // H-H: 6.1 + log10(14 / (0.03 * 50)) = 7.07, measured 7.15 → deviation 0.08
    const result = analyze(abg('7.15', '50', '14'));
    expect(result!.hhConsistency!.isCoherent).toBe(true);
    expect(result!.disorder).not.toBe('Inconclusive');
  });
});

describe('analyze — metabolic alkalosis compensation tolerance', () => {
  it('uses ±5 tolerance window', () => {
    // Expected pCO2 = 0.7 * (32 - 24) + 40 = 45.6
    // pCO2 = 50 is within ±5 (40.6 to 50.6) → compensated
    const result = analyze(abg('7.50', '50', '32'));
    expect(result!.disorder).toBe('Metabolic Alkalosis');
    expect(result!.compensation).toBe('Compensated');
  });

  it('detects inadequate compensation outside ±5', () => {
    // Expected pCO2 = 0.7 * (32 - 24) + 40 = 45.6, need pCO2 < 40.6
    // H-H: 6.1 + log10(32 / (0.03 * 35)) = 7.584, use pH 7.58
    const result = analyze(abg('7.58', '35', '32'));
    expect(result!.disorder).toBe('Metabolic Alkalosis');
    expect(result!.compensation).toBe('Inadequate compensation');
  });
});

describe('analyze — pCO2 ceiling for metabolic alkalosis', () => {
  it('caps expected pCO2 high at 55 mmHg for extreme HCO3', () => {
    // HCO3 = 50 → expected pCO2 = 0.7 * (50-24) + 40 = 58.2, capped at 55
    const result = analyze(abg('7.55', '52', '50'));
    expect(result!.disorder).toBe('Metabolic Alkalosis');
    expect(parseFloat(result!.expectedValues.high!)).toBeLessThanOrEqual(55);
  });
});

describe('analyze — allDisorders includes delta-ratio disorders', () => {
  it('includes Non-AG Metabolic Acidosis from delta ratio in allDisorders', () => {
    // AG = 140 - (110 + 14) = 16, delta AG = 4, delta HCO3 = 10, ratio = 0.4
    // H-H consistent: pH 7.25, deviation 0.057
    const result = analyze(abg('7.25', '29', '14', '140', '110'));
    expect(result!.allDisorders).toContain('Non-AG Metabolic Acidosis');
  });

  it('includes Metabolic Alkalosis from delta ratio in allDisorders', () => {
    // AG = 140 - (96 + 20) = 24, delta AG = 12, delta HCO3 = 4, ratio = 3.0
    // H-H consistent: pH 7.32, deviation 0.002
    const result = analyze(abg('7.32', '40', '20', '140', '96'));
    expect(result!.allDisorders).toContain('Metabolic Alkalosis');
  });
});
