// Non-linear graphs: quadratic graphs, graph shapes, graphical solutions, inequality regions, trig graphs,
// circles and tangents, graph transformations.
import { pick, int, chance, shuffle, sample, tnum, frac, Frac, gcd, largestSquareFactor } from '../../core.js';
import { G, F, P, pt, lin, yeq, linAccept, T, uniq, fracEq } from './util.js';
import { chart, coordGrid, panels, lineLabel, halo } from './diagrams.js';
import { text, ACCENT, ACCENT2 } from '../../svg.js';

const nz = (rng, lo, hi) => { let v = 0; while (v === 0) v = int(rng, lo, hi); return v; };
const par = (v) => (F(v).n < 0 ? `(${F(v).tex()})` : F(v).tex());
const Y = (eq) => `$${eq}$`;
/** an² + bx + c TeX */
export function qx(a, b, c, v = 'x') {
  const parts = [];
  const push = (k, s) => {
    if (k === 0) return;
    const abs = Math.abs(k); const body = abs === 1 && s ? s : `${abs}${s}`;
    parts.push(parts.length ? `${k < 0 ? '- ' : '+ '}${body}` : `${k < 0 ? '-' : ''}${body}`);
  };
  push(a, `${v}^2`); push(b, v); push(c, '');
  return parts.join(' ') || '0';
}
/** "x = a and x = b" with the smaller value first (null for a repeated value, so it is dropped). */
const pairOpt = (u, v) => (u === v ? null : `$x = ${Math.min(u, v)}$ and $x = ${Math.max(u, v)}$`);
/** ± constant term for TeX: pmc(-3) -> " - 3", pmc(0) -> "". */
const pmc = (k) => (k === 0 ? '' : ` ${k < 0 ? '-' : '+'} ${Math.abs(k)}`);
const LETTER_SETS =[['A', 'B', 'C', 'D'], ['P', 'Q', 'R', 'S'], ['E', 'F', 'G', 'H'], ['K', 'L', 'M', 'N'], ['W', 'X', 'Y', 'Z']];

/** Grid for a quadratic y = f(x) showing x in [xmin, xmax]; picks a y-scale so the grid is not too tall. */
function quadGrid(f, xmin, xmax, { extraY = [], unit = 26, ystep: forceStep = null } = {}) {
  let lo = Infinity; let hi = -Infinity;
  for (let i = 0; i <= 200; i += 1) { const y = f(xmin + ((xmax - xmin) * i) / 200); lo = Math.min(lo, y); hi = Math.max(hi, y); }
  for (const y of extraY) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  lo = Math.min(lo, 0); hi = Math.max(hi, 0);
  const span = hi - lo;
  const ystep = forceStep || (span + 2 <= 14 ? 1 : span + 4 <= 28 ? 2 : 5);
  const ymin = Math.floor((lo - 0.5) / ystep) * ystep; const ymax = Math.ceil((hi + 0.5) / ystep) * ystep;
  const c = chart({
    xmin, xmax, ymin, ymax, xstep: 1, ystep, w: Math.max((xmax - xmin) * unit, 220), h: Math.min(((ymax - ymin) / ystep) * unit, 290), zeroAxes: true, fontSize: 12.5,
    padL: xmin < 0 ? 18 : 34, ylabelIf: (ymax - ymin) / ystep > 14 ? (y) => Math.round(y / ystep) % 2 === 0 : null,
  });
  return { c, ystep, ymin, ymax };
}

/* ================================================================== */
/* gr-quadratic-graphs                                                 */
/* ================================================================== */

export const quadTable = G('gr-quad-table', 'gr-quadratic-graphs', (rng, d) => {
  const a = d === 'hard' ? pick(rng, [2, -1, 2, 3]) : 1;
  const b = d === 'easy' ? pick(rng, [0, 0, -2, 2, 1, -1]) : nz(rng, -5, 5);
  const c = d === 'easy' ? int(rng, -4, 4) : int(rng, -6, 6);
  const xs = [-3, -2, -1, 0, 1, 2, 3];
  const ys = xs.map((x) => a * x * x + b * x + c);
  const ask = pick(rng, d === 'easy' ? [-3, -2, -1, 2, 3] : [-3, -2, -1]);
  const ans = a * ask * ask + b * ask + c;
  const tex = qx(a, b, c);
  const shown = xs.map((x, i) => (x === ask ? '$a$' : chance(rng, 0.35) && Math.abs(x - ask) > 1 ? '' : `$${ys[i]}$`));
  const dist = [-a * ask * ask + b * ask + c, a * ask * ask - b * ask + c, a * 2 * ask + b * ask + c, (a * ask) ** 2 + b * ask + c, a * ask * ask + b * ask - c, ans + 1];
  return {
    prompt: `Here is a table of values for $y = ${tex}$.<br>Work out the value of $a$.`,
    visual: `<table class="qtable"><tr><th>$x$</th>${xs.map((x) => `<td>$${x}$</td>`).join('')}</tr><tr><th>$y$</th>${shown.map((s) => `<td>${s}</td>`).join('')}</tr></table>`,
    answer: T(ans),
    distractors: uniq(dist.map(T), T(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      ask < 0 ? `Substitute $x = ${ask}$, using brackets for the negative number.` : `Substitute $x = ${ask}$ into the equation.`,
      `$y = ${a === 1 ? '' : a === -1 ? '-' : `${a} \\times `}(${ask})^2${b === 0 ? '' : ` ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : `${Math.abs(b)} \\times `}(${ask})`}${pmc(c)}$`,
      `$(${ask})^2 = ${ask * ask}$${ask < 0 ? ' (a negative squared is positive)' : ''}, so $y = ${a * ask * ask}${pmc(b * ask)}${pmc(c)} = ${ans}$`,
      `Answer: $a = ${ans}$`,
    ],
  };
}, { title: 'Table of values for a quadratic' });

export const quadRootsGraph = G('gr-quad-roots-graph', 'gr-quadratic-graphs', (rng, d) => {
  const p = int(rng, -5, 3); const q = p + int(rng, 2, d === 'easy' ? 5 : 6);
  const neg = d === 'hard' && chance(rng, 0.4);
  const s = neg ? -1 : 1;
  const b = -s * (p + q); const c = s * p * q;
  if (p === 0 || q === 0 || Math.abs(c) > 14) throw new Error('r');
  const f = (x) => s * (x - p) * (x - q);
  const xmin = Math.min(p - 1, -1); const xmax = Math.max(q + 1, 1);
  if (xmax - xmin > 11) throw new Error('r');
  const { c: cg } = quadGrid(f, xmin, xmax);
  const vis = cg.wrap(cg.curve(f));
  const tex = qx(s, b, c);
  const opt = pairOpt;
  const h = (p + q) / 2;
  return {
    prompt: `Here is the graph of $y = ${tex}$.<br>Use the graph to write down the roots of $${tex} = 0$.`,
    visual: vis,
    answer: opt(p, q),
    distractors: uniq([opt(-q, -p), opt(-p, -q), Number.isInteger(h) ? opt(h, c) : opt(p, c), opt(0, c), opt(p, -q), opt(-p, q)], opt(p, q)),
    typed: { kind: 'list', values: [p, q] },
    solution: [
      'The roots of $f(x) = 0$ are where the graph crosses the <b>$x$-axis</b> (where $y = 0$).',
      `The curve crosses the $x$-axis at $x = ${p}$ and $x = ${q}$. (It crosses the $y$-axis at $${c}$ — that is not a root.)`,
      `Check: $${tex}$ factorises to $${s < 0 ? '-' : ''}(x ${p < 0 ? '+' : '-'} ${Math.abs(p)})(x ${q < 0 ? '+' : '-'} ${Math.abs(q)})$.`,
      `Answer: ${opt(p, q)}`,
    ],
  };
}, { title: 'Roots from a quadratic graph' });

export const quadTurning = G('gr-quad-turning', 'gr-quadratic-graphs', (rng, d) => {
  const mode = d === 'easy' ? 'graph' : d === 'medium' ? pick(rng, ['graph', 'form']) : pick(rng, ['complete', 'complete', 'form']);
  // On a drawn graph keep the turning point close to the y-axis so the grid includes x = 0 and stays a sensible size.
  const h = mode === 'graph' ? pick(rng, [-3, -2, -1, 1, 2, 3]) : nz(rng, -4, 5);
  const k = mode === 'graph' ? int(rng, -5, 4) : int(rng, -6, 6);
  const b = -2 * h; const c = h * h + k;
  const ans = P(h, k);
  const dist = [P(-h, k), P(h, -k), P(-h, -k), P(k, h), P(h, c), P(0, c)];
  if (mode === 'graph') {
    const f = (x) => (x - h) ** 2 + k;
    // Window: 3 either side of the turning point, always including x = 0; ruled every 1 unit
    const xmin = Math.min(h - 3, -1); const xmax = Math.max(h + 3, 1);
    const { c: cg } = quadGrid(f, xmin, xmax, { ystep: 1 });
    return {
      prompt: `Here is the graph of $y = ${qx(1, b, c)}$.<br>Write down the coordinates of the turning point.`,
      visual: cg.wrap(cg.curve(f)),
      answer: ans,
      distractors: uniq(dist, ans),
      typed: { kind: 'coord', x: h, y: k },
      solution: [
        'The turning point is the lowest point of this U-shaped curve (its minimum).',
        `It is on the line of symmetry $x = ${h}$, and the lowest $y$-value is $${k}$.`,
        `Answer: ${ans}`,
      ],
    };
  }
  if (mode === 'form') {
    const form = `(x ${h < 0 ? '+' : '-'} ${Math.abs(h)})^2 ${k < 0 ? '-' : '+'} ${Math.abs(k)}`.replace(/ \+ 0$/, '');
    return {
      prompt: `The equation of a curve is $y = ${form}$.<br>Write down the coordinates of the turning point.`,
      answer: ans,
      distractors: uniq(dist, ans),
      typed: { kind: 'coord', x: h, y: k },
      solution: [
        `$(x ${h < 0 ? '+' : '-'} ${Math.abs(h)})^2$ is never negative, and it is $0$ when $x = ${h}$.`,
        `So the smallest value of $y$ is $${k}$, when $x = ${h}$. Watch the sign: $(x ${h < 0 ? '+' : '-'} ${Math.abs(h)})^2$ gives $x = ${h}$, not $${-h}$.`,
        `Answer: ${ans}`,
      ],
    };
  }
  const H = nz(rng, -9, 9); const K = int(rng, -20, 20);
  const B = -2 * H; const C = H * H + K;
  const ans2 = P(H, K);
  return {
    prompt: `The equation of a curve is $y = ${qx(1, B, C)}$.<br>By completing the square, work out the coordinates of the turning point.`,
    answer: ans2,
    distractors: uniq([P(-H, K), P(H, -K), P(B, C), P(H, C), P(-H, -K), P(H, C - H * H * 2)], ans2),
    typed: { kind: 'coord', x: H, y: K },
    solution: [
      `Halve the coefficient of $x$: $${B} \\div 2 = ${-H}$, so start with $(x ${H < 0 ? '+' : '-'} ${Math.abs(H)})^2 = ${qx(1, B, H * H)}$.`,
      `$y = (x ${H < 0 ? '+' : '-'} ${Math.abs(H)})^2 - ${H * H} ${C < 0 ? '-' : '+'} ${Math.abs(C)} = (x ${H < 0 ? '+' : '-'} ${Math.abs(H)})^2 ${K < 0 ? '-' : '+'} ${Math.abs(K)}$`,
      `The turning point is where the bracket is zero: $x = ${H}$, $y = ${K}$.`,
      `Answer: ${ans2}`,
    ],
  };
}, { title: 'Turning point of a quadratic' });

