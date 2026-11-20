import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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

  it('writes the page with the checked items and note segments, safe against </script>', () => {
    const note = join(dir, 'adm-1.md');
    writeFileSync(note, 'HR 88 bpm. </script><b>');
    const out = join(dir, 'page.html');
    run(['--note', note, '--items', itemsPath, '--artifact', out]);
    const html = readFileSync(out, 'utf8');
    expect(html).toContain('<title>adm-1 extraction</title>');
    expect(html.match(/<\/script>/g)).toHaveLength(2);
    const data = JSON.parse(html.match(/<script type="application\/json" id="data">(.*?)<\/script>/s)![1]);
    expect(data.name).toBe('adm-1');
    expect(data.items[0].status).toBe('quoted');
    expect(data.segments.map((s: any) => s.text).join('')).toBe('HR 88 bpm. </script><b>');
  });

  it('saves a note under the hash of its bytes, once', () => {
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      run(['--save', notePath, '--json']);
      const hash = createHash('sha256').update('BP 120/80, HR 88 bpm.').digest('hex').slice(0, 12);
      expect(JSON.parse(stdout)).toEqual({ dir: join('extractions', hash), existed: false });
      expect(readFileSync(join('extractions', hash, 'note.md'), 'utf8')).toBe('BP 120/80, HR 88 bpm.');
      stdout = '';
      run(['--save', notePath, '--json']);
      expect(JSON.parse(stdout).existed).toBe(true);
    } finally {
      process.chdir(cwd);
    }
  });

  it('names the page after the hash folder', () => {
    const sub = join(dir, 'extractions', 'abc123def456');
    mkdirSync(sub, { recursive: true });
    writeFileSync(join(sub, 'note.md'), 'HR 88 bpm.');
    const out = join(sub, 'artifact.html');
    run(['--note', join(sub, 'note.md'), '--items', itemsPath, '--artifact', out]);
    expect(readFileSync(out, 'utf8')).toContain('<title>abc123def456 extraction</title>');
  });
});
