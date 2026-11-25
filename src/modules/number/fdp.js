// Number module – unit "Fractions, decimals and percentages" (including recurring decimals).
import {
  pick, int, sample, shuffle, size, chance, gcd, frac, Frac, num, tnum, tidy, roundTo,
} from '../../core.js';
import { gen, uniq, F, terminates, dpOf } from './util.js';

const T = (f, mixed = false) => Frac.of(f).tex({ mixed });
const pct = (v) => `${num(tidy(v))}%`;

/** A "nice" fraction with a terminating decimal, by difficulty. */
function niceFrac(rng, d) {
  const dens = size(d, [2, 4, 5, 10], [4, 5, 8, 20, 25, 10], [8, 20, 25, 40, 50, 200, 1000]);
  for (;;) {
    const den = pick(rng, dens);
    const n = int(rng, 1, den - 1);
    const f = frac(n, den);
    if (f.d === den || d === 'easy') return f;
  }
}

/* ================================================================== */
/* num-fdp-convert                                                     */
/* ================================================================== */

export const fdpConvert = gen('num-fdp-convert', 'num-fdp-convert', (rng, d) => {
  const dir = pick(rng, ['FD', 'DF', 'FP', 'PF', 'DP', 'PD']);
  let f = niceFrac(rng, d);
  if (d === 'hard' && chance(rng, 0.3)) f = f.add(int(rng, 1, 2));
  const dec = tidy(f.value());
  const p = tidy(dec * 100);
  if (dpOf(dec) > 3 || dpOf(p) > 1) throw new Error('retry');
  const decWrong = [Number(`0.${f.n}${f.d}`), tidy(f.d / f.n), Number(`${f.n}.${f.d}`), tidy(dec * 10), tidy(dec / 10), Number(`0.${f.n}`)].filter((v) => Number.isFinite(v) && v !== dec && dpOf(v) <= 4);
  const fracWrongFromDec = [frac(Math.round(dec * 10 ** dpOf(dec)), 10 ** (dpOf(dec) + 1)), frac(Math.round(dec * 10 ** dpOf(dec)), 10), frac(Math.round(p), 1000), f.d > f.n ? frac(f.d, f.n) : frac(f.n + 1, f.d), frac(f.n, f.d + 1), frac(f.n + 1, f.d)];
  const qText = { FD: `Write $${T(f, true)}$ as a decimal.`, DF: `Write ${num(dec)} as a fraction in its simplest form.`, FP: `Write $${T(f, true)}$ as a percentage.`, PF: `Write ${pct(p)} as a fraction in its simplest form.`, DP: `Write ${num(dec)} as a percentage.`, PD: `Write ${pct(p)} as a decimal.` }[dir];
  let answer; let distractors; let typed; let steps;
  if (dir === 'FD' || dir === 'PD') {
    answer = num(dec);
    const pdWrong = [p, tidy(p / 10), tidy(p / 1000), tidy(dec + 1), tidy(dec + 0.1), tidy(dec - 0.01)];
    distractors = uniq((dir === 'PD' ? pdWrong : [...decWrong, tidy(dec * 100), tidy(dec + 0.1)]).filter((v) => v > 0 && v !== dec && dpOf(v) <= 3).map((v) => num(v)), answer);
    typed = { kind: 'number', value: dec };
    steps = dir === 'FD'
      ? [`Make the denominator 10, 100 or 1000 (or divide the numerator by the denominator).`, `$${T(f, true)} = ${dec >= 1 ? `${Math.floor(dec)} + ` : ''}${[10, 100, 1000].map((k) => (k % f.sub(Math.floor(dec)).d === 0 ? `\\frac{${f.sub(Math.floor(dec)).n * (k / f.sub(Math.floor(dec)).d)}}{${k}}` : null)).find(Boolean) || T(f.sub(Math.floor(dec)))} = ${tnum(dec)}$`]
      : [`Per cent means "out of 100", so divide by 100.`, `$${tnum(p)} \\div 100 = ${tnum(dec)}$`];
  } else if (dir === 'DF' || dir === 'PF') {
    answer = F(f, f.n > f.d);
    distractors = uniq([...fracWrongFromDec, frac(f.n, f.d * 10), frac(f.n * 2, f.d), frac(Math.max(1, f.n - 1), f.d)].filter((g) => !g.eq(f) && g.n > 0 && !g.isInt && (f.value() > 1 || g.value() < 1)).map((g) => F(g, g.n > g.d)), answer);
    typed = { kind: 'number', value: f, form: 'simplest' };
    const den = dir === 'DF' ? 10 ** dpOf(dec) : 100;
    const top = dir === 'DF' ? Math.round(dec * den) : p;
    steps = [
      dir === 'DF' ? `${num(dec)} has ${dpOf(dec)} decimal place${dpOf(dec) > 1 ? 's' : ''}, so write it over ${num(den)}: $\\frac{${tnum(top)}}{${tnum(den)}}$` : `Per cent means "out of 100": $${tnum(p)}\\% = \\frac{${tnum(p)}}{100}${Number.isInteger(p) ? '' : ` = \\frac{${tnum(p * 10)}}{1000}`}$`,
      `Simplify by dividing top and bottom by the same number: $= ${T(f)}${f.n > f.d ? ` = ${T(f, true)}` : ''}$`,
    ];
  } else {
    answer = pct(p);
    distractors = uniq([tidy(dec), tidy(p / 10), tidy(p * 10), Number(`${f.n}.${f.d}`), f.n + f.d, tidy(100 / f.d * (f.n + 1)), tidy(p + 10)].filter((v) => v !== p && dpOf(v) <= 2).map((v) => pct(v)), answer);
    typed = { kind: 'number', value: p, percent: true };
    steps = dir === 'FP'
      ? [`Change to a decimal first, then multiply by 100.`, `$${T(f, true)} = ${tnum(dec)}$ and $${tnum(dec)} \\times 100 = ${tnum(p)}$`]
      : [`Multiply the decimal by 100 to get a percentage.`, `$${tnum(dec)} \\times 100 = ${tnum(p)}$`];
  }
  return {
    prompt: qText,
    answer,
    distractors,
    typed,
    solution: [...steps, `Answer: ${answer}`],
  };
}, { title: 'Convert between F, D and P' });

