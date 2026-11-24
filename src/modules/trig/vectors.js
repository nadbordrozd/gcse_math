// Column vectors and vector geometry.
import { gen, pick, int, intExcept, shuffle, num, tnum, chance, frac, Frac } from '../../core.js';
import { fig, vectorGrid, ACCENT, ACCENT2 } from './diagrams.js';

/* ------------------------------------------------------------------ */
/* Column vectors                                                      */
/* ------------------------------------------------------------------ */

/** TeX column vector. */
export const cv = (x, y) => `\\begin{pmatrix} ${tnum(x)} \\\\ ${tnum(y)} \\end{pmatrix}`;
const cvo = (v) => `$${cv(v[0], v[1])}$`;
const uniqVecs = (ans, list) => {
  const seen = new Set([`${ans[0]},${ans[1]}`]); const out = [];
  for (const v of list) { const k2 = `${v[0]},${v[1]}`; if (!seen.has(k2)) { seen.add(k2); out.push(cvo(v)); } }
  return out;
};
const coefTex = (c) => (c === 1 ? '' : c === -1 ? '-' : tnum(c));
/** "2\mathbf{a} - 3\mathbf{b}" for integer coefficients */
function combTex(p, q, a = '\\mathbf{a}', b = '\\mathbf{b}') {
  let s = p ? `${coefTex(p)}${a}` : '';
  if (q) s += s ? ` ${q < 0 ? '-' : '+'} ${coefTex(Math.abs(q))}${b}` : `${coefTex(q)}${b}`;
  return s || '0';
}

export const cvCombine = gen('trig-cv-combine', 'trig-column-vectors', (rng, d) => {
  const a = [intExcept(rng, -6, 8, [0]), intExcept(rng, -6, 8, [0])];
  const b = [intExcept(rng, -6, 8, [0]), intExcept(rng, -6, 8, [0])];
  const [p, q] = pick(rng, { easy: [[1, 1], [2, 0], [3, 0], [1, -1], [0, 2]], medium: [[2, 1], [1, -1], [3, -1], [2, 3], [1, 2], [-1, 2]], hard: [[2, -3], [3, -2], [-2, 1], [4, -3], [-3, -2], [5, -2]] }[d]);
  const r = [p * a[0] + q * b[0], p * a[1] + q * b[1]];
  const wrong = [
    [p * a[0] - q * b[0], p * a[1] - q * b[1]], // sign of the second term
    [q * a[0] + p * b[0], q * a[1] + p * b[1]], // coefficients swapped between a and b
    [r[1], r[0]], // components swapped
    [p * a[0] + q * b[0], a[1] + b[1]], // only multiplied the top
    [a[0] + b[0] + p + q, a[1] + b[1] + p + q], // added the scalars
    [-r[0], -r[1]],
    [r[0], -r[1]],
  ];
  return {
    prompt: `$\\mathbf{a} = ${cv(a[0], a[1])}$ and $\\mathbf{b} = ${cv(b[0], b[1])}$.<br>Work out $${combTex(p, q)}$ as a column vector.`,
    answer: cvo(r),
    distractors: uniqVecs(r, wrong),
    typed: { kind: 'coord', x: r[0], y: r[1] },
    hint: 'Multiply each component by the number in front, then add the top numbers and the bottom numbers separately.',
    solution: [
      ...(p !== 0 && p !== 1 ? [`$${p}\\mathbf{a} = ${cv(p * a[0], p * a[1])}$ (multiply <b>both</b> numbers by ${p})`] : []),
      ...(q !== 0 && Math.abs(q) !== 1 ? [`$${Math.abs(q)}\\mathbf{b} = ${cv(Math.abs(q) * b[0], Math.abs(q) * b[1])}$`] : []),
      `${q < 0 ? 'Subtract' : 'Add'} the top numbers and the bottom numbers: $\\begin{pmatrix} ${tnum(p * a[0])} ${q < 0 ? '-' : '+'} ${q < 0 ? `(${tnum(-q * b[0])})` : `(${tnum(q * b[0])})`} \\\\ ${tnum(p * a[1])} ${q < 0 ? '-' : '+'} ${q < 0 ? `(${tnum(-q * b[1])})` : `(${tnum(q * b[1])})`} \\end{pmatrix} = ${cv(r[0], r[1])}$`.replace(/\(([0-9]+)\)/g, '$1'),
      `Answer: ${cvo(r)}`,
    ],
  };
}, { title: 'Add, subtract and multiply column vectors' });

