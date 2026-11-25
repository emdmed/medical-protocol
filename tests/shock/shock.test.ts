import { describe, it, expect } from 'vitest';
import { binJvp, classifyShock, type ShockExam } from '../../plugin/lib/shock';

const inCohort: ShockExam = { systolic: '82', durationMinutes: '45' };

describe('classifyShock', () => {
  it('warm skin + low JVP → septic', () => {
    expect(classifyShock({ ...inCohort, skin: 'warm', jvp: 'normal_or_low' })).toMatchObject({ category: 'septic', reason: null });
  });

  it('cool skin + elevated JVP → cardiogenic', () => {
    expect(classifyShock({ ...inCohort, skin: 'cool', jvp: 'elevated' })?.category).toBe('cardiogenic');
  });

  it('cool skin + low JVP → hypovolemic', () => {
    expect(classifyShock({ ...inCohort, skin: 'cool', jvp: 'normal_or_low' })?.category).toBe('hypovolemic');
  });

  it('warm skin + elevated JVP → indeterminate, discordant', () => {
    expect(classifyShock({ ...inCohort, skin: 'warm', jvp: 'elevated' })).toMatchObject({ category: 'indeterminate', reason: 'discordant_primary_findings' });
  });

  it('declines when a primary finding was not assessed or left out', () => {
    expect(classifyShock({ ...inCohort, skin: 'cool', jvp: 'not_assessed' })?.reason).toBe('primary_finding_not_assessed');
    expect(classifyShock({ ...inCohort, jvp: 'elevated' })?.reason).toBe('primary_finding_not_assessed');
  });

  it('declines outside the studied cohort: systolic 90 is not below 90', () => {
    const exam = { skin: 'cool', jvp: 'elevated' } as const;
    expect(classifyShock({ ...exam, systolic: '90', durationMinutes: '45' })?.reason).toBe('outside_studied_cohort');
    expect(classifyShock({ ...exam, systolic: '89', durationMinutes: '45' })?.category).toBe('cardiogenic');
  });

  it('declines under 30 minutes or with no duration; 30 is enough', () => {
    const exam = { systolic: '80', skin: 'cool', jvp: 'elevated' } as const;
    expect(classifyShock({ ...exam, durationMinutes: '29' })?.reason).toBe('outside_studied_cohort');
    expect(classifyShock({ ...exam })?.reason).toBe('outside_studied_cohort');
    expect(classifyShock({ ...exam, durationMinutes: '30' })?.category).toBe('cardiogenic');
  });

  it('bins a measured JVP strictly above 7 cmH2O', () => {
    expect(classifyShock({ ...inCohort, skin: 'cool', jvpCmH2O: '7' })).toMatchObject({ category: 'hypovolemic', jvp: 'normal_or_low' });
    expect(classifyShock({ ...inCohort, skin: 'cool', jvpCmH2O: '7.5' })).toMatchObject({ category: 'cardiogenic', jvp: 'elevated' });
  });

  it('an impression wins over a measured height', () => {
    expect(binJvp('normal_or_low', 12)).toBe('normal_or_low');
    expect(binJvp('not_assessed', null)).toBe('not_assessed');
  });

  it('secondary findings are reported and never change the category', () => {
    const result = classifyShock({ ...inCohort, skin: 'cool', jvp: 'normal_or_low', lungExam: 'bilateral_crackles', capillaryRefill: 'delayed', pulseVolume: 'thready' });
    expect(result).toMatchObject({ category: 'hypovolemic', supporting: [], discordant: ['lungExam'] });
    expect(classifyShock({ ...inCohort, skin: 'warm', jvp: 'normal_or_low', capillaryRefill: 'brisk', pulseVolume: 'bounding', lungExam: 'unilateral_crackles' }))
      .toMatchObject({ supporting: ['capillaryRefill', 'pulseVolume'], discordant: [] });
  });

  it('returns null for unusable numbers', () => {
    expect(classifyShock({ systolic: '' })).toBeNull();
    expect(classifyShock({ systolic: 'abc' })).toBeNull();
    expect(classifyShock({ systolic: '0' })).toBeNull();
    expect(classifyShock({ ...inCohort, jvpCmH2O: 'high' })).toBeNull();
    expect(classifyShock({ systolic: '80', durationMinutes: '-5' })).toBeNull();
  });
});
