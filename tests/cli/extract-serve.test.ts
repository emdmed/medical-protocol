import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serve, stateOf, type AskModel } from '../../packages/medprotocol/src/commands/extract';

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
let ask: AskModel;
const argv1 = process.argv[1];

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
  // the job reads extraction.md from beside the built CLI
  process.argv[1] = join(cwd, 'plugin/scripts/medprotocol.cjs');
  ask = () => Promise.reject(new Error('not asked in this test'));
  server = serve(0, (prompt) => ask(prompt));
  await once(server, 'listening');
  port = (server.address() as AddressInfo).port;
  mkdirSync(DIR);
  writeFileSync(join(DIR, 'note.md'), NOTE);
});

afterEach(async () => {
  server.close();
  await once(server, 'close');
  process.chdir(cwd);
  process.argv[1] = argv1;
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
    expect(res.text).toContain('Paste the note here');
    // the page script at least parses; what it draws is checked by hand in a browser
    expect(() => new Function(res.text.match(/<script>([\s\S]*)<\/script>/)![1])).not.toThrow();
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

  it('GET /api/extractions lists the saved notes, skipping folders that are not one', async () => {
    mkdirSync(join('extractions', 'not-a-note'));
    mkdirSync(join('extractions', '000000000000'));
    expect(JSON.parse((await get('/api/extractions')).text)).toMatchObject([{ id: HASH, state: 'failed', first: NOTE.trim().split('\n')[0].slice(0, 80) }]);
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

describe('POST /api/notes and the model job', () => {
  // NOTE has no line endings to even out, so this is the --save hash
  const ID = createHash('sha256').update(NOTE).digest('hex').slice(0, 12);
  const dir = join('extractions', ID);
  const file = (name: string) => JSON.parse(readFileSync(join(dir, name), 'utf8'));
  const post = (body: unknown) => get('/api/notes', {}, JSON.stringify(body));
  const state = async () => JSON.parse((await get(`/api/extractions/${ID}`)).text);
  const settled = async () => {
    for (;;) {
      const s = await state();
      if (s.state !== 'extracting' && s.state !== 'verifying') return s;
      await new Promise((r) => setTimeout(r, 5));
    }
  };
  /** A model that gives these replies in order. */
  const replies = (...texts: string[]) => {
    const fake = vi.fn(async () => texts.shift() ?? 'no reply left');
    ask = fake;
    return fake;
  };
  const fix = { findings: [{ index: 1, problem: 'digits swapped', correction: creat }] };

  it('without consent or without a note → 400 and nothing written', async () => {
    expect((await post({ note: NOTE })).status).toBe(400);
    expect((await post({ note: NOTE, consent: 'yes' })).status).toBe(400);
    expect((await post({ note: '  \n', consent: true })).status).toBe(400);
    expect((await get('/api/notes', {}, 'not json')).status).toBe(400);
    expect(readdirSync('extractions')).toEqual([HASH]);
  });

  it('with consent: saves the note under the --save hash, then extracting → verifying → review', async () => {
    const asked: { prompt: string; reply: (text: string) => void }[] = [];
    ask = (prompt) => new Promise((reply) => asked.push({ prompt, reply }));
    const res = await post({ note: NOTE, consent: true });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.text)).toEqual({ id: ID });
    expect(readFileSync(join(dir, 'note.md'), 'utf8')).toBe(NOTE);
    expect(new Date(readFileSync(join(dir, '.consent'), 'utf8').trim()).getTime()).not.toBeNaN();
    expect(process.stdout.write).toHaveBeenCalledWith(`http://localhost:${port}/#${ID}\n`);

    expect((await state()).state).toBe('extracting');
    expect(asked[0].prompt).toContain('# Extraction Module Context');
    expect(asked[0].prompt).toContain(NOTE);
    asked[0].reply(JSON.stringify([bp, wrong]));
    await vi.waitFor(() => expect(asked).toHaveLength(2));
    expect((await state()).state).toBe('verifying');
    expect(asked[1].prompt).toContain('"status": "mismatched"');
    asked[1].reply(JSON.stringify(fix));

    const s = await settled();
    expect(s).toMatchObject({ state: 'review', error: null, findings: [{ index: 1, before: wrong }] });
    expect(file('extraction.json')).toEqual([bp, wrong]);
    expect(file('verify.json')).toEqual(fix);
    expect(file('corrected.json')).toEqual([bp, creat]);
  });

  it('reads a reply wrapped in a code fence', async () => {
    replies('```json\n' + JSON.stringify([bp, creat]) + '\n```', '```\n{"findings":[]}\n```\n');
    await post({ note: NOTE, consent: true });
    expect((await settled()).state).toBe('done');
    expect(file('extraction.json')).toEqual([bp, creat]);
  });

  it('an unknown key in the first pass → failed, no extraction.json', async () => {
    replies(JSON.stringify([{ ...bp, key: 'blood_pressure' }]));
    await post({ note: NOTE, consent: true });
    const s = await settled();
    expect(s.state).toBe('failed');
    expect(s.error).toMatch(/^The model's answer was not valid: unknown key "blood_pressure"/);
    expect(existsSync(join(dir, 'extraction.json'))).toBe(false);
  });

  it('a reply that is not JSON → failed; posting the note again reruns', async () => {
    const fake = replies('Here are the items you asked for.', JSON.stringify([bp, creat]), '{"findings":[]}');
    await post({ note: NOTE, consent: true });
    expect(await settled()).toMatchObject({ state: 'failed', error: "The model's answer was not valid: not JSON" });
    await post({ note: NOTE, consent: true });
    expect(await settled()).toMatchObject({ state: 'done', error: null });
    expect(fake).toHaveBeenCalledTimes(3);
  });

  it('a correction that is not in the note word for word is kept as a remark', async () => {
    const made = { ...creat, quote: 'Creatinine of 1.4 mg/dL' };
    replies(JSON.stringify([bp, wrong]), JSON.stringify({ findings: [{ index: 1, problem: 'digits swapped', correction: made }] }));
    await post({ note: NOTE, consent: true });
    expect((await settled()).state).toBe('done');
    expect(file('verify.json')).toEqual({ findings: [{ problem: 'digits swapped (no verbatim quote found)', correction: null }] });
    expect(file('corrected.json')).toEqual([bp, wrong]);
  });

  it('a finding about an item outside the first pass → failed, nothing written', async () => {
    replies(JSON.stringify([bp, wrong]), JSON.stringify({ findings: [{ index: 2, problem: 'not in the note', correction: null }] }));
    await post({ note: NOTE, consent: true });
    const s = await settled();
    expect(s.state).toBe('failed');
    expect(s.error).toBe("The model's answer was not valid: index 2 is not in the first pass");
    expect(existsSync(join(dir, 'verify.json'))).toBe(false);
    expect(existsSync(join(dir, 'corrected.json'))).toBe(false);
  });

  it('an existing extraction.json is not rewritten: only the check is asked for', async () => {
    mkdirSync(dir);
    writeFileSync(join(dir, 'note.md'), NOTE);
    writeFileSync(join(dir, 'extraction.json'), JSON.stringify([bp, wrong]));
    const fake = replies(JSON.stringify(fix));
    await post({ note: NOTE, consent: true });
    expect((await settled()).state).toBe('review');
    expect(fake).toHaveBeenCalledTimes(1);
    expect(readFileSync(join(dir, 'extraction.json'), 'utf8')).toBe(JSON.stringify([bp, wrong]));
  });

  it('a finished note posted again does not ask the model', async () => {
    const fake = replies(JSON.stringify([bp, creat]), '{"findings":[]}');
    await post({ note: NOTE, consent: true });
    await settled();
    expect((await post({ note: NOTE + '\r\n', consent: true })).text).toBe(JSON.stringify({ id: ID }));
    expect((await settled()).state).toBe('done');
    expect(fake).toHaveBeenCalledTimes(2);
  });
});

describe('POST /api/extractions/<hash>/decisions', () => {
  const file = (name: string) => JSON.parse(readFileSync(join(DIR, name), 'utf8'));
  const decide = async (body: unknown) => {
    const res = await get(`/api/extractions/${HASH}/decisions`, {}, JSON.stringify(body));
    return { status: res.status, body: JSON.parse(res.text) };
  };
  const reviewed = () => {
    put('extraction.json', [bp, wrong]);
    put('verify.json', { findings: [{ index: 1, problem: 'digits swapped', correction: creat }, { index: 0, problem: 'not this patient', correction: null }] });
    put('corrected.json', [creat]);
  };

  it('state becomes done once every finding is decided', async () => {
    reviewed();
    expect(await decide({ finding: 0, decision: 'accepted' })).toMatchObject({ status: 200, body: { id: HASH, state: 'review', error: null } });
    const res = await decide({ finding: 1, decision: 'accepted' });
    expect(res.body).toMatchObject({ state: 'done', findings: [{ decision: 'accepted' }, { decision: 'accepted' }] });
    expect(res.body.items.map((i: { value: string }) => i.value)).toEqual(['1.4']);
  });

  it('rejecting puts the first-pass item back; accepting again restores the correction', async () => {
    reviewed();
    await decide({ finding: 0, decision: 'rejected' });
    expect(file('corrected.json')).toEqual([wrong]);
    expect(file('decisions.json')).toEqual({ 0: 'rejected' });
    await decide({ finding: 1, decision: 'rejected' });
    expect(file('corrected.json')).toEqual([bp, wrong]);
    await decide({ finding: 0, decision: 'accepted' });
    expect(file('corrected.json')).toEqual([bp, creat]);
    expect(file('decisions.json')).toEqual({ 0: 'accepted', 1: 'rejected' });
  });

  it('before verify.json → 409, nothing written', async () => {
    put('extraction.json', [bp, wrong]);
    expect((await decide({ finding: 0, decision: 'accepted' })).status).toBe(409);
    expect(existsSync(join(DIR, 'decisions.json'))).toBe(false);
  });

  it('a bad finding position, decision or body → 400, nothing written', async () => {
    reviewed();
    for (const body of [{ finding: 2, decision: 'accepted' }, { finding: -1, decision: 'accepted' }, { finding: '0', decision: 'accepted' }, { finding: 0, decision: 'maybe' }, null]) {
      expect((await decide(body)).status).toBe(400);
    }
    expect((await get(`/api/extractions/${HASH}/decisions`, {}, 'not json')).status).toBe(400);
    expect(existsSync(join(DIR, 'decisions.json'))).toBe(false);
    expect(file('corrected.json')).toEqual([creat]);
  });

  it('404 for a note that is not saved, and for GET', async () => {
    expect((await get('/api/extractions/000000000000/decisions', {}, '{}')).status).toBe(404);
    expect((await get(`/api/extractions/${HASH}/decisions`)).status).toBe(404);
  });
});