export const cvGrid = gen('trig-cv-grid', 'trig-column-vectors', (rng, d) => {
  const mk = () => [intExcept(rng, -5, 5, [0]), intExcept(rng, -4, 4, [0])];
  const a = mk(); let b = mk();
  while (b[0] === a[0] && b[1] === a[1]) b = mk();
  const mode = d === 'easy' ? 'read' : d === 'medium' ? pick(rng, ['read', 'sum']) : pick(rng, ['sum', 'diff']);
  const r = mode === 'read' ? a : mode === 'sum' ? [a[0] + b[0], a[1] + b[1]] : [a[0] - b[0], a[1] - b[1]];
  // place arrows on a 14 x 9 grid
  const cols = 14; const rows = 9;
  const startA = [a[0] < 0 ? 1 - a[0] : 1, a[1] < 0 ? 1 - a[1] : 1];
  const startB = [Math.max(startA[0] + Math.max(0, a[0]), startA[0]) + 2 + (b[0] < 0 ? -b[0] : 0), b[1] < 0 ? 1 - b[1] + int(rng, 0, 2) : 1 + int(rng, 0, 2)];
  if (startB[0] + Math.max(0, b[0]) > cols - 1) startB[0] = cols - 1 - Math.max(0, b[0]);
  const vectors = [{ from: startA, to: [startA[0] + a[0], startA[1] + a[1]], label: 'a', side: a[0] * a[1] > 0 ? -1 : 1 }];
  if (mode !== 'read') vectors.push({ from: startB, to: [startB[0] + b[0], startB[1] + b[1]], label: 'b', color: ACCENT2, side: b[0] * b[1] > 0 ? -1 : 1 });
  const vis = vectorGrid({ cols, rows, unitPx: 26, vectors });
  const target = mode === 'read' ? '\\mathbf{a}' : mode === 'sum' ? '\\mathbf{a} + \\mathbf{b}' : '\\mathbf{a} - \\mathbf{b}';
  const wrong = [[r[1], r[0]], [-r[0], -r[1]], [r[0], -r[1]], [-r[0], r[1]], [r[0] + 1, r[1]], [r[0], r[1] - 1], [-r[1], -r[0]], ...(mode === 'diff' ? [[b[0] - a[0], b[1] - a[1]], [a[0] + b[0], a[1] + b[1]]] : mode === 'sum' ? [[a[0] - b[0], a[1] - b[1]]] : [[r[0] + 1, r[1]]])];
  return {
    prompt: `The ${mode === 'read' ? 'vector $\\mathbf{a}$ is' : 'vectors $\\mathbf{a}$ and $\\mathbf{b}$ are'} drawn on the grid.<br>Write $${target}$ as a column vector.`,
    visual: vis,
    answer: cvo(r),
    distractors: uniqVecs(r, wrong),
    typed: { kind: 'coord', x: r[0], y: r[1] },
    solution: [
      'A column vector $\\begin{pmatrix} x \\\\ y \\end{pmatrix}$ gives the movement <b>across</b> (right is positive) on top and <b>up</b> (up is positive) underneath.',
      `$\\mathbf{a}$ goes ${Math.abs(a[0])} ${a[0] > 0 ? 'right' : 'left'} and ${Math.abs(a[1])} ${a[1] > 0 ? 'up' : 'down'}: $\\mathbf{a} = ${cv(a[0], a[1])}$${mode !== 'read' ? `; $\\mathbf{b}$ goes ${Math.abs(b[0])} ${b[0] > 0 ? 'right' : 'left'} and ${Math.abs(b[1])} ${b[1] > 0 ? 'up' : 'down'}: $\\mathbf{b} = ${cv(b[0], b[1])}$` : ''}.`,
      ...(mode !== 'read' ? [`$${target} = ${cv(a[0], a[1])} ${mode === 'sum' ? '+' : '-'} ${cv(b[0], b[1])} = ${cv(r[0], r[1])}$`] : []),
      `Answer: ${cvo(r)}`,
    ],
  };
}, { title: 'Read column vectors from a grid' });

