import { describe, it, expect } from 'vitest';
import {
  classifyA1C,
  classifyFPG,
  classify2hPG,
  classifyRandomPG,
  getDiagnosis,
  checkConfirmation,
} from '../../lib/diabetes-dx';

// ─── A1C Classification (ADA Table 2.1 / 2.2) ──────────────────────

describe('classifyA1C', () => {
  it('returns empty for zero/empty', () => {
    expect(classifyA1C('')).toEqual({ label: '—', severity: 'normal' });
    expect(classifyA1C('0')).toEqual({ label: '—', severity: 'normal' });
  });

  it('returns Normal for A1C < 5.7%', () => {
    expect(classifyA1C('5.0')).toEqual({ label: 'Normal', severity: 'normal' });
    expect(classifyA1C('5.6')).toEqual({ label: 'Normal', severity: 'normal' });
  });

  it('returns Prediabetes for A1C 5.7–6.4%', () => {
    expect(classifyA1C('5.7')).toEqual({ label: 'Prediabetes', severity: 'warning' });
    expect(classifyA1C('6.0')).toEqual({ label: 'Prediabetes', severity: 'warning' });
    expect(classifyA1C('6.4')).toEqual({ label: 'Prediabetes', severity: 'warning' });
  });

  it('returns Diabetes for A1C ≥ 6.5%', () => {
    expect(classifyA1C('6.5')).toEqual({ label: 'Diabetes', severity: 'critical' });
    expect(classifyA1C('8.0')).toEqual({ label: 'Diabetes', severity: 'critical' });
  });
});

// ─── FPG Classification ─────────────────────────────────────────────

describe('classifyFPG', () => {
  it('returns empty for zero/empty', () => {
    expect(classifyFPG('')).toEqual({ label: '—', severity: 'normal' });
  });

  it('returns Normal for FPG < 100 mg/dL', () => {
    expect(classifyFPG('90')).toEqual({ label: 'Normal', severity: 'normal' });
    expect(classifyFPG('99')).toEqual({ label: 'Normal', severity: 'normal' });
  });

  it('returns IFG for FPG 100–125 mg/dL', () => {
    expect(classifyFPG('100')).toEqual({ label: 'IFG', severity: 'warning' });
    expect(classifyFPG('125')).toEqual({ label: 'IFG', severity: 'warning' });
  });

  it('returns Diabetes for FPG ≥ 126 mg/dL', () => {
    expect(classifyFPG('126')).toEqual({ label: 'Diabetes', severity: 'critical' });
    expect(classifyFPG('200')).toEqual({ label: 'Diabetes', severity: 'critical' });
  });
});

// ─── 2h-PG Classification ───────────────────────────────────────────

describe('classify2hPG', () => {
  it('returns empty for zero/empty', () => {
    expect(classify2hPG('')).toEqual({ label: '—', severity: 'normal' });
  });

  it('returns Normal for 2h-PG < 140 mg/dL', () => {
    expect(classify2hPG('130')).toEqual({ label: 'Normal', severity: 'normal' });
    expect(classify2hPG('139')).toEqual({ label: 'Normal', severity: 'normal' });
  });

  it('returns IGT for 2h-PG 140–199 mg/dL', () => {
    expect(classify2hPG('140')).toEqual({ label: 'IGT', severity: 'warning' });
    expect(classify2hPG('199')).toEqual({ label: 'IGT', severity: 'warning' });
  });

  it('returns Diabetes for 2h-PG ≥ 200 mg/dL', () => {
    expect(classify2hPG('200')).toEqual({ label: 'Diabetes', severity: 'critical' });
    expect(classify2hPG('300')).toEqual({ label: 'Diabetes', severity: 'critical' });
  });
});

// ─── Random PG Classification ───────────────────────────────────────

describe('classifyRandomPG', () => {
  it('returns empty for zero/empty', () => {
    expect(classifyRandomPG('', false)).toEqual({ label: '—', severity: 'normal' });
  });

  it('returns Diabetes for ≥200 with symptoms', () => {
    expect(classifyRandomPG('200', true)).toEqual({ label: 'Diabetes', severity: 'critical' });
    expect(classifyRandomPG('350', true)).toEqual({ label: 'Diabetes', severity: 'critical' });
  });

  it('returns warning for ≥200 without symptoms', () => {
    expect(classifyRandomPG('200', false)).toEqual({ label: '≥200 (no symptoms)', severity: 'warning' });
  });

  it('returns Normal for < 200', () => {
    expect(classifyRandomPG('180', true)).toEqual({ label: 'Normal', severity: 'normal' });
    expect(classifyRandomPG('180', false)).toEqual({ label: 'Normal', severity: 'normal' });
  });
});

