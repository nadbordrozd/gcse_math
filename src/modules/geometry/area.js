// Perimeter and area unit: perimeter, area of rectangles/triangles/parallelograms, trapezia & compound shapes,
// circles, arcs and sectors.
import { pick, int, size, shuffle, chance, tnum, num, roundTo, frac, gcd } from '../../core.js';
import {
  ggen, line, polygon, text, dot, circle, path, rightMark, equalTicks, figure, arcLabel, place, polar, add, sub, scale,
  unit, mid, centroid, dimLabel, textWidth, htext, heightLabel, squareGrid, wrongs, FILL, SHADE, ACCENT, ACCENT2, MUTED, GRID, degS,
} from './diagrams.js';

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const L = (v, u = 'cm') => `$${tnum(v)}$ ${u}`;
const A2 = (v, u = 'cm') => `$${tnum(v)}$ ${u}²`;
const lab = (v, u = 'cm') => `${num(v)} ${u}`;
/** k·π in TeX: piT(6) -> "6\pi", piT(0.5) -> "0.5\pi", piT(1) -> "\pi" */
const piT = (k) => (k === 1 ? '\\pi' : `${tnum(k)}\\pi`);
const piAns = (k, u) => `$${piT(k)}$${u ? ` ${u}` : ''}`;
const typedPi = (k) => ({ kind: 'text', accept: [`${k}π`, `${k}pi`, `${k}*π`, `${k}×π`, `π${k}`, ...(k === 1 ? ['π', 'pi'] : [])].map(String) });
const r1 = (x) => roundTo(x, 1);
/** x-scale factor so a w × h drawing has aspect ratio within [lo, hi] (diagrams are "not drawn accurately"). */
const xs = (w, h, lo = 0.8, hi = 2.6) => { const r = w / h; return Math.min(hi, Math.max(lo, r)) / r; };
const dp1 = (x, u) => `$${tnum(r1(x), 1)}$${u ? ` ${u}` : ''}`;
const typed1 = (x) => ({ kind: 'number', value: r1(x), tolerance: 0.05 });
const UNITS = ['cm', 'cm', 'm', 'mm'];

/* ------------------------------------------------------------------ */
/* Rectilinear compound shapes                                         */
/* ------------------------------------------------------------------ */

const signedArea = (pts) => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;

/**
 * Label edges of a polygon given in maths coords (y up). labels[i] labels edge i (pts[i] -> pts[i+1]); null skips.
 * Returns markup. Labels sit outside the polygon.
 */
export function edgeLabels(ptsM, map, labels, { size: fs = 14 } = {}) {
  const ccw = signedArea(ptsM) > 0;
  let out = '';
  ptsM.forEach((p, i) => {
    const q = ptsM[(i + 1) % ptsM.length];
    if (!labels[i]) return;
    const dx = q[0] - p[0]; const dy = q[1] - p[1];
    let n = ccw ? [dy, -dx] : [-dy, dx]; // outward, maths coords
    const l = Math.hypot(...n); n = [n[0] / l, n[1] / l];
    const ns = [n[0], -n[1]]; // screen
    const P = map(p); const Q = map(q); const m = mid(P, Q);
    const w = textWidth(labels[i], fs);
    const push = 10 + Math.abs(ns[0]) * (w / 2) + Math.abs(ns[1]) * 6;
    out += text(m[0] + ns[0] * push, m[1] + ns[1] * push, labels[i], { size: fs, italic: /^[a-z]$/.test(labels[i]) });
  });
  return out;
}

/** Random L- or U-shape. Returns { pts (maths ccw), lens (edge lengths), known (labelled edge indices), area, perim, parts } */
function compoundShape(rng, d, { kind = null, allowDecimal = false } = {}) {
  const k = kind || pick(rng, d === 'easy' ? ['L'] : d === 'medium' ? ['L', 'L', 'U'] : ['L', 'U', 'U']);
  const big = d === 'easy' ? [6, 14] : d === 'medium' ? [8, 20] : [10, 30];
  const dec = allowDecimal && d === 'hard' && chance(rng, 0.4);
  const q = dec ? 0.5 : 1;
  const W = int(rng, big[0], big[1]) * (dec ? 1 : 1);
  const H = int(rng, Math.max(5, big[0] - 2), big[1] - 2);
  if (k === 'L') {
    const a = int(rng, 2, W - 3) + (dec ? q : 0); const b = int(rng, 2, H - 3) + (dec ? q : 0);
    let pts = [[0, 0], [W, 0], [W, H - b], [W - a, H - b], [W - a, H], [0, H]];
    const fx = chance(rng, 0.5); const fy = chance(rng, 0.4);
    if (fx) pts = pts.map(([x, y]) => [W - x, y]).reverse();
    if (fy) pts = pts.map(([x, y]) => [x, H - y]).reverse();
    const lens = pts.map((p, i) => { const r = pts[(i + 1) % 6]; return Math.abs(r[0] - p[0]) + Math.abs(r[1] - p[1]); });
    // known: the four "outer" edges (lengths W, H, W-a, H-b), i.e. those touching a corner of the bounding box;
    // the two notch edges (a and b) are left for the student to work out.
    const corner = (pt) => (pt[0] === 0 || pt[0] === W) && (pt[1] === 0 || pt[1] === H);
    const knownSet = lens.map((_, i) => i).filter((i) => corner(pts[i]) || corner(pts[(i + 1) % 6]));
    return { kind: 'L', pts, lens, known: knownSet, W, H, a, b, area: W * H - a * b, perim: 2 * (W + H), notch: [a, b] };
  }
  // U-shape: notch in the top
  const p1 = int(rng, 2, Math.max(2, Math.floor(W / 3))); const p2 = int(rng, 2, Math.max(2, Math.floor(W / 3)));
  const nw = W - p1 - p2; const e = int(rng, 2, H - 2) + (dec ? q : 0);
  if (nw < 2) return compoundShape(rng, d, { kind: 'L', allowDecimal });
  let pts = [[0, 0], [W, 0], [W, H], [W - p2, H], [W - p2, H - e], [p1, H - e], [p1, H], [0, H]];
  if (chance(rng, 0.3)) pts = pts.map(([x, y]) => [x, H - y]).reverse();
  const lens = pts.map((p, i) => { const r = pts[(i + 1) % 8]; return Math.abs(r[0] - p[0]) + Math.abs(r[1] - p[1]); });
  // label everything except the notch width and one of the two side heights
  const notchW = lens.findIndex((l, i) => { const p = pts[i]; const r = pts[(i + 1) % 8]; return p[1] === r[1] && p[1] !== 0 && p[1] !== H; });
  const known = lens.map((_, i) => i).filter((i) => i !== notchW);
  // drop the second vertical side of length H (deducible)
  const sidesH = known.filter((i) => lens[i] === H && pts[i][0] === pts[(i + 1) % 8][0]);
  const knownFinal = known.filter((i) => i !== sidesH[1]);
  return { kind: 'U', pts, lens, known: knownFinal, W, H, notchW: nw, e, p1, p2, area: W * H - nw * e, perim: 2 * W + 2 * H + 2 * e };
}

function drawCompound(sh, u, { W = 400, H = 270, labels = null, shade = false } = {}) {
  const pl = place(sh.pts, { width: W, height: H, pad: 50 });
  const P = sh.pts.map(pl.map);
  let body = polygon(P, { fill: shade ? SHADE : FILL });
  const labs = labels || sh.lens.map((l, i) => (sh.known.includes(i) ? lab(l, u) : null));
  body += edgeLabels(sh.pts, pl.map, labs);
  // right-angle marks at a couple of convex corners for realism
  return figure(W, H, body, { nda: true });
}

/* ================================================================== */
/* geo-perimeter                                                       */
/* ================================================================== */

export const perimCompound = ggen('geo-perim-compound', 'geo-perimeter', (rng, d) => {
  const sh = compoundShape(rng, d, { allowDecimal: true });
  const u = pick(rng, ['cm', 'cm', 'm']);
  const knownSum = sh.known.reduce((s, i) => s + sh.lens[i], 0);
  const P = sh.perim;
  const ds = [knownSum, sh.area, P - (sh.kind === 'U' ? 2 * sh.e : 0) + (sh.kind === 'U' ? 0 : 2), sh.kind === 'L' ? P - sh.a - sh.b : P - sh.notchW, sh.W * sh.H, P + 2, P - 2];
  return {
    prompt: `Work out the perimeter of this shape.<br>All corners are right angles.`,
    visual: drawCompound(sh, u),
    answer: L(P, u),
    distractors: wrongs(P, ds, { min: 0 }).filter((v) => roundTo(v, 1) === v).map((v) => L(v, u)),
    typed: { kind: 'number', value: P },
    hint: 'Work out the missing side lengths first, then add up <b>all</b> the sides.',
    solution: sh.kind === 'L' ? [
      'First find the two missing sides.',
      `Missing horizontal side: $${tnum(sh.W)} - ${tnum(sh.W - sh.a)} = ${tnum(sh.a)}$ ${u}. Missing vertical side: $${tnum(sh.H)} - ${tnum(sh.H - sh.b)} = ${tnum(sh.b)}$ ${u}.`,
      `Add all six sides: $${sh.lens.map((l) => tnum(l)).join(' + ')} = ${tnum(P)}$`,
      `Answer: ${L(P, u)}`,
    ] : [
      'First find the missing side lengths.',
      `The gap at the top is $${tnum(sh.W)} - ${tnum(sh.p1)} - ${tnum(sh.p2)} = ${tnum(sh.notchW)}$ ${u}, and both outer sides are $${tnum(sh.H)}$ ${u}.`,
      `Add all eight sides: $${sh.lens.map((l) => tnum(l)).join(' + ')} = ${tnum(P)}$`,
      `Answer: ${L(P, u)}`,
    ],
  };
}, { title: 'Perimeter of compound shapes' });

export const perimMissingSide = ggen('geo-perim-missing', 'geo-perimeter', (rng, d) => {
  const kind = pick(rng, d === 'easy' ? ['rect', 'iso', 'regular'] : d === 'medium' ? ['rect', 'iso', 'tri', 'regular'] : ['algebraRect', 'algebraTri', 'iso']);
  const u = pick(rng, ['cm', 'cm', 'm', 'mm']);
  const W = 400; const H = 250;
  if (kind === 'rect') {
    const a = int(rng, 3, 15); const b = int(rng, a + 1, 25); const P = 2 * (a + b);
    const pts = [[0, 0], [b, 0], [b, a], [0, a]];
    const pl = place(pts, { width: W, height: H, pad: 50 });
    let body = polygon(pts.map(pl.map), { fill: FILL }) + edgeLabels(pts, pl.map, [lab(b, u), 'x', null, null]);
    body += rightMark(pl.map([0, 0]), pl.map([1, 0]), pl.map([0, 1]), 12);
    return {
      prompt: `The rectangle has perimeter ${L(P, u)}.<br>Work out the length $x$.`,
      visual: figure(W, H, body, { nda: true }),
      answer: L(a, u), distractors: wrongs(a, [P - b, P / 2, (P - b) / 2, P / 4, P - 2 * b, a + 1, a - 1].filter(Number.isInteger), { min: 0 }).map((v) => L(v, u)),
      typed: { kind: 'number', value: a },
      solution: [`A rectangle has two lengths of ${lab(b, u)} and two sides of length $x$.`, `$2 \\times ${b} = ${2 * b}$, so the two sides $x$ add up to $${P} - ${2 * b} = ${P - 2 * b}$.`, `$x = ${P - 2 * b} \\div 2 = ${a}$`, `Answer: ${L(a, u)}`],
    };
  }
  if (kind === 'iso' || kind === 'tri') {
    const iso = kind === 'iso';
    const s = int(rng, 5, 18); const base = int(rng, Math.max(4, Math.ceil(s * 0.6)), Math.min(2 * s - 2, 20));
    const c = iso ? s : int(rng, Math.abs(s - base) + 2, s + base - 2);
    const P = s + c + base;
    const askBase = iso && chance(rng, 0.5);
    // triangle drawing: base on bottom
    const xC = iso ? base / 2 : (base * base + s * s - c * c) / (2 * base);
    const hC = Math.sqrt(Math.max(1, s * s - xC * xC));
    const pts = [[0, 0], [base, 0], [xC, hC]];
    const pl = place(pts, { width: W, height: H, pad: 50 });
    const V = pts.map(pl.map);
    let body = polygon(V, { fill: FILL });
    const x = askBase ? base : iso ? s : c;
    body += edgeLabels(pts, pl.map, [askBase ? 'x' : lab(base, u), iso ? (askBase ? null : 'x') : 'x', iso && !askBase ? null : lab(s, u)]);
    if (iso) body += equalTicks(V[1], V[2]) + equalTicks(V[2], V[0]);
    if (iso && askBase) body = polygon(V, { fill: FILL }) + edgeLabels(pts, pl.map, ['x', null, lab(s, u)]) + equalTicks(V[1], V[2]) + equalTicks(V[2], V[0]);
    const sol = iso ? (askBase ? [`The two marked sides are equal, so they add up to $2 \\times ${s} = ${2 * s}$ ${u}.`, `$x = ${P} - ${2 * s} = ${base}$`] : [`The base is ${lab(base, u)}, so the two equal sides add up to $${P} - ${base} = ${P - base}$.`, `$x = ${P - base} \\div 2 = ${s}$`])
      : [`Perimeter = sum of the three sides.`, `$x = ${P} - ${base} - ${s} = ${c}$`];
    return {
      prompt: `The perimeter of the triangle is ${L(P, u)}.<br>Work out the length $x$.`,
      visual: figure(W, H, body, { nda: true }),
      answer: L(x, u),
      distractors: wrongs(x, [P - base, P - s, (P - s) / 2, P / 3, P - base - 2 * s > 0 ? P - base - 2 * s : 0, P - x, x + 2, x - 2].filter(Number.isInteger), { min: 0 }).map((v) => L(v, u)),
      typed: { kind: 'number', value: x },
      solution: [...sol, `Answer: ${L(x, u)}`],
    };
  }
  if (kind === 'regular') {
    const n = pick(rng, [5, 6, 8, 3, 4]);
    const side = d === 'easy' ? int(rng, 2, 12) : int(rng, 3, 25) + pick(rng, [0, 0.5]);
    const P = roundTo(n * side, 2);
    const name = { 3: 'An equilateral triangle', 4: 'A square', 5: 'A regular pentagon', 6: 'A regular hexagon', 8: 'A regular octagon' }[n];
    return {
      prompt: `${name} has a perimeter of ${L(P, u)}.<br>Work out the length of one side.`,
      answer: L(side, u),
      distractors: wrongs(side, [P / (n - 1), P / (n + 1), P / 2, P / 4, P - n, side * 2].map((v) => roundTo(v, 2)).filter((v) => roundTo(v, 2) === v && v * 100 % 25 === 0), { min: 0 }).map((v) => L(v, u)),
      typed: { kind: 'number', value: side },
      solution: [`${name.replace(/^An? /, 'The ')} has ${n} equal sides.`, `Side length $= ${tnum(P)} \\div ${n} = ${tnum(side)}$`, `Answer: ${L(side, u)}`],
    };
  }
  if (kind === 'algebraRect') {
    const x = int(rng, 2, 9); const a1 = int(rng, 2, 4); const b1 = int(rng, -3, 6); const a2 = 1; const b2 = int(rng, 1, 8);
    const s1 = a1 * x + b1; const s2 = a2 * x + b2;
    if (s1 <= 0 || s2 <= 0 || s1 === s2) throw new Error('bad');
    const P = 2 * (s1 + s2);
    const e1 = `${a1}x ${b1 < 0 ? '−' : '+'} ${Math.abs(b1)}`.replace(/ [+−] 0$/, ''); const e2 = `x + ${b2}`;
    const pts = [[0, 0], [Math.max(s1, s2) * 1.3, 0], [Math.max(s1, s2) * 1.3, Math.min(s1, s2)], [0, Math.min(s1, s2)]];
    const pl = place(pts, { width: W, height: H, pad: 75 });
    const body = polygon(pts.map(pl.map), { fill: FILL }) + edgeLabels(pts, pl.map, [`(${e1}) ${u}`, `(${e2}) ${u}`, null, null]);
    const ex1 = `${a1}x ${b1 < 0 ? '-' : '+'} ${Math.abs(b1)}`.replace(/ [+-] 0$/, '');
    return {
      prompt: `The perimeter of the rectangle is ${L(P, u)}.<br>Work out the value of $x$.`,
      visual: figure(W, H, body, { nda: true }),
      answer: `$x = ${x}$`,
      distractors: wrongs(x, [(P - b1 - b2) / (a1 + 1), (P / 2 - b1 - b2) / (a1 + 1) + 1, P / (2 * (a1 + 1)), (P - 2 * b1 - 2 * b2) / (a1 + 1), x + 1, x - 1, x + 2], { integer: true, min: 0 }).map((v) => `$x = ${v}$`),
      typed: { kind: 'number', value: x },
      solution: [
        `Perimeter $= 2 \\times (\\text{length} + \\text{width})$`,
        `$2(${ex1} + x + ${b2}) = ${P}$, so $${a1 + 1}x + ${b1 + b2} = ${P / 2}$`,
        `$${a1 + 1}x = ${P / 2 - b1 - b2}$, so $x = ${x}$`,
        `Answer: $x = ${x}$`,
      ],
    };
  }
  // algebraTri: isosceles triangle sides 2x+a (equal) and base x+b
  const x = int(rng, 2, 10); const a = int(rng, 1, 6); const b = int(rng, 0, 8);
  const s = 2 * x + a; const base = x + b;
  if (base >= 2 * s) throw new Error('degenerate');
  const P = 2 * s + base;
  const pts = [[0, 0], [base, 0], [base / 2, Math.sqrt(s * s - (base * base) / 4)]];
  const pl = place(pts, { width: W, height: H, pad: 50 });
  const V = pts.map(pl.map);
  const body = polygon(V, { fill: FILL }) + edgeLabels(pts, pl.map, [b ? `x + ${b}` : 'x', `2x + ${a}`, `2x + ${a}`]) + equalTicks(V[1], V[2]) + equalTicks(V[2], V[0]);
  return {
    prompt: `The perimeter of this isosceles triangle is ${L(P, u)}.<br>Work out the value of $x$.`,
    visual: figure(W, H, body, { nda: true }),
    answer: `$x = ${x}$`,
    distractors: wrongs(x, [(P - a - b) / 3, (P - 2 * a - b) / 3 + 1, (P - a - b) / 5, P / 5, (P - 2 * a) / 5, x + 1, x - 1, x + 2], { integer: true, min: 0 }).map((v) => `$x = ${v}$`),
    typed: { kind: 'number', value: x },
    solution: [
      'Add all three sides and set equal to the perimeter.',
      `$(2x + ${a}) + (2x + ${a}) + (x${b ? ` + ${b}` : ''}) = ${P}$, so $5x + ${2 * a + b} = ${P}$`,
      `$5x = ${P - 2 * a - b}$, so $x = ${x}$`,
      `Answer: $x = ${x}$`,
    ],
  };
}, { title: 'Missing side from the perimeter', learn: ['geo-perimeter', 'alg-solve-brackets-both-sides'] });

