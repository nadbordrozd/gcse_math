// Transformations unit: translations, reflections, rotations, enlargements (incl. negative), describing.
import { pick, int, shuffle, chance, tnum, frac, Frac } from '../../core.js';
import { plane } from '../../svg.js';
import { ggen, line, text, dot, cross, FILL, FILL2, ACCENT2, LABEL_SETS, wrongs, htext } from './diagrams.js';

/* ------------------------------------------------------------------ */
/* Geometry on the integer grid                                        */
/* ------------------------------------------------------------------ */

const SHAPES = [
  [[0, 0], [2, 0], [0, 3]],
  [[0, 0], [3, 0], [0, 2]],
  [[0, 0], [3, 0], [1, 2]],
  [[0, 0], [1, 0], [1, 2], [2, 2], [2, 3], [0, 3]],
  [[0, 0], [3, 0], [2, 2], [0, 2]],
  [[0, 0], [2, 0], [3, 2], [0, 1]],
  [[0, 0], [1, 0], [1, 1], [3, 1], [3, 2], [0, 2]],
  [[0, 0], [2, 0], [2, 1], [1, 3], [0, 3]],
];
const SMALL = [[[0, 0], [1, 0], [0, 2]], [[0, 0], [2, 0], [0, 1]], [[0, 0], [2, 0], [1, 1], [0, 1]], [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [0, 2]], [[0, 0], [2, 0], [0, 2]], [[0, 0], [1, 0], [2, 2], [0, 1]]];

const C = (p) => `$(${tnum(p[0])}, ${tnum(p[1])})$`;
const vecT = (v) => `\\begin{pmatrix} ${tnum(v[0])} \\\\ ${tnum(v[1])} \\end{pmatrix}`;
const VEC = (v) => `$${vecT(v)}$`;
const key = (pts) => pts.map((p) => `${p[0]},${p[1]}`).sort().join(';');

const T = {
  translate: (v) => (p) => [p[0] + v[0], p[1] + v[1]],
  reflect: (ln) => (p) => (ln.t === 'x' ? [2 * ln.v - p[0], p[1]] : ln.t === 'y' ? [p[0], 2 * ln.v - p[1]] : ln.t === 'yx' ? [p[1], p[0]] : [-p[1], -p[0]]),
  rotate: (ang, c) => (p) => {
    const x = p[0] - c[0]; const y = p[1] - c[1];
    if (ang === 180) return [c[0] - x, c[1] - y];
    if (ang === 90) return [c[0] + y, c[1] - x]; // 90 clockwise
    return [c[0] - y, c[1] + x]; // 270 clockwise = 90 anticlockwise
  },
  enlarge: (k, c) => (p) => {
    const kk = Frac.of(k);
    return [kk.mul(p[0] - c[0]).add(c[0]).value(), kk.mul(p[1] - c[1]).add(c[1]).value()];
  },
};
const lineName = (ln) => (ln.t === 'x' ? `x = ${tnum(ln.v)}` : ln.t === 'y' ? `y = ${tnum(ln.v)}` : ln.t === 'yx' ? 'y = x' : 'y = -x');
const lineNameS = (ln) => lineName(ln).replace('-', '−');
const rotName = (ang) => (ang === 180 ? '180°' : ang === 90 ? '90° clockwise' : '90° anticlockwise');
const rotNameT = (ang) => (ang === 180 ? '$180^\\circ$' : ang === 90 ? '$90^\\circ$ clockwise' : '$90^\\circ$ anticlockwise');

function inWindow(pts, w) { return pts.every(([x, y]) => x >= w.xmin && x <= w.xmax && y >= w.ymin && y <= w.ymax); }