export const fdpGivenFact = gen('num-fdp-given-fact', 'num-fdp-convert', (rng, d) => {
  let f;
  do { f = frac(int(rng, size(d, 1, 3, 11), size(d, 7, 39, 99)), pick(rng, size(d, [8, 40], [40, 80, 125], [80, 125, 200]))); } while (f.d < 8 || f.n >= f.d || dpOf(f.value()) !== 3);
  const dec = f.value();
  const type = pick(rng, size(d, ['times10', 'double', 'times'], ['over10', 'mixed', 'times', 'double'], ['mixed', 'times', 'half', 'over10']));
  let tn = f.n; let td = f.d; let val; let how; let shown;
  const fr = () => `\\frac{${tn}}{${td}}`;
  if (type === 'times10') { tn = f.n * 10; val = tidy(dec * 10); how = `$${fr()}$ is 10 times $${T(f)}$, so multiply ${num(dec)} by 10.`; }
  else if (type === 'over10') { td = f.d * 10; val = tidy(dec / 10); how = `The denominator is 10 times bigger, so the fraction is 10 times smaller: $${tnum(dec)} \\div 10$.`; }
  else if (type === 'double') { tn = f.n * 2; val = tidy(dec * 2); how = `$${fr()}$ is 2 times $${T(f)}$: $${tnum(dec)} \\times 2$.`; }
  else if (type === 'half') { td = f.d * 2; val = tidy(dec / 2); how = `The denominator has doubled, so halve ${num(dec)}.`; }
  else if (type === 'times') { const k = pick(rng, [3, 4, 5]); tn = f.n * k; val = tidy(dec * k); how = `$${fr()}$ is ${k} times $${T(f)}$: $${tnum(dec)} \\times ${k}$.`; }
  if (type === 'mixed') { const w = int(rng, 1, 5); shown = T(f.add(w), true); val = tidy(dec + w); how = `$${shown} = ${w} + ${T(f)}$, so add ${w} to ${num(dec)}.`; }
  else shown = fr();
  if (dpOf(val) > 3) throw new Error('retry');
  return {
    prompt: `As a decimal, $${T(f)} = ${tnum(dec)}$<br>Write $${shown}$ as a decimal.`,
    answer: num(val),
    distractors: uniq([val * 10, val / 10, val * 100, val / 100, dec, val + 1, val - 1].map(tidy).filter((v) => v > 0 && v !== val && dpOf(v) <= 3).map((v) => num(v)), num(val)),
    typed: { kind: 'number', value: val },
    solution: [how, `$= ${tnum(val)}$`, `Answer: ${num(val)}`],
  };
}, { title: 'Use a given F–D fact' });

