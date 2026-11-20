import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from '../../packages/medprotocol/src/commands/extract';

let stdout: string;
let stderr: string;
const dir = mkdtempSync(join(tmpdir(), 'extract-cli-'));
const notePath = join(dir, 'note.txt');
const itemsPath = join(dir, 'items.json');
writeFileSync(notePath, 'BP 120/80, HR 88 bpm.');
writeFileSync(itemsPath, JSON.stringify([
  { episode: 'current', field: 'Heart rate', key: 'hr', value: '88', unit: 'bpm', quote: 'HR 88 bpm' },
  { episode: 'current', field: 'SpO2', value: '95', quote: 'SpO2 95%' },
]));

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

describe('medprotocol extract', () => {
  it('reports each item status as JSON', () => {
    run(['--note', notePath, '--items', itemsPath, '--json']);
    const result = JSON.parse(stdout);
    expect(result.items.map((i: any) => i.status)).toEqual(['quoted', 'unverified']);
    expect(result.counts.quoted).toBe(1);
    expect(result.inputs.hr).toEqual({ value: 88, unit: 'bpm', quote: 'HR 88 bpm' });
  });

  it('prints a table', () => {
    run(['--note', notePath, '--items', itemsPath]);
    expect(stdout).toContain('Extraction vs note');
    expect(stdout).toContain('unverified');
  });

  it('errors without --note', () => {
    run(['--items', itemsPath]);
    expect(process.exitCode).toBe(1);
    expect(stderr).toContain('--note and --items are required');
  });

  it('rejects an unknown key', () => {
    const bad = join(dir, 'badkey.json');
    writeFileSync(bad, JSON.stringify([{ episode: 'current', field: 'HR', key: 'pulse', value: '88', quote: 'HR 88 bpm' }]));
    run(['--note', notePath, '--items', bad]);
    expect(process.exitCode).toBe(1);
    expect(stderr).toContain('unknown key "pulse"');
  });

  it('rejects an item without an episode tag', () => {
    const bad = join(dir, 'noepisode.json');
    writeFileSync(bad, JSON.stringify([{ field: 'HR', value: '88', quote: 'HR 88 bpm' }]));
    run(['--note', notePath, '--items', bad]);
    expect(process.exitCode).toBe(1);
    expect(stderr).toContain('needs episode "current" or "history"');
  });

  it('rejects items that are not the expected shape', () => {
    const bad = join(dir, 'bad.json');
    writeFileSync(bad, JSON.stringify([{ episode: 'current', field: 'HR', value: 88 }]));
    run(['--note', notePath, '--items', bad]);
    expect(process.exitCode).toBe(1);
  });
});
