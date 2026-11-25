import { describe, it, expect } from 'vitest';
import { toExpectedUnit } from '../../plugin/lib/units';

describe('toExpectedUnit', () => {
  const input = (value: number, unit?: string) => ({ value, quote: 'q', ...(unit ? { unit } : {}) });

  it('converts to the unit the calculators take and keeps what the note states', () => {
    expect(toExpectedUnit('creatinine', input(159, 'µmol/L'))).toMatchObject({ value: 1.8, unit: 'mg/dL', from: '159 µmol/L' });
    expect(toExpectedUnit('creatinine', input(159, 'umol/l')).value).toBe(1.8);
    expect(toExpectedUnit('hb', input(108, 'g/L'))).toMatchObject({ value: 10.8, unit: 'g/dL' });
    expect(toExpectedUnit('albumin', input(35, 'g/L')).value).toBe(3.5);
    expect(toExpectedUnit('pco2', input(5.3, 'kPa'))).toMatchObject({ value: 39.8, unit: 'mmHg' });
    expect(toExpectedUnit('fio2', input(0.35))).toMatchObject({ value: 35, unit: '%', from: '0.35' });
  });

  it('leaves alone what is already in the unit, has no unit, or has no exact conversion', () => {
    for (const [key, i] of [['creatinine', input(1.8, 'mg/dL')], ['creatinine', input(159)], ['glucose', input(5.5, 'mmol/L')], ['fio2', input(0.4, '%')], ['fio2', input(40)], ['fio2', input(0.1)]] as const) {
      expect(toExpectedUnit(key, i)).toBe(i);
    }
  });
});
