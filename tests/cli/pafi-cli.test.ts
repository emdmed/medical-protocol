import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/pafi';

let stdout: string;
let stderr: string;

beforeEach(() => {
  stdout = '';
  stderr = '';
  vi.spyOn(process.stdout, 'write').mockImplementation((s: any) => { stdout += s; return true; });
  vi.spyOn(process.stderr, 'write').mockImplementation((s: any) => { stderr += s; return true; });
  process.exitCode = undefined;
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe('medprotocol pafi', () => {
  it('shows help with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol pafi');
  });

  it('errors when --pao2 is missing', () => {
    run(['--fio2', '40']);
    expect(stderr).toContain('--pao2');
    expect(process.exitCode).toBe(1);
  });

  it('errors when --fio2 is missing', () => {
    run(['--pao2', '80']);
    expect(stderr).toContain('--fio2');
    expect(process.exitCode).toBe(1);
  });

  it('calculates PaFi ratio (human)', () => {
    run(['--pao2', '90', '--fio2', '21']);
    expect(stdout).toContain('PaFi');
    expect(stdout).toContain('Normal');
  });

  it('calculates PaFi ratio (JSON)', () => {
    run(['--pao2', '90', '--fio2', '21', '--json']);
    const result = JSON.parse(stdout);
    // 90 / 0.21 = 428.57 → rounded to 429
    expect(result.paFi).toBe(429);
    expect(result.classification).toBe('Normal');
    expect(result.severity).toBe('normal');
  });

  it('classifies Mild ARDS (200-300)', () => {
    run(['--pao2', '70', '--fio2', '30', '--json']);
    const result = JSON.parse(stdout);
    // 70 / 0.30 = 233
    expect(result.paFi).toBeGreaterThanOrEqual(200);
    expect(result.paFi).toBeLessThanOrEqual(300);
    expect(result.classification).toBe('Mild ARDS');
  });

  it('classifies Moderate ARDS (100-200)', () => {
    run(['--pao2', '60', '--fio2', '40', '--json']);
    const result = JSON.parse(stdout);
    // 60 / 0.40 = 150
    expect(result.paFi).toBe(150);
    expect(result.classification).toBe('Moderate ARDS');
  });

  it('classifies Severe ARDS (<100)', () => {
    run(['--pao2', '50', '--fio2', '80', '--json']);
    const result = JSON.parse(stdout);
    // 50 / 0.80 = 62.5 → 63
    expect(result.paFi).toBeLessThan(100);
    expect(result.classification).toBe('Severe ARDS');
  });

  it('errors for FiO2 < 21', () => {
    run(['--pao2', '90', '--fio2', '15']);
    expect(stderr).toContain('Could not calculate');
    expect(process.exitCode).toBe(1);
  });
});