export const perimJoined = ggen('geo-perim-joined', 'geo-perimeter', (rng, d) => {
  const mode = d === 'easy' ? 'rects' : d === 'medium' ? pick(rng, ['rects', 'pentagon']) : pick(rng, ['pentagon', 'rectsL']);
  const W = 420; const H = 250;
  if (mode === 'pentagon') {
    // square + equilateral or isosceles triangle sharing a side
    const s = int(rng, 4, 15);
    const equi = d === 'medium' || chance(rng, 0.4);
    const t = equi ? s : int(rng, Math.ceil(s / 2) + 1, s + 8);
    const Psq = 4 * s; const Ptri = 2 * t + s;
    const sq = [[0, 0], [s, 0], [s, s], [0, s]];
    const apex = [s / 2, s + Math.sqrt(t * t - (s * s) / 4)];
    const pl = place([...sq, apex], { width: W, height: H + 30, pad: 36 });
    const V = sq.map(pl.map); const Ap = pl.map(apex);
    let body = polygon([V[0], V[1], V[2], Ap, V[3]], { fill: FILL }) + line(...V[2], ...V[3], { width: 1.5, dash: '5 4' });
    body += equalTicks(V[2], Ap) + equalTicks(Ap, V[3]);
    const P = 3 * s + 2 * t;
    return {
      prompt: `A square has perimeter ${L(Psq)}.<br>An ${equi ? 'equilateral' : 'isosceles'} triangle has perimeter ${L(Ptri)}.<br>The square and the triangle are joined to make a pentagon, as shown.<br>Work out the perimeter of the pentagon.`,
      visual: figure(W, H + 30, body, { nda: true }),
      answer: L(P), distractors: wrongs(P, [Psq + Ptri, Psq + Ptri - s, 5 * s, Psq + t, P + s, 4 * s + 2 * t]).map((v) => L(v)),
      typed: { kind: 'number', value: P },
      solution: [
        `Square side $= ${Psq} \\div 4 = ${s}$ cm. ${equi ? `The triangle's sides are all ${s} cm too.` : `The triangle's base is the square's side, ${s} cm, so each sloping side is $(${Ptri} - ${s}) \\div 2 = ${t}$ cm.`}`,
        `The shared side is <b>inside</b> the pentagon, so it is not part of the perimeter.`,
        `Perimeter $= 3 \\times ${s} + 2 \\times ${t} = ${P}$ cm`,
        `Answer: ${L(P)}`,
      ],
    };
  }
  // identical rectangles in a row (long sides together) or L arrangement
  const n = d === 'easy' ? pick(rng, [2, 3]) : pick(rng, [3, 4, 5]);
  const w = int(rng, 2, 6); const l = w + int(rng, 2, 8);
  const Psmall = 2 * (w + l);
  const pts = [];
  let body = '';
  const scaleK = Math.min(300 / (n * w), 160 / l);
  const x0 = (W - n * w * scaleK) / 2; const y0 = (H - l * scaleK) / 2 + 10;
  for (let i = 0; i < n; i += 1) body += polygon([[x0 + i * w * scaleK, y0], [x0 + (i + 1) * w * scaleK, y0], [x0 + (i + 1) * w * scaleK, y0 + l * scaleK], [x0 + i * w * scaleK, y0 + l * scaleK]], { fill: FILL });
  void pts;
  const P = 2 * (n * w + l);
  const givenW = chance(rng, 0.5);
  body += text(x0 - 12 - textWidth(lab(l), 14) / 2, y0 + (l * scaleK) / 2, lab(l), { size: 14 });
  return {
    prompt: `${n} identical rectangles are put together to make a large rectangle, as shown.<br>Each small rectangle is ${l} cm long and has perimeter ${L(Psmall)}.<br>Work out the perimeter of the large rectangle.`,
    visual: figure(W, H, body, { nda: true }),
    answer: L(P), distractors: wrongs(P, [n * Psmall, n * Psmall - 2 * (n - 1) * w, 2 * (n * l + w), n * w + l, P + 2 * w, P - 2 * w]).map((v) => L(v)),
    typed: { kind: 'number', value: P },
    solution: [
      `Width of a small rectangle: $(${Psmall} - 2 \\times ${l}) \\div 2 = ${w}$ cm.`,
      `The large rectangle is $${n} \\times ${w} = ${n * w}$ cm wide and ${l} cm tall.`,
      `Perimeter $= 2 \\times (${n * w} + ${l}) = ${P}$ cm`,
      `Answer: ${L(P)}`,
    ],
    hint: givenW ? 'Find the width of one small rectangle first.' : undefined,
  };
}, { title: 'Perimeter of joined shapes' });

/* ---------- grid polyominoes ---------- */

function polyomino(rng, k, cols = 8, rows = 6) {
  for (let t = 0; t < 200; t += 1) {
    const cells = new Set([`${Math.floor(cols / 2)},${Math.floor(rows / 2)}`]);
    while (cells.size < k) {
      const [cx, cy] = pick(rng, [...cells]).split(',').map(Number);
      const [dx, dy] = pick(rng, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
      const nx = cx + dx; const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      cells.add(`${nx},${ny}`);
    }
    const list = [...cells].map((c) => c.split(',').map(Number));
    // reject holes: every empty cell inside bbox must reach the border
    const has = (x, y) => cells.has(`${x},${y}`);
    let perim = 0;
    for (const [x, y] of list) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!has(x + dx, y + dy)) perim += 1;
    const seen = new Set(); const stack = [];
    for (let x = -1; x <= cols; x += 1) for (let y = -1; y <= rows; y += 1) if (x === -1 || y === -1 || x === cols || y === rows) { stack.push([x, y]); seen.add(`${x},${y}`); }
    while (stack.length) {
      const [x, y] = stack.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx; const ny = y + dy; const key = `${nx},${ny}`;
        if (nx < -1 || ny < -1 || nx > cols || ny > rows || seen.has(key) || has(nx, ny)) continue;
        seen.add(key); stack.push([nx, ny]);
      }
    }
    if ((cols + 2) * (rows + 2) - seen.size !== k) continue;
    return { cells: list, perim, has };
  }
  throw new Error('polyomino');
}

function drawPolyomino(shape, cols, rows, s = 30) {
  const g = squareGrid(cols, rows, { s, x0: 14, y0: 14 });
  let body = g.body;
  for (const [x, y] of shape.cells) body += polygon([g.P([x, y]), g.P([x + 1, y]), g.P([x + 1, y + 1]), g.P([x, y + 1])], { fill: FILL, color: GRID, width: 1 });
  for (const [x, y] of shape.cells) {
    if (!shape.has(x + 1, y)) body += line(...g.P([x + 1, y]), ...g.P([x + 1, y + 1]), { width: 2.4 });
    if (!shape.has(x - 1, y)) body += line(...g.P([x, y]), ...g.P([x, y + 1]), { width: 2.4 });
    if (!shape.has(x, y + 1)) body += line(...g.P([x, y + 1]), ...g.P([x + 1, y + 1]), { width: 2.4 });
    if (!shape.has(x, y - 1)) body += line(...g.P([x, y]), ...g.P([x + 1, y]), { width: 2.4 });
  }
  return { body, width: g.width, height: g.height };
}

export const perimGrid = ggen('geo-perim-grid', 'geo-perimeter', (rng, d) => {
  const k = d === 'easy' ? int(rng, 4, 8) : d === 'medium' ? int(rng, 6, 9) : int(rng, 9, 13);
  const cols = 9; const rows = 7;
  const shape = polyomino(rng, k, cols, rows);
  const pic = drawPolyomino(shape, cols, rows);
  const scaleNote = d === 'hard' && chance(rng, 0.5);
  const unitLen = scaleNote ? pick(rng, [2, 5, 10]) : 1;
  const u = scaleNote && unitLen === 10 ? 'mm' : 'cm';
  const P = shape.perim * unitLen;
  return {
    prompt: scaleNote ? `The shape is drawn on a grid of squares. Each square has sides of ${unitLen} ${u}.<br>Work out the perimeter of the shape.` : 'The shape is drawn on a centimetre grid.<br>Work out the perimeter of the shape.',
    visual: figure(pic.width, pic.height, pic.body, { maxWidth: 320 }),
    answer: L(P, u),
    distractors: wrongs(P, [k * unitLen, (shape.perim - 2) * unitLen, (shape.perim + 2) * unitLen, shape.perim, 4 * k * unitLen, k * unitLen * unitLen, (shape.perim - 1) * unitLen]).map((v) => L(v, u)),
    typed: { kind: 'number', value: P },
    solution: [
      'The perimeter is the distance all the way round the <b>outside</b> edge.',
      `Count the square edges along the outline: there are ${shape.perim}${unitLen > 1 ? `, each ${unitLen} ${u} long` : ''}.`,
      unitLen > 1 ? `$${shape.perim} \\times ${unitLen} = ${P}$ ${u}` : `(Don't count the squares inside — that gives the area, ${k} cm².)`,
      `Answer: ${L(P, u)}`,
    ],
  };
}, { title: 'Perimeter on a grid' });

/* ================================================================== */
/* geo-area-basic                                                      */
/* ================================================================== */

export const areaRectangle = ggen('geo-area-rectangle', 'geo-area-basic', (rng, d) => {
  const W = 400; const H = 240;
  if (d === 'hard' && chance(rng, 0.5)) {
    // mixed units
    const lm = pick(rng, [2, 3, 4, 5, 1.5, 2.5]); const wcm = pick(rng, [40, 50, 60, 80, 75, 25]);
    const inM = chance(rng, 0.5);
    const ans = inM ? roundTo(lm * wcm / 100, 4) : lm * 100 * wcm;
    const kx = xs(lm * 100, wcm); const pts = [[0, 0], [lm * 100 * kx, 0], [lm * 100 * kx, wcm], [0, wcm]];
    const pl = place(pts, { width: W, height: H, pad: 50 });
    const body = polygon(pts.map(pl.map), { fill: FILL }) + edgeLabels(pts, pl.map, [lab(lm, 'm'), lab(wcm, 'cm'), null, null]) + rightMark(pl.map([0, 0]), pl.map([1, 0]), pl.map([0, 1]), 12);
    const u = inM ? 'm' : 'cm';
    return {
      prompt: `Work out the area of the rectangle in ${inM ? 'm²' : 'cm²'}.`,
      visual: figure(W, H, body, { nda: true }),
      answer: A2(ans, u),
      distractors: wrongs(ans, inM ? [lm * wcm, lm * wcm / 10, lm * wcm / 1000, 2 * (lm + wcm / 100), ans * 10] : [lm * wcm, lm * wcm * 10, lm * wcm * 1000, ans / 10, 2 * (lm * 100 + wcm)]).filter((v) => roundTo(v, 3) === v).map((v) => A2(v, u)),
      typed: { kind: 'number', value: ans },
      solution: [
        'Both lengths must be in the same unit first.',
        inM ? `$${tnum(wcm)}$ cm $= ${tnum(wcm / 100)}$ m` : `$${tnum(lm)}$ m $= ${tnum(lm * 100)}$ cm`,
        inM ? `Area $= ${tnum(lm)} \\times ${tnum(wcm / 100)} = ${tnum(ans)}$ m²` : `Area $= ${tnum(lm * 100)} \\times ${wcm} = ${tnum(ans)}$ cm²`,
        `Answer: ${A2(ans, u)}`,
      ],
    };
  }
  const u = pick(rng, UNITS);
  const square = chance(rng, 0.25);
  const a = d === 'easy' ? int(rng, 2, 12) : d === 'medium' ? int(rng, 4, 25) : roundTo(int(rng, 5, 40) / 2, 1);
  const b = square ? a : d === 'easy' ? int(rng, 2, 12) : d === 'medium' ? int(rng, 4, 25) : roundTo(int(rng, 5, 40) / 2, 1);
  if (!square && a === b) throw new Error('eq');
  const ans = roundTo(a * b, 4);
  const kx = xs(Math.max(a, b), Math.min(a, b)); const pts = [[0, 0], [Math.max(a, b) * kx, 0], [Math.max(a, b) * kx, Math.min(a, b)], [0, Math.min(a, b)]];
  const pl = place(pts, { width: W, height: H, pad: 50 });
  const V = pts.map(pl.map);
  let body = polygon(V, { fill: FILL }) + edgeLabels(pts, pl.map, [lab(Math.max(a, b), u), square ? null : lab(Math.min(a, b), u), null, null]) + rightMark(V[0], V[1], V[3], 12);
  if (square) body += equalTicks(V[0], V[1]) + equalTicks(V[1], V[2]) + equalTicks(V[2], V[3]) + equalTicks(V[3], V[0]);
  return {
    prompt: square ? `The diagram shows a square.<br>Work out its area.` : 'Work out the area of the rectangle.',
    visual: figure(W, H, body, { nda: true }),
    answer: A2(ans, u),
    distractors: wrongs(ans, [2 * (a + b), a + b, ans / 2, 2 * a * b, a * a === ans ? 4 * a : a * a, ans + a, ans - b]).map((v) => A2(v, u)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Area of a ${square ? 'square' : 'rectangle'} = length × width`,
      `$${tnum(a)} \\times ${tnum(b)} = ${tnum(ans)}$`,
      `Don't mix this up with the perimeter ($${tnum(2 * (a + b))}$ ${u}).`,
      `Answer: ${A2(ans, u)}`,
    ],
  };
}, { title: 'Area of rectangles and squares' });

