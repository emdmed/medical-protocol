import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/respiratory-failure';

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

describe('medprotocol respiratory-failure', () => {
  it('shows help with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol respiratory-failure');
  });

  it('rejects a finding outside its list', () => {
    run(['--oxygen-support', 'air']);
    expect(stderr).toContain('--oxygen-support must be one of');
    expect(process.exitCode).toBe(1);
  });

  it('rejects a non-numeric rate, and gas numbers without --blood-gas', () => {
    run(['--rr', 'fast']);
    expect(stderr).toContain('--rr must be a number');
    stderr = '';
    run(['--pco2', '60']);
    expect(stderr).toContain('need --blood-gas');
    expect(process.exitCode).toBe(1);
  });

  it('gives separate failure and distress verdicts (human)', () => {
    run(['--oxygen-support', 'room_air', '--spo2', '86', '--rr', '34', '--accessory-muscles', 'present']);
    expect(stdout).toContain('Respiratory failure');
    expect(stdout).toContain('Hypoxaemia');
    expect(stdout).toContain('Respiratory distress');
    expect(stdout).toContain('Accessory muscle use');
    expect(stdout).toContain('Arterial blood gas');
  });

  it('reads a kPa arterial gas as hypercapnic failure without distress (JSON)', () => {
    run(['--blood-gas', 'arterial', '--gas-unit', 'kPa', '--ph', '7.28', '--po2', '9', '--pco2', '8.1', '--hco3', '28',
      '--oxygen-support', 'room_air', '--rr', '12', '--json']);
    const result = JSON.parse(stdout);
    expect(result.failure).toBe('present');
    expect(result.failureReason).toBe('hypercapnia');
    expect(result.distress).toBe('absent');
    expect(result.arterialGas.pco2MmHg).toBe(60.8);
  });

  it('lists a refused saturation under notCalculated instead of failing', () => {
    run(['--spo2', '150', '--json']);
    const result = JSON.parse(stdout);
    expect(process.exitCode).toBeUndefined();
    expect(result.failureReason).toBe('saturation_not_calculated');
    expect(result.notCalculated[0]).toContain('cannot exceed 100%');
    expect(result.distress).toBe('not_assessed');
  });
});
