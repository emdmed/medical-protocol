import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/dka';

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

describe('medprotocol dka', () => {
  it('shows help with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol dka');
  });

  it('errors when --glucose is missing', () => {
    run([]);
    expect(stderr).toContain('--glucose is required');
    expect(process.exitCode).toBe(1);
  });

  it('outputs glucose-only assessment (human)', () => {
    run(['--glucose', '400']);
    expect(stdout).toContain('DKA Assessment');
    expect(stdout).toContain('400');
    expect(stdout).toContain('mg/dL');
  });

  it('outputs glucose-only assessment (JSON)', () => {
    run(['--glucose', '400', '--json']);
    const result = JSON.parse(stdout);
    expect(result.glucose).toBe(400);
    expect(result.unit).toBe('mgdl');
  });

  it('calculates glucose reduction rate', () => {
    run(['--glucose', '400', '--prev-glucose', '460', '--hours', '2', '--json']);
    const result = JSON.parse(stdout);
    // (460 - 400) / 2 = 30
    expect(result.glucoseRate).toBe(30);
    expect(result.glucoseOnTarget).toBe(false); // < 54 mg/dL/hr
  });

  it('assesses DKA resolution — resolved', () => {
    run(['--glucose', '150', '--ketones', '0.3', '--bicarbonate', '18', '--ph', '7.35', '--json']);
    const result = JSON.parse(stdout);
    expect(result.resolved).toBe(true);
    expect(result.criteria.glucose).toBe(true);
    expect(result.criteria.ketones).toBe(true);
    expect(result.criteria.bicarbonate).toBe(true);
    expect(result.criteria.pH).toBe(true);
  });

  it('assesses DKA resolution — not resolved', () => {
    run(['--glucose', '350', '--ketones', '3.0', '--bicarbonate', '12', '--ph', '7.20', '--json']);
    const result = JSON.parse(stdout);
    expect(result.resolved).toBe(false);
  });

  it('suggests insulin adjustment', () => {
    run(['--glucose', '400', '--prev-glucose', '460', '--hours', '2', '--insulin-rate', '5', '--json']);
    const result = JSON.parse(stdout);
    expect(result.insulinSuggestion).toBeDefined();
    // Rate 30 < 54 target → suggest increase
    expect(result.insulinSuggestion).toContain('increasing');
  });

  it('supports mmol unit', () => {
    run(['--glucose', '22', '--unit', 'mmol', '--json']);
    const result = JSON.parse(stdout);
    expect(result.glucose).toBe(22);
    expect(result.unit).toBe('mmol');
  });

  it('shows human-readable rate output', () => {
    run(['--glucose', '400', '--prev-glucose', '460', '--hours', '2']);
    expect(stdout).toContain('Glucose rate');
    expect(stdout).toContain('30.0');
  });
});
