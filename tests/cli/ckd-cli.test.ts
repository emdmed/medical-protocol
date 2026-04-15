import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/ckd';

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

// ── Help & routing ─────────────────────────────────────

describe('medprotocol ckd', () => {
  it('shows help with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol ckd');
  });

  it('shows help with no sub-command', () => {
    run([]);
    expect(stdout).toContain('Usage: medprotocol ckd');
  });

  it('errors on unknown sub-command', () => {
    run(['unknown']);
    expect(stderr).toContain('Unknown sub-command');
    expect(process.exitCode).toBe(1);
  });
});

// ── eGFR ───────────────────────────────────────────────

describe('medprotocol ckd egfr', () => {
  const baseArgs = ['egfr', '--creatinine', '1.2', '--age', '55', '--sex', 'male'];

  it('calculates eGFR for valid inputs', () => {
    run(baseArgs);
    expect(stdout).toContain('eGFR');
    expect(stdout).toContain('mL/min/1.73m²');
  });

  it('outputs JSON with --json flag', () => {
    run([...baseArgs, '--json']);
    const result = JSON.parse(stdout);
    expect(result.egfr).toBeGreaterThan(0);
    expect(result.gfrCategory).toBeDefined();
    expect(result.severity).toBeDefined();
  });

  it('calculates for female sex', () => {
    run(['egfr', '--creatinine', '0.8', '--age', '45', '--sex', 'female', '--json']);
    const result = JSON.parse(stdout);
    expect(result.egfr).toBeGreaterThan(0);
  });

  it('errors when --creatinine is missing', () => {
    run(['egfr', '--age', '55', '--sex', 'male']);
    expect(stderr).toContain('--creatinine');
    expect(process.exitCode).toBe(1);
  });

  it('errors when --age is missing', () => {
    run(['egfr', '--creatinine', '1.2', '--sex', 'male']);
    expect(stderr).toContain('--age');
    expect(process.exitCode).toBe(1);
  });

  it('errors when --sex is missing', () => {
    run(['egfr', '--creatinine', '1.2', '--age', '55']);
    expect(stderr).toContain('--sex');
    expect(process.exitCode).toBe(1);
  });
});

// ── Stage ──────────────────────────────────────────────

describe('medprotocol ckd stage', () => {
  const baseArgs = ['stage', '--creatinine', '1.2', '--age', '55', '--sex', 'male', '--acr', '45'];

  it('shows CGA staging for valid inputs', () => {
    run(baseArgs);
    expect(stdout).toContain('CKD CGA Staging');
    expect(stdout).toContain('Risk Level');
  });

  it('outputs JSON with --json flag', () => {
    run([...baseArgs, '--json']);
    const result = JSON.parse(stdout);
    expect(result.egfr).toBeGreaterThan(0);
    expect(result.gfrCategory).toBeDefined();
    expect(result.albCategory).toBeDefined();
    expect(result.riskLevel).toBeDefined();
    expect(result.monitoringPerYear).toBeGreaterThan(0);
  });

  it('errors when --acr is missing', () => {
    run(['stage', '--creatinine', '1.2', '--age', '55', '--sex', 'male']);
    expect(stderr).toContain('--acr');
    expect(process.exitCode).toBe(1);
  });
});

// ── KFRE ───────────────────────────────────────────────

describe('medprotocol ckd kfre', () => {
  const baseArgs = ['kfre', '--age', '65', '--sex', 'female', '--egfr', '35', '--acr', '300'];

  it('calculates KFRE for valid inputs', () => {
    run(baseArgs);
    expect(stdout).toContain('Kidney Failure Risk');
    expect(stdout).toContain('%');
  });

  it('outputs JSON with --json flag', () => {
    run([...baseArgs, '--json']);
    const result = JSON.parse(stdout);
    expect(result.twoYearRisk).toBeGreaterThan(0);
    expect(result.fiveYearRisk).toBeGreaterThan(0);
    expect(result.referral).toBeDefined();
  });

  it('errors when --egfr is missing', () => {
    run(['kfre', '--age', '65', '--sex', 'female', '--acr', '300']);
    expect(stderr).toContain('--egfr');
    expect(process.exitCode).toBe(1);
  });

  it('errors when --acr is missing', () => {
    run(['kfre', '--age', '65', '--sex', 'female', '--egfr', '35']);
    expect(stderr).toContain('--acr');
    expect(process.exitCode).toBe(1);
  });
});

// ── Treatment ──────────────────────────────────────────

describe('medprotocol ckd treatment', () => {
  it('shows treatment eligibility for valid inputs', () => {
    run(['treatment', '--egfr', '35', '--acr', '300', '--diabetes']);
    expect(stdout).toContain('Treatment Eligibility');
    expect(stdout).toContain('RASi');
    expect(stdout).toContain('SGLT2i');
    expect(stdout).toContain('Finerenone');
  });

  it('outputs JSON with --json flag', () => {
    run(['treatment', '--egfr', '35', '--acr', '300', '--diabetes', '--json']);
    const result = JSON.parse(stdout);
    expect(result.rasi).toBeDefined();
    expect(result.sglt2i).toBeDefined();
    expect(result.finerenone).toBeDefined();
    expect(result.rasi.eligible).toBe(true);
  });

  it('shows eligibility with all flags', () => {
    run([
      'treatment', '--egfr', '35', '--acr', '300',
      '--diabetes', '--heart-failure', '--on-rasi', '--potassium-normal', '--json',
    ]);
    const result = JSON.parse(stdout);
    expect(result.finerenone.eligible).toBe(true);
  });

  it('errors when --egfr is missing', () => {
    run(['treatment', '--acr', '300']);
    expect(stderr).toContain('--egfr');
    expect(process.exitCode).toBe(1);
  });

  it('errors when --acr is missing', () => {
    run(['treatment', '--egfr', '35']);
    expect(stderr).toContain('--acr');
    expect(process.exitCode).toBe(1);
  });
});
