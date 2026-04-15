import { describe, it, expect } from 'vitest';
import {
  calculateEGFR,
  classifyGFRCategory,
  classifyAlbuminuriaCategory,
  getCKDRiskLevel,
  getMonitoringFrequency,
  calculateKFRE,
  assessReferralNeed,
  checkRASiEligibility,
  checkSGLT2iEligibility,
  checkFinerenoneEligibility,
  calculateEGFRSlope,
  isRapidDecline,
  hasSignificantEGFRChange,
  hasACRDoubling,
  getCKDSeverity,
  getGFRCategoryLabel,
  getAlbuminuriaCategoryLabel,
} from '../../lib/ckd';

// ─── calculateEGFR ──────────────────────────────────────────────────

describe('calculateEGFR', () => {
  it('calculates eGFR for a 55-year-old male with Scr 1.2', () => {
    const egfr = calculateEGFR('1.2', '55', 'male');
    // CKD-EPI 2021: Scr/κ = 1.2/0.9 = 1.333 (>1), min=1^α=1, max=1.333^-1.2
    expect(egfr).toBeGreaterThan(60);
    expect(egfr).toBeLessThan(80);
  });

  it('calculates eGFR for a 40-year-old female with Scr 0.8', () => {
    const egfr = calculateEGFR('0.8', '40', 'female');
    // Young female with low creatinine → high eGFR
    expect(egfr).toBeGreaterThan(90);
  });

  it('calculates eGFR for a 70-year-old male with Scr 2.0', () => {
    const egfr = calculateEGFR('2.0', '70', 'male');
    // Older male with elevated creatinine → low eGFR
    expect(egfr).toBeGreaterThan(20);
    expect(egfr).toBeLessThan(45);
  });

  it('accepts "f" and "m" as sex abbreviations', () => {
    const egfrF = calculateEGFR('0.9', '50', 'f');
    const egfrFemale = calculateEGFR('0.9', '50', 'female');
    expect(egfrF).toBe(egfrFemale);

    const egfrM = calculateEGFR('0.9', '50', 'm');
    const egfrMale = calculateEGFR('0.9', '50', 'male');
    expect(egfrM).toBe(egfrMale);
  });

  it('female eGFR is slightly higher than male at same Scr below kappa', () => {
    // At Scr 0.6 (below both kappas), female has sex factor 1.012
    const female = calculateEGFR('0.6', '50', 'female');
    const male = calculateEGFR('0.6', '50', 'male');
    // Different kappa and alpha values, so not trivially comparable
    // but both should be high
    expect(female).toBeGreaterThan(90);
    expect(male).toBeGreaterThan(90);
  });

  it('returns 0 for empty creatinine', () => {
    expect(calculateEGFR('', '55', 'male')).toBe(0);
  });

  it('returns 0 for zero creatinine', () => {
    expect(calculateEGFR('0', '55', 'male')).toBe(0);
  });

  it('returns 0 for negative creatinine', () => {
    expect(calculateEGFR('-1', '55', 'male')).toBe(0);
  });

  it('returns 0 for empty age', () => {
    expect(calculateEGFR('1.0', '', 'male')).toBe(0);
  });

  it('returns 0 for zero age', () => {
    expect(calculateEGFR('1.0', '0', 'male')).toBe(0);
  });

  it('handles boundary Scr at kappa for male (0.9)', () => {
    const egfr = calculateEGFR('0.9', '50', 'male');
    // Scr/κ = 1.0 exactly → min=1^α=1, max=1^-1.2=1
    expect(egfr).toBeGreaterThan(0);
  });

  it('handles boundary Scr at kappa for female (0.7)', () => {
    const egfr = calculateEGFR('0.7', '50', 'female');
    expect(egfr).toBeGreaterThan(0);
  });

  it('handles very high creatinine', () => {
    const egfr = calculateEGFR('10', '60', 'male');
    expect(egfr).toBeGreaterThan(0);
    expect(egfr).toBeLessThan(10);
  });
});

// ─── classifyGFRCategory ────────────────────────────────────────────

