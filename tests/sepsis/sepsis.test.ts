import { describe, it, expect } from 'vitest';
import {
  calculateRespirationSOFA,
  calculateCoagulationSOFA,
  calculateLiverSOFA,
  calculateCardiovascularSOFA,
  calculateCNSSOFA,
  calculateRenalSOFA,
  calculateTotalSOFA,
  calculateSOFADelta,
  calculateQSOFA,
  isQSOFAPositive,
  assessSepsis,
  assessSepticShock,
  assessBundleCompliance,
  calculateLactateClearance,
  isLactateClearanceAdequate,
  getSOFASeverityLevel,
  getSOFASeverity,
  hasVasopressors,
} from '../../plugin/lib/sepsis';

// ─── Respiration SOFA ───────────────────────────────────────────────

describe('calculateRespirationSOFA (SOFA-2)', () => {
  it('PaO2:FiO2 >300 → 0, ≤300 → 1, ≤225 → 2', () => {
    expect(calculateRespirationSOFA('70', '21', false)).toBe(0);   // 333
    expect(calculateRespirationSOFA('63', '21', false)).toBe(1);   // 300
    expect(calculateRespirationSOFA('90', '40', false)).toBe(2);   // 225
  });

  it('without advanced support the maximum is 2', () => {
    expect(calculateRespirationSOFA('50', '80', false)).toBe(2);   // 62.5
  });

  it('≤150 with advanced support → 3, ≤75 → 4', () => {
    expect(calculateRespirationSOFA('60', '40', true)).toBe(3);    // 150
    expect(calculateRespirationSOFA('60', '80', true)).toBe(4);    // 75
  });

  it('ECMO → 4 regardless of ratio', () => {
    expect(calculateRespirationSOFA('200', '30', true, true)).toBe(4);
  });

  it('ceiling of treatment lifts the cap without support', () => {
    expect(calculateRespirationSOFA('50', '80', false, false, '', true)).toBe(4);
  });

  it('SpO2:FiO2 only when PaO2 missing and SpO2 <98', () => {
    expect(calculateRespirationSOFA('', '40', true, false, '96')).toBe(2);  // 240 ≤250
    expect(calculateRespirationSOFA('', '50', true, false, '95')).toBe(3);  // 190 ≤200
    expect(calculateRespirationSOFA('', '80', true, false, '92')).toBe(4);  // 115 ≤120
    expect(calculateRespirationSOFA('', '50', true, false, '98')).toBe(0);  // SpO2 ≥98 not used
  });

  it('invalid FiO2 or missing values → 0', () => {
    expect(calculateRespirationSOFA('80', '10', true)).toBe(0);
    expect(calculateRespirationSOFA('', '40', true)).toBe(0);
  });
});

describe('calculateCoagulationSOFA (SOFA-2)', () => {
  it.each([['200', 0], ['150', 1], ['100', 2], ['81', 2], ['80', 3], ['51', 3], ['50', 4], ['10', 4]])(
    'platelets %s → %i', (p, score) => expect(calculateCoagulationSOFA(p)).toBe(score),
  );
  it('missing → 0', () => expect(calculateCoagulationSOFA('')).toBe(0));
});

describe('calculateLiverSOFA (SOFA-2)', () => {
  it.each([['1.2', 0], ['1.3', 1], ['3.0', 1], ['3.1', 2], ['6.0', 2], ['6.1', 3], ['12.0', 3], ['12.1', 4]])(
    'bilirubin %s → %i', (b, score) => expect(calculateLiverSOFA(b)).toBe(score),
  );
  it('missing → 0', () => expect(calculateLiverSOFA('')).toBe(0));
});

