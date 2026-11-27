import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/hepatology';

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

const base = ['--age', '55', '--ast', '40', '--alt', '35'];

describe('medprotocol hepatology', () => {
  it('shows help with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol hepatology');
  });

  it('errors when --platelets is missing', () => {
    run(base);
    expect(stderr).toContain('--platelets');
    expect(process.exitCode).toBe(1);
  });

  it('errors for a non-positive input', () => {
    run([...base, '--platelets', '0']);
    expect(stderr).toContain('Could not calculate');
    expect(process.exitCode).toBe(1);
  });

  it('low FIB-4: low risk, no treatment (JSON)', () => {
    run(['--age', '40', '--ast', '20', '--alt', '30', '--platelets', '300', '--json']);
    const result = JSON.parse(stdout);
    expect(result.fib4Tier).toBe('low');
    expect(result.referral).toBe(false);
    expect(result.treatment).toBeNull();
  });

  it('indeterminate FIB-4 without LSM/ELF asks for them', () => {
    run([...base, '--platelets', '200', '--json']);
    const result = JSON.parse(stdout);
    // 55·40 / (200·√35) = 1.86
    expect(result.fib4).toBe(1.86);
    expect(result.fib4Tier).toBe('indeterminate');
    expect(result.action).toBe('Obtain LSM or ELF');
    expect(result.treatment).not.toBeNull();
  });

  it('indeterminate FIB-4 with LSM ≥8 refers', () => {
    run([...base, '--platelets', '200', '--lsm', '9.2', '--json']);
    const result = JSON.parse(stdout);
    expect(result.referral).toBe(true);
    expect(result.severity).toBe('critical');
  });

  it('high FIB-4 refers immediately (human)', () => {
    run(['--age', '60', '--ast', '100', '--alt', '40', '--platelets', '100']);
    expect(stdout).toContain('FIB-4');
    expect(stdout).toContain('Refer to hepatologist');
  });
});
