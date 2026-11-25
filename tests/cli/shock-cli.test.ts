import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/shock';

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

describe('medprotocol shock', () => {
  it('shows help with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol shock');
  });

  it('errors when --sbp is missing', () => {
    run(['--skin', 'cool']);
    expect(stderr).toContain('--sbp');
    expect(process.exitCode).toBe(1);
  });

  it('rejects a finding outside its list', () => {
    run(['--sbp', '80', '--skin', 'cold']);
    expect(stderr).toContain('--skin must be one of');
    expect(process.exitCode).toBe(1);
  });

  it('classifies (human)', () => {
    run(['--sbp', '82', '--minutes', '45', '--skin', 'cool', '--jvp', 'elevated']);
    expect(stdout).toContain('Cardiogenic pattern');
    expect(stdout).toContain('Vazquez');
  });

  it('classifies from a measured JVP (JSON)', () => {
    run(['--sbp', '78', '--minutes', '60', '--skin', 'warm', '--jvp-cm', '5', '--cap-refill', 'brisk', '--json']);
    const result = JSON.parse(stdout);
    expect(result.category).toBe('septic');
    expect(result.jvp).toBe('normal_or_low');
    expect(result.supporting).toEqual(['capillaryRefill']);
    expect(result.reasonText).toBeNull();
  });

  it('says why it declined', () => {
    run(['--sbp', '110', '--minutes', '60', '--skin', 'warm', '--jvp', 'normal_or_low', '--json']);
    const result = JSON.parse(stdout);
    expect(result.category).toBe('indeterminate');
    expect(result.reasonText).toContain('90 mmHg');
  });
});
