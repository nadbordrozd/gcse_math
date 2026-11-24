// Statistics generators (Higher): cumulative frequency, quartiles and box plots, histograms.
import {
  pick, int, size, shuffle, num, tnum, roundTo, tidy, table, chance, frac, ordinal,
} from '../../core.js';
import {
  sgen, fracDistractors, sum, sorted, median, quartiles, numDistractors, randInts, ineq, peakedFreqs, isClean, unsortedOrder, spaced,
} from './util.js';
import { cumulativeFrequencyGraph, boxPlot, histogram } from './charts.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------------ */
/* Cumulative frequency                                                 */
/* ------------------------------------------------------------------ */

const CF_CTX = [
  { v: 'm', head: 'Mark, $m$', unit: 'marks', what: 'the marks of some students in a test', who: 'students', noun: 'mark', start: [20, 30, 40], w: [10] },
  { v: 'm', head: 'Mass, $m$ (grams)', unit: 'g', what: 'the masses of some apples', who: 'apples', noun: 'mass', start: [60, 70], w: [5, 10] },
  { v: 't', head: 'Time, $t$ (hours)', unit: 'hours', what: 'the battery life of some phones', who: 'phones', noun: 'battery life', start: [0, 10], w: [5, 10] },
  { v: 'h', head: 'Height, $h$ (cm)', unit: 'cm', what: 'the heights of some athletes', who: 'athletes', noun: 'height', start: [150, 160], w: [10] },
  { v: 'm', head: 'Mass, $m$ (grams)', unit: 'g', what: 'the masses of some necklaces', who: 'necklaces', noun: 'mass', start: [0], w: [5] },
  { v: 'a', head: 'Age, $a$ (years)', unit: 'years', what: 'the ages of the people attending a clinic', who: 'people', noun: 'age', start: [20, 30], w: [10] },
  { v: 't', head: 'Time, $t$ (minutes)', unit: 'minutes', what: 'the times taken by some runners to finish a fun run', who: 'runners', noun: 'time', start: [20, 30], w: [5, 10] },
  { v: 'd', head: 'Distance, $d$ (km)', unit: 'km', what: 'the distances some employees travel to work', who: 'employees', noun: 'distance', start: [0], w: [5, 10] },
];
const CF_N = [40, 60, 80, 100, 120, 160, 200];
function cfData(rng, d) {
  const ctx = pick(rng, CF_CTX);
  const k = size(d, 5, pick(rng, [5, 6]), 6);
  const w = pick(rng, ctx.w); const start = pick(rng, ctx.start);
  const N = pick(rng, size(d, [40, 60, 80, 100], CF_N, CF_N));
  const fs = peakedFreqs(rng, k, N, { min: Math.max(1, Math.round(N / 40)) });
  const classes = fs.map((f, i) => ({ a: start + i * w, b: start + (i + 1) * w, f }));
  let c = 0; const cfs = classes.map((cl) => (c += cl.f));
  const ystep = N <= 60 ? 10 : N <= 100 ? 10 : 20;
  const yminor = ystep === 10 ? 5 : 4;
  const xminor = w === 10 ? 5 : 5;
  const points = [[start, 0], ...classes.map((cl, i) => [cl.b, cfs[i]])];
  const G = cumulativeFrequencyGraph({ points, x: { min: start, max: start + k * w, step: w, minor: xminor, title: ctx.head.replace(/\$([a-z])\$/, '$1'), breakAxis: start > 0 }, y: { max: N, step: ystep, minor: yminor, title: 'Cumulative frequency' } });
  return { ctx, classes, cfs, N, w, start, k, G, xs: w / xminor, ys: ystep / yminor };
}
const cfTable = (ctx, classes) => table([[ctx.head, 'Frequency'], ...classes.map((c) => [`$${ineq(c.a, c.b, ctx.v)}$`, num(c.f)])]);
const unitOf = (ctx) => (ctx.unit === 'marks' ? '' : ` ${ctx.unit}`);
/** Reading from the curve, rounded to the nearest whole unit. */
const readX = (C, cf) => Math.round(C.G.spline.inverse(cf));

export const cfTableQ = sgen('stat-cf-table', 'stat-cumulative-frequency', (rng, d) => {
  const C = cfData(rng, d);
  const { ctx, classes, cfs, N } = C;
  const q = size(d, 'complete', pick(rng, ['complete', 'class']), pick(rng, ['class', 'point']));
  if (q === 'complete') {
    const i = int(rng, 2, classes.length - 1);
    const shown = classes.map((c, m) => [`$${ctx.v} \\leqslant ${num(c.b)}$`, m < i ? num(cfs[m]) : '']);
    return {
      prompt: `The table shows information about ${ctx.what}.${cfTable(ctx, classes)}A cumulative frequency table is being completed:${table([[ctx.head.replace(/, \$[a-z]\$/, ''), 'Cumulative frequency'], ...shown])}What is the cumulative frequency for $${ctx.v} \\leqslant ${num(classes[i].b)}$?`,
      answer: num(cfs[i]),
      distractors: numDistractors(cfs[i], [classes[i].f, cfs[i - 1], cfs[i] + classes[i].f, cfs[i - 1] + classes[i + 1 < classes.length ? i + 1 : i - 1].f, N - cfs[i], cfs[i] + 1], { integer: true }),
      typed: { kind: 'number', value: cfs[i] },
      solution: ['Cumulative frequency is a <b>running total</b> of the frequencies.', `$${cfs[i - 1]} + ${classes[i].f} = ${cfs[i]}$`, `Answer: ${cfs[i]}`],
    };
  }
  if (q === 'class') {
    const which = pick(rng, d === 'medium' ? ['median', 'lower quartile'] : ['lower quartile', 'upper quartile', 'median']);
    const pos = which === 'median' ? N / 2 : which === 'lower quartile' ? N / 4 : (3 * N) / 4;
    const idx = cfs.findIndex((c) => c >= pos);
    if (cfs.includes(pos) || cfs.includes(pos + 1)) throw new Error('boundary');
    const opts = classes.map((c) => `$${ineq(c.a, c.b, ctx.v)}$`);
    return {
      prompt: `The table shows information about ${ctx.what}.${cfTable(ctx, classes)}Which class interval contains the ${which}?`,
      answer: opts[idx],
      distractors: opts.filter((_, m) => m !== idx),
      count: Math.min(5, classes.length),
      keepOrder: true,
      solution: [
        `Running totals: ${cfs.join(', ')}.`,
        `The ${which} is ${which === 'median' ? 'half' : which === 'lower quartile' ? 'a quarter of the' : 'three quarters of the'} way through the data: about the ${ordinal(pos)} value out of ${N}.`,
        `The running total first reaches ${num(pos)} in ${opts[idx]}.`,
        `Answer: ${opts[idx]}`,
      ],
    };
  }
  const i = int(rng, 1, classes.length - 1);
  const c = classes[i];
  const t = (a, b) => `(${num(a)}, ${num(b)})`;
  return {
    prompt: `The table shows information about ${ctx.what}.${cfTable(ctx, classes)}A cumulative frequency graph is drawn. Which point is plotted for the class $${ineq(c.a, c.b, ctx.v)}$?`,
    answer: t(c.b, cfs[i]),
    distractors: [t((c.a + c.b) / 2, cfs[i]), t(c.a, cfs[i]), t(c.b, c.f), t((c.a + c.b) / 2, c.f), t(c.a, cfs[i - 1] ?? 0)],
    typed: { kind: 'coord', x: c.b, y: cfs[i] },
    solution: ['Plot cumulative frequency against the <b>upper class boundary</b>: by the end of the class, that many values have been counted.', `Upper boundary ${num(c.b)}; cumulative frequency $${cfs.slice(0, i + 1).length > 1 ? `${cfs[i - 1]} + ${c.f} = ` : ''}${cfs[i]}$.`, `Answer: ${t(c.b, cfs[i])}`],
  };
}, { title: 'Cumulative frequency tables' });

