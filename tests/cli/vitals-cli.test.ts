import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/vitals';

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

describe('medprotocol vitals', () => {
  it('evaluates normal BP', () => {
    run(['--bp', '120/80', '--json']);
    const result = JSON.parse(stdout);
    expect(result.bloodPressure.category).toBe('Normal');
    expect(result.bloodPressure.systolic).toBe(120);
    expect(result.bloodPressure.diastolic).toBe(80);
  });

  it('detects high BP', () => {
    run(['--bp', '150/95', '--json']);
    const result = JSON.parse(stdout);
    expect(result.bloodPressure.category).toBe('High');
  });

  it('detects elevated heart rate', () => {
    run(['--hr', '110', '--json']);
    const result = JSON.parse(stdout);
    expect(result.heartRate.category).toBe('Elevated');
  });

  it('detects normal heart rate', () => {
    run(['--hr', '72', '--json']);
    const result = JSON.parse(stdout);
    expect(result.heartRate.category).toBe('Normal');
  });

  it('detects elevated respiratory rate', () => {
    run(['--rr', '22', '--json']);
    const result = JSON.parse(stdout);
    expect(result.respiratoryRate.category).toBe('Elevated');
  });

  it('detects fever in Celsius', () => {
    run(['--temp', '39.0', '--json']);
    const result = JSON.parse(stdout);
    expect(result.temperature.status).toBe('fever');
    expect(result.temperature.unit).toBe('°C');
  });

  it('detects fever in Fahrenheit', () => {
    run(['--temp', '101.5', '--fahrenheit', '--json']);
    const result = JSON.parse(stdout);
    expect(result.temperature.status).toBe('fever');
    expect(result.temperature.unit).toBe('°F');
  });

  it('evaluates SpO2 severity', () => {
    run(['--spo2', '88', '--json']);
    const result = JSON.parse(stdout);
    expect(result.bloodOxygen.severity).toBe('critical');
  });

  it('calculates SpO2/FiO2 ratio', () => {
    run(['--spo2', '92', '--fio2', '40', '--json']);
    const result = JSON.parse(stdout);
    expect(result.bloodOxygen.spO2FiO2Ratio).toBeDefined();
    expect(result.bloodOxygen.fio2).toBe(40);
  });

  it('handles multiple vitals at once', () => {
    run(['--bp', '120/80', '--hr', '72', '--rr', '16', '--temp', '37.0', '--json']);
    const result = JSON.parse(stdout);
    expect(result.bloodPressure).toBeDefined();
    expect(result.heartRate).toBeDefined();
    expect(result.respiratoryRate).toBeDefined();
    expect(result.temperature).toBeDefined();
  });

  it('shows human-readable output by default', () => {
    run(['--bp', '120/80', '--hr', '72']);
    expect(stdout).toContain('Vital Signs');
    expect(stdout).toContain('120/80');
    expect(stdout).toContain('72 bpm');
  });

  it('shows usage with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol vitals');
  });

  it('errors when no vitals provided', () => {
    run([]);
    expect(stderr).toContain('At least one vital sign');
    expect(process.exitCode).toBe(1);
  });

  it('errors on invalid BP format', () => {
    run(['--bp', '120']);
    expect(stderr).toContain('systolic/diastolic');
    expect(process.exitCode).toBe(1);
  });

  it('errors when --fio2 provided without --spo2', () => {
    run(['--fio2', '40']);
    expect(stderr).toContain('--fio2 requires --spo2');
    expect(process.exitCode).toBe(1);
  });
});
