// Shared helpers for every question generator.
//
// Conventions (see docs/GENERATOR_GUIDELINES.md):
//  * Maths inside prompts, options and solution steps is written as TeX between $...$
//    and rendered with KaTeX. Plain HTML (<b>, <br>, <table>) is allowed outside maths.
//  * Never put a literal dollar sign in text: the UK uses £ and $ is the maths delimiter.
//  * Generators are pure: (seed, {difficulty}) -> QuestionInstance. No Math.random().

export const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/* ------------------------------------------------------------------ */
/* Random numbers                                                      */
/* ------------------------------------------------------------------ */

export function rngFrom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = (rng, values) => values[Math.floor(rng() * values.length)];
export const int = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
/** Random integer in [min,max] excluding the listed values. */
export function intExcept(rng, min, max, exclude = [0]) {
  for (let i = 0; i < 200; i += 1) {
    const v = int(rng, min, max);
    if (!exclude.includes(v)) return v;
  }
  throw new Error('intExcept: no value available');
}
export const chance = (rng, p = 0.5) => rng() < p;
export const sign = (rng) => (rng() < 0.5 ? -1 : 1);
export function shuffle(rng, values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
/** k distinct items from values. */
export const sample = (rng, values, k) => shuffle(rng, values).slice(0, k);
/** Choose by difficulty: size(d, easyValue, mediumValue, hardValue). */
export const size = (difficulty, easy, medium, hard) => (difficulty === 'easy' ? easy : difficulty === 'hard' ? hard : medium);

/* ------------------------------------------------------------------ */
/* Integer maths                                                       */
/* ------------------------------------------------------------------ */

export const gcd = (a, b) => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
export const isPrime = (n) => {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d += 1) if (n % d === 0) return false;
  return true;
};
export function primeFactors(n) {
  const out = [];
  for (let d = 2; d * d <= n; d += 1) while (n % d === 0) { out.push(d); n /= d; }
  if (n > 1) out.push(n);
  return out;
}
export const factorsOf = (n) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
/** Largest square factor k² of n, so √n = k√(n/k²). */
export function largestSquareFactor(n) {
  let best = 1;
  for (let k = 1; k * k <= n; k += 1) if (n % (k * k) === 0) best = k;
  return best;
}

/* ------------------------------------------------------------------ */
/* Exact fractions                                                     */
/* ------------------------------------------------------------------ */