export const cfRead = sgen('stat-cf-read', 'stat-cumulative-frequency', (rng, d) => {
  const C = cfData(rng, d);
  const { ctx, N } = C;
  const q = size(d, 'median', pick(rng, ['median', 'lq', 'uq']), 'iqr');
  const med = readX(C, N / 2); const lq = readX(C, N / 4); const uq = readX(C, (3 * N) / 4);
  const tol = Math.max(1, C.xs);
  const u = unitOf(ctx);
  const f = (v) => `${num(v)}${u}`;
  const intro = `The cumulative frequency graph shows information about ${ctx.what}.`;
  const readStep = (cf, name, val) => `Go across from ${num(cf)} on the cumulative frequency axis to the curve, then down: the ${name} is about ${num(val)}.`;
  if (q === 'iqr') {
    const iqr = uq - lq;
    return {
      prompt: `${intro}<br>Use the graph to estimate the interquartile range.`,
      visual: C.G.svg, answer: f(iqr),
      distractors: numDistractors(iqr, [uq + lq, uq, med - lq, uq - med, readX(C, (3 * N) / 4 + N / 8) - readX(C, N / 8), C.k * C.w], { fmt: f, minGap: 2 * tol }),
      typed: { kind: 'number', value: iqr, tolerance: 2 * tol },
      solution: [`There are ${N} values. Lower quartile at $\\frac{1}{4} \\times ${N} = ${num(N / 4)}$; upper quartile at $\\frac{3}{4} \\times ${N} = ${num((3 * N) / 4)}$.`, readStep(N / 4, 'lower quartile', lq), readStep((3 * N) / 4, 'upper quartile', uq), `IQR $= ${uq} - ${lq} = ${iqr}$ (subtract, don't add!)`, `Answer: about ${f(iqr)}`],
    };
  }
  const [cf, val, name] = q === 'median' ? [N / 2, med, 'median'] : q === 'lq' ? [N / 4, lq, 'lower quartile'] : [(3 * N) / 4, uq, 'upper quartile'];
  return {
    prompt: `${intro}<br>Use the graph to estimate the ${name}.`,
    visual: C.G.svg, answer: f(val),
    distractors: numDistractors(val, [med, lq, uq, readX(C, (N + 1) / 2 + N / 10), Math.round(C.G.spline.at(C.start + C.k * C.w / 2)), C.start + (C.k * C.w) / 2, val + 3 * tol, val - 3 * tol], { fmt: f, minGap: 2 * tol }),
    typed: { kind: 'number', value: val, tolerance: tol },
    solution: [`There are ${N} values, so the ${name} is at a cumulative frequency of ${name === 'median' ? '$\\frac{1}{2}' : name === 'lower quartile' ? '$\\frac{1}{4}' : '$\\frac{3}{4}'} \\times ${N} = ${num(cf)}$.`, readStep(cf, name, val), `Answer: about ${f(val)}`],
  };
}, { title: 'Median and quartiles from a cumulative frequency graph' });