export const fdpEqual = gen('num-fdp-equal', 'num-fdp-convert', (rng, d) => {
  const f = niceFrac(rng, d);
  const dec = tidy(f.value()); const p = tidy(dec * 100);
  const form = pick(rng, ['dec', 'pct', 'frac']);
  const shown = form === 'dec' ? num(dec) : form === 'pct' ? pct(p) : `$${T(f)}$`;
  const target = pick(rng, ['dec', 'pct', 'frac'].filter((x) => x !== form));
  const fmt = (v) => (target === 'dec' ? num(v) : target === 'pct' ? pct(tidy(v * 100)) : F(frac(Math.round(v * 1000), 1000)));
  const wrongVals = [Number(`0.${f.n}${f.d}`), tidy(f.d / 100), tidy(dec / 10), tidy(dec * 10), tidy(f.n / (f.d + 1)), tidy(1 - dec), tidy(f.n / 10), tidy(1 / f.d)].filter((v) => v > 0 && v !== dec && dpOf(v) <= 3 && v < 10);
  const answer = fmt(dec);
  return {
    prompt: `Which of these is equal to ${shown}?`,
    answer,
    distractors: uniq(wrongVals.map(fmt), answer),
    solution: [
      form === 'frac' ? `$${T(f)} = ${tnum(dec)} = ${tnum(p)}\\%$` : form === 'dec' ? `${num(dec)} $= \\frac{${tnum(Math.round(dec * 10 ** dpOf(dec)))}}{${tnum(10 ** dpOf(dec))}} = ${T(f)}$, and $${tnum(dec)} \\times 100 = ${tnum(p)}\\%$` : `$${tnum(p)}\\% = \\frac{${tnum(p)}}{100} = ${T(f)} = ${tnum(dec)}$`,
      `Answer: ${answer}`,
    ],
  };
}, { title: 'Spot the equivalent F/D/P' });

/* ================================================================== */
/* num-fdp-order                                                       */
/* ================================================================== */

function mixedSet(rng, d, k) {
  for (let t = 0; t < 100; t += 1) {
    const base = size(d, pick(rng, [0.25, 0.5, 0.75, 0.4, 0.6]), pick(rng, [0.3, 0.4, 0.6, 0.7, 0.35, 0.65]), pick(rng, [0.3, 0.6, 0.15, 0.85, 0.45, 0.55]));
    const spread = size(d, 0.12, 0.06, 0.03);
    const items = [];
    const vals = new Set();
    for (let i = 0; i < 40 && items.length < k; i += 1) {
      const form = ['dec', 'pct', 'frac', 'dec', 'pct', 'frac'][items.length % 6];
      let v; let text;
      if (form === 'frac') {
        const den = pick(rng, size(d, [2, 4, 5, 10], [3, 4, 5, 8, 20], [3, 6, 7, 8, 9, 11, 12, 16]));
        const n = Math.max(1, Math.round((base + (rng() - 0.5) * 2 * spread) * den));
        if (n >= den || gcd(n, den) !== 1) continue;
        v = n / den; text = `$\\frac{${n}}{${den}}$`;
      } else if (form === 'dec') {
        const dp = size(d, 1, 2, pick(rng, [2, 3]));
        v = roundTo(base + (rng() - 0.5) * 2 * spread, dp); text = num(v);
        if (v <= 0) continue;
      } else {
        v = roundTo(base + (rng() - 0.5) * 2 * spread, d === 'hard' ? 3 : 2); text = pct(v * 100);
        if (dpOf(tidy(v * 100)) > 1 || v <= 0) continue;
      }
      const key = roundTo(v, 6);
      if (vals.has(key) || [...vals].some((w) => Math.abs(w - key) < 0.002)) continue;
      vals.add(key); items.push({ v, text });
    }
    if (items.length === k) return items;
  }
  throw new Error('retry');
}
const faceValue = (it) => Number(it.text.replace(/[$%]|\\frac\{(\d+)\}\{(\d+)\}/g, (m, a, b) => (a ? `${a}.${b}` : '')).replace(/[^\d.]/g, '')) || 0;