describe('calculateCardiovascularSOFA (SOFA-2)', () => {
  it('no vasoactives: MAP ≥70 → 0, <70 → 1', () => {
    expect(calculateCardiovascularSOFA('75', '', '', '', '')).toBe(0);
    expect(calculateCardiovascularSOFA('65', '', '', '', '')).toBe(1);
  });

  it('NE+E sum ≤0.2 → 2, >0.2–0.4 → 3, >0.4 → 4', () => {
    expect(calculateCardiovascularSOFA('65', '', '', '0.1', '0.1')).toBe(2);
    expect(calculateCardiovascularSOFA('65', '', '', '0.1', '0.2')).toBe(3);
    expect(calculateCardiovascularSOFA('65', '', '', '', '0.4')).toBe(3);
    expect(calculateCardiovascularSOFA('65', '', '', '0.2', '0.3')).toBe(4);
  });

  it('other vasopressor or inotrope alone → 2', () => {
    expect(calculateCardiovascularSOFA('65', '', '5', '', '')).toBe(2);
    expect(calculateCardiovascularSOFA('65', '', '', '', '', true)).toBe(2);
  });

  it('low-dose NE+E plus another agent → 3, medium-dose plus another → 4', () => {
    expect(calculateCardiovascularSOFA('65', '', '', '', '0.15', true)).toBe(3);
    expect(calculateCardiovascularSOFA('65', '', '5', '', '0.3')).toBe(4);
  });

  it('mechanical circulatory support → 4', () => {
    expect(calculateCardiovascularSOFA('70', '', '', '', '', false, true)).toBe(4);
  });

  it('dopamine as the only vasopressor: ≤20 → 2, >20–40 → 3, >40 → 4', () => {
    expect(calculateCardiovascularSOFA('65', '20', '', '', '')).toBe(2);
    expect(calculateCardiovascularSOFA('65', '30', '', '', '')).toBe(3);
    expect(calculateCardiovascularSOFA('65', '45', '', '', '')).toBe(4);
  });

  it('MAP-only scoring with a ceiling of treatment', () => {
    expect(calculateCardiovascularSOFA('65', '', '', '', '', false, false, true)).toBe(1);
    expect(calculateCardiovascularSOFA('55', '', '', '', '', false, false, true)).toBe(2);
    expect(calculateCardiovascularSOFA('45', '', '', '', '', false, false, true)).toBe(3);
    expect(calculateCardiovascularSOFA('35', '', '', '', '', false, false, true)).toBe(4);
    // without the ceiling flag MAP alone never exceeds 1
    expect(calculateCardiovascularSOFA('35', '', '', '', '')).toBe(1);
  });

  it('missing MAP and no drugs → 0', () => {
    expect(calculateCardiovascularSOFA('', '', '', '', '')).toBe(0);
  });
});

describe('calculateCNSSOFA (SOFA-2)', () => {
  it.each([['15', 0], ['13', 1], ['12', 2], ['9', 2], ['8', 3], ['6', 3], ['5', 4], ['3', 4]])(
    'GCS %s → %i', (g, score) => expect(calculateCNSSOFA(g)).toBe(score),
  );
  it('drugs for delirium score at least 1', () => {
    expect(calculateCNSSOFA('15', true)).toBe(1);
    expect(calculateCNSSOFA('8', true)).toBe(3);
  });
  it('missing → 0', () => expect(calculateCNSSOFA('')).toBe(0));
});

describe('calculateRenalSOFA (SOFA-2)', () => {
  it.each([['1.2', 0], ['1.3', 1], ['2.0', 1], ['2.1', 2], ['3.5', 2], ['3.6', 3], ['6.0', 3]])(
    'creatinine %s → %i', (cr, score) => expect(calculateRenalSOFA(cr, '', '70', '24')).toBe(score),
  );

  it('urine <0.5 mL/kg/h for 6–12 h → 1, ≥12 h → 2', () => {
    // 70 kg × 0.4 mL/kg/h
    expect(calculateRenalSOFA('0.8', String(0.4 * 70 * 6), '70', '6')).toBe(1);
    expect(calculateRenalSOFA('0.8', String(0.4 * 70 * 12), '70', '12')).toBe(2);
    // under 6 h does not count
    expect(calculateRenalSOFA('0.8', String(0.4 * 70 * 4), '70', '4')).toBe(0);
  });

  it('urine <0.3 mL/kg/h for ≥24 h or anuria ≥12 h → 3', () => {
    expect(calculateRenalSOFA('0.8', String(0.2 * 70 * 24), '70', '24')).toBe(3);
    expect(calculateRenalSOFA('0.8', '0', '70', '12')).toBe(3);
  });

  it('urine criteria need weight', () => {
    expect(calculateRenalSOFA('0.8', '0', '', '12')).toBe(0);
  });

  it('receiving RRT → 4', () => {
    expect(calculateRenalSOFA('0.8', '', '70', '24', true)).toBe(4);
  });

  it('meeting RRT criteria → 4', () => {
    // creatinine >1.2 + K ≥6.0
    expect(calculateRenalSOFA('1.8', '', '70', '24', false, '6.0')).toBe(4);
    // oliguria <0.3 for >6 h + pH ≤7.20 with HCO3 ≤12
    expect(calculateRenalSOFA('1.0', String(0.2 * 70 * 8), '70', '8', false, '', '7.15', '11')).toBe(4);
    // acidosis without bicarbonate ≤12 does not qualify
    expect(calculateRenalSOFA('1.8', '', '70', '24', false, '', '7.15', '16')).toBe(1);
    // high K without kidney injury does not qualify
    expect(calculateRenalSOFA('1.0', '', '70', '24', false, '6.5')).toBe(0);
  });
});