export const quadSolveK = G('gr-quad-solve-k', 'gr-quadratic-graphs', (rng, d) => {
  const p = int(rng, -4, 2); const q = p + int(rng, 2, 6);
  const b = -(p + q); const c = p * q;
  const f = (x) => x * x + b * x + c;
  const xmin = Math.min(p - 2, -1); const xmax = Math.max(q + 2, 1);
  if (xmax - xmin > 11) throw new Error('r');
  const vmin = f((p + q) / 2);
  const cands = []; for (let x = xmin + 1; x < (p + q) / 2; x += 1) if ((d === 'hard' ? f(x) !== 0 && f(x) > vmin : f(x) > 0) && f(x) <= 12) cands.push(x);
  if (!cands.length) throw new Error('r');
  const x1 = pick(rng, cands); const k = f(x1); const x2 = p + q - x1;
  const { c: cg } = quadGrid(f, xmin, xmax);
  const tex = qx(1, b, c);
  const showLine = d === 'easy';
  const vis = cg.wrap(cg.curve(f) + (showLine ? cg.lineEq(0, k, { color: ACCENT2, dash: true, width: 1.8 }) : ''));
  const opt = pairOpt;
  const rearr = d === 'hard'; // e.g. solve x² − 4x − 12 = 0 using the graph of y = x² − 4x − 5
  const target = rearr ? `${qx(1, b, c - k)} = 0` : `${tex} = ${k}`;
  return {
    prompt: `Here is the graph of $y = ${tex}$.<br>Use the graph to solve $${target}$.${showLine ? ` The line $y = ${k}$ is shown dashed.` : ''}`,
    visual: vis,
    answer: opt(x1, x2),
    distractors: uniq([opt(p, q), opt(-x2, -x1), opt(x1, k), opt(x1 + 1, x2 - 1), opt(x1 - 1, x2 + 1), opt(-x1, -x2)], opt(x1, x2)),
    typed: { kind: 'list', values: [x1, x2] },
    solution: [
      rearr ? `Rewrite it to match the graph: $${qx(1, b, c - k)} = 0$ is the same as $${tex} = ${k}$ (add $${k}$ to both sides). Draw the line $y = ${k}$.` : `Draw the horizontal line $y = ${k}$ across the graph.`,
      `It meets the curve at $x = ${x1}$ and $x = ${x2}$ — read these from the $x$-axis.`,
      `Check: $${par(x1)}^2${b ? ` ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : `${Math.abs(b)} \\times `}${par(x1)}` : ''}${pmc(c)} = ${k}$ ✓`,
      `Answer: ${opt(x1, x2)}`,
    ],
  };
}, { title: 'Solve f(x) = k from a quadratic graph' });

export const quadFeatures = G('gr-quad-features', 'gr-quadratic-graphs', (rng, d) => {
  const p = int(rng, -6, 4); const q = p + 2 * int(rng, 1, 4);
  const s = d === 'hard' && chance(rng, 0.4) ? -1 : 1;
  const b = -s * (p + q); const c = s * p * q;
  const h = (p + q) / 2;
  const tex = qx(s, b, c);
  const ask = d === 'easy' ? pick(rng, ['yint', 'sym']) : d === 'medium' ? pick(rng, ['sym', 'sym', 'yint', 'xint']) : pick(rng, ['sym', 'xint']);
  if (ask === 'sym') {
    const ans = Y(`x = ${h}`);
    return {
      prompt: d === 'hard' ? `What is the equation of the line of symmetry of the graph of $y = ${tex}$?`
        : `The graph of $y = ${tex}$ crosses the $x$-axis at $x = ${p}$ and $x = ${q}$.<br>What is the equation of its line of symmetry?`,
      answer: ans,
      distractors: uniq([`x = ${-h}`, `y = ${h}`, `x = ${q - p}`, `x = ${c}`, `y = ${c}`, `x = ${p + q}`].map(Y), ans),
      solution: [
        ...(d === 'hard' ? [`First find where it crosses the $x$-axis: $${tex} = 0$ factorises to give $x = ${p}$ or $x = ${q}$.`] : []),
        'A quadratic graph is symmetrical about a vertical line halfway between its roots.',
        `Halfway between $${p}$ and $${q}$: $\\frac{${p} + ${par(q)}}{2} = ${h}$`,
        `A vertical line has equation $x = \\ldots$. Answer: $x = ${h}$`,
      ],
    };
  }
  if (ask === 'yint') {
    const ans = P(0, c);
    return {
      prompt: `Where does the graph of $y = ${tex}$ cross the $y$-axis?`,
      answer: ans,
      distractors: uniq([P(c, 0), P(0, -c), P(0, b), P(p, 0), P(0, s)], ans),
      typed: { kind: 'coord', x: 0, y: c },
      solution: [
        'On the $y$-axis, $x = 0$.',
        `$y = ${s === 1 ? '' : '-'}0^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)} \\times 0 ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${c}$`,
        `Answer: ${ans}`,
      ],
    };
  }
  const opt = (u, v) => (u === v ? null : `${P(Math.min(u, v), 0)} and ${P(Math.max(u, v), 0)}`);
  return {
    prompt: `The curve $y = ${tex}$ crosses the $x$-axis at two points.<br>Work out their coordinates.`,
    answer: opt(p, q),
    distractors: uniq([opt(-q, -p), `${P(0, p)} and ${P(0, q)}`, opt(-p, -q), opt(p, c), `${P(0, c)} and ${P(h, 0)}`], opt(p, q)),
    typed: { kind: 'list', values: [p, q] },
    solution: [
      `On the $x$-axis $y = 0$, so solve $${tex} = 0$.`,
      `Factorise: $${s < 0 ? '-' : ''}(x ${p < 0 ? '+' : '-'} ${Math.abs(p)})(x ${q < 0 ? '+' : '-'} ${Math.abs(q)}) = 0$, so $x = ${p}$ or $x = ${q}$.`.replace(/\(x - 0\)/g, 'x').replace(/\(x \+ 0\)/g, 'x'),
      `Answer: ${opt(p, q)}`,
    ],
  };
}, { title: 'Intercepts and line of symmetry of a quadratic' });

/* ================================================================== */
/* gr-graph-shapes                                                     */
/* ================================================================== */

function shapeFamilies(rng) {
  const k = int(rng, 1, 3); const c = nz(rng, -2, 2);
  return {
    lin: { name: 'Linear', tex: yeq(pick(rng, [1, 2, 3]), c), mk: null },
    linNeg: { name: 'Linear', tex: `y = ${c + 3} - ${k === 1 ? '' : k}x`, f: (x) => c + 3 - k * x },
    quad: { name: 'Quadratic', tex: `y = x^2 ${c < 0 ? '-' : '+'} ${Math.abs(c)}`, f: (x) => x * x + c },
    quadNeg: { name: 'Quadratic', tex: `y = ${k + 1} - x^2`, f: (x) => k + 1 - x * x },
    cubic: { name: 'Cubic', tex: `y = x^3 ${c < 0 ? '-' : '+'} ${Math.abs(c)}`, f: (x) => x ** 3 + c },
    cubicNeg: { name: 'Cubic', tex: `y = ${c} - x^3`.replace(/^y = (-?\d+) - x\^3$/, (m0, n) => `y = ${n} - x^3`), f: (x) => c - x ** 3 },
    recip: { name: 'Reciprocal', tex: `y = \\frac{${k + 1}}{x}`, f: (x) => (k + 1) / x },
    recipNeg: { name: 'Reciprocal', tex: `y = -\\frac{${k + 1}}{x}`, f: (x) => -(k + 1) / x },
    exp: { name: 'Exponential', tex: `y = ${pick(rng, [2, 3])}^x`, f: null },
    expDecay: { name: 'Exponential', tex: `y = \\left(\\frac{1}{2}\\right)^x`, f: (x) => 0.5 ** x },
  };
}
function familyFns(fam) {
  const out = {};
  for (const [key, v] of Object.entries(fam)) {
    let f = v.f;
    if (key === 'lin') { const m = v.tex.match(/y = (-?\d*)x/); const mm = m && m[1] !== '' ? Number(m[1]) : 1; const cc = Number((v.tex.match(/([+-]) (\d+)$/) || [0, '+', '0']).slice(1).join('').replace('+', '')); f = (x) => mm * x + cc; }
    if (key === 'exp') { const base = Number(v.tex.match(/y = (\d)\^x/)[1]); f = (x) => base ** x; }
    out[key] = { ...v, f };
  }
  return out;
}

export const shapeWhichGraph = G('gr-shape-which-graph', 'gr-graph-shapes', (rng, d) => {
  const fam = familyFns(shapeFamilies(rng));
  const pool = d === 'easy' ? ['lin', 'linNeg', 'quad', 'quadNeg', 'recip', 'cubic'] : Object.keys(fam);
  // hard: two pairs of easily confused shapes (e.g. x³ and −x³, k/x and −k/x)
  const PAIRS = [['quad', 'quadNeg'], ['cubic', 'cubicNeg'], ['recip', 'recipNeg'], ['exp', 'expDecay'], ['lin', 'linNeg']];
  const keys = d === 'hard' ? shuffle(rng, sample(rng, PAIRS, 2).flat()) : sample(rng, pool, 4);
  const names = keys.map((k) => fam[k].name);
  const candidates = keys.filter((k, i) => d !== 'easy' || names.filter((n) => n === names[i]).length === 1);
  if (!candidates.length) throw new Error('retry');
  const target = pick(rng, candidates);
  const letters = pick(rng, LETTER_SETS);
  const list = keys.map((k, i) => ({ label: letters[i], window: { xmin: -4, xmax: 4, ymin: -4, ymax: 4 }, draw: (c) => c.curve(fam[k].f, { samples: 400 }) }));
  const ti = keys.indexOf(target);
  return {
    prompt: `Which graph could be the graph of $${fam[target].tex}$?`,
    visual: panels(list, { cols: 2, pw: 140, ph: 120 }),
    answer: letters[ti],
    distractors: letters.filter((_, i) => i !== ti),
    count: 4,
    solution: [
      `$${fam[target].tex}$ is a <b>${fam[target].name.toLowerCase()}</b> graph.`,
      shapeHint(target),
      `Answer: graph ${letters[ti]}`,
    ],
  };
}, { title: 'Which graph matches the equation? (A–D)' });

function shapeHint(key) {
  return {
    lin: 'A linear graph is a straight line; a positive gradient slopes upwards from left to right.',
    linNeg: 'A linear graph is a straight line; a negative $x$ term makes it slope downwards.',
    quad: 'An $x^2$ graph is a U-shaped parabola; a positive $x^2$ term opens upwards.',
    quadNeg: 'A $-x^2$ term makes the parabola an upside-down U (∩), with a maximum point.',
    cubic: 'An $x^3$ graph has an S-shape: it rises from bottom-left to top-right.',
    cubicNeg: 'A $-x^3$ graph is an S-shape falling from top-left to bottom-right.',
    recip: '$y = \\frac{k}{x}$ has two separate branches (in the 1st and 3rd quadrants for positive $k$) and never touches the axes.',
    recipNeg: '$y = -\\frac{k}{x}$ has two branches in the 2nd and 4th quadrants and never touches the axes.',
    exp: 'An exponential graph $y = a^x$ crosses the $y$-axis at $1$, grows steeply to the right and gets close to the $x$-axis on the left.',
    expDecay: '$y = (\\frac{1}{2})^x$ crosses the $y$-axis at $1$ and decreases, getting closer to the $x$-axis on the right.',
  }[key];
}

export const shapeWhichEquation = G('gr-shape-which-equation', 'gr-graph-shapes', (rng, d) => {
  const fam = familyFns(shapeFamilies(rng));
  const pool = d === 'easy' ? ['lin', 'quad', 'quadNeg', 'recip', 'cubic', 'linNeg'] : Object.keys(fam);
  const key = pick(rng, pool);
  if (d !== 'hard' && chance(rng, 0.3)) {
    const names = ['Linear', 'Quadratic', 'Cubic', 'Reciprocal', 'Exponential'];
    return {
      prompt: `What type of graph does the equation $${fam[key].tex}$ give?`,
      answer: fam[key].name,
      distractors: names.filter((n) => n !== fam[key].name),
      solution: [
        'Look at the highest power of $x$, and whether $x$ is in a denominator or a power.',
        `${{ Linear: 'The highest power of $x$ is 1, so it is a straight line.', Quadratic: 'The highest power of $x$ is 2, so it is a quadratic (parabola).', Cubic: 'The highest power of $x$ is 3, so it is a cubic.', Reciprocal: '$x$ is in the denominator, so it is a reciprocal graph.', Exponential: '$x$ is the power (exponent), so it is an exponential graph.' }[fam[key].name]}`,
        `Answer: ${fam[key].name}`,
      ],
    };
  }
  const c = chart({ xmin: -4, xmax: 4, ymin: -4, ymax: 4, w: 220, h: 220, zeroAxes: true, labels: false, grid: false, padL: 14, padB: 10 });
  const vis = c.wrap(c.curve(fam[key].f, { samples: 400 }) + text(c.X(0) - 8, c.Y(0) + 10, 'O', { size: 13, italic: true, anchor: 'end' }));
  const others = Object.keys(fam).filter((k) => fam[k].name !== fam[key].name || (k !== key && d === 'hard'));
  let opts = shuffle(rng, others).map((k) => Y(fam[k].tex));
  if (d === 'hard') {
    // Lead with the confusable ones: the same family with the opposite sign, and the same equation with the
    // constant's sign flipped (the sketch shows which side of the origin the curve crosses).
    const sib = others.filter((k) => fam[k].name === fam[key].name).map((k) => Y(fam[k].tex));
    const t = fam[key].tex;
    const flip = / - \d+$/.test(t) ? t.replace(/ - (\d+)$/, ' + $1') : / \+ \d+$/.test(t) ? t.replace(/ \+ (\d+)$/, ' - $1') : null;
    opts = [...(flip ? [Y(flip)] : []), ...sib, ...opts];
  }
  return {
    prompt: 'Here is a sketch of a graph. Which of these could be its equation?',
    visual: vis,
    answer: Y(fam[key].tex),
    distractors: uniq(opts, Y(fam[key].tex)),
    solution: [shapeHint(key), `The sketch matches $${fam[key].tex}$.`, `Answer: $${fam[key].tex}$`],
  };
}, { title: 'Which equation matches the sketch?' });