export const fdpoOrder = gen('num-fdpo-order', 'num-fdp-order', (rng, d) => {
  const items = mixedSet(rng, d, 4);
  const asc = [...items].sort((a, b) => a.v - b.v);
  const show = (list) => list.map((it) => it.text).join(', ');
  const answer = show(asc);
  const face = [...items].sort((a, b) => faceValue(a) - faceValue(b));
  const swaps = [0, 1, 2].map((i) => { const c = [...asc]; [c[i], c[i + 1]] = [c[i + 1], c[i]]; return show(c); });
  return {
    prompt: `Put these numbers in order, starting with the <b>smallest</b>.<br>${shuffle(rng, items).map((it) => it.text).join(',&nbsp;&nbsp; ')}`,
    answer,
    distractors: uniq([show(face), show([...asc].reverse()), ...shuffle(rng, swaps)], answer),
    count: 4,
    solution: [
      'Change them all to the same form – decimals are easiest.',
      items.map((it) => (dpOf(tidy(it.v)) > 3 ? `${it.text} $\\approx ${tnum(roundTo(it.v, 3))}$` : `${it.text} $= ${tnum(tidy(it.v))}$`)).join(", "),
      `Smallest to largest: ${answer}`,
    ],
  };
}, { title: 'Order mixed F/D/P', longDecimalsOk: true });

export const fdpoExtreme = gen('num-fdpo-extreme', 'num-fdp-order', (rng, d) => {
  const items = mixedSet(rng, d, 5);
  const wantMax = chance(rng);
  const target = items.reduce((b, it) => ((wantMax ? it.v > b.v : it.v < b.v) ? it : b));
  return {
    prompt: `Which of these is the <b>${wantMax ? 'largest' : 'smallest'}</b>?<br>${shuffle(rng, items).map((it) => it.text).join(",&nbsp;&nbsp; ")}`,
    answer: target.text,
    distractors: items.filter((it) => it !== target).map((it) => it.text),
    solution: [
      'Write each one as a decimal so they can be compared.',
      items.map((it) => (dpOf(tidy(it.v)) > 3 ? `${it.text} $\\approx ${tnum(roundTo(it.v, 3))}$` : `${it.text} $= ${tnum(tidy(it.v))}$`)).join(", "),
      `Answer: ${target.text}`,
    ],
  };
}, { title: 'Largest/smallest of mixed F/D/P', longDecimalsOk: true });