export const cvSolve = gen('trig-cv-solve', 'trig-column-vectors', (rng, d) => {
  const a = [intExcept(rng, -5, 6, [0]), intExcept(rng, -5, 6, [0])];
  const b = [intExcept(rng, -5, 6, [0]), intExcept(rng, -5, 6, [0])];
  if (d === 'hard') {
    // m a + n b = v; find m and n
    let m; let n;
    for (;;) { m = intExcept(rng, -3, 4, [0]); n = intExcept(rng, -3, 4, [0]); if (a[0] * b[1] - a[1] * b[0] !== 0 && m !== n) break; b[0] = intExcept(rng, -5, 6, [0]); }
    const v = [m * a[0] + n * b[0], m * a[1] + n * b[1]];
    const opt = (x, y) => `$m = ${tnum(x)}$, $n = ${tnum(y)}$`;
    return {
      prompt: `$\\mathbf{a} = ${cv(a[0], a[1])}$ and $\\mathbf{b} = ${cv(b[0], b[1])}$.<br>$m\\mathbf{a} + n\\mathbf{b} = ${cv(v[0], v[1])}$. Work out the values of $m$ and $n$.`,
      answer: opt(m, n),
      distractors: [opt(n, m), opt(-m, n), opt(m, -n), opt(-m, -n), opt(m + 1, n - 1), opt(m - 1, n + 1)].filter((s) => s !== opt(m, n)),
      solution: [
        `Top row: $${a[0]}m ${b[0] < 0 ? '-' : '+'} ${Math.abs(b[0])}n = ${v[0]}$. Bottom row: $${a[1]}m ${b[1] < 0 ? '-' : '+'} ${Math.abs(b[1])}n = ${v[1]}$.`,
        'Solve these simultaneous equations (eliminate one letter).',
        `Check: $${m} ${cv(a[0], a[1])} + ${n < 0 ? `(${n})` : n} ${cv(b[0], b[1])} = ${cv(v[0], v[1])}$ ✓`,
        `Answer: ${opt(m, n)}`,
      ],
    };
  }
  const [p, q] = d === 'easy' ? [1, 1] : pick(rng, [[2, 1], [3, 1], [1, 2], [2, -1]]);
  // p a + q c = b  -> c = (b - p a)/q ; choose c integer by building from c
  const c = [intExcept(rng, -6, 6, [0]), intExcept(rng, -6, 6, [0])];
  const bb = [p * a[0] + q * c[0], p * a[1] + q * c[1]];
  const eq = `${combTex(p, 0)} + ${q === 1 ? '' : q === -1 ? '-' : q}\\mathbf{c}`.replace('+ -', '- ');
  return {
    prompt: `$\\mathbf{a} = ${cv(a[0], a[1])}$ and $\\mathbf{b} = ${cv(bb[0], bb[1])}$.<br>$${eq} = \\mathbf{b}$. Work out $\\mathbf{c}$ as a column vector.`,
    answer: cvo(c),
    distractors: uniqVecs(c, [[bb[0] + p * a[0], bb[1] + p * a[1]], [bb[0] - p * a[0], bb[1] - p * a[1]], [-c[0], -c[1]], [c[1], c[0]], [(bb[0] - a[0]), (bb[1] - a[1])], [p * a[0] - bb[0], p * a[1] - bb[1]], [-c[0], c[1]], [c[0], -c[1]], [c[0] + 1, c[1] - 1]]),
    typed: { kind: 'coord', x: c[0], y: c[1] },
    solution: [
      `Rearrange: $${q === 1 ? '' : q === -1 ? '-' : q}\\mathbf{c} = \\mathbf{b} - ${combTex(p, 0)}$`,
      `$\\mathbf{b} - ${combTex(p, 0)} = ${cv(bb[0], bb[1])} - ${cv(p * a[0], p * a[1])} = ${cv(bb[0] - p * a[0], bb[1] - p * a[1])}$`,
      ...(q !== 1 ? [`Divide by ${q}: $\\mathbf{c} = ${cv(c[0], c[1])}$`] : []),
      `Answer: ${cvo(c)}`,
    ],
  };
}, { title: 'Solve vector equations' });

export const cvTranslate = gen('trig-cv-translate', 'trig-column-vectors', (rng, d) => {
  const mode = d === 'easy' ? 'reverse' : pick(rng, ['reverse', 'points', 'points']);
  if (mode === 'reverse') {
    const v = [intExcept(rng, -7, 7, [0]), intExcept(rng, -7, 7, [0])];
    const r = [-v[0], -v[1]];
    return {
      prompt: `The vector $${cv(v[0], v[1])}$ translates shape A to shape B.<br>Which vector translates shape B to shape A?`,
      answer: cvo(r),
      distractors: uniqVecs(r, [v, [v[1], v[0]], [-v[0], v[1]], [v[0], -v[1]], [-v[1], -v[0]], [r[0] + 1, r[1]], [r[0], r[1] + 1]]),
      typed: { kind: 'coord', x: r[0], y: r[1] },
      solution: ['Going back undoes the movement, so both numbers change sign.', `$-${cv(v[0], v[1])} = ${cv(r[0], r[1])}$`, `Answer: ${cvo(r)}`],
    };
  }
  const P = [int(rng, -8, 8), int(rng, -8, 8)]; let Q = [int(rng, -8, 8), int(rng, -8, 8)];
  while (Q[0] === P[0] || Q[1] === P[1]) Q = [int(rng, -8, 8), int(rng, -8, 8)];
  const r = [Q[0] - P[0], Q[1] - P[1]];
  const pt = (p) => `(${tnum(p[0])}, ${tnum(p[1])})`;
  return {
    prompt: `Which vector translates the point $${pt(P)}$ to the point $${pt(Q)}$?`,
    answer: cvo(r),
    distractors: uniqVecs(r, [[-r[0], -r[1]], [P[0] + Q[0], P[1] + Q[1]], [r[1], r[0]], [r[0], -r[1]], [-r[0], r[1]], [r[0] + 1, r[1]], [r[0], r[1] - 1]]),
    typed: { kind: 'coord', x: r[0], y: r[1] },
    solution: ['Vector = end − start, for each coordinate.', `Across: $${tnum(Q[0])} - ${P[0] < 0 ? `(${tnum(P[0])})` : tnum(P[0])} = ${tnum(r[0])}$; up: $${tnum(Q[1])} - ${P[1] < 0 ? `(${tnum(P[1])})` : tnum(P[1])} = ${tnum(r[1])}$`, `Answer: ${cvo(r)}`],
  };
}, { title: 'Translation vectors' });

/* ------------------------------------------------------------------ */
/* Vector geometry: expressions in a and b                             */
/* ------------------------------------------------------------------ */

