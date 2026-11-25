import { describe, it, expect } from 'vitest';
import { checkItem, checkExtraction, noteSegments, valueInQuote, toInputs, toExam, readsOk, applyFindings } from '../../plugin/lib/extraction';
import type { ExtractedItem, Finding } from '../../plugin/lib/extraction';

const note = 'Seen on the ward.\nBP 120/80, HR 88 bpm,\ntemp 37,5 °C. Presión arterial estable.\nCreatinine 1.4 mg/dL.';

describe('checkItem', () => {
  it('quotes an exact span and gives its offsets', () => {
    const c = checkItem(note, { episode: 'current', field: 'Heart rate', value: '88', unit: 'bpm', quote: 'HR 88 bpm' });
    expect(c.status).toBe('quoted');
    expect(note.slice(c.start, c.end)).toBe('HR 88 bpm');
    expect(c.ambiguous).toBeUndefined();
  });

  it('matches a quote across a line break and maps offsets to the original note', () => {
    const c = checkItem(note, { episode: 'current', field: 'HR', value: '88', quote: 'HR 88 bpm, temp 37,5' });
    expect(c.status).toBe('quoted');
    expect(note.slice(c.start, c.end)).toBe('HR 88 bpm,\ntemp 37,5');
  });

  it('flags a value the quote does not state', () => {
    expect(checkItem(note, { episode: 'current', field: 'HR', value: '98', quote: 'HR 88 bpm' }).status).toBe('mismatched');
  });

  it('flags a swapped pair', () => {
    expect(checkItem(note, { episode: 'current', field: 'BP', value: '80/120', quote: 'BP 120/80' }).status).toBe('mismatched');
  });

  it('reads a comma decimal', () => {
    expect(checkItem(note, { episode: 'current', field: 'Temp', value: '37.5', quote: 'temp 37,5 °C' }).status).toBe('quoted');
  });

  it('flags case or accent edits apart from absence', () => {
    expect(checkItem(note, { episode: 'current', field: 'BP', value: 'estable', quote: 'presion arterial estable' }).status).toBe('edited');
    expect(checkItem(note, { episode: 'current', field: 'K', value: '4.1', quote: 'K 4.1' }).status).toBe('unverified');
  });

  it('treats an empty quote as none, not a pass', () => {
    expect(checkItem(note, { episode: 'current', field: 'HR', value: '88', quote: '  ' }).status).toBe('none');
  });

  it('marks a quote that occurs twice as ambiguous', () => {
    expect(checkItem('HR 80. Later HR 80.', { episode: 'current', field: 'HR', value: '80', quote: 'HR 80' }).ambiguous).toBe(true);
  });

  it('does not treat regex characters in the quote as patterns', () => {
    const c = checkItem('BP 120/80', { episode: 'current', field: 'BP', value: '120', quote: 'BP 1.0/80' });
    expect(c.status).not.toBe('quoted');
    expect(c.match).toBe('loose');
  });
});

describe('valueInQuote', () => {
  it('accepts a thousands comma both ways', () => {
    expect(valueInQuote('1200', 'output 1,200 mL')).toBe(true);
    expect(valueInQuote('1,200', 'output 1,200 mL')).toBe(true);
  });

  it('accepts a value with no numbers', () => {
    expect(valueInQuote('estable', 'estable')).toBe(true);
  });
});

describe('noteSegments', () => {
  it('joins back to the note and lets overlapping quotes share words', () => {
    const checked = checkExtraction(note, [
      { episode: 'current', field: 'Systolic', value: '120', quote: 'BP 120/80' },
      { episode: 'current', field: 'Diastolic', value: '80', quote: 'BP 120/80' },
      { episode: 'current', field: 'K', value: '4.1', quote: 'K 4.1' },
    ]);
    const segs = noteSegments(note, checked);
    expect(segs.map((s) => s.text).join('')).toBe(note);
    expect(segs.find((s) => s.text === 'BP 120/80')!.items).toEqual([0, 1]);
    expect(segs.flatMap((s) => s.items)).not.toContain(2);
  });

  it('returns the whole note as one plain run with nothing checked', () => {
    expect(noteSegments(note, [])).toEqual([{ text: note, items: [] }]);
  });
});

