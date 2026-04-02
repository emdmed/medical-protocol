import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/abg';

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

describe('medprotocol abg', () => {
  it('analyzes metabolic acidosis', () => {
    run(['--ph', '7.25', '--pco2', '29', '--hco3', '14']);
    expect(stdout).toContain('Metabolic Acidosis');
  });

  it('outputs JSON with --json', () => {
    run(['--ph', '7.25', '--pco2', '29', '--hco3', '14', '--json']);
    const result = JSON.parse(stdout);
    expect(result.disorder).toBe('Metabolic Acidosis');
    expect(result.compensation).toBeDefined();
  });

  it('includes anion gap when Na and Cl provided', () => {
    run(['--ph', '7.25', '--pco2', '29', '--hco3', '14', '--na', '140', '--cl', '105', '--json']);
    const result = JSON.parse(stdout);
    expect(result.anionGap).toBeDefined();
    expect(result.agStatus).toBeDefined();
  });

  it('shows usage with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol abg');
  });

  it('errors when required flags missing', () => {
    run(['--ph', '7.25']);
    expect(stderr).toContain('--pco2');
    expect(stderr).toContain('--hco3');
    expect(process.exitCode).toBe(1);
  });

  it('analyzes respiratory alkalosis', () => {
    run(['--ph', '7.50', '--pco2', '25', '--hco3', '22', '--json']);
    const result = JSON.parse(stdout);
    expect(result.disorder).toBe('Respiratory Alkalosis');
  });

  it('handles chronic flag', () => {
    run(['--ph', '7.32', '--pco2', '60', '--hco3', '31', '--chronic', '--json']);
    const result = JSON.parse(stdout);
    expect(result.disorder).toBe('Respiratory Acidosis');
  });
});