/** Triangle (maths coords) with base b along x-axis and apex at (xa, h). */
function drawTriArea(b, h, xa, labels, { u = 'cm', W = 400, H = 260, slant = null } = {}) {
  const kx = xs(Math.max(b, b - xa, xa), h, 0.9, 2.2); const pts = [[0, 0], [b * kx, 0], [xa * kx, h]];
  const foot = [xa * kx, 0];
  const extra = xa < 0 || xa > b ? [foot] : [];
  const pl = place([...pts, ...extra], { width: W, height: H, pad: 50 });
  const V = pts.map(pl.map); const F = pl.map(foot);
  let body = polygon(V, { fill: FILL });
  if (Math.abs(xa) < 1e-9 || Math.abs(xa - b) < 1e-9) body += rightMark(F, V[2], xa === 0 ? V[1] : V[0], 12);
  else {
    body += line(...V[2], ...F, { width: 1.5, dash: '5 4' });
    if (xa < 0) body += line(...F, ...V[0], { width: 1.5, dash: '5 4' });
    if (xa > b) body += line(...V[1], ...F, { width: 1.5, dash: '5 4' });
    body += rightMark(F, V[2], xa > b ? V[0] : V[1], 10);
  }
  body += dimLabel(V[0], V[1], lab(labels.b, u), V[2], { offset: 14 });
  const hx = xa === 0 ? -1 : 1;
  const mH = mid(V[2], F);
  const hl = lab(labels.h, u);
  body += Math.abs(xa) < 1e-9 || Math.abs(xa - b) < 1e-9 ? htext(mH[0] + hx * (textWidth(hl, 14) / 2 + 8), mH[1], hl, { size: 14 }) : heightLabel(V[2], F, hl, V);
  if (slant) {
    const [i, j, val] = slant;
    body += dimLabel(V[i], V[j], lab(val, u), V[3 - i - j] || centroid(V), { offset: 12 });
  }
  return figure(W, H, body, { nda: true });
}

export const areaTriangle = ggen('geo-area-triangle', 'geo-area-basic', (rng, d) => {
  const u = pick(rng, UNITS);
  const b = d === 'easy' ? 2 * int(rng, 2, 8) : int(rng, 4, 20);
  const h = d === 'easy' ? int(rng, 3, 12) : int(rng, 3, 18);
  const right = d === 'easy' ? chance(rng, 0.5) : chance(rng, 0.25);
  const xa = right ? pick(rng, [0, b]) : d === 'hard' && chance(rng, 0.4) ? -b * 0.35 : b * (0.25 + 0.5 * rng());
  const ans = (b * h) / 2;
  // slant side (rounded up a bit) shown as a distractor on medium/hard
  const sl = !right && d !== 'easy' ? Math.ceil(Math.hypot(xa, h)) + int(rng, 0, 2) : null;
  const visual = drawTriArea(b, h, xa, { b, h }, { u, slant: sl ? [0, 2, sl] : null });
  return {
    prompt: 'Work out the area of the triangle.',
    visual,
    answer: A2(ans, u),
    distractors: wrongs(ans, [b * h, sl ? (b * sl) / 2 : b + h, sl ? b * sl : 2 * (b + h), b + h + (sl || 0), ans + b, ans * 4, ans - h]).map((v) => A2(v, u)),
    typed: { kind: 'number', value: ans },
    hint: 'Use the height that is perpendicular (at right angles) to the base.',
    solution: [
      'Area of a triangle $= \\frac{1}{2} \\times \\text{base} \\times \\text{perpendicular height}$',
      `$\\frac{1}{2} \\times ${b} \\times ${h} = ${tnum(ans)}$`,
      sl ? `The ${sl} ${u} sloping side is not needed — it is not perpendicular to the base.` : 'Remember to halve: a triangle is half of a rectangle.',
      `Answer: ${A2(ans, u)}`,
    ],
  };
}, { title: 'Area of a triangle' });

export const areaParallelogram = ggen('geo-area-parallelogram', 'geo-area-basic', (rng, d) => {
  const u = pick(rng, UNITS);
  const b = d === 'easy' ? int(rng, 3, 12) : int(rng, 5, 24);
  const h = d === 'easy' ? int(rng, 2, 10) : d === 'medium' ? int(rng, 3, 16) : roundTo(int(rng, 5, 30) / 2, 1);
  const off = h * (0.4 + 0.5 * rng());
  const sl = Math.ceil(Math.hypot(off, h)) + (d === 'hard' ? int(rng, 0, 1) : 0);
  const kx = xs(b + off, h, 0.9, 2.4); const pts = [[0, 0], [b * kx, 0], [(b + off) * kx, h], [off * kx, h]];
  const W = 420; const H = 250;
  const pl = place(pts, { width: W, height: H, pad: 50 });
  const V = pts.map(pl.map);
  const F = pl.map([off * kx, 0]);
  let body = polygon(V, { fill: FILL }) + line(...V[3], ...F, { width: 1.5, dash: '5 4' }) + rightMark(F, V[3], V[1], 10);
  body += dimLabel(V[0], V[1], lab(b, u), V[2], { offset: 14 });
  const hl = lab(h, u);
  body += heightLabel(V[3], F, hl, V);
  if (d !== 'easy') body += dimLabel(V[0], V[3], lab(sl, u), V[1], { offset: 12 });
  const ans = roundTo(b * h, 4);
  return {
    prompt: 'Work out the area of the parallelogram.',
    visual: figure(W, H, body, { nda: true }),
    answer: A2(ans, u),
    distractors: wrongs(ans, [ans / 2, b * sl, (b * sl) / 2, 2 * (b + sl), b + h, ans + b]).map((v) => A2(v, u)),
    typed: { kind: 'number', value: ans },
    solution: [
      'Area of a parallelogram $= \\text{base} \\times \\text{perpendicular height}$',
      `$${tnum(b)} \\times ${tnum(h)} = ${tnum(ans)}$`,
      d !== 'easy' ? `Don't use the sloping side (${sl} ${u}) — it is not the perpendicular height. And don't halve: that is for triangles.` : 'A parallelogram can be cut and rearranged into a rectangle with the same base and height.',
      `Answer: ${A2(ans, u)}`,
    ],
  };
}, { title: 'Area of a parallelogram' });

export const areaGrid = ggen('geo-area-grid', 'geo-area-basic', (rng, d) => {
  const cols = 10; const rows = 7; const s = 28;
  const g = squareGrid(cols, rows, { s, x0: 14, y0: 14 });
  if (d === 'easy') {
    const k = int(rng, 5, 10);
    const shape = polyomino(rng, k, cols, rows);
    const pic = drawPolyomino(shape, cols, rows, s);
    return {
      prompt: 'The shape is drawn on a centimetre grid.<br>Work out the area of the shape.',
      visual: figure(pic.width, pic.height, pic.body, { maxWidth: 340 }),
      answer: A2(k), distractors: wrongs(k, [shape.perim, k + 1, k - 1, k + 2, 2 * k]).map((v) => A2(v)),
      typed: { kind: 'number', value: k },
      solution: ['Area on a centimetre grid = number of whole squares inside the shape.', `Count the squares: ${k}.`, `Answer: ${A2(k)}`],
    };
  }
  // triangle / parallelogram / trapezium with vertices on grid points
  const kind = pick(rng, d === 'medium' ? ['tri', 'para', 'tri'] : ['tri', 'para', 'trap', 'kite']);
  let pts; let formula;
  const x0 = int(rng, 1, 2); const y0 = int(rng, 1, 2);
  if (kind === 'tri') {
    const b = int(rng, 3, 7); const h = int(rng, 2, 5); const ax = int(rng, x0 - 1, x0 + b + 1);
    pts = [[x0, y0], [x0 + b, y0], [ax, y0 + h]];
    formula = [`It is a triangle with base ${b} cm and perpendicular height ${h} cm.`, `Area $= \\frac{1}{2} \\times ${b} \\times ${h} = ${tnum((b * h) / 2)}$`];
  } else if (kind === 'para') {
    const b = int(rng, 3, 5); const h = int(rng, 2, 4); const off = pick(rng, [1, 2, -1, 2]);
    pts = [[x0 + 1, y0], [x0 + 1 + b, y0], [x0 + 1 + b + off, y0 + h], [x0 + 1 + off, y0 + h]];
    formula = [`It is a parallelogram with base ${b} cm and perpendicular height ${h} cm.`, `Area $= ${b} \\times ${h} = ${b * h}$`];
  } else if (kind === 'trap') {
    const a = int(rng, 2, 4); const b = a + int(rng, 1, 4); const h = int(rng, 2, 4); const off = int(rng, 0, b - a);
    pts = [[x0, y0], [x0 + b, y0], [x0 + off + a, y0 + h], [x0 + off, y0 + h]];
    formula = [`It is a trapezium with parallel sides ${a} cm and ${b} cm, and height ${h} cm.`, `Area $= \\frac{1}{2} \\times (${a} + ${b}) \\times ${h} = ${tnum(((a + b) * h) / 2)}$`];
  } else {
    const wv = int(rng, 1, 3); const up = int(rng, 1, 2); const down = int(rng, 2, 4);
    const cx = x0 + wv + 1;
    pts = [[cx, y0], [cx + wv, y0 + down], [cx, y0 + down + up], [cx - wv, y0 + down]];
    formula = [`It is a kite. Its diagonals are ${2 * wv} cm and ${down + up} cm and cross at right angles.`, `Area $= \\frac{1}{2} \\times ${2 * wv} \\times ${down + up} = ${tnum(wv * (down + up))}$`];
  }
  if (pts.some(([x, y]) => x < 0 || x > cols || y < 0 || y > rows)) throw new Error('off grid');
  const area = Math.abs(signedArea(pts));
  const body = g.body + polygon(pts.map(g.P), { fill: FILL, fillOpacity: 0.9, width: 2.4 });
  const bbox = (Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0]))) * (Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1])));
  return {
    prompt: `The ${{ tri: 'triangle', para: 'parallelogram', trap: 'trapezium', kite: 'kite' }[kind]} is drawn on a centimetre grid.<br>Work out its area.`,
    visual: figure(g.width, g.height, body, { maxWidth: 360 }),
    answer: A2(area), distractors: wrongs(area, [bbox, area * 2, area / 2, bbox - area, area + 1, area - 1, area + 0.5]).map((v) => A2(v)),
    typed: { kind: 'number', value: area },
    solution: [...formula, `Answer: ${A2(area)}`],
  };
}, { title: 'Area on a grid' });