export const fdpoClosest = gen('num-fdpo-closest', 'num-fdp-order', (rng, d) => {
  if (chance(rng)) {
    // closest decimal to a fraction
    let f;
    do { f = frac(int(rng, 1, 10), pick(rng, size(d, [3, 6, 9], [7, 9, 11, 12], [7, 13, 17, 19]))); } while (f.n >= f.d || f.d !== frac(f.n, f.d).d || terminates(f.n, f.d));
    const v = f.value();
    const r1 = roundTo(v, 1); const r2 = roundTo(v, 2);
    const cands = uniq([r2, roundTo(v + 0.05, 2), roundTo(v - 0.05, 2), r1, roundTo(r1 + 0.1, 1), roundTo(r1 - 0.1, 1), Number(`0.${f.n}${f.d}`), roundTo(f.d / 100, 2)].map(String)).map(Number).filter((x) => x > 0 && x < 1);
    const opts = cands.slice(0, 5);
    const best = opts.reduce((b, x) => (Math.abs(x - v) < Math.abs(b - v) ? x : b));
    if (opts.filter((x) => Math.abs(Math.abs(x - v) - Math.abs(best - v)) < 1e-9).length > 1) throw new Error('retry');
    return {
      prompt: `Which decimal is closest in value to $${T(f)}$?`,
      answer: num(best),
      distractors: opts.filter((x) => x !== best).map((x) => num(x)),
      typed: { kind: 'number', value: best },
      solution: [
        `Divide: $${f.n} \\div ${f.d} = ${tnum(roundTo(v, 4))}\\ldots$`,
        `Compare the distance of each option from this value; ${num(best)} is the nearest.`,
        `Answer: ${num(best)}`,
      ],
    };
  }
  // a percentage between two fractions
  for (;;) {
    const a = frac(int(rng, 1, 4), pick(rng, size(d, [4, 5, 10], [3, 4, 5, 8], [6, 7, 8, 9, 12])));
    const b = frac(a.n * 2 + 1, a.d * 2);
    if (a.value() >= 1 || b.value() >= 1 || a.n >= a.d) continue;
    const lo = a.value() * 100; const hi = b.value() * 100;
    const inside = Math.round((lo + hi) / 2 + (rng() - 0.5) * (hi - lo) * 0.6);
    if (inside <= lo || inside >= hi) continue;
    const outs = [Math.floor(lo) - int(rng, 1, 4), Math.ceil(hi) + int(rng, 1, 4), Math.round(lo) === lo ? lo : Math.floor(lo) - 6, a.n * 10 + b.n, Math.ceil(hi) + 9, a.d * 10].filter((x) => x > 0 && (x <= lo || x >= hi));
    return {
      prompt: `Which percentage is between $${T(a)}$ and $${T(b)}$?`,
      answer: pct(inside),
      distractors: uniq(outs.map(pct), pct(inside)),
      solution: [
        'Change both fractions to percentages.',
        `$${T(a)} = ${tnum(roundTo(lo, 1))}\\%$ and $${T(b)} = ${tnum(roundTo(hi, 1))}\\%$`,
        `${pct(inside)} lies between them. Answer: ${pct(inside)}`,
      ],
    };
  }
}, { title: 'Closest value / value between', longDecimalsOk: true });

/* ================================================================== */
/* num-recurring-decimals                                              */
/* ================================================================== */

/** Decimal expansion of n/d (0 < n/d): {int, pre: 'digits', rep: 'digits'} */
function expand(n, d) {
  const whole = Math.floor(n / d);
  let r = n % d;
  const digits = []; const seen = new Map();
  while (r !== 0 && !seen.has(r)) { seen.set(r, digits.length); r *= 10; digits.push(Math.floor(r / d)); r %= d; }
  if (r === 0) return { whole, pre: digits.join(''), rep: '' };
  const s = seen.get(r);
  return { whole, pre: digits.slice(0, s).join(''), rep: digits.slice(s).join('') };
}
/** TeX for a recurring decimal: 0.58\dot{3}, 0.\dot{1}4285\dot{7}. */
function recTex({ whole, pre, rep }) {
  if (!rep) return `${whole}.${pre}`;
  const r = rep.length === 1 ? `\\dot{${rep}}` : `\\dot{${rep[0]}}${rep.slice(1, -1)}\\dot{${rep[rep.length - 1]}}`;
  return `${whole}.${pre}${r}`;
}
const recValueFrac = (whole, pre, rep) => {
  // value = whole + (pre rep - pre) / (10^p (10^r - 1))
  const p = pre.length; const r = rep.length;
  const num1 = Number(pre + rep) - Number(pre || '0');
  const den = 10 ** p * (10 ** r - 1);
  return frac(num1, den).add(whole);
};

/** Digits of whole.pre(rep)(rep)… multiplied by 10^k, shown with a few digits and "…". */
function shifted(whole, pre, rep, k, extra = 3) {
  const digits = `${pre}${rep.repeat(8)}`;
  const intPart = Number(`${whole}${digits.slice(0, k)}`);
  return `${tnum(intPart)}.${digits.slice(k, k + Math.max(extra, rep.length * 2))}\\ldots`;
}