/** Vector expression p a + q b with Frac coefficients. */
const V = (p, q) => ({ p: Frac.of(p), q: Frac.of(q) });
const vadd = (u, v) => V(u.p.add(v.p), u.q.add(v.q));
const vsub = (u, v) => V(u.p.sub(v.p), u.q.sub(v.q));
const vmul = (u, k) => V(u.p.mul(k), u.q.mul(k));
const veq = (u, v) => u.p.eq(v.p) && u.q.eq(v.q);
const vkey = (u) => `${u.p.n}/${u.p.d}|${u.q.n}/${u.q.d}`;
function cTex(c, sym) {
  if (c.n === 0) return '';
  const neg = c.n < 0; const a = neg ? c.neg() : c;
  const body = a.n === 1 && a.d === 1 ? sym : `${a.tex()}${sym}`;
  return { neg, body };
}
/** TeX of an expression: "\frac{1}{2}\mathbf{a} - \mathbf{b}" */
function vtex(u, names = ['\\mathbf{a}', '\\mathbf{b}']) {
  const parts = [cTex(u.p, names[0]), cTex(u.q, names[1])].filter(Boolean);
  if (!parts.length) return '\\mathbf{0}';
  return parts.map((t, i) => (i === 0 ? `${t.neg ? '-' : ''}${t.body}` : ` ${t.neg ? '-' : '+'} ${t.body}`)).join('');
}
const vopt = (u, names) => `$${vtex(u, names)}$`;
/** Typed-answer forms for an expression in a and b. */
function vAccept(u, letters = ['a', 'b']) {
  const forms = (c, s) => {
    if (c.n === 0) return [''];
    const neg = c.n < 0; const a = neg ? c.neg() : c; const sg = neg ? '-' : '';
    if (a.d === 1) return [`${sg}${a.n === 1 ? '' : a.n}${s}`];
    const out = [`${sg}${a.n}/${a.d}${s}`, `${sg}(${a.n}/${a.d})${s}`, `${sg}${a.n}${s}/${a.d}`];
    const dec = a.n / a.d; if (Number.isInteger(dec * 100)) out.push(`${sg}${dec}${s}`);
    return out;
  };
  const A = forms(u.p, letters[0]); const B = forms(u.q, letters[1]);
  const out = new Set();
  for (const x of A) for (const y of B) {
    if (!x) out.add(y);
    else if (!y) out.add(x);
    else {
      out.add(`${x}${y.startsWith('-') ? '' : '+'}${y}`);
      out.add(`${y}${x.startsWith('-') ? '' : '+'}${x}`);
    }
  }
  return [...out];
}

function vDistractors(ans, list, names) {
  const seen = new Set([vkey(ans)]); const out = [];
  for (const u of list) { if (!u || seen.has(vkey(u))) continue; seen.add(vkey(u)); out.push(vopt(u, names)); }
  return out;
}

/** Shape figures with vector arrows. */
function vecShapeFig(pts, { polys = [], arrows = [], segs = [], dots = [], rotate = 0, width = 360, height = 220 }) {
  return fig({
    pts, rotate, width, height, pad: 32,
    draw: (g) => {
      let out = polys.map((p) => g.poly(p, { fillOpacity: 0.45 })).join('') + segs.map(([p, q]) => g.seg(p, q)).join('');
      for (const ar of arrows) {
        out += g.vhead(ar.from, ar.to, { color: ar.color || 'currentColor' });
        if (ar.label) out += g.side(ar.from, ar.to, ar.label, { bold: true, size: 16, inside: ar.inside ?? null, t: ar.t ?? 0.5 });
      }
      for (const p of dots) out += g.dot(p, 3);
      out += Object.keys(pts).filter((k) => !k.startsWith('_')).map((k) => g.name(k, k, { away: '_c' })).join('');
      return out;
    },
  });
}

