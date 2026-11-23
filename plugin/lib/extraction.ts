/**
 * Note extraction check: is each extracted value's quote really in the note, and does the quote
 * state the value? Nothing clinical happens here — no thresholds, no interpretation. The agent
 * extracts; this checks the extraction against the note and cuts the note into highlightable runs.
 *
 * Literal containment, never a regex built from the quote: one unescaped `.` or `(` would turn a
 * failed check into a passing one. Ported from medextract's `core/verify.ts`.
 */

/**
 * The keys later tools read, named after the medprotocol CLI flags. `units` are the spellings
 * accepted as stated in the note, the first being the one the tools expect. No conversion happens
 * here: a value in another unit is sent to review, not converted.
 */
export const FIELDS = {
  sbp: { label: "Systolic blood pressure", units: ["mmHg"] },
  dbp: { label: "Diastolic blood pressure", units: ["mmHg"] },
  map: { label: "Mean arterial pressure", units: ["mmHg"] },
  hr: { label: "Heart rate", units: ["bpm", "/min", "lpm", "beats/min"] },
  rr: { label: "Respiratory rate", units: ["breaths/min", "/min", "rpm", "resp/min"] },
  temp: { label: "Temperature", units: ["°C", "°F", "ºC", "ºF"] },
  spo2: { label: "SpO2", units: ["%"] },
  fio2: { label: "FiO2", units: ["%"] },
  gcs: { label: "Glasgow Coma Scale", units: ["/15"] },
  weight: { label: "Weight", units: ["kg", "lb", "lbs"] },
  height: { label: "Height", units: ["cm", "m", "in"] },
  ph: { label: "pH", units: [] },
  pco2: { label: "pCO2", units: ["mmHg"] },
  pao2: { label: "PaO2", units: ["mmHg"] },
  hco3: { label: "Bicarbonate", units: ["mEq/L", "mmol/L"] },
  lactate: { label: "Lactate", units: ["mmol/L"] },
  na: { label: "Sodium", units: ["mEq/L", "mmol/L"] },
  potassium: { label: "Potassium", units: ["mmol/L", "mEq/L"] },
  cl: { label: "Chloride", units: ["mEq/L", "mmol/L"] },
  albumin: { label: "Albumin", units: ["g/dL"] },
  creatinine: { label: "Creatinine", units: ["mg/dL"] },
  glucose: { label: "Glucose", units: ["mg/dL", "mmol/L"] },
  ketones: { label: "Ketones", units: ["mmol/L"] },
  bilirubin: { label: "Bilirubin", units: ["mg/dL"] },
  platelets: { label: "Platelets", units: ["×10³/µL", "x10^3/uL", "10^3/µL", "/mm³", "×10⁹/L", "x10^9/L"] },
  hb: { label: "Hemoglobin", units: ["g/dL"] },
  a1c: { label: "HbA1c", units: ["%"] },
  egfr: { label: "eGFR", units: ["mL/min/1.73m²", "mL/min/1.73m2", "mL/min"] },
  acr: { label: "Albumin-to-creatinine ratio", units: ["mg/g"] },
  tc: { label: "Total cholesterol", units: ["mg/dL"] },
  hdl: { label: "HDL cholesterol", units: ["mg/dL"] },
  "urine-output": { label: "Urine output", units: ["mL"] },
} as const satisfies Record<string, { label: string; units: readonly string[] }>;

export type FieldKey = keyof typeof FIELDS;

export const EPISODES = ["current", "history"] as const;
export type Episode = (typeof EPISODES)[number];

export interface ExtractedItem {
  /** What was extracted, e.g. "Blood pressure", "Creatinine", "Metformin". */
  field: string;
  /** Set when the value is one later tools read (see `FIELDS`); items without one are shown but not handed on. */
  key?: FieldKey;
  /**
   * `current`: the illness this note is about — its symptoms, findings, readings and what was done
   * for it. `history`: anything from before it — past illnesses, earlier admissions and their
   * results, background medications, allergies.
   */
  episode: Episode;
  /** A laboratory result (blood, urine, gases, cultures). Only for display: the page lists these apart. */
  lab?: boolean;
  /** When the note says it was taken, as written ("08:00", "on admission"); needed to tell repeated readings apart. */
  time?: string;
  /** The value as the note states it, e.g. "120/80", "1.4", "500 mg BID". */
  value: string;
  unit?: string;
  /** The words of the note the value was read from, copied exactly. */
  quote: string;
}

