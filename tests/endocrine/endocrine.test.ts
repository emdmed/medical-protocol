import { describe, it, expect } from 'vitest';
import {
  classifyT1DStage,
  classifyT1vsT2,
  getT2DScreeningRecommendation,
  classifyGDM_OneStep,
  classifyGDM_TwoStep,
} from '../../lib/endocrine';

// ─── T1D Staging (ADA Table 2.4) ────────────────────────────────────

describe('classifyT1DStage', () => {
  it('returns stage 0 for < 2 autoantibodies', () => {
    const result = classifyT1DStage('1', '90', '130', '5.0', false);
    expect(result.stage).toBe(0);
    expect(result.label).toBe('Insufficient autoantibodies');
  });

  it('returns stage 1 for ≥2 autoantibodies + normoglycemia', () => {
    const result = classifyT1DStage('2', '90', '130', '5.0', false);
    expect(result.stage).toBe(1);
    expect(result.severity).toBe('normal');
  });

  it('returns stage 2 for ≥2 autoantibodies + dysglycemia (IFG)', () => {
    const result = classifyT1DStage('3', '110', '', '', false);
    expect(result.stage).toBe(2);
    expect(result.severity).toBe('warning');
  });

  it('returns stage 2 for ≥2 autoantibodies + dysglycemia (A1C 5.7–6.4)', () => {
    const result = classifyT1DStage('2', '', '', '5.8', false);
    expect(result.stage).toBe(2);
  });

  it('returns stage 2 for ≥2 autoantibodies + dysglycemia (IGT)', () => {
    const result = classifyT1DStage('2', '', '160', '', false);
    expect(result.stage).toBe(2);
  });

  it('returns stage 3 for ≥2 autoantibodies + overt diabetes (A1C ≥6.5)', () => {
    const result = classifyT1DStage('2', '', '', '7.0', false);
    expect(result.stage).toBe(3);
    expect(result.severity).toBe('critical');
  });

  it('returns stage 3 for ≥2 autoantibodies + FPG ≥126', () => {
    const result = classifyT1DStage('2', '130', '', '', false);
    expect(result.stage).toBe(3);
  });

  it('returns stage 3 for ≥2 autoantibodies + 2h-PG ≥200', () => {
    const result = classifyT1DStage('2', '', '210', '', false);
    expect(result.stage).toBe(3);
  });

  it('returns stage 3 for ≥2 autoantibodies + symptoms', () => {
    const result = classifyT1DStage('2', '90', '130', '5.0', true);
    expect(result.stage).toBe(3);
  });

  // Boundary tests
  it('boundary: FPG exactly 100 → stage 2', () => {
    expect(classifyT1DStage('2', '100', '', '', false).stage).toBe(2);
  });

  it('boundary: FPG exactly 126 → stage 3', () => {
    expect(classifyT1DStage('2', '126', '', '', false).stage).toBe(3);
  });

  it('boundary: A1C exactly 5.7 → stage 2', () => {
    expect(classifyT1DStage('2', '', '', '5.7', false).stage).toBe(2);
  });

  it('boundary: A1C exactly 6.5 → stage 3', () => {
    expect(classifyT1DStage('2', '', '', '6.5', false).stage).toBe(3);
  });
});

// ─── T1 vs T2 Classification (ADA Figure 2.1) ──────────────────────

describe('classifyT1vsT2', () => {
  it('classifies Type 1 with autoantibodies + young + low BMI', () => {
    const result = classifyT1vsT2('25', '22', true, '150', true, false, true, false, true);
    expect(result.classification).toBe('Type 1');
    expect(result.features.t1.length).toBeGreaterThan(0);
  });

  it('classifies Type 2 with no autoantibodies + older + obese', () => {
    const result = classifyT1vsT2('55', '32', false, '700', false, true, false, false, false);
    expect(result.classification).toBe('Type 2');
    expect(result.features.t2.length).toBeGreaterThan(0);
  });

  it('classifies Type 1 when C-peptide < 200', () => {
    const result = classifyT1vsT2('45', '28', false, '150', false, true, false, false, false);
    expect(result.classification).toBe('Type 1');
  });

  it('classifies Type 2 when C-peptide > 600 and no autoantibodies', () => {
    const result = classifyT1vsT2('55', '32', false, '700', false, true, false, false, false);
    expect(result.classification).toBe('Type 2');
  });

  it('classifies Type 1 when C-peptide < 200 overrides feature scoring', () => {
    // C-peptide < 200 triggers T1D classification regardless of other features
    const result = classifyT1vsT2('25', '22', true, '150', true, false, false, false, false);
    expect(result.classification).toBe('Type 1');
  });

  it('classifies Indeterminate when features are balanced and no C-peptide', () => {
    // age 35 = no age feature, BMI 27 = no BMI feature, no autoantibodies → T2 gets "Autoantibody−"
    // With 1 T2 feature vs 0 T1, algorithm favors T2 when !hasAutoantibodies
    // To get Indeterminate: need equal features with autoantibodies but no cpClassification
    const result = classifyT1vsT2('35', '27', true, '0', false, true, false, false, false);
    // t1: Autoantibody+, t2: Family Hx T2D — balanced at 1:1
    // hasAutoantibodies but t1 !> t2 → Indeterminate
    expect(result.classification).toBe('Indeterminate');
  });

  it('includes AABBCC features', () => {
    const result = classifyT1vsT2('25', '22', true, '0', true, false, true, true, false);
    expect(result.features.t1).toContain('Young onset');
    expect(result.features.t1).toContain('Autoantibody+');
    expect(result.features.t1).toContain('Normal BMI');
    expect(result.features.t1).toContain('Family Hx T1D');
    expect(result.features.t1).toContain('DKA history');
    expect(result.features.t1).toContain('Other autoimmune');
  });

  it('includes T2 features', () => {
    const result = classifyT1vsT2('55', '32', false, '0', false, true, false, false, false);
    expect(result.features.t2).toContain('Older onset');
    expect(result.features.t2).toContain('Autoantibody−');
    expect(result.features.t2).toContain('Obese');
    expect(result.features.t2).toContain('Family Hx T2D');
  });
});

