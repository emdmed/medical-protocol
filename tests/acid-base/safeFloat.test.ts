import { describe, it, expect } from 'vitest';
import { safeFloat } from '../../public/medical-protocol/components/acid-base/utils/safeFloat';

describe('safeFloat', () => {
  it('parses valid integer string', () => {
    expect(safeFloat('42')).toBe(42);
  });

  it('parses valid decimal string', () => {
    expect(safeFloat('7.40')).toBeCloseTo(7.4);
  });

  it('parses negative number', () => {
    expect(safeFloat('-3.5')).toBe(-3.5);
  });

  it('returns null for empty string', () => {
    expect(safeFloat('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(safeFloat('   ')).toBeNull();
  });

  it('returns null for non-numeric string', () => {
    expect(safeFloat('abc')).toBeNull();
  });

  it('trims whitespace before parsing', () => {
    expect(safeFloat('  7.4  ')).toBeCloseTo(7.4);
  });

  it('parses zero', () => {
    expect(safeFloat('0')).toBe(0);
  });
});