export const vgPath = gen('trig-vg-path', 'trig-vector-geometry', (rng, d) => {
  const shape = d === 'easy' ? pick(rng, ['triangle', 'parallelogram']) : pick(rng, ['parallelogram', 'triangle', 'trapezium']);
  const a = V(1, 0); const b = V(0, 1);
  let pts; let given; let questions; let polys; let arrows;
  if (shape === 'triangle') {
    pts = { O: [0, 0], A: [3, 0.4], B: [1.2, 2.2] };
    given = '$\\overrightarrow{OA} = \\mathbf{a}$ and $\\overrightarrow{OB} = \\mathbf{b}$';
    questions = [['AB', vsub(b, a)], ['BA', vsub(a, b)]];
    polys = ['OAB']; arrows = [{ from: 'O', to: 'A', label: 'a' }, { from: 'O', to: 'B', label: 'b' }];
  } else if (shape === 'parallelogram') {
    pts = { O: [0, 0], A: [3, 0], C: [4.1, 1.9], B: [1.1, 1.9] };
    given = '$OACB$ is a parallelogram. $\\overrightarrow{OA} = \\mathbf{a}$ and $\\overrightarrow{OB} = \\mathbf{b}$';
    questions = [['OC', vadd(a, b)], ['AB', vsub(b, a)], ['BA', vsub(a, b)], ['CO', vmul(vadd(a, b), -1)], ['CB', vmul(a, -1)], ['BC', a], ['CA', vmul(b, -1)]];
    polys = ['OACB']; arrows = [{ from: 'O', to: 'A', label: 'a' }, { from: 'O', to: 'B', label: 'b' }];
  } else {
    // trapezium OABC with OA = a, OC = b, CB = 2a
    const k = pick(rng, [2, 3]);
    pts = { O: [0, 0], A: [1.4, 0], B: [1.4 * k + 0.8, 1.6], C: [0.8, 1.6] };
    // CB parallel to OA, CB = k a
    given = `$\\overrightarrow{OA} = \\mathbf{a}$, $\\overrightarrow{OC} = \\mathbf{b}$ and $\\overrightarrow{CB} = ${k}\\mathbf{a}$`;
    questions = [['OB', vadd(b, vmul(a, k))], ['AB', vadd(b, vmul(a, k - 1))], ['BA', vmul(vadd(b, vmul(a, k - 1)), -1)], ['AC', vsub(b, a)]];
    polys = ['OABC']; arrows = [{ from: 'O', to: 'A', label: 'a' }, { from: 'O', to: 'C', label: 'b' }, { from: 'C', to: 'B', label: `${k}a` }];
  }
  const [qName, ans] = pick(rng, questions);
  const c = Object.values(pts).reduce((s, p) => [s[0] + p[0] / Object.keys(pts).length, s[1] + p[1] / Object.keys(pts).length], [0, 0]);
  const vis = vecShapeFig({ ...pts, _c: c }, { polys, arrows, rotate: pick(rng, [0, 0, 10, -10]) });
  const wrong = [vmul(ans, -1), V(ans.q, ans.p), vadd(ans, vmul(a, ans.p.n === 0 ? 1 : 0)), V(ans.p, ans.q.neg()), V(ans.p.neg(), ans.q), vadd(a, b), vsub(a, b), vsub(b, a), V(2, 1), V(1, 2)];
  return {
    prompt: `${given}.<br>Write $\\overrightarrow{${qName}}$ in terms of $\\mathbf{a}$ and $\\mathbf{b}$.`,
    visual: vis,
    answer: vopt(ans),
    distractors: vDistractors(ans, wrong).filter((s) => s !== vopt(ans)),
    typed: { kind: 'text', accept: vAccept(ans) },
    hint: 'Find a route from the start to the end along vectors you know. Going against an arrow makes it negative.',
    solution: [
      `Find a route from $${qName[0]}$ to $${qName[1]}$ using known vectors; travelling against an arrow gives a minus sign.`,
      `$\\overrightarrow{${qName}} = ${vtex(ans)}$`,
      `Answer: ${vopt(ans)}`,
    ],
  };
}, { title: 'Write a vector in terms of a and b (routes)' });

export const vgRatio = gen('trig-vg-ratio', 'trig-vector-geometry', (rng, d) => {
  // Triangle OAB, OA = a, OB = b. P on AB with AP : PB = m : n (midpoint when m = n = 1).
  const [m, n] = d === 'easy' ? [1, 1] : pick(rng, d === 'medium' ? [[1, 2], [2, 1], [1, 3], [3, 1], [1, 1]] : [[2, 3], [3, 2], [1, 4], [3, 4], [2, 5], [5, 3]]);
  const askAP = d !== 'easy' && chance(rng, 0.35);
  const t = frac(m, m + n);
  const AB = V(-1, 1);
  const AP = vmul(AB, t);
  const OP = vadd(V(1, 0), AP);
  const ans = askAP ? AP : OP;
  const pts = { O: [0, 0], A: [3.2, 0], B: [1, 2.2] };
  const Pp = [pts.A[0] + (pts.B[0] - pts.A[0]) * (m / (m + n)), pts.A[1] + (pts.B[1] - pts.A[1]) * (m / (m + n))];
  const vis = fig({
    pts: { ...pts, P: Pp }, rotate: pick(rng, [0, 0, 12]), width: 360, height: 220,
    draw: (g) => g.poly('OAB', { fillOpacity: 0.45 }) + g.seg('O', 'P', { dash: '5 4', width: 1.6, color: ACCENT }) + g.vhead('O', 'A') + g.vhead('O', 'B')
      + g.side('O', 'A', 'a', { bold: true, size: 16 }) + g.side('O', 'B', 'b', { bold: true, size: 16 }) + g.dot('P', 3.2)
      + g.name('O', 'O', { dir: [-1, 0.6] }) + g.name('A', 'A', { dir: [1, 0.4] }) + g.name('B', 'B', { dir: [0, -1] }) + g.name('P', 'P', { dir: [0.8, -0.6] }),
  });
  const ratioText = m === n ? '$P$ is the midpoint of $AB$' : `$P$ is the point on $AB$ such that $AP : PB = ${m} : ${n}$`;
  const tn = frac(m, n);
  const wrong = [
    vadd(V(1, 0), vmul(AB, tn.value() < 5 ? tn : frac(1, 2))), // used m/n
    vadd(V(1, 0), vmul(AB, frac(n, m + n))), // fraction the wrong way round
    vmul(V(1, 1), t), // forgot to start from A
    vadd(V(1, 0), vmul(V(1, 1), t)), // a + t(a + b)
    vmul(AB, t), vmul(OP, -1), vadd(V(0, 1), vmul(V(1, -1), t)), V(t, t), vmul(AB, frac(n, m + n)),
  ];
  return {
    prompt: `$OAB$ is a triangle. $\\overrightarrow{OA} = \\mathbf{a}$ and $\\overrightarrow{OB} = \\mathbf{b}$.<br>${ratioText}.<br>Write $\\overrightarrow{${askAP ? 'AP' : 'OP'}}$ in terms of $\\mathbf{a}$ and $\\mathbf{b}$. Give your answer in its simplest form.`,
    visual: vis,
    answer: vopt(ans),
    distractors: vDistractors(ans, wrong),
    typed: { kind: 'text', accept: vAccept(ans) },
    solution: [
      `$\\overrightarrow{AB} = \\overrightarrow{AO} + \\overrightarrow{OB} = -\\mathbf{a} + \\mathbf{b}$.`,
      `$P$ is $\\frac{${m}}{${m + n}}$ of the way from $A$ to $B$${m === n ? ' (halfway)' : ` (the ratio ${m} : ${n} has ${m + n} parts)`}: $\\overrightarrow{AP} = ${t.tex()}(-\\mathbf{a} + \\mathbf{b}) = ${vtex(AP)}$.`,
      ...(askAP ? [] : [`$\\overrightarrow{OP} = \\overrightarrow{OA} + \\overrightarrow{AP} = \\mathbf{a} + (${vtex(AP)}) = ${vtex(OP)}$`]),
      `Answer: ${vopt(ans)}`,
    ],
  };
}, { title: 'Points dividing a line in a ratio (midpoints too)' });