export const recToFraction = gen('num-rec-to-fraction', 'num-recurring-decimals', (rng, d) => {
  for (;;) {
    let whole = 0; let pre = ''; let rep;
    const type = pick(rng, size(d, ['one', 'two'], ['two', 'pre1', 'one'], ['pre1', 'three', 'pre2', 'whole']));
    if (type === 'one') rep = String(int(rng, 1, 8));
    else if (type === 'two') rep = `${int(rng, 0, 9)}${int(rng, 1, 9)}`;
    else if (type === 'three') rep = `${int(rng, 1, 9)}${int(rng, 0, 9)}${int(rng, 1, 9)}`;
    else if (type === 'pre1') { pre = String(int(rng, 1, 9)); rep = String(int(rng, 1, 9)); }
    else if (type === 'pre2') { pre = String(int(rng, 0, 9)); rep = `${int(rng, 0, 9)}${int(rng, 1, 9)}`; }
    else { whole = int(rng, 1, 3); rep = String(int(rng, 1, 8)); }
    if (/^(\d)\1+$/.test(rep) || pre === rep) continue;
    const ans = recValueFrac(whole, pre, rep);
    const tex = recTex({ whole, pre, rep });
    if (ans.d === 1 || expand(ans.n, ans.d).rep !== rep || expand(ans.n, ans.d).pre !== pre) continue;
    const p = pre.length; const r = rep.length;
    const digits = Number(pre + rep);
    const W = (f) => f.add(whole);
    const wrongs = [
      W(frac(digits, 10 ** (p + r))),
      W(frac(digits, 10 ** (p + r) - 1)),
      W(frac(digits, 9 * 10 ** (p + r - 1))),
      W(frac(digits, 10 ** (p + r + 1) - 1)),
      W(frac(Number(rep), 10 ** r - 1)),
      W(frac(digits + 1, 10 ** p * (10 ** r - 1))),
      W(frac(Number(pre + rep[0]), 10 ** (p + 1))),
      ans.add(frac(1, ans.d)),
    ].filter((f) => !f.eq(ans) && f.n > 0);
    const k1 = 10 ** (p + r); const k0 = 10 ** p;
    const top = ans.mul(k1 - k0);
    return {
      prompt: `Write $${tex}$ as a fraction in its simplest form.`,
      answer: F(ans),
      distractors: uniq(wrongs.map((f) => F(f)), F(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `Let $x = ${shifted(whole, pre, rep, 0, p + 2 * r + 1)}$`,
        `Multiply so the recurring parts line up: $${tnum(k1)}x = ${shifted(whole, pre, rep, p + r)}$${p ? ` and $${tnum(k0)}x = ${shifted(whole, pre, rep, p)}$` : ''}`,
        `Subtract${p ? '' : ' $x$'} to cancel the recurring parts: $${tnum(k1 - k0)}x = ${tnum(top.value())}$`,
        `$x = \\frac{${tnum(top.value())}}{${tnum(k1 - k0)}}${ans.d !== k1 - k0 ? ` = ${T(ans)}` : ''}$. Answer: ${F(ans)}`,
      ],
    };
  }
}, { title: 'Recurring decimal to fraction', longDecimalsOk: true });

export const recToDecimal = gen('num-rec-to-decimal', 'num-recurring-decimals', (rng, d) => {
  for (;;) {
    const den = pick(rng, size(d, [3, 9, 11], [6, 11, 12, 15, 18, 22], [7, 12, 13, 14, 22, 27, 30, 36, 37]));
    const n = int(rng, 1, den - 1);
    if (gcd(n, den) !== 1 || terminates(n, den)) continue;
    const e = expand(n, den);
    if (e.rep.length > 6) continue;
    const ans = `$${recTex(e)}$`;
    const all = e.pre + e.rep;
    const wrongs = [
      `$${recTex({ whole: 0, pre: '', rep: all })}$`,
      e.pre ? `$${recTex({ whole: 0, pre: e.pre.slice(0, -1), rep: e.pre.slice(-1) + e.rep })}$` : `$${recTex({ whole: 0, pre: e.rep[0], rep: e.rep.slice(1) + e.rep[0] })}$`,
      `$0.${all}$`,
      e.rep.length === 1 ? `$0.${e.pre}${e.rep}\\dot{${e.rep}}$` : `$0.${e.pre}\\dot{${e.rep[0]}}${e.rep.slice(1)}$`,
      `$${recTex(expand(n, den + 1).rep.length && expand(n, den + 1).rep.length < 5 ? expand(n, den + 1) : expand(n + 1 < den ? n + 1 : n - 1, den))}$`,
      `$0.${String(den)}${n}$`,
    ];
    return {
      prompt: `Write $${T(frac(n, den))}$ as a recurring decimal.`,
      answer: ans,
      distractors: uniq(wrongs, ans),
      allowEquivalent: true,
      solution: [
        `Divide ${n} by ${den} (short division, adding zeros after the decimal point).`,
        `$${n} \\div ${den} = 0.${all}${e.rep}${e.rep.length < 3 ? e.rep : ''}\\ldots$ – the remainder repeats, so the digits ${e.rep.length === 1 ? e.rep : e.rep.split('').join('')} repeat for ever.`,
        `Put a dot over the ${e.rep.length === 1 ? 'repeating digit' : 'first and last digits of the repeating block'}${e.pre ? ` (the ${e.pre} does not repeat)` : ''}.`,
        `Answer: ${ans}`,
      ],
    };
  }
}, { title: 'Fraction to recurring decimal', longDecimalsOk: true });

export const recArith = gen('num-rec-arith', 'num-recurring-decimals', (rng, d) => {
  for (;;) {
    const twoDigit = d !== 'easy';
    const mk = () => (twoDigit ? `${int(rng, 1, 8)}${int(rng, 0, 9)}` : String(int(rng, 1, 8)));
    const a = mk(); const b = mk();
    if (a === b || /^(\d)\1$/.test(a) || /^(\d)\1$/.test(b)) continue;
    const sub = chance(rng);
    // x and y as {pre, rep}; on hard, x has one non-recurring digit (e.g. 0.4\dot{7})
    let X = { pre: '', rep: a }; let Y = { pre: '', rep: b };
    if (d === 'hard') { X = { pre: String(int(rng, 1, 9)), rep: String(int(rng, 1, 9)) }; Y = { pre: '', rep: chance(rng) ? String(int(rng, 1, 8)) : b }; }
    if (X.pre === X.rep) continue;
    let fx = recValueFrac(0, X.pre, X.rep); let fy = recValueFrac(0, Y.pre, Y.rep);
    if (sub && fx.value() < fy.value()) { [X, Y] = [Y, X]; [fx, fy] = [fy, fx]; }
    const ans = sub ? fx.sub(fy) : fx.add(fy);
    if (ans.n <= 0 || ans.isInt) continue;
    const texOf = (Z) => recTex({ whole: 0, ...Z });
    const denOf = (Z) => 10 ** Z.pre.length * (10 ** Z.rep.length - 1);
    const numOf = (Z) => Number(Z.pre + Z.rep) - Number(Z.pre || '0');
    const noRec = (Z) => frac(Number(Z.pre + Z.rep), 10 ** (Z.pre.length + Z.rep.length));
    const wrongs = [
      sub ? noRec(X).sub(noRec(Y)) : noRec(X).add(noRec(Y)),
      sub ? fx.add(fy) : fx.sub(fy).n > 0 ? fx.sub(fy) : fy.sub(fx),
      frac(sub ? Number(X.pre + X.rep) - Number(Y.pre + Y.rep) : Number(X.pre + X.rep) + Number(Y.pre + Y.rep), 90),
      ans.add(frac(1, Math.max(denOf(X), denOf(Y)))),
      frac(Math.abs(numOf(X) - numOf(Y)) + 1, Math.max(denOf(X), denOf(Y))),
      ans.add(frac(1, 9)),
    ].filter((f) => f.n > 0 && !f.eq(ans));
    const L = lcmOf(denOf(X), denOf(Y));
    return {
      prompt: `Work out $${texOf(X)} ${sub ? '-' : '+'} ${texOf(Y)}$<br>Give your answer as a fraction in its simplest form.`,
      answer: F(ans),
      distractors: uniq(wrongs.map((f) => F(f)), F(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `Convert each recurring decimal to a fraction: $${texOf(X)} = \\frac{${numOf(X)}}{${denOf(X)}}$ and $${texOf(Y)} = \\frac{${numOf(Y)}}{${denOf(Y)}}$.`,
        `(A repeating block of 1 digit goes over 9, of 2 digits over 99; ${X.pre ? `for $${texOf(X)}$, $100x - 10x = 90x$, so it goes over 90` : 'you can check with the $10x$ or $100x$ method'}.)`,
        `Common denominator ${L}: $\\frac{${numOf(X) * L / denOf(X)}}{${L}} ${sub ? '-' : '+'} \\frac{${numOf(Y) * L / denOf(Y)}}{${L}} = \\frac{${numOf(X) * L / denOf(X) + (sub ? -1 : 1) * numOf(Y) * L / denOf(Y)}}{${L}}${ans.d !== L ? ` = ${T(ans)}` : ''}$`,
        `Answer: ${F(ans)}`,
      ],
    };
  }
}, { title: 'Add/subtract recurring decimals' });

export const recWhich = gen('num-rec-which', 'num-recurring-decimals', (rng, d) => {
  const pool = [];
  for (const den of [3, 6, 7, 8, 9, 11, 12, 15, 16, 20, 24, 25, 30, 32, 40, 45, 50, 60, 64, 75, 80, 125]) for (let n = 1; n < den; n += 1) if (gcd(n, den) === 1) pool.push(frac(n, den));
  if (d === 'easy' || chance(rng, 0.5)) {
    const wantRec = chance(rng);
    const good = pool.filter((f) => terminates(f.n, f.d) !== wantRec);
    const bad = pool.filter((f) => terminates(f.n, f.d) === wantRec);
    const ans = pick(rng, good);
    const others = sample(rng, bad, 4);
    return {
      prompt: `Which of these fractions ${wantRec ? 'is a recurring decimal' : 'is a terminating decimal'}?`,
      answer: F(ans),
      distractors: others.map((f) => F(f)),
      solution: [
        'Write each fraction in its simplest form and look at the prime factors of the denominator.',
        'If the only prime factors are 2 and 5, the decimal terminates; any other prime factor (3, 7, 11, …) makes it recur.',
        `$${T(ans)}$: $${ans.d} = ${(ans.d === 1 ? [1] : primeList(ans.d)).join(' \\times ')}$, so it ${wantRec ? 'recurs' : 'terminates'}.`,
        `Answer: ${F(ans)}`,
      ],
    };
  }
  const list = sample(rng, pool.filter((f) => f.d <= 64), 5);
  const count = list.filter((f) => !terminates(f.n, f.d)).length;
  return {
    prompt: `How many of these fractions convert to a recurring decimal?<br>$${list.map((f) => T(f)).join(',\\qquad ')}$`,
    answer: num(count),
    distractors: [0, 1, 2, 3, 4, 5].filter((v) => v !== count).map((v) => num(v)),
    typed: { kind: 'number', value: count },
    solution: [
      'A fraction in its simplest form terminates only if its denominator has no prime factors other than 2 and 5.',
      list.map((f) => `$${T(f)}$: ${f.d} = ${primeList(f.d).join(' × ')} → ${terminates(f.n, f.d) ? 'terminates' : 'recurs'}`).join('; '),
      `Answer: ${count}`,
    ],
  };
}, { title: 'Which fractions recur?' });

function primeList(n) { const out = []; for (let p = 2; n > 1; p += 1) while (n % p === 0) { out.push(p); n /= p; } return out; }

export const generators = [
  fdpConvert, fdpGivenFact, fdpEqual,
  fdpoOrder, fdpoExtreme, fdpoClosest,
  recToFraction, recToDecimal, recArith, recWhich,
];

function lcmOf(a, b) { return (a / gcd(a, b)) * b; }
