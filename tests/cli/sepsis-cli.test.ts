import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/sepsis';

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

describe('medprotocol sepsis', () => {
  it('shows help with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol sepsis');
  });

  it('shows help with no sub-command', () => {
    run([]);
    expect(stdout).toContain('Usage: medprotocol sepsis');
  });

  it('errors on unknown sub-command', () => {
    run(['unknown']);
    expect(stderr).toContain('Unknown sub-command');
    expect(process.exitCode).toBe(1);
  });
});

// ── SOFA ───────────────────────────────────────────────

describe('medprotocol sepsis sofa', () => {
  it('calculates SOFA score with organ values', () => {
    run(['sofa', '--pao2', '80', '--fio2', '40', '--platelets', '90', '--gcs', '13', '--creatinine', '2.5']);
    expect(stdout).toContain('SOFA Score');
    expect(stdout).toContain('/24');
  });

  it('outputs JSON with --json flag', () => {
    run(['sofa', '--pao2', '80', '--fio2', '40', '--platelets', '90', '--gcs', '13', '--json']);
    const result = JSON.parse(stdout);
    expect(result.score).toBeGreaterThan(0);
    expect(result.severityLevel).toBeDefined();
    expect(result.severity).toBeDefined();
    expect(result.delta).toBeDefined();
  });

  it('scores 0 for normal values', () => {
    run(['sofa', '--pao2', '95', '--fio2', '21', '--platelets', '250', '--bilirubin', '0.5', '--map', '80', '--gcs', '15', '--creatinine', '0.8', '--json']);
    const result = JSON.parse(stdout);
    expect(result.score).toBe(0);
    expect(result.severityLevel).toBe('Low');
  });

  it('scores high for critical values', () => {
    run(['sofa', '--pao2', '50', '--fio2', '100', '--ventilation', '--platelets', '15', '--bilirubin', '13', '--dopamine', '20', '--gcs', '4', '--creatinine', '5.5', '--json']);
    const result = JSON.parse(stdout);
    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.severityLevel).toBe('Very High');
  });

  it('calculates SOFA delta from baseline', () => {
    run(['sofa', '--platelets', '90', '--gcs', '13', '--baseline', '2', '--json']);
    const result = JSON.parse(stdout);
    // platelets <100 = 2, gcs 13-14 = 1 → score 3, delta = 3-2 = 1
    expect(result.score).toBe(3);
    expect(result.delta).toBe(1);
    expect(result.baseline).toBe(2);
  });

  it('assesses sepsis with --infection flag', () => {
    run(['sofa', '--platelets', '90', '--gcs', '13', '--infection', '--json']);
    const result = JSON.parse(stdout);
    expect(result.sepsis).toBe(true); // score 3 >= 2
  });

  it('does not assess sepsis without --infection flag', () => {
    run(['sofa', '--platelets', '90', '--gcs', '13', '--json']);
    const result = JSON.parse(stdout);
    expect(result.sepsis).toBeUndefined();
  });

  it('assesses septic shock with --infection + --lactate + vasopressors', () => {
    run(['sofa', '--platelets', '90', '--gcs', '13', '--dopamine', '10', '--infection', '--lactate', '4', '--json']);
    const result = JSON.parse(stdout);
    expect(result.sepsis).toBe(true);
    expect(result.septicShock).toBe(true);
    expect(result.lactate).toBe(4);
  });

  it('ventilation flag affects respiration scoring', () => {
    // PaO2/FiO2 = 80/(80/100) = 100 → without vent = 2, with vent = 4
    run(['sofa', '--pao2', '80', '--fio2', '80', '--json']);
    const withoutVent = JSON.parse(stdout);

    stdout = '';
    run(['sofa', '--pao2', '80', '--fio2', '80', '--ventilation', '--json']);
    const withVent = JSON.parse(stdout);

    expect(withVent.score).toBeGreaterThan(withoutVent.score);
  });
});

// ── qSOFA ──────────────────────────────────────────────

describe('medprotocol sepsis qsofa', () => {
  it('calculates qSOFA score', () => {
    run(['qsofa', '--rr', '24', '--sbp', '90', '--gcs', '13']);
    expect(stdout).toContain('Quick SOFA');
    expect(stdout).toContain('/3');
  });

  it('outputs JSON with --json flag', () => {
    run(['qsofa', '--rr', '24', '--sbp', '90', '--gcs', '13', '--json']);
    const result = JSON.parse(stdout);
    expect(result.score).toBe(3); // RR>=22, SBP<=100, GCS<15
    expect(result.positive).toBe(true);
  });

  it('scores 0 for normal vitals', () => {
    run(['qsofa', '--rr', '16', '--sbp', '120', '--gcs', '15', '--json']);
    const result = JSON.parse(stdout);
    expect(result.score).toBe(0);
    expect(result.positive).toBe(false);
  });

  it('positive qSOFA when score >= 2', () => {
    run(['qsofa', '--rr', '24', '--sbp', '90', '--gcs', '15', '--json']);
    const result = JSON.parse(stdout);
    expect(result.score).toBe(2);
    expect(result.positive).toBe(true);
  });

  it('errors when --rr is missing', () => {
    run(['qsofa', '--sbp', '90', '--gcs', '13']);
    expect(stderr).toContain('--rr');
    expect(process.exitCode).toBe(1);
  });

  it('errors when --sbp is missing', () => {
    run(['qsofa', '--rr', '24', '--gcs', '13']);
    expect(stderr).toContain('--sbp');
    expect(process.exitCode).toBe(1);
  });

  it('errors when --gcs is missing', () => {
    run(['qsofa', '--rr', '24', '--sbp', '90']);
    expect(stderr).toContain('--gcs');
    expect(process.exitCode).toBe(1);
  });
});

// ── Lactate ────────────────────────────────────────────

describe('medprotocol sepsis lactate', () => {
  it('calculates lactate clearance', () => {
    run(['lactate', '--initial', '4.2', '--repeat', '2.1']);
    expect(stdout).toContain('Lactate Clearance');
    expect(stdout).toContain('50.0%');
    expect(stdout).toContain('Yes');
  });

  it('outputs JSON with --json flag', () => {
    run(['lactate', '--initial', '4.0', '--repeat', '2.0', '--json']);
    const result = JSON.parse(stdout);
    expect(result.clearance).toBe(50);
    expect(result.adequate).toBe(true);
  });

  it('shows inadequate clearance', () => {
    run(['lactate', '--initial', '4.0', '--repeat', '3.8', '--json']);
    const result = JSON.parse(stdout);
    expect(result.clearance).toBe(5);
    expect(result.adequate).toBe(false);
  });

  it('handles negative clearance (worsening)', () => {
    run(['lactate', '--initial', '2.0', '--repeat', '4.0', '--json']);
    const result = JSON.parse(stdout);
    expect(result.clearance).toBe(-100);
    expect(result.adequate).toBe(false);
  });

  it('errors when --initial is missing', () => {
    run(['lactate', '--repeat', '2.0']);
    expect(stderr).toContain('--initial');
    expect(process.exitCode).toBe(1);
  });

  it('errors when --repeat is missing', () => {
    run(['lactate', '--initial', '4.0']);
    expect(stderr).toContain('--repeat');
    expect(process.exitCode).toBe(1);
  });
});