/**
 * - `quoted`: the quote is in the note verbatim and states every number in the value.
 * - `edited`: the quote is in the note only after ignoring case or accents. Lower confidence.
 * - `approximate`: a span of the note is within `MAX_EDITS` characters of the quote (and within a
 *   quarter of its length). Lower confidence.
 * - `reordered`: the quote's words are all in a run of the same number of note words, in another
 *   order, with at most the same character budget of spelling slips. Lower confidence.
 * - `mismatched`: a span was found (exact or loose) but it does not state the value's numbers, in order.
 * - `unverified`: no span found.
 * - `none`: no quote was given.
 */
export type QuoteStatus = "quoted" | "edited" | "approximate" | "reordered" | "mismatched" | "unverified" | "none";

/** Most characters a loose span may differ from the quote by, ignoring case and accents. */
export const MAX_EDITS = 5;

export interface CheckedItem extends ExtractedItem {
  status: QuoteStatus;
  /** Offsets of the span found in the NFC-normalised note; set whenever one was found. */
  start?: number;
  end?: number;
  /** `exact`: the quote character for character. `loose`: the closest span, see `closestSpan`. `words`: same words, another order, see `reorderedSpan`. */
  match?: "exact" | "loose" | "words";
  /** Loose and words only: characters the span differs from the quote by (0 = case or accents only). */
  distance?: number;
  /** The quote occurs more than once; the first occurrence is the one marked. */
  ambiguous?: boolean;
}

export interface NoteSegment {
  text: string;
  /** Indices into the checked items whose quote covers this run; empty for plain text. */
  items: number[];
}

const stripAccents = (s: string): string => s.normalize("NFD").replace(/\p{Mn}/gu, "");
const collapse = (s: string): string => s.replace(/\s+/g, " ").trim();

/** The note with whitespace runs collapsed, and each collapsed char's offset in the original. */
const collapseWithMap = (note: string): { text: string; map: number[] } => {
  let text = "";
  const map: number[] = [];
  for (let i = 0; i < note.length; i++) {
    if (/\s/.test(note[i]!)) {
      if (text && !text.endsWith(" ")) {
        text += " ";
        map.push(i);
      }
    } else {
      text += note[i];
      map.push(i);
    }
  }
  return { text, map };
};

/** Numbers in a span, in order. `36,5` reads as 36.5, or as 36500 when three digits follow the comma. */
const numbersIn = (s: string): number[][] =>
  [...s.matchAll(/\d+(?:[.,·]\d+)?/g)].map(([m]) => {
    const [whole, frac] = m.split(/[.,·]/);
    const decimal = Number(frac === undefined ? whole : `${whole}.${frac}`);
    return m.includes(",") && frac?.length === 3 ? [decimal, Number(whole! + frac)] : [decimal];
  });

const same = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/** Every number the value states appears in the quote, in the same order. */
export const valueInQuote = (value: string, quote: string): boolean => {
  const source = numbersIn(quote);
  let at = 0;
  for (const values of numbersIn(value)) {
    const found = source.findIndex((readings, i) => i >= at && readings.some((r) => values.some((v) => same(r, v))));
    if (found === -1) return false;
    at = found + 1;
  }
  return true;
};

/**
 * The note span closest to the quote, by edit distance (one char inserted, deleted or changed = 1),
 * comparing chars without case or accents. Sellers' algorithm: the match may start anywhere in the
 * note. Ties go to the earliest end. Runs on the whitespace-collapsed note; offsets are into it.
 */
const closestSpan = (text: string, quote: string): { distance: number; start: number; end: number } => {
  const fold = (c: string) => stripAccents(c).toLowerCase();
  const t = text.split("").map(fold);
  const q = quote.split("").map(fold);
  // prev[i] / start[i]: distance and span start for quote[0..i) ending at the current note char.
  let prev = q.map((_, i) => i + 1);
  prev.unshift(0);
  let starts = prev.map(() => 0);
  let best = { distance: prev[q.length]!, start: 0, end: 0 };
  for (let j = 0; j < t.length; j++) {
    const cur = [0];
    const curStart = [j + 1];
    for (let i = 1; i <= q.length; i++) {
      const sub = prev[i - 1]! + (q[i - 1] === t[j] ? 0 : 1);
      const del = prev[i]! + 1;
      const ins = cur[i - 1]! + 1;
      const d = Math.min(sub, del, ins);
      cur.push(d);
      curStart.push(d === sub ? starts[i - 1]! : d === del ? starts[i]! : curStart[i - 1]!);
    }
    if (cur[q.length]! < best.distance) best = { distance: cur[q.length]!, start: curStart[q.length]!, end: j + 1 };
    prev = cur;
    starts = curStart;
  }
  return best;
};

