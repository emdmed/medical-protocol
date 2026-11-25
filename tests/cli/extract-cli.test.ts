import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { calculations, run } from '../../packages/medprotocol/src/commands/extract';
import { checkExtraction } from '../../plugin/lib/extraction';

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

  it('rejects an absent finding with a key', () => {
    const bad = join(dir, 'absentkey.json');
    writeFileSync(bad, JSON.stringify([{ episode: 'current', field: 'HR', key: 'hr', value: '88', quote: 'HR 88 bpm', absent: true }]));
    run(['--note', notePath, '--items', bad]);
    expect(process.exitCode).toBe(1);
    expect(stderr).toContain('an absent finding takes no key');
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

  it('gives the same note one folder whatever its line endings, and removes a staging copy', () => {
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      mkdirSync('extractions', { recursive: true });
      writeFileSync('extractions/pasted.md', 'HR 88\r\nBP 120/80\r\n');
      run(['--save', 'extractions/pasted.md', '--json']);
      const first = JSON.parse(stdout);
      expect(existsSync('extractions/pasted.md')).toBe(false);
      expect(readFileSync(join(first.dir, 'note.md'), 'utf8')).toBe('HR 88\r\nBP 120/80\r\n');
      writeFileSync(join(dir, 'lf.md'), 'HR 88\nBP 120/80');
      stdout = '';
      run(['--save', join(dir, 'lf.md'), '--json']);
      expect(JSON.parse(stdout)).toEqual({ dir: first.dir, existed: true });
      expect(existsSync(join(dir, 'lf.md'))).toBe(true);
    } finally {
      process.chdir(cwd);
    }
  });

  it('rejects --save mixed with other options', () => {
    run(['--save', notePath, '--note', notePath]);
    expect(process.exitCode).toBe(1);
  });

  it('refuses --serve with --note', () => {
    run(['--serve', '--note', notePath]);
    expect(process.exitCode).toBe(1);
    expect(stderr).toContain('--serve takes no other options but --port');
  });

  it('reports an unwritable --artifact path instead of crashing', () => {
    run(['--note', notePath, '--items', itemsPath, '--artifact', join(dir, 'missing', 'a.html')]);
    expect(process.exitCode).toBe(1);
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

describe('calculations', () => {
  const note = 'Weight 70 kg, height 175 cm. pH 7.25, pCO2 30 mmHg, HCO3 14 mEq/L. PaO2 60 mmHg on FiO2 40%. Last year: weight 90 kg.';
  const cur = (field: string, key: string, value: string, quote: string, unit?: string) => ({ episode: 'current' as const, field, key: key as any, value, quote, ...(unit ? { unit } : {}) });
  const items = [
    cur('Weight', 'weight', '70', 'Weight 70 kg', 'kg'),
    cur('Height', 'height', '175', 'height 175 cm', 'cm'),
    cur('pH', 'ph', '7.25', 'pH 7.25'),
    cur('pCO2', 'pco2', '30', 'pCO2 30 mmHg', 'mmHg'),
    cur('HCO3', 'hco3', '14', 'HCO3 14 mEq/L', 'mEq/L'),
    cur('PaO2', 'pao2', '60', 'PaO2 60 mmHg', 'mmHg'),
    cur('FiO2', 'fio2', '40', 'FiO2 40%', '%'),
    { ...cur('Weight', 'weight', '90', 'weight 90 kg', 'kg'), episode: 'history' as const },
  ];

  it('runs each calculator its inputs allow, pointing back at the items used', () => {
    const calcs = calculations(checkExtraction(note, items));
    expect(calcs.map((c) => c.title)).toEqual(['Body mass index', 'PaO2/FiO2', 'Acid-base']);
    expect(calcs[0]).toMatchObject({ scales: [{ label: 'BMI', value: '22.9', unit: 'kg/m²', cuts: [18.5, 25, 30, 35, 40], at: 1, band: 'Normal' }], uses: [0, 1] });
    expect(calcs[1]).toMatchObject({ scales: [{ value: '150', min: 0, max: 500, cuts: [100, 200, 300], at: 1, band: 'Berlin moderate range' }], uses: [5, 6] });
    expect(calcs[2].scales.map((s) => [s.label, s.at, s.ref])).toEqual([['pH', 0, 1], ['pCO2', 0, 1], ['Bicarbonate', 0, 1]]);
    expect(calcs[2].rows[0]).toEqual(['Disorder', 'Metabolic Acidosis']);
    expect(calcs[2].uses).toEqual([2, 3, 4]);
  });

  it('stretches a scale to hold a value beyond its ends', () => {
    const far = items.map((it, i) => (i === 5 ? { ...it, value: '590', quote: 'PaO2' } : it));
    const [s] = calculations(checkExtraction(note.replace('PaO2 60', 'PaO2 590'), far.map((it, i) => (i === 5 ? { ...it, quote: 'PaO2 590 mmHg' } : it))))[1].scales;
    expect(s).toMatchObject({ value: '1475', at: 3, band: 'Normal', min: 0 });
    expect(s.max).toBeGreaterThan(1475);
  });

  it('calculates nothing from a value that is not verified, has no unit to tell the system, or is repeated', () => {
    const drop = (n: number, change: object) => calculations(checkExtraction(note, items.map((it, i) => (i === n ? { ...it, ...change } : it)))).map((c) => c.title);
    expect(drop(0, { quote: 'Weight 71 kg' })).not.toContain('Body mass index');
    expect(drop(1, { unit: undefined })).not.toContain('Body mass index');
    expect(drop(1, { unit: 'in' })).not.toContain('Body mass index');
    expect(drop(7, { episode: 'current' })).not.toContain('Body mass index');
  });

  it('stages CKD from a stated eGFR per 1.73 m² and an ACR in mg/g', () => {
    const ckd = (egfrUnit?: string, egfr = '30', acr = '420') => calculations(checkExtraction(`eGFR ${egfr} mL/min/1.73m², ACR ${acr} mg/g. BP 148/86 mmHg.`, [
      cur('eGFR', 'egfr', egfr, `eGFR ${egfr}`, egfrUnit),
      cur('ACR', 'acr', acr, `ACR ${acr} mg/g`, 'mg/g'),
      cur('Systolic', 'sbp', '148', 'BP 148/86 mmHg', 'mmHg'),
      cur('Diastolic', 'dbp', '86', 'BP 148/86 mmHg', 'mmHg'),
    ]));
    expect(ckd('mL/min/1.73m²')).toMatchObject([
      { title: 'CKD staging', rows: [['Stage', 'G3b A3'], ['Risk level', 'deep-red'], ['Monitoring', '3', 'times a year']], scales: [{ cuts: [15, 30, 45, 60, 90], at: 2 }, { cuts: [30, 300], at: 2 }], uses: [0, 1] },
      { title: 'Blood pressure in CKD', rows: [['Reading', '148/86', 'mmHg'], ['Against target', 'Uncontrolled']], uses: [2, 3] },
    ]);
    expect(ckd('mL/min')).toEqual([]);
    expect(ckd()).toEqual([]);
    // G1 A1: staged, but the CKD blood pressure target does not apply
    expect(ckd('mL/min/1.73m²', '95', '10').map((c) => c.title)).toEqual(['CKD staging']);
  });

  it('works out eGFR, kidney failure risk and anemia once age and sex are stated', () => {
    const note = '67-year-old woman. Creatinine 1.8 mg/dL, ACR 420 mg/g, hemoglobin 10.8 g/dL.';
    const items = [
      cur('Age', 'age', '67', '67-year-old'),
      cur('Sex', 'sex', 'female', '67-year-old woman'),
      cur('Creatinine', 'creatinine', '1.8', 'Creatinine 1.8 mg/dL', 'mg/dL'),
      cur('ACR', 'acr', '420', 'ACR 420 mg/g', 'mg/g'),
      cur('Hb', 'hb', '10.8', 'hemoglobin 10.8 g/dL', 'g/dL'),
    ];
    const calcs = calculations(checkExtraction(note, items));
    expect(calcs.map((c) => c.title)).toEqual(['eGFR from creatinine', 'CKD staging', 'Kidney failure risk (KFRE)', 'Anemia in CKD']);
    expect(calcs[0]).toMatchObject({ scales: [{ value: '30', at: 2 }], uses: [2, 0, 1] });
    // no eGFR in the note: staged from the calculated one, and it says so
    expect(calcs[1]).toMatchObject({ rows: [['Stage', 'G3b A3'], ['Risk level', 'deep-red'], ['Monitoring', '3', 'times a year']], scales: [{ label: 'eGFR, calculated' }, { label: 'ACR' }], uses: [2, 0, 1, 3] });
    expect(calcs[2].rows).toEqual([['In 2 years', '4.6', '%'], ['In 5 years', '16.7', '%']]);
    expect(calcs[3].rows[1]).toEqual(['Anemia', 'Yes, mild']);
    // a sex the quote does not state feeds nothing
    expect(calculations(checkExtraction(note, items.map((it, i) => (i === 1 ? { ...it, value: 'male' } : it))))).toEqual([]);
  });

  it('stages an ACR in mg/mmol in its own unit and converts it only for KFRE', () => {
    const calcs = calculations(checkExtraction('67-year-old woman. eGFR 30 mL/min/1.73m², ACR 3 mg/mmol.', [
      cur('Age', 'age', '67', '67-year-old'),
      cur('Sex', 'sex', 'female', '67-year-old woman'),
      cur('eGFR', 'egfr', '30', 'eGFR 30', 'mL/min/1.73m²'),
      cur('ACR', 'acr', '3', 'ACR 3 mg/mmol', 'mg/mmol'),
    ]));
    expect(calcs[0]).toMatchObject({ title: 'CKD staging', scales: [{}, { value: '3', unit: 'mg/mmol', cuts: [3, 30], at: 1 }] });
    expect(calcs[0].rows[0]).toEqual(['Stage', 'G3b A2']);
    expect(calcs[1].rows[2]).toEqual(['ACR, converted', '26.5', 'mg/g (note: 3 mg/mmol)']);
  });

  it('converts a value in another unit first, and shows what the note states', () => {
    const note = '67-year-old woman. Creatinine 159 µmol/L. PaO2 8 kPa on FiO2 0.4.';
    const calcs = calculations(checkExtraction(note, [
      cur('Age', 'age', '67', '67-year-old'),
      cur('Sex', 'sex', 'female', '67-year-old woman'),
      cur('Creatinine', 'creatinine', '159', 'Creatinine 159 µmol/L', 'µmol/L'),
      cur('PaO2', 'pao2', '8', 'PaO2 8 kPa', 'kPa'),
      cur('FiO2', 'fio2', '0.4', 'FiO2 0.4'),
    ]));
    expect(calcs).toMatchObject([
      { title: 'PaO2/FiO2', rows: [['PaO2, converted', '60', 'mmHg (note: 8 kPa)'], ['FiO2, converted', '40', '% (note: 0.4)']], scales: [{ value: '150' }] },
      // 159 / 88.4 = 1.80 mg/dL: the same eGFR as the note in mg/dL above
      { title: 'eGFR from creatinine', rows: [['Creatinine, converted', '1.8', 'mg/dL (note: 159 µmol/L)']], scales: [{ value: '30' }] },
    ]);
  });
});