export const areaReverse = ggen('geo-area-reverse', 'geo-area-basic', (rng, d) => {
  const kind = pick(rng, d === 'easy' ? ['rect', 'square'] : d === 'medium' ? ['rect', 'tri', 'para'] : ['tri', 'para', 'rectPerim', 'square']);
  const u = pick(rng, ['cm', 'm']);
  const W = 400; const H = 240;
  if (kind === 'square') {
    const s = d === 'easy' ? int(rng, 2, 12) : int(rng, 6, 20);
    const askPerim = d === 'hard';
    const ans = askPerim ? 4 * s : s;
    return {
      prompt: `A square has an area of ${A2(s * s, u)}.<br>Work out the ${askPerim ? 'perimeter of the square' : 'length of one side'}.`,
      answer: L(ans, u), distractors: wrongs(ans, askPerim ? [s, s * s / 4, 2 * s, s * s, 4 * s * s / 2] : [s * s / 4, s * s / 2, 2 * s, s + 1, s - 1]).map((v) => L(v, u)),
      typed: { kind: 'number', value: ans },
      solution: [`Side × side $= ${s * s}$, so side $= \\sqrt{${s * s}} = ${s}$ ${u}.`, ...(askPerim ? [`Perimeter $= 4 \\times ${s} = ${4 * s}$ ${u}`] : []), `Answer: ${L(ans, u)}`],
    };
  }
  if (kind === 'rect' || kind === 'rectPerim') {
    const a = int(rng, 3, 14); const b = int(rng, 3, 16);
    if (a === b) throw new Error('eq');
    const ar = a * b;
    const askP = kind === 'rectPerim';
    const pts = [[0, 0], [Math.max(a, b) * 1.2, 0], [Math.max(a, b) * 1.2, Math.min(a, b) * 1.0], [0, Math.min(a, b)]];
    const pl = place(pts, { width: W, height: H, pad: 50 });
    const V = pts.map(pl.map);
    const body = polygon(V, { fill: FILL }) + edgeLabels(pts, pl.map, [lab(b, u), askP ? null : 'x', null, null]) + text(...centroid(V), `Area = ${ar} ${u}²`, { size: 14 }) + rightMark(V[0], V[1], V[3], 12);
    const ans = askP ? 2 * (a + b) : a;
    return {
      prompt: askP ? `A rectangle has area ${A2(ar, u)}. One side is ${L(b, u)}.<br>Work out the perimeter of the rectangle.` : `The rectangle has area ${A2(ar, u)}.<br>Work out the length $x$.`,
      visual: figure(W, H, body, { nda: true }),
      answer: L(ans, u), distractors: wrongs(ans, askP ? [a + b, ar / 2, 2 * b + a, 2 * ar, ar - b, 4 * a] : [ar - b, ar / 2, (ar - 2 * b) / 2, ar / 4, a + 1, a - 1].filter(Number.isInteger), { min: 0 }).map((v) => L(v, u)),
      typed: { kind: 'number', value: ans },
      solution: [`Area = length × width, so the missing side $= ${ar} \\div ${b} = ${a}$ ${u}.`, ...(askP ? [`Perimeter $= 2 \\times (${a} + ${b}) = ${ans}$ ${u}`] : []), `Answer: ${L(ans, u)}`],
    };
  }
  if (kind === 'tri') {
    const b = int(rng, 3, 16); const h = 2 * int(rng, 2, 9);
    const ar = (b * h) / 2;
    const askH = chance(rng, 0.5);
    const visualLabels = { b: askH ? b : 'x', h: askH ? 'h' : h };
    const kx = xs(b, h, 0.9, 2.2); const pts = [[0, 0], [b * kx, 0], [b * 0.4 * kx, h]];
    const pl = place(pts, { width: W, height: H, pad: 50 });
    const V = pts.map(pl.map); const F = pl.map([b * 0.4 * kx, 0]);
    let body = polygon(V, { fill: FILL }) + line(...V[2], ...F, { width: 1.5, dash: '5 4' }) + rightMark(F, V[2], V[1], 10);
    body += dimLabel(V[0], V[1], askH ? lab(b, u) : 'x', V[2], { offset: 14, italic: !askH });
    const hl = askH ? 'h' : lab(h, u);
    body += heightLabel(V[2], F, hl, V);
    void visualLabels;
    const ans = askH ? h : b; const other = askH ? b : h;
    return {
      prompt: `The area of the triangle is ${A2(ar, u)}.<br>Work out the ${askH ? 'perpendicular height $h$' : 'length of the base $x$'}.`,
      visual: figure(W, H, body, { nda: true }),
      answer: L(ans, u), distractors: wrongs(ans, [ar / other, ar - other, ar * 2 - other, ar / 2, 2 * ar * other, ans * 2].filter((v) => Number.isInteger(v * 2)), { min: 0 }).map((v) => L(v, u)),
      typed: { kind: 'number', value: ans },
      solution: [`Area $= \\frac{1}{2} \\times \\text{base} \\times \\text{height}$`, `$\\frac{1}{2} \\times ${askH ? `${b} \\times h` : `x \\times ${h}`} = ${tnum(ar)}$, so $${askH ? `${b}h` : `${h}x`} = ${tnum(2 * ar)}$`, `$${askH ? 'h' : 'x'} = ${tnum(2 * ar)} \\div ${other} = ${ans}$`, `Answer: ${L(ans, u)}`],
    };
  }
  // para: area given, base given, find height
  const b = int(rng, 4, 15); const h = int(rng, 3, 12); const ar = b * h;
  const off = h * 0.6;
  const kx = xs(b + off, h, 0.9, 2.4); const pts = [[0, 0], [b * kx, 0], [(b + off) * kx, h], [off * kx, h]];
  const pl = place(pts, { width: W, height: H, pad: 50 });
  const V = pts.map(pl.map); const F = pl.map([off * kx, 0]);
  let body = polygon(V, { fill: FILL }) + line(...V[3], ...F, { width: 1.5, dash: '5 4' }) + rightMark(F, V[3], V[1], 10);
  body += dimLabel(V[0], V[1], lab(b, u), V[2], { offset: 14 });
  body += heightLabel(V[3], F, 'h', V, { size: 15 });
  return {
    prompt: `The area of the parallelogram is ${A2(ar, u)}.<br>Work out the perpendicular height $h$.`,
    visual: figure(W, H, body, { nda: true }),
    answer: L(h, u), distractors: wrongs(h, [(2 * ar) / b, ar - b, ar / 2, h + 1, h - 1, ar / (2 * b)].filter((v) => Number.isInteger(v * 2)), { min: 0 }).map((v) => L(v, u)),
    typed: { kind: 'number', value: h },
    solution: ['Area of a parallelogram = base × perpendicular height.', `$${b} \\times h = ${ar}$, so $h = ${ar} \\div ${b} = ${h}$`, `Answer: ${L(h, u)}`],
  };
}, { title: 'Missing length from the area' });

/* ================================================================== */
/* geo-area-trapezium-compound                                         */
/* ================================================================== */

export const areaTrapezium = ggen('geo-area-trapezium', 'geo-area-trapezium-compound', (rng, d) => {
  const u = pick(rng, UNITS);
  const a = int(rng, 3, d === 'easy' ? 10 : 16); const b = a + int(rng, 2, d === 'easy' ? 8 : 12);
  const h = d === 'easy' ? 2 * int(rng, 2, 6) : int(rng, 3, 14);
  const ar = ((a + b) * h) / 2;
  const reverse = d === 'hard' && chance(rng, 0.5);
  const rightAngled = chance(rng, 0.35);
  const off = rightAngled ? 0 : (b - a) * (0.2 + 0.6 * rng());
  const flip = chance(rng, 0.5);
  const kx = xs(b, h, 1.2, 2.4);
  let pts = [[0, 0], [b, 0], [off + a, h], [off, h]].map(([x, y]) => [x * kx, y]);
  if (flip) pts = [[0, 0], [b, 0], [b - off, h], [b - off - a, h]].map(([x, y]) => [x * kx, y]);
  const W = 420; const H = 250;
  const pl = place(pts, { width: W, height: H, pad: 50 });
  const V = pts.map(pl.map);
  let body = polygon(V, { fill: FILL });
  const top = mid(V[2], V[3]);
  if (rightAngled) {
    const corner = flip ? 1 : 0;
    body += rightMark(V[corner], V[corner === 0 ? 1 : 0], V[corner === 0 ? 3 : 2], 11) + rightMark(V[corner === 0 ? 3 : 2], V[corner === 0 ? 0 : 1], V[corner === 0 ? 2 : 3], 11);
    const hl = reverse ? 'h' : lab(h, u);
    const side = corner === 0 ? [V[0], V[3]] : [V[1], V[2]];
    body += dimLabel(side[0], side[1], hl, centroid(V), { offset: 12, italic: reverse });
  } else {
    const F = [top[0], V[0][1]];
    body += line(...top, ...F, { width: 1.5, dash: '5 4' }) + rightMark(F, top, V[1], 9);
    const hl = reverse ? 'h' : lab(h, u);
    body += heightLabel(top, F, hl, V);
  }
  body += dimLabel(V[0], V[1], lab(b, u), centroid(V)) + dimLabel(V[2], V[3], lab(a, u), centroid(V));
  if (reverse) {
    return {
      prompt: `The area of the trapezium is ${A2(ar, u)}.<br>Work out the height $h$.`,
      visual: figure(W, H, body, { nda: true }),
      answer: L(h, u), distractors: wrongs(h, [ar / (a + b), (2 * ar) / b, ar / b, (2 * ar) / (b - a), h * 2, h + 1].filter((v) => Number.isInteger(v * 2)), { min: 0 }).map((v) => L(v, u)),
      typed: { kind: 'number', value: h },
      solution: [`Area $= \\frac{1}{2}(a + b)h$`, `$\\frac{1}{2}(${a} + ${b})h = ${tnum(ar)}$, so $${(a + b) / 2}h = ${tnum(ar)}$`, `$h = ${tnum(ar)} \\div ${tnum((a + b) / 2)} = ${h}$`, `Answer: ${L(h, u)}`],
    };
  }
  return {
    prompt: 'Work out the area of the trapezium.',
    visual: figure(W, H, body, { nda: true }),
    answer: A2(ar, u),
    distractors: wrongs(ar, [(a + b) * h, a * b * h / 2, b * h, a * h, ((b - a) * h) / 2, a + b + h, ar + h]).map((v) => A2(v, u)),
    typed: { kind: 'number', value: ar },
    hint: 'Area of a trapezium = ½ × (sum of the parallel sides) × height.',
    solution: [
      'Area of a trapezium $= \\frac{1}{2}(a + b)h$, where $a$ and $b$ are the parallel sides.',
      `$\\frac{1}{2} \\times (${a} + ${b}) \\times ${h} = \\frac{1}{2} \\times ${a + b} \\times ${h}$`,
      `$= ${tnum(ar)}$`,
      `Answer: ${A2(ar, u)}`,
    ],
  };
}, { title: 'Area of a trapezium' });

export const areaCompoundRect = ggen('geo-area-compound-rect', 'geo-area-trapezium-compound', (rng, d) => {
  const sh = compoundShape(rng, d, { allowDecimal: true });
  const u = pick(rng, ['cm', 'cm', 'm']);
  const ar = sh.area;
  const ds = sh.kind === 'L'
    ? [sh.W * sh.H, sh.perim, sh.W * (sh.H - sh.b) + (sh.W - sh.a) * sh.H, sh.W * sh.H - sh.a * (sh.H - sh.b), ar + sh.a, (sh.W - sh.a) * (sh.H - sh.b)]
    : [sh.W * sh.H, sh.perim, sh.W * sh.H - sh.notchW * (sh.H - sh.e), ar + sh.notchW * sh.e / 2, ar - sh.e];
  return {
    prompt: 'Work out the area of this shape.<br>All corners are right angles.',
    visual: drawCompound(sh, u),
    answer: A2(ar, u),
    distractors: wrongs(ar, ds, { min: 0 }).map((v) => A2(v, u)),
    typed: { kind: 'number', value: ar },
    hint: 'Split the shape into rectangles, or take a small rectangle away from a big one.',
    solution: sh.kind === 'L' ? [
      `Think of a big ${tnum(sh.W)} by ${tnum(sh.H)} rectangle with a corner rectangle cut out.`,
      `The cut-out is $${tnum(sh.W)} - ${tnum(sh.W - sh.a)} = ${tnum(sh.a)}$ by $${tnum(sh.H)} - ${tnum(sh.H - sh.b)} = ${tnum(sh.b)}$.`,
      `Area $= ${tnum(sh.W)} \\times ${tnum(sh.H)} - ${tnum(sh.a)} \\times ${tnum(sh.b)} = ${tnum(sh.W * sh.H)} - ${tnum(sh.a * sh.b)} = ${tnum(ar)}$`,
      `Answer: ${A2(ar, u)}`,
    ] : [
      `Think of a big ${tnum(sh.W)} by ${tnum(sh.H)} rectangle with a gap cut out of the top.`,
      `The gap is $${tnum(sh.W)} - ${tnum(sh.p1)} - ${tnum(sh.p2)} = ${tnum(sh.notchW)}$ wide and ${tnum(sh.e)} deep.`,
      `Area $= ${tnum(sh.W)} \\times ${tnum(sh.H)} - ${tnum(sh.notchW)} \\times ${tnum(sh.e)} = ${tnum(ar)}$`,
      `Answer: ${A2(ar, u)}`,
    ],
  };
}, { title: 'Area of compound rectilinear shapes' });

const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25], [15, 20, 25], [20, 21, 29], [12, 5, 13], [16, 30, 34]];

export const areaCompoundTri = ggen('geo-area-compound-tri', 'geo-area-trapezium-compound', (rng, d) => {
  const mode = d === 'easy' ? 'house' : d === 'medium' ? pick(rng, ['house', 'arrow']) : pick(rng, ['rightTop', 'arrow', 'rightTop']);
  const u = pick(rng, ['cm', 'm']);
  const W = 420; const H = 280;
  if (mode === 'house') {
    const w = 2 * int(rng, 3, 9); const hr = int(rng, 3, 12); const ht = int(rng, 2, 8);
    const pts = [[0, 0], [w, 0], [w, hr], [w / 2, hr + ht], [0, hr]];
    const pl = place(pts, { width: W, height: H, pad: 50 });
    const V = pts.map(pl.map);
    let body = polygon(V, { fill: FILL }) + line(...V[4], ...V[2], { width: 1.4, dash: '5 4' });
    const apexFoot = pl.map([w / 2, hr]);
    body += line(...V[3], ...apexFoot, { width: 1.4, dash: '3 3', color: MUTED });
    body += dimLabel(V[0], V[1], lab(w, u), centroid(V)) + dimLabel(V[0], V[4], lab(hr, u), centroid(V));
    body += heightLabel(V[3], apexFoot, lab(ht, u), [V[4], V[2], V[3]], { size: 13 });
    body += rightMark(V[0], V[1], V[4], 11) + rightMark(V[1], V[2], V[0], 11);
    const ar = w * hr + (w * ht) / 2;
    return {
      prompt: 'The shape is made from a rectangle and a triangle.<br>Work out the area of the shape.',
      visual: figure(W, H, body, { nda: true }),
      answer: A2(ar, u), distractors: wrongs(ar, [w * hr + w * ht, w * (hr + ht), w * hr, (w * (hr + ht)) / 2, w * hr - (w * ht) / 2, ar + w]).map((v) => A2(v, u)),
      typed: { kind: 'number', value: ar },
      solution: [`Rectangle: $${w} \\times ${hr} = ${w * hr}$`, `Triangle: $\\frac{1}{2} \\times ${w} \\times ${ht} = ${tnum((w * ht) / 2)}$`, `Total: $${w * hr} + ${tnum((w * ht) / 2)} = ${tnum(ar)}$`, `Answer: ${A2(ar, u)}`],
    };
  }
  if (mode === 'arrow') {
    // rectangle (shaft) + triangle (head) pointing right
    const sl = int(rng, 4, 14); const sw = int(rng, 2, 6); const hw = sw + 2 * int(rng, 1, 4); const hl = int(rng, 3, 8);
    const pts = [[0, (hw - sw) / 2], [sl, (hw - sw) / 2], [sl, 0], [sl + hl, hw / 2], [sl, hw], [sl, (hw + sw) / 2], [0, (hw + sw) / 2]];
    const pl = place(pts, { width: W, height: H - 30, pad: 50 });
    const V = pts.map(pl.map);
    let body = polygon(V, { fill: FILL }) + line(...V[1], ...V[5], { width: 1.4, dash: '5 4' });
    body += dimLabel(V[0], V[1], lab(sl, u), centroid(V)) + dimLabel(V[6], V[0], lab(sw, u), centroid(V));
    body += dimLabel(V[2], V[4], '', centroid(V));
    const xh = V[2][0] - 14;
    body += text(xh - textWidth(lab(hw, u), 13) / 2, (V[2][1] + V[4][1]) / 2 - 0, '', {});
    // head height label to the right of the head base (outside) — put it on the far side of the dashed line
    body += line(V[2][0], V[2][1], V[4][0], V[4][1], { width: 0 });
    body += text(V[2][0] - 10, V[2][1] - 12, lab(hw, u) + ' (height of head)', { size: 12, anchor: 'end' });
    body += dimLabel(V[2], [V[3][0], V[2][1]], lab(hl, u), V[3], { offset: 10 });
    body += line(V[3][0], V[2][1], V[3][0], V[3][1], { width: 1, dash: '3 3', color: MUTED }) + line(V[2][0], V[2][1], V[3][0], V[2][1], { width: 1, dash: '3 3', color: MUTED });
    const ar = sl * sw + (hw * hl) / 2;
    return {
      prompt: `An arrow is made from a rectangle and a triangle.<br>The rectangle is ${lab(sl, u)} by ${lab(sw, u)}. The triangle has base ${lab(hw, u)} and perpendicular height ${lab(hl, u)}.<br>Work out the area of the arrow.`,
      visual: figure(W, H - 30, body, { nda: true }),
      answer: A2(ar, u), distractors: wrongs(ar, [sl * sw + hw * hl, (sl + hl) * hw, sl * sw, sl * sw + (sw * hl) / 2, ar + sw, (sl + hl) * sw]).map((v) => A2(v, u)),
      typed: { kind: 'number', value: ar },
      solution: [`Rectangle: $${sl} \\times ${sw} = ${sl * sw}$`, `Triangle: $\\frac{1}{2} \\times ${hw} \\times ${hl} = ${tnum((hw * hl) / 2)}$`, `Total: $${sl * sw} + ${tnum((hw * hl) / 2)} = ${tnum(ar)}$`, `Answer: ${A2(ar, u)}`],
    };
  }
  // rightTop: right-angled triangle (legs p, q, hypotenuse c) sitting on the top of a c × h rectangle
  const [p0, q0, c0] = pick(rng, TRIPLES); const k = pick(rng, [1, 1, 2]);
  const p = p0 * k; const q = q0 * k; const c = c0 * k; const h = int(rng, Math.ceil(c * 0.6), Math.ceil(c * 1.1));
  const ang = Math.atan2(q, p);
  const apex = [p * Math.cos(ang) * (p / c) * 0 + (p * p) / c, (p * q) / c];
  const pts = [[0, 0], [c, 0], [c, h], [apex[0], h + apex[1]], [0, h]];
  // with hypotenuse along the top edge from (0,h) to (c,h): right angle at apex
  pts[3] = [(p * p) / c, h + (p * q) / c];
  const pl = place(pts, { width: W, height: H + 20, pad: 46 });
  const V = pts.map(pl.map);
  let body = polygon(V, { fill: FILL }) + line(...V[4], ...V[2], { width: 1.4, dash: '5 4' }) + rightMark(V[3], V[4], V[2], 10);
  body += dimLabel(V[4], V[3], lab(p, u), centroid(V)) + dimLabel(V[3], V[2], lab(q, u), centroid(V)) + dimLabel(V[0], V[4], lab(h, u), centroid(V));
  body += rightMark(V[0], V[1], V[4], 10) + rightMark(V[1], V[2], V[0], 10);
  const ar = c * h + (p * q) / 2;
  return {
    prompt: `A shape is made by joining a right-angled triangle to a rectangle.<br>Work out the area of the shape.`,
    visual: figure(W, H + 20, body, { nda: true }),
    answer: A2(ar, u), distractors: wrongs(ar, [c * h + p * q, (p + q) * h + (p * q) / 2, p * h + (p * q) / 2, q * h + (p * q) / 2, c * h, ar + c]).map((v) => A2(v, u)),
    typed: { kind: 'number', value: ar },
    solution: [
      `The width of the rectangle is the hypotenuse of the triangle. [[trig-pythagoras|Pythagoras]]: $\\sqrt{${p}^2 + ${q}^2} = \\sqrt{${p * p + q * q}} = ${c}$`,
      `Rectangle: $${c} \\times ${h} = ${c * h}$`,
      `Triangle: $\\frac{1}{2} \\times ${p} \\times ${q} = ${tnum((p * q) / 2)}$ (the two shorter sides are perpendicular)`,
      `Total: $${c * h} + ${tnum((p * q) / 2)} = ${tnum(ar)}$`,
      `Answer: ${A2(ar, u)}`,
    ],
  };
}, { title: 'Compound shapes with triangles', learn: ['geo-area-trapezium-compound', 'trig-pythagoras'] });