describe('calculateTotalSOFA (SOFA-2)', () => {
  const normal = {
    paO2: '100', fiO2: '21', advancedRespiratorySupport: false,
    platelets: '200', bilirubin: '0.5',
    map: '80', dopamine: '', dobutamine: '', epinephrine: '', norepinephrine: '',
    gcs: '15', creatinine: '0.8', urineOutput: '',
  };

  it('returns 0 for all-normal values', () => {
    expect(calculateTotalSOFA(normal, '70', '1')).toBe(0);
  });

  it('returns 24 for worst-case values', () => {
    const reading = {
      ...normal,
      paO2: '50', fiO2: '80', advancedRespiratorySupport: true, // 62.5 → 4
      platelets: '10', bilirubin: '15',                         // 4, 4
      map: '50', norepinephrine: '0.5',                         // 4
      gcs: '3', onRRT: true,                                    // 4, 4
    };
    expect(calculateTotalSOFA(reading, '70', '24')).toBe(24);
  });

  it('sums individual organ scores correctly', () => {
    const reading = {
      ...normal,
      paO2: '60', fiO2: '21',   // 286 → 1
      platelets: '120',         // 1
      bilirubin: '2.0',         // 1
      map: '65',                // 1
      gcs: '14',                // 1
      creatinine: '1.5',        // 1
    };
    expect(calculateTotalSOFA(reading, '70', '24')).toBe(6);
  });

  it('passes the optional SOFA-2 fields through', () => {
    expect(calculateTotalSOFA({ ...normal, deliriumDrugs: true, otherVasopressor: true }, '70', '24')).toBe(3);
  });
});

// ─── SOFA Delta ─────────────────────────────────────────────────────

describe('calculateSOFADelta', () => {
  it('calculates positive delta', () => {
    expect(calculateSOFADelta(8, '2')).toBe(6);
  });

  it('calculates negative delta', () => {
    expect(calculateSOFADelta(2, '5')).toBe(-3);
  });

  it('calculates zero delta', () => {
    expect(calculateSOFADelta(3, '3')).toBe(0);
  });

  it('handles empty baseline as 0', () => {
    expect(calculateSOFADelta(5, '')).toBe(5);
  });
});

// ─── qSOFA ──────────────────────────────────────────────────────────

describe('calculateQSOFA', () => {
  it('returns 0 when no criteria met', () => {
    expect(calculateQSOFA('16', '120', '15')).toBe(0);
  });

  it('returns 1 for RR >= 22 only', () => {
    expect(calculateQSOFA('24', '120', '15')).toBe(1);
  });

  it('returns 1 for SBP <= 100 only', () => {
    expect(calculateQSOFA('16', '95', '15')).toBe(1);
  });

  it('returns 1 for GCS < 15 only', () => {
    expect(calculateQSOFA('16', '120', '14')).toBe(1);
  });

  it('returns 2 for RR + SBP', () => {
    expect(calculateQSOFA('22', '100', '15')).toBe(2);
  });

  it('returns 2 for RR + GCS', () => {
    expect(calculateQSOFA('22', '120', '13')).toBe(2);
  });

  it('returns 2 for SBP + GCS', () => {
    expect(calculateQSOFA('16', '90', '14')).toBe(2);
  });

  it('returns 3 for all criteria met', () => {
    expect(calculateQSOFA('25', '85', '12')).toBe(3);
  });

  it('boundary: RR exactly 22', () => {
    expect(calculateQSOFA('22', '120', '15')).toBe(1);
  });

  it('boundary: SBP exactly 100', () => {
    expect(calculateQSOFA('16', '100', '15')).toBe(1);
  });

  it('returns 0 for empty inputs', () => {
    expect(calculateQSOFA('', '', '')).toBe(0);
  });
});

describe('isQSOFAPositive', () => {
  it('returns true for score >= 2', () => {
    expect(isQSOFAPositive(2)).toBe(true);
    expect(isQSOFAPositive(3)).toBe(true);
  });

  it('returns false for score < 2', () => {
    expect(isQSOFAPositive(0)).toBe(false);
    expect(isQSOFAPositive(1)).toBe(false);
  });
});

// ─── Sepsis-3 Assessment ────────────────────────────────────────────

