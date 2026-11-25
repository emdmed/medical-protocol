import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/pulmonary';

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

describe('medprotocol pulmonary', () => {
  it('shows help with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol pulmonary');
  });

  it('rejects a history value outside its list', () => {
    run(['--cough', 'yes']);
    expect(stderr).toContain('--cough must be one of');
    expect(process.exitCode).toBe(1);
  });

  it('rejects a non-numeric temperature', () => {
    run(['--temp', 'hot']);
    expect(stderr).toContain('--temp must be a number');
    expect(process.exitCode).toBe(1);
  });

  it('rejects an imaging item with the wrong count or value', () => {
    run(['--imaging', 'chest_radiograph,consolidation,present,left']);
    expect(stderr).toContain('--imaging takes 5 values');
    stderr = '';
    run(['--imaging', 'xray,consolidation,present,left,current']);
    expect(stderr).toContain('--imaging modality must be one of');
  });

  it('suspects pneumonia from focal consolidation signs with symptoms (human)', () => {
    run(['--cough', 'present', '--temp', '38.4', '--right-percussion', 'dull', '--right-breath-sounds', 'bronchial']);
    expect(stdout).toContain('Focal pulmonary syndrome supported');
    expect(stdout).toContain('Clinically suspected');
    expect(stdout).toContain('Pneumonia');
    expect(stdout).toContain('Chest imaging');
  });

  it('reads imaging, states the conflict and asks to re-examine (JSON)', () => {
    run(['--right-added-sounds', 'crackles', '--cough', 'present',
      '--imaging', 'chest_radiograph,consolidation,present,left,current', '--json']);
    const result = JSON.parse(stdout);
    expect(result.verdict).toBe('supported');
    expect(result.reason).toBe('focal_imaging');
    expect(result.pneumoniaEvidence).toBe('imaging-supported');
    expect(result.focalSide).toBe('left');
    expect(result.differential).toEqual(['pneumonia']);
    expect(result.conflict).toEqual({ examinationSide: 'right', imagingSide: 'left', imagingFinding: 'consolidation' });
    expect(result.next).toContain('re_examine_chest');
  });

  it('takes imaging repeated, and a historical film is not focal', () => {
    run(['--imaging', 'chest_radiograph,consolidation,present,right,historical',
      '--imaging', 'chest_radiograph,pleural_effusion,present,left,current', '--json']);
    const result = JSON.parse(stdout);
    expect(result.focalSide).toBe('left');
    expect(result.differential).toEqual(['pleural_effusion']);
    expect(result.pneumoniaEvidence).toBe('none');
  });

  it('is indeterminate with one-sided crackles and no symptoms', () => {
    run(['--right-added-sounds', 'crackles', '--json']);
    const result = JSON.parse(stdout);
    expect(result.verdict).toBe('indeterminate');
    expect(result.pneumoniaEvidence).toBe('physical-sign-only');
    expect(result.differential).toEqual([]);
  });
});