export const vgParallel = gen('trig-vg-parallel', 'trig-vector-geometry', (rng, d) => {
  const p = intExcept(rng, -4, 5, [0]); const q = intExcept(rng, -5, 5, [0, p]);
  const base = V(p, q);
  if (d !== 'hard') {
    const k = pick(rng, [2, 3, -2, -1, frac(1, 2), 4].filter((x) => !(x instanceof Frac) || (p % 2 === 0 && q % 2 === 0)));
    const ans = vmul(base, k);
    const kf = k instanceof Frac ? k : frac(k, 1);
    const kv = kf.value();
    const wrong = [V(base.p.mul(kf), base.q.add(kf)), V(base.q.mul(kf), base.p.mul(kf)), V(base.p.mul(kf), base.q.mul(kf.neg())), vadd(base, V(kf, kf)), V(base.p.mul(kf), base.q), V(base.p.add(1), base.q.add(1)), V(base.p.mul(kf.add(1)), base.q.mul(kf))];
    return {
      prompt: `Which of these vectors is parallel to $${vtex(base)}$?`,
      answer: vopt(ans),
      distractors: vDistractors(ans, wrong.filter((w) => !w.p.mul(base.q).eq(w.q.mul(base.p)))),
      solution: [
        'Parallel vectors are multiples of each other: <b>both</b> coefficients are multiplied by the same number.',
        `$${vtex(ans)} = ${tnum(kv)}(${vtex(base)})$ ✓`,
        'Adding the same number to each coefficient, or changing only one sign, does not give a parallel vector.',
        `Answer: ${vopt(ans)}`,
      ],
    };
  }
  // find k: (p a + k b) parallel to (P a + Q b) with P = m p
  const mlt = pick(rng, [2, 3, -2, 4]);
  const P = p * mlt; const Q = q * mlt;
  const kAns = q;
  return {
    prompt: `$\\overrightarrow{XY} = ${vtex(V(P, Q))}$ and $\\overrightarrow{XZ} = ${vtex(V(p, 0)).replace('\\mathbf{0}', '')}${p ? ' + ' : ''}k\\mathbf{b}$.<br>$X$, $Y$ and $Z$ lie on a straight line. Work out the value of $k$.`.replace('+ -', '- '),
    answer: num(kAns),
    distractors: [num(Q), num(q * 2 === Q ? -q : q * 2), num(-kAns), num(Q - P + p), num(kAns + 1), num(P)].filter((s) => s !== num(kAns)),
    typed: { kind: 'number', value: kAns },
    solution: [
      'If $X$, $Y$ and $Z$ are on a straight line, $\\overrightarrow{XZ}$ is a multiple of $\\overrightarrow{XY}$ (they are parallel and share the point $X$).',
      `Compare the $\\mathbf{a}$ parts: $${P} \\div ${p} = ${mlt}$, so $\\overrightarrow{XY} = ${mlt} \\times \\overrightarrow{XZ}$.`,
      `Then the $\\mathbf{b}$ parts must match too: $${Q} = ${mlt}k$, so $k = ${kAns}$.`,
      `Answer: <b>${kAns}</b>`,
    ],
  };
}, { title: 'Parallel vectors and collinear points' });