const SHADED_CONTEXTS = [
  { outer: 'garden', inner: 'pond', triName: 'flower bed', verb: 'The rest of the garden is grass.', u: 'm', Wo: [8, 20], Ho: [6, 14], wi: [2, 5], hi: [2, 4], tri: true, cost: { prices: [3, 4, 5, 6, 8], what: 'Turf for the grass costs' } },
  { outer: 'picture frame', inner: 'picture', verb: 'The frame is the shaded border around the picture.', u: 'cm', frame: true, Wo: [20, 50], Ho: [15, 40], border: [2, 6] },
  { outer: 'floor', inner: 'rug', verb: 'The rug covers part of the floor.', u: 'm', Wo: [4, 9], Ho: [3, 7], wi: [2, 3], hi: [1, 2], cost: { prices: [8, 12, 15, 20, 25], what: 'Varnishing the uncovered floor costs' } },
  { outer: 'wall', inner: 'window', verb: 'The window is not painted.', u: 'm', Wo: [4, 9], Ho: [3, 4], wi: [1, 3], hi: [1, 2], cost: { prices: [2, 3, 4, 5], what: 'Painting the wall costs' } },
  { outer: 'sheet of card', inner: 'hole', triName: 'triangular hole', verb: 'A hole is cut out of the card.', u: 'cm', Wo: [20, 40], Ho: [15, 30], wi: [5, 14], hi: [4, 10], tri: true },
  { outer: 'field', inner: 'barn', verb: 'A barn stands in the field.', u: 'm', Wo: [40, 90], Ho: [30, 70], wi: [10, 25], hi: [8, 20], step: 5 },
];

export const areaShaded = ggen('geo-area-shaded', 'geo-area-trapezium-compound', (rng, d) => {
  const ctx = pick(rng, SHADED_CONTEXTS);
  const u = ctx.u;
  const st = ctx.step || 1;
  const rnd = ([lo, hi]) => st * int(rng, Math.ceil(lo / st), Math.floor(hi / st));
  const Wo = rnd(ctx.Wo); const Ho = Math.min(rnd(ctx.Ho), Wo);
  const innerTri = d === 'hard' && Boolean(ctx.tri) && chance(rng, 0.5);
  let wi; let hi; let ox; let oy;
  if (ctx.frame) {
    const b = int(rng, ctx.border[0], ctx.border[1]);
    wi = Wo - 2 * b; hi = Ho - 2 * b; ox = b; oy = b;
    if (hi < 4) throw new Error('thin frame');
  } else {
    wi = Math.min(rnd(ctx.wi), Wo - 2 * st); hi = Math.min(rnd(ctx.hi), Ho - 2 * st);
    ox = st * int(rng, 1, Math.max(1, Math.floor((Wo - wi) / st) - 1)); oy = st * int(rng, 1, Math.max(1, Math.floor((Ho - hi) / st) - 1));
    if (ox + wi >= Wo || oy + hi >= Ho) throw new Error('inner too big');
  }
  const W = 420; const H = 270;
  // drawing: inner shape drawn at least a third of the outer size so its labels fit (not to scale)
  const sx = Math.max(1, (Wo / 3) / wi); const sy = Math.max(1, (Ho / 3) / hi);
  const dw = Math.min(wi * sx, Wo * 0.7); const dh = Math.min(hi * sy, Ho * 0.7);
  const dox = ctx.frame ? (Wo - dw) / 2 : Math.min(Math.max(ox, Wo * 0.08), Wo - dw - Wo * 0.08);
  const doy = ctx.frame ? (Ho - dh) / 2 : Math.min(Math.max(oy, Ho * 0.08), Ho - dh - Ho * 0.08);
  const pts = [[0, 0], [Wo, 0], [Wo, Ho], [0, Ho]];
  const pl = place(pts, { width: W, height: H, pad: 50 });
  const V = pts.map(pl.map);
  const inner = innerTri ? [[dox, doy], [dox + dw, doy], [dox, doy + dh]] : [[dox, doy], [dox + dw, doy], [dox + dw, doy + dh], [dox, doy + dh]];
  const I = inner.map(pl.map);
  let body = polygon(V, { fill: SHADE }) + polygon(I, { fill: 'var(--surface, #fff)' });
  body += dimLabel(V[0], V[1], lab(Wo, u), centroid(V)) + dimLabel(V[1], V[2], lab(Ho, u), centroid(V));
  const inward = (P, Q) => { const m = mid(P, Q); const c = centroid(I); return [2 * m[0] - c[0], 2 * m[1] - c[1]]; };
  body += dimLabel(I[0], I[1], lab(wi, u), inward(I[0], I[1]), { size: 13, offset: 10 });
  body += dimLabel(I[innerTri ? 2 : 3], I[0], lab(hi, u), inward(I[innerTri ? 2 : 3], I[0]), { size: 13, offset: 10 });
  if (innerTri) body += rightMark(I[0], I[1], I[2], 9);
  const innerA = innerTri ? (wi * hi) / 2 : wi * hi;
  const ar = Wo * Ho - innerA;
  const costMode = d !== 'easy' && Boolean(ctx.cost) && chance(rng, 0.55);
  const name = innerTri ? (ctx.triName.startsWith('triangular') ? ctx.triName : `triangular ${ctx.triName}`) : ctx.inner;
  if (costMode) {
    const price = pick(rng, ctx.cost.prices);
    const cost = ar * price;
    return {
      prompt: `The diagram shows a rectangular ${ctx.outer} with a ${name}. ${ctx.verb}<br>${ctx.cost.what} £${price} per ${u}².<br>Work out the total cost for the shaded part.`,
      visual: figure(W, H, body, { nda: true }),
      answer: `£${num(cost, Number.isInteger(cost) ? 0 : 2)}`,
      distractors: wrongs(cost, [Wo * Ho * price, innerA * price, (Wo * Ho + innerA) * price, ar, 2 * (Wo + Ho) * price, cost + price]).map((v) => `£${num(v, Number.isInteger(v) ? 0 : 2)}`),
      typed: { kind: 'number', value: cost },
      solution: [`Shaded area = big rectangle − ${name}.`, `$${Wo} \\times ${Ho} - ${innerTri ? `\\frac{1}{2} \\times ${wi} \\times ${hi}` : `${wi} \\times ${hi}`} = ${Wo * Ho} - ${tnum(innerA)} = ${tnum(ar)}$ ${u}²`, `Cost: $${tnum(ar)} \\times ${price} = ${tnum(cost)}$`, `Answer: £${num(cost, Number.isInteger(cost) ? 0 : 2)}`],
    };
  }
  return {
    prompt: `The diagram shows a rectangular ${ctx.outer} with a ${name} (unshaded). ${ctx.verb}<br>Work out the area of the shaded part.`,
    visual: figure(W, H, body, { nda: true }),
    answer: A2(ar, u),
    distractors: wrongs(ar, [Wo * Ho, Wo * Ho + innerA, (Wo - wi) * (Ho - hi), innerTri ? Wo * Ho - wi * hi : Wo * Ho - innerA / 2, 2 * (Wo + Ho), ar + wi]).map((v) => A2(v, u)),
    typed: { kind: 'number', value: ar },
    solution: [`Shaded area = area of the ${ctx.outer} − area of the ${name}.`, `$${Wo} \\times ${Ho} = ${Wo * Ho}$ and ${innerTri ? `$\\frac{1}{2} \\times ${wi} \\times ${hi}` : `$${wi} \\times ${hi}`} = ${tnum(innerA)}$`, `$${Wo * Ho} - ${tnum(innerA)} = ${tnum(ar)}$`, `Answer: ${A2(ar, u)}`],
  };
}, { title: 'Shaded areas' });

/* ================================================================== */
/* geo-circles                                                         */
/* ================================================================== */

export function circleFig(r, label, { mode = 'radius', W = 300, H = 250, fill = FILL, ang = null } = {}) {
  const c = [W / 2, H / 2]; const R = 95;
  let body = circle(...c, R, { fill, width: 2 }) + dot(...c, 3);
  const a = ang ?? 20;
  // label sits on the "upper" side of the line (screen normal pointing up)
  const E1 = polar(c, R, a); const E2 = mode === 'radius' ? c : polar(c, R, a + 180);
  body += line(...E2, ...E1, { width: 2 });
  const M = mode === 'radius' ? mid(c, E1) : polar(c, R * 0.5, a);
  const below = polar(M, 20, a - 90)[1] > M[1] ? polar(M, 20, a - 90) : polar(M, 20, a + 90);
  body += dimLabel(M === c ? c : add(M, scale(sub(E1, M), -0.3)), add(M, scale(sub(E1, M), 0.3)), label, below, { offset: 10, size: 15 });
  return figure(W, H, body, { nda: true });
}

const PI_NOTE = 'Use $\\pi$ on your calculator (or 3.142).';

export const circleCircumference = ggen('geo-circle-circumference', 'geo-circles', (rng, d) => {
  const exact = d === 'easy' ? chance(rng, 0.3) : chance(rng, d === 'medium' ? 0.4 : 0.35);
  const useD = chance(rng, 0.5);
  const r = d === 'hard' ? roundTo(int(rng, 21, 120) / 10, 1) : int(rng, 2, 15);
  const dd = roundTo(2 * r, 1);
  const u = pick(rng, ['cm', 'cm', 'm', 'mm']);
  const visual = circleFig(r, lab(useD ? dd : r, u), { mode: useD ? 'diameter' : 'radius', ang: int(rng, -30, 40) });
  const given = `The ${useD ? 'diameter' : 'radius'} of the circle is ${L(useD ? dd : r, u)}.`;
  const sol0 = 'Circumference $= \\pi d = 2\\pi r$';
  if (exact && Number.isInteger(dd)) {
    return {
      prompt: `${given}<br>Work out the circumference. Give your answer in terms of $\\pi$.`,
      visual,
      answer: piAns(dd, u),
      distractors: [piAns(r, u), piAns(2 * dd, u), piAns(roundTo(r * r, 2), u), piAns(dd * dd, u), piAns(dd + 2, u), piAns(roundTo(r * r / 2, 2), u)],
      typed: typedPi(dd),
      solution: [sol0, useD ? `$d = ${tnum(dd)}$, so $C = ${tnum(dd)}\\pi$` : `$r = ${tnum(r)}$, so $d = ${tnum(dd)}$ and $C = ${tnum(dd)}\\pi$`, `Answer: ${piAns(dd, u)}`],
    };
  }
  const C = Math.PI * dd;
  return {
    prompt: `${given}<br>Work out the circumference. Give your answer to 1 decimal place.`,
    visual,
    answer: dp1(C, u),
    distractors: [Math.PI * r, Math.PI * dd * 2, Math.PI * r * r, Math.PI * dd * dd, 3 * dd, C + 1].map((v) => dp1(v, u)),
    typed: typed1(C),
    calculator: true,
    solution: [sol0, `$C = \\pi \\times ${tnum(dd)} = ${tnum(roundTo(C, 3))}\\ldots$`, useD ? 'Use the diameter directly — no need to double.' : `Remember $d = 2r = ${tnum(dd)}$.`, `Answer: ${dp1(C, u)}`],
  };
}, { title: 'Circumference of a circle' });