describe('toInputs', () => {
  const run = (items: Parameters<typeof checkExtraction>[1]) => toInputs(checkExtraction(note, items));

  it('hands on verified numbers by key, with unit and quote', () => {
    const { inputs, review } = run([
      { episode: 'current', field: 'Systolic', key: 'sbp', value: '120', unit: 'mmHg', quote: 'BP 120/80' },
      { episode: 'current', field: 'Diastolic', key: 'dbp', value: '80', quote: 'BP 120/80' },
      { episode: 'current', field: 'Temp', key: 'temp', value: '37,5', unit: '°C', quote: 'temp 37,5 °C' },
      { episode: 'current', field: 'Creatinine', key: 'creatinine', value: '1.4', unit: 'mg/dL', quote: 'Creatinine 1.4 mg/dL' },
    ]);
    expect(review).toEqual([]);
    expect(inputs.sbp).toEqual({ value: 120, unit: 'mmHg', quote: 'BP 120/80' });
    expect(inputs.dbp!.value).toBe(80);
    expect(inputs.temp!.value).toBe(37.5);
    expect(inputs.creatinine!.unit).toBe('mg/dL');
  });

  it('holds back unverified, non-numeric, wrong-unit and repeated readings', () => {
    const { inputs, review } = run([
      { episode: 'current', field: 'HR', key: 'hr', value: '98', quote: 'HR 88 bpm' },
      { episode: 'current', field: 'BP', key: 'sbp', value: '120/80', quote: 'BP 120/80' },
      { episode: 'current', field: 'Creatinine', key: 'creatinine', value: '1.4', unit: 'g/L', quote: 'Creatinine 1.4 mg/dL' },
      { episode: 'current', field: 'K', key: 'potassium', value: '4.1', quote: 'K 4.1' },
    ]);
    expect(inputs).toEqual({});
    expect(review.map((r) => r.reason)).toEqual(['not-verified', 'not-a-number', 'unit', 'not-verified']);

    const twice = toInputs(checkExtraction('HR 80 at 08:00, HR 95 at 14:00', [
      { episode: 'current', field: 'HR', key: 'hr', value: '80', time: '08:00', quote: 'HR 80 at 08:00' },
      { episode: 'current', field: 'HR', key: 'hr', value: '95', time: '14:00', quote: 'HR 95 at 14:00' },
    ]));
    expect(twice.inputs.hr).toBeUndefined();
    expect(twice.review.map((r) => r.reason)).toEqual(['repeated', 'repeated']);
  });

  it('hands on the sex only when the quote has a word for it, and for no other', () => {
    const sexOf = (value: string, quote: string, note = quote) => toInputs(checkExtraction(note, [{ episode: 'current', field: 'Sex', key: 'sex', value, quote }]));
    expect(sexOf('female', '67-year-old woman')).toMatchObject({ inputs: {}, sex: 'female', review: [] });
    expect(sexOf('male', 'Varón de 54 años').sex).toBe('male');
    expect(sexOf('male', '54 y/o M').sex).toBe('male');
    for (const [value, quote] of [['male', '67-year-old woman'], ['woman', '67-year-old woman'], ['female', '67-year-old'], ['female', 'woman, husband is a man']]) {
      const { sex, review } = sexOf(value!, quote!);
      expect(sex).toBeUndefined();
      expect(review[0]!.reason).toBe('not-stated');
    }
  });

  it('does not read an ambiguous thousands comma as a number', () => {
    const { review } = toInputs(checkExtraction('UO 1,200 mL', [{ episode: 'current', field: 'UO', key: 'urine-output', value: '1,200', unit: 'mL', quote: 'UO 1,200 mL' }]));
    expect(review[0]!.reason).toBe('not-a-number');
  });

  it('ignores items without a key', () => {
    expect(toInputs(checkExtraction('Metformin 500 mg', [{ episode: 'current', field: 'Metformin', value: '500 mg', quote: 'Metformin 500 mg' }]))).toEqual({ inputs: {}, review: [] });
  });

  it('keeps history out of inputs and does not count it as a repeat', () => {
    const n = 'Creatinine 1.4 mg/dL today. Creatinine at 2024 discharge 1.3 mg/dL.';
    const { inputs, review } = toInputs(checkExtraction(n, [
      { episode: 'current', field: 'Creatinine', key: 'creatinine', value: '1.4', unit: 'mg/dL', quote: 'Creatinine 1.4 mg/dL today' },
      { episode: 'history', field: 'Creatinine', key: 'creatinine', value: '1.3', unit: 'mg/dL', time: '2024 discharge', quote: 'Creatinine at 2024 discharge 1.3 mg/dL' },
    ]));
    expect(inputs.creatinine!.value).toBe(1.4);
    expect(review).toEqual([]);
  });

  it('never hands on an absent finding, even with a key', () => {
    const { inputs, review } = toInputs(checkExtraction('No fever, temp 38 °C', [
      { episode: 'current', field: 'Fever', key: 'temp', value: '38', unit: '°C', quote: 'temp 38 °C', absent: true },
      { episode: 'current', field: 'Fever', value: 'No fever', quote: 'No fever', absent: true },
    ]));
    expect(inputs).toEqual({});
    expect(review.map((r) => r.reason)).toEqual(['not-a-number']);
  });

  it('sends an untagged item to review instead of inputs', () => {
    const { inputs, review } = toInputs(checkExtraction('HR 88 bpm', [
      { field: 'HR', key: 'hr', value: '88', quote: 'HR 88 bpm' } as never,
    ]));
    expect(inputs).toEqual({});
    expect(review[0]!.reason).toBe('no-episode');
  });
});

