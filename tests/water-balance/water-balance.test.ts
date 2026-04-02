import { describe, it, expect } from 'vitest';
import {
  safeParseFloat,
  calculateInsensibleLoss,
  calculateEndogenousGeneration,
  calculateDefecationLoss,
  calculateWaterBalance,
} from '../../lib/water-balance';

describe('safeParseFloat', () => {
  it('returns 0 for empty string', () => {
    expect(safeParseFloat('')).toBe(0);
  });

  it('returns 0 for null', () => {
    expect(safeParseFloat(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(safeParseFloat(undefined)).toBe(0);
  });

  it('returns 0 for NaN string', () => {
    expect(safeParseFloat('abc')).toBe(0);
  });

  it('parses valid number string', () => {
    expect(safeParseFloat('70')).toBe(70);
  });

  it('parses valid float string', () => {
    expect(safeParseFloat('70.5')).toBe(70.5);
  });

  it('parses numeric input directly', () => {
    expect(safeParseFloat(70)).toBe(70);
  });
});

describe('calculateInsensibleLoss', () => {
  it('calculates for standard 70kg patient: 70 × 12 = 840 mL', () => {
    expect(calculateInsensibleLoss(70)).toBe('840');
  });

  it('returns 0 for zero weight', () => {
    expect(calculateInsensibleLoss(0)).toBe('0');
  });

  it('handles string input', () => {
    expect(calculateInsensibleLoss('70')).toBe('840');
  });

  it('handles empty/null input gracefully', () => {
    expect(calculateInsensibleLoss('')).toBe('0');
    expect(calculateInsensibleLoss(null)).toBe('0');
  });
});

describe('calculateEndogenousGeneration', () => {
  it('calculates for standard 70kg patient: 70 × 4.5 = 315 mL', () => {
    expect(calculateEndogenousGeneration(70)).toBe('315');
  });

  it('returns 0 for zero weight', () => {
    expect(calculateEndogenousGeneration(0)).toBe('0');
  });
});

describe('calculateDefecationLoss', () => {
  it('calculates for 2 stools: 2 × 120 = 240 mL', () => {
    expect(calculateDefecationLoss(2)).toBe('240');
  });

  it('returns 0 for zero stools', () => {
    expect(calculateDefecationLoss(0)).toBe('0');
  });

  it('handles string input', () => {
    expect(calculateDefecationLoss('3')).toBe('360');
  });
});

describe('calculateWaterBalance', () => {
  it('calculates net balance for standard 70kg patient', () => {
    // Intake: oral 1500 + IV 500 + endogenous (70*4.5=315) = 2315
    // Output: diuresis 1200 + defecation (2*120=240) + insensible (70*12=840) = 2280
    // Balance = 2315 - 2280 = 35
    const result = calculateWaterBalance('70', '1500', '500', '1200', '2');
    expect(result).toBe('35');
  });

  it('returns negative balance when output exceeds intake', () => {
    // Intake: oral 500 + IV 0 + endogenous (70*4.5=315) = 815
    // Output: diuresis 1500 + defecation (1*120=120) + insensible (70*12=840) = 2460
    // Balance = 815 - 2460 = -1645
    const result = calculateWaterBalance('70', '500', '0', '1500', '1');
    expect(parseInt(result)).toBeLessThan(0);
  });

  it('handles zero weight (only oral + IV intake, only diuresis + defecation output)', () => {
    // Intake: oral 1000 + IV 500 + endogenous 0 = 1500
    // Output: diuresis 800 + defecation (1*120=120) + insensible 0 = 920
    // Balance = 1500 - 920 = 580
    const result = calculateWaterBalance('0', '1000', '500', '800', '1');
    expect(result).toBe('580');
  });

  it('handles all empty inputs gracefully', () => {
    const result = calculateWaterBalance('', '', '', '', '');
    expect(result).toBe('0');
  });
});
