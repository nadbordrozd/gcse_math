// Number module – unit "Rounding, estimation and bounds".
import {
  pick, int, shuffle, size, chance, tidy, roundTo, roundSf, num, tnum, money, names,
} from '../../core.js';
import { gen, uniq, dpOf } from './util.js';

const ordinalPlace = { 0: 'the nearest whole number', 1: '1 decimal place', 2: '2 decimal places', 3: '3 decimal places' };
const sfText = (k) => `${k} significant figure${k > 1 ? 's' : ''}`;
const truncTo = (x, dp) => Math.trunc(tidy(x * 10 ** dp)) / 10 ** dp;
/** Decimal places shown when x is rounded to k significant figures. */
const sfDp = (x, k) => Math.max(0, k - 1 - Math.floor(Math.log10(Math.abs(x))));

/* ================================================================== */
/* num-rounding                                                        */
/* ================================================================== */

export const roundDp = gen('num-round-dp', 'num-rounding', (rng, d) => {
  if (d === 'easy') {
    const unit = pick(rng, [10, 100, 1000, 1]);
    const x = unit === 1 ? tidy(int(rng, 101, 9999) / 100) : int(rng, unit + 1, unit * 99);
    const ans = Math.round(x / unit) * unit;
    if (x % unit === 0 || ans === 0) throw new Error('retry');
    const label = unit === 1 ? 'the nearest whole number' : `the nearest ${num(unit)}`;
    const down = Math.floor(x / unit) * unit; const up = down + unit;
    return {
      prompt: `Round ${num(x)} to ${label}.`,
      answer: num(ans),
      distractors: uniq([ans === up ? down : up, unit > 1 ? Math.round(x / (unit * 10)) * unit * 10 : roundTo(x, 1), unit > 1 && unit < 1000 ? Math.round(x / (unit / 10)) * (unit / 10) : Math.trunc(x / 10) * 10, ans + unit, Math.max(unit, ans - 2 * unit)].filter((v) => v !== ans && v > 0).map((v) => num(v)), num(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `${num(x)} is between ${num(down)} and ${num(up)}.`,
        `Look at the next digit: it is ${x - down >= unit / 2 ? 'halfway or more, so round up' : 'less than halfway, so round down'}.`,
        `Answer: ${num(ans)}`,
      ],
    };
  }
  const dp = d === 'medium' ? pick(rng, [1, 2]) : pick(rng, [1, 2, 3]);
  let x;
  if (d === 'hard' && chance(rng, 0.5)) {
    // a 9 that carries: e.g. 3.996 to 2 dp = 4.00
    const whole = int(rng, 0, 20);
    x = tidy(whole + (10 ** dp - 1) / 10 ** dp + int(rng, 5, 9) / 10 ** (dp + 1));
  } else x = tidy(int(rng, 1, 300) + int(rng, 1, 10 ** (dp + 2) - 1) / 10 ** (dp + 2));
  const ans = roundTo(x, dp);
  if (dpOf(x) <= dp) throw new Error('retry');
  const show = (v) => num(v, dp);
  const wrongs = [truncTo(x, dp), tidy(ans + 10 ** -dp), tidy(ans - 10 ** -dp), roundTo(x, dp === 1 ? 2 : dp - 1), roundTo(x, dp + 1)];
  const wrongText = wrongs.filter((v) => v !== ans && v >= 0).map((v) => num(v, dp));
  // forgetting the trailing zeros / rounding to the wrong place keeps a different number of dp
  return {
    prompt: `Round ${num(x)} to ${ordinalPlace[dp]}.`,
    answer: show(ans),
    distractors: uniq([...wrongText, num(roundTo(x, dp + 1)), num(roundTo(x, Math.max(0, dp - 1)))].filter((s) => s !== show(ans)), show(ans)),
    allowEquivalent: false,
    longDecimalsOk: true,
    typed: { kind: 'number', value: ans },
    solution: [
      `Count ${dp} digit${dp > 1 ? 's' : ''} after the decimal point: ${num(truncTo(x, dp), dp)}|${String(x).split('.')[1].slice(dp)}`,
      `The next digit is ${String(x).split('.')[1][dp]}, which is ${Number(String(x).split('.')[1][dp]) >= 5 ? '5 or more, so round up' : 'less than 5, so round down'}.`,
      ans.toFixed(dp) !== truncTo(x, dp).toFixed(dp) && /9$/.test(num(truncTo(x, dp), dp)) ? `Rounding up the 9 carries into the next column – and keep the zeros to show ${dp} decimal places: ${show(ans)}` : `Answer: ${show(ans)}`,
      ...(/9$/.test(num(truncTo(x, dp), dp)) && ans.toFixed(dp) !== truncTo(x, dp).toFixed(dp) ? [`Answer: ${show(ans)}`] : []),
    ],
  };
}, { title: 'Round to decimal places / nearest 10, 100' });

export const roundSigFig = gen('num-round-sf', 'num-rounding', (rng, d) => {
  const k = size(d, 1, pick(rng, [1, 2]), pick(rng, [2, 3]));
  const big = chance(rng, d === 'easy' ? 0.7 : 0.5);
  let x;
  if (big) x = int(rng, 10 ** (k + 1), 10 ** (k + size(d, 2, 3, 4)));
  else x = tidy(int(rng, 10 ** k + 1, 10 ** (k + 2) - 1) / 10 ** (k + 2 + int(rng, 0, size(d, 1, 2, 3))));
  const ans = roundSf(x, k);
  if (ans === x || ans === 0) throw new Error('retry');
  const dp = sfDp(x, k);
  const show = (v) => (dp > 0 ? num(v, dp) : num(v));
  const lead = Math.floor(Math.log10(x));
  const wrongs = [
    big ? Number(String(ans).replace(/0+$/, '')) : null, // dropped the zeros
    big ? null : roundTo(x, k), // rounded to k decimal places instead
    roundSf(x, k + 1),
    Math.trunc(x / 10 ** (lead - k + 1)) * 10 ** (lead - k + 1),
    ans + 10 ** (lead - k + 1), ans - 10 ** (lead - k + 1),
  ].filter((v) => v !== null && v > 0).map(tidy);
  return {
    prompt: `Round ${num(x)} to ${sfText(k)}.`,
    answer: show(ans),
    distractors: uniq(wrongs.filter((v) => v !== ans && dpOf(v) <= 6).map((v) => num(v)), show(ans)),
    typed: { kind: 'number', value: ans },
    longDecimalsOk: dp >= 4,
    solution: [
      `The first significant figure is the first non-zero digit${big ? '' : ' (zeros at the start do not count)'}.`,
      `Count ${k} significant figure${k > 1 ? 's' : ''} from there and look at the next digit to decide whether to round up.`,
      big ? `Keep the place value: fill the remaining places with zeros, so it stays about the same size (not ${num(Number(String(ans).replace(/0+$/, '')))}).` : `Answer must still have the zeros after the decimal point to keep the place value.`,
      `Answer: ${show(ans)}`,
    ],
  };
}, { title: 'Round to significant figures', longDecimalsOk: true });

export const roundReverse = gen('num-round-reverse', 'num-rounding', (rng, d) => {
  const useSf = d === 'hard' && chance(rng, 0.6);
  if (useSf) {
    const target = int(rng, 2, 9) * 10 ** int(rng, 2, 3);
    const step = target / int(rng, 2, 9) >= 100 ? 10 ** (Math.floor(Math.log10(target))) : 10 ** Math.floor(Math.log10(target));
    const half = step / 2;
    const inside = target - half + int(rng, 0, step - 1);
    const outs = [target - half - int(rng, 1, 20), target + half + int(rng, 0, 20), target + half, target - step, target + step - int(rng, 1, 9)];
    return {
      prompt: `Which of these numbers rounds to ${num(target)} when rounded to 1 significant figure?`,
      answer: num(inside),
      distractors: uniq(outs.filter((v) => roundSf(v, 1) !== target).map((v) => num(v)), num(inside)),
      typed: { kind: 'number', value: inside },
      solution: [
        `Numbers that round to ${num(target)} (1 s.f.) are from ${num(target - half)} up to (but not including) ${num(target + half)}.`,
        `${num(inside)} is in this range. ${num(target + half)} would round up to ${num(target + step)}.`,
        `Answer: ${num(inside)}`,
      ],
    };
  }
  const dp = size(d, 0, 1, pick(rng, [1, 2]));
  const target = dp === 0 ? int(rng, 3, 60) : tidy(int(rng, 10 * 10 ** (dp - 1), 99 * 10 ** (dp - 1)) / 10 ** dp);
  const h = 5 / 10 ** (dp + 1);
  const inside = tidy(target - h + pick(rng, [0, 1, 2, 3, 4, 6, 7, 8, 9]) / 10 ** (dp + 1) + (dp === 0 ? 0 : int(rng, 1, 9) / 10 ** (dp + 2)));
  const outs = [tidy(target + h), tidy(target - h - 1 / 10 ** (dp + 1)), tidy(target + 10 ** -dp), tidy(target - 10 ** -dp), tidy(target + h + 2 / 10 ** (dp + 2))];
  return {
    prompt: `Which of these numbers rounds to ${num(target, dp)} when rounded to ${ordinalPlace[dp]}?`,
    answer: num(inside),
    distractors: uniq(outs.filter((v) => roundTo(v, dp) !== target).map((v) => num(v)), num(inside)),
    typed: { kind: 'number', value: inside },
    solution: [
      `The numbers that round to ${num(target, dp)} go from ${num(tidy(target - h))} (included) up to ${num(tidy(target + h))} (not included).`,
      `${num(inside)} is in this range. ${num(tidy(target + h))} would round up to ${num(tidy(target + 10 ** -dp), dp)}.`,
      `Answer: ${num(inside)}`,
    ],
  };
}, { title: 'Which number rounds to …?', longDecimalsOk: true });

/* ================================================================== */
/* num-estimation                                                      */
/* ================================================================== */

/** Random value that rounds (1 s.f.) to r, but is not r. */
function near(rng, r, dpExtra = 2) {
  const e = Math.floor(Math.log10(r));
  const step = 10 ** e;
  for (;;) {
    const v = tidy(r + (rng() - 0.5) * step * 0.8);
    const v2 = roundSf(v, Math.min(3, Math.max(2, dpExtra + 1)));
    if (v2 > 0 && roundSf(v2, 1) === r && v2 !== r) return v2;
  }
}

const EST = [
  (rng) => { const a = pick(rng, [20, 30, 40, 50, 60, 70, 80, 90, 200, 300, 400]); const b = pick(rng, [2, 3, 4, 5, 6, 7, 8, 9, 20, 30]); return { tex: (A, B) => `${A} \\times ${B}`, r: [a, b], f: (x, y) => x * y, raw: [near(rng, a, 1), near(rng, b, 2)] }; },
  (rng) => { const b = pick(rng, [2, 3, 4, 5, 6, 8]); const a = pick(rng, [40, 60, 80, 90, 200, 300, 400, 600, 800, 900].filter((x) => x % b === 0)); return { tex: (A, B) => `${A} \\div ${B}`, r: [a, b], f: (x, y) => x / y, raw: [near(rng, a, 1), near(rng, b, 2)] }; },
  (rng) => { const a = pick(rng, [4, 6, 8, 20, 30]); const b = pick(rng, [3, 5, 7, 9, 40, 60]); const c = pick(rng, [2, 4, 5].filter((z) => (a * b) % z === 0)) || 2; return { tex: (A, B, C) => `\\dfrac{${A} \\times ${B}}{${C}}`, r: [a, b, c], f: (x, y, z) => x * y / z, raw: [near(rng, a), near(rng, b), near(rng, c)] }; },
  (rng) => { const a = pick(rng, [40, 60, 80, 90, 100, 200]); const b = pick(rng, [0.2, 0.4, 0.5]); return { tex: (A, B) => `\\dfrac{${A}}{${B}}`, r: [a, b], f: (x, y) => x / y, raw: [near(rng, a, 1), near(rng, b, 3)] }; },
  (rng) => { const a = pick(rng, [3, 4, 5, 6, 7, 8, 9]); const b = pick(rng, [2, 3, 10, 20, 50]); return { tex: (A, B) => `${A}^{2} \\times ${B}`, r: [a, b], f: (x, y) => x * x * y, raw: [near(rng, a, 2), near(rng, b, 2)] }; },
  (rng) => { const a = pick(rng, [90, 100, 300, 500, 200]); const b = pick(rng, [2, 3, 4, 5, 6, 7, 8]); const c = pick(rng, [0.2, 0.5]); return { tex: (A, B, C) => `\\dfrac{${A} + ${B}}{${C}}`, r: [a, b, c], f: (x, y, z) => (x + y) / z, raw: [near(rng, a, 1), near(rng, b, 3), near(rng, c, 3)] }; },
  (rng) => { const a = pick(rng, [6, 7, 8, 9, 20, 30]); const b = pick(rng, [4, 5, 6, 8, 9]); const c = pick(rng, [0.2, 0.4, 0.5, 0.3]); return { tex: (A, B, C) => `\\dfrac{${A} \\times ${B}}{${C}}`, r: [a, b, c], f: (x, y, z) => x * y / z, raw: [near(rng, a, 2), near(rng, b, 2), near(rng, c, 3)] }; },
];

export const estOneSf = gen('num-est-1sf', 'num-estimation', (rng, d) => {
  const pool = size(d, [0, 1, 4], [0, 1, 2, 3, 4], [2, 3, 5, 6]).map((i) => EST[i]);
  const e = pick(rng, pool)(rng);
  const est = tidy(e.f(...e.r));
  if (!Number.isInteger(est * 100) || est <= 0 || dpOf(est) > 2) throw new Error('retry');
  const exact = e.f(...e.raw);
  const truncs = e.raw.map((v) => { const p = Math.floor(Math.log10(v)); return tidy(Math.trunc(v / 10 ** p) * 10 ** p); });
  const wrong = [
    roundSf(exact, 2),
    tidy(e.f(...truncs)),
    e.r.length === 2 && e.tex(1, 1).includes('div') || e.tex(1, 1, 1).includes('dfrac{1}{1}') ? tidy(e.r[0] * e.r[1]) : tidy(est * 10),
    tidy(est / 10), tidy(est * 2), tidy(est / 2),
  ].filter((v) => v > 0 && v !== est && dpOf(v) <= 3);
  return {
    prompt: `By rounding each number to 1 significant figure, work out an estimate for<br>$${e.tex(...e.raw.map((v) => tnum(v)))}$`,
    answer: num(est),
    distractors: uniq(wrong.map((v) => num(v)), num(est)),
    typed: { kind: 'number', value: est },
    solution: [
      `Round each number to 1 significant figure: ${e.raw.map((v, i) => `${num(v)} → ${num(e.r[i])}`).join(', ')}.`,
      `$${e.tex(...e.r.map((v) => tnum(v)))} = ${tnum(est)}$`,
      e.r.some((v) => v < 1) ? 'Dividing by a number less than 1 makes the answer <b>bigger</b> (e.g. ÷ 0.5 is the same as × 2).' : 'Use the rounded numbers only – the estimate should be easy to work out in your head.',
      `Answer: ${num(est)}`,
    ],
  };
}, { title: 'Estimate by rounding to 1 s.f.' });

export const estClosest = gen('num-est-closest', 'num-estimation', (rng, d) => {
  const e = pick(rng, size(d, [EST[0], EST[1], EST[4]], [EST[2], EST[3], EST[5]], [EST[6], EST[3], EST[2], EST[5]]))(rng);
  const est = tidy(e.f(...e.r));
  if (est <= 0) throw new Error('retry');
  const k = Math.floor(Math.log10(est));
  const lead = Math.round(est / 10 ** k);
  const shift = d === 'hard' ? int(rng, -3, -1) : 0;
  const scale = 10 ** shift;
  const raw = e.raw.map((v, i) => (i === 0 ? tidy(v * scale) : v));
  const rr = e.r.map((v, i) => (i === 0 ? tidy(v * scale) : v));
  const target = tidy(e.f(...rr));
  if (dpOf(target) > 4 || dpOf(raw[0]) > 6) throw new Error('retry');
  const lo = int(rng, -4, 0); // where the answer sits among the five powers of ten varies
  const opts = [0, 1, 2, 3, 4].map((j) => tidy(target * 10 ** (j + lo)));
  if (opts.some((v) => dpOf(v) > 5 || v >= 1e7)) throw new Error('retry');
  void lead;
  return {
    prompt: `Which of these is closest in value to<br>$${e.tex(...raw.map((v) => tnum(v)))}$`,
    answer: num(target),
    distractors: opts.filter((v) => v !== target).map((v) => num(v)),
    keepOrder: true,
    longDecimalsOk: true,
    solution: [
      `Round each number to 1 significant figure: ${raw.map((v, i) => `${num(v)} → ${num(rr[i])}`).join(', ')}.`,
      `$${e.tex(...rr.map((v) => tnum(v)))} = ${tnum(target)}$`,
      `Answer: ${num(target)}`,
    ],
  };
}, { title: 'Closest in value (order of magnitude)' });

const EST_WORD = [
  (rng) => { const n = near(rng, pick(rng, [30, 40, 50, 60]), 0); const p = near(rng, pick(rng, [4, 5, 6, 7, 8]), 2); return { p: `A school buys ${num(n)} calculators costing £${num(p, 2)} each. Estimate the total cost.`, o: [n, p], r: [roundSf(n, 1), roundSf(p, 1)], est: roundSf(n, 1) * roundSf(p, 1), money: true, how: (a, b) => `$${a} \\times ${b}$` }; },
  (rng) => { const n = near(rng, pick(rng, [20, 30, 40, 50]), 0); const pp = near(rng, pick(rng, [20, 30, 40]), 0); return { p: `A theatre has ${n} rows of seats. Each row has ${pp} seats. Estimate the total number of seats in the theatre.`, o: [n, pp], r: [roundSf(n, 1), roundSf(pp, 1)], est: roundSf(n, 1) * roundSf(pp, 1), how: (a, b) => `$${a} \\times ${b}$` }; },
  (rng) => { const l = near(rng, pick(rng, [6, 8, 9]), 2); const g = near(rng, pick(rng, [0.2, 0.3]), 3); const est = roundSf(l, 1) / roundSf(g, 1); if (!Number.isInteger(est)) throw new Error('r'); return { p: `A jug holds ${num(l)} litres of squash. Each glass holds ${num(g)} litres. Estimate how many glasses can be filled.`, o: [l, g], r: [roundSf(l, 1), roundSf(g, 1)], est, how: (a, b) => `$${a} \\div ${b}$` }; },
  (rng) => { const s = near(rng, pick(rng, [40, 50, 60, 70]), 1); const t = near(rng, pick(rng, [2, 3, 4]), 2); return { p: `A car travels at an average speed of ${num(s)} km/h for ${num(t)} hours. Estimate the distance travelled.`, o: [s, t], r: [roundSf(s, 1), roundSf(t, 1)], est: roundSf(s, 1) * roundSf(t, 1), unit: 'km', how: (a, b) => `$${a} \\times ${b}$` }; },
  (rng) => { const w = near(rng, pick(rng, [9, 20, 30]), 1); const h = near(rng, pick(rng, [3, 4, 5, 6]), 2); return { p: `A wall is ${num(w)} m long and ${num(h)} m high. Estimate its area.`, o: [w, h], r: [roundSf(w, 1), roundSf(h, 1)], est: roundSf(w, 1) * roundSf(h, 1), unit: 'm²', how: (a, b) => `$${a} \\times ${b}$` }; },
  (rng) => { const n = near(rng, pick(rng, [20, 30, 40]), 0); const wk = 52; const c = near(rng, pick(rng, [3, 4, 5]), 2); return { p: `Femi spends £${num(c, 2)} on lunch each school day. There are ${n} school days this term. Estimate how much he spends on lunch this term.`, o: [c, n], r: [roundSf(c, 1), roundSf(n, 1)], est: roundSf(c, 1) * roundSf(n, 1), money: true, how: (a, b) => `$${a} \\times ${b}$`, x: wk }; },
  (rng) => { const tot = near(rng, pick(rng, [600, 800, 900]), 0); const n = near(rng, pick(rng, [20, 30]), 0); const est = roundSf(tot, 1) / roundSf(n, 1); return { p: `A group of ${n} friends share a bill of £${num(tot, 2)} equally. Estimate how much each person pays.`, o: [tot, n], r: [roundSf(tot, 1), roundSf(n, 1)], est, money: true, how: (a, b) => `$${a} \\div ${b}$` }; },
  (rng) => { const m = near(rng, pick(rng, [3, 4, 6]), 2); const k = near(rng, pick(rng, [20, 30, 40]), 0); return { p: `One box weighs ${num(m)} kg. A van carries ${k} boxes. Estimate the total weight of the boxes.`, o: [m, k], r: [roundSf(m, 1), roundSf(k, 1)], est: roundSf(m, 1) * roundSf(k, 1), unit: 'kg', how: (a, b) => `$${a} \\times ${b}$` }; },
  (rng) => { const d1 = near(rng, pick(rng, [300, 400, 600]), 0); const s = near(rng, pick(rng, [50, 60]), 0); const est = roundSf(d1, 1) / roundSf(s, 1); if (!Number.isInteger(est * 10)) throw new Error('r'); return { p: `A train travels ${num(d1)} km at an average speed of ${s} km/h. Estimate the time the journey takes, in hours.`, o: [d1, s], r: [roundSf(d1, 1), roundSf(s, 1)], est, unit: 'hours', how: (a, b) => `$${a} \\div ${b}$` }; },
  (rng) => { const n = near(rng, pick(rng, [200, 300, 500]), 0); const p = near(rng, pick(rng, [0.2, 0.4, 0.5]), 3); return { p: `${num(n)} people each give £${num(p, 2)} to a charity collection. Estimate the total amount collected.`, o: [n, p], r: [roundSf(n, 1), roundSf(p, 1)], est: roundSf(n, 1) * roundSf(p, 1), money: true, how: (a, b) => `$${a} \\times ${b}$` }; },
  (rng) => { const r = near(rng, pick(rng, [3, 4, 5]), 2); return { p: `A circular pond has radius ${num(r)} m. Using $\\pi \\approx 3$, estimate the area of the pond.`, o: [r], r: [roundSf(r, 1)], est: 3 * roundSf(r, 1) ** 2, unit: 'm²', how: (a) => `$3 \\times ${a}^{2}$` }; },
  (rng) => { const pages = near(rng, pick(rng, [300, 400, 500]), 0); const per = near(rng, pick(rng, [20, 40, 50]), 0); return { p: `Isla reads about ${per} pages a day. Her book has ${num(pages)} pages. Estimate how many days it will take her to read the book.`, o: [pages, per], r: [roundSf(pages, 1), roundSf(per, 1)], est: roundSf(pages, 1) / roundSf(per, 1), unit: 'days', how: (a, b) => `$${a} \\div ${b}$` }; },
  (rng) => { const lit = near(rng, pick(rng, [40, 50, 60]), 1); const pr = near(rng, pick(rng, [1, 2]), 2); return { p: `Diesel costs £${num(pr, 2)} per litre. Ben puts ${num(lit)} litres in his van. Estimate the cost.`, o: [pr, lit], r: [roundSf(pr, 1), roundSf(lit, 1)], est: roundSf(pr, 1) * roundSf(lit, 1), money: true, how: (a, b) => `$${a} \\times ${b}$` }; },
];

export const estWord = gen('num-est-word', 'num-estimation', (rng, d) => {
  // easy: multiply two whole-ish numbers; medium: money and division; hard: decimals below 1, π, division to a decimal
  const c = EST_WORD[pick(rng, size(d, [0, 1, 3, 4, 7, 12], [5, 6, 8, 11, 2], [2, 9, 10, 8, 6]))](rng);
  const est = tidy(c.est);
  if (!Number.isInteger(est * 10) || est <= 0) throw new Error('retry');
  const unitFor = (v) => (v === 1 ? c.unit.replace(/s$/, '') : c.unit);
  const fmt = (v) => (c.money ? money(v) : c.unit ? `${num(v)} ${unitFor(v)}` : num(v));
  return {
    prompt: c.p,
    answer: fmt(est),
    distractors: uniq([est * 10, est / 10, est * 2, est / 2, est + c.r[0], tidy(est * 1.5)].map(tidy).filter((v) => v > 0 && v !== est && dpOf(v) <= (c.money ? 2 : 1)).map(fmt), fmt(est)),
    typed: { kind: 'number', value: est },
    solution: [
      `Round ${c.r.length > 1 ? 'each number' : 'the number'} to 1 significant figure: ${c.r.map((v, i) => `${num(c.o[i])} → ${num(v)}`).join(', ')}.`,
      `${c.how(...c.r.map((v) => tnum(v)))} $= ${tnum(est)}$`,
      `Answer: about ${fmt(est)}`,
    ],
  };
}, { title: 'Estimation in context', word: true });

/* ================================================================== */
/* num-error-intervals                                                 */
/* ================================================================== */

// Each quantity lists the accuracies that make sense for it, with a realistic range [lo, hi] for the rounded value.
// u = 'sf2' means "to 2 significant figures".
const QTY = [
  { name: 'length of a pipe', v: 'l', unit: 'm', acc: [[1, 2, 20], [0.1, 1.2, 9.9], [0.01, 1.05, 4.99], ['sf2', 1.1, 9.9]] },
  { name: 'mass of a parcel', v: 'm', unit: 'kg', acc: [[1, 2, 30], [0.1, 0.5, 15], [0.01, 0.25, 4.99], ['sf2', 1.1, 9.9]] },
  { name: 'height of a tree', v: 'h', unit: 'm', acc: [[1, 3, 40], [0.1, 2.5, 25], ['sf2', 11, 39]] },
  { name: 'time taken to run a race', v: 't', unit: 's', acc: [[1, 11, 60], [0.1, 9.6, 15], [0.01, 10.05, 13.99]] },
  { name: 'volume of water in a tank', v: 'V', unit: 'litres', acc: [[10, 50, 950], [100, 200, 5000], [5, 20, 500], ['sf2', 110, 990]] },
  { name: 'width of a table', v: 'w', unit: 'cm', acc: [[1, 60, 200], [10, 60, 250], [5, 60, 200], [0.1, 60, 150]] },
  { name: 'distance between two towns', v: 'd', unit: 'km', acc: [[1, 5, 150], [10, 20, 400], [0.1, 2, 30], ['sf2', 11, 99]] },
  { name: 'temperature of an oven', v: 'T', unit: '°C', acc: [[10, 150, 250], [5, 150, 240], [1, 150, 230]] },
  { name: 'number of people at a football match', v: 'n', unit: 'people', acc: [[100, 3000, 60000], [1000, 5000, 60000], [10, 800, 9000], ['sf2', 11000, 99000]] },
];
const ACC_TEXT = { 1: 'to the nearest whole number', 10: 'to the nearest 10', 100: 'to the nearest 100', 1000: 'to the nearest 1000', 5: 'to the nearest 5', 0.1: 'to 1 decimal place', 0.01: 'to 2 decimal places', sf2: 'to 2 significant figures' };
const ACC_BY_DIFF = { easy: [1, 10], medium: [0.1, 100, 1000, 10], hard: [0.01, 5, 'sf2'] };

/** Pick a quantity, an accuracy suited to the difficulty, a realistic rounded value x and the unit u. */
function qtyFor(rng, d, { noTemp = false } = {}) {
  for (;;) {
    const q = pick(rng, QTY.filter((qq) => !noTemp || qq.unit !== '°C'));
    const opts = q.acc.filter(([u]) => ACC_BY_DIFF[d].includes(u));
    if (!opts.length) continue;
    const [uu, lo, hi] = pick(rng, opts);
    let x; let u = uu;
    if (uu === 'sf2') {
      const e = Math.floor(Math.log10(lo));
      x = tidy(int(rng, Math.ceil(lo / 10 ** (e - 1)), Math.floor(hi / 10 ** (e - 1))) * 10 ** (e - 1));
      u = tidy(10 ** (Math.floor(Math.log10(x)) - 1));
      if (x % (u * 10) === 0) continue;
    } else x = tidy(int(rng, Math.ceil(lo / uu), Math.floor(hi / uu)) * uu);
    if (uu !== 'sf2' && uu < 1 && Math.round(x / uu) % 10 === 0) continue; // avoid 3.0 / 4.10 style values
    return { q, x, u, text: ACC_TEXT[uu] };
  }
}
const ineq = (v, lo, hi, lop = '\\leqslant', hop = '<') => `$${tnum(lo)} ${lop} ${v} ${hop} ${tnum(hi)}$`;

export const eiRounded = gen('num-ei-rounded', 'num-error-intervals', (rng, d) => {
  const { q, x, u, text } = qtyFor(rng, d);
  const acc = { text };
  const h = tidy(u / 2);
  const lo = tidy(x - h); const hi = tidy(x + h);
  const ans = ineq(q.v, lo, hi);
  return {
    prompt: `The ${q.name}, $${q.v}$ ${q.unit}, is ${num(x)} ${q.unit} ${acc.text}.<br>What is the error interval for $${q.v}$?`,
    answer: ans,
    distractors: uniq([ineq(q.v, lo, hi, '\\leqslant', '\\leqslant'), ineq(q.v, lo, hi, '<', '\\leqslant'), ineq(q.v, tidy(x - u), tidy(x + u)), ineq(q.v, x, tidy(x + u)), ineq(q.v, tidy(x - h / 10), tidy(x + h / 10)), ineq(q.v, lo, hi, '<', '<')], ans),
    solution: [
      `Rounding ${acc.text} means the true value is within half of ${num(u)} (that is ${num(h)}) either side of ${num(x)}.`,
      `Lower bound: $${tnum(x)} - ${tnum(h)} = ${tnum(lo)}$. Upper bound: $${tnum(x)} + ${tnum(h)} = ${tnum(hi)}$.`,
      `The lower bound is included ($\\leqslant$); the upper bound is not ($<$), because ${num(hi)} would round up.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Error interval for a rounded value' });

export const eiTruncated = gen('num-ei-truncated', 'num-error-intervals', (rng, d) => {
  const dp = size(d, 0, 1, pick(rng, [1, 2]));
  const u = 10 ** -dp;
  const x = tidy(int(rng, 2, 99) * u + (dp === 0 ? int(rng, 0, 1) * 100 : 0));
  const v = pick(rng, ['x', 'y', 'n']);
  const ans = ineq(v, x, tidy(x + u));
  const h = u / 2;
  return {
    prompt: `A number $${v}$ is truncated to ${dp === 0 ? 'a whole number' : `${dp} decimal place${dp > 1 ? 's' : ''}`}. The result is ${num(x, dp)}.<br>What is the error interval for $${v}$?`,
    answer: ans,
    distractors: uniq([ineq(v, tidy(x - h), tidy(x + h)), ineq(v, x, tidy(x + u), '\\leqslant', '\\leqslant'), ineq(v, tidy(x - u), x, '<', '\\leqslant'), ineq(v, tidy(x - u), tidy(x + u)), ineq(v, x, tidy(x + u), '<', '<')], ans),
    solution: [
      'Truncating means chopping off the extra digits (never rounding up).',
      `So any number from ${num(x, dp)} up to, but not including, ${num(tidy(x + u), dp)} truncates to ${num(x, dp)}.`,
      `Answer: ${ans} (compare: if it were <i>rounded</i>, the interval would be ${num(tidy(x - h))} to ${num(tidy(x + h))})`,
    ],
  };
}, { title: 'Error interval for a truncated value' });

export const eiBound = gen('num-ei-bound', 'num-error-intervals', (rng, d) => {
  if (d === 'hard' || (d === 'medium' && chance(rng, 0.4))) {
    // perimeter / total of several rounded lengths
    const shape = pick(rng, [{ n: 4, name: 'square', what: 'perimeter' }, { n: 3, name: 'equilateral triangle', an: 'an', what: 'perimeter' }, { n: 6, name: 'regular hexagon', what: 'perimeter' }, { n: 5, name: 'regular pentagon', what: 'perimeter' }]);
    const u = d === 'hard' ? pick(rng, [1, 0.1]) : 1;
    const s = u === 1 ? int(rng, 4, 30) : tidy(int(rng, 21, 99) / 10);
    const upper = chance(rng);
    const b = tidy((upper ? s + u / 2 : s - u / 2) * shape.n);
    return {
      prompt: `Each side of ${shape.an || "a"} ${shape.name} is ${num(s)} cm, correct to ${u === 1 ? 'the nearest centimetre' : '1 decimal place'}.<br>Work out the <b>${upper ? 'upper' : 'lower'}</b> bound of the perimeter.`,
      answer: `${num(b)} cm`,
      distractors: uniq([tidy(s * shape.n + (upper ? u / 2 : -u / 2)), tidy(s * shape.n), tidy((upper ? s - u / 2 : s + u / 2) * shape.n), tidy((upper ? s + u : s - u) * shape.n), tidy(b + (upper ? u : -u))].filter((v) => v !== b && v > 0).map((v) => `${num(v)} cm`), `${num(b)} cm`),
      typed: { kind: 'number', value: b },
      solution: [
        `${upper ? 'Upper' : 'Lower'} bound of one side: $${tnum(s)} ${upper ? '+' : '-'} ${tnum(u / 2)} = ${tnum(tidy(upper ? s + u / 2 : s - u / 2))}$ cm.`,
        `The perimeter is ${shape.n} sides: $${shape.n} \\times ${tnum(tidy(upper ? s + u / 2 : s - u / 2))} = ${tnum(b)}$ cm.`,
        `(Don't just add ${num(u / 2)} to the perimeter – every side can be out by ${num(u / 2)}.) Answer: ${num(b)} cm`,
      ],
    };
  }
  const { q, x, u, text } = qtyFor(rng, d === 'easy' ? 'easy' : 'medium', { noTemp: true });
  const acc = { text };
  const upper = chance(rng);
  const b = tidy(upper ? x + u / 2 : x - u / 2);
  const fmt = (v) => `${num(v)} ${q.unit}`;
  return {
    prompt: `The ${q.name} is ${num(x)} ${q.unit}, ${acc.text.replace(/^to /, 'correct to ')}.<br>Write down the <b>${upper ? 'upper' : 'lower'}</b> bound.`,
    answer: fmt(b),
    distractors: uniq([tidy(upper ? x + u : x - u), tidy(upper ? x - u / 2 : x + u / 2), tidy(upper ? x + u / 20 : x - u / 20), tidy(upper ? x + u / 2 - u / 10 : x - u / 2 + u / 10), x].filter((v) => v !== b && v > 0 && dpOf(v) <= 3).map(fmt), fmt(b)),
    typed: { kind: 'number', value: b },
    solution: [
      `The value was rounded ${acc.text}, so it could be up to half of ${num(u)} (${num(u / 2)}) away.`,
      `${upper ? 'Upper' : 'Lower'} bound: $${tnum(x)} ${upper ? '+' : '-'} ${tnum(u / 2)} = ${tnum(b)}$`,
      `Answer: ${fmt(b)}`,
    ],
  };
}, { title: 'Upper and lower bounds' });

/* ================================================================== */
/* num-bounds-calc                                                     */
/* ================================================================== */

function boundsOf(x, u) { return [tidy(x - u / 2), tidy(x + u / 2)]; }
const accText = (u) => (u === 1 ? 'to the nearest whole number' : u === 0.1 ? 'to 1 decimal place' : u === 10 ? 'to the nearest 10' : u === 0.01 ? 'to 2 decimal places' : `to the nearest ${num(u)}`);

const BOUND_EXPRS = [
  { tex: 'a + b', sub: (A, B) => `${A} + ${B}`, f: (a, b) => a + b, pick: (up) => [up, up] },
  { tex: 'a - b', sub: (A, B) => `${A} - ${B}`, f: (a, b) => a - b, pick: (up) => [up, !up] },
  { tex: 'ab', sub: (A, B) => `${A} \\times ${B}`, f: (a, b) => a * b, pick: (up) => [up, up] },
  { tex: '\\dfrac{a}{b}', sub: (A, B) => `\\dfrac{${A}}{${B}}`, f: (a, b) => a / b, pick: (up) => [up, !up] },
  { tex: 'a - 2b', sub: (A, B) => `${A} - 2 \\times ${B}`, f: (a, b) => a - 2 * b, pick: (up) => [up, !up] },
  { tex: '2a^{2} - b^{2}', sub: (A, B) => `2 \\times ${A}^{2} - ${B}^{2}`, f: (a, b) => 2 * a * a - b * b, pick: (up) => [up, !up] },
  { tex: '\\dfrac{a + b}{b}', sub: (A, B) => `\\dfrac{${A} + ${B}}{${B}}`, f: (a, b) => (a + b) / b, pick: (up) => [up, !up] },
];

export const boundsCalc = gen('num-bounds-calc', 'num-bounds-calc', (rng, d) => {
  const ex = pick(rng, size(d, BOUND_EXPRS.slice(0, 3), BOUND_EXPRS.slice(0, 5), BOUND_EXPRS.slice(2, 7)));
  const ua = pick(rng, [1, 0.1, 10]); const ub = pick(rng, [1, 0.1]);
  const a = ua === 1 ? int(rng, 20, 90) : ua === 10 ? int(rng, 3, 9) * 10 : tidy(int(rng, 30, 99) / 10);
  const b = ub === 1 ? int(rng, 3, 15) : tidy(int(rng, 12, 49) / 10);
  if (ex.f(a, b) <= 0 || (ex.tex.includes('2b') && a <= 2 * b + 2)) throw new Error('retry');
  const upper = chance(rng);
  const [aL, aU] = boundsOf(a, ua); const [bL, bU] = boundsOf(b, ub);
  const [useAU, useBU] = ex.pick(upper);
  const A = useAU ? aU : aL; const B = useBU ? bU : bL;
  const raw = ex.f(A, B);
  const exact = dpOf(tidy(raw)) <= 3;
  const val = exact ? tidy(raw) : roundSf(raw, 4);
  const dpShow = exact ? null : sfDpOf(val, 4);
  const show = (v) => (exact ? num(tidy(v)) : num(roundSf(v, 4), sfDpOf(roundSf(v, 4), 4)));
  const wrongPick = ex.f(useAU ? aU : aL, useBU ? bL : bU);
  const wrongs = [ex.f(a, b), wrongPick, ex.f(useAU ? aL : aU, useBU ? bU : bL), ex.f(useAU ? a + ua : a - ua, useBU ? b + ub : b - ub), ex.f(upper ? aU : aL, upper ? bU : bL)];
  return {
    prompt: `$a = ${tnum(a, ua === 0.1 ? 1 : null)}$ ${accText(ua)}.<br>$b = ${tnum(b, ub === 0.1 ? 1 : null)}$ ${accText(ub)}.<br>Work out the <b>${upper ? 'upper' : 'lower'}</b> bound of $${ex.tex}$.${exact ? '' : '<br>Give your answer to 4 significant figures.'}`,
    answer: show(val),
    distractors: uniq(wrongs.filter((v) => Number.isFinite(v) && v > 0).map(show).filter((s) => s !== show(val)), show(val)),
    typed: { kind: 'number', value: val, ...(exact ? {} : { tolerance: 0.5 * 10 ** -dpShow }) },
    calculator: true,
    longDecimalsOk: true,
    solution: [
      `Bounds: $${tnum(aL)} \\leqslant a < ${tnum(aU)}$ and $${tnum(bL)} \\leqslant b < ${tnum(bU)}$.`,
      `To make $${ex.tex}$ as ${upper ? 'large' : 'small'} as possible use the ${useAU ? 'upper' : 'lower'} bound of $a$ and the ${useBU ? 'upper' : 'lower'} bound of $b$${useAU !== useBU ? ` (${ex.tex.includes('frac') ? 'dividing' : 'subtracting'} a ${useBU ? 'bigger' : 'smaller'} number makes the result ${upper ? 'bigger' : 'smaller'})` : ''}.`,
      `$${ex.sub(tnum(A), tnum(B))} = ${tnum(roundTo(raw, 6))}$`,
      `Answer: ${show(val)}`,
    ],
  };
}, { title: 'Upper/lower bound of a calculation' });
function sfDpOf(v, k) { return Math.max(0, k - 1 - Math.floor(Math.log10(Math.abs(v)))); }

const BOUND_WORD = [
  { make: (rng) => { const D = int(rng, 100, 400); const t = int(rng, 8, 40); return { p: `A cyclist travels ${D} m, correct to the nearest metre, in ${t} seconds, correct to the nearest second. Work out the upper bound of her average speed in m/s.`, f: () => (D + 0.5) / (t - 0.5), wrong: [D / t, (D + 0.5) / (t + 0.5), (D - 0.5) / (t - 0.5), (D + 1) / (t - 1)], steps: [`Upper bound of speed = upper bound of distance ÷ <b>lower</b> bound of time`, `$${tnum(D + 0.5)} \\div ${tnum(t - 0.5)}$`], unit: 'm/s' }; } },
  { make: (rng) => { const L = int(rng, 5, 20); const W = int(rng, 3, 12); return { p: `A rectangular rug measures ${L} m by ${W} m, both correct to the nearest metre. Work out the lower bound of its area.`, f: () => (L - 0.5) * (W - 0.5), wrong: [L * W, (L - 1) * (W - 1), (L + 0.5) * (W - 0.5), L * W - 0.5], steps: [`Lower bounds: ${num(L - 0.5)} m and ${num(W - 0.5)} m`, `$${tnum(L - 0.5)} \\times ${tnum(W - 0.5)}$`], unit: 'm²' }; } },
  { make: (rng) => { const m = int(rng, 200, 900); const v = int(rng, 40, 150); return { p: `A metal block has mass ${m} g, correct to the nearest gram, and volume ${v} cm³, correct to the nearest cm³. Work out the lower bound of its density in g/cm³.`, f: () => (m - 0.5) / (v + 0.5), wrong: [m / v, (m - 0.5) / (v - 0.5), (m + 0.5) / (v + 0.5), (m - 1) / (v + 1)], steps: [`Lower bound of density = lower bound of mass ÷ <b>upper</b> bound of volume`, `$${tnum(m - 0.5)} \\div ${tnum(v + 0.5)}$`], unit: 'g/cm³' }; } },
  { make: (rng) => { const L = int(rng, 30, 80) * 10; const p = int(rng, 30, 70); return { p: `A roll of ribbon is ${L} cm long, correct to the nearest 10 cm. Pieces ${p} cm long, correct to the nearest cm, are cut from it. What is the greatest number of pieces that can <b>definitely</b> be cut?`, f: () => Math.floor((L - 5) / (p + 0.5)), int: true, wrong: [Math.floor(L / p), Math.floor((L + 5) / (p - 0.5)), Math.ceil((L - 5) / (p + 0.5)), Math.floor((L - 5) / p)], steps: [`To be certain, use the <b>shortest</b> possible ribbon (${L - 5} cm) and the <b>longest</b> possible pieces (${num(p + 0.5)} cm).`, `$${L - 5} \\div ${tnum(p + 0.5)} = ${tnum(roundTo((L - 5) / (p + 0.5), 3))}\\ldots$, so only whole pieces count.`], unit: '' }; } },
  { make: (rng) => { const D = int(rng, 50, 300); const s = int(rng, 40, 90); return { p: `A coach travels ${D} km, correct to the nearest km, at an average speed of ${s} km/h, correct to the nearest km/h. Work out the upper bound of the time taken, in hours.`, f: () => (D + 0.5) / (s - 0.5), wrong: [D / s, (D + 0.5) / (s + 0.5), (D - 0.5) / (s - 0.5), (D + 1) / (s - 1)], steps: [`time = distance ÷ speed; upper bound uses the upper distance and the <b>lower</b> speed`, `$${tnum(D + 0.5)} \\div ${tnum(s - 0.5)}$`], unit: 'hours' }; } },
  { make: (rng) => { const s = tidy(int(rng, 21, 89) / 10); return { p: `The side of a square tile is ${num(s)} cm, correct to 1 decimal place. Work out the upper bound of the area of the tile.`, f: () => (s + 0.05) ** 2, wrong: [s * s, (s + 0.5) ** 2, s * s + 0.05, (s + 0.1) ** 2], steps: [`Upper bound of the side: $${tnum(s)} + 0.05 = ${tnum(tidy(s + 0.05))}$`, `$${tnum(tidy(s + 0.05))}^{2}$`], unit: 'cm²' }; } },
  { make: (rng) => { const s = int(rng, 4, 15); return { p: `A cube has edges of length ${s} cm, correct to the nearest cm. Work out the lower bound of its volume.`, f: () => (s - 0.5) ** 3, wrong: [s ** 3, (s - 1) ** 3, s ** 3 - 0.5, (s + 0.5) ** 3], steps: [`Lower bound of an edge: ${num(s - 0.5)} cm`, `$${tnum(s - 0.5)}^{3}$`], unit: 'cm³' }; } },
  { make: (rng) => { const T = int(rng, 12, 48) * 10; const n = int(rng, 6, 15); return { p: `${n} identical books weigh ${T} g altogether, correct to the nearest 10 g. Work out the upper bound of the mass of one book.`, f: () => (T + 5) / n, wrong: [T / n, (T + 0.5) / n, (T - 5) / n, (T + 10) / n], steps: [`Upper bound of the total: ${T + 5} g (nearest 10 g means ± 5 g)`, `$${T + 5} \\div ${n}$`], unit: 'g' }; } },
  { make: (rng) => { const c = int(rng, 20, 60); const a = int(rng, 5, 15); return { p: `A field has area ${c * 10} m², correct to the nearest 10 m². One bag of seed covers ${a} m², correct to the nearest m². Work out the upper bound of the number of bags needed (give your answer to 4 significant figures).`, f: () => (c * 10 + 5) / (a - 0.5), wrong: [c * 10 / a, (c * 10 + 5) / (a + 0.5), (c * 10 - 5) / (a - 0.5), (c * 10 + 10) / (a - 1)], steps: [`Upper bound = largest area ÷ <b>smallest</b> coverage`, `$${c * 10 + 5} \\div ${tnum(a - 0.5)}$`], unit: '' }; } },
  { make: (rng) => { const p = tidy(int(rng, 120, 480) / 10); const w = int(rng, 6, 20); return { p: `The perimeter of a rectangle is ${num(p)} cm, correct to 1 decimal place. Its width is ${w} cm, correct to the nearest cm. Work out the upper bound of its length.`, f: () => (p + 0.05) / 2 - (w - 0.5), wrong: [p / 2 - w, (p + 0.05) / 2 - (w + 0.5), (p + 0.05) - (w - 0.5), (p + 0.5) / 2 - (w - 0.5)], steps: [`length = perimeter ÷ 2 − width; upper bound uses the upper perimeter and the <b>lower</b> width`, `$${tnum(tidy(p + 0.05))} \\div 2 - ${tnum(w - 0.5)}$`], unit: 'cm' }; } },
  { make: (rng) => { const d1 = int(rng, 10, 40); const t = int(rng, 2, 6); return { p: `A runner covers ${d1} km, correct to the nearest km, in ${t} hours, correct to the nearest hour. Work out the lower bound of her average speed.`, f: () => (d1 - 0.5) / (t + 0.5), wrong: [d1 / t, (d1 - 0.5) / (t - 0.5), (d1 + 0.5) / (t + 0.5), (d1 - 1) / (t + 1)], steps: [`Lower bound of speed = lower distance ÷ <b>upper</b> time`, `$${tnum(d1 - 0.5)} \\div ${tnum(t + 0.5)}$`], unit: 'km/h' }; } },
  { make: (rng) => { const r = int(rng, 3, 12); return { p: `The radius of a circle is ${r} cm, correct to the nearest cm. Work out the upper bound of its circumference.`, f: () => 2 * Math.PI * (r + 0.5), wrong: [2 * Math.PI * r, Math.PI * (r + 0.5) ** 2, 2 * Math.PI * (r + 1), Math.PI * (r + 0.5)], steps: [`Upper bound of the radius: ${num(r + 0.5)} cm`, `$2 \\times \\pi \\times ${tnum(r + 0.5)}$`], unit: 'cm' }; } },
];

export const boundsWord = gen('num-bounds-word', 'num-bounds-calc', (rng, d) => {
  // easy: areas/volumes/totals (multiply); medium: rates (divide, mixed bounds); hard: "definitely", reverse formulae
  const c = BOUND_WORD[pick(rng, size(d, [1, 5, 6, 7, 11], [0, 2, 4, 10], [3, 8, 9, 2, 4]))].make(rng);
  const raw = c.f();
  const exact = c.int || dpOf(tidy(raw)) <= 3;
  const val = c.int ? raw : exact ? tidy(raw) : roundSf(raw, 4);
  const dps = exact ? null : sfDpOf(val, 4);
  const show = (v) => (c.int ? num(v) : exact ? num(tidy(v)) : num(roundSf(v, 4), sfDpOf(roundSf(v, 4), 4)));
  const fmt = (v) => `${show(v)}${c.unit ? ` ${c.unit}` : ''}`;
  const needsSf = !exact && !/significant/.test(c.p);
  // when the answer is exact, only show distractors that are exact too (no 10-digit decimals)
  const wrongs = c.wrong.filter((v) => Number.isFinite(v) && v > 0 && (!exact || c.int || dpOf(tidy(v)) <= 3));
  return {
    prompt: `${c.p}${needsSf ? ' Give your answer to 4 significant figures.' : ''}`,
    answer: fmt(val),
    distractors: uniq(wrongs.map(fmt).filter((s) => s !== fmt(val)), fmt(val)),
    typed: { kind: 'number', value: val, ...(dps === null ? {} : { tolerance: 0.5 * 10 ** -dps }) },
    calculator: true,
    longDecimalsOk: true,
    solution: [...c.steps, `$= ${tnum(roundTo(raw, 5))}${exact ? '' : '\\ldots'}$`, `Answer: ${fmt(val)}`],
  };
}, { title: 'Bounds in context', word: true });

export const boundsAccuracy = gen('num-bounds-accuracy', 'num-bounds-calc', (rng, d) => {
  // easy: x = d × t; medium: x = d ÷ t; hard: x = d ÷ t² (all values correct to 1 decimal place)
  const EX = {
    easy: { tex: 'x = dt', f: (a, b) => a * b, sub: (a, b) => `${a} \\times ${b}`, hiPick: [1, 1] },
    medium: { tex: 'x = \\dfrac{d}{t}', f: (a, b) => a / b, sub: (a, b) => `${a} \\div ${b}`, hiPick: [1, -1] },
    hard: { tex: 'x = \\dfrac{d}{t^{2}}', f: (a, b) => a / (b * b), sub: (a, b) => `${a} \\div ${b}^{2}`, hiPick: [1, -1] },
  }[d];
  for (;;) {
    const D = tidy(int(rng, size(d, 21, 200, 200), size(d, 99, 900, 990)) / 10); const t = tidy(int(rng, size(d, 21, 20, 21), size(d, 99, 90, 60)) / 10);
    const h = 0.05;
    const hiD = tidy(D + h * EX.hiPick[0]); const hiT = tidy(t + h * EX.hiPick[1]);
    const loD = tidy(D - h * EX.hiPick[0]); const loT = tidy(t - h * EX.hiPick[1]);
    const lo = EX.f(loD, loT); const hi = EX.f(hiD, hiT);
    let k = 4;
    while (k > 0 && roundSf(lo, k) !== roundSf(hi, k)) k -= 1;
    if (k < 1 || k > 3) continue;
    const ans = roundSf(lo, k);
    const dpA = sfDpOf(ans, k);
    const val = EX.f(D, t);
    const opts = [roundSf(val, k + 1), roundSf(lo, k + 1), roundSf(hi, k + 1), roundSf(val, k + 2)];
    const ansText = num(ans, dpA);
    const others = uniq(opts.map((v) => num(v, sfDpOf(v, k + 1))).filter((s) => s !== ansText && Number(s.replace(/,/g, '')) !== ans), ansText);
    if (others.length < 3) continue;
    return {
      prompt: `$${EX.tex}$<br>$d = ${tnum(D, 1)}$ correct to 1 decimal place.<br>$t = ${tnum(t, 1)}$ correct to 1 decimal place.<br>By considering bounds, work out the value of $x$ to a suitable degree of accuracy.`,
      answer: ansText,
      distractors: others,
      count: Math.min(5, others.length + 1),
      calculator: true,
      longDecimalsOk: true,
      solution: [
        `Upper bound: $x = ${EX.sub(tnum(hiD), tnum(hiT))} = ${tnum(roundTo(hi, 5))}${dpOf(tidy(hi)) > 5 ? '\\ldots' : ''}$`,
        `Lower bound: $x = ${EX.sub(tnum(loD), tnum(loT))} = ${tnum(roundTo(lo, 5))}${dpOf(tidy(lo)) > 5 ? '\\ldots' : ''}$`,
        `Both bounds round to ${ansText} (${sfText(k)}), but they would not agree to ${sfText(k + 1)}.`,
        `Answer: ${ansText}`,
      ],
    };
  }
}, { title: 'Suitable degree of accuracy from bounds' });

export const generators = [
  roundDp, roundSigFig, roundReverse,
  estOneSf, estClosest, estWord,
  eiRounded, eiTruncated, eiBound,
  boundsCalc, boundsWord, boundsAccuracy,
];

void [shuffle, names];
