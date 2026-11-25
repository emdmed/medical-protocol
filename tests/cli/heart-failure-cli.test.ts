import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/heart-failure';

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

describe('medprotocol heart-failure', () => {
  it('shows help with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol heart-failure');
  });

  it('rejects a finding outside its list', () => {
    run(['--crackles', 'present']);
    expect(stderr).toContain('--crackles must be one of');
    expect(process.exitCode).toBe(1);
  });

  it('rejects an unknown JVP reference', () => {
    run(['--jvp-cm', '4', '--jvp-ref', 'clavicle']);
    expect(stderr).toContain('--jvp-ref must be one of');
    expect(process.exitCode).toBe(1);
  });

  it('finds biventricular heart failure (human)', () => {
    run(['--breathlessness', 'present', '--crackles', 'bilateral', '--jvp', 'elevated']);
    expect(stdout).toContain('Left- and right-sided congestion');
    expect(stdout).toContain('heart failure syndrome');
    expect(stdout).toContain('Ibrahim');
  });

  it('converts a sternal-angle height and decides right over a clear chest (JSON)', () => {
    run(['--crackles', 'none', '--jvp-cm', '4', '--jvp-ref', 'sternal-angle', '--json']);
    const result = JSON.parse(stdout);
    expect(result.verdict).toBe('right');
    expect(result.syndrome).toBe('symptoms_not_recorded');
  });

  it('lists a height with no reference under notCalculated and does not fail', () => {
    run(['--crackles', 'none', '--jvp-cm', '4', '--jvp', 'normal_or_low', '--json']);
    const result = JSON.parse(stdout);
    expect(process.exitCode).toBeUndefined();
    expect(result.verdict).toBe('no_congestion');
    expect(result.notCalculated[0]).toContain('no reference point');
  });

  it('names the examination that would decide an empty exam', () => {
    run(['--json']);
    const result = JSON.parse(stdout);
    expect(result.reason).toBe('neither_determined');
    expect(result.nextText).toEqual(['Auscultate the chest', 'Assess the jugular venous pressure']);
  });
});
