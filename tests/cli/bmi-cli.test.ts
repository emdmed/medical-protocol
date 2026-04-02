import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/bmi';

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

describe('medprotocol bmi', () => {
  it('calculates BMI in metric mode', () => {
    run(['--weight', '70', '--height-m', '1.75', '--metric']);
    expect(stdout).toContain('22.9');
    expect(stdout).toContain('Normal');
  });

  it('calculates BMI in imperial mode', () => {
    run(['--weight', '154', '--height-ft', '5', '--height-in', '9']);
    expect(stdout).toContain('22.7');
    expect(stdout).toContain('Normal');
  });

  it('outputs JSON with --json flag', () => {
    run(['--weight', '70', '--height-m', '1.75', '--metric', '--json']);
    const result = JSON.parse(stdout);
    expect(result.bmi).toBeCloseTo(22.9, 0);
    expect(result.category).toBe('Normal');
    expect(result.units).toBe('metric');
  });

  it('shows usage with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol bmi');
  });

  it('errors when --weight is missing', () => {
    run(['--height-m', '1.75', '--metric']);
    expect(stderr).toContain('--weight is required');
    expect(process.exitCode).toBe(1);
  });

  it('errors when --height-m missing with --metric', () => {
    run(['--weight', '70', '--metric']);
    expect(stderr).toContain('--height-m is required');
    expect(process.exitCode).toBe(1);
  });

  it('errors when no height provided in imperial', () => {
    run(['--weight', '154']);
    expect(stderr).toContain('--height-ft');
    expect(process.exitCode).toBe(1);
  });

  it('classifies obese BMI', () => {
    run(['--weight', '100', '--height-m', '1.70', '--metric', '--json']);
    const result = JSON.parse(stdout);
    expect(result.category).toBe('Obese');
  });

  it('classifies underweight BMI', () => {
    run(['--weight', '45', '--height-m', '1.75', '--metric', '--json']);
    const result = JSON.parse(stdout);
    expect(result.category).toBe('Underweight');
  });
});