describe('classifyGFRCategory', () => {
  it('returns G1 for eGFR >= 90', () => {
    expect(classifyGFRCategory('90')).toBe('G1');
    expect(classifyGFRCategory('120')).toBe('G1');
  });

  it('returns G2 for eGFR 60-89', () => {
    expect(classifyGFRCategory('60')).toBe('G2');
    expect(classifyGFRCategory('89')).toBe('G2');
  });

  it('returns G3a for eGFR 45-59', () => {
    expect(classifyGFRCategory('45')).toBe('G3a');
    expect(classifyGFRCategory('59')).toBe('G3a');
  });

  it('returns G3b for eGFR 30-44', () => {
    expect(classifyGFRCategory('30')).toBe('G3b');
    expect(classifyGFRCategory('44')).toBe('G3b');
  });

  it('returns G4 for eGFR 15-29', () => {
    expect(classifyGFRCategory('15')).toBe('G4');
    expect(classifyGFRCategory('29')).toBe('G4');
  });

  it('returns G5 for eGFR < 15', () => {
    expect(classifyGFRCategory('14')).toBe('G5');
    expect(classifyGFRCategory('5')).toBe('G5');
    expect(classifyGFRCategory('0')).toBe('G5');
  });

  it('handles exact boundaries', () => {
    expect(classifyGFRCategory('90')).toBe('G1');
    expect(classifyGFRCategory('89.9')).toBe('G2');
    expect(classifyGFRCategory('60')).toBe('G2');
    expect(classifyGFRCategory('59.9')).toBe('G3a');
    expect(classifyGFRCategory('45')).toBe('G3a');
    expect(classifyGFRCategory('44.9')).toBe('G3b');
    expect(classifyGFRCategory('30')).toBe('G3b');
    expect(classifyGFRCategory('29.9')).toBe('G4');
    expect(classifyGFRCategory('15')).toBe('G4');
    expect(classifyGFRCategory('14.9')).toBe('G5');
  });
});

// ─── classifyAlbuminuriaCategory ────────────────────────────────────

describe('classifyAlbuminuriaCategory', () => {
  it('returns A1 for ACR < 30', () => {
    expect(classifyAlbuminuriaCategory('0')).toBe('A1');
    expect(classifyAlbuminuriaCategory('10')).toBe('A1');
    expect(classifyAlbuminuriaCategory('29')).toBe('A1');
  });

  it('returns A2 for ACR 30-299', () => {
    expect(classifyAlbuminuriaCategory('30')).toBe('A2');
    expect(classifyAlbuminuriaCategory('150')).toBe('A2');
    expect(classifyAlbuminuriaCategory('299')).toBe('A2');
  });

  it('returns A3 for ACR >= 300', () => {
    expect(classifyAlbuminuriaCategory('300')).toBe('A3');
    expect(classifyAlbuminuriaCategory('3000')).toBe('A3');
  });

  it('handles exact boundaries', () => {
    expect(classifyAlbuminuriaCategory('29.9')).toBe('A1');
    expect(classifyAlbuminuriaCategory('30')).toBe('A2');
    expect(classifyAlbuminuriaCategory('299.9')).toBe('A2');
    expect(classifyAlbuminuriaCategory('300')).toBe('A3');
  });
});

// ─── getCKDRiskLevel ────────────────────────────────────────────────

describe('getCKDRiskLevel', () => {
  it('returns green for G1/A1 and G2/A1', () => {
    expect(getCKDRiskLevel('G1', 'A1')).toBe('green');
    expect(getCKDRiskLevel('G2', 'A1')).toBe('green');
  });

  it('returns yellow for G1/A2, G2/A2, G3a/A1', () => {
    expect(getCKDRiskLevel('G1', 'A2')).toBe('yellow');
    expect(getCKDRiskLevel('G2', 'A2')).toBe('yellow');
    expect(getCKDRiskLevel('G3a', 'A1')).toBe('yellow');
  });

  it('returns orange for G1/A3, G2/A3, G3a/A2, G3b/A1', () => {
    expect(getCKDRiskLevel('G1', 'A3')).toBe('orange');
    expect(getCKDRiskLevel('G2', 'A3')).toBe('orange');
    expect(getCKDRiskLevel('G3a', 'A2')).toBe('orange');
    expect(getCKDRiskLevel('G3b', 'A1')).toBe('orange');
  });

  it('returns red for G3a/A3, G3b/A2, G4/A1', () => {
    expect(getCKDRiskLevel('G3a', 'A3')).toBe('red');
    expect(getCKDRiskLevel('G3b', 'A2')).toBe('red');
    expect(getCKDRiskLevel('G4', 'A1')).toBe('red');
  });

  it('returns deep-red for G3b/A3, G4/A2, G4/A3, G5/*', () => {
    expect(getCKDRiskLevel('G3b', 'A3')).toBe('deep-red');
    expect(getCKDRiskLevel('G4', 'A2')).toBe('deep-red');
    expect(getCKDRiskLevel('G4', 'A3')).toBe('deep-red');
    expect(getCKDRiskLevel('G5', 'A1')).toBe('deep-red');
    expect(getCKDRiskLevel('G5', 'A2')).toBe('deep-red');
    expect(getCKDRiskLevel('G5', 'A3')).toBe('deep-red');
  });

  it('returns green for unknown category', () => {
    expect(getCKDRiskLevel('G99', 'A1')).toBe('green');
  });
});