/* ================================================================== */
/* gr-graphical-solutions                                              */
/* ================================================================== */

/** Equation label beside the line y = mx + k (minus signs typeset properly). */
const eqLabel = (c, m, k, tex, color, at = 0.85) => lineLabel(c, m, k, `y = ${tex.replace(/-/g, '−')}`, { color, at });

export const gsTwoLines = G('gr-gs-two-lines', 'gr-graphical-solutions', (rng, d) => {
  const X0 = nz(rng, -4, 4); const Y0 = int(rng, -4, 4);
  const m1 = nz(rng, -3, 3); let m2 = nz(rng, -3, 3);
  if (m1 === m2) m2 = -m1;
  const k1 = Y0 - m1 * X0; const k2 = Y0 - m2 * X0;
  if (Math.abs(k1) > 7 || Math.abs(k2) > 7 || k1 === 0 || k2 === 0) throw new Error('r');
  const box = { xmin: -6, xmax: 6, ymin: -6, ymax: 6 };
  const cg = coordGrid({ ...box, unit: 24 });
  const e1 = lin(m1, k1); const e2 = lin(m2, k2);
  const vis = cg.wrap(cg.lineEq(m1, k1) + cg.lineEq(m2, k2, { color: ACCENT2 }) + eqLabel(cg, m1, k1, e1, ACCENT, 0.9) + eqLabel(cg, m2, k2, e2, ACCENT2, 0.15));
  const simul = d === 'hard' || (d === 'medium' && chance(rng, 0.5));
  if (simul) {
    const opt = (x, y) => `$x = ${x},\\ y = ${y}$`;
    return {
      prompt: `The graphs of $y = ${e1}$ and $y = ${e2}$ are drawn on the grid.<br>Use the graph to solve the simultaneous equations<br>$y = ${e1}$<br>$y = ${e2}$`,
      visual: vis,
      answer: opt(X0, Y0),
      distractors: uniq([opt(Y0, X0), opt(-X0, Y0), opt(X0, -Y0), opt(0, k1), opt(0, k2), opt(X0, k1)], opt(X0, Y0)),
      typed: { kind: 'coord', x: X0, y: Y0 },
      solution: [
        'The solution of a pair of simultaneous equations is where their graphs <b>cross</b>.',
        `The lines intersect at ${P(X0, Y0)}.`,
        `Check: $${m1} \\times ${par(X0)} ${k1 < 0 ? '-' : '+'} ${Math.abs(k1)} = ${Y0}$ and $${m2} \\times ${par(X0)} ${k2 < 0 ? '-' : '+'} ${Math.abs(k2)} = ${Y0}$ ✓`,
        `Answer: ${opt(X0, Y0)}`,
      ],
    };
  }
  const opt = (x) => `$x = ${x}$`;
  return {
    prompt: `The graphs of $y = ${e1}$ and $y = ${e2}$ are drawn on the grid.<br>Use the graph to solve $${e1} = ${e2}$.`,
    visual: vis,
    answer: opt(X0),
    distractors: uniq([opt(Y0), opt(-X0), opt(k1), opt(k2), opt(X0 + 1), opt(X0 - 1)], opt(X0)),
    typed: { kind: 'number', value: X0 },
    solution: [
      `Solving $${e1} = ${e2}$ means finding the $x$-value where the two graphs have the same $y$-value — where they <b>cross</b>.`,
      `The lines cross at ${P(X0, Y0)}. The answer is the $x$-coordinate, not the $y$-coordinate.`,
      `Answer: $x = ${X0}$`,
    ],
  };
}, { title: 'Solve equations using two straight lines' });

export const gsQuadLine = G('gr-gs-quad-line', 'gr-graphical-solutions', (rng, d) => {
  const p = int(rng, -3, 1); const q = p + int(rng, 2, 5);
  const b = -(p + q); const c0 = p * q; // y = x² + bx + c0 (roots p, q)
  const f = (x) => x * x + b * x + c0;
  const x1 = int(rng, p - 1, q - 1); const x2 = x1 + int(rng, 1, 4);
  const m = x1 + x2 + b; const k = f(x1) - m * x1;
  if (m === 0 && (d !== "easy" || k === 0)) throw new Error("r");
  const xmin = Math.min(p - 2, x1 - 1, -1); const xmax = Math.max(q + 2, x2 + 1, 1);
  if (xmax - xmin > 11) throw new Error('r');
  if (Math.max(f(xmin), f(xmax)) > 16 && Math.max(f(x1), f(x2)) > 12) throw new Error('r');
  const { c: cg, ymin, ymax } = quadGrid(f, xmin, xmax, { extraY: [f(x1), f(x2)] });
  const box = { xmin, xmax, ymin, ymax };
  const qtex = qx(1, b, c0); const ltex = lin(m, k);
  const vis = cg.wrap(cg.curve(f) + cg.lineEq(m, k, { color: ACCENT2 }) + eqLabel(cg, m, k, ltex, ACCENT2));
  const opt = pairOpt;
  const rearr = d === 'hard';
  const eq = rearr ? `${qx(1, b - m, c0 - k)} = 0` : `${qtex} = ${ltex}`;
  return {
    prompt: `The graphs of $y = ${qtex}$ and $y = ${ltex}$ are drawn on the grid.<br>Use the graph to solve $${eq}$.`,
    visual: vis,
    answer: opt(x1, x2),
    distractors: uniq([opt(p, q), opt(f(x1), f(x2)), opt(-x2, -x1), opt(x1, f(x1)), opt(x1 - 1, x2 + 1), opt(x2, f(x2))], opt(x1, x2)),
    typed: { kind: 'list', values: [x1, x2] },
    solution: [
      rearr ? `Rearrange: $${qx(1, b - m, c0 - k)} = 0$ is the same as $${qtex} = ${ltex}$ (add $${ltex}$ to both sides).` : `The equation says the curve and the line have the same $y$-value.`,
      `So the solutions are the $x$-coordinates where the curve and the line <b>intersect</b>: ${P(x1, f(x1))} and ${P(x2, f(x2))}.`,
      `Answer: ${opt(x1, x2)}`,
    ],
  };
}, { title: 'Solve using a curve and a line' });