describe('loose match', () => {
  const ed = 'Oxygen 4 L/min via nasal cannulae, changed to FiO2 40% via Venturi\nmask at 09:15.';

  it('finds a quote a few characters off, at lower confidence', () => {
    const c = checkItem(ed, { episode: 'current', field: 'Oxygen', value: '4 L/min', quote: 'Oxygen 4 L/min via nasal canulas' });
    expect(c.status).toBe('approximate');
    expect(c.match).toBe('loose');
    expect(c.distance).toBe(2);
    expect(ed.slice(c.start, c.end)).toMatch(/^Oxygen 4 L\/min via nasal cannula/);
  });


  it('accepts up to 5 characters off, not 6', () => {
    const q = 'FiO2 40% via Venturi mask at 09:15';
    expect(checkItem(ed, { episode: 'current', field: 'FiO2', value: '40', quote: q.replace('Venturi', 'Ventxxxx') }).distance).toBe(4);
    expect(checkItem(ed, { episode: 'current', field: 'FiO2', value: '40', quote: q.replace('Venturi', 'Vxxxxxx') }).status).toBe('unverified');
  });

  it('matches across a line break', () => {
    const c = checkItem(ed, { episode: 'current', field: 'FiO2', value: '40', quote: 'FiO2 40% by Venturi mask' });
    expect(c.status).toBe('approximate');
    expect(ed.slice(c.start, c.end)).toBe('FiO2 40% via Venturi\nmask');
  });

  it('flags a near match whose number differs from the note', () => {
    const c = checkItem('HR 102 bpm at 12:00', { episode: 'current', field: 'HR', value: '112', quote: 'HR 112 bpm at 12:00' });
    expect(c.status).toBe('mismatched');
    expect(c.match).toBe('loose');
  });

  it('allows at most a quarter of a short quote', () => {
    expect(checkItem('Potassium K 5.1', { episode: 'current', field: 'K', value: '5.1', quote: 'Na 5.1' }).status).toBe('unverified');
  });

  it('treats a case-only difference as edited, with its span', () => {
    const c = checkItem(note, { episode: 'current', field: 'Cr', value: '1.4', quote: 'creatinine 1.4 mg/dL' });
    expect(c.status).toBe('edited');
    expect(c.distance).toBe(0);
    expect(note.slice(c.start, c.end)).toBe('Creatinine 1.4 mg/dL');
  });

  it('holds lower-confidence matches back from inputs', () => {
    const { inputs, review } = toInputs(checkExtraction(ed, [
      { episode: 'current', field: 'FiO2', key: 'fio2', value: '40', unit: '%', quote: 'FiO2 40% by Venturi mask' },
    ]));
    expect(inputs).toEqual({});
    expect(review[0]!.reason).toBe('low-confidence');
  });
});