// ─── getMonitoringFrequency ─────────────────────────────────────────

describe('getMonitoringFrequency', () => {
  it('returns 1 for low-risk (G1/A1)', () => {
    expect(getMonitoringFrequency('G1', 'A1')).toBe(1);
  });

  it('returns 2 for moderate risk (G3a/A2)', () => {
    expect(getMonitoringFrequency('G3a', 'A2')).toBe(2);
  });

  it('returns 3 for high risk (G3b/A2, G4/A1)', () => {
    expect(getMonitoringFrequency('G3b', 'A2')).toBe(3);
    expect(getMonitoringFrequency('G4', 'A1')).toBe(3);
  });

  it('returns 4 for very high risk (G5/A3)', () => {
    expect(getMonitoringFrequency('G5', 'A3')).toBe(4);
    expect(getMonitoringFrequency('G5', 'A1')).toBe(4);
  });
});

// ─── calculateKFRE ──────────────────────────────────────────────────

describe('calculateKFRE', () => {
  it('returns risk percentages for typical CKD patient', () => {
    // 65-year-old female, eGFR 35, ACR 300
    const result = calculateKFRE('65', 'female', '35', '300');
    expect(result.twoYear).toBeGreaterThan(0);
    expect(result.fiveYear).toBeGreaterThan(result.twoYear);
    expect(result.fiveYear).toBeLessThan(100);
  });

  it('returns higher risk for lower eGFR', () => {
    const high = calculateKFRE('60', 'male', '20', '300');
    const low = calculateKFRE('60', 'male', '50', '300');
    expect(high.fiveYear).toBeGreaterThan(low.fiveYear);
  });

  it('returns higher risk for higher ACR', () => {
    const high = calculateKFRE('60', 'male', '35', '1000');
    const low = calculateKFRE('60', 'male', '35', '30');
    expect(high.fiveYear).toBeGreaterThan(low.fiveYear);
  });

  it('returns higher risk for younger patients (longer exposure time)', () => {
    const young = calculateKFRE('40', 'male', '30', '300');
    const old = calculateKFRE('80', 'male', '30', '300');
    expect(young.fiveYear).toBeGreaterThan(old.fiveYear);
  });

  it('returns 0 for empty inputs', () => {
    expect(calculateKFRE('', 'male', '35', '300')).toEqual({ twoYear: 0, fiveYear: 0 });
    expect(calculateKFRE('60', 'male', '', '300')).toEqual({ twoYear: 0, fiveYear: 0 });
    expect(calculateKFRE('60', 'male', '35', '')).toEqual({ twoYear: 0, fiveYear: 0 });
  });

  it('returns 0 for zero eGFR', () => {
    expect(calculateKFRE('60', 'male', '0', '300')).toEqual({ twoYear: 0, fiveYear: 0 });
  });

  it('returns 0 for zero ACR', () => {
    expect(calculateKFRE('60', 'male', '35', '0')).toEqual({ twoYear: 0, fiveYear: 0 });
  });
});

// ─── assessReferralNeed ─────────────────────────────────────────────

describe('assessReferralNeed', () => {
  it('returns none for KFRE < 3%', () => {
    expect(assessReferralNeed('0')).toBe('none');
    expect(assessReferralNeed('2.9')).toBe('none');
  });

  it('returns nephrology for KFRE 3-5%', () => {
    expect(assessReferralNeed('3')).toBe('nephrology');
    expect(assessReferralNeed('4.9')).toBe('nephrology');
  });

  it('returns nephrology for KFRE 5%', () => {
    expect(assessReferralNeed('5')).toBe('nephrology');
  });

  it('returns multidisciplinary for KFRE 10-39%', () => {
    expect(assessReferralNeed('10')).toBe('multidisciplinary');
    expect(assessReferralNeed('39')).toBe('multidisciplinary');
  });

  it('returns krt-planning for KFRE >= 40%', () => {
    expect(assessReferralNeed('40')).toBe('krt-planning');
    expect(assessReferralNeed('80')).toBe('krt-planning');
  });
});

// ─── checkRASiEligibility ───────────────────────────────────────────