export const cfCount = sgen('stat-cf-count', 'stat-cumulative-frequency', (rng, d) => {
  const C = cfData(rng, d);
  const { ctx, N } = C;
  const intro = `The cumulative frequency graph shows information about ${ctx.what}.`;
  const u = unitOf(ctx);
  if (d === 'hard' && chance(rng, 0.5)) {
    const pct = pick(rng, [10, 20, 25, 30, 40]);
    const top = chance(rng);
    const cf = top ? N * (1 - pct / 100) : N * (pct / 100);
    if (!Number.isInteger(cf)) throw new Error('pct');
    const val = readX(C, cf);
    const tol = Math.max(1, C.xs);
    return {
      prompt: `${intro}<br>Estimate the ${top ? 'lowest' : 'highest'} ${ctx.noun} in the ${top ? 'top' : 'bottom'} ${pct}%.`,
      visual: C.G.svg, answer: `${num(val)}${u}`,
      distractors: numDistractors(val, [readX(C, top ? N * (pct / 100) : N * (1 - pct / 100)), readX(C, N / 2), val + 3 * tol, val - 3 * tol, pct], { fmt: (v) => `${num(v)}${u}`, minGap: 2 * tol }),
      typed: { kind: 'number', value: val, tolerance: tol },
      solution: [`${pct}% of ${N} is ${num(N * pct / 100)}.`, top ? `The top ${pct}% start after the first $${N} - ${num(N * pct / 100)} = ${num(cf)}$ values.` : `The bottom ${pct}% are the first ${num(cf)} values.`, `Read across from ${num(cf)} to the curve and down: about ${num(val)}.`, `Answer: about ${num(val)}${u}`],
    };
  }
  // value on a major or minor gridline inside the data
  const xv = C.start + C.xs * int(rng, Math.round(C.w / C.xs), Math.round(((C.k - 1) * C.w) / C.xs));
  const cfAt = Math.round(C.G.spline.at(xv));
  const more = chance(rng, d === 'easy' ? 0.3 : 0.6);
  const ans = more ? N - cfAt : cfAt;
  const tol = Math.max(1, C.ys);
  const what = more ? `more than ${num(xv)}${u}` : `less than ${num(xv)}${u}`;
  return {
    prompt: `${intro}<br>Estimate how many ${ctx.who} had a ${ctx.noun} of ${what}.`,
    visual: C.G.svg, answer: num(ans),
    distractors: numDistractors(ans, [more ? cfAt : N - cfAt, xv, ans + 3 * tol, ans - 3 * tol, N, Math.round(C.G.spline.at(xv + C.w)) - (more ? 0 : 0)], { minGap: 2 * tol, integer: true }),
    typed: { kind: 'number', value: ans, tolerance: tol },
    solution: [`Go up from ${num(xv)} on the horizontal axis to the curve, then across: about ${cfAt} have a value less than ${num(xv)}.`, ...(more ? [`"More than" means the rest: $${N} - ${cfAt} = ${N - cfAt}$`] : []), `Answer: about ${ans}`],
  };
}, { title: 'Estimates from a cumulative frequency graph' });

/* ------------------------------------------------------------------ */
/* Quartiles and box plots                                              */
/* ------------------------------------------------------------------ */

const BOX_CTX = [
  { what: 'the points scored by a basketball team in some games', unit: 'points', title: 'Points scored', lo: 70, hi: 125, axis: { step: 10, minor: 5 } },
  { what: 'the times, in minutes, that some people took to complete a survey', unit: 'minutes', title: 'Time (minutes)', lo: 2, hi: 24, axis: { step: 2, minor: 2 } },
  { what: 'the amounts of money, in £, raised by some students for charity', unit: '£', title: 'Amount raised (£)', lo: 2, hi: 30, axis: { step: 5, minor: 5 } },
  { what: 'the battery lives, in hours, of some phones', unit: 'hours', title: 'Battery life (hours)', lo: 8, hi: 30, axis: { step: 2, minor: 2 } },
  { what: 'the marks of some students in a test', unit: 'marks', title: 'Mark', lo: 15, hi: 80, axis: { step: 10, minor: 5 } },
  { what: 'the heights, in cm, of some seedlings', unit: 'cm', title: 'Height (cm)', lo: 4, hi: 30, axis: { step: 5, minor: 5 } },
  { what: 'the distances, in metres, that some students threw a ball', unit: 'm', title: 'Distance (m)', lo: 8, hi: 40, axis: { step: 5, minor: 5 } },
  { what: 'the ages of the members of a book club', unit: 'years', title: 'Age (years)', lo: 18, hi: 80, axis: { step: 10, minor: 5 } },
];
const boxFmt = (ctx) => (v) => (ctx.unit === '£' ? `£${num(v)}` : `${num(v)}${ctx.unit === 'marks' || ctx.unit === 'points' ? '' : ` ${ctx.unit}`}`);
/** Summary values on whole numbers inside the context range. */
function boxSummary(rng, ctx) {
  for (let t = 0; t < 200; t += 1) {
    const v = sorted(randInts(rng, 5, ctx.lo, ctx.hi));
    if (new Set(v).size < 5 || v[4] - v[0] < (ctx.hi - ctx.lo) * 0.5) continue;
    if (v[2] - v[1] < 1 || v[3] - v[2] < 1) continue;
    return { min: v[0], q1: v[1], med: v[2], q3: v[3], max: v[4] };
  }
  throw new Error('box summary');
}
const boxAxis = (ctx, ...plots) => {
  const st = ctx.axis.step;
  const lo = Math.floor(Math.min(...plots.map((p) => p.min)) / st) * st;
  const hi = Math.ceil(Math.max(...plots.map((p) => p.max)) / st) * st;
  return { min: lo, max: Math.max(hi, lo + 4 * st), step: st, minor: ctx.axis.minor, title: ctx.title };
};

export const boxQuartiles = sgen('stat-box-quartiles', 'stat-box-plots', (rng, d) => {
  const ctx = pick(rng, BOX_CTX);
  const n = size(d, pick(rng, [7, 11]), pick(rng, [11, 15]), pick(rng, [15, 19]));
  const vals = randInts(rng, n, ctx.lo, ctx.hi);
  const Q = quartiles(vals);
  const s = sorted(vals);
  const shown = d === 'hard' ? unsortedOrder(rng, vals) : s;
  const ask = pick(rng, size(d, ['lq', 'uq'], ['lq', 'uq', 'iqr'], ['iqr', 'iqr', 'uq']));
  const f = boxFmt(ctx);
  const p1 = (n + 1) / 4; const p3 = (3 * (n + 1)) / 4;
  const ans = ask === 'lq' ? Q.q1 : ask === 'uq' ? Q.q3 : Q.q3 - Q.q1;
  if (ask === 'iqr' && Q.q3 === Q.q1) throw new Error('zero iqr');
  const wrongPos = (p) => s[Math.min(n - 1, Math.max(0, Math.round(p) - 1 + 1))];
  const dist = ask === 'iqr' ? [Q.q3 + Q.q1, Q.max - Q.min, Q.med, Q.q3, shown[Math.round(p3) - 1] - shown[Math.round(p1) - 1], s[p3] - s[p1 - 2] ?? null]
    : [Q.med, ask === 'lq' ? Q.q3 : Q.q1, wrongPos(ask === 'lq' ? p1 : p3), ask === 'lq' ? p1 : p3, shown[Math.round(ask === 'lq' ? p1 : p3) - 1], (ask === 'lq' ? Q.min + Q.med : Q.med + Q.max) / 2 === ans ? null : (ask === 'lq' ? Q.min + Q.med : Q.med + Q.max) / 2];
  return {
    prompt: `Here are ${ctx.what}${d === 'hard' ? '' : ', in order'}.${spaced(shown)}Work out the ${{ lq: 'lower quartile', uq: 'upper quartile', iqr: 'interquartile range' }[ask]}.`,
    answer: f(ans),
    distractors: numDistractors(ans, dist, { fmt: f }),
    typed: { kind: 'number', value: ans },
    solution: [
      ...(d === 'hard' ? [`First put the values in order: ${s.join(', ')}.`] : []),
      `There are ${n} values. The lower quartile is value number $\\frac{${n} + 1}{4} = ${p1}$ and the upper quartile is value number $\\frac{3(${n} + 1)}{4} = ${p3}$ (counting from the smallest).`,
      `Lower quartile $= ${Q.q1}$, upper quartile $= ${Q.q3}$.`,
      ...(ask === 'iqr' ? [`Interquartile range = upper quartile − lower quartile $= ${Q.q3} - ${Q.q1} = ${ans}$`] : []),
      `Answer: ${f(ans)}`,
    ],
  };
}, { title: 'Quartiles and IQR from a list' });