export class Frac {
  constructor(n, d = 1) {
    if (d === 0) throw new Error('Frac: zero denominator');
    if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error(`Frac: non-integer ${n}/${d}`);
    const g = gcd(n, d) || 1;
    const s = d < 0 ? -1 : 1;
    this.n = (s * n) / g;
    this.d = (s * d) / g;
  }
  static of(x) { return x instanceof Frac ? x : new Frac(x, 1); }
  add(o) { o = Frac.of(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Frac.of(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Frac.of(o); return new Frac(this.n * o.n, this.d * o.d); }
  div(o) { o = Frac.of(o); return new Frac(this.n * o.d, this.d * o.n); }
  neg() { return new Frac(-this.n, this.d); }
  inv() { return new Frac(this.d, this.n); }
  eq(o) { o = Frac.of(o); return this.n === o.n && this.d === o.d; }
  get isInt() { return this.d === 1; }
  value() { return this.n / this.d; }
  /** TeX: \frac{3}{4}, -\frac{3}{4}, 5. mixed:true gives 1\frac{1}{2}. */
  tex({ mixed = false } = {}) {
    if (this.d === 1) return tnum(this.n);
    const neg = this.n < 0 ? '-' : '';
    const a = Math.abs(this.n);
    if (mixed && a > this.d) {
      const w = Math.floor(a / this.d);
      return `${neg}${w}\\frac{${a % this.d}}{${this.d}}`;
    }
    return `${neg}\\frac{${a}}{${this.d}}`;
  }
  /** Plain text: 3/4, 1 1/2 */
  text({ mixed = false } = {}) {
    if (this.d === 1) return String(this.n);
    const neg = this.n < 0 ? '-' : '';
    const a = Math.abs(this.n);
    if (mixed && a > this.d) return `${neg}${Math.floor(a / this.d)} ${a % this.d}/${this.d}`;
    return `${neg}${a}/${this.d}`;
  }
}
export const frac = (n, d = 1) => new Frac(n, d);

/* ------------------------------------------------------------------ */
/* Number formatting                                                   */
/* ------------------------------------------------------------------ */

/** Remove binary floating point noise: 0.1+0.2 -> 0.3. */
export const tidy = (x) => {
  if (!Number.isFinite(x)) throw new Error(`Non-finite number: ${x}`);
  return Number.parseFloat(x.toPrecision(12));
};
export const roundTo = (x, dp) => {
  const f = 10 ** dp;
  return tidy(Math.round(tidy(x * f)) / f);
};
export const roundSf = (x, sf) => {
  if (x === 0) return 0;
  const p = sf - Math.ceil(Math.log10(Math.abs(x)));
  return p >= 0 ? roundTo(x, p) : tidy(Math.round(x / 10 ** -p) * 10 ** -p);
};
/** Number of decimal places a number is written with. */
export const decimals = (x) => (String(tidy(x)).split('.')[1] || '').replace(/e.*/, '').length;

/**
 * Plain-text number: thousands separators, true minus sign. dp forces a fixed number of decimal places.
 * num(12000) -> "12,000"; num(-3.5) -> "−3.5"; num(2.5, 2) -> "2.50".
 */
export function num(x, dp = null, arr = undefined) {
  if (Array.isArray(arr)) dp = null; // called as array.map(num): the second argument is an index, not dp
  x = tidy(x);
  const opts = dp === null ? { maximumFractionDigits: 10 } : { minimumFractionDigits: dp, maximumFractionDigits: dp };
  const s = Math.abs(x).toLocaleString('en-GB', opts);
  return (x < 0 ? '−' : '') + s;
}
/** TeX number: commas are wrapped {,} so KaTeX does not add a space. */
export function tnum(x, dp = null, arr = undefined) {
  if (Array.isArray(arr)) dp = null;
  return num(x, dp).replace(/,/g, '{,}').replace('−', '-');
}
/** Money in pounds: money(3.5) -> "£3.50", money(12) -> "£12". */
export function money(x, { forcePence = false } = {}) {
  const pence = Math.round(tidy(x * 100));
  const neg = pence < 0 ? '−' : '';
  const p = Math.abs(pence);
  const whole = p % 100 === 0 && !forcePence;
  return `${neg}£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}
/** Standard form TeX: sf(34000) -> "3.4 \times 10^{4}". */
export function stdForm(x, sigFigs = 6) {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  let m = roundSf(x / 10 ** e, sigFigs);
  let exp = e;
  if (Math.abs(m) >= 10) { m = tidy(m / 10); exp += 1; }
  return `${tnum(m)} \\times 10^{${exp}}`;
}

/* ------------------------------------------------------------------ */
/* Algebra formatting (TeX)                                            */
/* ------------------------------------------------------------------ */

/**
 * Format a sum of terms as TeX. terms: [[coef, 'x^2'], [coef, 'x'], [coef, '']].
 * Coefficients may be numbers or Frac. Zero terms are skipped; 1x -> x; -1x -> -x.
 * poly([[1,'x^2'],[-3,'x'],[2,'']]) -> "x^2 - 3x + 2"
 */
export function terms(list) {
  let out = '';
  for (const [rawCoef, v] of list) {
    const c = rawCoef instanceof Frac ? rawCoef : frac(rawCoef);
    if (c.n === 0) continue;
    const negative = c.n < 0;
    const abs = negative ? c.neg() : c;
    let body;
    if (v && abs.n === 1 && abs.d === 1) body = v;
    else body = `${abs.tex()}${v}`;
    if (!out) out = (negative ? '-' : '') + body;
    else out += negative ? ` - ${body}` : ` + ${body}`;
  }
  return out || '0';
}
/** Polynomial from coefficients, highest power first: poly([1,-3,2]) -> "x^2 - 3x + 2". */
export function poly(coefs, v = 'x') {
  const deg = coefs.length - 1;
  return terms(coefs.map((c, i) => {
    const p = deg - i;
    return [c, p === 0 ? '' : p === 1 ? v : `${v}^{${p}}`];
  }));
}
/** "+ 3" / "- 3" for appending a constant: `x ${signed(-3)}` -> "x - 3". */
export const signed = (c) => (c < 0 ? `- ${tnum(-c)}` : `+ ${tnum(c)}`);
/** Wrap negatives in brackets for substitution: paren(-3) -> "(-3)". */
export const paren = (c) => (c < 0 ? `(${tnum(c)})` : tnum(c));

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

export const NAMES = ['Amir', 'Bella', 'Chen', 'Dev', 'Ella', 'Femi', 'Grace', 'Hassan', 'Isla', 'Jamal', 'Kai', 'Lena', 'Maya', 'Noah', 'Olu', 'Priya', 'Quinn', 'Ravi', 'Sofia', 'Tom', 'Uma', 'Vikram', 'Wren', 'Yusuf', 'Zara', 'Ben', 'Chloe', 'Daniel', 'Erin', 'Freya', 'George', 'Hannah', 'Imran', 'Jess', 'Leo', 'Mia', 'Nadia', 'Oscar', 'Poppy', 'Sam'];
export const names = (rng, k = 1) => sample(rng, NAMES, k);
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const plural = (n, one, many = `${one}s`) => `${num(n)} ${n === 1 ? one : many}`;
/** Ordinal: 1st, 2nd, 3rd ... */
export const ordinal = (n) => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 >= 11 && n % 100 <= 13) ? 0 : Math.min(n % 10, 4) % 4] || 'th'}`;
/** HTML table helper. rows: array of arrays of cell HTML/TeX. */
export function table(rows, { header = true, firstColHeader = false, className = '' } = {}) {
  const body = rows.map((row, r) => `<tr>${row.map((cell, c) => {
    const tag = (header && r === 0) || (firstColHeader && c === 0) ? 'th' : 'td';
    return `<${tag}>${cell}</${tag}>`;
  }).join('')}</tr>`).join('');
  return `<table class="qtable ${className}">${body}</table>`;
}

/* ------------------------------------------------------------------ */
/* Semantic keys: stop "0.5" and "1/2" both appearing as options        */
/* ------------------------------------------------------------------ */

/** Try to read a displayed option as a number (+unit). Returns null when it is not a plain value. */
export function parseValue(text) {
  let s = String(text).trim()
    .replace(/\$/g, '')
    .replace(/\\,|\\ |~/g, ' ')
    .replace(/\{,\}/g, '')
    .replace(/−/g, '-')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\mathrm\{([^}]*)\}/g, '$1')
    .replace(/\\%/g, '%')
    .replace(/,(?=\d{3}\b)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  let unit = '';
  let scale = 1;
  if (s.startsWith('£')) { s = s.slice(1); unit = '£'; }
  if (s.startsWith('-£')) { s = `-${s.slice(2)}`; unit = '£'; }
  const sfm = s.match(/^(-?\d*\.?\d+)\s*\\times\s*10\^\{?(-?\d+)\}?$/);
  if (sfm) return { value: tidy(Number(sfm[1]) * 10 ** Number(sfm[2])), unit };
  const um = s.match(/^(.*?)(%|[a-zA-Z°²³][a-zA-Z°²³^{}0-9/ ]*)$/);
  if (um && um[1].trim() !== '' && /\d$/.test(um[1].trim().replace(/\}$/, '1'))) {
    s = um[1].trim();
    unit = um[2].trim();
    if (unit === '%') { scale = 0.01; unit = ''; }
    if (unit === 'p') { scale = 0.01; unit = '£'; }
  }
  let v = null;
  let m;
  if ((m = s.match(/^(-?)(\d+)\s*\\frac\{(\d+)\}\{(\d+)\}$/))) v = (Number(m[2]) + Number(m[3]) / Number(m[4])) * (m[1] ? -1 : 1);
  else if ((m = s.match(/^(-?)\\[dt]?frac\{(-?\d+)\}\{(\d+)\}$/))) v = (Number(m[2]) / Number(m[3])) * (m[1] ? -1 : 1);
  else if ((m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/))) v = (Number(m[2]) + Number(m[3]) / Number(m[4])) * (m[1] ? -1 : 1);
  else if ((m = s.match(/^(-?\d+)\/(\d+)$/))) v = Number(m[1]) / Number(m[2]);
  else if (/^-?\d*\.?\d+$/.test(s)) v = Number(s);
  if (v === null || !Number.isFinite(v)) return null;
  return { value: tidy(v * scale), unit };
}
export function semanticKey(text) {
  const p = parseValue(text);
  return p ? `${p.unit}|${p.value.toPrecision(10)}` : null;
}