export const gsWhichLine = G('gr-gs-which-line', 'gr-graphical-solutions', (rng, d) => {
  const b = nz(rng, -5, 5); const c = nz(rng, -6, 6);
  const B = nz(rng, -6, 6); const C = int(rng, -8, 8);
  const lead = d === 'hard' ? pick(rng, [1, 2]) : 1;
  const m = lead * b - B; const k = lead * c - C;
  if (m === 0 || k === 0 || (b === B && c === C)) throw new Error('r');
  if (B * B - 4 * lead * C <= 0) throw new Error('r'); // the equation must have two real solutions
  const drawn = qx(lead, lead * b, lead * c);
  const target = `${qx(lead, B, C)} = 0`;
  const ans = Y(yeq(m, k));
  const dist = [yeq(-m, -k), yeq(m, -k), yeq(-m, k), yeq(B, C), yeq(b + B, c + C), yeq(-B, -C)].map(Y);
  return {
    prompt: `The graph of $y = ${drawn}$ has been drawn.<br>Which straight line should be drawn on the same axes to solve $${target}$?`,
    answer: ans,
    distractors: uniq(dist, ans),
    solution: [
      `Rearrange the equation so one side is $${drawn}$ (the curve already drawn).`,
      `Compare the two: to turn $${qx(lead, B, C)}$ into $${drawn}$ you add $${lin(m, k)}$.`,
      `Add $${lin(m, k)}$ to both sides of $${qx(lead, B, C)} = 0$: $${drawn} = ${lin(m, k)}$.`,
      `So draw $y = ${lin(m, k)}$; the solutions are the $x$-values where it crosses the curve.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Which line solves the equation?' });

/* ================================================================== */
/* gr-inequality-regions                                               */
/* ================================================================== */

const REL = { '<': '\\lt', '>': '\\gt', '<=': '\\leqslant', '>=': '\\geqslant' };
const flip = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
const strictSwap = { '<': '<=', '<=': '<', '>': '>=', '>=': '>' };
/** An inequality a·x + b·y REL k, displayed via tex(). */
function ineq(kind, params, rel) {
  const q = { kind, ...params, rel };
  q.g = (x, y) => (kind === 'x' ? x - params.k : kind === 'y' ? y - params.k : kind === 'line' ? y - (params.m * x + params.c) : params.p * x + params.q * y - params.k);
  q.ok = (x, y) => { const v = q.g(x, y); const r = q.rel; return r === '<' ? v < -1e-9 : r === '>' ? v > 1e-9 : r === '<=' ? v <= 1e-9 : v >= -1e-9; };
  q.tex = (r = q.rel) => (kind === 'x' ? `x ${REL[r]} ${params.k}` : kind === 'y' ? `y ${REL[r]} ${params.k}` : kind === 'line' ? `y ${REL[r]} ${lin(params.m, params.c)}` : `${lin(params.p, 0).replace(/^0$/, '')}${params.q < 0 ? ' - ' : ' + '}${Math.abs(params.q) === 1 ? '' : Math.abs(params.q)}y ${REL[r]} ${params.k}`);
  return q;
}
function clipHalf(poly, q) {
  const s = q.rel === '<' || q.rel === '<=' ? -1 : 1;
  const inside = (p) => s * q.g(p[0], p[1]) >= -1e-9;
  const out = [];
  for (let i = 0; i < poly.length; i += 1) {
    const A = poly[i]; const B = poly[(i + 1) % poly.length];
    const ia = inside(A); const ib = inside(B);
    if (ia) out.push(A);
    if (ia !== ib) {
      const ga = q.g(...A); const gb = q.g(...B); const t = ga / (ga - gb);
      out.push([A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])]);
    }
  }
  return out;
}
const area = (poly) => Math.abs(poly.reduce((s, p, i) => { const q = poly[(i + 1) % poly.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;

function makeRegion(rng, d) {
  for (let t = 0; t < 200; t += 1) {
    const a = int(rng, -3, 2); const b = int(rng, -3, 2);
    let qs;
    if (d === 'easy') {
      // x ≥ a, y ≥ b, x + y ≤ k: all solid lines
      qs = [ineq('x', { k: a }, '>='), ineq('y', { k: b }, '>='), ineq('sum', { p: 1, q: 1, k: int(rng, a + b + 3, a + b + 8) }, '<=')];
    } else if (d === 'medium') {
      qs = [ineq('x', { k: a }, pick(rng, ['>', '>='])), ineq('y', { k: b }, pick(rng, ['>', '>=']))];
      qs.push(chance(rng, 0.5) ? ineq('sum', { p: 1, q: 1, k: int(rng, a + b + 3, a + b + 8) }, pick(rng, ['<', '<=']))
        : ineq('line', { m: pick(rng, [1, 2, -1, -2]), c: int(rng, -2, 4) }, pick(rng, ['<', '<=', '>', '>='])));
    } else {
      // any direction for every boundary, steeper lines and 2x + y style boundaries
      const ax = int(rng, -4, 4); const by = int(rng, -4, 4);
      qs = [ineq('x', { k: ax }, pick(rng, ['<', '<=', '>', '>='])), ineq('y', { k: by }, pick(rng, ['<', '<=', '>', '>=']))];
      qs.push(chance(rng, 0.5) ? ineq('line', { m: pick(rng, [2, -2, 3, -3, 1, -1]), c: int(rng, -4, 4) }, pick(rng, ['<', '<=', '>', '>=']))
        : ineq('sum', { ...pick(rng, [{ p: 1, q: 1 }, { p: 2, q: 1 }, { p: 1, q: 2 }]), k: pick(rng, [-4, -2, 2, 4, 6, 8]) }, pick(rng, ['<', '<=', '>', '>='])));
    }
    const box = [[-6, -6], [6, -6], [6, 6], [-6, 6]];
    let poly = box; for (const q of qs) poly = clipHalf(poly, q);
    if (poly.length < 3 || area(poly) < 3 || area(poly) > 40) continue;
    // must be bounded away from the window edges
    if (poly.some((p) => Math.abs(p[0]) > 5.99 || Math.abs(p[1]) > 5.99)) continue;
    return { qs, poly };
  }
  throw new Error('r');
}
function regionVisual(qs, poly, { label = 'R' } = {}) {
  const c = coordGrid({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, unit: 24 });
  // Draw every boundary first, then place the labels so they can avoid all of the lines.
  const mk = (q) => (q.kind === 'x' ? [null, q.k] : q.kind === 'y' ? [0, q.k] : q.kind === 'line' ? [q.m, q.c] : [-q.p / q.q, q.k / q.q]);
  let lines = '';
  for (const q of qs) {
    const dash = q.rel === '<' || q.rel === '>';
    lines += c.lineEq(...mk(q), { color: ACCENT, width: 2.2, dash: dash ? '7 5' : null });
  }
  for (const q of qs) {
    const eq = q.tex().replace(/\\[lg]eqslant|\\[lg]t(?![a-z])/, '=').replace(/-/g, '−');
    const at = q.kind === 'x' ? 0.94 : q.kind === 'y' ? 0.9 : 0.12;
    lines += lineLabel(c, ...mk(q), eq, { color: ACCENT, size: 13, at, side: q.kind === 'y' ? -1 : 1 });
  }
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length; const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  // Candidate spots for the region label: interior points, nearest the centre first.
  const inside = (x, y) => poly.every((p, i) => { const q = poly[(i + 1) % poly.length]; return (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]) >= 0; })
    || poly.every((p, i) => { const q = poly[(i + 1) % poly.length]; return (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]) <= 0; });
  const cands = [];
  for (let x = -6; x <= 6; x += 0.25) for (let y = -6; y <= 6; y += 0.25) if (inside(x, y)) cands.push([x, y]);
  cands.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy));
  let lab = '';
  if (label && cands.length) {
    const [px, py] = c.place(cands.map(([x, y]) => [c.X(x), c.Y(y)]), 14, 16);
    lab = halo(px, py, label, { bold: true, size: 16 });
  }
  return c.wrap(c.shade(poly, { opacity: 0.7 }) + lines + lab);
}
const setTex = (qs, rels) => `$${qs.map((q, i) => q.tex(rels[i])).join(',\\quad ')}$`;

export const ineqDescribe = G('gr-ineq-describe', 'gr-inequality-regions', (rng, d) => {
  const { qs, poly } = makeRegion(rng, d);
  const rels = qs.map((q) => q.rel);
  const ans = setTex(qs, rels);
  const dist = [];
  qs.forEach((q, i) => { const r = [...rels]; r[i] = flip[r[i]]; dist.push(setTex(qs, r)); });
  if (d !== 'easy') qs.forEach((q, i) => { const r = [...rels]; r[i] = strictSwap[r[i]]; dist.push(setTex(qs, r)); });
  dist.push(setTex(qs, rels.map((r) => flip[r])));
  return {
    prompt: 'Which set of inequalities describes the shaded region R?<br><small>A solid line is included in the region; a dashed line is not.</small>',
    visual: regionVisual(qs, poly),
    answer: ans,
    distractors: uniq(shuffle(rng, dist), ans),
    solution: [
      'Take each boundary line in turn and decide which side of it the region is on. Test a point inside R if you are unsure.',
      ...qs.map((q) => `Boundary ${q.kind === 'x' ? `$x = ${q.k}$` : q.kind === 'y' ? `$y = ${q.k}$` : q.kind === 'line' ? `$y = ${lin(q.m, q.c)}$` : `$${q.tex().replace(/\\[lg]eqslant|\\[lg]t(?![a-z])/, '=')}$`}: R is on the ${q.rel.startsWith('>') ? (q.kind === 'x' ? 'right' : 'upper') : (q.kind === 'x' ? 'left' : 'lower')} side, and the line is ${q.rel.length === 2 ? 'solid ($\\leqslant$ or $\\geqslant$)' : 'dashed ($\\lt$ or $\\gt$)'}: $${q.tex()}$`),
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Inequalities describing a shaded region' });

export const ineqPointIn = G('gr-ineq-point-in', 'gr-inequality-regions', (rng, d) => {
  const { qs, poly } = makeRegion(rng, d);
  const inside = []; const outside = []; const boundary = [];
  for (let x = -6; x <= 6; x += 1) for (let y = -6; y <= 6; y += 1) {
    if (qs.every((q) => q.ok(x, y))) inside.push([x, y]);
    else if (qs.every((q) => q.ok(x, y) || Math.abs(q.g(x, y)) < 1e-9)) boundary.push([x, y]);
    else if (qs.filter((q) => !q.ok(x, y)).length === 1) outside.push([x, y]);
  }
  if (!inside.length) throw new Error('r');
  const good = pick(rng, inside);
  const wrong = [...shuffle(rng, boundary).slice(0, 2), ...shuffle(rng, outside)].slice(0, 6);
  const showDiagram = d === 'easy';
  return {
    prompt: `Which point satisfies all three inequalities?<br>${qs.map((q) => `$${q.tex()}$`).join('&emsp;')}`,
    visual: showDiagram ? regionVisual(qs, poly) : undefined,
    answer: P(...good),
    distractors: uniq(wrong.map((p) => P(...p)), P(...good)),
    solution: [
      'Substitute the coordinates into each inequality. The point must make <b>all</b> of them true.',
      `${P(...good)}: ${qs.map((q) => `$${q.tex().replace(/(\d)x\b/g, `$1 \\times ${par(good[0])}`).replace(/(\d)y\b/g, `$1 \\times ${par(good[1])}`).replace(/\bx\b/g, par(good[0])).replace(/\by\b/g, par(good[1]))}$ ✓`).join(', ')}`,
      'Points on a dashed (strict) boundary do not count; each other option breaks at least one inequality.',
      `Answer: ${P(...good)}`,
    ],
  };
}, { title: 'Which point lies in the region?' });

export const ineqCount = G('gr-ineq-count', 'gr-inequality-regions', (rng, d) => {
  const { qs, poly } = makeRegion(rng, d === 'easy' ? 'medium' : d);
  const pts = [];
  for (let x = -6; x <= 6; x += 1) for (let y = -6; y <= 6; y += 1) if (qs.every((q) => q.ok(x, y))) pts.push([x, y]);
  if (pts.length < 2 || pts.length > 15) throw new Error('r');
  const onB = [];
  for (let x = -6; x <= 6; x += 1) for (let y = -6; y <= 6; y += 1) if (!qs.every((q) => q.ok(x, y)) && qs.every((q) => q.ok(x, y) || Math.abs(q.g(x, y)) < 1e-9)) onB.push([x, y]);
  const n = pts.length;
  const ask = d === 'hard' && chance(rng, 0.4) ? 'max' : 'count';
  if (ask === 'max') {
    const best = Math.max(...pts.map(([x, y]) => x + y));
    const allMax = Math.max(...[...pts, ...onB].map(([x, y]) => x + y));
    return {
      prompt: `The region R satisfies ${qs.map((q) => `$${q.tex()}$`).join(', ')}.<br>$x$ and $y$ are integers and the point $(x, y)$ is in R. What is the greatest possible value of $x + y$?`,
      visual: regionVisual(qs, poly),
      answer: T(best),
      distractors: uniq([allMax, best + 1, best - 1, Math.round(Math.max(...poly.map(([x, y]) => x + y))), n].map(T), T(best)),
      typed: { kind: 'number', value: best },
      solution: [
        `List the integer points in R (not on a dashed line): ${pts.map((p) => P(...p)).join(', ')}.`,
        `The largest value of $x + y$ among them is $${best}$.`,
        `Answer: $${best}$`,
      ],
    };
  }
  return {
    prompt: `The region R satisfies ${qs.map((q) => `$${q.tex()}$`).join(', ')}.<br>How many points with integer coordinates lie in R?`,
    visual: regionVisual(qs, poly),
    answer: T(n),
    distractors: uniq([n + onB.length, n - 1, n + 1, n + 2, Math.max(1, n - 2)].map(T), T(n)),
    typed: { kind: 'number', value: n },
    solution: [
      'Check every grid point inside or on the edge of R. Points on a <b>solid</b> line count; points on a <b>dashed</b> line do not.',
      `The points are: ${pts.map((p) => P(...p)).join(', ')}.`,
      `Answer: $${n}$`,
    ],
  };
}, { title: 'Integer points in a region' });

/* ================================================================== */
/* gr-trig-graphs                                                      */
/* ================================================================== */

const S = (deg) => Math.sin((deg * Math.PI) / 180);
const Cs = (deg) => Math.cos((deg * Math.PI) / 180);
const Tn = (deg) => Math.tan((deg * Math.PI) / 180);
const deg = (v) => `${v}^\\circ`;

function trigChart({ tan = false, ymin = -1.5, ymax = 1.5, ystep = 0.5, xmax = 360, xmin = 0 } = {}) {
  const c = chart({
    xmin, xmax, ymin, ymax, xstep: 30, ystep, xlabelEvery: xmax - xmin > 400 ? 6 : 3, ylabelIf: (y) => Math.abs(y - Math.round(y)) < 1e-9, w: 380, h: tan ? 260 : 180,
    zeroAxes: true, fontSize: 12.5, fmtX: (v) => `${v}°`, padL: 34, padR: 30,
  });
  return c;
}

export const trigIdentify = G('gr-trig-identify', 'gr-trig-graphs', (rng, d) => {
  const base = [
    { tex: 'y = \\sin x', f: S }, { tex: 'y = \\cos x', f: Cs }, { tex: 'y = \\tan x', f: Tn, tan: true },
  ];
  const extra = [
    { tex: 'y = -\\sin x', f: (x) => -S(x) }, { tex: 'y = -\\cos x', f: (x) => -Cs(x) },
    { tex: 'y = 2\\sin x', f: (x) => 2 * S(x), big: true }, { tex: 'y = \\cos x + 1', f: (x) => Cs(x) + 1, big: true },
    { tex: 'y = \\sin 2x', f: (x) => S(2 * x) }, { tex: 'y = \\sin x - 1', f: (x) => S(x) - 1, big: true },
  ];
  const pool = d === 'easy' ? base : d === 'medium' ? [...base, ...extra.slice(0, 2)] : [...base, ...extra];
  const g = pick(rng, pool);
  const big = g.big || false;
  const [xmin, xmax] = pick(rng, d === 'easy' ? [[0, 360], [0, 360], [-180, 180]] : [[0, 360], [-180, 180], [0, 720], [-360, 360]]);
  const c = g.tan ? trigChart({ tan: true, ymin: -4, ymax: 4, ystep: 1, xmin, xmax }) : trigChart({ ymin: big ? -2.5 : -1.5, ymax: big ? 2.5 : 1.5, ystep: 0.5, xmin, xmax });
  const vis = c.wrap(c.curve(g.f, { samples: 720 }));
  const opts = [...base, ...extra].filter((o) => o.tex !== g.tex).map((o) => Y(o.tex));
  const at = (x) => tnum(Math.round(g.f(x) * 100) / 100);
  const keyPts = g.tan ? 'It has vertical asymptotes at $90^\\circ$, $270^\\circ$, … and repeats every $180^\\circ$.'
    : g.tex.includes('2x') ? `It repeats every $180^\\circ$ (twice as often as $\\sin x$): at $x = 45^\\circ$, $y = ${at(45)}$; at $x = 90^\\circ$, $y = ${at(90)}$.`
      : `Check key points: at $x = 0^\\circ$, $y = ${at(0)}$; at $x = 90^\\circ$, $y = ${at(90)}$; at $x = 180^\\circ$, $y = ${at(180)}$. The maximum is $${at(g.tex.includes('cos') ? (g.tex.includes('-') ? 180 : 0) : g.tex.includes('-\\sin') ? 270 : 90)}$.`;
  return {
    prompt: `Here is a graph for $${xmin}^\\circ \\leqslant x \\leqslant ${xmax}^\\circ$. Which is its equation?`,
    visual: vis,
    answer: Y(g.tex),
    distractors: uniq(shuffle(rng, opts), Y(g.tex)),
    solution: [
      'Remember the basic shapes: $\\sin x$ starts at $0$ and rises to $1$ at $90^\\circ$; $\\cos x$ starts at $1$; $\\tan x$ passes through $0$ and has vertical asymptotes.',
      keyPts,
      `Answer: $${g.tex}$`,
    ],
  };
}, { title: 'Identify a trig graph' });

const EXACT = {
  sin: { 30: '\\frac{1}{2}', 45: '\\frac{\\sqrt{2}}{2}', 60: '\\frac{\\sqrt{3}}{2}' },
  cos: { 30: '\\frac{\\sqrt{3}}{2}', 45: '\\frac{\\sqrt{2}}{2}', 60: '\\frac{1}{2}' },
  tan: { 30: '\\frac{1}{\\sqrt{3}}', 45: '1', 60: '\\sqrt{3}' },
};

export const trigSolve = G('gr-trig-solve', 'gr-trig-graphs', (rng, d) => {
  const fn = d === 'easy' ? pick(rng, ['sin', 'cos']) : pick(rng, ['sin', 'cos', 'tan']);
  const neg = d === 'hard' && chance(rng, 0.6);
  const a = neg ? pick(rng, [30, 45, 60]) : pick(rng, fn === 'tan' ? [10, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 75, 80] : [5, 10, 15, 20, 25, 30, 35, 40, 50, 55, 60, 65, 70, 75, 80, 85]);
  // Solutions in 0..360 of f(x) = ±f(a)
  let sols;
  if (fn === 'sin') sols = neg ? [180 + a, 360 - a] : [a, 180 - a];
  else if (fn === 'cos') sols = neg ? [180 - a, 180 + a] : [a, 360 - a];
  else sols = neg ? [180 - a, 360 - a] : [a, 180 + a];
  const [given, other] = chance(rng, 0.7) ? sols : [sols[1], sols[0]];
  const rhs = EXACT[fn][a] && (neg || chance(rng, 0.5)) ? `${neg ? '-' : ''}${EXACT[fn][a]}` : `\\${fn} ${deg(a)}`;
  const rule = { sin: 'The graph of $y = \\sin x$ is symmetrical about $x = 90^\\circ$ and about $x = 270^\\circ$.', cos: 'The graph of $y = \\cos x$ is symmetrical about $x = 180^\\circ$.', tan: 'The graph of $y = \\tan x$ repeats every $180^\\circ$.' }[fn];
  const how = fn === 'tan' ? `$${deg(Math.min(given, other))} + 180^\\circ = ${deg(Math.max(given, other))}$`
    : fn === 'cos' ? `$360^\\circ - ${deg(given)} = ${deg(other)}$`
      : given + other === 180 ? `$180^\\circ - ${deg(given)} = ${deg(other)}$` : `$540^\\circ - ${deg(given)} = ${deg(other)}$`;
  const ans = Y(deg(other));
  const dist = [180 - given, 360 - given, 180 + given, given - 180, 540 - given, given + 90, 90 - given]
    .filter((v) => v > 0 && v <= 360 && v !== other && v !== given).map((v) => Y(deg(v)));
  return {
    prompt: `One solution of $\\${fn} x = ${rhs}$ is $x = ${deg(given)}$.<br>Work out the other solution in the range $0^\\circ \\leqslant x \\leqslant 360^\\circ$.`,
    answer: ans,
    distractors: uniq(dist, ans),
    typed: { kind: 'number', value: other },
    solution: [
      rule,
      `Sketch the graph and draw the horizontal line $y = ${rhs}$: it crosses the curve twice between $0^\\circ$ and $360^\\circ$.`,
      `Using the symmetry: ${how}.`,
      `Answer: $${deg(other)}$`,
    ],
  };
}, { title: 'Use symmetry of trig graphs to solve equations' });

export const trigValues = G('gr-trig-values', 'gr-trig-graphs', (rng, d) => {
  const mode = d === 'easy' ? pick(rng, ['value', 'maxpt', 'zeros']) : d === 'medium' ? pick(rng, ['value', 'maxpt', 'count', 'amp']) : pick(rng, ['shift', 'count', 'amp', 'maxpt']);
  if (mode === 'value') {
    const fn = pick(rng, ['sin', 'cos', 'tan']);
    const x = pick(rng, fn === 'tan' ? [0, 45, 135, 180, 225, 315, 360] : [0, 90, 180, 270, 360]);
    const v = Math.round((fn === 'sin' ? S(x) : fn === 'cos' ? Cs(x) : Tn(x)) * 1000) / 1000;
    return {
      prompt: `Use the graph of $y = \\${fn} x$ to write down the value of $\\${fn} ${deg(x)}$.`,
      answer: T(v),
      distractors: uniq([0, 1, -1, 0.5, -0.5, 2].filter((u) => u !== v).map(T), T(v)),
      count: 4,
      typed: { kind: 'number', value: v },
      solution: [
        { sin: '$\\sin x$: $0$ at $0^\\circ$, $1$ at $90^\\circ$, $0$ at $180^\\circ$, $-1$ at $270^\\circ$, $0$ at $360^\\circ$.', cos: '$\\cos x$: $1$ at $0^\\circ$, $0$ at $90^\\circ$, $-1$ at $180^\\circ$, $0$ at $270^\\circ$, $1$ at $360^\\circ$.', tan: '$\\tan x$: $0$ at $0^\\circ$, $180^\\circ$, $360^\\circ$; $1$ at $45^\\circ$ and $225^\\circ$; $-1$ at $135^\\circ$ and $315^\\circ$.' }[fn],
        `So $\\${fn} ${deg(x)} = ${tnum(v)}$.`,
        `Answer: $${tnum(v)}$`,
      ],
    };
  }
  if (mode === 'maxpt') {
    const fn = pick(rng, ['sin', 'cos']); const wantMax = chance(rng);
    const ans = fn === 'sin' ? (wantMax ? [90, 1] : [270, -1]) : (wantMax ? (chance(rng) ? [0, 1] : [360, 1]) : [180, -1]);
    if (fn === 'cos' && wantMax) {
      const opt = `$(0^\\circ, 1)$ and $(360^\\circ, 1)$`;
      return {
        prompt: 'Write down the coordinates of the maximum points of $y = \\cos x$ for $0^\\circ \\leqslant x \\leqslant 360^\\circ$.',
        answer: opt,
        distractors: ['$(180^\\circ, 1)$', '$(90^\\circ, 1)$', '$(1, 0^\\circ)$ and $(1, 360^\\circ)$', '$(180^\\circ, -1)$', '$(90^\\circ, 1)$ and $(270^\\circ, 1)$'],
        solution: ['$y = \\cos x$ starts at its maximum value $1$ when $x = 0^\\circ$.', 'It falls to $-1$ at $180^\\circ$ and rises back to $1$ at $360^\\circ$.', `Answer: ${opt}`],
      };
    }
    const opt = (p) => `$(${deg(p[0])}, ${p[1]})$`;
    return {
      prompt: `Write down the coordinates of the ${wantMax ? 'maximum' : 'minimum'} point of $y = \\${fn} x$ for $0^\\circ \\leqslant x \\leqslant 360^\\circ$.`,
      answer: opt(ans),
      distractors: uniq([[ans[0] === 90 ? 270 : 90, ans[1]], [180, ans[1]], [ans[0], -ans[1]], [ans[0] === 90 ? 180 : 90, ans[1]], [0, ans[1]], [ans[0], 0]].map(opt), opt(ans)),
      solution: [
        fn === 'sin' ? '$y = \\sin x$ rises from $0$ to its maximum $1$ at $90^\\circ$, then falls to its minimum $-1$ at $270^\\circ$.' : '$y = \\cos x$ falls from $1$ to its minimum $-1$ at $180^\\circ$.',
        'Write the angle first (the $x$-coordinate), then the value.',
        `Answer: ${opt(ans)}`,
      ],
    };
  }
  if (mode === 'zeros') {
    const fn = pick(rng, ['sin', 'cos']);
    const ans = fn === 'sin' ? '$0^\\circ$, $180^\\circ$ and $360^\\circ$' : '$90^\\circ$ and $270^\\circ$';
    return {
      prompt: `For $0^\\circ \\leqslant x \\leqslant 360^\\circ$, at which values of $x$ does the graph of $y = \\${fn} x$ cross or touch the $x$-axis?`,
      answer: ans,
      distractors: uniq(['$0^\\circ$, $180^\\circ$ and $360^\\circ$', '$90^\\circ$ and $270^\\circ$', '$90^\\circ$ only', '$0^\\circ$ and $360^\\circ$ only', '$180^\\circ$ only', '$45^\\circ$ and $225^\\circ$'], ans),
      solution: [`The graph meets the $x$-axis where $\\${fn} x = 0$.`, fn === 'sin' ? '$\\sin 0^\\circ = \\sin 180^\\circ = \\sin 360^\\circ = 0$.' : '$\\cos 90^\\circ = \\cos 270^\\circ = 0$.', `Answer: ${ans}`],
    };
  }
  if (mode === 'amp') {
    const k = pick(rng, [2, 3, 4, 5]); const fn = pick(rng, ['sin', 'cos']); const add = d === 'hard' ? nz(rng, -3, 3) : 0;
    const wantMax = chance(rng);
    const v = wantMax ? k + add : -k + add;
    const tex = `y = ${k}\\${fn} x${add ? ` ${add < 0 ? '-' : '+'} ${Math.abs(add)}` : ''}`;
    return {
      prompt: `What is the ${wantMax ? 'maximum' : 'minimum'} value of $${tex}$?`,
      answer: T(v),
      distractors: uniq([k, -k, 1 + add, -1 + add, -v, k + add + 1, 2 * k, add].filter((u) => u !== v).map(T), T(v)),
      typed: { kind: 'number', value: v },
      solution: [
        `$\\${fn} x$ goes between $-1$ and $1$.`,
        `So $${k}\\${fn} x$ goes between $${-k}$ and $${k}$${add ? `, and adding $${add}$ moves this to between $${-k + add}$ and $${k + add}$` : ''}.`,
        `Answer: $${v}$`,
      ],
    };
  }
  if (mode === 'count') {
    const fn = pick(rng, ['sin', 'cos']); const k = pick(rng, [0.3, 0.6, 0.8, -0.4, -0.7]); const range = pick(rng, [360, 720]);
    const n = (range / 360) * 2;
    return {
      prompt: `How many solutions does $\\${fn} x = ${tnum(k)}$ have for $0^\\circ \\leqslant x \\leqslant ${deg(range)}$?`,
      answer: T(n),
      distractors: uniq([1, 2, 3, 4, 6, 8].filter((u) => u !== n).map(T), T(n)),
      typed: { kind: 'number', value: n },
      solution: [
        `Sketch $y = \\${fn} x$ and the horizontal line $y = ${tnum(k)}$ (which is between $-1$ and $1$).`,
        `The line crosses each complete $360^\\circ$ cycle twice, and there ${range === 720 ? 'are two cycles' : 'is one cycle'}.`,
        `Answer: $${n}$`,
      ],
    };
  }
  // shift: f(x) = sin(x − 90) etc.
  const fn = pick(rng, ['sin', 'cos']); const sh = pick(rng, [90, -90, 180]); const x = pick(rng, [0, 90, 180]);
  const f = (t) => (fn === 'sin' ? S(t - sh) : Cs(t - sh));
  const v = Math.round(f(x) * 1000) / 1000;
  return {
    prompt: `$f(x) = \\${fn}(x ${sh > 0 ? '-' : '+'} ${deg(Math.abs(sh))})$<br>Work out the value of $f(${deg(x)})$.`,
    answer: T(v),
    distractors: uniq([0, 1, -1, 0.5, -0.5].filter((u) => u !== v).map(T), T(v)),
    count: 4,
    typed: { kind: 'number', value: v },
    solution: [
      `$f(${deg(x)}) = \\${fn}(${x} ${sh > 0 ? '-' : '+'} ${Math.abs(sh)})^\\circ = \\${fn}(${deg(x - sh)})$`,
      `From the graph of $y = \\${fn} x$ (it repeats every $360^\\circ$): $\\${fn}(${deg(x - sh)}) = ${tnum(v)}$.`,
      `Answer: $${tnum(v)}$`,
    ],
  };
}, { title: 'Key values and features of trig graphs' });

/* ================================================================== */
/* gr-circle-equation                                                  */
/* ================================================================== */

const PYTH = [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [1, 2], [2, 1], [2, 4], [4, 2], [1, 3], [3, 1], [2, 6], [6, 2], [4, 8], [8, 4], [3, 6], [6, 3], [1, 1], [2, 2], [3, 9], [5, 10], [4, 12]];
const surd = (n) => { const k = largestSquareFactor(n); const r = n / (k * k); return r === 1 ? `${k}` : `${k === 1 ? '' : k}\\sqrt{${r}}`; };

export const circleRadius = G('gr-circle-radius', 'gr-circle-equation', (rng, d) => {
  const askD = chance(rng, 0.5);
  let N; let r; let rTex;
  if (d === 'easy') { r = int(rng, 2, 12); N = r * r; rTex = `${r}`; }
  else if (d === 'medium') { r = pick(rng, [5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 20]); N = r * r; rTex = `${r}`; if (chance(rng, 0.4)) { N = pick(rng, [5, 7, 10, 11, 13, 15, 17, 19]); rTex = `\\sqrt{${N}}`; r = null; } }
  else { N = pick(rng, [8, 12, 18, 20, 27, 32, 45, 48, 50, 72, 75, 80, 98]); rTex = surd(N); r = null; }
  const valTex = (k) => (r !== null ? `${r * k}` : k === 1 ? rTex : (() => { const m = rTex.match(/^(\d*)\\sqrt\{(\d+)\}$/); return m ? `${(Number(m[1] || 1)) * k}\\sqrt{${m[2]}}` : `${k}${rTex}`; })());
  const ans = Y(valTex(askD ? 2 : 1));
  const dist = [Y(tnum(N)), Y(tnum(2 * N)), Y(valTex(askD ? 1 : 2)), Y(tnum(N / 2)), Y(valTex(askD ? 4 : 3)), Y(tnum(4 * N))];
  return {
    prompt: `The equation of a circle is $x^2 + y^2 = ${N}$.<br>Work out the length of the ${askD ? 'diameter' : 'radius'}.${r === null ? ' Give your answer as a surd in its simplest form.' : ''}`,
    answer: ans,
    distractors: uniq(dist.filter((s) => !/\./.test(s)), ans),
    typed: r !== null ? { kind: 'number', value: askD ? 2 * r : r } : undefined,
    solution: [
      '$x^2 + y^2 = r^2$ is a circle with centre the origin and radius $r$.',
      `$r^2 = ${N}$, so $r = \\sqrt{${N}}${r !== null || rTex !== `\\sqrt{${N}}` ? ` = ${rTex}` : ''}$. (The ${N} is $r^2$, not $r$.)`,
      askD ? `Diameter $= 2r = ${valTex(2)}$` : `Radius $= ${rTex}$`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Radius and diameter from x² + y² = r²' });

export const circleEquation = G('gr-circle-equation-find', 'gr-circle-equation', (rng, d) => {
  const [a0, b0] = pick(rng, d === 'easy' ? [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [0, 5], [0, 7], [6, 0]] : PYTH);
  const sx = chance(rng) ? 1 : -1; const sy = chance(rng) ? 1 : -1;
  const a = a0 * sx; const b = b0 * sy;
  const N = a * a + b * b;
  const mode = d === 'easy' ? pick(rng, ['point', 'graph']) : d === 'medium' ? pick(rng, ['point', 'point', 'graph']) : pick(rng, ['surd', 'diameter']);
  if (mode === 'surd') {
    // radius given as a surd: r = k√m, so r² = k²m
    const k = int(rng, 2, 5); const m = pick(rng, [2, 3, 5, 6, 7]);
    const r2 = k * k * m; const ansS = Y(`x^2 + y^2 = ${r2}`);
    return {
      prompt: `A circle has its centre at the origin and radius $${k}\\sqrt{${m}}$.<br>Which is the equation of the circle?`,
      answer: ansS,
      distractors: uniq([`x^2 + y^2 = ${k * m}`, `x^2 + y^2 = ${k * k + m}`, `x^2 + y^2 = ${k * m * k * m}`, `x^2 + y^2 = ${k}\\sqrt{${m}}`, `x^2 + y^2 = ${2 * k * k * m}`, `x^2 + y^2 = ${k * k}`].map(Y), ansS),
      solution: [
        'The equation is $x^2 + y^2 = r^2$.',
        `$r^2 = (${k}\\sqrt{${m}})^2 = ${k}^2 \\times (\\sqrt{${m}})^2 = ${k * k} \\times ${m} = ${r2}$`,
        `Answer: ${ansS}`,
      ],
    };
  }
  if (mode === 'diameter') {
    // AB is a diameter through the origin: A and B are opposite points
    const ansD = Y(`x^2 + y^2 = ${N}`);
    return {
      prompt: `The points $A${pt(a, b)}$ and $B${pt(-a, -b)}$ are the ends of a diameter of a circle.<br>Which is the equation of the circle?`,
      answer: ansD,
      distractors: uniq([`x^2 + y^2 = ${4 * N}`, `x^2 + y^2 = ${2 * N}`, `x^2 + y^2 = ${Math.abs(a) + Math.abs(b)}`, `x^2 + y^2 = ${(Math.abs(a) + Math.abs(b)) ** 2}`, `x^2 - y^2 = ${N}`].map(Y), ansD),
      solution: [
        `The centre is the midpoint of AB: $\\left(\\frac{${a} + ${par(-a)}}{2}, \\frac{${b} + ${par(-b)}}{2}\\right) = (0, 0)$.`,
        `The radius is the distance from the origin to A: $r^2 = ${par(a)}^2 + ${par(b)}^2 = ${N}$.`,
        `Careful: $${4 * N}$ would be the square of the diameter. Answer: ${ansD}`,
      ],
    };
  }
  const ans = Y(`x^2 + y^2 = ${N}`);
  const dist = [`x^2 + y^2 = ${Math.abs(a) + Math.abs(b)}`, `x^2 + y^2 = ${Math.round(Math.sqrt(N)) ** 2 === N ? Math.sqrt(N) : N * 2}`, `x^2 + y^2 = ${N * 2}`, `x^2 + y^2 = ${(Math.abs(a) + Math.abs(b)) ** 2}`, `x^2 - y^2 = ${N}`, `y = x^2 + ${N}`, `x^2 + y^2 = ${Math.abs(a * a - b * b) || N + 1}`].map(Y);
  if (mode === 'graph' && Number.isInteger(Math.sqrt(N)) && Math.sqrt(N) <= 6) {
    const R = Math.sqrt(N);
    const cg = coordGrid({ xmin: -R - 1, xmax: R + 1, ymin: -R - 1, ymax: R + 1, unit: R > 4 ? 22 : 26 });
    const circ = cg.curve((x) => Math.sqrt(Math.max(0, R * R - x * x)), { from: -R, to: R, samples: 200 }) + cg.curve((x) => -Math.sqrt(Math.max(0, R * R - x * x)), { from: -R, to: R, samples: 200 });
    return {
      prompt: 'Here is a circle with its centre at the origin. Which is its equation?',
      visual: cg.wrap(circ),
      answer: ans,
      distractors: uniq([Y(`x^2 + y^2 = ${R}`), Y(`x^2 + y^2 = ${2 * R}`), Y(`x^2 + y^2 = ${4 * R * R}`), Y(`x + y = ${R}`), Y(`y = x^2 + ${R}`), Y(`x^2 + y^2 = ${R * R + 1}`)], ans),
      solution: [`The circle crosses the axes at $\\pm${R}$, so its radius is $${R}$.`, `The equation is $x^2 + y^2 = r^2 = ${R}^2 = ${N}$.`, `Answer: ${ans}`],
    };
  }
  return {
    prompt: `A circle has its centre at the origin and passes through the point ${P(a, b)}.<br>Which is the equation of the circle?`,
    answer: ans,
    distractors: uniq(dist, ans),
    solution: [
      'The radius is the distance from the origin to the point. By Pythagoras, $r^2 = x^2 + y^2$.',
      `$r^2 = ${par(a)}^2 + ${par(b)}^2 = ${a * a} + ${b * b} = ${N}$`,
      `The equation is $x^2 + y^2 = r^2$, so $x^2 + y^2 = ${N}$. (No need to square-root.)`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Find the equation of a circle' });

function tangentData(rng, d) {
  const [a0, b0] = pick(rng, PYTH.filter(([a, b]) => a !== 0 && b !== 0));
  const a = a0 * (chance(rng) ? 1 : -1); const b = b0 * (chance(rng) ? 1 : -1);
  const N = a * a + b * b;
  const mOP = frac(b, a); const m = frac(-a, b); const c = frac(N, b);
  if (d !== 'hard' && c.d !== 1) throw new Error('r');
  return { a, b, N, mOP, m, c };
}

export const circleTangent = G('gr-circle-tangent', 'gr-circle-equation', (rng, d) => {
  const { a, b, N, mOP, m, c } = tangentData(rng, d);
  const hidden = d === 'hard' && chance(rng, 0.5);
  // When the intercept is a fraction, ask for the form ax + by = c (as mark schemes do): the tangent is ax + by = r².
  const general = c.d !== 1;
  const s0 = a < 0 ? -1 : 1; // keep the x coefficient positive
  const gen = (p, q, r) => `${lin(p, 0)} ${q < 0 ? '-' : '+'} ${Math.abs(q) === 1 ? '' : Math.abs(q)}y = ${r}`;
  const ans = general ? Y(gen(s0 * a, s0 * b, s0 * N)) : Y(yeq(m, c));
  const dist = general
    ? [gen(s0 * a, -s0 * b, s0 * N), gen(s0 * b, s0 * a, s0 * N), gen(s0 * a, s0 * b, -s0 * N), gen(s0 * b, -s0 * a, 0), gen(s0 * a, s0 * b, Math.round(Math.sqrt(N)) ** 2 === N ? s0 * Math.sqrt(N) : s0 * 2 * N), yeq(m, c.mul(2).neg()).replace(/^y/, 'y')].map(Y)
    : [yeq(mOP, c), yeq(m, frac(b)), yeq(mOP, 0), yeq(m.neg(), c), yeq(m, c.neg()), yeq(mOP.neg(), frac(b).sub(mOP.neg().mul(a))), yeq(m, frac(N))].map(Y);
  const where = hidden ? `P is a point on the circle with $x$-coordinate $${a}$, and P is ${b > 0 ? 'above' : 'below'} the $x$-axis.` : `P${P(a, b)} is a point on the circle.`;
  return {
    prompt: `A circle has equation $x^2 + y^2 = ${N}$.<br>${where}<br>Work out the equation of the tangent to the circle at P.${general ? ' Give your answer in the form $ax + by = c$, where $a$, $b$ and $c$ are integers.' : ''}`,
    answer: ans,
    distractors: uniq(dist, ans),
    typed: general
      ? { kind: 'text', accept: [`${s0 * a === 1 ? '' : s0 * a}x${s0 * b < 0 ? '-' : '+'}${Math.abs(s0 * b) === 1 ? '' : Math.abs(s0 * b)}y=${s0 * N}`] }
      : { kind: 'text', accept: linAccept(m, c, 'x', 'y=') },
    solution: [
      ...(hidden ? [`$(${a})^2 + y^2 = ${N}$, so $y^2 = ${b * b}$ and $y = ${b}$ (${b > 0 ? 'above' : 'below'} the axis): P is ${P(a, b)}.`.replace(`$(${a})^2`, a < 0 ? `$(${a})^2` : `$${a}^2`)] : []),
      `Gradient of the radius OP $= ${fracEq(b, a)}$.`,
      `The tangent is perpendicular to the radius, so its gradient is $${m.tex()}$ (negative reciprocal).`,
      `$y = ${lin(m, 0)} + c$ through ${P(a, b)}: $${b} = ${m.mul(a).tex()} + c$, so $c = ${c.tex()}$.`,
      ...(general ? [`$y = ${lin(m, c)}$. Multiply by $${s0 * b}$ and rearrange: $${gen(s0 * a, s0 * b, s0 * N)}$.`] : []),
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Equation of a tangent to a circle' });

export const circleTangentIntercept = G('gr-circle-tangent-intercept', 'gr-circle-equation', (rng, d) => {
  const { a, b, N, m, c } = tangentData(rng, 'hard');
  if (d === 'hard') {
    // The tangent and the axes make a triangle: area = ½ × (x-intercept) × (y-intercept)
    const xi = frac(N, a); const yi = c;
    const area = xi.mul(yi).div(2).value();
    if (xi.d !== 1 || yi.d !== 1 || !Number.isInteger(area * 2)) throw new Error('r');
    const A = Math.abs(area);
    return {
      prompt: `${P(a, b)} is a point on the circle $x^2 + y^2 = ${N}$.<br>The tangent to the circle at ${P(a, b)} meets the $x$-axis at A and the $y$-axis at B.<br>Work out the area of triangle OAB, where O is the origin.`,
      answer: `$${tnum(A)}$ square units`,
      distractors: uniq([2 * A, Math.abs(xi.value()) + Math.abs(yi.value()), Math.abs(xi.value() * yi.value()) / 4, N, N / 2, A + Math.abs(a * b) / 2].filter((v) => v > 0 && v !== A && Number.isInteger(v * 2)).map((v) => `$${tnum(v)}$ square units`), `$${tnum(A)}$ square units`),
      typed: { kind: 'number', value: A },
      solution: [
        `Gradient of radius $= ${fracEq(b, a)}$, so the tangent gradient is $${m.tex()}$ (negative reciprocal).`,
        `Tangent: $y = ${lin(m, yi)}$ (substitute ${P(a, b)} to find $c = ${yi.tex()}$). So B is $(0, ${yi.tex()})$.`,
        `On the $x$-axis $y = 0$: $x = ${xi.tex()}$, so A is $(${xi.tex()}, 0)$.`,
        `Area $= \\frac{1}{2} \\times ${Math.abs(xi.value())} \\times ${Math.abs(yi.value())} = ${tnum(A)}$`,
        `Answer: $${tnum(A)}$ square units`,
      ],
    };
  }
  const axis = d === 'easy' ? 'y' : pick(rng, ['x', 'y']);
  const val = axis === 'x' ? frac(N, a) : c;
  if (val.d !== 1) throw new Error('r');
  return {
    prompt: `${P(a, b)} is a point on the circle $x^2 + y^2 = ${N}$.<br>The tangent to the circle at ${P(a, b)} crosses the ${axis}-axis at Q.<br>Work out the ${axis}-coordinate of Q.`,
    answer: T(val),
    distractors: uniq([frac(N, b), frac(N, a), frac(N), frac(a + b), val.neg(), frac(b * b, a), frac(a * a, b)].filter((f) => !f.eq(val) && f.d <= 4).map(T), T(val)),
    typed: { kind: 'number', value: val },
    solution: [
      `Gradient of radius $= ${fracEq(b, a)}$, so the tangent gradient is $${m.tex()}$.`,
      `Tangent: $y = ${lin(m, 0)} + c$ through ${P(a, b)} gives $c = ${c.tex()}$, so $y = ${lin(m, c)}$.`,
      axis === 'x' ? `On the $x$-axis $y = 0$: $${lin(m, 0)} = ${c.neg().tex()}$, so $x = ${val.tex()}$.` : `It crosses the $y$-axis at the intercept $c = ${val.tex()}$.`,
      `Answer: $${val.tex()}$`,
    ],
  };
}, { title: 'Where a tangent to a circle meets the axes' });

export const circlePoint = G('gr-circle-point', 'gr-circle-equation', (rng, d) => {
  const [a0, b0] = pick(rng, PYTH.concat([[0, 5], [7, 24], [24, 7], [9, 12], [12, 9], [8, 15], [15, 8]]).filter(([u, v]) => u !== v));
  const N = a0 * a0 + b0 * b0;
  if (d === 'hard') {
    // (k, mk) on x² + y² = N  =>  (1 + m²)k² = N
    const mm = pick(rng, [2, 3]); const k = int(rng, 1, 5); const NN = (1 + mm * mm) * k * k;
    const yTex = `${mm}k`;
    return {
      prompt: `The point $(k, ${yTex})$ lies on the circle $x^2 + y^2 = ${NN}$, and $k \\gt 0$.<br>Work out the value of $k$.`,
      answer: T(k),
      distractors: uniq([NN / (1 + mm), Math.round(Math.sqrt(NN / (1 + mm))), k * k, k * mm, Math.round(Math.sqrt(NN)), k + 1].filter((v) => Number.isInteger(v) && v > 0 && v !== k).map(T), T(k)),
      typed: { kind: 'number', value: k },
      solution: [
        `Substitute $x = k$ and $y = ${yTex}$: $k^2 + (${yTex})^2 = ${NN}$`,
        `$(${yTex})^2 = ${mm * mm}k^2$, so $${1 + mm * mm}k^2 = ${NN}$`,
        `$k^2 = ${k * k}$, so $k = ${k}$ (positive)`,
        `Answer: $k = ${k}$`,
      ],
    };
  }
  if (d === 'easy' || chance(rng, 0.5)) {
    const x = a0; const y = b0 + pick(rng, [-1, 0, 1]);
    const v = x * x + y * y;
    const ans = v < N ? 'Inside the circle' : v > N ? 'Outside the circle' : 'On the circle';
    return {
      prompt: `Is the point ${P(x, -y)} inside, outside or on the circle $x^2 + y^2 = ${N}$?`,
      answer: ans,
      distractors: ['Inside the circle', 'On the circle', 'Outside the circle'].filter((s) => s !== ans),
      count: 3,
      solution: [
        'Work out $x^2 + y^2$ for the point and compare with $r^2$.',
        `$${x}^2 + (${-y})^2 = ${x * x} + ${y * y} = ${v}$`,
        `$${v}$ is ${v < N ? 'less than' : v > N ? 'greater than' : 'equal to'} $${N}$, so the point is ${ans.toLowerCase()}.`,
        `Answer: ${ans}`,
      ],
    };
  }
  const k = a0;
  return {
    prompt: `The point $(k, ${b0})$ lies on the circle $x^2 + y^2 = ${N}$, and $k \\gt 0$.<br>Work out the value of $k$.`,
    answer: T(k),
    distractors: uniq([N - b0, Math.round(Math.sqrt(N - b0)), N - b0 * b0, Math.round(Math.sqrt(N)), b0, -k].filter((v) => Number.isInteger(v) && v > 0 && v !== k).map(T), T(k)),
    typed: { kind: 'number', value: k },
    solution: [
      `Substitute $y = ${b0}$: $k^2 + ${b0}^2 = ${N}$`,
      `$k^2 = ${N} - ${b0 * b0} = ${k * k}$`,
      `$k = \\sqrt{${k * k}} = ${k}$ (positive)`,
      `Answer: $k = ${k}$`,
    ],
  };
}, { title: 'Points on, inside or outside a circle' });

/* ================================================================== */
/* gr-transformations                                                  */
/* ================================================================== */

const TRANS = {
  right: (a) => ({ tex: `f(x - ${a})`, map: ([x, y]) => [x + a, y], desc: `Translation by $\\begin{pmatrix}${a}\\\\0\\end{pmatrix}$`, words: `a translation of ${a} to the right` }),
  left: (a) => ({ tex: `f(x + ${a})`, map: ([x, y]) => [x - a, y], desc: `Translation by $\\begin{pmatrix}${-a}\\\\0\\end{pmatrix}$`, words: `a translation of ${a} to the left` }),
  up: (a) => ({ tex: `f(x) + ${a}`, map: ([x, y]) => [x, y + a], desc: `Translation by $\\begin{pmatrix}0\\\\${a}\\end{pmatrix}$`, words: `a translation of ${a} up` }),
  down: (a) => ({ tex: `f(x) - ${a}`, map: ([x, y]) => [x, y - a], desc: `Translation by $\\begin{pmatrix}0\\\\${-a}\\end{pmatrix}$`, words: `a translation of ${a} down` }),
  reflX: () => ({ tex: '-f(x)', map: ([x, y]) => [x, -y], desc: 'Reflection in the $x$-axis', words: 'a reflection in the $x$-axis' }),
  reflY: () => ({ tex: 'f(-x)', map: ([x, y]) => [-x, y], desc: 'Reflection in the $y$-axis', words: 'a reflection in the $y$-axis' }),
};

export const transPoint = G('gr-trans-point', 'gr-transformations', (rng, d) => {
  const x0 = nz(rng, -5, 5); const y0 = nz(rng, -6, 6);
  if (x0 === y0 || x0 === -y0) throw new Error('r');
  const a = int(rng, 1, 5);
  const kinds = d === 'easy' ? ['up', 'down', 'right', 'left'] : ['up', 'down', 'right', 'left', 'reflX', 'reflY'];
  const kind = pick(rng, kinds);
  let t = TRANS[kind](a);
  let img = t.map([x0, y0]);
  let extra = null;
  if (d === 'hard') {
    const k2 = pick(rng, ['up', 'down', 'reflX']); const b = int(rng, 1, 4);
    const t2 = TRANS[k2](b);
    if (['right', 'left'].includes(kind) && k2 !== 'reflX') {
      extra = t2; img = t2.map(img);
      t = { ...t, tex: kind === 'right' ? `f(x - ${a}) ${k2 === 'up' ? '+' : '-'} ${b}` : `f(x + ${a}) ${k2 === 'up' ? '+' : '-'} ${b}` };
    }
  }
  const wrongMaps = [([x, y]) => [x - (img[0] - x0), y], ([x, y]) => [x, y + (img[0] - x0)], ([x, y]) => [x + (img[1] - y0), y], ([x, y]) => [-x, y], ([x, y]) => [x, -y], ([x, y]) => [x - (img[0] - x0), y + (img[1] - y0)], ([x, y]) => [y, x]];
  const dist = wrongMaps.map((g) => g([x0, y0])).filter((p) => !(p[0] === img[0] && p[1] === img[1])).map((p) => P(...p));
  return {
    prompt: `The graph of $y = f(x)$ has a turning point at ${P(x0, y0)}.<br>Write down the coordinates of the turning point of the graph of $y = ${t.tex}$.`,
    answer: P(...img),
    distractors: uniq(dist, P(...img)),
    typed: { kind: 'coord', x: img[0], y: img[1] },
    solution: [
      kind === 'right' || kind === 'left' ? `$f(x ${kind === 'right' ? '-' : '+'} ${a})$ moves the graph ${a} to the <b>${kind}</b> — the opposite way to the sign inside the bracket.`
        : kind === 'up' || kind === 'down' ? `$f(x) ${kind === 'up' ? '+' : '-'} ${a}$ moves the graph ${a} ${kind}.` : kind === 'reflX' ? '$-f(x)$ reflects the graph in the $x$-axis: $y$-coordinates change sign.' : '$f(-x)$ reflects the graph in the $y$-axis: $x$-coordinates change sign.',
      ...(extra ? [`Then ${extra.words} changes the $y$-coordinate.`] : []),
      `${P(x0, y0)} → ${P(...img)}`,
      `Answer: ${P(...img)}`,
    ],
  };
}, { title: 'Turning point after a transformation' });

export const transDescribe = G('gr-trans-describe', 'gr-transformations', (rng, d) => {
  const a = int(rng, 1, 6);
  const kind = pick(rng, d === 'easy' ? ['up', 'down', 'right', 'left'] : ['up', 'down', 'right', 'left', 'reflX', 'reflY', 'right', 'left']);
  const t = TRANS[kind](a);
  const all = ['up', 'down', 'right', 'left'].map((k) => TRANS[k](a).desc).concat([TRANS.reflX().desc, TRANS.reflY().desc]);
  const swapped = kind === 'right' || kind === 'left' ? `Translation by $\\begin{pmatrix}0\\\\${kind === 'right' ? -a : a}\\end{pmatrix}$` : null;
  const opposite = kind === 'right' ? TRANS.left(a).desc : kind === 'left' ? TRANS.right(a).desc : kind === 'up' ? TRANS.down(a).desc : kind === 'down' ? TRANS.up(a).desc : null;
  // Concrete functions on the hard level: x² for translations, 2^x for reflections (x² and x³ are symmetric).
  let lhs = 'y = f(x)'; let rhs = `y = ${t.tex}`;
  if (d === 'hard') {
    if (kind === 'reflX' || kind === 'reflY') { lhs = 'y = 2^x'; rhs = kind === 'reflX' ? 'y = -2^x' : 'y = 2^{-x}'; }
    else {
      const base = pick(rng, ['x^2', 'x^3']);
      const pw = base.slice(1);
      lhs = `y = ${base}`;
      rhs = kind === 'right' ? `y = (x - ${a})${pw}` : kind === 'left' ? `y = (x + ${a})${pw}` : kind === 'up' ? `y = ${base} + ${a}` : `y = ${base} - ${a}`;
    }
  }
  const ans = t.desc;
  return {
    prompt: `Describe the single transformation that maps the graph of $${lhs}$ onto the graph of $${rhs}$.`,
    answer: ans,
    distractors: uniq([opposite, swapped, ...shuffle(rng, all)].filter(Boolean), ans),
    solution: [
      '$f(x) + a$ moves the graph <b>up</b> by $a$; $f(x + a)$ moves it <b>left</b> by $a$ (the opposite of what the sign suggests).',
      '$-f(x)$ reflects in the $x$-axis; $f(-x)$ reflects in the $y$-axis.',
      `Here the change is ${t.words}.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Describe a graph transformation' });

// Piecewise-linear base shapes (asymmetric so every transformation looks different).
const SHAPES = [
  [[-3, 0], [-1, 3], [1, 1], [2, 2]],
  [[-2, -1], [0, 2], [2, 0], [3, 1]],
  [[-3, 1], [-2, 3], [0, 0], [2, 1]],
  [[-2, 2], [-1, 0], [1, 3], [3, 0]],
];

export const transIdentify = G('gr-trans-identify', 'gr-transformations', (rng, d) => {
  const shape = pick(rng, SHAPES).map(([x, y]) => [x, y + pick(rng, [0, -1])]);
  const a = int(rng, 1, 3);
  if (d === 'hard') {
    // A combined translation: g(x) = f(x − p) + q
    const p = nz(rng, -3, 3); const q = nz(rng, -3, 3);
    const img = shape.map(([x, y]) => [x + p, y + q]);
    if ([...shape, ...img].some(([x, y]) => Math.abs(x) > 6 || Math.abs(y) > 5)) throw new Error('r');
    const cg = coordGrid({ xmin: -6, xmax: 6, ymin: -5, ymax: 5, unit: 24 });
    const lab = (pts, str, col) => {
      const w = str.length * 14 * 0.55; const cands = [];
      for (const pp of [pts[pts.length - 1], pts[0], pts[1], pts[pts.length - 2]]) for (const [u, v] of [[1, -1], [1, 1], [-1, -1], [-1, 1], [0, -1.6], [0, 1.6]]) cands.push([cg.X(pp[0]) + u * (w / 2 + 8), cg.Y(pp[1]) + v * 14]);
      const [x, y] = cg.place(cands, w, 14);
      return halo(x, y, str, { size: 14, color: col });
    };
    const vis = cg.wrap(cg.poly(shape) + cg.poly(img, { color: ACCENT2, dash: '7 5' }) + lab(shape, 'y = f(x)', ACCENT) + lab(img, 'y = g(x)', ACCENT2));
    const inner = (h) => `f(x ${h > 0 ? '-' : '+'} ${Math.abs(h)})`;
    const form = (h, v) => `g(x) = ${inner(h)} ${v > 0 ? '+' : '-'} ${Math.abs(v)}`;
    const ans = Y(form(p, q));
    return {
      prompt: 'The graph of $y = f(x)$ is shown with a solid line. The dashed graph is $y = g(x)$.<br>Which is the equation for $g(x)$?',
      visual: vis,
      answer: ans,
      distractors: uniq([form(-p, q), form(p, -q), form(-p, -q), form(q, p), `g(x) = f(x) ${p + q >= 0 ? '+' : '-'} ${Math.abs(p + q) || 1}`].map(Y), ans),
      solution: [
        `Compare matching points: ${P(...shape[1])} on $f$ moves to ${P(...img[1])} on $g$.`,
        `That is ${Math.abs(p)} to the ${p > 0 ? 'right' : 'left'} and ${Math.abs(q)} ${q > 0 ? 'up' : 'down'}.`,
        `Horizontal: $${inner(p)}$ (the sign in the bracket is opposite to the direction). Vertical: ${q > 0 ? `add $${q}$` : `subtract $${-q}$`} outside.`,
        `Answer: ${ans}`,
      ],
    };
  }
  const kinds = d === 'easy' ? ['up', 'down', 'right', 'left'] : ['up', 'down', 'right', 'left', 'reflX', 'reflY'];
  const kind = pick(rng, kinds);
  const t = TRANS[kind](a);
  const img = shape.map(t.map);
  const allPts = [...shape, ...img];
  if (allPts.some(([x, y]) => Math.abs(x) > 6 || Math.abs(y) > 5)) throw new Error('r');
  const cg = coordGrid({ xmin: -6, xmax: 6, ymin: -5, ymax: 5, unit: 24 });
  // Label near one end of each graph, in whichever nearby spot overlaps least (and stays inside the grid).
  const lab = (pts, s, col) => {
    const w = s.length * 14 * 0.55;
    const cands = [];
    for (const p of [pts[pts.length - 1], pts[0], pts[1], pts[pts.length - 2]]) {
      for (const [u, v] of [[1, -1], [1, 1], [-1, -1], [-1, 1], [0, -1.6], [0, 1.6]]) cands.push([cg.X(p[0]) + u * (w / 2 + 8), cg.Y(p[1]) + v * 14]);
    }
    const [x, y] = cg.place(cands, w, 14);
    return halo(x, y, s, { size: 14, color: col });
  };
  const vis = cg.wrap(cg.poly(shape) + cg.poly(img, { color: ACCENT2, dash: '7 5' }) + lab(shape, 'y = f(x)', ACCENT) + lab(img, 'y = g(x)', ACCENT2));
  const others = ['up', 'down', 'right', 'left'].filter((k) => k !== kind).map((k) => `g(x) = ${TRANS[k](a).tex}`);
  const refl = ['reflX', 'reflY'].filter((k) => k !== kind).map((k) => `g(x) = ${TRANS[k]().tex}`);
  const ans = Y(`g(x) = ${t.tex}`);
  return {
    prompt: 'The graph of $y = f(x)$ is shown with a solid line. The dashed graph is $y = g(x)$.<br>Which is the equation for $g(x)$?',
    visual: vis,
    answer: ans,
    distractors: uniq(shuffle(rng, [...others, ...refl]).map(Y), ans),
    solution: [
      `Compare matching points: ${P(...shape[1])} on $f$ moves to ${P(...img[1])} on $g$.`,
      `That is ${t.words}.`,
      kind === 'right' || kind === 'left' ? `A horizontal move of ${a} to the ${kind} is $f(x ${kind === 'right' ? '-' : '+'} ${a})$ — the sign inside the bracket is the opposite of the direction.` : kind === 'up' || kind === 'down' ? `A vertical move is $f(x) ${kind === 'up' ? '+' : '-'} ${a}$.` : kind === 'reflX' ? 'Reflecting in the $x$-axis makes every $y$ negative: $-f(x)$.' : 'Reflecting in the $y$-axis swaps $x$ for $-x$: $f(-x)$.',
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Identify a transformation from graphs' });

export const transEquation = G('gr-trans-equation', 'gr-transformations', (rng, d) => {
  const base = d === 'hard' ? pick(rng, ['x^2', 'x^3', 'cos', 'sin']) : pick(rng, ['x^2', 'x^2', 'x^3']);
  if (base === 'sin' || base === 'cos') {
    const sh = pick(rng, [30, 45, 60, 90]); const dir = pick(rng, ['right', 'left', 'up']);
    const v = pick(rng, [1, 2, 3]);
    const fn = `\\${base}`;
    const ans = dir === 'right' ? `y = ${fn}(x - ${sh}^\\circ)` : dir === 'left' ? `y = ${fn}(x + ${sh}^\\circ)` : `y = ${fn} x + ${v}`;
    const desc = dir === 'up' ? `$\\begin{pmatrix}0\\\\${v}\\end{pmatrix}$` : `$\\begin{pmatrix}${dir === 'right' ? sh : -sh}\\\\0\\end{pmatrix}$`;
    const dist = dir === 'up' ? [`y = ${fn}(x + ${v})`, `y = ${fn} x - ${v}`, `y = ${v}${fn} x`, `y = ${fn}(x - ${v})`] : [`y = ${fn}(x ${dir === 'right' ? '+' : '-'} ${sh}^\\circ)`, `y = ${fn} x ${dir === 'right' ? '+' : '-'} ${sh}`, `y = ${fn} x ${dir === 'right' ? '-' : '+'} ${sh}`, `y = ${fn}(${sh}x)`];
    return {
      prompt: `The graph of $y = ${fn} x$ is translated by the vector ${desc}.<br>What is the equation of the new graph?`,
      answer: Y(ans),
      distractors: uniq(dist.map(Y), Y(ans)),
      solution: [
        dir === 'up' ? 'A translation up by $a$ adds $a$ to the whole function: $y = f(x) + a$.' : `A translation of ${sh}° to the ${dir} replaces $x$ with $x ${dir === 'right' ? '-' : '+'} ${sh}^\\circ$.`,
        `Answer: $${ans}$`,
      ],
    };
  }
  const p = nz(rng, -5, 5); const q = d === 'easy' ? 0 : nz(rng, -6, 6);
  const inner = `(x ${p > 0 ? '-' : '+'} ${Math.abs(p)})`;
  const pow = base === 'x^2' ? '^2' : '^3';
  const tail = q === 0 ? '' : ` ${q > 0 ? '+' : '-'} ${Math.abs(q)}`;
  const ans = `y = ${inner}${pow}${tail}`;
  const wrongInner = `(x ${p > 0 ? '+' : '-'} ${Math.abs(p)})`;
  const qTail = (s) => (q === 0 ? '' : ` ${s > 0 ? '+' : '-'} ${Math.abs(q)}`);
  const dist = [`y = ${wrongInner}${pow}${tail}`, `y = x${pow}${pmc(q - p) || ` ${p > 0 ? '-' : '+'} ${Math.abs(p)}`}`, `y = ${inner}${pow}${qTail(-q)}`, `y = ${wrongInner}${pow}${qTail(-q)}`, q ? `y = (x ${q > 0 ? '-' : '+'} ${Math.abs(q)})${pow} ${p > 0 ? '+' : '-'} ${Math.abs(p)}` : `y = x${pow} ${p > 0 ? '+' : '-'} ${Math.abs(p)}`, Math.abs(p) === 1 ? null : `y = ${p}x${pow}${tail}`].filter(Boolean);
  return {
    prompt: `The graph of $y = ${base}$ is translated by the vector $\\begin{pmatrix}${p}\\\\${q}\\end{pmatrix}$.<br>What is the equation of the translated graph?`,
    answer: Y(ans),
    distractors: uniq(dist.map(Y), Y(ans)),
    solution: [
      `Moving ${Math.abs(p)} to the ${p > 0 ? 'right' : 'left'} replaces $x$ with $${inner.slice(1, -1)}$ (the sign is the opposite of the direction).`,
      q === 0 ? 'There is no vertical movement.' : `Moving ${Math.abs(q)} ${q > 0 ? 'up' : 'down'} ${q > 0 ? `adds $${q}$ to` : `subtracts $${-q}$ from`} the whole function.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Equation of a transformed graph' });

export const nonlinearGenerators = [
  quadTable, quadRootsGraph, quadTurning, quadSolveK, quadFeatures,
  shapeWhichGraph, shapeWhichEquation,
  gsTwoLines, gsQuadLine, gsWhichLine,
  ineqDescribe, ineqPointIn, ineqCount,
  trigIdentify, trigSolve, trigValues,
  circleRadius, circleEquation, circleTangent, circleTangentIntercept, circlePoint,
  transPoint, transDescribe, transIdentify, transEquation,
];

void [Frac, gcd, pt, sample];
