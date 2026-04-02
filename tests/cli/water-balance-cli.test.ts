import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/water-balance';

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

describe('medprotocol water-balance', () => {
  it('calculates positive balance', () => {
    run(['--weight', '70', '--oral', '1500', '--iv', '500', '--diuresis', '1200', '--stools', '2']);
    expect(stdout).toContain('+35 mL');
  });

  it('outputs JSON with --json', () => {
    run(['--weight', '70', '--oral', '1500', '--iv', '500', '--diuresis', '1200', '--stools', '2', '--json']);
    const result = JSON.parse(stdout);
    expect(result.balance).toBe(35);
    expect(result.totalIntake).toBe(2315);
    expect(result.totalOutput).toBe(2280);
    expect(result.intake.endogenous).toBe(315);
    expect(result.output.insensible).toBe(840);
  });

  it('calculates negative balance', () => {
    run(['--weight', '70', '--oral', '500', '--diuresis', '1500', '--stools', '1', '--json']);
    const result = JSON.parse(stdout);
    expect(result.balance).toBeLessThan(0);
  });

  it('shows usage with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol water-balance');
  });

  it('errors when --weight is missing', () => {
    run(['--oral', '1500']);
    expect(stderr).toContain('--weight is required');
    expect(process.exitCode).toBe(1);
  });

  it('defaults optional values to zero', () => {
    run(['--weight', '70', '--json']);
    const result = JSON.parse(stdout);
    expect(result.intake.oral).toBe(0);
    expect(result.intake.iv).toBe(0);
    expect(result.output.diuresis).toBe(0);
  });
});
