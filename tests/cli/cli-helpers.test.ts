import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fail, parseFlags, printTable, requireFlags, runSubcommand } from '../../packages/medprotocol/src/cli';

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

describe('fail', () => {
  it('prints the error and sets exit code 1', () => {
    fail('x');
    expect(stderr).toBe('Error: x\n');
    expect(process.exitCode).toBe(1);
  });

  it('prints the usage after the error when given', () => {
    fail('x', 'USAGE');
    expect(stderr).toBe('Error: x\n\nUSAGE\n');
    expect(process.exitCode).toBe(1);
  });
});

describe('requireFlags', () => {
  it('reports empty and absent flags in the given order', () => {
    expect(requireFlags({ a: '1', b: '' }, ['a', 'b', 'c'], 'U')).toBe(false);
    expect(stderr).toBe('Error: Missing required flags: --b, --c\n\nU\n');
    expect(process.exitCode).toBe(1);
  });

  it('returns true and prints nothing when all flags are set', () => {
    expect(requireFlags({ a: '1' }, ['a'], 'U')).toBe(true);
    expect(stdout + stderr).toBe('');
    expect(process.exitCode).toBeUndefined();
  });
});

describe('parseFlags', () => {
  const options = { weight: { type: 'string' }, metric: { type: 'boolean', default: false } } as const;

  it('returns the flags, with --json and --help added', () => {
    expect(parseFlags(['--weight', '70', '--json'], options, 'U')).toEqual({ weight: '70', metric: false, json: true, help: false });
    expect(stdout + stderr).toBe('');
  });

  it('finds --json wherever it sits', () => {
    expect(parseFlags(['--json', '--weight', '70'], options, 'U')?.json).toBe(true);
    expect(parseFlags(['--weight', '70'], options, 'U')?.json).toBe(false);
  });

  it('prints the usage and returns null for --help', () => {
    expect(parseFlags(['--weight', '70', '--help'], options, 'U')).toBeNull();
    expect(stdout).toBe('U\n');
    expect(process.exitCode).toBeUndefined();
  });

  it('throws on a flag it was not given', () => {
    expect(() => parseFlags(['--height', '175'], options, 'U')).toThrow(/Unknown option '--height'/);
  });
});

describe('printTable', () => {
  const rows: [string, string][] = [['BMI', '22.9'], ['Category', 'Normal']];

  it('prints the title, underlined, and the aligned rows', () => {
    printTable({ bmi: 22.9 }, false, 'BMI', rows);
    expect(stdout).toBe('\nBMI\n───\n  BMI       22.9\n  Category  Normal\n');
  });

  it('prints only the data with json', () => {
    printTable({ bmi: 22.9 }, true, 'BMI', rows);
    expect(JSON.parse(stdout)).toEqual({ bmi: 22.9 });
  });
});

describe('runSubcommand', () => {
  const calls: [string, string[]][] = [];
  const subcommands = {
    a: (argv: string[]) => { calls.push(['a', argv]); },
    b: (argv: string[]) => { calls.push(['b', argv]); },
  };

  beforeEach(() => { calls.length = 0; });

  it.each([[[]], [['--help']], [['-h']]])('prints usage for %j', (argv) => {
    runSubcommand(argv, 'U', subcommands);
    expect(stdout).toBe('U\n');
    expect(stderr).toBe('');
    expect(process.exitCode).toBeUndefined();
    expect(calls).toEqual([]);
  });

  it('reports an unknown name with the available ones', () => {
    runSubcommand(['x'], 'U', subcommands);
    expect(stderr).toBe('Error: Unknown sub-command: x\n\nAvailable: a, b\n');
    expect(process.exitCode).toBe(1);
  });

  it('treats inherited names like toString as unknown', () => {
    runSubcommand(['toString'], 'U', subcommands);
    expect(stderr).toBe('Error: Unknown sub-command: toString\n\nAvailable: a, b\n');
    expect(process.exitCode).toBe(1);
  });

  it('passes the remaining args to the named sub-command', () => {
    runSubcommand(['a', '--x', '1'], 'U', subcommands);
    runSubcommand(['b', '--json', '--x'], 'U', subcommands);
    expect(calls).toEqual([['a', ['--x', '1']], ['b', ['--json', '--x']]]);
    expect(stdout + stderr).toBe('');
  });
});

describe("mistyped flag", () => {
  it("prints a short error instead of a stack trace", async () => {
    const { spawnSync } = await import("node:child_process");
    const { join } = await import("node:path");
    const r = spawnSync("node", [join(__dirname, "../../plugin/scripts/medprotocol.cjs"), "bmi", "--weight", "70", "--height", "175"], { encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(r.stderr).toBe(`Error: Unknown option '--height'. Run "medprotocol bmi --help" for the options.\n`);
  });
});