export const circleArea = ggen('geo-circle-area', 'geo-circles', (rng, d) => {
  const exact = chance(rng, d === 'easy' ? 0.3 : 0.4);
  const useD = chance(rng, d === 'easy' ? 0.3 : 0.5);
  const r = d === 'hard' ? roundTo(int(rng, 21, 120) / 10, 1) : int(rng, 2, 15);
  const dd = roundTo(2 * r, 1);
  const u = pick(rng, ['cm', 'cm', 'm', 'mm']);
  const visual = circleFig(r, lab(useD ? dd : r, u), { mode: useD ? 'diameter' : 'radius', ang: int(rng, -30, 40) });
  const given = `The ${useD ? 'diameter' : 'radius'} of the circle is ${L(useD ? dd : r, u)}.`;
  if (exact && Number.isInteger(r * r)) {
    const k = r * r;
    return {
      prompt: `${given}<br>Work out the area of the circle. Give your answer in terms of $\\pi$.`,
      visual,
      answer: piAns(k, u + '²'),
      distractors: [piAns(dd, u + '²'), piAns(dd * dd, u + '²'), piAns(2 * k, u + '²'), piAns(r, u + '²'), piAns(roundTo(k / 2, 2), u + '²'), piAns(2 * r * r * 2, u + '²')],
      typed: typedPi(k),
      solution: ['Area $= \\pi r^2$', useD ? `The radius is half the diameter: $r = ${tnum(dd)} \\div 2 = ${tnum(r)}$` : `$r = ${tnum(r)}$`, `$A = \\pi \\times ${tnum(r)}^2 = ${tnum(k)}\\pi$`, `Answer: ${piAns(k, u + '²')}`],
    };
  }
  const Ar = Math.PI * r * r;
  return {
    prompt: `${given}<br>Work out the area of the circle. Give your answer to 1 decimal place.`,
    visual,
    answer: dp1(Ar, u + '²'),
    distractors: [Math.PI * dd * dd, Math.PI * dd, 2 * Math.PI * r, (Math.PI * r) ** 2, Math.PI * r * r * 2, Ar / 2].map((v) => dp1(v, u + '²')),
    typed: typed1(Ar),
    calculator: true,
    solution: ['Area $= \\pi r^2$', useD ? `Halve the diameter first: $r = ${tnum(r)}$. (Using $d$ instead of $r$ makes the answer 4 times too big.)` : `$r = ${tnum(r)}$`, `$A = \\pi \\times ${tnum(r)}^2 = ${tnum(roundTo(Ar, 3))}\\ldots$`, `Answer: ${dp1(Ar, u + '²')}`],
  };
}, { title: 'Area of a circle' });

export const circlePart = ggen('geo-circle-semicircle', 'geo-circles', (rng, d) => {
  const frac4 = d === 'hard' && chance(rng, 0.5) ? 4 : 2; // semicircle or quarter circle
  const askArea = chance(rng, 0.5);
  const r = d === 'easy' ? 2 * int(rng, 1, 6) : int(rng, 2, 14);
  const u = pick(rng, ['cm', 'm']);
  const exact = d !== 'hard' && chance(rng, 0.5);
  const W = 360; const H = 230;
  let body; let given;
  if (frac4 === 2) {
    const c = [W / 2, H - 50]; const R = 130;
    body = path(`M ${c[0] - R} ${c[1]} A ${R} ${R} 0 0 1 ${c[0] + R} ${c[1]} Z`, { fill: FILL, width: 2 });
    const useD = chance(rng, 0.5);
    body += text(c[0], c[1] + 16, useD ? lab(2 * r, u) : '', { size: 14 });
    if (!useD) { const E = polar(c, R, 55); body += line(...c, ...E, { width: 2 }) + dot(...c, 3) + dimLabel(c, E, lab(r, u), polar(c, 40, 0), { offset: 10, size: 14 }); }
    given = useD ? `diameter ${L(2 * r, u)}` : `radius ${L(r, u)}`;
  } else {
    const c = [W / 2 - 80, H - 40]; const R = 160;
    body = path(`M ${c[0]} ${c[1]} L ${c[0] + R} ${c[1]} A ${R} ${R} 0 0 0 ${c[0]} ${c[1] - R} Z`, { fill: FILL, width: 2 }) + rightMark(c, [c[0] + 1, c[1]], [c[0], c[1] - 1], 12);
    body += text(c[0] + R / 2, c[1] + 16, lab(r, u), { size: 14 });
    given = `radius ${L(r, u)}`;
  }
  const shape = frac4 === 2 ? 'semicircle' : 'quarter circle';
  const visual = figure(W, H, body, { nda: true });
  if (askArea) {
    const k = (r * r) / frac4;
    if (exact) {
      return {
        prompt: `The diagram shows a ${shape} with ${given}.<br>Work out its area. Give your answer in terms of $\\pi$.`,
        visual,
        answer: piAns(k, u + '²'),
        distractors: [piAns(r * r, u + '²'), piAns(r * 2 / frac4 * 2, u + '²'), piAns(4 * r * r / frac4, u + '²'), piAns(r / frac4 * 2, u + '²'), piAns(roundTo(k / 2, 2), u + '²'), piAns(k * 2 + 1, u + '²')],
        typed: typedPi(k),
        solution: [`Area of a full circle $= \\pi r^2 = \\pi \\times ${r}^2 = ${r * r}\\pi$`, `A ${shape} is $\\frac{1}{${frac4}}$ of the circle: $${r * r}\\pi \\div ${frac4} = ${tnum(k)}\\pi$`, `Answer: ${piAns(k, u + '²')}`],
      };
    }
    const Ar = (Math.PI * r * r) / frac4;
    return {
      prompt: `The diagram shows a ${shape} with ${given}.<br>Work out its area. Give your answer to 1 decimal place.`,
      visual,
      answer: dp1(Ar, u + '²'),
      distractors: [Math.PI * r * r, (Math.PI * 4 * r * r) / frac4, (Math.PI * 2 * r) / frac4, Ar / 2, Ar + r].map((v) => dp1(v, u + '²')),
      typed: typed1(Ar), calculator: true,
      solution: [`Full circle: $\\pi \\times ${r}^2 = ${tnum(roundTo(Math.PI * r * r, 3))}\\ldots$`, `${shape.charAt(0).toUpperCase() + shape.slice(1)}: divide by ${frac4}: $${tnum(roundTo(Ar, 3))}\\ldots$`, `Answer: ${dp1(Ar, u + '²')}`],
    };
  }
  // perimeter: curved part + straight edges
  const curveK = (2 * r) / frac4; // multiple of pi
  const straight = frac4 === 2 ? 2 * r : 2 * r;
  if (exact) {
    const ans = `$${piT(curveK)} + ${straight}$ ${u}`;
    return {
      prompt: `The diagram shows a ${shape} with ${given}.<br>Work out its perimeter. Give your answer in terms of $\\pi$.`,
      visual,
      answer: ans,
      distractors: [`$${piT(curveK)}$ ${u}`, `$${piT(2 * r)} + ${straight}$ ${u}`, `$${piT(2 * curveK)} + ${straight}$ ${u}`, `$${piT(curveK)} + ${r}$ ${u}`, `$${piT(roundTo((r * r) / frac4, 2))} + ${straight}$ ${u}`],
      typed: { kind: 'text', accept: [`${curveK}π+${straight}`, `${straight}+${curveK}π`, `${curveK}pi+${straight}`] },
      solution: [`Curved edge: $\\frac{1}{${frac4}}$ of the circumference $= \\frac{1}{${frac4}} \\times 2\\pi \\times ${r} = ${piT(curveK)}$`, frac4 === 2 ? `Straight edge: the diameter, $${2 * r}$ ${u}` : `Straight edges: two radii, $2 \\times ${r} = ${2 * r}$ ${u}`, `Perimeter $= ${piT(curveK)} + ${straight}$`, `Answer: ${ans}`],
    };
  }
  const P = Math.PI * curveK + straight;
  return {
    prompt: `The diagram shows a ${shape} with ${given}.<br>Work out its perimeter. Give your answer to 1 decimal place.`,
    visual,
    answer: dp1(P, u),
    distractors: [Math.PI * curveK, Math.PI * 2 * r + straight, Math.PI * curveK + r, (Math.PI * r * r) / frac4 + straight, P + r].map((v) => dp1(v, u)),
    typed: typed1(P), calculator: true,
    solution: [`Curved edge: $\\frac{1}{${frac4}} \\times 2 \\times \\pi \\times ${r} = ${tnum(roundTo(Math.PI * curveK, 3))}\\ldots$`, `Add the straight edge${frac4 === 4 ? 's (two radii)' : ' (the diameter)'}: $+ ${straight}$. Don't forget it!`, `Perimeter $= ${tnum(roundTo(P, 3))}\\ldots$`, `Answer: ${dp1(P, u)}`],
  };
}, { title: 'Semicircles and quarter circles' });

export const circleReverse = ggen('geo-circle-reverse', 'geo-circles', (rng, d) => {
  const fromArea = d === 'easy' ? false : chance(rng, 0.5);
  const exact = d !== 'hard';
  const r = int(rng, 2, 15);
  const u = pick(rng, ['cm', 'm']);
  const askD = chance(rng, 0.4);
  const ans = askD ? 2 * r : r;
  const what = askD ? 'diameter' : 'radius';
  if (exact) {
    const given = fromArea ? `$${r * r}\\pi$ ${u}²` : `$${2 * r}\\pi$ ${u}`;
    return {
      prompt: `A circle has ${fromArea ? 'area' : 'circumference'} ${given}.<br>Work out the ${what} of the circle.`,
      answer: L(ans, u),
      distractors: wrongs(ans, fromArea ? [r * r, (r * r) / 2, askD ? r : 2 * r, r * r * 2, Math.sqrt(r * r * 2)] : [2 * r * (askD ? 0.5 : 2), r * 4, askD ? r : 2 * r, r + 1, Math.sqrt(2 * r)], { min: 0 }).filter((v) => Number.isInteger(v)).map((v) => L(v, u)),
      typed: { kind: 'number', value: ans },
      solution: fromArea ? [`$\\pi r^2 = ${r * r}\\pi$, so $r^2 = ${r * r}$`, `$r = \\sqrt{${r * r}} = ${r}$${askD ? `, so the diameter is $2 \\times ${r} = ${2 * r}$` : ''}`, `Answer: ${L(ans, u)}`]
        : [`$\\pi d = ${2 * r}\\pi$, so $d = ${2 * r}$`, askD ? 'That is the diameter.' : `$r = ${2 * r} \\div 2 = ${r}$`, `Answer: ${L(ans, u)}`],
    };
  }
  const rr = roundTo(int(rng, 25, 150) / 10, 1);
  const val = fromArea ? roundTo(Math.PI * rr * rr, 1) : roundTo(2 * Math.PI * rr, 1);
  const trueR = fromArea ? Math.sqrt(val / Math.PI) : val / (2 * Math.PI);
  const a = askD ? 2 * trueR : trueR;
  return {
    prompt: `A circle has ${fromArea ? 'area' : 'circumference'} ${fromArea ? A2(val, u) : L(val, u)}.<br>Work out the ${what} of the circle. Give your answer to 1 decimal place.`,
    answer: dp1(a, u),
    distractors: (fromArea ? [val / Math.PI, Math.sqrt(val) , askD ? trueR : 2 * trueR, val / (2 * Math.PI), Math.sqrt(val / (2 * Math.PI))] : [val / Math.PI * (askD ? 0.5 : 1), val / Math.PI * (askD ? 1 : 2) / (askD ? 0.5 : 1), Math.sqrt(val / Math.PI), askD ? trueR : 2 * trueR, val / 3]).map((v) => dp1(v, u)),
    typed: typed1(a), calculator: true,
    solution: fromArea ? [`$\\pi r^2 = ${tnum(val)}$, so $r^2 = ${tnum(val)} \\div \\pi = ${tnum(roundTo(val / Math.PI, 3))}\\ldots$`, `$r = \\sqrt{${tnum(roundTo(val / Math.PI, 3))}\\ldots} = ${tnum(roundTo(trueR, 3))}\\ldots$${askD ? `, so $d = ${tnum(roundTo(2 * trueR, 3))}\\ldots$` : ''}`, `Answer: ${dp1(a, u)}`]
      : [`$\\pi d = ${tnum(val)}$, so $d = ${tnum(val)} \\div \\pi = ${tnum(roundTo(val / Math.PI, 3))}\\ldots$`, askD ? 'That is the diameter.' : `$r = d \\div 2 = ${tnum(roundTo(trueR, 3))}\\ldots$`, `Answer: ${dp1(a, u)}`],
  };
}, { title: 'Radius or diameter from circumference or area' });

const CIRCLE_PARTS = ['Radius', 'Diameter', 'Chord', 'Tangent', 'Arc', 'Sector', 'Segment', 'Circumference'];
const PART_DEF = {
  Radius: 'a line from the centre to the circumference',
  Diameter: 'a straight line across the circle through the centre',
  Chord: 'a straight line joining two points on the circumference (not through the centre)',
  Tangent: 'a straight line outside the circle that touches it at exactly one point',
  Arc: 'part of the circumference',
  Sector: 'a "pizza slice" region between two radii and an arc',
  Segment: 'the region between a chord and an arc',
  Circumference: 'the whole distance around the circle',
};

export const circleParts = ggen('geo-circle-parts', 'geo-circles', (rng, d) => {
  const pool = d === 'easy' ? ['Radius', 'Diameter', 'Chord', 'Circumference', 'Tangent'] : d === 'hard' ? ['Chord', 'Tangent', 'Arc', 'Sector', 'Segment'] : CIRCLE_PARTS;
  const want = pick(rng, pool);
  const W = 300; const H = 260; const c = [150, 130]; const R = 95;
  const a0 = int(rng, 0, 359);
  let body = circle(...c, R, { fill: 'none', width: 2 }) + dot(...c, 3.5) + text(c[0] - 10, c[1] + 12, 'O', { size: 13, italic: true });
  const hl = { color: ACCENT, width: 3.5 };
  const P1 = polar(c, R, a0); const P2 = polar(c, R, a0 + int(rng, 70, 130));
  const arcD = (A, B, big = 0) => `M ${A[0]} ${A[1]} A ${R} ${R} 0 ${big} 0 ${B[0]} ${B[1]}`;
  if (want === 'Radius') body += line(...c, ...P1, hl);
  else if (want === 'Diameter') body += line(...polar(c, R, a0 + 180), ...P1, hl);
  else if (want === 'Chord') body += line(...P1, ...P2, hl);
  else if (want === 'Tangent') { const T = P1; const u = [-Math.sin((a0 * Math.PI) / 180), -Math.cos((a0 * Math.PI) / 180)]; body += line(...add(T, scale(u, 90)), ...add(T, scale(u, -90)), hl) + dot(...T, 3); } else if (want === 'Arc') body += path(arcD(P1, P2), hl);
  else if (want === 'Circumference') body += circle(...c, R, hl);
  else if (want === 'Sector') body = path(`M ${c[0]} ${c[1]} L ${P1[0]} ${P1[1]} ${arcD(P1, P2).replace(/^M [^A]*/, '')} Z`, { fill: ACCENT, width: 2 }).replace('fill="var(--d-accent, #2f5bd3)"', 'fill="var(--d-accent, #2f5bd3)" fill-opacity="0.45"') + body;
  else body = path(`M ${P1[0]} ${P1[1]} ${arcD(P1, P2).replace(/^M [^A]*/, '')} Z`, { fill: ACCENT, width: 2 }).replace('fill="var(--d-accent, #2f5bd3)"', 'fill="var(--d-accent, #2f5bd3)" fill-opacity="0.45"') + body;
  const shaded = want === 'Sector' || want === 'Segment';
  return {
    prompt: `$O$ is the centre of the circle.<br>What is the name of the ${shaded ? 'shaded region' : 'part drawn in colour'}?`,
    visual: figure(W, H, body),
    answer: want,
    distractors: shuffle(rng, CIRCLE_PARTS.filter((p) => p !== want)).sort((p) => (shaded === (p === 'Sector' || p === 'Segment') ? -1 : 1)),
    count: 4,
    solution: [`A ${want.toLowerCase()} is ${PART_DEF[want]}.`, want === 'Chord' ? 'It does not pass through the centre, so it is not a diameter.' : want === 'Segment' ? 'It is cut off by a chord — a sector would be cut off by two radii.' : want === 'Sector' ? 'It is bounded by two radii — a segment would be cut off by a chord.' : `So the highlighted part is the ${want.toLowerCase()}.`, `Answer: ${want}`],
  };
}, { title: 'Parts of a circle' });

