import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/volume';

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

describe('medprotocol volume', () => {
  it('shows help with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol volume');
  });

  it('rejects a finding outside its list', () => {
    run(['--crackles', 'yes']);
    expect(stderr).toContain('--crackles must be one of');
    expect(process.exitCode).toBe(1);
  });

  it('rejects a JVP finding outside its list', () => {
    run(['--jvp', 'present']);
    expect(stderr).toContain('--jvp must be one of');
    expect(process.exitCode).toBe(1);
  });

  it('fails on an unusable measured JVP', () => {
    run(['--jvp-cm=-2']);
    expect(stderr).toContain('measured JVP');
    expect(process.exitCode).toBe(1);
  });

  it('finds overload on two majors (human)', () => {
    run(['--jvp', 'elevated', '--crackles', 'present']);
    expect(stdout).toContain('Volume overload');
    expect(stdout).toContain('McKee');
  });

  it('rules out overload when every sign was examined (JSON)', () => {
    run(['--jvp-cm', '5', '--crackles', 'absent', '--s3', 'absent', '--hjr', 'absent',
      '--edema', 'present', '--hepatomegaly', 'absent', '--effusion', 'absent', '--json']);
    const result = JSON.parse(stdout);
    expect(result.status).toBe('no_overload');
    expect(result.reasonText).toBeNull();
  });

  it('names the signs that would settle an indeterminate count', () => {
    run(['--jvp', 'elevated', '--crackles', 'absent', '--s3', 'absent', '--hjr', 'absent',
      '--edema', 'present', '--hepatomegaly', 'absent', '--json']);
    const result = JSON.parse(stdout);
    expect(result.status).toBe('indeterminate');
    expect(result.pivotal).toEqual(['pleuralEffusion']);
  });

  it('declines with no exam', () => {
    run(['--json']);
    expect(JSON.parse(stdout).reason).toBe('no_exam_documented');
  });
});