export const boxRead = sgen('stat-box-read', 'stat-box-plots', (rng, d) => {
  const ctx = pick(rng, BOX_CTX);
  const B = boxSummary(rng, ctx);
  const visual = boxPlot({ plots: [{ label: '', ...B }], axis: boxAxis(ctx, B) });
  const f = boxFmt(ctx);
  const q = size(d, pick(rng, ['median', 'range']), pick(rng, ['iqr', 'range', 'uq']), pick(rng, ['iqr', 'count', 'percent']));
  const intro = `The box plot shows information about ${ctx.what}.`;
  if (q === 'count' || q === 'percent') {
    const N = pick(rng, [40, 60, 80, 100, 120, 200]);
    const part = pick(rng, [['more than', B.q3, 0.25], ['less than', B.q1, 0.25], ['more than', B.med, 0.5], ['between', [B.q1, B.q3], 0.5], ['more than', B.q1, 0.75]]);
    const ans = q === 'count' ? N * part[2] : part[2] * 100;
    const desc = part[0] === 'between' ? `between ${f(part[1][0])} and ${f(part[1][1])}` : `${part[0]} ${f(part[1])}`;
    const fmtA = q === 'count' ? (v) => num(v) : (v) => `${num(v)}%`;
    return {
      prompt: `${intro}${q === 'count' ? ` There are ${N} values.` : ''}<br>${q === 'count' ? `Estimate how many of the values are ${desc}.` : `Estimate the percentage of the values that are ${desc}.`}`,
      visual, answer: fmtA(ans),
      distractors: numDistractors(ans, (q === 'count' ? [N / 4, N / 2, (3 * N) / 4, N / 3, N / 5] : [25, 50, 75, 20, 33]).filter((v) => v !== ans), { fmt: fmtA }),
      typed: { kind: 'number', value: ans },
      solution: ['A box plot splits the data into four quarters: 25% of the values lie between each pair of neighbouring lines (min, LQ, median, UQ, max).', `Values ${desc}: ${part[2] === 0.25 ? 'one quarter' : part[2] === 0.5 ? 'half' : 'three quarters'} of the data.`, q === 'count' ? `$${frac(part[2] * 4, 4).tex()} \\times ${N} = ${ans}$` : `That is ${ans}%.`, `Answer: ${fmtA(ans)}`],
    };
  }
  const map = { median: [B.med, 'median'], range: [B.max - B.min, 'range'], iqr: [B.q3 - B.q1, 'interquartile range'], uq: [B.q3, 'upper quartile'] };
  const [ans, name] = map[q];
  return {
    prompt: `${intro}<br>${q === 'median' || q === 'uq' ? `Write down the ${name}.` : `Work out the ${name}.`}`,
    visual, answer: f(ans),
    distractors: numDistractors(ans, [B.q3 + B.q1, B.max - B.min, B.q3 - B.q1, B.med, B.q1, B.q3, B.max, (B.min + B.max) / 2, (B.q1 + B.q3) / 2], { fmt: f }),
    typed: { kind: 'number', value: ans },
    solution: [
      `Read the five values: minimum ${num(B.min)}, lower quartile ${num(B.q1)}, median ${num(B.med)}, upper quartile ${num(B.q3)}, maximum ${num(B.max)}.`,
      q === 'iqr' ? `IQR = upper quartile − lower quartile $= ${B.q3} - ${B.q1} = ${ans}$` : q === 'range' ? `Range = maximum − minimum $= ${B.max} - ${B.min} = ${ans}$` : `The ${name} is the line ${q === 'median' ? 'inside the box' : 'at the right-hand end of the box'}: ${num(ans)}.`,
      `Answer: ${f(ans)}`,
    ],
  };
}, { title: 'Read a box plot' });