/* ------------------------------------------------------------------ */
/* Options                                                             */
/* ------------------------------------------------------------------ */

function numericFillers(answer, k) {
  const text = String(answer);
  // Only nudge plain numbers (optionally with $…$, £, %, a unit): never fractions, roots or standard form.
  if (/\\|\//.test(text.replace(/\{,\}/g, ''))) return [];
  const m = text.match(/^(\$?)(−|-)?(£?)(\d{1,3}(?:(?:,|\{,\})\d{3})+|\d+)(\.\d+)?(.*)$/);
  if (!m) return [];
  const [, open, minus, pound, intPart, decPart = '', rest] = m;
  const comma = intPart.includes('{,}') ? '{,}' : intPart.includes(',') ? ',' : '';
  const value = Number(`${minus ? '-' : ''}${intPart.replace(/\{,\}|,/g, '')}${decPart}`);
  if (!Number.isFinite(value)) return [];
  const dp = decPart ? decPart.length - 1 : 0;
  const step = dp ? 10 ** -dp : Math.max(1, 10 ** Math.max(0, Math.floor(Math.log10(Math.abs(value) || 1)) - 1));
  const minusSign = minus || (open ? '-' : '−');
  const fmt = (v) => {
    const abs = Math.abs(v);
    let body = dp ? tidy(abs).toFixed(dp) : String(Math.round(abs));
    if (comma) { const [ip, fp] = body.split('.'); body = ip.replace(/\B(?=(\d{3})+(?!\d))/g, comma) + (fp ? `.${fp}` : ''); }
    return `${open}${v < 0 ? minusSign : ''}${pound}${body}${rest}`;
  };
  const out = [];
  for (let i = 1; out.length < k * 2 && i < 40; i += 1) {
    for (const v of [tidy(value + i * step), tidy(value - i * step)]) {
      if ((v < 0 && value >= 0) || (v === 0 && value !== 0)) continue;
      out.push(fmt(v));
    }
  }
  return out;
}

/**
 * Put options into a natural order without giving away the answer's position:
 * an explicit `order` list wins; otherwise numbers ascending, then texts by the first number they
 * contain (class intervals), then single letters alphabetically; anything else is shuffled.
 */
function naturalOrder(rng, choices, order) {
  if (order) {
    const idx = (t) => { const i = order.map(String).indexOf(t); return i < 0 ? Infinity : i; };
    return [...choices].sort((a, b) => idx(a) - idx(b));
  }
  const vals = choices.map((t) => parseValue(t));
  if (vals.every(Boolean)) return choices.map((t, i) => [t, vals[i].value]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
  const firstNum = (t) => { const m = String(t).replace(/−/g, '-').match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : null; };
  const nums = choices.map(firstNum);
  if (nums.every((n) => n !== null) && new Set(nums).size === nums.length) return choices.map((t, i) => [t, nums[i]]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
  if (choices.every((t) => /^[A-E]$/.test(t))) return [...choices].sort();
  return shuffle(rng, choices);
}

/**
 * Build shuffled options. answer/distractors are display strings (already formatted, TeX inside $..$).
 * Duplicates are removed by text and by numeric value. Exactly one option is the answer.
 */
export function buildOptions(rng, answer, distractors, { count = 5, allowEquivalent = false, fill = true, keepOrder = false, order = null } = {}) {
  const seenText = new Set();
  const seenKey = new Set();
  const choices = [];
  const norm = (t) => String(t).replace(/\s+/g, '').replace(/\{,\}/g, ',');
  const add = (text) => {
    if (text === undefined || text === null || choices.length >= count) return;
    text = String(text);
    if (/NaN|undefined|Infinity|null/.test(text)) return;
    const n = norm(text);
    if (seenText.has(n)) return;
    const key = allowEquivalent ? null : semanticKey(text);
    if (key && seenKey.has(key)) return;
    seenText.add(n);
    if (key) seenKey.add(key);
    choices.push(text);
  };
  add(answer);
  distractors.forEach(add);
  if (fill && choices.length < count) numericFillers(answer, count).forEach(add);
  if (choices.length < count) throw new Error(`Could not build ${count} distinct options (got ${choices.length}) for answer ${answer}`);
  let ordered = keepOrder ? naturalOrder(rng, choices, order) : shuffle(rng, choices);
  // Options that are single-letter labels (diagram A, point P …) are listed alphabetically.
  const label = (t) => String(t).trim().replace(/^\$|\$$/g, '').replace(/^\\(text|mathrm)\{(.*)\}$/, '$2');
  if (ordered.every((t) => /^[A-Z]$/.test(label(t)))) ordered = [...ordered].sort((a, b) => label(a).localeCompare(label(b)));
  return {
    options: ordered.map((text, i) => ({ id: LETTERS[i], text })),
    answer: LETTERS[ordered.indexOf(String(answer))],
  };
}

/* ------------------------------------------------------------------ */
/* Typed answers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Parse what a student typed into a number. Accepts 12, -3.5, 3/4, 1 1/2, 12,000, £3.50, 45%, 2.5e3,
 * 2.5 x 10^3, 2.5×10^3, units after the number (cm, kg …) and stray spaces.
 */
export function parseTypedNumber(input) {
  let s = String(input).trim().toLowerCase()
    .replace(/[−–]/g, '-')
    .replace(/£/g, '')
    .replace(/,(?=\d{3}(\D|$))/g, '')
    .replace(/\s*(×|x|\*)\s*10\s*\^\s*\(?(-?\d+)\)?/, 'e$2')
    .replace(/(\d)\s*(cm|mm|km|m|kg|g|ml|l|litres?|s|seconds?|minutes?|mins?|hours?|h|degrees?|°|p|pence|units?|cm²|cm\^2|m²|m\^2|cm³|cm\^3|m³|m\^3|km\/h|m\/s|mph|g\/cm³|g\/cm\^3)$/, '$1')
    .trim();
  let percent = false;
  if (s.endsWith('%')) { percent = true; s = s.slice(0, -1).trim(); }
  let m;
  let v = null;
  if ((m = s.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/))) v = (Number(m[2]) + Number(m[3]) / Number(m[4])) * (m[1] ? -1 : 1);
  else if ((m = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/))) v = Number(m[2]) === 0 ? null : Number(m[1]) / Number(m[2]);
  else if (/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/.test(s)) v = Number(s);
  if (v === null || !Number.isFinite(v)) return null;
  return percent ? { value: v, percent: true } : { value: v, percent: false };
}

/**
 * Does the typed text have the requested form? form: 'simplest' (fraction or mixed number in lowest
 * terms; integers as integers), 'improper' (a/b in lowest terms), 'mixed' (w a/b in lowest terms,
 * or a proper fraction below 1). Decimals are rejected for non-integer answers.
 */
function typedFormOk(form, raw, value) {
  const t = String(raw).trim().replace(/[−–]/g, '-').replace(/\s+/g, ' ');
  const target = value instanceof Frac ? value : null;
  const isInt = target ? target.isInt : Number.isInteger(Number(value));
  if (isInt) return /^-?\d+$/.test(t.replace(/,/g, ''));
  let m;
  if ((m = t.match(/^-?(\d+) (\d+) ?\/ ?(\d+)$/))) {
    const [, , a, b] = m.map(Number);
    return form !== 'improper' && a < b && gcd(a, b) === 1;
  }
  if ((m = t.match(/^-?(\d+) ?\/ ?(\d+)$/))) {
    const [, a, b] = m.map(Number);
    if (gcd(a, b) !== 1 || b === 1) return false;
    return form !== 'mixed' || a < b;
  }
  return false;
}

/**
 * Check a typed answer against a typed spec.
 * spec.kind: 'number' {value, tolerance?, percent?} | 'coord' {x, y} | 'text' {accept: [...]} | 'list' {values: [...] (any order)}
 */
export function checkTyped(spec, input) {
  if (!spec) return false;
  const raw = String(input ?? '').trim();
  if (!raw) return false;
  if (spec.kind === 'number') {
    const p = parseTypedNumber(raw);
    if (!p) return false;
    if (spec.form && !typedFormOk(spec.form, raw, spec.value)) return false;
    let target = spec.value instanceof Frac ? spec.value.value() : Number(spec.value);
    let got = p.value;
    if (p.percent && !spec.percent) got /= 100;
    const tol = spec.tolerance ?? 1e-9 * Math.max(1, Math.abs(target));
    return Math.abs(got - target) <= tol + 1e-12;
  }
  if (spec.kind === 'coord') {
    const t = raw.replace(/[−–]/g, '-').replace(/\s+/g, ' ');
    let xs; let ys;
    const named = t.match(/x\s*=\s*(-?[\d./ ]+?)\s*(?:[,;]|and)\s*y\s*=\s*(-?[\d./ ]+)$/i) || t.match(/y\s*=\s*(-?[\d./ ]+?)\s*(?:[,;]|and)\s*x\s*=\s*(-?[\d./ ]+)$/i);
    if (named) [xs, ys] = /^\s*y/i.test(t) ? [named[2], named[1]] : [named[1], named[2]];
    else {
      const m = t.match(/^\(?\s*(-?[\d./]+)\s*[,;]\s*(-?[\d./]+)\s*\)?$/);
      if (!m) return false;
      [, xs, ys] = m;
    }
    const x = parseTypedNumber(xs); const y = parseTypedNumber(ys);
    const tol = (spec.tolerance ?? 0) + 1e-9;
    return Boolean(x && y) && Math.abs(x.value - spec.x) <= tol && Math.abs(y.value - spec.y) <= tol;
  }
  if (spec.kind === 'list') {
    const parts = raw.split(/[,;]|\band\b|\s+or\s+/).map((t) => t.trim().replace(/^[a-z]\s*=\s*/i, '')).filter(Boolean).map(parseTypedNumber);
    if (parts.some((p) => !p) || parts.length !== spec.values.length) return false;
    const want = [...spec.values].map(Number).sort((a, b) => a - b);
    const got = parts.map((p) => p.value).sort((a, b) => a - b);
    const tol = (spec.tolerance ?? 0) + 1e-9;
    return want.every((w, i) => Math.abs(w - got[i]) <= tol);
  }
  if (spec.kind === 'text') {
    const n = (t) => String(t).toLowerCase().replace(/[−–]/g, '-').replace(/×/g, '*').replace(/\s+/g, '');
    return spec.accept.some((a) => n(a) === n(raw));
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Question construction                                               */
/* ------------------------------------------------------------------ */

/**
 * The build function receives (rng, difficulty) and returns:
 * {
 *   prompt: string (HTML + $TeX$),
 *   answer: string (display text of the correct option),
 *   distractors: string[] (plausible wrong answers, misconception-based first),
 *   solution: string[] (worked steps, HTML + $TeX$; last step states the answer),
 *   visual?: string (SVG or HTML shown under the prompt),
 *   typed?: {kind:'number', value, tolerance?} | {kind:'coord', x, y} | {kind:'list', values} | {kind:'text', accept},
 *   calculator?: boolean (true if a calculator is needed / allowed),
 *   hint?: string,
 *   count?: number of options (default 5),
 *   allowEquivalent?: boolean, keepOrder?: boolean (natural order; pass order: [...] to fix it explicitly)
 * }
 */
export function makeQuestion(id, skill, seed, config, build) {
  const rng = rngFrom(seed);
  const difficulty = config?.difficulty || 'medium';
  const data = build(rng, difficulty);
  const choices = buildOptions(rng, data.answer, data.distractors || [], {
    count: data.count ?? 5, allowEquivalent: data.allowEquivalent, keepOrder: data.keepOrder, order: data.order ?? null, fill: data.fill ?? true,
  });
  return {
    id: `${id}-${seed}-${difficulty}`,
    seed,
    skill_id: skill,
    archetype_id: id,
    difficulty,
    prompt: data.prompt,
    visual: data.visual ?? null,
    options: choices.options,
    answer: choices.answer,
    answerText: String(data.answer),
    typed: data.typed ?? null,
    calculator: Boolean(data.calculator),
    hint: data.hint ?? null,
    solution: data.solution ?? [],
    longDecimalsOk: Boolean(data.longDecimalsOk),
  };
}

/** Register an archetype generator: gen('num-hcf-direct', 'num-hcf-lcm', (rng, d) => ({...})) */
export const gen = (id, skill, build, meta = {}) => Object.assign(
  (seed, config = {}) => makeQuestion(id, skill, seed, config, build),
  { id, skillId: skill, ...meta },
);

/** Retry nearby seeds so one unlucky parameter set never breaks a session. */
export function generateSafely(generator, seed, config) {
  let last;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try { return generator((seed + attempt * 2654435761) >>> 0, config); } catch (error) { last = error; }
  }
  throw last;
}