/** Point in polygon (strictly inside, even-odd). */
function inside(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i]; const [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
/** True if any two polygons overlap (sampled on a fine grid) or touch along a big area. */
function overlapping(polys) {
  const box = (p) => [Math.min(...p.map((q) => q[0])), Math.max(...p.map((q) => q[0])), Math.min(...p.map((q) => q[1])), Math.max(...p.map((q) => q[1]))];
  const boxes = polys.map(box);
  for (let i = 0; i < polys.length; i += 1) {
    for (let j = i + 1; j < polys.length; j += 1) {
      const a = boxes[i]; const b = boxes[j];
      // keep at least one grid square between shapes (in x or in y) so they never touch
      if (!(a[1] + 1 <= b[0] || b[1] + 1 <= a[0] || a[3] + 1 <= b[2] || b[3] + 1 <= a[2])) return true;
      const x0 = Math.max(a[0], b[0]); const x1 = Math.min(a[1], b[1]); const y0 = Math.max(a[2], b[2]); const y1 = Math.min(a[3], b[3]);
      if (x0 >= x1 || y0 >= y1) continue;
      for (let x = x0 + 0.125; x < x1; x += 0.25) for (let y = y0 + 0.125; y < y1; y += 0.25) if (inside([x, y], polys[i]) && inside([x, y], polys[j])) return true;
    }
  }
  return false;
}

function shapeAt(rng, w, { small = false, margin = 0 } = {}) {
  let base = pick(rng, small ? SMALL : SHAPES);
  // random orientation (rotate/reflect the base so not always the same way up)
  const k = int(rng, 0, 3);
  for (let i = 0; i < k; i += 1) base = base.map(([x, y]) => [y, -x]);
  if (chance(rng, 0.5)) base = base.map(([x, y]) => [-x, y]);
  const mx = Math.min(...base.map((p) => p[0])); const my = Math.min(...base.map((p) => p[1]));
  base = base.map(([x, y]) => [x - mx, y - my]);
  const bw = Math.max(...base.map((p) => p[0])); const bh = Math.max(...base.map((p) => p[1]));
  const ox = int(rng, w.xmin + margin, w.xmax - bw - margin); const oy = int(rng, w.ymin + margin, w.ymax - bh - margin);
  return base.map(([x, y]) => [x + ox, y + oy]);
}

const centroidOf = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

/** Draw shapes on a coordinate grid. shapes: [{ pts, label, fill }]; lines: mirror lines; points: [{p, label}]. */
function gridFig(w, shapes, { lines = [], points = [], unitPx = 26 } = {}) {
  const pl = plane({ ...w, unitPx });
  let extra = '';
  for (const ln of lines) {
    const ends = ln.t === 'x' ? [[ln.v, w.ymin], [ln.v, w.ymax]] : ln.t === 'y' ? [[w.xmin, ln.v], [w.xmax, ln.v]]
      : ln.t === 'yx' ? [[Math.max(w.xmin, w.ymin), Math.max(w.xmin, w.ymin)], [Math.min(w.xmax, w.ymax), Math.min(w.xmax, w.ymax)]]
        : [[Math.max(w.xmin, -w.ymax), -Math.max(w.xmin, -w.ymax)], [Math.min(w.xmax, -w.ymin), -Math.min(w.xmax, -w.ymin)]];
    const [a, b] = ends.map(pl.P);
    extra += line(...a, ...b, { color: ACCENT2, width: 2.2, dash: '7 5' });
    const lp = ln.t === 'x' ? [b[0] + 4, b[1] + 12] : ln.t === 'y' ? [b[0] - 10, b[1] - 12] : [b[0] - 26, b[1] + (ln.t === 'yx' ? 10 : -10)];
    extra += htext(lp[0], lp[1], lineNameS(ln), { size: 13, italic: true, color: ACCENT2, anchor: ln.t === 'x' ? 'start' : 'middle' });
  }
  for (const s of shapes) {
    extra += pl.shape(s.pts, { fill: s.fill || FILL, width: 2 });
    if (s.label) { const c = pl.P(centroidOf(s.pts)); extra += htext(c[0], c[1], s.label, { size: 14, bold: true }); }
  }
  for (const q of points) {
    const P = pl.P(q.p);
    extra += q.cross ? cross(P[0], P[1], 5) : dot(P[0], P[1], 3.5);
    if (q.label) extra += htext(P[0] + (q.dx ?? 10), P[1] + (q.dy ?? -11), q.label, { size: 14, italic: true });
  }
  return pl.wrap(extra, { label: 'Coordinate grid' });
}

const W6 = { xmin: -6, xmax: 6, ymin: -6, ymax: 6 };
const W5 = { xmin: -5, xmax: 5, ymin: -5, ymax: 5 };

/** Pick a shape and transformation so the image stays in the window and doesn't overlap. */
function withImage(rng, w, makeT, { small = false, allowOverlap = false, tries = 200 } = {}) {
  for (let t = 0; t < tries; t += 1) {
    const A = shapeAt(rng, w, { small });
    const tf = makeT();
    const B = A.map(tf.f);
    if (!inWindow(B, w)) continue;
    if (key(A) === key(B)) continue;
    if (!allowOverlap && overlapping([A, B], w)) continue;
    return { A, B, tf };
  }
  throw new Error('no placement');
}

/** Candidates for "which shape is the image" questions. */
function whichQuestion(rng, w, A, correct, wrongImgs, labels) {
  const imgs = [correct, ...wrongImgs].filter((im) => inWindow(im, w) && key(im) !== key(A));
  const uniq = [];
  for (const im of imgs) if (!uniq.some((u) => key(u) === key(im))) uniq.push(im);
  if (uniq.length < 4 || key(uniq[0]) !== key(correct)) throw new Error('not enough candidates');
  const chosen = [uniq[0], ...shuffle(rng, uniq.slice(1)).slice(0, 3)];
  if (overlapping([A, ...chosen], w)) throw new Error('overlap');
  const order = shuffle(rng, [0, 1, 2, 3]);
  const shapes = [{ pts: A, label: 'A' }];
  order.forEach((ci, pos) => shapes.push({ pts: chosen[ci], label: labels[pos], fill: FILL2 }));
  const answer = labels[order.indexOf(0)];
  return { shapes, answer, others: labels.filter((l) => l !== answer) };
}
const LETTERS4 = [['B', 'C', 'D', 'E'], ['P', 'Q', 'R', 'S'], ['W', 'X', 'Y', 'Z'], ['F', 'G', 'H', 'J'], ['K', 'L', 'M', 'N']];

/* ================================================================== */
/* geo-translation                                                     */
/* ================================================================== */

const randVec = (rng, d) => {
  for (;;) {
    const v = [int(rng, -6, 6), int(rng, -6, 6)];
    if (d === 'easy' && (v[0] < 0 || v[1] < 0) && chance(rng, 0.5)) continue;
    if (v[0] !== 0 && v[1] !== 0 && Math.abs(v[0]) !== Math.abs(v[1])) return v;
  }
};

export const transVector = ggen('geo-trans-vector', 'geo-translation', (rng, d) => {
  const { A, B, tf } = withImage(rng, W6, () => { const v = randVec(rng, d); return { v, f: T.translate(v) }; });
  const v = tf.v;
  const rev = d === 'hard' && chance(rng, 0.4);
  const ans = rev ? [-v[0], -v[1]] : v;
  return {
    prompt: rev ? 'Write down the column vector that translates shape <b>B</b> onto shape <b>A</b>.' : 'Write down the column vector that translates shape <b>A</b> onto shape <b>B</b>.',
    visual: gridFig(W6, [{ pts: A, label: 'A' }, { pts: B, label: 'B', fill: FILL2 }]),
    answer: VEC(ans),
    distractors: [[ans[1], ans[0]], [-ans[0], -ans[1]], [ans[0], -ans[1]], [-ans[0], ans[1]], [ans[0] + 1, ans[1]], [ans[0], ans[1] - 1]].map(VEC),
    solution: [
      'Pick one vertex of the starting shape and find the matching vertex on the image.',
      `Count across: ${Math.abs(ans[0])} ${ans[0] > 0 ? 'right (positive)' : 'left (negative)'}. Count up/down: ${Math.abs(ans[1])} ${ans[1] > 0 ? 'up (positive)' : 'down (negative)'}.`,
      'The top number is the horizontal move, the bottom number is the vertical move.',
      `Answer: ${VEC(ans)}`,
    ],
  };
}, { title: 'Column vector of a translation' });

export const transPoint = ggen('geo-trans-point', 'geo-translation', (rng, d) => {
  const v = randVec(rng, d);
  if (d === 'hard' || chance(rng, 0.3)) {
    const p = [int(rng, -9, 9), int(rng, -9, 9)];
    const back = d === 'hard' && chance(rng, 0.5);
    const q = [p[0] + v[0], p[1] + v[1]];
    const [given, ans] = back ? [q, p] : [p, q];
    return {
      prompt: back ? `A point is translated by the vector $${vecT(v)}$. Its image is ${C(q)}.<br>What were the coordinates of the original point?` : `The point ${C(p)} is translated by the vector $${vecT(v)}$.<br>What are the coordinates of its image?`,
      answer: C(ans),
      distractors: [[given[0] - (back ? -v[0] : v[0]), given[1] - (back ? -v[1] : v[1])], [given[0] + v[1] * (back ? -1 : 1), given[1] + v[0] * (back ? -1 : 1)], [ans[0], given[1] - (ans[1] - given[1])], [given[0] - (ans[0] - given[0]), ans[1]], [ans[1], ans[0]]].map(C),
      typed: { kind: 'coord', x: ans[0], y: ans[1] },
      solution: back ? [`Undo the translation: subtract the vector.`, `$(${tnum(q[0])} - ${tnum(v[0])}, ${tnum(q[1])} - ${tnum(v[1])}) = (${tnum(p[0])}, ${tnum(p[1])})$`, `Answer: ${C(ans)}`]
        : [`Add the top number to the $x$-coordinate and the bottom number to the $y$-coordinate.`, `$(${tnum(p[0])} + ${tnum(v[0])}, ${tnum(p[1])} + ${tnum(v[1])}) = (${tnum(q[0])}, ${tnum(q[1])})$`, `Answer: ${C(ans)}`],
    };
  }
  const { A, B } = withImage(rng, W6, () => ({ v, f: T.translate(v) }), { allowOverlap: true });
  const i = int(rng, 0, A.length - 1); const P = A[i]; const Q = B[i];
  return {
    prompt: `Shape A is translated by the vector $${vecT(v)}$.<br>Vertex $P$ is marked. What are the coordinates of the image of $P$?`,
    visual: gridFig(W6, [{ pts: A, label: 'A' }], { points: [{ p: P, label: 'P' }] }),
    answer: C(Q),
    distractors: [[P[0] - v[0], P[1] - v[1]], [P[0] + v[1], P[1] + v[0]], [Q[1], Q[0]], [P[0] + v[0], P[1] - v[1]], [P[0] - v[0], P[1] + v[1]]].map(C),
    typed: { kind: 'coord', x: Q[0], y: Q[1] },
    solution: [`$P$ is at ${C(P)}.`, `Move ${Math.abs(v[0])} ${v[0] > 0 ? 'right' : 'left'} and ${Math.abs(v[1])} ${v[1] > 0 ? 'up' : 'down'}: $(${tnum(P[0])} + ${tnum(v[0])}, ${tnum(P[1])} + ${tnum(v[1])})$`, `Answer: ${C(Q)}`],
  };
}, { title: 'Image of a point under a translation' });

export const transWhich = ggen('geo-trans-which', 'geo-translation', (rng, d) => {
  let v; let q;
  for (let t = 0; t < 60 && !q; t += 1) {
    v = randVec(rng, d).map((x) => Math.max(-5, Math.min(5, x)));
    const A = shapeAt(rng, W6, { small: true });
    const mv = (u) => A.map(T.translate(u));
    const wrongImgs = [[v[1], v[0]], [-v[0], -v[1]], [v[0], -v[1]], [-v[0], v[1]], [v[0] + 1, v[1]], [v[0], v[1] + 1]].map(mv);
    wrongImgs.push(A.map(T.reflect({ t: 'x', v: A[0][0] + Math.round(v[0] / 2) })).map(T.translate([0, v[1]])));
    try { q = whichQuestion(rng, W6, A, mv(v), wrongImgs, pick(rng, LETTERS4)); } catch { q = null; }
  }
  if (!q) throw new Error('no translation candidates');
  return {
    prompt: `Shape A is translated by the vector $${vecT(v)}$.<br>Which shape is the image?`,
    visual: gridFig(W6, q.shapes, { unitPx: 25 }),
    answer: `Shape ${q.answer}`,
    distractors: q.others.map((l) => `Shape ${l}`),
    count: 4,
    solution: [`$${vecT(v)}$ means ${Math.abs(v[0])} ${v[0] > 0 ? 'right' : 'left'} and ${Math.abs(v[1])} ${v[1] > 0 ? 'up' : 'down'}.`, 'A translation slides the shape: it stays the same way round and the same size.', `Move one vertex of A by this amount — it lands on shape ${q.answer}.`, `Answer: Shape ${q.answer}`],
  };
}, { title: 'Which shape is the translation?' });

export const transCombine = ggen('geo-trans-combine', 'geo-translation', (rng, d) => {
  const a = randVec(rng, 'medium'); const b = randVec(rng, 'medium');
  const mode = d === 'easy' ? 'inverse' : pick(rng, ['inverse', 'combine', 'combine']);
  if (mode === 'inverse') {
    return {
      prompt: `The vector $${vecT(a)}$ translates shape A onto shape B.<br>Which vector translates shape B back onto shape A?`,
      answer: VEC([-a[0], -a[1]]),
      distractors: [a, [a[1], a[0]], [-a[0], a[1]], [a[0], -a[1]], [-a[1], -a[0]]].map(VEC),
      solution: ['To go back, reverse both movements: change the sign of both numbers.', `$${vecT(a)} \\to ${vecT([-a[0], -a[1]])}$`, `Answer: ${VEC([-a[0], -a[1]])}`],
    };
  }
  const s = [a[0] + b[0], a[1] + b[1]];
  if (s[0] === 0 || s[1] === 0) throw new Error('zero');
  return {
    prompt: `Shape A is translated by $${vecT(a)}$ and then the image is translated by $${vecT(b)}$.<br>Which single vector has the same effect?`,
    answer: VEC(s),
    distractors: [[a[0] - b[0], a[1] - b[1]], [b[0] - a[0], b[1] - a[1]], [a[0] + b[1], a[1] + b[0]], [a[0] * b[0], a[1] * b[1]], [s[1], s[0]]].map(VEC),
    solution: ['Doing one translation after another: add the vectors.', `$${vecT(a)} + ${vecT(b)} = ${vecT(s)}$ (add the top numbers, add the bottom numbers)`, `Answer: ${VEC(s)}`],
  };
}, { title: 'Combining and reversing translations' });

/* ================================================================== */
/* geo-reflection                                                      */
/* ================================================================== */

function randLine(rng, d, w = W6) {
  const kinds = d === 'easy' ? ['x', 'y', 'xaxis', 'yaxis'] : d === 'medium' ? ['x', 'y', 'yx', 'x', 'y'] : ['x', 'y', 'yx', 'ymx'];
  const k = pick(rng, kinds);
  if (k === 'xaxis') return { t: 'y', v: 0 };
  if (k === 'yaxis') return { t: 'x', v: 0 };
  if (k === 'yx') return { t: 'yx' };
  if (k === 'ymx') return { t: 'ymx' };
  return { t: k, v: int(rng, w.xmin + 2, w.xmax - 2) };
}
const lineWords = (ln) => (ln.t === 'y' && ln.v === 0 ? 'the $x$-axis' : ln.t === 'x' && ln.v === 0 ? 'the $y$-axis' : `the line $${lineName(ln)}$`);
const otherLines = (ln) => {
  const out = [];
  if (ln.t === 'x') out.push({ t: 'y', v: ln.v }, { t: 'x', v: -ln.v || ln.v + 1 }, { t: 'x', v: ln.v + 1 }, { t: 'yx' }, { t: 'x', v: ln.v - 1 });
  else if (ln.t === 'y') out.push({ t: 'x', v: ln.v }, { t: 'y', v: -ln.v || ln.v + 1 }, { t: 'y', v: ln.v - 1 }, { t: 'yx' }, { t: 'y', v: ln.v + 1 });
  else out.push(ln.t === 'yx' ? { t: 'ymx' } : { t: 'yx' }, { t: 'x', v: 0 }, { t: 'y', v: 0 }, { t: 'x', v: 1 }, { t: 'y', v: 1 });
  return out;
};

export const reflPoint = ggen('geo-refl-point', 'geo-reflection', (rng, d) => {
  const ln = randLine(rng, d);
  const { A, B } = withImage(rng, W6, () => ({ f: T.reflect(ln) }), { allowOverlap: true });
  const i = int(rng, 0, A.length - 1); const P = A[i]; const Q = B[i];
  if (P[0] === Q[0] && P[1] === Q[1]) throw new Error('invariant');
  const wrongPts = otherLines(ln).map((l) => T.reflect(l)(P));
  return {
    prompt: `Shape A is reflected in ${lineWords(ln)}.<br>What are the coordinates of the image of vertex $P$?`,
    visual: gridFig(W6, [{ pts: A, label: 'A' }], { lines: [ln], points: [{ p: P, label: 'P' }] }),
    answer: C(Q),
    distractors: [...wrongPts, [-P[0], -P[1]], [Q[1], Q[0]]].map(C),
    typed: { kind: 'coord', x: Q[0], y: Q[1] },
    solution: ln.t === 'x' || ln.t === 'y' ? [
      `$P$ is at ${C(P)}. The mirror line ${lineWords(ln)} is ${ln.t === 'x' ? 'vertical' : 'horizontal'}.`,
      `$P$ is ${Math.abs((ln.t === 'x' ? P[0] : P[1]) - ln.v)} square${Math.abs((ln.t === 'x' ? P[0] : P[1]) - ln.v) === 1 ? '' : 's'} from the line, so its image is the same distance on the other side.`,
      `Only the ${ln.t === 'x' ? '$x$' : '$y$'}-coordinate changes: image at ${C(Q)}.`,
      `Answer: ${C(Q)}`,
    ] : [
      `Reflecting in $${lineName(ln)}$ ${ln.t === 'yx' ? 'swaps the coordinates' : 'swaps the coordinates and changes both signs'}.`,
      `${C(P)} $\\to$ ${C(Q)}`,
      `Answer: ${C(Q)}`,
    ],
  };
}, { title: 'Image of a point under a reflection' });

export const reflWhich = ggen('geo-refl-which', 'geo-reflection', (rng, d) => {
  let ln; let q;
  for (let t = 0; t < 60 && !q; t += 1) {
    ln = randLine(rng, d);
    const A = shapeAt(rng, W6, { small: true });
    const correct = A.map(T.reflect(ln));
    const wrongImgs = [...otherLines(ln).map((l) => A.map(T.reflect(l))), A.map(T.rotate(180, [ln.t === 'x' ? ln.v : 0, ln.t === 'y' ? ln.v : 0])), A.map(T.translate([correct[0][0] - A[0][0], correct[0][1] - A[0][1]]))];
    try { q = whichQuestion(rng, W6, A, correct, wrongImgs, pick(rng, LETTERS4)); } catch { q = null; }
  }
  if (!q) throw new Error('no reflection candidates');
  return {
    prompt: `Shape A is reflected in ${lineWords(ln)}.<br>Which shape is the image?`,
    visual: gridFig(W6, q.shapes, { unitPx: 25 }),
    answer: `Shape ${q.answer}`,
    distractors: q.others.map((l) => `Shape ${l}`),
    count: 4,
    solution: [`Sketch ${lineWords(ln)}${ln.t === 'yx' || ln.t === 'ymx' ? ' (a diagonal line through the origin)' : ''}.`, 'Each vertex of the image is the same distance from the mirror line as the original, but on the opposite side. The image is flipped over.', `That gives shape ${q.answer}.`, `Answer: Shape ${q.answer}`],
  };
}, { title: 'Which shape is the reflection?' });

export const reflLine = ggen('geo-refl-line', 'geo-reflection', (rng, d) => {
  const ln = randLine(rng, d);
  const { A, B } = withImage(rng, W6, () => ({ f: T.reflect(ln) }));
  const ans = `$${lineName(ln)}$`;
  return {
    prompt: 'Shape A is reflected to give shape B.<br>What is the equation of the mirror line?',
    visual: gridFig(W6, [{ pts: A, label: 'A' }, { pts: B, label: 'B', fill: FILL2 }]),
    answer: ans,
    distractors: otherLines(ln).map((l) => `$${lineName(l)}$`),
    solution: [
      'The mirror line is exactly halfway between each vertex and its image.',
      ln.t === 'x' ? `Matching vertices have the same $y$-coordinate; their $x$-coordinates average to ${ln.v}, so the line is vertical: $x = ${ln.v}$.` : ln.t === 'y' ? `Matching vertices have the same $x$-coordinate; their $y$-coordinates average to ${ln.v}, so the line is horizontal: $y = ${ln.v}$.` : `Each vertex $(a, b)$ maps to ${ln.t === 'yx' ? '$(b, a)$' : '$(-b, -a)$'}, which is reflection in the diagonal line $${lineName(ln)}$.`,
      'Remember: $x = $ number lines are vertical, $y = $ number lines are horizontal.',
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Find the mirror line' });

/* ================================================================== */
/* geo-rotation                                                        */
/* ================================================================== */

const randRot = (rng, d) => pick(rng, d === 'easy' ? [180, 90, 270] : [90, 270, 180, 90, 270]);

export const rotPoint = ggen('geo-rot-point', 'geo-rotation', (rng, d) => {
  const ang = randRot(rng, d);
  const c = d === 'easy' ? [0, 0] : [int(rng, -3, 3), int(rng, -3, 3)];
  const { A, B } = withImage(rng, W6, () => ({ f: T.rotate(ang, c) }), { allowOverlap: true });
  const i = int(rng, 0, A.length - 1); const P = A[i]; const Q = B[i];
  if (P[0] === Q[0] && P[1] === Q[1]) throw new Error('invariant');
  const wrong = [T.rotate(ang === 90 ? 270 : ang === 270 ? 90 : 90, c)(P), T.rotate(ang, [0, 0])(P), T.rotate(180, c)(P), [-P[0], P[1]], [P[0], -P[1]], T.rotate(ang === 90 ? 270 : 90, [0, 0])(P)];
  const cIsO = c[0] === 0 && c[1] === 0;
  return {
    prompt: `Shape A is rotated ${rotNameT(ang)} about ${cIsO ? 'the origin' : `the point ${C(c)}`}.<br>What are the coordinates of the image of vertex $P$?`,
    visual: gridFig(W6, [{ pts: A, label: 'A' }], { points: [{ p: P, label: 'P' }, ...(cIsO ? [] : [{ p: c, cross: true, label: '', dx: 0 }])] }),
    answer: C(Q),
    distractors: wrong.map(C),
    typed: { kind: 'coord', x: Q[0], y: Q[1] },
    solution: [
      `From the centre ${C(c)}, $P$ is ${P[0] - c[0] >= 0 ? `${P[0] - c[0]} right` : `${c[0] - P[0]} left`} and ${P[1] - c[1] >= 0 ? `${P[1] - c[1]} up` : `${c[1] - P[1]} down`}.`,
      ang === 180 ? 'A half turn sends it the same distances the opposite way.' : `A quarter turn ${ang === 90 ? 'clockwise' : 'anticlockwise'} turns that movement: tracing paper helps!`,
      `So the image is ${Q[0] - c[0] >= 0 ? `${Q[0] - c[0]} right` : `${c[0] - Q[0]} left`} and ${Q[1] - c[1] >= 0 ? `${Q[1] - c[1]} up` : `${c[1] - Q[1]} down`} of the centre: ${C(Q)}.`,
      `Answer: ${C(Q)}`,
    ],
  };
}, { title: 'Image of a point under a rotation' });

export const rotWhich = ggen('geo-rot-which', 'geo-rotation', (rng, d) => {
  const ang = randRot(rng, d);
  const c = d === 'easy' ? [0, 0] : [int(rng, -2, 2), int(rng, -2, 2)];
  const A = shapeAt(rng, W6, { small: true });
  const correct = A.map(T.rotate(ang, c));
  const opp = ang === 90 ? 270 : ang === 270 ? 90 : 90;
  const wrongImgs = [A.map(T.rotate(opp, c)), A.map(T.rotate(ang === 180 ? 270 : 180, c)), A.map(T.rotate(ang, [c[0] + 1, c[1]])), A.map(T.rotate(ang, [0, 0])), A.map(T.reflect({ t: 'x', v: c[0] })), A.map(T.reflect({ t: 'y', v: c[1] }))];
  const labels = pick(rng, LETTERS4);
  const q = whichQuestion(rng, W6, A, correct, wrongImgs, labels);
  const cIsO = c[0] === 0 && c[1] === 0;
  return {
    prompt: `Shape A is rotated ${rotNameT(ang)} about ${cIsO ? 'the origin' : `${C(c)}, marked with a cross`}.<br>Which shape is the image?`,
    visual: gridFig(W6, q.shapes, { unitPx: 25, points: cIsO ? [] : [{ p: c, cross: true }] }),
    answer: `Shape ${q.answer}`,
    distractors: q.others.map((l) => `Shape ${l}`),
    count: 4,
    solution: [`Use tracing paper: trace shape A, put your pencil on the centre ${C(c)} and turn the paper ${ang === 180 ? 'half a turn' : `a quarter turn ${ang === 90 ? 'clockwise' : 'anticlockwise'}`}.`, 'Check the direction carefully — clockwise is the way clock hands move.', `The traced shape lands on shape ${q.answer}.`, `Answer: Shape ${q.answer}`],
  };
}, { title: 'Which shape is the rotation?' });

export const rotCentre = ggen('geo-rot-centre', 'geo-rotation', (rng, d) => {
  const ang = d === 'easy' ? 180 : randRot(rng, d);
  const c = [int(rng, -3, 3), int(rng, -3, 3)];
  const { A, B } = withImage(rng, W6, () => ({ f: T.rotate(ang, c) }));
  const wrong = [[0, 0], [c[1], c[0]], [c[0] + 1, c[1]], [c[0], c[1] - 1], [-c[0], -c[1]], [c[0] - 1, c[1] + 1]];
  return {
    prompt: `Shape A is rotated ${rotNameT(ang)} to give shape B.<br>What are the coordinates of the centre of rotation?`,
    visual: gridFig(W6, [{ pts: A, label: 'A' }, { pts: B, label: 'B', fill: FILL2 }]),
    answer: C(c),
    distractors: wrong.filter((p) => p[0] !== c[0] || p[1] !== c[1]).map(C),
    typed: { kind: 'coord', x: c[0], y: c[1] },
    solution: [
      'The centre of rotation is the one point that stays where it is.',
      ang === 180 ? 'For a half turn the centre is the midpoint of each vertex and its image.' : 'It is the same distance from each vertex and its image. Try likely points with tracing paper.',
      `Check: rotating A ${rotName(ang)} about ${C(c)} gives B.`,
      `Answer: ${C(c)}`,
    ],
  };
}, { title: 'Find the centre of rotation' });

/* ================================================================== */
/* geo-enlargement                                                     */
/* ================================================================== */

const WE = { xmin: 0, xmax: 12, ymin: 0, ymax: 10 };
const sfT = (k) => (k instanceof Frac ? (k.isInt ? tnum(k.n) : k.tex()) : tnum(k));

function enlargeSetup(rng, k, w = WE, { centre = null } = {}) {
  for (let t = 0; t < 300; t += 1) {
    const kv = Frac.of(k).value();
    const sc = Math.abs(kv) < 1 ? Frac.of(k).d : 1;
    let A = pick(rng, SMALL).map(([x, y]) => [x * sc, y * sc]);
    if (chance(rng, 0.5)) A = A.map(([x, y]) => [y, x]);
    const c = centre || [int(rng, w.xmin, w.xmax), int(rng, w.ymin, w.ymax)];
    const ox = int(rng, w.xmin, w.xmax - 3); const oy = int(rng, w.ymin, w.ymax - 3);
    A = A.map(([x, y]) => [x + ox, y + oy]);
    const B = A.map(T.enlarge(k, c));
    if (!B.every((p) => Number.isInteger(p[0]) && Number.isInteger(p[1]))) continue;
    if (!inWindow(A, w) || !inWindow(B, w)) continue;
    if (A.some((p) => p[0] === c[0] && p[1] === c[1])) continue;
    if (overlapping([A, B], w)) continue;
    return { A, B, c };
  }
  throw new Error('no enlargement');
}

export const enlScaleFactor = ggen('geo-enl-sf', 'geo-enlargement', (rng, d) => {
  const k = d === 'easy' ? pick(rng, [2, 3, 4]) : d === 'medium' ? pick(rng, [2, 3, 4, frac(1, 2)]) : pick(rng, [frac(1, 2), frac(1, 3), 3, frac(3, 2), frac(2, 3), frac(5, 2)]);
  const { A, B } = enlargeSetup(rng, k);
  const kk = Frac.of(k);
  const ans = `$${sfT(kk)}$`;
  return {
    prompt: 'Shape B is an enlargement of shape A.<br>What is the scale factor of the enlargement?',
    visual: gridFig(WE, [{ pts: A, label: 'A' }, { pts: B, label: 'B', fill: FILL2 }], { unitPx: 26 }),
    answer: ans,
    distractors: [kk.inv(), kk.add(1), kk.sub(1).value() > 0 ? kk.sub(1) : kk.add(2), kk.mul(kk), kk.mul(2), kk.neg()].filter((q) => !q.eq(kk)).map((q) => `$${sfT(q)}$`),
    solution: [
      'Scale factor = length on the image ÷ matching length on the original.',
      `Pick a side: it is ${kk.value() > 1 ? 'longer' : 'shorter'} on B. Comparing matching sides gives $${sfT(kk)}$.`,
      kk.value() < 1 ? 'B is smaller than A, so the scale factor is a fraction less than 1.' : 'B is bigger than A, so the scale factor is more than 1.',
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Scale factor of an enlargement' });

export const enlPoint = ggen('geo-enl-point', 'geo-enlargement', (rng, d) => {
  const k = d === 'easy' ? 2 : d === 'medium' ? pick(rng, [2, 3]) : pick(rng, [frac(1, 2), 3, frac(3, 2)]);
  const kk = Frac.of(k);
  const { A, B, c } = enlargeSetup(rng, k);
  const i = int(rng, 0, A.length - 1); const P = A[i]; const Q = B[i];
  const wrong = [[P[0] * kk.value(), P[1] * kk.value()], [c[0] + (P[0] - c[0]) + kk.value(), c[1] + (P[1] - c[1]) + kk.value()], [c[0] - kk.value() * (P[0] - c[0]), c[1] - kk.value() * (P[1] - c[1])], [Q[0] + 1, Q[1]], [P[0] + kk.value() * (P[0] - c[0]), P[1] + kk.value() * (P[1] - c[1])]].filter((p) => Number.isInteger(p[0] * 2) && Number.isInteger(p[1] * 2));
  return {
    prompt: `Shape A is enlarged by scale factor $${sfT(kk)}$ with centre ${C(c)}.<br>What are the coordinates of the image of vertex $P$?`,
    visual: gridFig(WE, [{ pts: A, label: 'A' }], { points: [{ p: P, label: 'P' }, { p: c, cross: true }] }),
    answer: C(Q),
    distractors: wrong.map(C),
    typed: { kind: 'coord', x: Q[0], y: Q[1] },
    solution: [
      `From the centre ${C(c)} to $P$ ${C(P)} is ${P[0] - c[0]} across and ${P[1] - c[1]} up.`,
      `Multiply this by the scale factor $${sfT(kk)}$: $${tnum(Q[0] - c[0])}$ across and $${tnum(Q[1] - c[1])}$ up.`,
      `Add to the centre: ${C(Q)}. (Multiplying the coordinates of $P$ only works when the centre is the origin.)`,
      `Answer: ${C(Q)}`,
    ],
  };
}, { title: 'Image of a point under an enlargement' });

export const enlCentre = ggen('geo-enl-centre', 'geo-enlargement', (rng, d) => {
  const k = d === 'hard' ? pick(rng, [frac(1, 2), 3, frac(1, 3)]) : pick(rng, [2, 3]);
  const { A, B, c } = enlargeSetup(rng, k);
  const kk = Frac.of(k);
  const wrong = [[0, 0], [c[0] + 1, c[1]], [c[0], c[1] + 1], [c[1], c[0]], [c[0] - 1, c[1] - 1], centroidOf(A).map(Math.round)];
  return {
    prompt: `Shape B is an enlargement of shape A with scale factor $${sfT(kk)}$.<br>What are the coordinates of the centre of enlargement?`,
    visual: gridFig(WE, [{ pts: A, label: 'A' }, { pts: B, label: 'B', fill: FILL2 }], { unitPx: 26 }),
    answer: C(c),
    distractors: wrong.filter((p) => p[0] !== c[0] || p[1] !== c[1]).map(C),
    typed: { kind: 'coord', x: c[0], y: c[1] },
    solution: [
      'Draw straight lines through matching vertices of A and B (ray lines).',
      'Extend them: they all cross at the centre of enlargement.',
      `They meet at ${C(c)}. Check: each vertex of B is $${sfT(kk)}$ times as far from ${C(c)} as the matching vertex of A.`,
      `Answer: ${C(c)}`,
    ],
  };
}, { title: 'Find the centre of enlargement' });

export const enlLengths = ggen('geo-enl-lengths', 'geo-enlargement', (rng, d) => {
  const k = d === 'easy' ? pick(rng, [2, 3, 4]) : d === 'medium' ? pick(rng, [2, 3, 1.5, 2.5, 0.5]) : pick(rng, [2, 3, 4, 0.5]);
  const a = int(rng, 2, 9); const b = int(rng, 2, 12);
  if (a === b) throw new Error('square');
  const mode = d === 'hard' ? pick(rng, ['area', 'perimeter']) : d === 'medium' ? pick(rng, ['side', 'perimeter']) : 'side';
  const shape = 'rectangle';
  const kT = tnum(k);
  if (mode === 'side') {
    const ans = a * k;
    return {
      prompt: `A ${shape} measures ${a} cm by ${b} cm. It is enlarged by scale factor $${kT}$.<br>What is the length of the shorter side of the enlarged ${shape}?`,
      answer: `$${tnum(ans)}$ cm`,
      distractors: wrongs(ans, [a + k, b * k, a * k * k, a / k, ans + 1, a * 2]).map((v) => `$${tnum(v)}$ cm`),
      typed: { kind: 'number', value: ans },
      solution: ['In an enlargement every length is multiplied by the scale factor.', `$${a} \\times ${kT} = ${tnum(ans)}$ cm`, `Answer: $${tnum(ans)}$ cm`],
    };
  }
  if (mode === 'perimeter') {
    const P = 2 * (a + b); const ans = P * k;
    return {
      prompt: `A ${shape} measures ${a} cm by ${b} cm. It is enlarged by scale factor $${kT}$.<br>Work out the perimeter of the enlarged ${shape}.`,
      answer: `$${tnum(ans)}$ cm`,
      distractors: wrongs(ans, [P + k, P * k * k, 2 * (a * k + b), a * b * k, P, ans + 2]).map((v) => `$${tnum(v)}$ cm`),
      typed: { kind: 'number', value: ans },
      solution: [`Original perimeter $= 2 \\times (${a} + ${b}) = ${P}$ cm`, `All lengths are multiplied by $${kT}$, so the perimeter is too: $${P} \\times ${kT} = ${tnum(ans)}$ cm`, `Answer: $${tnum(ans)}$ cm`],
    };
  }
  const Ar = a * b; const ans = Ar * k * k;
  return {
    prompt: `A ${shape} measures ${a} cm by ${b} cm. It is enlarged by scale factor $${kT}$.<br>Work out the area of the enlarged ${shape}.`,
    answer: `$${tnum(ans)}$ cm²`,
    distractors: wrongs(ans, [Ar * k, Ar + k, Ar * k * 2, Ar * k * k * k, (a + k) * (b + k)]).map((v) => `$${tnum(v)}$ cm²`),
    typed: { kind: 'number', value: ans },
    solution: [`The enlarged rectangle measures $${tnum(a * k)}$ cm by $${tnum(b * k)}$ cm.`, `Area $= ${tnum(a * k)} \\times ${tnum(b * k)} = ${tnum(ans)}$ cm²`, `(The area is multiplied by $${kT}^2 = ${tnum(k * k)}$, not by $${kT}$.)`, `Answer: $${tnum(ans)}$ cm²`],
  };
}, { title: 'Lengths, perimeter and area after enlargement' });

/* ================================================================== */
/* geo-describe-transformations                                        */
/* ================================================================== */

const descTranslate = (v) => `Translation by $${vecT(v)}$`;
const descReflect = (ln) => `Reflection in the line $${lineName(ln)}$`;
const descRotate = (ang, c) => `Rotation ${rotNameT(ang)} about ${C(c)}`;
const descEnlarge = (k, c) => `Enlargement, scale factor $${sfT(Frac.of(k))}$, centre ${C(c)}`;

export const descSingle = ggen('geo-desc-single', 'geo-describe-transformations', (rng, d) => {
  const kind = pick(rng, ['translate', 'reflect', 'rotate', 'rotate', 'reflect', ...(d === 'hard' ? ['enlarge'] : [])]);
  const w = kind === 'enlarge' ? WE : W6;
  let A; let B; let ans; let ds; let sol;
  if (kind === 'translate') {
    ({ A, B } = withImage(rng, w, () => { const v = randVec(rng, d); return { v, f: T.translate(v) }; }));
    const v = [B[0][0] - A[0][0], B[0][1] - A[0][1]];
    ans = descTranslate(v);
    ds = [descTranslate([v[1], v[0]]), descTranslate([-v[0], -v[1]]), descReflect({ t: 'x', v: Math.round((A[0][0] + B[0][0]) / 2) }), descRotate(180, [Math.round((A[0][0] + B[0][0]) / 2), Math.round((A[0][1] + B[0][1]) / 2)]), descTranslate([v[0], -v[1]])];
    sol = ['The shape has moved without turning or flipping, so it is a <b>translation</b>.', `Every vertex moves ${Math.abs(v[0])} ${v[0] > 0 ? 'right' : 'left'} and ${Math.abs(v[1])} ${v[1] > 0 ? 'up' : 'down'}.`];
  } else if (kind === 'reflect') {
    const ln = randLine(rng, d === 'easy' ? 'medium' : d);
    ({ A, B } = withImage(rng, w, () => ({ f: T.reflect(ln) })));
    ans = descReflect(ln);
    ds = [...otherLines(ln).slice(0, 3).map(descReflect), descRotate(180, [ln.t === 'x' ? ln.v : 0, ln.t === 'y' ? ln.v : 0]), descTranslate([B[0][0] - A[0][0], B[0][1] - A[0][1]])];
    sol = ['The shape has been flipped over, so it is a <b>reflection</b>. You must give the mirror line.', `Matching vertices are equal distances either side of $${lineName(ln)}$.`];
  } else if (kind === 'rotate') {
    const ang = randRot(rng, d); const c = [int(rng, -3, 3), int(rng, -3, 3)];
    ({ A, B } = withImage(rng, w, () => ({ f: T.rotate(ang, c) })));
    const opp = ang === 90 ? 270 : ang === 270 ? 90 : 90;
    ans = descRotate(ang, c);
    ds = [descRotate(opp, c), descRotate(ang, [c[1], c[0]].every((x, i) => x === c[i]) ? [c[0] + 1, c[1]] : [c[1], c[0]]), descRotate(ang, [0, 0].every((x, i) => x === c[i]) ? [1, 1] : [0, 0]), `Rotation ${rotNameT(ang)}`, descReflect({ t: 'x', v: c[0] })];
    sol = ['The shape has turned, so it is a <b>rotation</b>. A full description needs the angle, the direction and the centre.', `Tracing paper: pin it at ${C(c)} and turn ${rotName(ang)} — A lands on B.`];
  } else {
    const k = pick(rng, [2, 3, frac(1, 2)]);
    const st = enlargeSetup(rng, k); A = st.A; B = st.B; const c = st.c;
    ans = descEnlarge(k, c);
    ds = [descEnlarge(Frac.of(k).inv(), c), descEnlarge(k, [c[0] + 1, c[1]]), descEnlarge(k, [0, 0].every((x, i) => x === c[i]) ? [1, 1] : [0, 0]), `Enlargement, scale factor $${sfT(Frac.of(k))}$`, descTranslate([B[0][0] - A[0][0], B[0][1] - A[0][1]])];
    sol = ['The shape has changed size, so it is an <b>enlargement</b>. Give the scale factor and the centre.', `Ray lines through matching vertices meet at ${C(c)}; lengths are multiplied by $${sfT(Frac.of(k))}$.`];
  }
  return {
    prompt: 'Describe fully the <b>single</b> transformation that maps shape A onto shape B.',
    visual: gridFig(w, [{ pts: A, label: 'A' }, { pts: B, label: 'B', fill: FILL2 }]),
    answer: ans,
    distractors: ds.filter((t) => t !== ans),
    count: 4,
    solution: [...sol, `Answer: ${ans}`],
  };
}, { title: 'Describe a single transformation' });

/** Affine map from a point function: returns { M: [[a,b],[c,d]], t: [e,f] }. */
function affineOf(f) {
  const o = f([0, 0]); const ex = f([1, 0]); const ey = f([0, 1]);
  return { M: [[ex[0] - o[0], ey[0] - o[0]], [ex[1] - o[1], ey[1] - o[1]]], t: o };
}
/** Classify an affine isometry as a single transformation description, or null (glide reflection). */
function classify(f) {
  const { M, t } = affineOf(f);
  const [[a, b], [c, dd]] = M;
  const det = a * dd - b * c;
  if (a === 1 && dd === 1 && b === 0 && c === 0) return t[0] === 0 && t[1] === 0 ? null : { kind: 'translate', v: t, desc: descTranslate(t) };
  if (det === 1) {
    // rotation: solve (I - M) c = t
    const ang = a === -1 ? 180 : b === 1 ? 90 : 270; // M = [[0,1],[-1,0]] is 90 clockwise
    const A11 = 1 - a; const A12 = -b; const A21 = -c; const A22 = 1 - dd;
    const den = A11 * A22 - A12 * A21;
    const cx = (t[0] * A22 - A12 * t[1]) / den; const cy = (A11 * t[1] - A21 * t[0]) / den;
    if (!Number.isInteger(cx * 2) || !Number.isInteger(cy * 2)) return null;
    return { kind: 'rotate', ang, c: [cx, cy], desc: descRotate(ang, [cx, cy]) };
  }
  // reflection: must have a line of fixed points
  const cand = [];
  for (let v = -12; v <= 12; v += 0.5) cand.push({ t: 'x', v }, { t: 'y', v });
  cand.push({ t: 'yx' }, { t: 'ymx' });
  for (const ln of cand) {
    const g = T.reflect(ln);
    if ([[0, 0], [1, 0], [0, 1]].every((p) => { const q = f(p); const r = g(p); return Math.abs(q[0] - r[0]) < 1e-9 && Math.abs(q[1] - r[1]) < 1e-9; })) return { kind: 'reflect', ln, desc: descReflect(ln) };
  }
  return null;
}

export const descCombined = ggen('geo-desc-combined', 'geo-describe-transformations', (rng, d) => {
  const mk = () => {
    const kind = pick(rng, ['reflect', 'reflect', 'rotate', ...(d === 'hard' ? ['translate'] : [])]);
    if (kind === 'reflect') { const ln = randLine(rng, d === 'easy' ? 'easy' : 'hard', W5); return { f: T.reflect(ln), text: `a reflection in ${lineWords(ln)}` }; }
    if (kind === 'rotate') { const ang = randRot(rng, 'medium'); const c = d === 'easy' ? [0, 0] : [int(rng, -2, 2), int(rng, -2, 2)]; return { f: T.rotate(ang, c), text: `a rotation ${rotNameT(ang)} about ${c[0] === 0 && c[1] === 0 ? 'the origin' : C(c)}` }; }
    const v = randVec(rng, 'medium').map((x) => Math.max(-3, Math.min(3, x))); return { f: T.translate(v), text: `a translation by $${vecT(v)}$` };
  };
  for (let tries = 0; tries < 60; tries += 1) {
    const t1 = mk(); const t2 = mk();
    const comp = (p) => t2.f(t1.f(p));
    const cl = classify(comp);
    if (!cl || cl.desc.includes('.5')) continue;
    if (cl.kind === 'translate' && (Math.abs(cl.v[0]) > 8 || Math.abs(cl.v[1]) > 8)) continue;
    let A; let B;
    try { ({ A, B } = withImage(rng, W6, () => ({ f: comp }), { tries: 60 })); } catch { continue; }
    const ds = [];
    if (cl.kind === 'rotate') ds.push(descRotate(cl.ang === 90 ? 270 : cl.ang === 270 ? 90 : 90, cl.c), descRotate(cl.ang, [0, 0].every((x, i) => x === cl.c[i]) ? [1, 0] : [0, 0]), descReflect({ t: 'yx' }), descTranslate([B[0][0] - A[0][0], B[0][1] - A[0][1]]));
    if (cl.kind === 'reflect') ds.push(...otherLines(cl.ln).slice(0, 2).map(descReflect), descRotate(180, [0, 0]), descRotate(90, [0, 0]));
    if (cl.kind === 'translate') ds.push(descTranslate([-cl.v[0], -cl.v[1]]), descTranslate([cl.v[1], cl.v[0]]), descRotate(180, [0, 0]), descReflect({ t: 'y', v: 0 }));
    const uniq = [...new Set(ds.filter((x) => x !== cl.desc))];
    if (uniq.length < 3) continue;
    return {
      prompt: `Shape A is transformed by ${t1.text}, and then by ${t2.text}, giving shape B.<br>Which <b>single</b> transformation maps shape A onto shape B?`,
      visual: gridFig(W6, [{ pts: A, label: 'A' }, { pts: B, label: 'B', fill: FILL2 }]),
      answer: cl.desc,
      distractors: uniq,
      count: 4,
      solution: [
        'Carry out the first transformation on A, then the second on the result — the diagram shows the final shape B.',
        cl.kind === 'translate' ? 'B is the same way round as A, just moved: a translation.' : cl.kind === 'rotate' ? 'B has been turned compared with A: find the angle, direction and the centre (the point that ends up where it started).' : 'B is a mirror image of A: find the mirror line halfway between matching vertices.',
        `Check one vertex: ${C(A[0])} goes to ${C(B[0])}, which fits ${cl.desc.charAt(0).toLowerCase() + cl.desc.slice(1)}.`,
        `Answer: ${cl.desc}`,
      ],
    };
  }
  throw new Error('no combined transformation');
}, { title: 'Combined transformations' });

export const descInvariant = ggen('geo-desc-invariant', 'geo-describe-transformations', (rng, d) => {
  const A = shapeAt(rng, W5, { small: false });
  const vi = int(rng, 0, A.length - 1); const V = A[vi];
  const kind = pick(rng, d === 'easy' ? ['rotate', 'reflect'] : ['rotate', 'reflect', 'enlarge', 'reflectDiag']);
  let text1; let f;
  if (kind === 'rotate') { const ang = randRot(rng, d); text1 = `a rotation ${rotNameT(ang)} about ${C(V)}`; f = T.rotate(ang, V); } else if (kind === 'reflect') { const ln = chance(rng, 0.5) ? { t: 'x', v: V[0] } : { t: 'y', v: V[1] }; text1 = `a reflection in the line $${lineName(ln)}$`; f = T.reflect(ln); } else if (kind === 'enlarge') { const k = pick(rng, [2, 3, frac(1, 2)]); text1 = `an enlargement, scale factor $${sfT(Frac.of(k))}$, centre ${C(V)}`; f = T.enlarge(k, V); } else {
    if (V[0] !== V[1] && V[0] !== -V[1]) throw new Error('not on diagonal');
    const ln = V[0] === V[1] ? { t: 'yx' } : { t: 'ymx' }; text1 = `a reflection in the line $${lineName(ln)}$`; f = T.reflect(ln);
  }
  const fixed = A.filter((p) => { const q = f(p); return q[0] === p[0] && q[1] === p[1]; });
  if (fixed.length !== 1) throw new Error('more than one invariant');
  const letters = pick(rng, [['P', 'Q', 'R', 'S', 'T', 'U'], ['B', 'C', 'D', 'E', 'F', 'G'], ['J', 'K', 'L', 'M', 'N', 'O']]);
  const pts = A.map((p, i) => ({ p, label: letters[i] }));
  if (A.length > 6) throw new Error('too many');
  return {
    prompt: `Shape A is transformed by ${text1}.<br>Which vertex of shape A is <b>invariant</b> (stays in the same place)?`,
    visual: gridFig(W5, [{ pts: A, label: 'A' }], {
      points: pts.map((q) => {
        const g = centroidOf(A); const dx = q.p[0] - g[0]; const dy = q.p[1] - g[1]; const l = Math.hypot(dx, dy) || 1;
        return { p: q.p, label: q.label, dx: (dx / l) * 14, dy: (-dy / l) * 14 };
      }),
    }),
    answer: `$${letters[vi]}$`,
    distractors: letters.slice(0, A.length).filter((l, i) => i !== vi).map((l) => `$${l}$`),
    count: Math.min(4, A.length),
    solution: [
      'An invariant point is mapped onto itself.',
      kind === 'rotate' || kind === 'enlarge' ? `The centre of ${kind === 'rotate' ? 'rotation' : 'enlargement'} never moves, and it is the vertex at ${C(V)}.` : `Points <b>on</b> the mirror line don't move. Only the vertex at ${C(V)} lies on the line.`,
      `Answer: $${letters[vi]}$`,
    ],
  };
}, { title: 'Invariant points' });

/* ================================================================== */
/* geo-enlargement-negative                                            */
/* ================================================================== */

const WN = { xmin: -7, xmax: 7, ymin: -6, ymax: 6 };

export const negPoint = ggen('geo-neg-point', 'geo-enlargement-negative', (rng, d) => {
  const k = d === 'easy' ? -2 : d === 'medium' ? pick(rng, [-2, -1, -3]) : pick(rng, [frac(-1, 2), -3, frac(-1, 2), -2]);
  const kk = Frac.of(k);
  const st = enlargeSetup(rng, k, WN);
  const { A, B, c } = st;
  const i = int(rng, 0, A.length - 1); const P = A[i]; const Q = B[i];
  const pos = T.enlarge(kk.neg(), c)(P);
  const wrong = [pos, T.enlarge(k, [0, 0])(P), [P[0] * kk.value(), P[1] * kk.value()], [Q[0] + 1, Q[1]], [Q[0], Q[1] - 1], T.enlarge(kk.inv(), c)(P)].filter((p) => Number.isInteger(p[0] * 2) && Number.isInteger(p[1] * 2));
  return {
    prompt: `Shape A is enlarged by scale factor $${sfT(kk)}$ with centre ${C(c)}.<br>What are the coordinates of the image of vertex $P$?`,
    visual: gridFig(WN, [{ pts: A, label: 'A' }], { points: [{ p: P, label: 'P' }, { p: c, cross: true }], unitPx: 24 }),
    answer: C(Q),
    distractors: wrong.map(C),
    typed: { kind: 'coord', x: Q[0], y: Q[1] },
    solution: [
      `From the centre ${C(c)}, $P$ is ${P[0] - c[0]} across and ${P[1] - c[1]} up.`,
      `A negative scale factor sends the image to the <b>other side</b> of the centre: multiply by $${sfT(kk)}$ to get $${tnum(Q[0] - c[0])}$ across and $${tnum(Q[1] - c[1])}$ up.`,
      `Add to the centre: ${C(Q)}. The image is upside down.`,
      `Answer: ${C(Q)}`,
    ],
  };
}, { title: 'Image of a point, negative scale factor' });

export const negDescribe = ggen('geo-neg-describe', 'geo-enlargement-negative', (rng, d) => {
  const k = d === 'easy' ? -2 : pick(rng, d === 'medium' ? [-2, -3, -1] : [frac(-1, 2), -2, -3, frac(-1, 2)]);
  const kk = Frac.of(k);
  const { A, B, c } = enlargeSetup(rng, k, WN);
  const ans = kk.eq(-1) ? descEnlarge(k, c) : descEnlarge(k, c);
  const ds = [descEnlarge(kk.neg(), c), descEnlarge(kk.inv(), c), descEnlarge(k, [c[0] + 1, c[1]]), descEnlarge(k, [0, 0].every((x, i) => x === c[i]) ? [1, 1] : [0, 0])];
  if (kk.eq(-1)) ds.push(descRotate(90, c));
  return {
    prompt: 'Describe fully the single transformation that maps shape A onto shape B.',
    visual: gridFig(WN, [{ pts: A, label: 'A' }, { pts: B, label: 'B', fill: FILL2 }], { unitPx: 24 }),
    answer: ans,
    distractors: ds.filter((x) => x !== ans),
    count: 4,
    solution: [
      'B is on the opposite side of a point and upside down, so it is an enlargement with a <b>negative</b> scale factor.',
      `Lines through matching vertices cross at the centre ${C(c)}, which lies <b>between</b> A and B.`,
      `Lengths on B are $${sfT(kk.value() < 0 ? kk.neg() : kk)}$ times those on A, so the scale factor is $${sfT(kk)}$.${kk.eq(-1) ? ' (This is the same as a rotation of $180^\\circ$ about the centre.)' : ''}`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Describe an enlargement with a negative scale factor' });

export const negWhich = ggen('geo-neg-which', 'geo-enlargement-negative', (rng, d) => {
  const k = d === 'hard' ? pick(rng, [frac(-1, 2), -2]) : pick(rng, [-2, -1, -2]);
  const kk = Frac.of(k);
  for (let t = 0; t < 100; t += 1) {
    let st;
    try { st = enlargeSetup(rng, k, WN); } catch { continue; }
    const { A, B, c } = st;
    const cands = [T.enlarge(kk.neg(), c), T.enlarge(k, [c[0] + 1, c[1] + 1]), T.enlarge(kk.inv(), c), T.rotate(90, c), T.enlarge(k, [c[0] - 1, c[1]])].map((f) => A.map(f)).filter((im) => im.every((p) => Number.isInteger(p[0]) && Number.isInteger(p[1])));
    const labels = pick(rng, LETTERS4);
    let q;
    try { q = whichQuestion(rng, WN, A, B, cands, labels); } catch { continue; }
    return {
      prompt: `Shape A is enlarged by scale factor $${sfT(kk)}$, centre ${C(c)} (marked with a cross).<br>Which shape is the image?`,
      visual: gridFig(WN, q.shapes, { unitPx: 24, points: [{ p: c, cross: true }] }),
      answer: `Shape ${q.answer}`,
      distractors: q.others.map((l) => `Shape ${l}`),
      count: 4,
      solution: ['With a negative scale factor the image is on the opposite side of the centre and upside down.', `Each vertex of the image is $${sfT(kk.neg())}$ times as far from ${C(c)} as the original, in the opposite direction.`, `That is shape ${q.answer}.`, `Answer: Shape ${q.answer}`],
    };
  }
  throw new Error('no negative enlargement');
}, { title: 'Which shape is the negative enlargement?' });

export const transformGenerators = [
  transVector, transPoint, transWhich, transCombine,
  reflPoint, reflWhich, reflLine,
  rotPoint, rotWhich, rotCentre,
  enlScaleFactor, enlPoint, enlCentre, enlLengths,
  descSingle, descCombined, descInvariant,
  negPoint, negDescribe, negWhich,
];

void [text, LABEL_SETS];