export const vgChain = gen('trig-vg-chain', 'trig-vector-geometry', (rng, d) => {
  // Quadrilateral PQRS with three known side vectors (some given against the direction of travel).
  const r = () => V(intExcept(rng, -3, 5, [0]), intExcept(rng, -3, 6, [0]));
  const PQ = r(); const QR = r(); const RS = r();
  const reversed = d === 'easy' ? [] : shuffle(rng, ['PQ', 'QR', 'RS']).slice(0, d === 'medium' ? 1 : 2);
  const shown = (name, v) => (reversed.includes(name) ? [name[1] + name[0], vmul(v, -1)] : [name, v]);
  const items = [shown('PQ', PQ), shown('QR', QR), shown('RS', RS)];
  const ask = d === 'hard' && chance(rng, 0.5) ? 'SQ' : 'PS';
  const ans = ask === 'PS' ? vadd(vadd(PQ, QR), RS) : vmul(vadd(QR, RS), -1);
  const pts = { P: [0, 0], Q: [2.4, -0.3], R: [3.3, 1.7], S: [0.6, 2.1] };
  const vis = fig({
    pts, rotate: pick(rng, [0, 0, 8, -8]), width: 380, height: 240,
    draw: (g) => {
      let out = g.poly('PQRS', { fillOpacity: 0.4 });
      if (ask === 'SQ') out += g.seg('S', 'Q', { dash: '5 4', width: 1.6, color: ACCENT });
      for (const [nm, v] of items) out += g.vhead(nm[0], nm[1]) + g.side(nm[0], nm[1], vtex(v).replace(/\\mathbf\{(\w)\}/g, '$1').replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '$1/$2').replace(/-/g, '−'), { bold: true, size: 15 });
      return out + g.polyNames('PQRS');
    },
  });
  const wrong = [vmul(ans, -1), vadd(vadd(PQ, QR), vmul(RS, -1)), vadd(vsub(PQ, QR), RS), vadd(vadd(items[0][1], items[1][1]), items[2][1]), vadd(PQ, RS), vsub(QR, PQ)];
  return {
    prompt: `In quadrilateral $PQRS$, ${items.map(([nm, v]) => `$\\overrightarrow{${nm}} = ${vtex(v)}$`).join(', ')}.<br>Work out $\\overrightarrow{${ask}}$ in terms of $\\mathbf{a}$ and $\\mathbf{b}$.`,
    visual: vis,
    answer: vopt(ans),
    distractors: vDistractors(ans, wrong),
    typed: { kind: 'text', accept: vAccept(ans) },
    solution: [
      ask === 'PS' ? 'Route: $P \\to Q \\to R \\to S$, so $\\overrightarrow{PS} = \\overrightarrow{PQ} + \\overrightarrow{QR} + \\overrightarrow{RS}$.' : 'Route: $S \\to R \\to Q$, so $\\overrightarrow{SQ} = \\overrightarrow{SR} + \\overrightarrow{RQ}$.',
      ...(() => {
        // the vectors the route needs, in the direction of travel
        const need = ask === 'PS' ? [['PQ', PQ], ['QR', QR], ['RS', RS]] : [['SR', vmul(RS, -1)], ['RQ', vmul(QR, -1)]];
        const given = new Set(items.map(([nm]) => nm));
        const flipped = need.filter(([nm]) => !given.has(nm));
        return flipped.length ? [`Reverse any vector given the other way (change every sign): ${flipped.map(([nm, v]) => `$\\overrightarrow{${nm}} = -\\overrightarrow{${nm[1]}${nm[0]}} = ${vtex(v)}$`).join(', ')}.`] : [];
      })(),
      `Collect the $\\mathbf{a}$ terms and the $\\mathbf{b}$ terms: $\\overrightarrow{${ask}} = ${vtex(ans)}$`,
      `Answer: ${vopt(ans)}`,
    ],
  };
}, { title: 'Chains of vectors round a shape' });