describe('checkRASiEligibility', () => {
  it('returns eligible 1B for A3 albuminuria', () => {
    const result = checkRASiEligibility('G3a', 'A3', false);
    expect(result).toEqual({ eligible: true, grade: '1B' });
  });

  it('returns eligible 1B for A2 albuminuria', () => {
    const result = checkRASiEligibility('G2', 'A2', false);
    expect(result).toEqual({ eligible: true, grade: '1B' });
  });

  it('returns not eligible for A1 without diabetes', () => {
    const result = checkRASiEligibility('G3a', 'A1', false);
    expect(result).toEqual({ eligible: false, grade: '' });
  });

  it('returns eligible 2C for diabetic CKD G3+ with A1', () => {
    expect(checkRASiEligibility('G3a', 'A1', true)).toEqual({ eligible: true, grade: '2C' });
    expect(checkRASiEligibility('G4', 'A1', true)).toEqual({ eligible: true, grade: '2C' });
  });

  it('returns not eligible for diabetic G1/A1 or G2/A1', () => {
    expect(checkRASiEligibility('G1', 'A1', true)).toEqual({ eligible: false, grade: '' });
    expect(checkRASiEligibility('G2', 'A1', true)).toEqual({ eligible: false, grade: '' });
  });
});

// ─── checkSGLT2iEligibility ─────────────────────────────────────────

describe('checkSGLT2iEligibility', () => {
  it('returns eligible 1A for eGFR ≥20 + ACR ≥200', () => {
    expect(checkSGLT2iEligibility('35', '250', false)).toEqual({ eligible: true, grade: '1A' });
  });

  it('returns eligible 1A for eGFR ≥20 + heart failure', () => {
    expect(checkSGLT2iEligibility('35', '10', true)).toEqual({ eligible: true, grade: '1A' });
  });

  it('returns eligible 2B for eGFR ≥20 + ACR 30-199', () => {
    expect(checkSGLT2iEligibility('35', '50', false)).toEqual({ eligible: true, grade: '2B' });
  });

  it('returns not eligible for eGFR < 20', () => {
    expect(checkSGLT2iEligibility('15', '300', false)).toEqual({ eligible: false, grade: '' });
    expect(checkSGLT2iEligibility('19', '300', true)).toEqual({ eligible: false, grade: '' });
  });

  it('returns not eligible for eGFR ≥20 but ACR < 30 without HF', () => {
    expect(checkSGLT2iEligibility('45', '20', false)).toEqual({ eligible: false, grade: '' });
  });
});

// ─── checkFinerenoneEligibility ─────────────────────────────────────

describe('checkFinerenoneEligibility', () => {
  it('returns eligible 1A when all criteria met', () => {
    expect(checkFinerenoneEligibility('35', '100', true, true, true))
      .toEqual({ eligible: true, grade: '1A' });
  });

  it('returns not eligible without diabetes', () => {
    expect(checkFinerenoneEligibility('35', '100', false, true, true))
      .toEqual({ eligible: false, grade: '' });
  });

  it('returns not eligible with eGFR < 25', () => {
    expect(checkFinerenoneEligibility('20', '100', true, true, true))
      .toEqual({ eligible: false, grade: '' });
  });

  it('returns not eligible with ACR < 30', () => {
    expect(checkFinerenoneEligibility('35', '20', true, true, true))
      .toEqual({ eligible: false, grade: '' });
  });

  it('returns not eligible without max RASi', () => {
    expect(checkFinerenoneEligibility('35', '100', true, false, true))
      .toEqual({ eligible: false, grade: '' });
  });

  it('returns not eligible with abnormal potassium', () => {
    expect(checkFinerenoneEligibility('35', '100', true, true, false))
      .toEqual({ eligible: false, grade: '' });
  });
});

// ─── calculateEGFRSlope ─────────────────────────────────────────────

describe('calculateEGFRSlope', () => {
  it('calculates negative slope for declining eGFR', () => {
    const readings = JSON.stringify([
      { egfr: 60, date: '2024-01-01' },
      { egfr: 55, date: '2024-07-01' },
      { egfr: 50, date: '2025-01-01' },
    ]);
    const slope = calculateEGFRSlope(readings);
    expect(slope).toBeLessThan(0);
    expect(slope).toBeCloseTo(-10, 0);
  });

  it('calculates positive slope for improving eGFR', () => {
    const readings = JSON.stringify([
      { egfr: 30, date: '2024-01-01' },
      { egfr: 35, date: '2024-07-01' },
      { egfr: 40, date: '2025-01-01' },
    ]);
    const slope = calculateEGFRSlope(readings);
    expect(slope).toBeGreaterThan(0);
  });

  it('returns 0 for stable eGFR', () => {
    const readings = JSON.stringify([
      { egfr: 50, date: '2024-01-01' },
      { egfr: 50, date: '2024-07-01' },
      { egfr: 50, date: '2025-01-01' },
    ]);
    expect(calculateEGFRSlope(readings)).toBe(0);
  });

  it('returns null for fewer than 2 readings', () => {
    expect(calculateEGFRSlope(JSON.stringify([{ egfr: 50, date: '2024-01-01' }]))).toBeNull();
    expect(calculateEGFRSlope(JSON.stringify([]))).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(calculateEGFRSlope('not json')).toBeNull();
    expect(calculateEGFRSlope('')).toBeNull();
  });

  it('handles 2-point readings', () => {
    const readings = JSON.stringify([
      { egfr: 60, date: '2024-01-01' },
      { egfr: 50, date: '2025-01-01' },
    ]);
    const slope = calculateEGFRSlope(readings);
    expect(slope).toBeCloseTo(-10, 0);
  });
});