describe('assessSepsis', () => {
  it('uses the rise from baseline, not the absolute score', () => {
    // chronic baseline 2, current 3 → delta 1 → not sepsis
    expect(assessSepsis(3, 1, true)).toBe(false);
    // unknown baseline: delta equals score
    expect(assessSepsis(2, 2, true)).toBe(true);
  });

  it('returns true for infection + delta >= 2', () => {
    expect(assessSepsis(1, 2, true)).toBe(true);
    expect(assessSepsis(0, 3, true)).toBe(true);
  });

  it('returns false without infection', () => {
    expect(assessSepsis(5, 3, false)).toBe(false);
  });

  it('returns false for infection + SOFA < 2 and delta < 2', () => {
    expect(assessSepsis(1, 1, true)).toBe(false);
    expect(assessSepsis(0, 0, true)).toBe(false);
  });
});

// ─── Septic Shock ───────────────────────────────────────────────────

describe('assessSepticShock', () => {
  it('returns true for sepsis + vasopressors + lactate > 2', () => {
    expect(assessSepticShock(true, true, '2.5')).toBe(true);
    expect(assessSepticShock(true, true, '4.0')).toBe(true);
  });

  it('returns false without sepsis', () => {
    expect(assessSepticShock(false, true, '4.0')).toBe(false);
  });

  it('returns false without vasopressors', () => {
    expect(assessSepticShock(true, false, '4.0')).toBe(false);
  });

  it('returns false for lactate <= 2', () => {
    expect(assessSepticShock(true, true, '2.0')).toBe(false);
    expect(assessSepticShock(true, true, '1.5')).toBe(false);
  });

  it('returns false for empty lactate', () => {
    expect(assessSepticShock(true, true, '')).toBe(false);
  });
});

// ─── Bundle Compliance ──────────────────────────────────────────────

describe('assessBundleCompliance', () => {
  const fullBundle = {
    lactateMeasured: true,
    bloodCulturesObtained: true,
    antibioticsGiven: true,
    fluidBolusGiven: true,
    vasopressorsStarted: true,
    bundleStartTime: 1000,
  };

  it('returns complete when all items done within 60 min', () => {
    // 59 minutes = 3540 seconds
    const result = assessBundleCompliance(fullBundle, 1000 + 3540);
    expect(result.complete).toBe(true);
    expect(result.allItemsDone).toBe(true);
    expect(result.withinTimeLimit).toBe(true);
  });

  it('returns complete at exactly 60 min', () => {
    const result = assessBundleCompliance(fullBundle, 1000 + 3600);
    expect(result.complete).toBe(true);
  });

  it('returns not complete when over 60 min', () => {
    const result = assessBundleCompliance(fullBundle, 1000 + 3601);
    expect(result.complete).toBe(false);
    expect(result.allItemsDone).toBe(true);
    expect(result.withinTimeLimit).toBe(false);
  });

  it('returns not complete when items missing', () => {
    const partial = { ...fullBundle, antibioticsGiven: false };
    const result = assessBundleCompliance(partial, 1000 + 1800);
    expect(result.complete).toBe(false);
    expect(result.allItemsDone).toBe(false);
    expect(result.withinTimeLimit).toBe(true);
  });

  it('returns not complete when no start time', () => {
    const noStart = { ...fullBundle, bundleStartTime: null };
    const result = assessBundleCompliance(noStart, 5000);
    expect(result.complete).toBe(false);
    expect(result.withinTimeLimit).toBe(false);
  });
});
describe('assessBundleCompliance — indicated items only', () => {
  const core = {
    lactateMeasured: true, bloodCulturesObtained: true, antibioticsGiven: true,
    fluidBolusGiven: false, vasopressorsStarted: false, bundleStartTime: 1000,
  };

  it('no fluids or vasopressors needed without hypotension and lactate <4', () => {
    const r = assessBundleCompliance({ ...core, hypotension: false, initialLactate: '2.5', persistentHypotension: false }, 1000 + 1800);
    expect(r.complete).toBe(true);
    expect(r.pending).toEqual([]);
  });

  it('fluids required when lactate ≥4', () => {
    const r = assessBundleCompliance({ ...core, hypotension: false, initialLactate: '4.0', persistentHypotension: false }, 1000 + 1800);
    expect(r.pending).toEqual(['fluids']);
  });

  it('vasopressors required when hypotension persists after fluids', () => {
    const r = assessBundleCompliance({ ...core, fluidBolusGiven: true, hypotension: true, persistentHypotension: true }, 1000 + 1800);
    expect(r.pending).toEqual(['vasopressors']);
  });

  it('missing context keeps every item required', () => {
    expect(assessBundleCompliance(core, 1000 + 1800).pending).toEqual(['fluids', 'vasopressors']);
  });

  it('possible sepsis without shock allows 3 hours', () => {
    const ctx = { ...core, hypotension: false, initialLactate: '1.5', persistentHypotension: false };
    expect(assessBundleCompliance({ ...ctx, possibleSepsisWithoutShock: true }, 1000 + 150 * 60).withinTimeLimit).toBe(true);
    expect(assessBundleCompliance(ctx, 1000 + 150 * 60).withinTimeLimit).toBe(false);
  });
});