describe('word-order match', () => {
  const ed = 'Oxygen 4 L/min via nasal cannulae, changed to FiO2 40% via Venturi\nmask at 09:15.';

  it('finds the same words in another order, at lower confidence', () => {
    const c = checkItem(ed, { episode: 'current', field: 'Oxygen', value: '4 L/min', quote: '4 L/min oxygen via nasal cannula' });
    expect(c.status).toBe('reordered');
    expect(c.match).toBe('words');
    expect(c.distance).toBe(1);
    expect(ed.slice(c.start, c.end)).toBe('Oxygen 4 L/min via nasal cannulae');
  });

  it('never pairs a number with a different number', () => {
    expect(checkItem(ed, { episode: 'current', field: 'Oxygen', value: '5', quote: '5 L/min oxygen via nasal cannula' }).status).toBe('unverified');
  });

  it('flags a reordered span that does not state the value', () => {
    expect(checkItem(ed, { episode: 'current', field: 'Oxygen', value: '6', quote: '4 L/min oxygen via nasal cannula' }).status).toBe('mismatched');
  });

  it('keeps the character budget for spelling slips', () => {
    expect(checkItem(ed, { episode: 'current', field: 'Oxygen', value: '4', quote: '4 L/min oxygen through nasal cannula' }).status).toBe('unverified');
  });

  it('holds reordered matches back from inputs', () => {
    const { inputs, review } = toInputs(checkExtraction(ed, [
      { episode: 'current', field: 'FiO2', key: 'fio2', value: '40', unit: '%', quote: 'Venturi mask FiO2 40% via' },
    ]));
    expect(inputs).toEqual({});
    expect(review[0]!.item.status).toBe('reordered');
    expect(review[0]!.reason).toBe('low-confidence');
  });
});

