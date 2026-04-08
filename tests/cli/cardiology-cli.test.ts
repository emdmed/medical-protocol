import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/cardiology';

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

// ── Help & routing ─────────────────────────────────────

describe('medprotocol cardiology', () => {
  it('shows help with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol cardiology');
  });

  it('shows help with no sub-command', () => {
    run([]);
    expect(stdout).toContain('Usage: medprotocol cardiology');
  });

  it('errors on unknown sub-command', () => {
    run(['unknown']);
    expect(stderr).toContain('Unknown sub-command');
    expect(process.exitCode).toBe(1);
  });
});

// ── ASCVD ──────────────────────────────────────────────

describe('medprotocol cardiology ascvd', () => {
  const baseArgs = ['ascvd', '--age', '55', '--sex', 'male', '--tc', '213', '--hdl', '50', '--sbp', '120'];

  it('calculates ASCVD risk for valid inputs', () => {
    run(baseArgs);
    expect(stdout).toContain('ASCVD');
    expect(stdout).toContain('%');
  });

  it('outputs JSON with --json flag', () => {
    run([...baseArgs, '--json']);
    const result = JSON.parse(stdout);
    expect(result.risk).toBeGreaterThan(0);
    expect(result.category).toBeDefined();
    expect(result.severity).toBeDefined();
  });

  it('includes risk factors in output', () => {
    run(['ascvd', '--age', '55', '--sex', 'male', '--tc', '213', '--hdl', '50', '--sbp', '140', '--bp-treatment', '--diabetes', '--smoker']);
    expect(stdout).toContain('Yes'); // BP Treatment / Diabetes / Smoker
  });

  it('supports AA race', () => {
    run(['ascvd', '--age', '55', '--sex', 'female', '--race', 'aa', '--tc', '213', '--hdl', '50', '--sbp', '120', '--json']);
    const result = JSON.parse(stdout);
    expect(result.risk).toBeGreaterThan(0);
    expect(result.inputs.race).toBe('aa');
  });

  it('errors when --age is missing', () => {
    run(['ascvd', '--sex', 'male', '--tc', '213', '--hdl', '50', '--sbp', '120']);
    expect(stderr).toContain('--age');
    expect(process.exitCode).toBe(1);
  });

  it('errors when --sex is missing', () => {
    run(['ascvd', '--age', '55', '--tc', '213', '--hdl', '50', '--sbp', '120']);
    expect(stderr).toContain('--sex');
    expect(process.exitCode).toBe(1);
  });

  it('errors for out-of-range age', () => {
    run(['ascvd', '--age', '30', '--sex', 'male', '--tc', '213', '--hdl', '50', '--sbp', '120']);
    expect(stderr).toContain('Could not calculate');
    expect(process.exitCode).toBe(1);
  });
});

// ── HEART Score ────────────────────────────────────────

describe('medprotocol cardiology heart', () => {
  const baseArgs = ['heart', '--history', '1', '--ecg', '0', '--age', '2', '--risk-factors', '1', '--troponin', '0'];

  it('calculates HEART score for valid inputs', () => {
    run(baseArgs);
    expect(stdout).toContain('HEART Score');
    expect(stdout).toContain('4/10');
    expect(stdout).toContain('Moderate');
  });

  it('outputs JSON with --json flag', () => {
    run([...baseArgs, '--json']);
    const result = JSON.parse(stdout);
    expect(result.score).toBe(4);
    expect(result.category).toBe('Moderate');
    expect(result.action).toBeDefined();
  });

  it('calculates low risk (all zeros)', () => {
    run(['heart', '--history', '0', '--ecg', '0', '--age', '0', '--risk-factors', '0', '--troponin', '0', '--json']);
    const result = JSON.parse(stdout);
    expect(result.score).toBe(0);
    expect(result.category).toBe('Low');
  });

  it('calculates high risk (all twos)', () => {
    run(['heart', '--history', '2', '--ecg', '2', '--age', '2', '--risk-factors', '2', '--troponin', '2', '--json']);
    const result = JSON.parse(stdout);
    expect(result.score).toBe(10);
    expect(result.category).toBe('High');
  });

  it('errors when --history is missing', () => {
    run(['heart', '--ecg', '0', '--age', '0', '--risk-factors', '0', '--troponin', '0']);
    expect(stderr).toContain('--history');
    expect(process.exitCode).toBe(1);
  });
});

// ── CHA₂DS₂-VASc ──────────────────────────────────────

describe('medprotocol cardiology chadsvasc', () => {
  it('calculates score with no flags (score 0)', () => {
    run(['chadsvasc', '--json']);
    const result = JSON.parse(stdout);
    expect(result.score).toBe(0);
    expect(result.category).toBe('Low');
  });

  it('calculates score with multiple risk factors', () => {
    run(['chadsvasc', '--hypertension', '--age75', '--diabetes', '--json']);
    const result = JSON.parse(stdout);
    expect(result.score).toBe(4); // 1 + 2 + 1
    expect(result.category).toBe('Moderate-High');
  });

  it('shows human-readable output', () => {
    run(['chadsvasc', '--hypertension', '--stroke']);
    expect(stdout).toContain('CHA₂DS₂-VASc');
    expect(stdout).toContain('3/9');
  });

  it('applies sex-specific thresholds for female', () => {
    run(['chadsvasc', '--female', '--json']);
    const result = JSON.parse(stdout);
    expect(result.score).toBe(1); // sex alone = 1
    expect(result.category).toBe('Low'); // female with score 1 = Low
  });

  it('shows anticoagulation guidance', () => {
    run(['chadsvasc', '--hypertension', '--age75', '--stroke']);
    expect(stdout).toContain('Anticoagulation recommended');
  });

  it('age75 takes priority over age65', () => {
    run(['chadsvasc', '--age75', '--age65', '--json']);
    const result = JSON.parse(stdout);
    expect(result.score).toBe(2); // only age75 counts
  });
});