const editDistance = (a: string, b: string): number => {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur.push(Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)));
    prev = cur;
  }
  return prev[b.length]!;
};

/** Words with their offsets, folded for comparison; `L/min`, `38,4` and `92/58` each stay one word. */
const wordsOf = (s: string) =>
  [...s.matchAll(/[\p{L}\p{N}]+(?:[.,·/^][\p{L}\p{N}]+)*/gu)].map((m) => ({
    w: stripAccents(m[0]).toLowerCase(),
    start: m.index!,
    end: m.index! + m[0].length,
  }));

/**
 * The run of note words, as many as the quote has, that pairs with the quote's words in any order
 * at the lowest total character cost. Words holding a digit pair only with an identical word.
 * Pairing is greedy, cheapest pair first.
 */
const reorderedSpan = (note: string, quote: string): { distance: number; start: number; end: number } | null => {
  const qw = wordsOf(quote).map((x) => x.w);
  const nw = wordsOf(note);
  const cost = (a: string, b: string) => (a === b ? 0 : /\d/.test(a) || /\d/.test(b) ? Infinity : editDistance(a, b));
  let best: { distance: number; start: number; end: number } | null = null;
  for (let i = 0; i + qw.length <= nw.length; i++) {
    const window = nw.slice(i, i + qw.length);
    const pairs = qw.flatMap((a, x) => window.map((b, y) => ({ x, y, d: cost(a, b.w) }))).sort((p, r) => p.d - r.d);
    const usedQ = new Set<number>();
    const usedN = new Set<number>();
    let distance = 0;
    for (const p of pairs) {
      if (usedQ.has(p.x) || usedN.has(p.y)) continue;
      usedQ.add(p.x);
      usedN.add(p.y);
      distance += p.d;
    }
    if (distance < (best?.distance ?? Infinity)) best = { distance, start: window[0]!.start, end: window.at(-1)!.end };
  }
  return best;
};

// the last note prepared: every item of an extraction is checked against the same note
let prepared: { note: string; nfc: string; text: string; map: number[] } | undefined;

export const checkItem = (note: string, item: ExtractedItem): CheckedItem => {
  const q = collapse(item.quote.normalize("NFC"));
  if (!q) return { ...item, status: "none" };
  if (prepared?.note !== note) {
    const nfc = note.normalize("NFC");
    prepared = { note, nfc, ...collapseWithMap(nfc) };
  }
  const { nfc, text, map } = prepared;
  const at = text.indexOf(q);
  if (at < 0) {
    // A quarter of the quote at most, so a short quote ("K 5.1") cannot match any five characters.
    const budget = Math.min(MAX_EDITS, Math.floor(q.length / 4));
    const span = closestSpan(text, q);
    if (span.end === 0 || span.distance > budget) {
      const words = reorderedSpan(nfc, q);
      if (!words || words.distance > budget) return { ...item, status: "unverified" };
      return {
        ...item,
        status: valueInQuote(item.value, nfc.slice(words.start, words.end)) ? "reordered" : "mismatched",
        start: words.start,
        end: words.end,
        match: "words",
        distance: words.distance,
      };
    }
    const start = map[span.start]!;
    const end = map[span.end - 1]! + 1;
    return {
      ...item,
      // The value is checked against the note's words, so an edit that changed a digit fails here.
      status: !valueInQuote(item.value, nfc.slice(start, end)) ? "mismatched" : span.distance === 0 ? "edited" : "approximate",
      start,
      end,
      match: "loose",
      distance: span.distance,
    };
  }
  return {
    ...item,
    status: valueInQuote(item.value, q) ? "quoted" : "mismatched",
    match: "exact",
    start: map[at]!,
    end: map[at + q.length - 1]! + 1,
    ...(text.indexOf(q, at + 1) >= 0 ? { ambiguous: true } : {}),
  };
};

export const checkExtraction = (note: string, items: ExtractedItem[]): CheckedItem[] =>
  items.map((item) => checkItem(note, item));

/**
 * The note cut at every quote boundary; joined back, the segments are the NFC note. Each run lists
 * the items whose quote covers it, so overlapping quotes (systolic and diastolic from one
 * "BP 120/80") both light the same words. Items without offsets mark nothing.
 */
