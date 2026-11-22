import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serve, stateOf } from '../../packages/medprotocol/src/commands/extract';

const NOTE = 'BP 120/80 on admission. Creatinine 1.4 mg/dL.';
const HASH = '3f9a1c07b2e4';
const DIR = join('extractions', HASH);
const bp = { field: 'Blood pressure', value: '120/80', quote: 'BP 120/80', episode: 'current' };
const creat = { field: 'Creatinine', value: '1.4', unit: 'mg/dL', quote: 'Creatinine 1.4 mg/dL', episode: 'current' };
const wrong = { ...creat, value: '4.1' };

let cwd: string;
let tmp: string;
let server: Server;
let port: number;

const put = (file: string, data: unknown) => writeFileSync(join(DIR, file), JSON.stringify(data));

// node:http, not fetch: fetch does not let a test set the Host header
const get = (path: string, headers: Record<string, string> = {}, body?: string, method = body === undefined ? 'GET' : 'POST') =>
  new Promise<{ status: number; headers: Record<string, unknown>; text: string }>((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path, method, headers }, (res) => {
      let text = '';
      res.on('data', (d) => (text += d));
      res.on('end', () => resolve({ status: res.statusCode!, headers: res.headers, text }));
    });
    req.on('error', reject);
    req.end(body);
  });

beforeEach(async () => {
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  cwd = process.cwd();
  tmp = mkdtempSync(join(tmpdir(), 'mpx-serve-'));
  process.chdir(tmp);
  server = serve(0, () => Promise.reject(new Error('not asked in these tests')));
  await once(server, 'listening');
  port = (server.address() as AddressInfo).port;
  mkdirSync(DIR);
  writeFileSync(join(DIR, 'note.md'), NOTE);
});

afterEach(async () => {
  server.close();
  await once(server, 'close');
  process.chdir(cwd);
  vi.restoreAllMocks();
  rmSync(tmp, { recursive: true, force: true });
});

describe('stateOf', () => {
  it('no extraction.json, run going → extracting, with the note as one plain segment', () => {
    const s = stateOf(DIR, true);
    expect(s).toMatchObject({ id: HASH, name: HASH, state: 'extracting', error: null, note: NOTE, items: [], findings: [] });
    expect(s.segments).toEqual([{ text: NOTE, items: [] }]);
  });

  it('extraction.json without verify.json, run going → verifying', () => {
    put('extraction.json', [bp, wrong]);
    expect(stateOf(DIR, true)).toMatchObject({ state: 'verifying', items: [] });
  });

  it('no verify.json and no run → failed', () => {
    expect(stateOf(DIR, false).state).toBe('failed');
    put('extraction.json', [bp, wrong]);
    expect(stateOf(DIR, false).state).toBe('failed');
  });

  it('a finding still to decide → review, with before, decision and the corrected items checked', () => {
    put('extraction.json', [bp, wrong]);
    put('verify.json', { findings: [{ index: 1, problem: 'digits swapped', correction: creat }, { problem: 'a remark', correction: null }] });
    put('corrected.json', [bp, creat]);
    const s = stateOf(DIR, false);
    expect(s.state).toBe('review');
    expect(s.findings[0]).toMatchObject({ index: 1, before: wrong, decision: null });
    expect(s.findings[1]).toMatchObject({ before: null, decision: null });
    expect(s.items.map((i) => i.status)).toEqual(['quoted', 'quoted']);
    expect(s.segments.some((seg) => seg.items.includes(1))).toBe(true);
  });

  it('a removal (index, no correction) also needs a decision', () => {
    put('extraction.json', [bp, wrong]);
    put('verify.json', { findings: [{ index: 1, problem: 'not in the note', correction: null }] });
    put('corrected.json', [bp]);
    expect(stateOf(DIR, false).state).toBe('review');
  });

  it('every finding decided, only remarks, or none → done', () => {
    put('extraction.json', [bp, wrong]);
    put('corrected.json', [bp, wrong]);
    put('verify.json', { findings: [] });
    expect(stateOf(DIR, false).state).toBe('done');
    put('verify.json', { findings: [{ problem: 'a remark', correction: null }] });
    expect(stateOf(DIR, false).state).toBe('done');
    put('verify.json', { findings: [{ index: 1, problem: 'digits swapped', correction: creat }] });
    put('decisions.json', { 0: 'rejected' });
    expect(stateOf(DIR, false)).toMatchObject({ state: 'done', findings: [{ decision: 'rejected' }] });
  });
});

describe('medprotocol extract --serve', () => {
  it('creates extractions/ and ignores it in git, once', () => {
    expect(readFileSync('.gitignore', 'utf8')).toBe('extractions/\n');
    writeFileSync('.gitignore', 'node_modules/\nextractions/');
    serve(0).close();
    expect(readFileSync('.gitignore', 'utf8')).toBe('node_modules/\nextractions/');
  });

  it('GET / serves the template in live mode, never cached', async () => {
    const res = await get('/');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.text).toContain('<script type="application/json" id="data">{"live":true}</script>');
    expect(res.text).toContain('<title>Note extraction</title>');
  });

  it('refuses a Host that is not this server', async () => {
    expect((await get('/', { Host: `evil.example:${port}` })).status).toBe(403);
    expect((await get('/', { Host: 'localhost:1' })).status).toBe(403);
    expect((await get('/', { Host: `localhost:${port}` })).status).toBe(200);
  });

  it('refuses /api calls from another website', async () => {
    expect((await get(`/api/extractions/${HASH}`, { Origin: 'https://evil.example' })).status).toBe(403);
    expect((await get(`/api/extractions/${HASH}`, { Origin: `http://localhost:${port}` })).status).toBe(200);
  });

  it('GET /api/extractions/<hash> returns the state; failed when no run is going', async () => {
    const res = await get(`/api/extractions/${HASH}`);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(JSON.parse(res.text)).toMatchObject({ id: HASH, state: 'failed', error: null, note: NOTE });
  });

  it('404 for a hash that is not 12 hex, and for a folder without note.md', async () => {
    expect((await get('/api/extractions/..%2F..%2Fetc')).status).toBe(404);
    expect((await get('/api/extractions/3F9A1C07B2E4')).status).toBe(404);
    expect((await get('/api/extractions/000000000000')).status).toBe(404);
  });

  it('413 for a body over 1 MB', async () => {
    const res = await get('/api/notes', { 'Content-Type': 'application/json' }, 'x'.repeat(1_000_001));
    expect(res.status).toBe(413);
  });
});