// ─── T2D Screening (ADA Table 2.5) ─────────────────────────────────

describe('getT2DScreeningRecommendation', () => {
  it('screens now for BMI ≥25 + risk factors', () => {
    const result = getT2DScreeningRecommendation('40', '28', 'Caucasian', { hypertension: true });
    expect(result.action).toBe('Screen now');
    expect(result.severity).toBe('critical');
    expect(result.riskFactorCount).toBe(1);
  });

  it('considers screening for BMI ≥25 without risk factors', () => {
    const result = getT2DScreeningRecommendation('30', '26', 'Caucasian', {});
    expect(result.action).toBe('Consider screening');
    expect(result.severity).toBe('warning');
  });

  it('uses lower BMI threshold (23) for Asian ancestry', () => {
    const result = getT2DScreeningRecommendation('30', '24', 'Asian', { hypertension: true });
    expect(result.action).toBe('Screen now');
  });

  it('does not screen Asian patient at BMI 22', () => {
    const result = getT2DScreeningRecommendation('30', '22', 'Asian', { hypertension: true });
    expect(result.action).not.toBe('Screen now');
  });

  it('screens at age ≥35 regardless of BMI', () => {
    const result = getT2DScreeningRecommendation('36', '22', 'Caucasian', {});
    expect(result.action).toBe('Screen at 35+');
    expect(result.severity).toBe('warning');
  });

  it('no screening for young, normal BMI, no risk factors', () => {
    const result = getT2DScreeningRecommendation('25', '22', 'Caucasian', {});
    expect(result.action).toBe('No screening indicated');
    expect(result.severity).toBe('normal');
  });

  it('counts multiple risk factors', () => {
    const result = getT2DScreeningRecommendation('40', '28', 'Caucasian', {
      hypertension: true,
      cvdHistory: true,
      pcos: false,
    });
    expect(result.riskFactorCount).toBe(2);
  });
});

// ─── GDM One-Step (IADPSG) ──────────────────────────────────────────

describe('classifyGDM_OneStep', () => {
  it('returns positive for fasting ≥92', () => {
    const result = classifyGDM_OneStep('92', '150', '140');
    expect(result.positive).toBe(true);
    expect(result.exceededValues).toContain('Fasting ≥92');
  });

  it('returns positive for 1-hr ≥180', () => {
    const result = classifyGDM_OneStep('85', '180', '140');
    expect(result.positive).toBe(true);
  });

  it('returns positive for 2-hr ≥153', () => {
    const result = classifyGDM_OneStep('85', '150', '153');
    expect(result.positive).toBe(true);
  });

  it('returns negative when all normal', () => {
    const result = classifyGDM_OneStep('85', '150', '140');
    expect(result.positive).toBe(false);
    expect(result.exceededCount).toBe(0);
  });

  it('counts multiple exceeded values', () => {
    const result = classifyGDM_OneStep('95', '185', '160');
    expect(result.exceededCount).toBe(3);
  });

  // Boundary tests
  it('boundary: fasting 91 → negative', () => {
    expect(classifyGDM_OneStep('91', '0', '0').positive).toBe(false);
  });

  it('boundary: fasting 92 → positive', () => {
    expect(classifyGDM_OneStep('92', '0', '0').positive).toBe(true);
  });
});

// ─── GDM Two-Step (Carpenter-Coustan) ───────────────────────────────

describe('classifyGDM_TwoStep', () => {
  it('returns positive for ≥2 exceeded values', () => {
    const result = classifyGDM_TwoStep('95', '180', '140', '130');
    expect(result.positive).toBe(true);
    expect(result.exceededCount).toBe(2);
  });

  it('returns negative for only 1 exceeded value', () => {
    const result = classifyGDM_TwoStep('95', '170', '140', '130');
    expect(result.positive).toBe(false);
    expect(result.exceededCount).toBe(1);
  });

  it('returns negative when all normal', () => {
    const result = classifyGDM_TwoStep('90', '170', '140', '130');
    expect(result.positive).toBe(false);
    expect(result.exceededCount).toBe(0);
  });

  it('returns positive for all 4 exceeded', () => {
    const result = classifyGDM_TwoStep('100', '185', '160', '145');
    expect(result.positive).toBe(true);
    expect(result.exceededCount).toBe(4);
  });

  it('uses Carpenter-Coustan thresholds', () => {
    const result = classifyGDM_TwoStep('95', '180', '155', '140');
    expect(result.exceededValues).toContain('Fasting ≥95');
    expect(result.exceededValues).toContain('1-hr ≥180');
    expect(result.exceededValues).toContain('2-hr ≥155');
    expect(result.exceededValues).toContain('3-hr ≥140');
  });

  // Boundary tests
  it('boundary: fasting 94 → not exceeded', () => {
    const result = classifyGDM_TwoStep('94', '179', '154', '139');
    expect(result.exceededCount).toBe(0);
  });

  it('boundary: all at exact threshold → all exceeded', () => {
    const result = classifyGDM_TwoStep('95', '180', '155', '140');
    expect(result.exceededCount).toBe(4);
  });
});