// ─── Lactate Clearance ──────────────────────────────────────────────

describe('calculateLactateClearance', () => {
  it('calculates clearance: (4 - 2) / 4 * 100 = 50.0%', () => {
    expect(calculateLactateClearance('4', '2')).toBe('50.0');
  });

  it('calculates clearance: (5 - 4.5) / 5 * 100 = 10.0%', () => {
    expect(calculateLactateClearance('5', '4.5')).toBe('10.0');
  });

  it('calculates negative clearance (lactate increasing)', () => {
    expect(calculateLactateClearance('2', '4')).toBe('-100.0');
  });

  it('returns null for empty initial', () => {
    expect(calculateLactateClearance('', '2')).toBeNull();
  });

  it('returns null for empty repeat', () => {
    expect(calculateLactateClearance('4', '')).toBeNull();
  });

  it('returns null for zero initial', () => {
    expect(calculateLactateClearance('0', '2')).toBeNull();
  });
});

describe('isLactateClearanceAdequate', () => {
  it('returns true for clearance >= 10%', () => {
    expect(isLactateClearanceAdequate('10.0')).toBe(true);
    expect(isLactateClearanceAdequate('50.0')).toBe(true);
  });

  it('returns false for clearance < 10%', () => {
    expect(isLactateClearanceAdequate('9.9')).toBe(false);
    expect(isLactateClearanceAdequate('0.0')).toBe(false);
  });

  it('returns false for negative clearance', () => {
    expect(isLactateClearanceAdequate('-20.0')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isLactateClearanceAdequate(null)).toBe(false);
  });
});

// ─── Severity Utilities ─────────────────────────────────────────────

describe('getSOFASeverityLevel', () => {
  it('returns Low for 0-5', () => {
    expect(getSOFASeverityLevel(0)).toBe('Low');
    expect(getSOFASeverityLevel(5)).toBe('Low');
  });

  it('returns Moderate for 6-10', () => {
    expect(getSOFASeverityLevel(6)).toBe('Moderate');
    expect(getSOFASeverityLevel(10)).toBe('Moderate');
  });

  it('returns High for 11-15', () => {
    expect(getSOFASeverityLevel(11)).toBe('High');
    expect(getSOFASeverityLevel(15)).toBe('High');
  });

  it('returns Very High for 16-24', () => {
    expect(getSOFASeverityLevel(16)).toBe('Very High');
    expect(getSOFASeverityLevel(24)).toBe('Very High');
  });
});

describe('getSOFASeverity', () => {
  it('returns normal for 0-5', () => {
    expect(getSOFASeverity(0)).toBe('normal');
    expect(getSOFASeverity(5)).toBe('normal');
  });

  it('returns warning for 6-10', () => {
    expect(getSOFASeverity(6)).toBe('warning');
    expect(getSOFASeverity(10)).toBe('warning');
  });

  it('returns critical for > 10', () => {
    expect(getSOFASeverity(11)).toBe('critical');
    expect(getSOFASeverity(24)).toBe('critical');
  });
});

describe('hasVasopressors', () => {
  it('returns false for no vasopressors', () => {
    expect(hasVasopressors('', '', '', '')).toBe(false);
    expect(hasVasopressors('0', '0', '0', '0')).toBe(false);
  });

  it('returns true for any vasopressor', () => {
    expect(hasVasopressors('5', '', '', '')).toBe(true);
    expect(hasVasopressors('', '', '0.1', '')).toBe(true);
    expect(hasVasopressors('', '', '', '0.1')).toBe(true);
    expect(hasVasopressors('', '', '', '', true)).toBe(true);
  });

  it('dobutamine is an inotrope, not a vasopressor', () => {
    expect(hasVasopressors('', '5', '', '')).toBe(false);
  });
});

// ─── Edge Cases ─────────────────────────────────────────────────────

describe('edge cases', () => {
  it('negative or non-numeric values count as missing (score 0)', () => {
    expect(calculateCoagulationSOFA('-5')).toBe(0);
    expect(calculateCoagulationSOFA('abc')).toBe(0);
    expect(calculateLiverSOFA('xyz')).toBe(0);
  });

  it('extreme high values', () => {
    expect(calculateCoagulationSOFA('999')).toBe(0);
    expect(calculateLiverSOFA('100')).toBe(4);
    expect(calculateCNSSOFA('15')).toBe(0);
  });
});