const CMP_BOX = [
  { what: 'the points scored by a basketball team in home and away games', g: ['Home', 'Away'], s: ['the team in home games', 'the team in away games'], ctx: 0, high: 'scored more points', noun: 'scores' },
  { what: 'the times taken by two groups of people to complete a survey', g: ['Online', 'Paper'], s: ['people doing the survey online', 'people doing the survey on paper'], ctx: 1, high: 'took longer', noun: 'times' },
  { what: 'the amounts raised for charity by students in two classes', g: ['Class A', 'Class B'], s: ['Class A', 'Class B'], ctx: 2, high: 'raised more money', noun: 'amounts' },
  { what: 'the battery lives of two types of phone', g: ['Type A', 'Type B'], s: ['Type A phones', 'Type B phones'], ctx: 3, high: 'lasted longer', noun: 'battery lives' },
  { what: 'the test marks of two classes', g: ['Class P', 'Class Q'], s: ['Class P', 'Class Q'], ctx: 4, high: 'scored higher marks', noun: 'marks' },
  { what: 'the heights of seedlings grown in sun and in shade', g: ['Sun', 'Shade'], s: ['seedlings grown in sun', 'seedlings grown in shade'], ctx: 5, high: 'grew taller', noun: 'heights' },
  { what: 'the distances thrown by boys and girls', g: ['Boys', 'Girls'], s: ['the boys', 'the girls'], ctx: 6, high: 'threw further', noun: 'distances' },
];
export const boxCompare = sgen('stat-box-compare', 'stat-box-plots', (rng, d) => {
  const c = pick(rng, CMP_BOX); const ctx = BOX_CTX[c.ctx];
  const A = boxSummary(rng, ctx); const B = boxSummary(rng, ctx);
  const iA = A.q3 - A.q1; const iB = B.q3 - B.q1;
  if (A.med === B.med || iA === iB) throw new Error('ties');
  const rA = A.max - A.min; const rB = B.max - B.min;
  const visual = boxPlot({ plots: [{ label: c.g[0], ...A }, { label: c.g[1], ...B }], axis: boxAxis(ctx, A, B) });
  const hiM = A.med > B.med ? 0 : 1; const loI = iA < iB ? 0 : 1;
  const g = c.s;
  const aboutAvg = chance(rng);
  const correct = aboutAvg ? `On average, ${g[hiM]} ${c.high}, because the median is higher` : `The ${c.noun} for ${g[loI]} were more consistent, because the interquartile range is smaller`;
  const wrongs = [
    `On average, ${g[1 - hiM]} ${c.high}, because the median is higher`,
    `The ${c.noun} for ${g[1 - loI]} were more consistent, because the interquartile range is bigger`,
    ...(rA !== rB ? [`On average, ${g[rA > rB ? 0 : 1]} ${c.high}, because the range is bigger`] : []),
    `On average, ${g[A.max > B.max ? 0 : 1]} ${c.high}, because the highest value is bigger`,
    `The ${c.noun} for ${g[hiM]} were more consistent, because the median is higher`,
  ].filter((w) => w !== correct);
  return {
    prompt: `The box plots show ${c.what}.<br>Which statement is correct?`,
    visual, answer: correct,
    distractors: shuffle(rng, wrongs),
    count: 4,
    solution: [
      `Compare the <b>medians</b> for the average: ${c.g[0]} ${num(A.med)}, ${c.g[1]} ${num(B.med)}.`,
      `Compare the <b>interquartile ranges</b> for consistency (smaller = more consistent): ${c.g[0]} $${A.q3} - ${A.q1} = ${iA}$, ${c.g[1]} $${B.q3} - ${B.q1} = ${iB}$.`,
      'The range and the highest value are affected by single extreme values, so they are not good for comparing.',
      `Answer: ${correct}`,
    ],
  };
}, { title: 'Compare two box plots' });

export const boxSummaryQ = sgen('stat-box-summary', 'stat-box-plots', (rng, d) => {
  const ctx = pick(rng, BOX_CTX);
  const f = boxFmt(ctx);
  if (d === 'hard') {
    // Ordered list with quartiles linked by multipliers (like median = 2 × LQ).
    for (let t = 0; t < 200; t += 1) {
      const lq = int(rng, 4, 12) * 2; const mm = pick(rng, [1.5, 2]); const um = pick(rng, [2.5, 3]);
      const med = lq * mm; const uq = lq * um;
      if (!Number.isInteger(med) || !Number.isInteger(uq) || uq <= med + 1) continue;
      const iqr = uq - lq; const lo = int(rng, 1, lq - 2); const hi = lo + 2 * iqr;
      if (hi <= uq + 1) continue;
      // 11 values: positions 3 (LQ), 6 (median), 9 (UQ)
      const v = [lo, int(rng, lo, lq), lq, int(rng, lq, med), int(rng, lq, med), med, int(rng, med, uq), int(rng, med, uq), uq, int(rng, uq, hi), hi];
      const s = sorted(v);
      if (s[2] !== lq || s[5] !== med || s[8] !== uq) continue;
      const ask = pick(rng, ['uq', 'max']);
      const ans = ask === 'uq' ? uq : hi;
      const shown = s.map((x, i) => ((ask === 'uq' && (i === 8 || i === 10)) || (ask === 'max' && i === 10) ? '?' : num(x)));
      return {
        prompt: `Here are eleven values in order. Some are missing.${spaced(shown, (x) => x)}• median $= ${mm} \\times$ lower quartile<br>• upper quartile $= ${um} \\times$ lower quartile<br>• range $= 2 \\times$ interquartile range<br>What is the ${ask === 'uq' ? 'upper quartile' : 'largest value'}?`,
        answer: num(ans),
        distractors: numDistractors(ans, ask === 'uq' ? [med * um, lq + um, uq + 2, lo + 2 * iqr, med * 2] : [uq + 2 * iqr, 2 * (uq + lq), lo + iqr, 2 * iqr, hi + lo], { integer: true }),
        typed: { kind: 'number', value: ans },
        solution: [
          `With 11 values the lower quartile is the 3rd value: ${lq}. The median is the 6th: ${med} $= ${mm} \\times ${lq}$ ✓.`,
          `Upper quartile $= ${um} \\times ${lq} = ${uq}$, so IQR $= ${uq} - ${lq} = ${iqr}$.`,
          `Range $= 2 \\times ${iqr} = ${2 * iqr}$, so the largest value is $${lo} + ${2 * iqr} = ${hi}$.`,
          `Answer: ${ans}`,
        ],
      };
    }
    throw new Error('summary hard');
  }
  const B = boxSummary(rng, ctx);
  const iqr = B.q3 - B.q1; const rg = B.max - B.min;
  const variant = pick(rng, d === 'easy' ? ['uq', 'max'] : ['uq', 'lq', 'min']);
  const given = { uq: ['Lowest', B.min, 'Lower quartile', B.q1, 'Interquartile range', iqr], lq: ['Upper quartile', B.q3, 'Interquartile range', iqr, 'Median', B.med], max: ['Lowest', B.min, 'Range', rg, 'Median', B.med], min: ['Highest', B.max, 'Range', rg, 'Lower quartile', B.q1] }[variant];
  const ans = { uq: B.q3, lq: B.q1, max: B.max, min: B.min }[variant];
  const name = { uq: 'upper quartile', lq: 'lower quartile', max: 'highest value', min: 'lowest value' }[variant];
  const rows = [[given[0], f(given[1])], [given[2], f(given[3])], [given[4], f(given[5])]];
  return {
    prompt: `Here is some information about ${ctx.what}.${table(rows, { header: false, firstColHeader: true })}Work out the ${name}.`,
    answer: f(ans),
    distractors: numDistractors(ans, { uq: [iqr, B.q1 - iqr, B.min + iqr, B.q1 + iqr + B.min, B.med + iqr], lq: [B.q3 + iqr, iqr, B.med - iqr, B.q3 - B.med], max: [rg, B.min - rg, B.med + rg, B.med + rg / 2], min: [B.max + rg, rg, B.q1 - rg, B.max - B.q1] }[variant], { fmt: f }),
    typed: { kind: 'number', value: ans },
    solution: [
      variant === 'uq' || variant === 'lq' ? 'Interquartile range = upper quartile − lower quartile.' : 'Range = highest value − lowest value.',
      { uq: `Upper quartile $= ${B.q1} + ${iqr} = ${B.q3}$`, lq: `Lower quartile $= ${B.q3} - ${iqr} = ${B.q1}$`, max: `Highest $= ${B.min} + ${rg} = ${B.max}$`, min: `Lowest $= ${B.max} - ${rg} = ${B.min}$` }[variant],
      `Answer: ${f(ans)}`,
    ],
  };
}, { title: 'Missing values from summary statistics' });