describe('applyFindings', () => {
  const item = (field: string, value = '1'): ExtractedItem => ({ episode: 'current', field, value, quote: `${field} ${value}` });
  const first = [item('HR', '88'), item('RR', '18'), item('Temp', '37')];
  const fields = (items: ExtractedItem[]) => items.map((i) => `${i.field} ${i.value}`);
  const none = new Set<number>();

  it('replaces the item a finding corrects', () => {
    expect(fields(applyFindings(first, [{ index: 1, problem: 'wrong value', correction: item('RR', '28') }], none))).toEqual(['HR 88', 'RR 28', 'Temp 37']);
  });

  it('removes the item a finding has no correction for', () => {
    expect(fields(applyFindings(first, [{ index: 0, problem: 'not in the note', correction: null }], none))).toEqual(['RR 18', 'Temp 37']);
  });

  it('adds a missed item after the first pass, in finding order', () => {
    const findings: Finding[] = [{ problem: 'missed', correction: item('SpO2', '94') }, { problem: 'missed', correction: item('GCS', '15') }];
    expect(fields(applyFindings(first, findings, none))).toEqual(['HR 88', 'RR 18', 'Temp 37', 'SpO2 94', 'GCS 15']);
  });

  it('changes nothing for a rejected finding of each kind', () => {
    const findings: Finding[] = [
      { index: 1, problem: 'wrong value', correction: item('RR', '28') },
      { index: 0, problem: 'not in the note', correction: null },
      { problem: 'missed', correction: item('SpO2', '94') },
    ];
    expect(applyFindings(first, findings, new Set([0, 1, 2]))).toEqual(first);
  });

  it('changes nothing for a remark', () => {
    expect(applyFindings(first, [{ problem: 'note is hard to read', correction: null }], none)).toEqual(first);
  });

  it('ignores an index outside the first pass', () => {
    const findings: Finding[] = [
      { index: 3, problem: 'x', correction: item('K', '4') },
      { index: -1, problem: 'x', correction: null },
      { index: 1.5, problem: 'x', correction: null },
    ];
    expect(applyFindings(first, findings, none)).toEqual(first);
  });

  it('returns a copy when there are no findings', () => {
    const out = applyFindings(first, [], none);
    expect(out).toEqual(first);
    expect(out).not.toBe(first);
  });

  it('applies the accepted finding, skips the rejected one, and keeps the order', () => {
    const findings: Finding[] = [
      { index: 0, problem: 'not in the note', correction: null },
      { index: 2, problem: 'wrong value', correction: item('Temp', '38') },
      { problem: 'missed', correction: item('SpO2', '94') },
    ];
    expect(fields(applyFindings(first, findings, new Set([0])))).toEqual(['HR 88', 'RR 18', 'Temp 38', 'SpO2 94']);
  });

  it('does not mutate the first pass', () => {
    const input = [...first];
    applyFindings(input, [{ index: 0, problem: 'x', correction: null }, { index: 1, problem: 'x', correction: item('RR', '28') }, { problem: 'x', correction: item('K', '4') }], none);
    expect(input).toEqual(first);
    expect(input).toHaveLength(3);
  });
});

describe('toExam', () => {
  const exam = 'Extremities cold and mottled. No JVD. Crackles at both bases. Last admission: skin warm.';
  const skin = { episode: 'current' as const, field: 'Skin', value: 'cold and mottled', quote: 'Extremities cold and mottled', exam: 'skin' as const, reads: 'cool' };
  const neck = { episode: 'current' as const, field: 'JVD', value: 'No JVD', quote: 'No JVD', absent: true, exam: 'jvp' as const, reads: 'normal_or_low' };

  it('hands on one reading per finding, with the position of its item; a denied finding counts', () => {
    expect(toExam(checkExtraction(exam, [skin, neck]))).toEqual({ skin: { reads: 'cool', index: 0 }, jvp: { reads: 'normal_or_low', index: 1 } });
  });

  it('leaves out a finding that is not word for word, from the history, repeated, or read as something off the list', () => {
    const run = (...items: Parameters<typeof checkExtraction>[1]) => toExam(checkExtraction(exam, items));
    expect(run({ ...skin, quote: 'Extremities cold, mottled' })).toEqual({});
    expect(run({ ...skin, episode: 'history', value: 'warm', quote: 'skin warm', reads: 'warm' })).toEqual({});
    expect(run(skin, { ...skin, quote: 'cold and mottled' })).toEqual({});
    expect(run({ ...skin, reads: 'cold' })).toEqual({});
    expect(run({ ...skin, reads: 'not_assessed' })).toEqual({});
  });

  it('readsOk takes only a listed reading of a listed finding', () => {
    expect(readsOk('lungExam', 'bilateral_crackles')).toBe(true);
    expect(readsOk('rightPercussion', 'stony_dull')).toBe(true);
    expect(readsOk('oxygenSupport', 'not_assessed')).toBe(false);
    expect(readsOk('lungs', 'clear')).toBe(false);
    expect(readsOk('toString', 'clear')).toBe(false);
    expect(readsOk(undefined, 'cool')).toBe(false);
  });
});