export const circleCompound = ggen('geo-circle-compound', 'geo-circles', (rng, d) => {
  const mode = pick(rng, d === 'easy' ? ['squareCircle', 'track'] : ['track', 'squareCircle', 'window', 'ring']);
  const u = mode === 'track' ? 'm' : 'cm';
  const W = 420; const H = 240;
  if (mode === 'track') {
    const D = 2 * int(rng, 10, 40); const Ls = 5 * int(rng, 10, 30);
    const askArea = d === 'hard' && chance(rng, 0.5);
    const Dd = Math.max(D, Ls / 2.2); const k = Math.min(250 / (Ls + Dd), 130 / Dd);
    const x0 = (W - Ls * k) / 2; const y0 = (H - Dd * k) / 2 + 8; const R = (Dd * k) / 2;
    let body = path(`M ${x0} ${y0} L ${x0 + Ls * k} ${y0} A ${R} ${R} 0 0 1 ${x0 + Ls * k} ${y0 + 2 * R} L ${x0} ${y0 + 2 * R} A ${R} ${R} 0 0 1 ${x0} ${y0} Z`, { fill: FILL, width: 2 });
    body += line(x0, y0, x0, y0 + 2 * R, { width: 1.2, dash: '4 4' }) + line(x0 + Ls * k, y0, x0 + Ls * k, y0 + 2 * R, { width: 1.2, dash: '4 4' });
    body += text(x0 + (Ls * k) / 2, y0 - 12, lab(Ls, u), { size: 14 }) + text(x0 + 6 + textWidth(lab(D, u), 13) / 2, y0 + R, lab(D, u), { size: 13 });
    const val = askArea ? Ls * D + Math.PI * (D / 2) ** 2 : 2 * Ls + Math.PI * D;
    return {
      prompt: `A running track is made of two straight sections of ${lab(Ls, u)} and two semicircles of diameter ${lab(D, u)}.<br>Work out the ${askArea ? 'area enclosed by the track' : 'total length of the track'}. Give your answer to 1 decimal place.`,
      visual: figure(W, H, body, { nda: true }),
      answer: dp1(val, askArea ? 'm²' : u),
      distractors: (askArea ? [Ls * D + Math.PI * D * D, Ls * D + (Math.PI * (D / 2) ** 2) / 2, Ls * D, 2 * Ls + Math.PI * D] : [2 * Ls + 2 * Math.PI * D, Ls + Math.PI * D, 2 * Ls + Math.PI * D / 2, 2 * Ls + 2 * D + Math.PI * D]).map((v) => dp1(v, askArea ? 'm²' : u)),
      typed: typed1(val), calculator: true,
      solution: askArea ? [`Rectangle: $${Ls} \\times ${D} = ${Ls * D}$`, `Two semicircles make one circle of radius ${D / 2}: $\\pi \\times ${D / 2}^2 = ${tnum(roundTo(Math.PI * (D / 2) ** 2, 3))}\\ldots$`, `Total $= ${tnum(roundTo(val, 3))}\\ldots$`, `Answer: ${dp1(val, 'm²')}`]
        : [`Two straights: $2 \\times ${Ls} = ${2 * Ls}$`, `Two semicircles make one full circle: $\\pi \\times ${D} = ${tnum(roundTo(Math.PI * D, 3))}\\ldots$`, `Total $= ${tnum(roundTo(val, 3))}\\ldots$`, `Answer: ${dp1(val, u)}`],
    };
  }
  if (mode === 'squareCircle') {
    const s = 2 * int(rng, 3, 12);
    const inside = chance(rng, 0.6); // circle inside square (shade corners) vs square... keep circle inside
    void inside;
    const k = 170 / s; const x0 = (W - s * k) / 2; const y0 = (H - s * k) / 2 + 6;
    let body = polygon([[x0, y0], [x0 + s * k, y0], [x0 + s * k, y0 + s * k], [x0, y0 + s * k]], { fill: SHADE }) + circle(x0 + (s * k) / 2, y0 + (s * k) / 2, (s * k) / 2, { fill: 'var(--surface, #fff)', width: 2 });
    body += text(x0 + (s * k) / 2, y0 + s * k + 16, lab(s, u), { size: 14 });
    const exact = d === 'easy' || chance(rng, 0.4);
    const r = s / 2;
    if (exact) {
      const ans = `$${s * s} - ${piT(r * r)}$ cm²`;
      return {
        prompt: `A circle fits exactly inside a square of side ${lab(s, u)}.<br>Work out the shaded area. Give your answer in terms of $\\pi$.`,
        visual: figure(W, H, body, { nda: true }),
        answer: ans,
        // all distractors are positive: pi*d or pi*r instead of pi*r², the circle alone, (s² - r²)pi
        distractors: [`$${s * s} - ${piT(s)}$ cm²`, `$${s * s} - ${piT(r)}$ cm²`, `$${piT(r * r)}$ cm²`, `$${piT(s * s - r * r)}$ cm²`, `$${s * s} + ${piT(r * r)}$ cm²`],
        typed: { kind: 'text', accept: [`${s * s}-${r * r}π`, `${s * s}-${r * r}pi`] },
        solution: [`Square: $${s} \\times ${s} = ${s * s}$`, `The circle's diameter is ${s}, so its radius is ${r}: area $= \\pi \\times ${r}^2 = ${piT(r * r)}$`, `Shaded $=$ square $-$ circle $= ${s * s} - ${piT(r * r)}$`, `Answer: ${ans}`],
      };
    }
    const val = s * s - Math.PI * r * r;
    return {
      prompt: `A circle fits exactly inside a square of side ${lab(s, u)}.<br>Work out the shaded area. Give your answer to 1 decimal place.`,
      visual: figure(W, H, body, { nda: true }),
      answer: dp1(val, 'cm²'),
      distractors: [Math.PI * r * r, s * s - Math.PI * s, s * s - Math.PI * r, val / 4, s * s - 3 * r * r, val * 2].filter((v) => v > 0 && r1(v) !== r1(val)).map((v) => dp1(v, 'cm²')),
      typed: typed1(val), calculator: true,
      solution: [`Square: $${s}^2 = ${s * s}$`, `Circle (radius ${r}): $\\pi \\times ${r}^2 = ${tnum(roundTo(Math.PI * r * r, 3))}\\ldots$`, `Shaded $= ${s * s} - ${tnum(roundTo(Math.PI * r * r, 3))}\\ldots = ${tnum(roundTo(val, 3))}\\ldots$`, `Answer: ${dp1(val, 'cm²')}`],
    };
  }
  if (mode === 'window') {
    const w = 2 * int(rng, 3, 10); const h = int(rng, 4, 16);
    const k = Math.min(200 / w, 170 / (h + w / 2)); const x0 = (W - w * k) / 2; const yb = H - 24; const R = (w * k) / 2;
    let body = path(`M ${x0} ${yb} L ${x0 + w * k} ${yb} L ${x0 + w * k} ${yb - h * k} A ${R} ${R} 0 0 0 ${x0} ${yb - h * k} Z`, { fill: FILL, width: 2 }) + line(x0, yb - h * k, x0 + w * k, yb - h * k, { width: 1.2, dash: '4 4' });
    body += text(x0 + (w * k) / 2, yb + 14, lab(w, u), { size: 14 }) + text(x0 - 10 - textWidth(lab(h, u), 14) / 2, yb - (h * k) / 2, lab(h, u), { size: 14 });
    const val = w * h + (Math.PI * (w / 2) ** 2) / 2;
    return {
      prompt: `A window is a rectangle with a semicircle on top.<br>Work out the area of the window. Give your answer to 1 decimal place.`,
      visual: figure(W, H, body, { nda: true }),
      answer: dp1(val, 'cm²'),
      distractors: [w * h + Math.PI * (w / 2) ** 2, w * h + (Math.PI * w * w) / 2, w * h + (Math.PI * w) / 2, w * h, val + w].map((v) => dp1(v, 'cm²')),
      typed: typed1(val), calculator: true,
      solution: [`Rectangle: $${w} \\times ${h} = ${w * h}$`, `Semicircle of radius ${w / 2}: $\\frac{1}{2} \\times \\pi \\times ${w / 2}^2 = ${tnum(roundTo((Math.PI * (w / 2) ** 2) / 2, 3))}\\ldots$`, `Total $= ${tnum(roundTo(val, 3))}\\ldots$`, `Answer: ${dp1(val, 'cm²')}`],
    };
  }
  // ring (annulus)
  const R1 = int(rng, 5, 15); const r1 = int(rng, 2, R1 - 2);
  const c = [W / 2, H / 2 + 5]; const Rp = 100; const rp = (Rp * r1) / R1;
  let body = circle(...c, Rp, { fill: SHADE, width: 2 }) + circle(...c, rp, { fill: 'var(--surface, #fff)', width: 2 }) + dot(...c, 3);
  const e1 = polar(c, Rp, 30); const e2 = polar(c, rp, 150);
  body += line(...c, ...e1, { width: 1.6 }) + line(...c, ...e2, { width: 1.6 });
  body += htext(...add(polar(c, (Rp + rp) / 2 + 4, 30), [-4, -14]), lab(R1, u), { size: 13 }) + htext(...add(mid(c, e2), [-2, -13]), lab(r1, u), { size: 13 });
  const k = R1 * R1 - r1 * r1;
  return {
    prompt: `The diagram shows two circles with the same centre, of radius ${lab(R1, u)} and ${lab(r1, u)}.<br>Work out the shaded area. Give your answer in terms of $\\pi$.`,
    visual: figure(W, H, body, { nda: true }),
    answer: piAns(k, 'cm²'),
    distractors: [piAns((R1 - r1) ** 2, 'cm²'), piAns(R1 * R1 + r1 * r1, 'cm²'), piAns(2 * (R1 - r1), 'cm²'), piAns(R1 * R1, 'cm²'), piAns(4 * k, 'cm²')],
    typed: typedPi(k),
    solution: [`Big circle: $\\pi \\times ${R1}^2 = ${R1 * R1}\\pi$`, `Small circle: $\\pi \\times ${r1}^2 = ${r1 * r1}\\pi$`, `Shaded $= ${R1 * R1}\\pi - ${r1 * r1}\\pi = ${k}\\pi$ (not $(${R1} - ${r1})^2\\pi$!)`, `Answer: ${piAns(k, 'cm²')}`],
  };
}, { title: 'Compound shapes with circles' });

/* ================================================================== */
/* geo-arcs-sectors                                                    */
/* ================================================================== */

const SECTOR_ANGLES = [30, 36, 40, 45, 60, 72, 80, 90, 100, 120, 135, 140, 150, 160, 210, 225, 240, 270, 300];

export function sectorFig(r, theta, { rLabel, thetaLabel, u = 'cm', W = 340, H = 270, rot = null, arcHL = false }) {
  const R = 110;
  const start = rot ?? 0;
  // centre placed so the sector fits: compute bounding points
  const pts = [[0, 0]];
  for (let t = 0; t <= theta; t += 5) pts.push([Math.cos(((start + t) * Math.PI) / 180), Math.sin(((start + t) * Math.PI) / 180)]);
  pts.push([Math.cos(((start + theta) * Math.PI) / 180), Math.sin(((start + theta) * Math.PI) / 180)]);
  const pl = place(pts, { width: W, height: H, pad: 40 });
  const c = pl.map([0, 0]); const Rs = pl.k;
  void R;
  const P1 = pl.map([Math.cos((start * Math.PI) / 180), Math.sin((start * Math.PI) / 180)]);
  const P2 = pl.map([Math.cos(((start + theta) * Math.PI) / 180), Math.sin(((start + theta) * Math.PI) / 180)]);
  const big = theta > 180 ? 1 : 0;
  let body = path(`M ${c[0]} ${c[1]} L ${P1[0]} ${P1[1]} A ${Rs} ${Rs} 0 ${big} 0 ${P2[0]} ${P2[1]} Z`, { fill: FILL, width: 2 });
  if (arcHL) body += path(`M ${P1[0]} ${P1[1]} A ${Rs} ${Rs} 0 ${big} 0 ${P2[0]} ${P2[1]}`, { color: ACCENT, width: 3.5 });
  if (arcHL === 'all') body += line(...c, ...P1, { color: ACCENT, width: 3.5 }) + line(...c, ...P2, { color: ACCENT, width: 3.5 });
  body += arcLabel(c, P1, P2, thetaLabel, { reflex: theta > 180, r: 20 });
  if (rLabel) body += dimLabel(c, P1, rLabel, P2, { offset: 12 });
  void u;
  return figure(W, H, body, { nda: true });
}

function sectorBuild(rng, d, ask) {
  const theta = pick(rng, d === 'easy' ? [90, 60, 120, 45, 30, 180 - 30 * 0, 270].filter((t) => t !== 180) : SECTOR_ANGLES);
  const r = d === 'easy' ? pick(rng, [3, 4, 6, 8, 9, 10, 12]) : int(rng, 3, 20);
  const u = pick(rng, ['cm', 'cm', 'm']);
  const f = frac(theta, 360);
  const rot = int(rng, 0, 359);
  const visual = sectorFig(r, theta, { rLabel: lab(r, u), thetaLabel: degS(theta), u, rot, arcHL: ask === 'area' ? false : ask === 'perim' ? 'all' : true });
  return { theta, r, u, f, visual };
}

export const sectorArc = ggen('geo-sector-arc', 'geo-arcs-sectors', (rng, d) => {
  const { theta, r, u, f, visual } = sectorBuild(rng, d, 'arc');
  const k = f.mul(2 * r); // multiple of pi
  const exact = d === 'easy' ? k.isInt || k.d <= 2 : chance(rng, 0.35) && (k.d <= 3);
  const fT = `\\frac{${theta}}{360}`;
  if (exact) {
    const kT = k.isInt ? tnum(k.n) : k.tex();
    const ans = `$${kT === '1' ? '' : kT}\\pi$ ${u}`;
    const alt = (v) => { const q = frac(Math.round(v * 12), 12); return `$${q.isInt ? (q.n === 1 ? '' : tnum(q.n)) : q.tex()}\\pi$ ${u}`; };
    return {
      prompt: `The diagram shows a sector of a circle with radius ${L(r, u)} and angle ${degT2(theta)}.<br>Work out the arc length. Give your answer in terms of $\\pi$.`,
      visual, answer: ans,
      distractors: [alt(f.mul(r * r).value()), alt(f.mul(r).value()), alt(2 * r), alt(f.mul(4 * r).value()), alt(f.mul(2 * r).value() + 1), alt(f.mul(2 * r).value() * 2 + 1)],
      typed: k.isInt ? typedPi(k.n) : undefined,
      solution: [`Arc length $= ${fT} \\times 2\\pi r$`, `$= ${f.tex()} \\times 2 \\times \\pi \\times ${r}$`, `$= ${kT}\\pi$`, `Answer: ${ans}`],
    };
  }
  const val = f.value() * 2 * Math.PI * r;
  return {
    prompt: `The diagram shows a sector of a circle with radius ${L(r, u)} and angle ${degT2(theta)}.<br>Work out the arc length. Give your answer to 1 decimal place.`,
    visual,
    answer: dp1(val, u),
    distractors: [f.value() * Math.PI * r * r, f.value() * Math.PI * r, 2 * Math.PI * r, val + 2 * r, f.value() * Math.PI * 4 * r].map((v) => dp1(v, u)),
    typed: typed1(val), calculator: true,
    solution: [`Arc length $= ${fT} \\times 2\\pi r$`, `$= ${fT} \\times 2 \\times \\pi \\times ${r} = ${tnum(roundTo(val, 3))}\\ldots$`, `Answer: ${dp1(val, u)}`],
  };
}, { title: 'Arc length' });