/* ------------------------------------------------------------------ */
/* Histograms                                                           */
/* ------------------------------------------------------------------ */

const HIST_CTX = [
  { v: 's', head: 'Speed, $s$ (mph)', axis: 'Speed (mph)', noun: 'speed', unit: 'mph', what: 'the speeds of some cars passing a checkpoint', who: 'cars', starts: [10, 15, 20], scale: 5 },
  { v: 'h', head: 'Height, $h$ (cm)', axis: 'Height (cm)', noun: 'height', unit: 'cm', what: 'the heights of a sample of women', who: 'women', starts: [140, 145, 150], scale: 5 },
  { v: 't', head: 'Time, $t$ (hours)', axis: 'Time (hours)', noun: 'revision time', unit: 'hours', what: 'the time some students spent revising for a test', who: 'students', starts: [0], scale: 2 },
  { v: 'm', head: 'Mass, $m$ (grams)', axis: 'Mass (grams)', unit: 'g', what: 'the masses of some eggs', noun: 'mass', who: 'eggs', starts: [40, 45, 50], scale: 5 },
  { v: 'a', head: 'Age, $a$ (weeks)', axis: 'Age (weeks)', noun: 'age', unit: 'weeks', what: 'the ages of the babies at a clinic', who: 'babies', starts: [0], scale: 5 },
  { v: 't', head: 'Time, $t$ (minutes)', axis: 'Time (minutes)', noun: 'time', unit: 'minutes', what: 'the times of the runners who completed a race', who: 'runners', starts: [120, 140, 160], scale: 10 },
  { v: 'l', head: 'Length, $l$ (cm)', axis: 'Length (cm)', noun: 'length', unit: 'cm', what: 'the lengths of some fish', who: 'fish', starts: [0, 10, 20], scale: 5 },
  { v: 'm', head: 'Mass, $m$ (grams)', axis: 'Mass (grams)', unit: 'g', what: 'the masses of some tubes of toothpaste', noun: 'mass', who: 'tubes', starts: [100, 110, 120], scale: 2 },
];
const WIDTHS = [[2, 1, 1, 2, 4], [1, 1, 2, 4], [2, 2, 1, 1, 4], [4, 2, 2, 4], [1, 2, 2, 3, 2], [2, 1, 1, 1, 3], [3, 1, 2, 4]];
function histData(rng, d) {
  const ctx = pick(rng, HIST_CTX);
  for (let t = 0; t < 200; t += 1) {
    const ws = pick(rng, WIDTHS).map((w) => w * ctx.scale);
    const start = pick(rng, ctx.starts);
    // fd scale: step with 5 minor squares (or 4)
    const step = pick(rng, size(d, [5, 10], [1, 2, 5, 10], [0.2, 0.4, 0.5, 1, 2, 4]));
    const minor = Number.isInteger(step / 5 * 10) && step !== 0.4 && step !== 4 ? 5 : 4;
    const unit = tidy(step / minor);
    const classes = []; let a = start;
    for (const w of ws) {
      const k = int(rng, 2, minor * 5 - 1);
      const fd = tidy(unit * k); const f = tidy(fd * w);
      if (!Number.isInteger(f)) break;
      classes.push({ a, b: a + w, f, fd });
      a += w;
    }
    if (classes.length !== ws.length) continue;
    const N = sum(classes.map((c) => c.f));
    if (N > 2000 || N < 20) continue;
    const fdMax = Math.max(...classes.map((c) => c.fd));
    const ymax = Math.ceil((fdMax + unit) / step) * step;
    const xstep = ctx.scale * (ws.every((w) => (w / ctx.scale) % 2 === 0) ? 2 : 1);
    const xmin = start; const xmax = a;
    return { ctx, classes, N, step, minor, unit, ymax, x: { min: xmin, max: xmax, step: xstep, minor: xstep / ctx.scale === 2 ? 4 : 5, title: ctx.axis, breakAxis: start > 0 }, y: { max: ymax, step, minor, title: 'Frequency density' } };
  }
  throw new Error('hist data');
}
const histTable = (H, cols = ['Frequency']) => table([[H.ctx.head, ...cols], ...H.classes.map((c) => [`$${ineq(c.a, c.b, H.ctx.v, 'le-lt')}$`, ...cols.map((col) => (col === 'Frequency' ? num(c.f) : ''))])]);
const ctex = (H, c) => `$${ineq(c.a, c.b, H.ctx.v, 'le-lt')}$`;

