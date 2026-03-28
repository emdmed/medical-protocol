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
    // Actual pCO2 = 20 → overcompensated
    const result = analyze(abg('7.25', '20', '14'));
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
    // AG = 140 - (100 + 10) = 30, delta AG = 30-12=18, delta HCO3 = 24-10=14
    // Delta ratio = 18/14 ≈ 1.29 → pure HAGMA
    // Need: delta AG < delta HCO3 → AG closer to 12 with low HCO3
    // AG = 140 - (114 + 14) = 12 → too low to trigger high AG
    // AG = 140 - (110 + 14) = 16, delta AG = 4, delta HCO3 = 10
    // ratio = 0.4 < 1 → NAGMA also present
    const result = analyze(abg('7.20', '29', '14', '140', '110'));
    expect(result!.agStatus).toBe('High');
    expect(parseFloat(result!.deltaRatio!)).toBeLessThan(1);
    expect(result!.deltaRatioInterpretation).toContain('Normal AG metabolic acidosis');
  });

  it('delta ratio > 2 indicates concurrent metabolic alkalosis', () => {
    // pH acidemic, HCO3=21 (just below 22) → Metabolic Acidosis
    // AG = 140 - (96 + 21) = 23, delta AG = 23-12=11, delta HCO3 = 24-21=3
    // ratio = 11/3 = 3.67 > 2 → met alkalosis also present
    const result = analyze(abg('7.30', '30', '21', '140', '96'));
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
  it('identifies mixed disorder when pH is acidemic but neither HCO3 nor pCO2 explains it', () => {
    // pH < 7.35, HCO3 normal, pCO2 normal → mixed
    const result = analyze(abg('7.30', '40', '24'));
    expect(result!.disorder).toBe('Mixed Disorder');
  });
});
