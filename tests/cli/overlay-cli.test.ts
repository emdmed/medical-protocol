import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run, normalizeSkill } from '../../packages/medprotocol/src/commands/overlay';

let stdout: string;
let dir: string;

const order = (name: string, action: string) =>
  writeFileSync(join(dir, `${name}.json`), JSON.stringify({ action, selector: 'main', ts: name, status: 'pending' }));
const statusOf = (name: string) => JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8')).status;

beforeEach(() => {
  stdout = '';
  vi.spyOn(process.stdout, 'write').mockImplementation((s: any) => { stdout += s; return true; });
  dir = mkdtempSync(join(tmpdir(), 'mpo-queue-'));
  order('1-audit', 'audit');
  order('2-implement', 'implement');
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(dir, { recursive: true, force: true });
});

describe('medprotocol overlay --drain', () => {
  it('--action claims only that action and leaves the rest pending', () => {
    run(['--drain', '--action', 'audit', '--json', '--dir', dir]);
    expect(JSON.parse(stdout).map((o: any) => o.action)).toEqual(['audit']);
    expect(statusOf('1-audit')).toBe('processing');
    expect(statusOf('2-implement')).toBe('pending');
  });

  it('claims every pending order without --action', () => {
    run(['--drain', '--json', '--dir', dir]);
    expect(JSON.parse(stdout)).toHaveLength(2);
    expect(statusOf('2-implement')).toBe('processing');
  });
});

describe('overlay skill names', () => {
  it('normalizes to a bare skill folder name, never a slash command', () => {
    expect(normalizeSkill('/medical-protocol:overlay-implement')).toBe('overlay-implement');
    expect(normalizeSkill('medical-protocol:modify')).toBe('modify');
    expect(normalizeSkill('modify')).toBe('modify');
    expect(normalizeSkill('../etc')).toBeNull();
    expect(normalizeSkill('other-plugin:x')).toBeNull();
  });
});