export const noteSegments = (note: string, checked: CheckedItem[]): NoteSegment[] => {
  const text = note.normalize("NFC");
  const cuts = new Set([0, text.length]);
  for (const c of checked) if (c.start !== undefined) cuts.add(c.start).add(c.end!);
  const points = [...cuts].sort((a, b) => a - b);
  const out: NoteSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [s, e] = [points[i]!, points[i + 1]!];
    const items = checked.flatMap((c, n) => (c.start !== undefined && c.start <= s && c.end! >= e ? [n] : []));
    out.push({ text: text.slice(s, e), items });
  }
  return out;
};

export interface ExtractedInput {
  value: number;
  /** As stated in the note; absent when the note gave none. */
  unit?: string;
  quote: string;
  time?: string;
}

export type ReviewReason = "not-verified" | "low-confidence" | "no-episode" | "not-a-number" | "unit" | "repeated";

export interface ExtractionInputs {
  /** One verified number per key from the current illness, ready for a calculator. History never lands here. */
  inputs: Partial<Record<FieldKey, ExtractedInput>>;
  /** Keyed items held back, and why. Nothing here is guessed or dropped silently. */
  review: { item: CheckedItem; reason: ReviewReason }[];
}

/** `37,5` → 37.5. A comma before exactly three digits (`1,200`) could be either, so it is not a number here. */
const toNumber = (value: string): number | null => {
  const v = value.trim();
  if (!/^-?\d+(?:[.,]\d+)?$/.test(v) || /,\d{3}$/.test(v)) return null;
  return Number(v.replace(",", "."));
};

const unitOk = (key: FieldKey, unit?: string): boolean =>
  !unit || FIELDS[key].units.some((u) => u.toLowerCase() === unit.trim().toLowerCase());

/**
 * The extraction in the shape later tools read: `inputs.sbp.value`, `inputs.creatinine.unit`. Only
 * `quoted` current-illness items with a single number in an accepted unit get in; a key extracted
 * more than once is held back whole rather than picking one reading. History items are left out of
 * both lists (they stay in `checked`, tagged); an untagged item goes to review, never silently in.
 */
export const toInputs = (checked: CheckedItem[]): ExtractionInputs => {
  const keyed = checked.filter((c) => c.key && c.episode !== "history");
  const count = (k: FieldKey) => keyed.filter((c) => c.key === k && c.episode === "current").length;
  const out: ExtractionInputs = { inputs: {}, review: [] };
  for (const item of keyed) {
    const key = item.key!;
    const value = toNumber(item.value);
    const reason: ReviewReason | null =
      item.status === "edited" || item.status === "approximate" || item.status === "reordered" ? "low-confidence"
      : item.status !== "quoted" ? "not-verified"
      : item.episode !== "current" ? "no-episode"
      : value === null ? "not-a-number"
      : !unitOk(key, item.unit) ? "unit"
      : count(key) > 1 ? "repeated"
      : null;
    if (reason) out.review.push({ item, reason });
    else out.inputs[key] = { value: value!, ...(item.unit ? { unit: item.unit } : {}), quote: item.quote, ...(item.time ? { time: item.time } : {}) };
  }
  return out;
};

/** What the second pass says about the first: a wrong item (`index`), a missed one (no `index`), or a remark. */
export interface Finding {
  /** Position of the first-pass item this is about; absent for a missed item or a remark. */
  index?: number;
  problem: string;
  /** The item as it should be; `null` with an `index` means the item should go. */
  correction: ExtractedItem | null;
}

/**
 * The first pass with the accepted findings applied; `rejected` holds positions in `findings`.
 * `index` + correction replaces that item, `index` + null removes it, a correction alone is added
 * after the first-pass items, in finding order. A finding with neither, or with an index outside
 * the first pass, changes nothing. Returns a new array; when two findings name one item the later wins.
 */
export const applyFindings = (firstPass: readonly ExtractedItem[], findings: readonly Finding[], rejected: ReadonlySet<number>): ExtractedItem[] => {
  const kept: (ExtractedItem | null)[] = [...firstPass];
  const added: ExtractedItem[] = [];
  findings.forEach(({ index, correction }, n) => {
    if (rejected.has(n)) return;
    if (index === undefined) {
      if (correction) added.push(correction);
    } else if (Number.isInteger(index) && index >= 0 && index < firstPass.length) kept[index] = correction;
  });
  return [...kept.filter((item) => item !== null), ...added];
};