// ─── Composite Diagnosis ────────────────────────────────────────────

describe('getDiagnosis', () => {
  it('returns — when no values provided', () => {
    expect(getDiagnosis('', '', '', '', false)).toEqual({ category: 'normal', label: '—' });
  });

  it('returns Normal when all values are normal', () => {
    expect(getDiagnosis('5.0', '90', '130', '', false)).toEqual({ category: 'normal', label: 'Normal' });
  });

  it('returns Diabetes for A1C ≥ 6.5', () => {
    expect(getDiagnosis('6.5', '', '', '', false).category).toBe('diabetes');
  });

  it('returns Diabetes for FPG ≥ 126', () => {
    expect(getDiagnosis('', '126', '', '', false).category).toBe('diabetes');
  });

  it('returns Diabetes for 2h-PG ≥ 200', () => {
    expect(getDiagnosis('', '', '200', '', false).category).toBe('diabetes');
  });

  it('returns Diabetes for random PG ≥ 200 + symptoms', () => {
    expect(getDiagnosis('', '', '', '200', true).category).toBe('diabetes');
  });

  it('does NOT return Diabetes for random PG ≥ 200 without symptoms', () => {
    expect(getDiagnosis('', '', '', '250', false).category).toBe('normal');
  });

  it('returns Prediabetes for A1C 5.7–6.4', () => {
    expect(getDiagnosis('5.8', '', '', '', false).category).toBe('prediabetes-ifg');
  });

  it('returns Prediabetes (IFG) for FPG 100–125', () => {
    const result = getDiagnosis('', '110', '', '', false);
    expect(result.category).toBe('prediabetes-ifg');
    expect(result.label).toBe('Prediabetes (IFG)');
  });

  it('returns Prediabetes (IGT) for 2h-PG 140–199', () => {
    const result = getDiagnosis('', '', '160', '', false);
    expect(result.category).toBe('prediabetes-igt');
    expect(result.label).toBe('Prediabetes (IGT)');
  });

  it('diabetes takes priority over prediabetes', () => {
    expect(getDiagnosis('7.0', '110', '', '', false).category).toBe('diabetes');
  });
});

// ─── Confirmation Logic ─────────────────────────────────────────────

describe('checkConfirmation', () => {
  it('returns not confirmed for < 2 readings', () => {
    expect(checkConfirmation([{ a1c: '7.0', fpg: '', twohPG: '', randomPG: '' }], false).confirmed).toBe(false);
  });

  it('returns confirmed for 2 readings with abnormal A1C', () => {
    const result = checkConfirmation(
      [
        { a1c: '7.0', fpg: '', twohPG: '', randomPG: '' },
        { a1c: '6.8', fpg: '', twohPG: '', randomPG: '' },
      ],
      false,
    );
    expect(result.confirmed).toBe(true);
    expect(result.method).toBe('A1C');
  });

  it('returns confirmed for 2 readings with different abnormal tests', () => {
    const result = checkConfirmation(
      [
        { a1c: '7.0', fpg: '', twohPG: '', randomPG: '' },
        { a1c: '', fpg: '130', twohPG: '', randomPG: '' },
      ],
      false,
    );
    expect(result.confirmed).toBe(true);
    expect(result.method).toContain('A1C');
    expect(result.method).toContain('FPG');
  });

  it('returns not confirmed when only 1 reading is abnormal', () => {
    const result = checkConfirmation(
      [
        { a1c: '7.0', fpg: '', twohPG: '', randomPG: '' },
        { a1c: '5.0', fpg: '90', twohPG: '', randomPG: '' },
      ],
      false,
    );
    expect(result.confirmed).toBe(false);
  });

  it('returns confirmed with random PG when symptoms present', () => {
    const result = checkConfirmation(
      [
        { a1c: '', fpg: '', twohPG: '', randomPG: '250' },
        { a1c: '7.0', fpg: '', twohPG: '', randomPG: '' },
      ],
      true,
    );
    expect(result.confirmed).toBe(true);
  });

  it('does not count random PG without symptoms', () => {
    const result = checkConfirmation(
      [
        { a1c: '', fpg: '', twohPG: '', randomPG: '250' },
        { a1c: '5.0', fpg: '', twohPG: '', randomPG: '' },
      ],
      false,
    );
    expect(result.confirmed).toBe(false);
  });
});