export const histFd = sgen('stat-hist-fd', 'stat-histograms', (rng, d) => {
  const H = histData(rng, d);
  const i = int(rng, 0, H.classes.length - 1);
  const c = H.classes[i]; const w = c.b - c.a;
  const reverse = d === 'hard' && chance(rng, 0.5);
  if (reverse) {
    return {
      prompt: `A histogram is drawn to show ${H.ctx.what}. The bar for the class ${ctex(H, c)} has a height (frequency density) of ${num(c.fd)}.<br>How many ${H.ctx.who} are in this class?`,
      answer: num(c.f),
      distractors: numDistractors(c.f, [c.fd, c.fd / w, w, c.fd * 10, c.f / 2, c.fd + w], { }),
      typed: { kind: 'number', value: c.f },
      solution: ['Frequency density = frequency ÷ class width, so frequency = frequency density × class width.', `Class width $= ${num(c.b)} - ${num(c.a)} = ${w}$`, `Frequency $= ${num(c.fd)} \\times ${w} = ${num(c.f)}$`, `Answer: ${num(c.f)}`],
    };
  }
  return {
    prompt: `The table shows information about ${H.ctx.what}.${histTable(H)}A histogram is to be drawn. Work out the frequency density for the class ${ctex(H, c)}.`,
    answer: num(c.fd),
    distractors: numDistractors(c.fd, [c.f, c.f * w, w / c.f, c.f / H.N, c.f / (c.b), c.f / ((c.a + c.b) / 2), c.fd * 2], { }),
    typed: { kind: 'number', value: c.fd },
    solution: ['<b>Frequency density = frequency ÷ class width.</b>', `Class width $= ${num(c.b)} - ${num(c.a)} = ${w}$`, `Frequency density $= ${c.f} \\div ${w} = ${num(c.fd)}$`, `Answer: ${num(c.fd)}`],
  };
}, { title: 'Frequency density' });

export const histRead = sgen('stat-hist-read', 'stat-histograms', (rng, d) => {
  const H = histData(rng, d);
  const visual = histogram({ classes: H.classes, x: H.x, y: H.y });
  const q = size(d, 'freq', pick(rng, ['freq', 'total']), pick(rng, ['total', 'fraction']));
  const i = int(rng, 0, H.classes.length - 1);
  const c = H.classes[i]; const w = c.b - c.a;
  const intro = `The histogram shows information about ${H.ctx.what}.`;
  if (q === 'freq') {
    return {
      prompt: `${intro}<br>How many ${H.ctx.who} are in the class ${ctex(H, c)}?`,
      visual, answer: num(c.f),
      distractors: numDistractors(c.f, [c.fd, c.fd / w, w, c.f + w, c.fd * 10, c.f / 2], { }),
      typed: { kind: 'number', value: c.f },
      solution: ['In a histogram the <b>area</b> of a bar shows the frequency; the height is the frequency density.', `Height (frequency density) $= ${num(c.fd)}$ (each small square is ${num(H.unit)}); width $= ${w}$.`, `Frequency $= ${num(c.fd)} \\times ${w} = ${num(c.f)}$`, `Answer: ${num(c.f)}`],
    };
  }
  if (q === 'total') {
    return {
      prompt: `${intro}<br>How many ${H.ctx.who} are there altogether?`,
      visual, answer: num(H.N),
      distractors: numDistractors(H.N, [sum(H.classes.map((x) => x.fd)), H.N / 2, H.N + H.classes[0].f, sum(H.classes.map((x) => x.fd * 10)), H.N - H.classes[H.classes.length - 1].f], { integer: true }),
      typed: { kind: 'number', value: H.N },
      solution: ['Frequency of each bar = frequency density × class width.', `$${H.classes.map((x) => `${num(x.fd)} \\times ${x.b - x.a}`).join(' + ')}$`, `$= ${H.classes.map((x) => num(x.f)).join(' + ')} = ${num(H.N)}$`, `Answer: ${num(H.N)}`],
    };
  }
  const fr = frac(c.f, H.N);
  return {
    prompt: `${intro}<br>What fraction of the ${H.ctx.who} are in the class ${ctex(H, c)}? Give your answer in its simplest form.`,
    visual, answer: `$${fr.tex()}$`,
    distractors: fracDistractors(fr, [frac(Math.round(c.fd * 10), Math.round(sum(H.classes.map((x) => x.fd)) * 10)), frac(1, H.classes.length), frac(c.f, H.N - c.f), frac(w, H.x.max - H.x.min), frac(c.f + w, H.N), frac(c.f, H.N + w)]),
    solution: ['Frequency = frequency density × class width for every bar.', `This class: $${num(c.fd)} \\times ${w} = ${num(c.f)}$. Total: $${H.classes.map((x) => num(x.f)).join(' + ')} = ${num(H.N)}$`, `$\\frac{${num(c.f)}}{${num(H.N)}} = ${fr.tex()}$`, `Answer: $${fr.tex()}$`],
  };
}, { title: 'Read frequencies from a histogram' });

