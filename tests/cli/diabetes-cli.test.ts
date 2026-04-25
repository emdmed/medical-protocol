import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/diabetes';

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

// ─── Help & routing ─────────────────────────────────────────────────

describe('diabetes CLI routing', () => {
  it('shows help with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol diabetes');
  });

  it('shows help with no sub-command', () => {
    run([]);
    expect(stdout).toContain('Usage: medprotocol diabetes');
  });

  it('errors on unknown sub-command', () => {
    run(['unknown']);
    expect(stderr).toContain('Unknown sub-command');
    expect(process.exitCode).toBe(1);
  });
});

// ─── diagnose ───────────────────────────────────────────────────────

describe('diabetes diagnose', () => {
  it('classifies diabetes for A1C ≥ 6.5', () => {
    run(['diagnose', '--a1c', '7.0']);
    expect(stdout).toContain('Diabetes');
  });

  it('classifies prediabetes for A1C 5.7–6.4', () => {
    run(['diagnose', '--a1c', '5.8']);
    expect(stdout).toContain('Prediabetes');
  });

  it('classifies normal for low values', () => {
    run(['diagnose', '--a1c', '5.0', '--fpg', '90']);
    expect(stdout).toContain('Normal');
  });

  it('outputs JSON with --json', () => {
    run(['diagnose', '--a1c', '7.0', '--json']);
    const result = JSON.parse(stdout);
    expect(result.category).toBe('diabetes');
    expect(result.a1c).toBe(7.0);
  });

  it('errors when no test values provided', () => {
    run(['diagnose']);
    expect(stderr).toContain('At least one test value required');
    expect(process.exitCode).toBe(1);
  });

  it('handles FPG classification', () => {
    run(['diagnose', '--fpg', '130', '--json']);
    const result = JSON.parse(stdout);
    expect(result.category).toBe('diabetes');
  });

  it('handles 2h-PG classification', () => {
    run(['diagnose', '--2h-pg', '210', '--json']);
    const result = JSON.parse(stdout);
    expect(result.category).toBe('diabetes');
  });

  it('handles random PG with symptoms', () => {
    run(['diagnose', '--random-pg', '250', '--symptoms', '--json']);
    const result = JSON.parse(stdout);
    expect(result.category).toBe('diabetes');
  });
});

// ─── t1d-stage ──────────────────────────────────────────────────────

describe('diabetes t1d-stage', () => {
  it('classifies stage 1 for ≥2 autoantibodies + normoglycemia', () => {
    run(['t1d-stage', '--autoantibodies', '2', '--fpg', '90']);
    expect(stdout).toContain('Stage 1');
  });

  it('classifies stage 3 for overt diabetes', () => {
    run(['t1d-stage', '--autoantibodies', '3', '--a1c', '7.0']);
    expect(stdout).toContain('Stage 3');
  });

  it('outputs JSON', () => {
    run(['t1d-stage', '--autoantibodies', '2', '--json']);
    const result = JSON.parse(stdout);
    expect(result.stage).toBe(1);
  });

  it('errors on missing --autoantibodies', () => {
    run(['t1d-stage', '--a1c', '5.0']);
    expect(stderr).toContain('--autoantibodies');
    expect(process.exitCode).toBe(1);
  });
});

// ─── t1-vs-t2 ───────────────────────────────────────────────────────

describe('diabetes t1-vs-t2', () => {
  it('classifies Type 1 with autoantibodies + young + low BMI', () => {
    run(['t1-vs-t2', '--age', '25', '--bmi', '22', '--autoantibodies', '--c-peptide', '150', '--dka-history']);
    expect(stdout).toContain('Type 1');
  });

  it('classifies Type 2 with no autoantibodies + older + obese', () => {
    run(['t1-vs-t2', '--age', '55', '--bmi', '32', '--c-peptide', '700']);
    expect(stdout).toContain('Type 2');
  });

  it('outputs JSON', () => {
    run(['t1-vs-t2', '--age', '25', '--bmi', '22', '--autoantibodies', '--json']);
    const result = JSON.parse(stdout);
    expect(result.classification).toBeDefined();
    expect(result.features).toBeDefined();
  });

  it('errors on missing --age', () => {
    run(['t1-vs-t2', '--bmi', '22']);
    expect(stderr).toContain('--age');
    expect(process.exitCode).toBe(1);
  });

  it('errors on missing --bmi', () => {
    run(['t1-vs-t2', '--age', '25']);
    expect(stderr).toContain('--bmi');
    expect(process.exitCode).toBe(1);
  });
});

// ─── t2d-screen ─────────────────────────────────────────────────────

describe('diabetes t2d-screen', () => {
  it('screens now for BMI ≥25 + risk factor', () => {
    run(['t2d-screen', '--age', '40', '--bmi', '28', '--hypertension']);
    expect(stdout).toContain('Screen now');
  });

  it('no screening for young, normal BMI', () => {
    run(['t2d-screen', '--age', '25', '--bmi', '22']);
    expect(stdout).toContain('No screening indicated');
  });

  it('outputs JSON', () => {
    run(['t2d-screen', '--age', '40', '--bmi', '28', '--hypertension', '--json']);
    const result = JSON.parse(stdout);
    expect(result.action).toBe('Screen now');
    expect(result.riskFactorCount).toBe(1);
  });

  it('errors on missing --age and --bmi', () => {
    run(['t2d-screen']);
    expect(stderr).toContain('--age');
    expect(stderr).toContain('--bmi');
    expect(process.exitCode).toBe(1);
  });
});

// ─── gdm ────────────────────────────────────────────────────────────

describe('diabetes gdm', () => {
  it('classifies GDM positive one-step', () => {
    run(['gdm', '--strategy', 'one-step', '--fasting', '95', '--1h', '185', '--2h', '160']);
    expect(stdout).toContain('GDM Positive');
  });

  it('classifies GDM negative one-step', () => {
    run(['gdm', '--strategy', 'one-step', '--fasting', '85', '--1h', '150', '--2h', '140']);
    expect(stdout).toContain('GDM Negative');
  });

  it('classifies GDM positive two-step', () => {
    run(['gdm', '--strategy', 'two-step', '--fasting', '95', '--1h', '180', '--2h', '155', '--3h', '140']);
    expect(stdout).toContain('GDM Positive');
  });

  it('classifies GDM negative two-step (only 1 exceeded)', () => {
    run(['gdm', '--strategy', 'two-step', '--fasting', '95', '--1h', '170', '--2h', '140', '--3h', '130']);
    expect(stdout).toContain('GDM Negative');
  });

  it('outputs JSON', () => {
    run(['gdm', '--strategy', 'one-step', '--fasting', '95', '--1h', '185', '--2h', '160', '--json']);
    const result = JSON.parse(stdout);
    expect(result.positive).toBe(true);
    expect(result.strategy).toBe('one-step');
  });

  it('errors on missing --strategy', () => {
    run(['gdm', '--fasting', '95', '--1h', '185', '--2h', '160']);
    expect(stderr).toContain('--strategy');
    expect(process.exitCode).toBe(1);
  });

  it('errors on missing glucose values', () => {
    run(['gdm', '--strategy', 'one-step']);
    expect(stderr).toContain('--fasting');
    expect(process.exitCode).toBe(1);
  });
});