const degT2 = (x) => `$${x}^\\circ$`;

export const sectorArea = ggen('geo-sector-area', 'geo-arcs-sectors', (rng, d) => {
  const { theta, r, u, f, visual } = sectorBuild(rng, d, 'area');
  const k = f.mul(r * r);
  const exact = d === 'easy' ? true : chance(rng, 0.35);
  const fT = `\\frac{${theta}}{360}`;
  if (exact && (k.isInt || k.d <= 4)) {
    const kT = k.isInt ? tnum(k.n) : k.tex();
    const ans = `$${kT === '1' ? '' : kT}\\pi$ ${u}²`;
    const alt = (v) => { const q = frac(Math.round(v * 24), 24); return `$${q.isInt ? (q.n === 1 ? '' : tnum(q.n)) : q.tex()}\\pi$ ${u}²`; };
    return {
      prompt: `The diagram shows a sector of a circle with radius ${L(r, u)} and angle ${degT2(theta)}.<br>Work out the area of the sector. Give your answer in terms of $\\pi$.`,
      visual, answer: ans,
      distractors: [alt(f.mul(2 * r).value()), alt(r * r), alt(f.mul(4 * r * r).value()), alt(f.mul(r).value()), alt(k.value() * 2), alt(k.value() + 1)],
      typed: k.isInt ? typedPi(k.n) : undefined,
      solution: [`Sector area $= ${fT} \\times \\pi r^2$`, `$= ${f.tex()} \\times \\pi \\times ${r}^2 = ${f.tex()} \\times ${r * r}\\pi$`, `$= ${kT}\\pi$`, `Answer: ${ans}`],
    };
  }
  const val = f.value() * Math.PI * r * r;
  return {
    prompt: `The diagram shows a sector of a circle with radius ${L(r, u)} and angle ${degT2(theta)}.<br>Work out the area of the sector. Give your answer to 1 decimal place.`,
    visual,
    answer: dp1(val, u + '²'),
    distractors: [f.value() * 2 * Math.PI * r, Math.PI * r * r, f.value() * Math.PI * 4 * r * r, (theta / 180) * Math.PI * r * r, val / 2].map((v) => dp1(v, u + '²')),
    typed: typed1(val), calculator: true,
    solution: [`Sector area $= ${fT} \\times \\pi r^2$`, `$= ${fT} \\times \\pi \\times ${r}^2 = ${tnum(roundTo(val, 3))}\\ldots$`, `Answer: ${dp1(val, u + '²')}`],
  };
}, { title: 'Area of a sector' });

export const sectorPerimeter = ggen('geo-sector-perimeter', 'geo-arcs-sectors', (rng, d) => {
  const { theta, r, u, f, visual } = sectorBuild(rng, d, 'perim');
  const arc = f.value() * 2 * Math.PI * r;
  const val = arc + 2 * r;
  const k = f.mul(2 * r);
  if (d !== 'hard' && (k.isInt) && chance(rng, 0.4)) {
    const ans = `$${k.n === 1 ? '' : k.n}\\pi + ${2 * r}$ ${u}`;
    return {
      prompt: `The diagram shows a sector of a circle with radius ${L(r, u)} and angle ${degT2(theta)}.<br>Work out the perimeter of the sector. Give your answer in terms of $\\pi$.`,
      visual, answer: ans,
      distractors: [`$${k.n === 1 ? '' : k.n}\\pi$ ${u}`, `$${k.n === 1 ? '' : k.n}\\pi + ${r}$ ${u}`, `$${2 * r}\\pi + ${2 * r}$ ${u}`, `$${k.n * 2}\\pi + ${2 * r}$ ${u}`, `$${k.n}\\pi + ${4 * r}$ ${u}`],
      typed: { kind: 'text', accept: [`${k.n}π+${2 * r}`, `${2 * r}+${k.n}π`, `${k.n}pi+${2 * r}`] },
      solution: [`Arc length $= \\frac{${theta}}{360} \\times 2\\pi \\times ${r} = ${k.n}\\pi$`, `The perimeter also includes the two radii: $2 \\times ${r} = ${2 * r}$`, `Perimeter $= ${k.n}\\pi + ${2 * r}$`, `Answer: ${ans}`],
    };
  }
  return {
    prompt: `The diagram shows a sector of a circle with radius ${L(r, u)} and angle ${degT2(theta)}.<br>Work out the perimeter of the sector. Give your answer to 1 decimal place.`,
    visual,
    answer: dp1(val, u),
    distractors: [arc, arc + r, f.value() * Math.PI * r * r + 2 * r, 2 * Math.PI * r + 2 * r, f.value() * Math.PI * r + 2 * r].map((v) => dp1(v, u)),
    typed: typed1(val), calculator: true,
    solution: [`Arc length $= \\frac{${theta}}{360} \\times 2 \\times \\pi \\times ${r} = ${tnum(roundTo(arc, 3))}\\ldots$`, `Add the two straight edges (radii): $2 \\times ${r} = ${2 * r}$`, `Perimeter $= ${tnum(roundTo(val, 3))}\\ldots$`, `Answer: ${dp1(val, u)}`],
  };
}, { title: 'Perimeter of a sector' });

export const sectorReverse = ggen('geo-sector-reverse', 'geo-arcs-sectors', (rng, d) => {
  const u = 'cm';
  const fromArea = chance(rng, 0.5);
  const askAngle = d !== 'hard' || chance(rng, 0.5);
  // choose the angle and radius so the given area / arc length is a whole number times pi (as on real papers)
  let theta; let r; let f; let k;
  for (let t = 0; t < 300; t += 1) {
    theta = pick(rng, SECTOR_ANGLES); r = int(rng, 3, d === 'easy' ? 12 : 15);
    f = frac(theta, 360); k = fromArea ? f.mul(r * r) : f.mul(2 * r);
    if (k.isInt) break;
  }
  if (!k.isInt) throw new Error('messy');
  const kT = k.isInt ? (k.n === 1 ? '' : tnum(k.n)) : k.tex();
  const given = `$${kT}\\pi$ ${fromArea ? 'cm²' : 'cm'}`;
  const W = 340; const H = 260;
  const visual = sectorFig(r, theta, { rLabel: askAngle ? lab(r, u) : 'r', thetaLabel: askAngle ? 'x' : degS(theta), rot: int(rng, 0, 359), arcHL: !fromArea });
  if (askAngle) {
    return {
      prompt: `A sector of a circle has radius ${L(r, u)} and ${fromArea ? 'area' : 'arc length'} ${given}.<br>Work out the angle $x$ of the sector.`,
      visual,
      answer: degT2(theta),
      distractors: wrongs(theta, [Math.round(k.value() * 360 / (fromArea ? r : r * r)), Math.round((k.value() / (fromArea ? r * r : r)) * 360), 360 - theta, theta * 2, theta / 2, 180 - theta, theta + 10], { min: 0, max: 359, integer: true }).map(degT2),
      typed: { kind: 'number', value: theta },
      solution: fromArea ? [`Whole circle area $= \\pi \\times ${r}^2 = ${r * r}\\pi$`, `Fraction of the circle: $${kT}\\pi \\div ${r * r}\\pi = ${f.tex()}$`, `$x = ${f.tex()} \\times 360 = ${theta}^\\circ$`, `Answer: ${degT2(theta)}`]
        : [`Whole circumference $= 2\\pi \\times ${r} = ${2 * r}\\pi$`, `Fraction of the circle: $${kT}\\pi \\div ${2 * r}\\pi = ${f.tex()}$`, `$x = ${f.tex()} \\times 360 = ${theta}^\\circ$`, `Answer: ${degT2(theta)}`],
    };
  }
  return {
    prompt: `A sector of a circle has angle ${degT2(theta)} and ${fromArea ? 'area' : 'arc length'} ${given}.<br>Work out the radius $r$.`,
    visual,
    answer: L(r, u),
    distractors: wrongs(r, [r * r, 2 * r, Math.round(r / 2), r + 1, r - 1, fromArea ? r * 2 : r * r], { min: 0, integer: true }).map((v) => L(v, u)),
    typed: { kind: 'number', value: r },
    solution: fromArea ? [`$${f.tex()} \\times \\pi r^2 = ${kT}\\pi$`, `$r^2 = ${kT} \\times ${f.inv().tex()} = ${r * r}$`, `$r = \\sqrt{${r * r}} = ${r}$`, `Answer: ${L(r, u)}`]
      : [`$${f.tex()} \\times 2\\pi r = ${kT}\\pi$`, `$2r = ${kT} \\times ${f.inv().tex()} = ${2 * r}$`, `$r = ${r}$`, `Answer: ${L(r, u)}`],
  };
}, { title: 'Angle or radius of a sector' });

export const sectorCompound = ggen('geo-sector-compound', 'geo-arcs-sectors', (rng, d) => {
  // area between two arcs (part of a ring), e.g. a shaded band of a fan or a curved path
  const theta = pick(rng, [60, 72, 90, 120, 135, 150]);
  const R = int(rng, 6, 15); const r = int(rng, Math.max(2, Math.ceil(R * 0.35)), Math.floor(R * 0.75));
  const askPerim = d === 'hard';
  const W = 380; const H = 270;
  const rot = 90 - theta / 2;
  const pts = [[0, 0]];
  for (let t = 0; t <= theta; t += 5) pts.push([Math.cos(((rot + t) * Math.PI) / 180), Math.sin(((rot + t) * Math.PI) / 180)]);
  const pl = place(pts, { width: W, height: H, pad: 40 });
  const c = pl.map([0, 0]); const Rs = pl.k; const rs = (Rs * r) / R;
  const pt = (rad, t) => pl.map([(rad / R) * Math.cos(((rot + t) * Math.PI) / 180), (rad / R) * Math.sin(((rot + t) * Math.PI) / 180)]);
  const A1 = pt(R, 0); const A2p = pt(R, theta); const B1 = pt(r, 0); const B2 = pt(r, theta);
  let body = path(`M ${B1[0]} ${B1[1]} L ${A1[0]} ${A1[1]} A ${Rs} ${Rs} 0 0 0 ${A2p[0]} ${A2p[1]} L ${B2[0]} ${B2[1]} A ${rs} ${rs} 0 0 1 ${B1[0]} ${B1[1]} Z`, { fill: SHADE, width: 2 });
  body += line(...c, ...B1, { width: 1.4, dash: '4 4' }) + line(...c, ...B2, { width: 1.4, dash: '4 4' }) + dot(...c, 3);
  body += arcLabel(c, B1, B2, degS(theta), { r: 16 });
  body += dimLabel(c, B1, lab(r, 'cm'), B2, { offset: 10, size: 13 }) + dimLabel(B1, A1, lab(R - r, 'cm'), B2, { offset: 10, size: 13 });
  const f = frac(theta, 360);
  if (askPerim) {
    const val = f.value() * 2 * Math.PI * (R + r) + 2 * (R - r);
    return {
      prompt: `The shaded shape is part of a ring. It is made from two sectors with the same centre and angle ${degT2(theta)}.<br>Work out the perimeter of the shaded shape. Give your answer to 1 decimal place.`,
      visual: figure(W, H, body, { nda: true }),
      answer: dp1(val, 'cm'),
      distractors: [f.value() * 2 * Math.PI * (R + r), f.value() * 2 * Math.PI * R + 2 * (R - r), f.value() * 2 * Math.PI * (R - r) + 2 * (R - r), f.value() * Math.PI * (R * R - r * r), val + 2 * r].map((v) => dp1(v, 'cm')),
      typed: typed1(val), calculator: true,
      solution: [`The outer radius is $${r} + ${R - r} = ${R}$ cm.`, `Outer arc: $${f.tex()} \\times 2\\pi \\times ${R}$; inner arc: $${f.tex()} \\times 2\\pi \\times ${r}$`, `Add the two straight edges of ${R - r} cm each: total $= ${tnum(roundTo(val, 3))}\\ldots$`, `Answer: ${dp1(val, 'cm')}`],
    };
  }
  const k = f.mul(R * R - r * r);
  const val = k.value() * Math.PI;
  if (d === 'easy' && !k.isInt) throw new Error('need a whole multiple of pi');
  const exact = d === 'easy';
  if (exact) {
    return {
      prompt: `The shaded shape is part of a ring. It is made from two sectors with the same centre and angle ${degT2(theta)}.<br>Work out the shaded area. Give your answer in terms of $\\pi$.`,
      visual: figure(W, H, body, { nda: true }),
      answer: piAns(k.n, 'cm²'),
      distractors: [piAns(roundTo(f.value() * (R - r) ** 2, 2), 'cm²'), piAns(roundTo(f.value() * R * R, 2), 'cm²'), piAns(R * R - r * r, 'cm²'), piAns(roundTo(f.value() * (R * R + r * r), 2), 'cm²'), piAns(roundTo(f.value() * 2 * (R - r), 2), 'cm²'), piAns(k.n + 1, 'cm²')],
      typed: typedPi(k.n),
      solution: [`The outer radius is $${r} + ${R - r} = ${R}$ cm.`, `Big sector: $${f.tex()} \\times \\pi \\times ${R}^2$; small sector: $${f.tex()} \\times \\pi \\times ${r}^2$`, `Shaded $= ${f.tex()} \\times (${R * R} - ${r * r})\\pi = ${k.n}\\pi$`, `Answer: ${piAns(k.n, 'cm²')}`],
    };
  }
  return {
    prompt: `The shaded shape is part of a ring. It is made from two sectors with the same centre and angle ${degT2(theta)}.<br>Work out the shaded area. Give your answer to 1 decimal place.`,
    visual: figure(W, H, body, { nda: true }),
    answer: dp1(val, 'cm²'),
    distractors: [f.value() * Math.PI * (R - r) ** 2, f.value() * Math.PI * R * R, f.value() * Math.PI * (R * R + r * r), Math.PI * (R * R - r * r), f.value() * Math.PI * (R - r) * (R - r) * 2].map((v) => dp1(v, 'cm²')),
    typed: typed1(val), calculator: true,
    solution: [`The outer radius is $${r} + ${R - r} = ${R}$ cm.`, `Shaded = big sector − small sector $= ${f.tex()} \\times \\pi \\times (${R}^2 - ${r}^2)$`, `$= ${tnum(roundTo(val, 3))}\\ldots$`, `Answer: ${dp1(val, 'cm²')}`],
  };
}, { title: 'Compound sector shapes', learn: ['geo-arcs-sectors', 'geo-area-trapezium-compound'] });

export const areaGenerators = [
  perimCompound, perimMissingSide, perimJoined, perimGrid,
  areaRectangle, areaTriangle, areaParallelogram, areaGrid, areaReverse,
  areaTrapezium, areaCompoundRect, areaCompoundTri, areaShaded,
  circleCircumference, circleArea, circlePart, circleReverse, circleParts, circleCompound,
  sectorArc, sectorArea, sectorPerimeter, sectorReverse, sectorCompound,
];

void [size, gcd, unit, sub, ACCENT2, GRID, MUTED];