export const vgMidpoints = gen('trig-vg-midpoints', 'trig-vector-geometry', (rng, d) => {
  // Parallelogram OACB (letters renamed): OA = a, OB = b, so AC = b and BC = a.
  // M on AC with AM : MC = m : n; N on BC with BN : NC = r : s.
  const [O, A, C, B] = pick(rng, [['O', 'A', 'C', 'B'], ['O', 'P', 'R', 'Q'], ['O', 'A', 'B', 'C'], ['O', 'X', 'Z', 'Y']]);
  const [m, n] = d === 'easy' ? [1, 1] : pick(rng, d === 'medium' ? [[1, 1], [1, 2], [2, 1], [1, 3]] : [[1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2]]);
  const [r, s] = pick(rng, d === 'hard' ? [[1, 1], [1, 2], [2, 1], [1, 3]] : [[1, 1]]);
  const kind = d === 'easy' ? pick(rng, ['OM', 'BM']) : pick(rng, ['OM', 'BM', 'MN', 'MO']);
  const t = frac(m, m + n); const u = frac(r, r + s);
  const OM = V(1, t); const ON = V(u, 1);
  const ans = kind === 'OM' ? OM : kind === 'MO' ? vmul(OM, -1) : kind === 'BM' ? vsub(OM, V(0, 1)) : vsub(ON, OM);
  const label = { OM: `${O}M`, MO: `M${O}`, BM: `${B}M`, MN: 'MN' }[kind];
  const sk = 0.35 + 0.5 * rng();
  const pts = { [O]: [0, 0], [A]: [3, 0], [C]: [3 + 2 * sk, 2], [B]: [2 * sk, 2] };
  const Mp = [3 + 2 * sk * (m / (m + n)), 2 * (m / (m + n))];
  const Np = [2 * sk + 3 * (r / (r + s)), 2];
  const showN = kind === 'MN';
  const vis = fig({
    pts: { ...pts, M: Mp, ...(showN ? { N: Np } : {}) }, width: 370, height: 210, pad: 30,
    draw: (g) => g.poly([O, A, C, B], { fillOpacity: 0.45 }) + g.vhead(O, A) + g.vhead(O, B) + g.side(O, A, 'a', { bold: true, size: 16 }) + g.side(O, B, 'b', { bold: true, size: 16 })
      + g.dot('M') + (showN ? g.dot('N') + g.seg('M', 'N', { dash: '5 4', color: ACCENT, width: 1.6 }) : g.seg(kind === 'BM' ? B : O, 'M', { dash: '5 4', color: ACCENT, width: 1.6 }))
      + g.polyNames([O, A, C, B]) + g.name('M', 'M', { dir: [1, 0.15] }) + (showN ? g.name('N', 'N', { dir: [0, -1] }) : ''),
  });
  const mDesc = m === n ? `$M$ is the midpoint of $${A}${C}$` : `$M$ is on $${A}${C}$ with $${A}M : M${C} = ${m} : ${n}$`;
  const nDesc = showN ? (r === s ? ` and $N$ is the midpoint of $${B}${C}$` : ` and $N$ is on $${B}${C}$ with $${B}N : N${C} = ${r} : ${s}$`) : '';
  const wrong = [vmul(ans, -1), V(ans.q, ans.p), vadd(ans, V(0, frac(n, m + n))), vadd(ans, V(0, t.neg())), V(ans.p, ans.q.neg()), V(ans.p.neg(), ans.q), vadd(ans, V(1, 0)), V(1, frac(m, n)), V(1, frac(n, m + n))];
  const steps = [
    `Opposite sides of a parallelogram are equal and parallel: $\\overrightarrow{${A}${C}} = \\mathbf{b}$ and $\\overrightarrow{${B}${C}} = \\mathbf{a}$.`,
    `$\\overrightarrow{${A}M} = ${t.tex()}\\overrightarrow{${A}${C}} = ${vtex(V(0, t))}$${m === n ? ' (halfway)' : ` ($${A}${C}$ is split into ${m + n} parts)`}${showN ? `, and $\\overrightarrow{${B}N} = ${vtex(V(u, 0))}$` : ''}.`,
  ];
  if (kind === 'OM' || kind === 'MO') steps.push(`$\\overrightarrow{${O}M} = \\overrightarrow{${O}${A}} + \\overrightarrow{${A}M} = ${vtex(OM)}$${kind === 'MO' ? `, so $\\overrightarrow{M${O}} = -\\overrightarrow{${O}M} = ${vtex(ans)}$` : ''}`);
  else if (kind === 'BM') steps.push(`$\\overrightarrow{${B}M} = \\overrightarrow{${B}${O}} + \\overrightarrow{${O}${A}} + \\overrightarrow{${A}M} = -\\mathbf{b} + \\mathbf{a} + ${vtex(V(0, t))} = ${vtex(ans)}$`);
  else steps.push(`$\\overrightarrow{MN} = \\overrightarrow{M${O}} + \\overrightarrow{${O}N} = -(${vtex(OM)}) + (${vtex(ON)}) = ${vtex(ans)}$`);
  return {
    prompt: `$${O}${A}${C}${B}$ is a parallelogram. $\\overrightarrow{${O}${A}} = \\mathbf{a}$ and $\\overrightarrow{${O}${B}} = \\mathbf{b}$.<br>${mDesc}${nDesc}.<br>Write $\\overrightarrow{${label}}$ in terms of $\\mathbf{a}$ and $\\mathbf{b}$. Give your answer in its simplest form.`,
    visual: vis,
    answer: vopt(ans),
    distractors: vDistractors(ans, wrong),
    typed: { kind: 'text', accept: vAccept(ans) },
    solution: [...steps, `Answer: ${vopt(ans)}`],
  };
}, { title: 'Midpoints and ratio points in a parallelogram' });

export const columnVectorGenerators = [cvCombine, cvGrid, cvSolve, cvTranslate];
export const vectorGeometryGenerators = [vgPath, vgRatio, vgMidpoints, vgParallel, vgChain];

void [veq, num, ACCENT];