export const histMissingScale = sgen('stat-hist-missing-scale', 'stat-histograms', (rng, d) => {
  const H = histData(rng, d);
  const visual = histogram({ classes: H.classes, x: H.x, y: { ...H.y, hideLabels: true } });
  const k = H.classes.length;
  const [i, j] = shuffle(rng, [...Array(k).keys()]).slice(0, 2);
  const ci = H.classes[i]; const cj = H.classes[j];
  const useTotal = d !== 'easy' && chance(rng, 0.5);
  const sq = (c) => Math.round(c.fd / H.unit) * (c.b - c.a); // area in (small-square height × x-units)
  const totalSq = sum(H.classes.map(sq));
  const perSq = tidy(H.unit);
  const intro = `The histogram shows information about ${H.ctx.what}. The scale on the frequency density axis is missing.`;
  const given = useTotal ? `The histogram represents ${num(H.N)} ${H.ctx.who}.` : `There are ${num(ci.f)} ${H.ctx.who} in the class ${ctex(H, ci)}.`;
  return {
    prompt: `${intro}<br>${given}<br>How many ${H.ctx.who} are in the class ${ctex(H, cj)}?`,
    visual, answer: num(cj.f),
    distractors: numDistractors(cj.f, [Math.round((useTotal ? H.N / k : ci.f) * (cj.fd / ci.fd)), Math.round(((useTotal ? H.N : ci.f) * (cj.b - cj.a)) / (useTotal ? H.x.max - H.x.min : ci.b - ci.a)), Math.round(cj.fd / H.unit), cj.f * 2, Math.round(cj.f / 2), useTotal ? Math.round(H.N / k) : ci.f], { integer: true }),
    typed: { kind: 'number', value: cj.f },
    solution: [
      'Frequency is proportional to the <b>area</b> of each bar. Use small squares of height as a unit: area = (number of small squares high) × (class width).',
      useTotal ? `Total area $= ${H.classes.map((c) => `${Math.round(c.fd / H.unit)} \\times ${c.b - c.a}`).join(' + ')} = ${totalSq}$, which represents ${num(H.N)}, so 1 unit of area represents $${num(H.N)} \\div ${totalSq} = ${num(perSq)}$.`
        : `Area of the ${ctex(H, ci)} bar $= ${Math.round(ci.fd / H.unit)} \\times ${ci.b - ci.a} = ${sq(ci)}$, which represents ${num(ci.f)}, so 1 unit of area represents $${num(ci.f)} \\div ${sq(ci)} = ${num(perSq)}$.`,
      `Area of the ${ctex(H, cj)} bar $= ${Math.round(cj.fd / H.unit)} \\times ${cj.b - cj.a} = ${sq(cj)}$, so the frequency is $${sq(cj)} \\times ${num(perSq)} = ${num(cj.f)}$.`,
      `Answer: ${num(cj.f)}`,
    ],
  };
}, { title: 'Histogram with the scale missing' });

export const histEstimate = sgen('stat-hist-estimate', 'stat-histograms', (rng, d) => {
  const H = histData(rng, d);
  const visual = histogram({ classes: H.classes, x: H.x, y: H.y });
  const k = H.classes.length;
  const wide = H.classes.map((c, m) => m).filter((m) => H.classes[m].b - H.classes[m].a >= 2 * H.ctx.scale);
  if (!wide.length) throw new Error('no wide class');
  const m = pick(rng, wide); const c = H.classes[m];
  const cut = c.a + H.ctx.scale * int(rng, 1, (c.b - c.a) / H.ctx.scale - 1);
  const more = chance(rng);
  const partW = more ? c.b - cut : cut - c.a;
  const part = tidy(c.fd * partW);
  if (!Number.isInteger(part)) throw new Error('part not integer');
  const rest = more ? H.classes.slice(m + 1) : H.classes.slice(0, m);
  const ans = part + sum(rest.map((x) => x.f));
  const u = H.ctx.unit;
  return {
    prompt: `The histogram shows information about ${H.ctx.what}.<br>Estimate how many ${H.ctx.who} had a ${H.ctx.noun} ${more ? 'greater' : 'less'} than ${num(cut)} ${u}.`,
    visual, answer: num(ans),
    distractors: numDistractors(ans, [ans - part + c.f, ans - part, sum(rest.map((x) => x.fd)) + c.fd, ans - part + Math.round(c.f / 2), H.N - ans, ans + Math.round(c.fd)], { integer: true }),
    typed: { kind: 'number', value: ans },
    solution: [
      `${num(cut)} is inside the class ${ctex(H, c)}, so only part of that bar counts: assume its values are spread evenly.`,
      `Part of the bar: frequency density ${num(c.fd)} × width $${more ? `${num(c.b)} - ${num(cut)}` : `${num(cut)} - ${num(c.a)}`} = ${partW}$ gives $${num(part)}$.`,
      rest.length ? `Whole bars ${more ? 'above' : 'below'}: $${rest.map((x) => `${num(x.fd)} \\times ${x.b - x.a}`).join(' + ')} = ${num(sum(rest.map((x) => x.f)))}$` : 'There are no other bars on that side.',
      `Total $= ${num(part)}${rest.length ? ` + ${num(sum(rest.map((x) => x.f)))}` : ''} = ${num(ans)}$`,
      `Answer: about ${num(ans)}`,
    ],
  };
}, { title: 'Estimate from part of a histogram bar' });

export const histMissingBar = sgen('stat-hist-missing-bar', 'stat-histograms', (rng, d) => {
  const H = histData(rng, d);
  const i = int(rng, 0, H.classes.length - 1);
  const c = H.classes[i]; const w = c.b - c.a;
  const visual = histogram({ classes: H.classes.map((x, m) => (m === i ? { ...x, hidden: true } : x)), x: H.x, y: H.y });
  const ask = d === 'hard' ? 'fd' : pick(rng, ['f', 'fd']);
  const others = H.N - c.f;
  const ans = ask === 'f' ? c.f : c.fd;
  return {
    prompt: `The histogram shows information about ${H.ctx.what}. The bar for ${ctex(H, c)} is missing.<br>There are ${num(H.N)} ${H.ctx.who} altogether.<br>${ask === 'f' ? `How many ${H.ctx.who} are in the class ${ctex(H, c)}?` : 'What height (frequency density) should the missing bar be?'}`,
    visual, answer: num(ans),
    distractors: numDistractors(ans, ask === 'f' ? [c.fd, H.N - sum(H.classes.filter((_, m) => m !== i).map((x) => x.fd)), Math.round(H.N / H.classes.length), c.f + w, c.f * 2] : [c.f, c.f / H.N, tidy((H.N - others) * w), c.fd * 2, tidy(c.fd / 2), w], {}),
    typed: { kind: 'number', value: ans },
    solution: [
      `Frequencies of the other bars (density × width): ${H.classes.filter((_, m) => m !== i).map((x) => `$${num(x.fd)} \\times ${x.b - x.a} = ${num(x.f)}$`).join(', ')}; total ${num(others)}.`,
      `Missing class: $${num(H.N)} - ${num(others)} = ${num(c.f)}$`,
      ...(ask === 'fd' ? [`Height $= ${num(c.f)} \\div ${w} = ${num(c.fd)}$`] : []),
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Find a missing histogram bar' });

void [tnum, roundTo, median, isClean];
export const generators = [
  cfTableQ, cfRead, cfCount,
  boxQuartiles, boxRead, boxCompare, boxSummaryQ,
  histFd, histRead, histMissingScale, histEstimate, histMissingBar,
];
