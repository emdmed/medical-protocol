import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fail, requireFlags, runSubcommand } from '../../packages/medprotocol/src/cli';

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

describe('runSubcommand', () => {
  const calls: [string, string[], boolean][] = [];
  const subcommands = {
    a: (argv: string[], json: boolean) => { calls.push(['a', argv, json]); },
    b: (argv: string[], json: boolean) => { calls.push(['b', argv, json]); },
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

  it('passes the remaining args, with json only when --json is among them', () => {
    runSubcommand(['a', '--x', '1'], 'U', subcommands);
    runSubcommand(['b', '--json', '--x'], 'U', subcommands);
    expect(calls).toEqual([['a', ['--x', '1'], false], ['b', ['--json', '--x'], true]]);
    expect(stdout + stderr).toBe('');
  });
});
