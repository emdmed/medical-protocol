import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/chest';

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

describe('medprotocol chest', () => {
  it('shows help with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol chest');
  });

  it('rejects a sign outside its list', () => {
    run(['--left-percussion', 'flat']);
    expect(stderr).toContain('--left-percussion must be one of');
    expect(process.exitCode).toBe(1);
  });

  it('rejects an unknown trachea', () => {
    run(['--trachea', 'left']);
    expect(stderr).toContain('--trachea must be one of');
    expect(process.exitCode).toBe(1);
  });

  it('gives per-side verdicts (human)', () => {
    run(['--right-percussion', 'dull', '--right-breath-sounds', 'bronchial', '--left-percussion', 'resonant']);
    expect(stdout).toContain('Consolidation');
    expect(stdout).toContain('No focal syndrome');
  });

  it('reads atelectasis from a trachea pulled toward the side (JSON)', () => {
    run(['--trachea', 'deviated_left', '--left-percussion', 'dull', '--left-breath-sounds', 'absent', '--json']);
    const result = JSON.parse(stdout);
    expect(result.left.verdict).toBe('atelectasis');
    expect(result.right.verdict).toBe('not_examined');
  });

  it('lists the unrecorded sign an indeterminate side waits on, and the whole-chest pattern', () => {
    run(['--trachea', 'central', '--left-percussion', 'dull', '--left-breath-sounds', 'reduced',
      '--left-added-sounds', 'wheeze', '--right-added-sounds', 'wheeze', '--json']);
    const result = JSON.parse(stdout);
    expect(result.patterns).toEqual(['bronchial_obstruction']);
    expect(result.right.verdict).toBe('no_syndrome');
    expect(result.left.verdict).toBe('indeterminate');
    expect(result.left.reason).toBe('sign_not_recorded');
    expect(result.left.unrecorded).toEqual([{ syndrome: 'consolidation', sign: 'vocalResonance', values: ['increased'] }]);
  });

  it('marks both sides not examined when the examination was not performed', () => {
    run(['--examination', 'not_mentioned', '--right-percussion', 'dull', '--json']);
    const result = JSON.parse(stdout);
    expect(result.right.verdict).toBe('not_examined');
    expect(result.patterns).toEqual([]);
  });
});
