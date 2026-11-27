import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { once } from 'node:events';
import { assess, draftNote, FIRST_LINE, readWant, serve, type AskModel } from '../../packages/medprotocol/src/commands/syndromic';
import { ASSESSMENTS, STORY_NAMES, generateWholePatient, resultOptions, storyPassRate } from '../../packages/medprotocol/src/syndromic-patient';

describe('the synthetic patient generator', () => {
  it('every story meets its expected verdicts on most first draws', () => {
    for (const name of STORY_NAMES) expect(storyPassRate(name, 200), name).toBeGreaterThan(0.5);
  });

  it('a set result gives a patient whose rule says it', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateWholePatient({ shock: 'Hypovolaemic' });
      expect(p.story).toBe('Hypovolaemic shock');
      expect(assess(p.findings)[0].result).toBe('Hypovolemic pattern');
    }
  });

  it('every list keeps "no"; results that do not fit drop out', () => {
    const want = { shock: 'Cardiogenic' };
    expect(resultOptions(want, 'volume')).toEqual(['Overload', 'No overload']);
    expect(resultOptions(want, 'shock')).toContain('Septic');
  });

  it('a "no" no story has with the others is taken from another story, and marked', () => {
    const p = generateWholePatient({ shock: 'Cardiogenic', volume: 'No overload' });
    expect(p.story).toBe('Cardiogenic shock with pulmonary oedema');
    expect(p.mixed).toEqual(['volume']);
    const cards = assess(p.findings);
    expect(cards.map((c) => c.id)).toEqual(ASSESSMENTS.map((a) => a.id));
    expect(cards[1].result).toBe('No volume overload on examination');
  });

  it('readWant refuses unknown assessments and results that do not fit', () => {
    expect(readWant(undefined)).toEqual({});
    expect(readWant({ shock: 'Septic', volume: '' })).toEqual({ shock: 'Septic' });
    expect(readWant({ liver: 'x' })).toMatch(/unknown assessment/);
    expect(readWant({ shock: 'Septic', volume: 'Overload' })).toMatch(/does not fit/);
    expect(readWant([1])).toMatch(/object/);
  });
});

describe('draftNote', () => {
  const findings = { shock: { systolic: '82', skin: 'cool' } };
  it('keeps a note with the first line and every number', async () => {
    const ask = vi.fn<AskModel>().mockResolvedValue(`${FIRST_LINE}\nSBP 82 mmHg, cool peripheries.`);
    expect(await draftNote(findings, 'ed', ask)).toContain('SBP 82');
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('asks once more when a number is rounded, then gives up', async () => {
    const ask = vi.fn<AskModel>().mockResolvedValue(`${FIRST_LINE}\nSBP ~80 mmHg.`);
    expect(await draftNote(findings, 'outpatient', ask)).toBeNull();
    expect(ask).toHaveBeenCalledTimes(2);
  });
});

describe('medprotocol syndromic --serve', () => {
  let server: Server;
  let port: number;
  let ask: AskModel;

  const call = (path: string, body?: unknown, headers: Record<string, string> = {}) =>
    new Promise<{ status: number; json: any; text: string }>((resolve, reject) => {
      const req = request({ host: '127.0.0.1', port, path, method: body === undefined ? 'GET' : 'POST', headers }, (res) => {
        let text = '';
        res.on('data', (d) => (text += d));
        res.on('end', () => {
          let json: any;
          try { json = JSON.parse(text); } catch { json = null; }
          resolve({ status: res.statusCode!, json, text });
        });
      });
      req.on('error', reject);
      req.end(body === undefined ? undefined : JSON.stringify(body));
    });

  beforeEach(async () => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    ask = () => Promise.reject(new Error('not asked in this test'));
    server = serve(0, (s, p) => ask(s, p));
    await once(server, 'listening');
    port = (server.address() as AddressInfo).port;
  });

  afterEach(async () => {
    server.close();
    await once(server, 'close');
    vi.restoreAllMocks();
  });

  it('GET / serves the page, never cached, and its script parses', async () => {
    const res = await call('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>Synthetic patients</title>');
    expect(res.text).toContain('Learning prototype — not for patient care.');
    expect(() => new Function(res.text.match(/<script>([\s\S]*)<\/script>/)![1])).not.toThrow();
  });

  it('refuses another Host and /api calls from another website', async () => {
    expect((await call('/', undefined, { Host: `evil.example:${port}` })).status).toBe(403);
    expect((await call('/api/options', {}, { Origin: 'https://evil.example' })).status).toBe(403);
  });

  it('POST /api/options and /api/patients', async () => {
    const opts = await call('/api/options', { want: { shock: 'Cardiogenic' } });
    expect(opts.json.options.volume).toEqual(['Overload', 'No overload']);
    const p = await call('/api/patients', { want: { shock: 'Septic' } });
    expect(p.status).toBe(200);
    expect(p.json).toMatchObject({ story: 'Septic shock from lobar pneumonia', mixed: [] });
    expect(p.json.code).toMatch(/^[A-Z2-9]{4}$/);
    expect(p.json.cards).toHaveLength(6);
    expect((await call('/api/patients', { want: { shock: 'Septic', volume: 'Overload' } })).status).toBe(400);
  });

  it('POST /api/notes drafts with the chosen tone, and checks its body', async () => {
    ask = async (system) => `${FIRST_LINE}\n${system.includes('outpatient') ? 'Outpatient' : 'ED'} note.`;
    const ok = await call('/api/notes', { findings: { shock: { skin: 'cool' } }, style: 'outpatient' });
    expect(ok.json.note).toContain('Outpatient note.');
    expect((await call('/api/notes', { findings: {}, style: 'poem' })).status).toBe(400);
    expect((await call('/api/notes', { findings: 'x', style: 'ed' })).status).toBe(400);
    expect((await call('/api/nope', {})).status).toBe(404);
  });
});