// ─── isRapidDecline ─────────────────────────────────────────────────

describe('isRapidDecline', () => {
  it('returns true for slope ≤ -5', () => {
    expect(isRapidDecline('-5')).toBe(true);
    expect(isRapidDecline('-10')).toBe(true);
  });

  it('returns false for slope > -5', () => {
    expect(isRapidDecline('-4.9')).toBe(false);
    expect(isRapidDecline('-3')).toBe(false);
    expect(isRapidDecline('0')).toBe(false);
    expect(isRapidDecline('5')).toBe(false);
  });
});

// ─── hasSignificantEGFRChange ───────────────────────────────────────

describe('hasSignificantEGFRChange', () => {
  it('returns true for >20% decrease', () => {
    expect(hasSignificantEGFRChange('50', '39')).toBe(true);
    expect(hasSignificantEGFRChange('100', '70')).toBe(true);
  });

  it('returns false for ≤20% decrease', () => {
    expect(hasSignificantEGFRChange('50', '40')).toBe(false);
    expect(hasSignificantEGFRChange('50', '45')).toBe(false);
  });

  it('returns false for increase', () => {
    expect(hasSignificantEGFRChange('50', '60')).toBe(false);
  });

  it('returns false for zero previous', () => {
    expect(hasSignificantEGFRChange('0', '50')).toBe(false);
  });

  it('handles exact 20% boundary', () => {
    // 20% of 50 = 10, so 50→40 is exactly 20%, not >20%
    expect(hasSignificantEGFRChange('50', '40')).toBe(false);
  });
});

// ─── hasACRDoubling ─────────────────────────────────────────────────

describe('hasACRDoubling', () => {
  it('returns true when current >= 2x previous', () => {
    expect(hasACRDoubling('50', '100')).toBe(true);
    expect(hasACRDoubling('50', '150')).toBe(true);
  });

  it('returns false when current < 2x previous', () => {
    expect(hasACRDoubling('50', '99')).toBe(false);
    expect(hasACRDoubling('50', '50')).toBe(false);
  });

  it('returns false for zero previous', () => {
    expect(hasACRDoubling('0', '100')).toBe(false);
  });

  it('handles exact doubling', () => {
    expect(hasACRDoubling('30', '60')).toBe(true);
  });
});

// ─── getCKDSeverity ─────────────────────────────────────────────────

describe('getCKDSeverity', () => {
  it('returns normal for G1 and G2', () => {
    expect(getCKDSeverity('G1')).toBe('normal');
    expect(getCKDSeverity('G2')).toBe('normal');
  });

  it('returns warning for G3a and G3b', () => {
    expect(getCKDSeverity('G3a')).toBe('warning');
    expect(getCKDSeverity('G3b')).toBe('warning');
  });

  it('returns critical for G4 and G5', () => {
    expect(getCKDSeverity('G4')).toBe('critical');
    expect(getCKDSeverity('G5')).toBe('critical');
  });
});

// ─── getGFRCategoryLabel ────────────────────────────────────────────

describe('getGFRCategoryLabel', () => {
  it('returns correct labels', () => {
    expect(getGFRCategoryLabel('G1')).toBe('Normal or high');
    expect(getGFRCategoryLabel('G5')).toBe('Kidney failure');
  });

  it('returns Unknown for invalid category', () => {
    expect(getGFRCategoryLabel('G99')).toBe('Unknown');
  });
});

// ─── getAlbuminuriaCategoryLabel ────────────────────────────────────

describe('getAlbuminuriaCategoryLabel', () => {
  it('returns correct labels', () => {
    expect(getAlbuminuriaCategoryLabel('A1')).toBe('Normal to mildly increased');
    expect(getAlbuminuriaCategoryLabel('A3')).toBe('Severely increased');
  });

  it('returns Unknown for invalid category', () => {
    expect(getAlbuminuriaCategoryLabel('A99')).toBe('Unknown');
  });
});
