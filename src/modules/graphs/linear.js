// Coordinates and straight lines: coordinates, horizontal/vertical lines, tables of values, midpoints,
// gradient & intercept, equations of lines, parallel and perpendicular lines.
import { pick, int, chance, shuffle, sample, tnum, frac, Frac, table, gcd } from '../../core.js';
import { G, F, P, pt, lin, yeq, linAccept, T, uniq, fracEq } from './util.js';
import { coordGrid } from './diagrams.js';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVW'.split('');
const nz = (rng, lo, hi) => { let v = 0; while (v === 0) v = int(rng, lo, hi); return v; };
const par = (v) => (F(v).n < 0 ? `(${F(v).tex()})` : F(v).tex());
const Y = (eq) => `$${eq}$`;
/** "3 right and 2 down" */
const stepWords = (dx, dy) => [dx ? `${Math.abs(dx)} ${dx > 0 ? 'right' : 'left'}` : '', dy ? `${Math.abs(dy)} ${dy > 0 ? 'up' : 'down'}` : ''].filter(Boolean).join(' and ') || 'nowhere';

/* ================================================================== */
/* gr-coordinates                                                      */
/* ================================================================== */

function randomPoints(rng, k, R, { quadrantOne = false, distinct = true } = {}) {
  const pts = [];
  for (let t = 0; t < 400 && pts.length < k; t += 1) {
    const x = quadrantOne ? int(rng, 1, R) : int(rng, -R, R);
    const y = quadrantOne ? int(rng, 1, R) : int(rng, -R, R);
    if (distinct && pts.some((p) => (p[0] === x && p[1] === y) || (p[0] === y && p[1] === x) || Math.abs(p[0] - x) + Math.abs(p[1] - y) < 2)) continue;
    pts.push([x, y]);
  }
  return pts;
}

export const coordRead = G('gr-coord-read', 'gr-coordinates', (rng, d) => {
  const q1 = d === 'easy';
  const R = q1 ? 7 : 5;
  let target;
  if (q1) target = [int(rng, 1, 7), int(rng, 1, 7)];
  else if (d === 'medium') target = [nz(rng, -5, 5), nz(rng, -5, 5)];
  else target = chance(rng, 0.5) ? (chance(rng) ? [0, nz(rng, -5, 5)] : [nz(rng, -5, 5), 0]) : [nz(rng, -5, 5), nz(rng, -5, 5)];
  if (target[0] === target[1] || target[0] === -target[1] && target[0] !== 0 && d !== 'hard') throw new Error('retry');
  const others = randomPoints(rng, 3, R, { quadrantOne: q1 }).filter((p) => !(p[0] === target[0] && p[1] === target[1]));
  const pts = shuffle(rng, [target, ...others]);
  const letters = sample(rng, LETTERS, pts.length);
  const ti = pts.indexOf(target);
  const c = q1 ? coordGrid({ xmin: 0, xmax: 8, ymin: 0, ymax: 8, unit: 30 }) : coordGrid({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, unit: 26 });
  const marks = pts.map((p) => c.point(p[0], p[1], null, { cross: true })).join('') + pts.map((p, i) => c.smartLabel(p[0], p[1], letters[i])).join('');
  const [x, y] = target;
  const dist = [P(y, x), P(-x, y), P(x, -y), P(-y, -x), P(-x, -y), P(x + 1, y), P(x, y + 1)];
  return {
    prompt: `Write down the coordinates of point ${letters[ti]}.`,
    visual: c.wrap(marks),
    answer: P(x, y),
    distractors: uniq(dist, P(x, y)),
    typed: { kind: 'coord', x, y },
    solution: [
      'Coordinates are written $(x, y)$: go <b>across</b> first (x), then <b>up or down</b> (y). "Along the corridor, then up the stairs."',
      `From the origin, point ${letters[ti]} is ${x === 0 ? 'on the y-axis (0 across)' : `${Math.abs(x)} ${x > 0 ? 'right' : 'left'}`} and ${y === 0 ? 'on the x-axis (0 up)' : `${Math.abs(y)} ${y > 0 ? 'up' : 'down'}`}.`,
      `Answer: ${P(x, y)}`,
    ],
  };
}, { title: 'Read coordinates from a grid' });

export const coordWhichPoint = G('gr-coord-which-point', 'gr-coordinates', (rng, d) => {
  const q1 = d === 'easy';
  const x = q1 ? int(rng, 1, 7) : nz(rng, -5, 5); const y = q1 ? int(rng, 1, 7) : nz(rng, -5, 5);
  if (x === y || x === -y) throw new Error('retry');
  const decoys = q1 ? [[y, x], [x + 1, y], [x, y - 1]] : [[y, x], [-x, y], [x, -y], [-y, -x]];
  const pts = shuffle(rng, [[x, y], ...decoys.filter((p) => (q1 ? p[0] >= 1 && p[1] >= 1 && p[0] <= 7 && p[1] <= 7 : true))].slice(0, 5));
  const letters = sample(rng, LETTERS, pts.length);
  const ti = pts.findIndex((p) => p[0] === x && p[1] === y);
  const c = q1 ? coordGrid({ xmin: 0, xmax: 8, ymin: 0, ymax: 8, unit: 30 }) : coordGrid({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, unit: 26 });
  const marks = pts.map((p) => c.point(p[0], p[1], null, { cross: true })).join('') + pts.map((p, i) => c.smartLabel(p[0], p[1], letters[i])).join('');
  return {
    prompt: `Which point has coordinates ${P(x, y)}?`,
    visual: c.wrap(marks),
    answer: letters[ti],
    distractors: letters.filter((_, i) => i !== ti),
    count: Math.min(5, pts.length),
    solution: [
      `The first number is the $x$-coordinate (across), the second is the $y$-coordinate (up/down).`,
      `$x = ${x}$: go ${Math.abs(x)} ${x > 0 ? 'right' : 'left'}. $y = ${y}$: go ${Math.abs(y)} ${y > 0 ? 'up' : 'down'}.`,
      `Answer: ${letters[ti]}`,
    ],
  };
}, { title: 'Find the point with given coordinates' });

export const coordCompleteShape = G('gr-coord-complete-shape', 'gr-coordinates', (rng, d) => {
  const shape = d === 'easy' ? pick(rng, ['rectangle', 'square']) : d === 'medium' ? pick(rng, ['rectangle', 'parallelogram', 'square']) : pick(rng, ['parallelogram', 'kite', 'tiltsquare']);
  let A; let B; let C; let D;
  const lo = d === 'easy' ? 1 : -5; const hi = d === 'easy' ? 7 : 5;
  if (shape === 'rectangle') { const x1 = int(rng, lo, hi - 3); const y1 = int(rng, lo, hi - 2); const w = int(rng, 2, hi - x1); const h = int(rng, 2, hi - y1); if (w === h) throw new Error('r'); A = [x1, y1]; B = [x1 + w, y1]; C = [x1 + w, y1 + h]; D = [x1, y1 + h]; }
  else if (shape === 'square') { const s = int(rng, 2, 4); const x1 = int(rng, lo, hi - s); const y1 = int(rng, lo, hi - s); A = [x1, y1]; B = [x1 + s, y1]; C = [x1 + s, y1 + s]; D = [x1, y1 + s]; }
  else if (shape === 'parallelogram') { const w = int(rng, 3, 5); const h = int(rng, 2, 4); const sh = nz(rng, -2, 2); const x1 = int(rng, -5, 5 - w - Math.max(0, sh)); const y1 = int(rng, -5, 5 - h); A = [x1 - Math.min(0, sh), y1]; B = [A[0] + w, y1]; C = [B[0] + sh, y1 + h]; D = [A[0] + sh, y1 + h]; }
  else if (shape === 'kite') { const cx = int(rng, -2, 2); const top = int(rng, 3, 5); const w = int(rng, 1, 3); const midY = top - int(rng, 1, 2); const bot = int(rng, -5, midY - 3); A = [cx, top]; B = [cx + w, midY]; C = [cx, bot]; D = [cx - w, midY]; }
  else { const u = int(rng, 1, 3); const v = int(rng, 1, 3); const x1 = int(rng, -4, 4 - u); const y1 = int(rng, -5, 5 - u - v); A = [x1, y1]; B = [x1 + u, y1 + v]; C = [x1 + u - v, y1 + v + u]; D = [x1 - v, y1 + u]; }
  const all = [A, B, C, D];
  if (all.some((p) => Math.abs(p[0]) > (d === 'easy' ? 7 : 6) || Math.abs(p[1]) > (d === 'easy' ? 7 : 6) || (d === 'easy' && (p[0] < 0 || p[1] < 0)))) throw new Error('r');
  const name = shape === 'tiltsquare' ? 'square' : shape;
  const c = d === 'easy' ? coordGrid({ xmin: 0, xmax: 8, ymin: 0, ymax: 8, unit: 30 }) : coordGrid({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, unit: 26 });

  const lab = (p, l) => c.smartLabel(p[0], p[1], l);
  const vis = c.wrap(c.poly([A, B, C], { width: 2 }) + c.point(...A) + c.point(...B) + c.point(...C) + lab(A, 'A') + lab(B, 'B') + lab(C, 'C'));
  const dist = [P(A[0] + B[0] - C[0], A[1] + B[1] - C[1]), P(B[0] + C[0] - A[0], B[1] + C[1] - A[1]), P(D[1], D[0]), P(D[0], -D[1]), P(-D[0], D[1]), P(D[0] + 1, D[1]), P(D[0], D[1] - 1)];
  return {
    prompt: `A, B and C are three vertices of ${name === 'rectangle' ? 'a rectangle' : name === 'square' ? 'a square' : name === 'kite' ? 'a kite' : 'a parallelogram'} ABCD.<br>Work out the coordinates of D.`,
    visual: vis,
    answer: P(...D),
    distractors: uniq(dist, P(...D)),
    typed: { kind: 'coord', x: D[0], y: D[1] },
    solution: [
      name === 'kite' ? 'A kite has a line of symmetry through A and C, so D is the reflection of B in line AC.'
        : `In ${name === 'parallelogram' ? 'a parallelogram' : `a ${name}`}, opposite sides are equal and parallel, so the step from B to A is the same as the step from C to D.`,
      name === 'kite' ? `B is ${Math.abs(B[0] - A[0])} ${B[0] > A[0] ? 'right' : 'left'} of the line AC, so D is ${Math.abs(B[0] - A[0])} ${B[0] > A[0] ? 'left' : 'right'} of it, at the same height as B.`
        : `To get from B to A you go ${stepWords(A[0] - B[0], A[1] - B[1])}. Do the same from C${pt(...C)}.`,
      `D $= ${pt(...D)}$. Go round the letters in order — D joins to A and C, not to B.`,
      `Answer: ${P(...D)}`,
    ],
  };
}, { title: 'Complete a shape on a coordinate grid' });

export const coordMove = G('gr-coord-move', 'gr-coordinates', (rng, d) => {
  const mode = d === 'easy' ? 'translate' : pick(rng, ['translate', 'axis', 'axis', 'line']);
  const x = nz(rng, -5, 6); const y = nz(rng, -5, 6);
  if (mode === 'translate') {
    const dx = nz(rng, -5, 5); const dy = nz(rng, -5, 5);
    const nx = x + dx; const ny = y + dy;
    const words = `${Math.abs(dx)} ${Math.abs(dx) === 1 ? 'unit' : 'units'} ${dx > 0 ? 'right' : 'left'} and ${Math.abs(dy)} ${Math.abs(dy) === 1 ? 'unit' : 'units'} ${dy > 0 ? 'up' : 'down'}`;
    return {
      prompt: `Point P has coordinates ${P(x, y)}.<br>P is moved ${words}.<br>What are the new coordinates of P?`,
      answer: P(nx, ny),
      distractors: uniq([P(x + dy, y + dx), P(x - dx, y - dy), P(x + dx, y - dy), P(x - dx, y + dy), P(ny, nx), P(nx + 1, ny)], P(nx, ny)),
      typed: { kind: 'coord', x: nx, y: ny },
      solution: [
        'Moving right/left changes the $x$-coordinate; moving up/down changes the $y$-coordinate.',
        `$x$: $${x} ${dx > 0 ? '+' : '-'} ${Math.abs(dx)} = ${nx}$. $y$: $${y} ${dy > 0 ? '+' : '-'} ${Math.abs(dy)} = ${ny}$.`,
        `Answer: ${P(nx, ny)}`,
      ],
    };
  }
  if (mode === 'axis') {
    const toY = chance(rng, 0.5);
    const ans = toY ? [0, y] : [x, 0];
    return {
      prompt: `B is the point ${P(x, y)}.<br>A line is drawn from B that is <b>parallel to the ${toY ? 'x' : 'y'}-axis</b> and meets the ${toY ? 'y' : 'x'}-axis at point Q.<br>Work out the coordinates of Q.`,
      answer: P(...ans),
      distractors: uniq([P(ans[1], ans[0]), P(toY ? x : 0, toY ? 0 : y), P(toY ? 0 : y, toY ? x : 0), P(toY ? 0 : -x, toY ? -y : 0), P(x, y)], P(...ans)),
      typed: { kind: 'coord', x: ans[0], y: ans[1] },
      solution: [
        `A line parallel to the ${toY ? 'x' : 'y'}-axis is ${toY ? 'horizontal' : 'vertical'}, so the ${toY ? 'y' : 'x'}-coordinate stays the same: $${toY ? y : x}$.`,
        `Every point on the ${toY ? 'y' : 'x'}-axis has ${toY ? 'x' : 'y'}-coordinate $0$.`,
        `Answer: ${P(...ans)}`,
      ],
    };
  }
  // point on a segment: midpoint of horizontal/vertical segments / point one third along
  const len = pick(rng, [3, 4, 6]) * 2; const horiz = chance(rng);
  const A = [x, y]; const B = horiz ? [x + len, y] : [x, y + len];
  const k = pick(rng, [2, 3, 4].filter((q) => len % q === 0));
  const Q = horiz ? [x + len / k, y] : [x, y + len / k];
  return {
    prompt: `A is ${P(...A)} and B is ${P(...B)}.<br>Q is the point on AB that is $\\frac{1}{${k}}$ of the way from A to B.<br>Work out the coordinates of Q.`,
    answer: P(...Q),
    distractors: uniq([P(horiz ? x + len / 2 : x, horiz ? y : y + len / 2), P(horiz ? B[0] - len / k : x, horiz ? y : B[1] - len / k), P(Q[1], Q[0]), P(horiz ? len / k : x, horiz ? y : len / k), P(horiz ? x + k : x, horiz ? y : y + k)], P(...Q)),
    typed: { kind: 'coord', x: Q[0], y: Q[1] },
    solution: [
      `AB is ${horiz ? 'horizontal' : 'vertical'} with length $${len}$ (the ${horiz ? 'x' : 'y'}-coordinates go from $${horiz ? A[0] : A[1]}$ to $${horiz ? B[0] : B[1]}$).`,
      `$\\frac{1}{${k}}$ of $${len}$ is $${len / k}$, so move $${len / k}$ from A towards B.`,
      `Answer: ${P(...Q)}`,
    ],
  };
}, { title: 'Moving points and points on lines' });

/* ================================================================== */
/* gr-horizontal-vertical                                              */
/* ================================================================== */

const hvLines = (rng, d) => {
  const kinds = d === 'easy' ? ['x', 'y'] : d === 'medium' ? ['x', 'y', 'yx', 'ynx'] : ['x', 'y', 'yx', 'ynx', 'yxk'];
  const kind = pick(rng, kinds);
  const k = nz(rng, -5, 5);
  if (kind === 'x') return { kind, k, tex: `x = ${k}`, on: (p) => p[0] === k };
  if (kind === 'y') return { kind, k, tex: `y = ${k}`, on: (p) => p[1] === k };
  if (kind === 'yx') return { kind, k: 0, tex: 'y = x', on: (p) => p[0] === p[1] };
  if (kind === 'ynx') return { kind, k: 0, tex: 'y = -x', on: (p) => p[0] === -p[1] };
  return { kind, k, tex: `y = x ${k < 0 ? '-' : '+'} ${Math.abs(k)}`, on: (p) => p[1] === p[0] + k };
};

export const hvNameLine = G('gr-hv-name-line', 'gr-horizontal-vertical', (rng, d) => {
  const L = hvLines(rng, d);
  const c = coordGrid({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, unit: 24 });
  let draw; let labelAt;
  if (L.kind === 'x') { draw = c.lineEq(null, L.k); labelAt = [L.k + 0.6, 5.4]; }
  else if (L.kind === 'y') { draw = c.lineEq(0, L.k); labelAt = [5.4, L.k + 0.55]; }
  else if (L.kind === 'yx') { draw = c.lineEq(1, 0); labelAt = [4.6, 5.6]; }
  else if (L.kind === 'ynx') { draw = c.lineEq(-1, 0); labelAt = [-4.6, 5.6]; } else { draw = c.lineEq(1, L.k); labelAt = L.k > 0 ? [4.6 - L.k, 5.6] : [5.6, 5.6 + L.k + 0.4]; }
  const vis = c.wrap(draw + c.label(labelAt[0], labelAt[1], 'L', { bold: true, size: 16 }));
  const k = L.k;
  const dist = L.kind === 'x' ? [`x = ${-k}`, `y = ${k}`, `y = ${k}x`, `y = x + ${k}`.replace('+ -', '- '), `x = ${k}y`]
    : L.kind === 'y' ? [`y = ${-k}`, `x = ${k}`, `y = ${k}x`, `x = ${-k}`, `y = x + ${k}`.replace('+ -', '- ')]
      : L.kind === 'yx' ? ['y = -x', 'x = 0', 'y = 0', 'y = 1', 'x = 1', 'y = 2x'] : L.kind === 'ynx' ? ['y = x', 'y = -1', 'x = -1', 'x = 0', 'y = -2x']
        : [`y = x ${k < 0 ? '+' : '-'} ${Math.abs(k)}`, `y = ${k}x`, 'y = x', `y = -x ${k < 0 ? '-' : '+'} ${Math.abs(k)}`, `x = ${k}`, `y = ${k}`];
  return {
    prompt: 'What is the equation of line L?',
    visual: vis,
    answer: Y(L.tex),
    distractors: uniq(dist.map((e) => Y(e.replace(/= 1x/, '= x').replace(/= -1x/, '= -x'))), Y(L.tex)),
    solution: L.kind === 'x' ? [`Every point on L has $x$-coordinate $${k}$ (e.g. ${P(k, 2)}, ${P(k, -3)}).`, 'A <b>vertical</b> line has equation $x = \\text{number}$.', `Answer: $x = ${k}$`]
      : L.kind === 'y' ? [`Every point on L has $y$-coordinate $${k}$ (e.g. ${P(-2, k)}, ${P(4, k)}).`, 'A <b>horizontal</b> line has equation $y = \\text{number}$.', `Answer: $y = ${k}$`]
        : L.kind === 'yxk' ? [`Points on L: ${P(0, k)}, ${P(1, 1 + k)}, ${P(2, 2 + k)}.`, `The $y$-coordinate is always the $x$-coordinate ${k > 0 ? 'plus' : 'minus'} $${Math.abs(k)}$: it is the line $y = x$ moved ${k > 0 ? 'up' : 'down'} ${Math.abs(k)}.`, `Answer: $${L.tex}$`]
          : [`Points on L: ${L.kind === 'yx' ? `${P(1, 1)}, ${P(3, 3)}, ${P(-2, -2)}` : `${P(1, -1)}, ${P(3, -3)}, ${P(-2, 2)}`}.`, `The $y$-coordinate is always ${L.kind === 'yx' ? 'the same as' : 'the negative of'} the $x$-coordinate.`, `Answer: $${L.tex}$`],
  };
}, { title: 'Name a horizontal, vertical or diagonal line' });

export const hvPointOn = G('gr-hv-point-on', 'gr-horizontal-vertical', (rng, d) => {
  const L = hvLines(rng, d);
  const k = L.k;
  let good;
  if (L.kind === 'x') good = [k, nz(rng, -9, 9)];
  else if (L.kind === 'y') good = [nz(rng, -9, 9), k];
  else if (L.kind === 'yx') { const a = nz(rng, -6, 6); good = [a, a]; }
  else if (L.kind === 'ynx') { const a = nz(rng, -6, 6); good = [a, -a]; }
  else { const a = nz(rng, -4, 4); good = [a, a + k]; }
  if (good[0] === good[1] && L.kind !== 'yx') throw new Error('r');
  const cands = [[good[1], good[0]], [-good[0], good[1]], [good[0], -good[1]], [good[0] + 1, good[1]], [good[0], good[1] + 2], [-good[1], -good[0]], [good[1] - 1, good[0]]];
  const wrong = cands.filter((p) => !L.on(p)).map((p) => P(...p));
  if (chance(rng, 0.45) && (L.kind === 'x' || L.kind === 'y')) {
    // Reverse: which line does this point lie on?
    const [a, b] = good;
    if (a === b || a === -b || b === 0 || a === 0) throw new Error('r');
    const ans = Y(L.kind === 'x' ? `x = ${a}` : `y = ${b}`);
    const opts = [`x = ${a}`, `y = ${b}`, `x = ${b}`, `y = ${a}`, `x = ${-a}`, `y = ${-b}`, 'y = x', 'y = -x'].map(Y);
    return {
      prompt: `The point ${P(a, b)} lies on the line L.<br>L is ${L.kind === 'x' ? 'vertical' : 'horizontal'}.<br>What is the equation of L?`,
      answer: ans,
      distractors: uniq(opts, ans),
      solution: [
        L.kind === 'x' ? 'A vertical line has equation $x = \\text{number}$: every point on it has the same $x$-coordinate.' : 'A horizontal line has equation $y = \\text{number}$: every point on it has the same $y$-coordinate.',
        `The point ${P(a, b)} has $${L.kind === 'x' ? `x = ${a}` : `y = ${b}`}$.`,
        `Answer: ${ans}`,
      ],
    };
  }
  return {
    prompt: `Which of these points lies on the line $${L.tex}$?`,
    answer: P(...good),
    distractors: uniq(wrong, P(...good)),
    solution: [
      L.kind === 'x' ? `On the line $x = ${k}$ every point has $x$-coordinate $${k}$ (the <b>first</b> number).`
        : L.kind === 'y' ? `On the line $y = ${k}$ every point has $y$-coordinate $${k}$ (the <b>second</b> number).`
          : `Substitute each point's $x$ into $${L.tex}$ and check you get its $y$.`,
      `${P(...good)} fits: ${L.kind === 'x' ? `$x = ${good[0]}$` : L.kind === 'y' ? `$y = ${good[1]}$` : `$y = ${good[1]}$ when $x = ${good[0]}$`}.`,
      `Answer: ${P(...good)}`,
    ],
  };
}, { title: 'Points on horizontal, vertical and diagonal lines' });

export const hvIntersection = G('gr-hv-intersection', 'gr-horizontal-vertical', (rng, d) => {
  const a = nz(rng, -6, 6); const b = nz(rng, -6, 6);
  if (d === 'hard' && chance(rng, 0.6)) {
    const x1 = int(rng, -5, 1); const x2 = x1 + int(rng, 2, 6); const y1 = int(rng, -5, 1); const y2 = y1 + int(rng, 2, 6);
    const area = (x2 - x1) * (y2 - y1);
    return {
      prompt: `The lines $x = ${x1}$, $x = ${x2}$, $y = ${y1}$ and $y = ${y2}$ enclose a rectangle.<br>Work out the area of the rectangle.`,
      answer: `$${area}$ square units`,
      distractors: uniq([2 * ((x2 - x1) + (y2 - y1)), Math.abs(x1 * y1) + x2 * y2, Math.abs(x2 * y2), (x2 + x1) * (y2 + y1), area + (x2 - x1)].filter((v) => v > 0 && v !== area).map((v) => `$${v}$ square units`), `$${area}$ square units`),
      typed: { kind: 'number', value: area },
      solution: [
        `$x = ${x1}$ and $x = ${x2}$ are vertical lines, so the width is $${x2} - ${par(x1)} = ${x2 - x1}$.`,
        `$y = ${y1}$ and $y = ${y2}$ are horizontal lines, so the height is $${y2} - ${par(y1)} = ${y2 - y1}$.`,
        `Area $= ${x2 - x1} \\times ${y2 - y1} = ${area}$`,
        `Answer: $${area}$ square units`,
      ],
    };
  }
  const kind = d === 'easy' ? 'xy' : pick(rng, ['yx', 'ynx', 'xy']);
  let ans; let l1; let l2;
  if (kind === 'xy') { ans = [a, b]; l1 = `x = ${a}`; l2 = `y = ${b}`; if (chance(rng)) [l1, l2] = [l2, l1]; }
  else if (kind === 'yx') { if (chance(rng)) { ans = [a, a]; l1 = 'y = x'; l2 = `x = ${a}`; } else { ans = [b, b]; l1 = 'y = x'; l2 = `y = ${b}`; } }
  else if (chance(rng)) { ans = [a, -a]; l1 = 'y = -x'; l2 = `x = ${a}`; } else { ans = [-b, b]; l1 = 'y = -x'; l2 = `y = ${b}`; }
  if (ans[0] === ans[1] && kind === 'xy') throw new Error('r');
  const dist = [P(ans[1], ans[0]), P(-ans[0], ans[1]), P(ans[0], -ans[1]), P(-ans[0], -ans[1]), P(ans[0], 0), P(0, ans[1])];
  return {
    prompt: `The lines $${l1}$ and $${l2}$ intersect at point P.<br>Work out the coordinates of P.`,
    answer: P(...ans),
    distractors: uniq(dist, P(...ans)),
    typed: { kind: 'coord', x: ans[0], y: ans[1] },
    solution: [
      'P lies on <b>both</b> lines, so its coordinates must satisfy both equations.',
      kind === 'xy' ? `$x = ${ans[0]}$ fixes the $x$-coordinate and $y = ${ans[1]}$ fixes the $y$-coordinate.`
        : `${/x = /.test(l2) ? `$${l2}$ gives $x = ${ans[0]}$` : `$${l2}$ gives $y = ${ans[1]}$`}; then $${l1}$ gives the other coordinate.`,
      `Answer: ${P(...ans)}`,
    ],
  };
}, { title: 'Where lines like x = a and y = b meet' });

/* ================================================================== */
/* gr-table-plot                                                       */
/* ================================================================== */

export const tableValue = G('gr-table-value', 'gr-table-plot', (rng, d) => {
  const m = d === 'easy' ? int(rng, 2, 4) : d === 'medium' ? nz(rng, -4, 5) : pick(rng, [-3, -2, -1, 2, 3, 4, 5]);
  const c = d === 'easy' ? int(rng, 1, 6) : nz(rng, -6, 7);
  const half = d === 'hard' && chance(rng, 0.4);
  const xs = half ? [-1, -0.5, 0, 0.5, 1, 1.5, 2] : d === 'easy' ? [0, 1, 2, 3, 4] : [-2, -1, 0, 1, 2, 3];
  const ys = xs.map((x) => m * x + c);
  if (ys.some((v) => !Number.isInteger(v * 2))) throw new Error('r');
  const negX = xs.filter((x) => x < 0);
  const ask = d === 'easy' ? pick(rng, xs.filter((x) => x !== 0)) : negX.length && chance(rng, 0.7) ? pick(rng, negX) : pick(rng, xs.filter((x) => x !== 0));
  const ai = xs.indexOf(ask);
  const shown = xs.map((x, i) => (i === ai ? '$a$' : chance(rng, 0.45) && Math.abs(i - ai) > 1 ? '' : `$${tnum(ys[i])}$`));
  const ans = ys[ai];
  const eqn = `y = ${lin(m, c)}`;
  const dist = [-m * ask + c, m * ask - c, m + ask + c, m * Math.abs(ask) + c, ans + m, ans - m, m * (ask + c)].filter((v) => Number.isInteger(v * 2));
  return {
    prompt: `Here is a table of values for $${eqn}$.<br>Work out the value of $a$.`,
    visual: table([['$x$', ...xs.map((x) => `$${tnum(x)}$`)], ['$y$', ...shown]], { firstColHeader: true }),
    answer: T(ans),
    distractors: uniq(dist.map(T), T(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Substitute $x = ${tnum(ask)}$ into $${eqn}$.`,
      `$y = ${m === 1 ? '' : m === -1 ? '-' : `${m} \\times `}${par(ask)} ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${tnum(m * ask)} ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${tnum(ans)}$`,
      ask < 0 ? 'Careful with signs: a positive times a negative is negative, and a negative times a negative is positive.' : 'Check it fits the pattern: the $y$-values change by the gradient each time $x$ goes up by 1.',
      `Answer: $a = ${tnum(ans)}$`,
    ],
  };
}, { title: 'Complete a table of values' });

export const tableOnLine = G('gr-table-on-line', 'gr-table-plot', (rng, d) => {
  const m = d === 'easy' ? int(rng, 2, 5) : nz(rng, -5, 5);
  const c = nz(rng, -8, 9);
  const eqn = `y = ${lin(m, c)}`;
  const f = (x) => m * x + c;
  if (d !== 'easy' && chance(rng, 0.4)) {
    const x = nz(rng, -6, 6); const offset = pick(rng, [-3, -2, -1, 0, 1, 2, 3]);
    const y = f(x) + offset;
    const ans = offset > 0 ? 'Above the line' : offset < 0 ? 'Below the line' : 'On the line';
    return {
      prompt: `Is the point ${P(x, y)} above, below or on the line $${eqn}$?`,
      answer: ans,
      distractors: ['Above the line', 'Below the line', 'On the line'].filter((s) => s !== ans),
      count: 3,
      solution: [
        `Find the point on the line with the same $x$-coordinate: when $x = ${x}$, $y = ${m === 1 ? '' : `${m} \\times `}${par(x)} ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${f(x)}$.`,
        `The point has $y = ${y}$, which is ${offset > 0 ? 'more than' : offset < 0 ? 'less than' : 'equal to'} $${f(x)}$.`,
        `Answer: ${ans}`,
      ],
    };
  }
  const x = nz(rng, -5, 6); const good = [x, f(x)];
  const cands = [[f(x), x], [x, f(x) + 1], [-x, f(x)], [x, -m * x + c], [x, m * x - c], [x + 1, f(x)], [x, m + x + c]];
  const wrong = cands.filter((p) => p[1] !== f(p[0])).map((p) => P(...p));
  return {
    prompt: `Which of these points lies on the line $${eqn}$?`,
    answer: P(...good),
    distractors: uniq(wrong, P(...good)),
    solution: [
      'A point lies on the line if its coordinates make the equation true. Substitute the $x$-coordinate and see if you get the $y$-coordinate.',
      `For ${P(...good)}: $${m === 1 ? '' : `${m} \\times `}${par(x)} ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${f(x)}$ ✓`,
      `Answer: ${P(...good)}`,
    ],
  };
}, { title: 'Does a point lie on a line?' });

export const tableWhichEq = G('gr-table-which-eq', 'gr-table-plot', (rng, d) => {
  const m = d === 'easy' ? int(rng, 2, 5) : nz(rng, -5, 6);
  const c = d === 'easy' ? int(rng, 1, 9) : nz(rng, -8, 9);
  if (m === c || m === 1) throw new Error('r');
  const xs = d === 'easy' ? [1, 2, 3, 4, 5] : [-2, -1, 0, 1, 2, 3];
  const ys = xs.map((x) => m * x + c);
  const opt = (a, b) => Y(yeq(a, b));
  const y1 = m + c;
  const dist = [opt(1, m), opt(c, m), opt(m, -c), opt(m + 1, c - 1), opt(-m, c), opt(1, y1 - 1), opt(m, y1), opt(m, c + m)];
  return {
    prompt: 'The table shows some values of $x$ and $y$ for a straight line.<br>Which is the equation of the line?',
    visual: table([['$x$', ...xs.map((x) => `$${tnum(x)}$`)], ['$y$', ...ys.map((v) => `$${tnum(v)}$`)]], { firstColHeader: true }),
    answer: opt(m, c),
    distractors: uniq(dist, opt(m, c)),
    typed: { kind: 'text', accept: linAccept(m, c, 'x', 'y=') },
    solution: [
      `Each time $x$ goes up by 1, $y$ goes ${m > 0 ? 'up' : 'down'} by $${Math.abs(m)}$, so the gradient is $${m}$: $y = ${m === -1 ? '-' : m}x + c$.`,
      xs.includes(0) ? `When $x = 0$, $y = ${c}$, so $c = ${c}$.` : `When $x = 1$, $y = ${y1}$: $${m} + c = ${y1}$, so $c = ${c}$.`,
      `Check another pair: $x = ${xs[3]}$ gives $${m} \\times ${par(xs[3])} ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${ys[3]}$ ✓`,
      `Answer: $${yeq(m, c)}$`,
    ],
  };
}, { title: 'Match a table of values to an equation' });

export const tableReadGraph = G('gr-table-read', 'gr-table-plot', (rng, d) => {
  const m = d === 'easy' ? pick(rng, [1, 2, 3]) : pick(rng, [2, 3, -1, -2, frac(1, 2), frac(-1, 2)]);
  const M = F(m);
  const c = int(rng, -3, 4);
  const f = (x) => M.mul(x).add(c).value();
  const xs = []; for (let x = -5; x <= 5; x += 1) if (Number.isInteger(f(x)) && Math.abs(f(x)) <= 5 && x !== 0) xs.push(x);
  if (xs.length < 2) throw new Error('r');
  const x0 = pick(rng, xs); const y0 = f(x0);
  const askY = chance(rng, d === 'hard' ? 0.4 : 0.6);
  const cg = coordGrid({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, unit: 24 });
  const vis = cg.wrap(cg.lineEq(M.value(), c));
  const eqn = `y = ${lin(M, c)}`;
  const q = askY ? `Use the graph to find the value of $y$ when $x = ${x0}$.` : `Use the graph to find the value of $x$ when $y = ${y0}$.`;
  const ans = askY ? y0 : x0;
  const dist = askY ? [x0, -y0, y0 + 1, y0 - 1, c] : [y0, -x0, x0 + 1, x0 - 1, f(y0)];
  return {
    prompt: `Here is the graph of $${eqn}$.<br>${q}`,
    visual: vis,
    answer: T(ans),
    distractors: uniq(dist.filter((v) => Number.isInteger(v)).map(T), T(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      askY ? `Go along the $x$-axis to $x = ${x0}$, then ${y0 >= 0 ? 'up' : 'down'} to the line, then across to the $y$-axis.` : `Go along the $y$-axis to $y = ${y0}$, then across to the line, then ${x0 >= 0 ? 'down' : 'up'} to the $x$-axis.`,
      `Check with the equation: $${M.eq(1) ? '' : M.eq(-1) ? '-' : `${M.tex()} \\times `}${par(x0)}${c ? ` ${c < 0 ? '-' : '+'} ${Math.abs(c)}` : ''} = ${y0}$ ✓`,
      `Answer: $${askY ? 'y' : 'x'} = ${ans}$`,
    ],
  };
}, { title: 'Read values from a straight-line graph' });

/* ================================================================== */
/* gr-midpoint                                                         */
/* ================================================================== */

const mfmt = (v) => F(v);
export const midFind = G('gr-mid-find', 'gr-midpoint', (rng, d) => {
  const R = d === 'easy' ? [0, 12] : [-9, 12];
  const A = [int(rng, ...R), int(rng, ...R)]; const B = [int(rng, ...R), int(rng, ...R)];
  const even = (v) => (v % 2 === 0);
  if (d !== 'hard' && (!even(A[0] + B[0]) || !even(A[1] + B[1]))) throw new Error('r');
  if (d === 'hard' && even(A[0] + B[0]) && even(A[1] + B[1])) throw new Error('r');
  if (A[0] === B[0] || A[1] === B[1]) throw new Error('r');
  const M = [frac(A[0] + B[0], 2), frac(A[1] + B[1], 2)];
  const dec = (f) => tnum(f.value());
  const fmt = (p) => `$(${dec(p[0])}, ${dec(p[1])})$`;
  const dist = [[frac(B[0] - A[0], 2), frac(B[1] - A[1], 2)], [frac(A[0] + B[0]), frac(A[1] + B[1])], [M[1], M[0]], [frac(Math.abs(B[0] - A[0]), 2), frac(Math.abs(B[1] - A[1]), 2)], [M[0], frac(A[1] - B[1], 2)], [frac(A[0] + B[1], 2), frac(A[1] + B[0], 2)]];
  return {
    prompt: `A is the point ${P(...A)} and B is the point ${P(...B)}.<br>Work out the coordinates of the midpoint of AB.`,
    answer: fmt(M),
    distractors: uniq(dist.map(fmt), fmt(M)),
    typed: { kind: 'coord', x: M[0].value(), y: M[1].value() },
    solution: [
      'The midpoint is halfway between the points: <b>add</b> the coordinates and <b>halve</b> (find the mean).',
      `$x$: $\\frac{${A[0]} + ${par(B[0])}}{2} = \\frac{${A[0] + B[0]}}{2} = ${dec(M[0])}$`,
      `$y$: $\\frac{${A[1]} + ${par(B[1])}}{2} = \\frac{${A[1] + B[1]}}{2} = ${dec(M[1])}$`,
      `Answer: ${fmt(M)}`,
    ],
  };
}, { title: 'Midpoint of a line segment' });

export const midEndpoint = G('gr-mid-endpoint', 'gr-midpoint', (rng, d) => {
  const R = d === 'easy' ? [0, 10] : [-8, 10];
  const A = [int(rng, ...R), int(rng, ...R)]; const M = [int(rng, ...R), int(rng, ...R)];
  if (A[0] === M[0] || A[1] === M[1]) throw new Error('r');
  const B = [2 * M[0] - A[0], 2 * M[1] - A[1]];
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const dist = [mid(A, M), [M[0] - A[0], M[1] - A[1]], [M[0] + A[0], M[1] + A[1]], [2 * A[0] - M[0], 2 * A[1] - M[1]], [B[1], B[0]], [2 * M[0] + A[0], 2 * M[1] + A[1]]];
  if (d === 'hard' && chance(rng, 0.5)) {
    // unknowns in the coordinates
    const ask = pick(rng, ['p', 'q']);
    const ans = ask === 'p' ? B[0] : B[1];
    return {
      prompt: `The midpoint of AB is ${P(...M)}.<br>A is ${P(...A)} and B is $(p, q)$.<br>Work out the value of $${ask}$.`,
      answer: T(ans),
      distractors: uniq([ask === 'p' ? (A[0] + M[0]) / 2 : (A[1] + M[1]) / 2, ask === 'p' ? M[0] - A[0] : M[1] - A[1], ask === 'p' ? M[0] + A[0] : M[1] + A[1], ask === 'p' ? 2 * A[0] - M[0] : 2 * A[1] - M[1], ans + 1].filter(Number.isInteger).map(T), T(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `The midpoint's ${ask === 'p' ? 'x' : 'y'}-coordinate is the mean of A's and B's: $\\frac{${ask === 'p' ? A[0] : A[1]} + ${ask}}{2} = ${ask === 'p' ? M[0] : M[1]}$.`,
        `Multiply by 2: $${ask === 'p' ? A[0] : A[1]} + ${ask} = ${2 * (ask === 'p' ? M[0] : M[1])}$`,
        `$${ask} = ${ans}$`,
        `Answer: $${ask} = ${ans}$`,
      ],
    };
  }
  return {
    prompt: `M is the midpoint of the line segment AB.<br>A is ${P(...A)} and M is ${P(...M)}.<br>Work out the coordinates of B.`,
    answer: P(...B),
    distractors: uniq(dist.map((p) => `$(${tnum(p[0])}, ${tnum(p[1])})$`), P(...B)),
    typed: { kind: 'coord', x: B[0], y: B[1] },
    solution: [
      'From A to M is half the journey; B is the same step again <b>beyond</b> M.',
      `Step from A to M: $${M[0] - A[0] >= 0 ? '+' : ''}${M[0] - A[0]}$ in $x$, $${M[1] - A[1] >= 0 ? '+' : ''}${M[1] - A[1]}$ in $y$.`,
      `B $= (${M[0]} ${M[0] - A[0] >= 0 ? '+' : '-'} ${Math.abs(M[0] - A[0])}, ${M[1]} ${M[1] - A[1] >= 0 ? '+' : '-'} ${Math.abs(M[1] - A[1])}) = ${pt(...B)}$`,
      `Answer: ${P(...B)}`,
    ],
  };
}, { title: 'Find an endpoint from the midpoint' });

export const midGrid = G('gr-mid-grid', 'gr-midpoint', (rng, d) => {
  const q1 = d === 'easy';
  const lo = q1 ? 0 : -6; const hi = q1 ? 8 : 6;
  const A = [int(rng, lo, hi), int(rng, lo, hi)]; const B = [int(rng, lo, hi), int(rng, lo, hi)];
  const sx = A[0] + B[0]; const sy = A[1] + B[1];
  if (d !== 'hard' && (sx % 2 || sy % 2)) throw new Error('r');
  if (d === 'hard' && !(sx % 2) && !(sy % 2)) throw new Error('r');
  if (Math.abs(A[0] - B[0]) < 3 || Math.abs(A[1] - B[1]) < 2) throw new Error('r');
  const M = [sx / 2, sy / 2];
  const c = q1 ? coordGrid({ xmin: 0, xmax: 8, ymin: 0, ymax: 8, unit: 30 }) : coordGrid({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, unit: 26 });
  const vis = c.wrap(c.seg(A, B, { width: 2 }) + c.point(...A) + c.point(...B) + c.smartLabel(...A, 'A') + c.smartLabel(...B, 'B'));
  const fmt = (p) => `$(${tnum(p[0])}, ${tnum(p[1])})$`;
  const dist = [[(B[0] - A[0]) / 2, (B[1] - A[1]) / 2], [M[1], M[0]], [sx, sy], [Math.round(M[0]), Math.round(M[1])].map((v, i) => (v === M[i] ? v + 1 : v)), [M[0], M[1] + 1], [M[0] - 1, M[1]]];
  return {
    prompt: 'Write down the coordinates of the midpoint of AB.',
    visual: vis,
    answer: fmt(M),
    distractors: uniq(dist.map(fmt), fmt(M)),
    typed: { kind: 'coord', x: M[0], y: M[1] },
    solution: [
      `Read the coordinates: A is ${P(...A)} and B is ${P(...B)}.`,
      `Midpoint $= \\left(\\frac{${A[0]} + ${par(B[0])}}{2}, \\frac{${A[1]} + ${par(B[1])}}{2}\\right) = (${tnum(M[0])}, ${tnum(M[1])})$`,
      `Answer: ${fmt(M)}`,
    ],
  };
}, { title: 'Midpoint of a segment drawn on a grid' });

/* ================================================================== */
/* gr-gradient-intercept                                               */
/* ================================================================== */

export const giEquation = G('gr-gi-equation', 'gr-gradient-intercept', (rng, d) => {
  const askGrad = chance(rng, 0.65);
  const form = d === 'easy' ? pick(rng, ['std', 'std', 'rev']) : d === 'medium' ? pick(rng, ['rev', 'ky', 'sum']) : pick(rng, ['ky', 'sum', 'gen']);
  let m; let c; let eq; let steps;
  if (form === 'std') { m = nz(rng, -6, 7); c = nz(rng, -9, 9); eq = yeq(m, c); steps = [`It is already in the form $y = mx + c$.`]; }
  else if (form === 'rev') { m = nz(rng, -6, 6); c = nz(rng, 1, 12); eq = `y = ${c} ${m < 0 ? '-' : '+'} ${Math.abs(m) === 1 ? '' : Math.abs(m)}x`; steps = [`Rewrite as $y = ${lin(m, c)}$ — the number multiplying $x$ is the gradient, wherever it is written.`]; }
  else if (form === 'ky') { const k = int(rng, 2, 5); m = frac(nz(rng, -5, 6) * (chance(rng, 0.7) ? k : 1), k); c = frac(nz(rng, -5, 6) * k, k); eq = `${k}y = ${lin(m.mul(k), c.mul(k))}`; steps = [`Divide everything by $${k}$: $y = ${lin(m, c)}$.`]; }
  else if (form === 'sum') { const a = nz(rng, -6, 6); c = nz(rng, -9, 12); m = frac(-a); eq = `y ${a < 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}x = ${c}`; steps = [`Make $y$ the subject: $y = ${lin(m, c)}$.`]; }
  else { const k = int(rng, 2, 5); const a = nz(rng, -6, 6); const b = nz(rng, -10, 12); eq = `${k}y ${a < 0 ? '+' : '-'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}x = ${b}`; m = frac(a, k); c = frac(b, k); steps = [`Rearrange: $${k}y = ${lin(a, b)}$`, `Divide by $${k}$: $y = ${lin(m, c)}$.`]; }
  const M = F(m); const C = F(c);
  const opt = (v) => `$${F(v).tex()}$`;
  const ans = askGrad ? opt(M) : opt(C);
  const raw = eq.match(/^(\d+)y/); const k = raw ? Number(raw[1]) : 1;
  const dist = askGrad ? [opt(C), opt(M.neg()), opt(M.mul(k)), M.n !== 0 ? opt(M.inv()) : null, opt(C.mul(k)), opt(M.add(1))] : [opt(M), opt(C.neg()), opt(C.mul(k)), opt(M.mul(k)), opt(C.add(1)), opt(C.sub(1))];
  return {
    prompt: `What is the ${askGrad ? 'gradient' : '$y$-intercept'} of the line $${eq}$?`,
    answer: ans,
    distractors: uniq(dist, ans),
    typed: { kind: 'number', value: askGrad ? M : C },
    solution: [
      'Write the equation in the form $y = mx + c$: $m$ is the gradient and $c$ is the $y$-intercept.',
      ...steps,
      askGrad ? `The gradient is $${M.tex()}$.` : `The $y$-intercept is $${C.tex()}$ (the line crosses the $y$-axis at ${P(0, C)}).`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Gradient and intercept from an equation' });

export const giTwoPoints = G('gr-gi-two-points', 'gr-gradient-intercept', (rng, d) => {
  let dx; let dy;
  if (d === 'easy') { dx = int(rng, 1, 4); dy = dx * int(rng, 2, 4); }
  else if (d === 'medium') { dx = nz(rng, -4, 4); dy = dx * pick(rng, [-4, -3, -2, 2, 3, 5]); }
  else { do { dx = nz(rng, -6, 6); dy = nz(rng, -9, 9); } while (frac(dy, dx).d === 1 || Math.abs(dx) === Math.abs(dy)); }
  const lo = d === 'easy' ? 0 : -8;
  const A = [int(rng, Math.max(lo, lo - dx), Math.min(10, 10 - dx)), int(rng, Math.max(lo, lo - dy), Math.min(12, 12 - dy))];
  const B = [A[0] + dx, A[1] + dy];
  const g = frac(dy, dx);
  const opt = (f) => `$${f.tex()}$`;
  const dist = [frac(dx, dy), g.neg(), frac(dy), frac(dx), frac(A[1] + B[1], A[0] + B[0] || 1), frac(dx, dy).neg(), g.add(1)];
  return {
    prompt: `Work out the gradient of the straight line through ${P(...A)} and ${P(...B)}.`,
    answer: opt(g),
    distractors: uniq(dist.map(opt), opt(g)),
    typed: { kind: 'number', value: g },
    solution: [
      'Gradient $= \\dfrac{\\text{change in } y}{\\text{change in } x}$ ("rise over run").',
      `Change in $y$: $${B[1]} - ${par(A[1])} = ${dy}$. Change in $x$: $${B[0]} - ${par(A[0])} = ${dx}$.`,
      `Gradient $= ${fracEq(dy, dx)}$${g.n < 0 ? ' (negative: the line slopes down from left to right)' : ''}`,
      `Answer: $${g.tex()}$`,
    ],
  };
}, { title: 'Gradient from two points' });

export const giGraph = G('gr-gi-graph', 'gr-gradient-intercept', (rng, d) => {
  const sc = d === 'hard' ? pick(rng, [2, 5, 1]) : 1;
  const m = d === 'easy' ? frac(int(rng, 1, 3)) : d === 'medium' ? pick(rng, [frac(-1), frac(-2), frac(-3), frac(1, 2), frac(-1, 2), frac(2, 3), frac(3, 2)]) : pick(rng, [frac(-2, 3), frac(3, 4), frac(-3, 2), frac(1, 3), frac(-1, 4), frac(2), frac(-3)]);
  const M = m.mul(sc);
  const c = int(rng, -3, 3) * sc;
  // lattice points
  const pts = []; for (let x = -6; x <= 6; x += 1) { const y = M.mul(x).add(c).value(); if (Number.isInteger(y / sc) && Math.abs(y) <= 6 * sc) pts.push([x, y]); }
  if (pts.length < 2) throw new Error('r');
  const P1 = pts[0]; const P2 = pts[pts.length - 1];
  if (P2[0] - P1[0] < 3) throw new Error('r');
  const cg = coordGrid({ xmin: -6, xmax: 6, ymin: -6 * sc, ymax: 6 * sc, unit: 24, step: 1, ...(sc > 1 ? { ystep: sc, w: 12 * 24, h: 12 * 24, xstep: 1 } : {}) });
  const vis = cg.wrap(cg.lineEq(M.value(), c) + cg.point(...P1, null, { r: 3.5 }) + cg.point(...P2, null, { r: 3.5 }));
  const opt = (f) => `$${f.tex()}$`;
  const dist = [M.inv(), M.neg(), m, M.mul(sc), frac(c), M.inv().neg(), M.add(sc)];
  return {
    prompt: `Work out the gradient of the straight line shown.${sc > 1 ? ' <i>Look carefully at the scales.</i>' : ''}`,
    visual: vis,
    answer: opt(M),
    distractors: uniq(dist.filter((f) => !f.eq(M)).map(opt), opt(M)),
    typed: { kind: 'number', value: M },
    solution: [
      `Pick two points where the line crosses grid lines exactly, e.g. ${P(...P1)} and ${P(...P2)}.`,
      `Rise $= ${P2[1]} - ${par(P1[1])} = ${P2[1] - P1[1]}$${sc > 1 ? ` (use the numbers on the $y$-axis, not the number of squares — each square is ${sc} units)` : ''}. Run $= ${P2[0]} - ${par(P1[0])} = ${P2[0] - P1[0]}$.`,
      `Gradient $= \\frac{${P2[1] - P1[1]}}{${P2[0] - P1[0]}} = ${M.tex()}$${M.n < 0 ? ' — the line goes down from left to right, so the gradient is negative.' : ''}`,
      `Answer: $${M.tex()}$`,
    ],
  };
}, { title: 'Gradient from a graph' });

export const giIntercepts = G('gr-gi-intercepts', 'gr-gradient-intercept', (rng, d) => {
  const axis = d === 'easy' ? pick(rng, ['y', 'x']) : pick(rng, ['x', 'x', 'y']);
  let eq; let X0; let Y0; let steps;
  if (d === 'easy') {
    const m = nz(rng, 2, 6); X0 = int(rng, -5, 6) || 2; Y0 = -m * X0; eq = yeq(m, Y0);
    steps = axis === 'x' ? [`On the $x$-axis, $y = 0$: $0 = ${lin(m, Y0)}$`, `$${m}x = ${-Y0}$, so $x = ${X0}$.`] : [`On the $y$-axis, $x = 0$: $y = ${m} \\times 0 ${Y0 < 0 ? '-' : '+'} ${Math.abs(Y0)} = ${Y0}$.`];
  } else {
    const a = int(rng, 2, 6); const b = int(rng, 2, 6) * (d === 'hard' && chance(rng) ? -1 : 1);
    const k = a * b * pick(rng, [1, 2]) * (chance(rng) ? 1 : -1);
    X0 = k / a; Y0 = k / b;
    eq = `${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}y = ${k}`;
    steps = axis === 'x' ? [`On the $x$-axis, $y = 0$: $${a}x = ${k}$`, `$x = ${k} \\div ${a} = ${X0}$`] : [`On the $y$-axis, $x = 0$: $${b}y = ${k}$`, `$y = ${k} \\div ${par(b)} = ${Y0}$`];
  }
  if (X0 === 0 || Y0 === 0 || X0 === Y0) throw new Error('r');
  const ans = axis === 'x' ? [X0, 0] : [0, Y0];
  const dist = [axis === 'x' ? [0, X0] : [Y0, 0], axis === 'x' ? [0, Y0] : [X0, 0], axis === 'x' ? [Y0, 0] : [0, X0], axis === 'x' ? [-X0, 0] : [0, -Y0], axis === 'x' ? [X0 * 2, 0] : [0, Y0 * 2]];
  return {
    prompt: `The line $${eq}$ crosses the ${axis}-axis at point P.<br>Work out the coordinates of P.`,
    answer: P(...ans),
    distractors: uniq(dist.map((p) => P(...p)), P(...ans)),
    typed: { kind: 'coord', x: ans[0], y: ans[1] },
    solution: [...steps, `Answer: ${P(...ans)}`],
  };
}, { title: 'Where a line crosses the axes' });

/* ================================================================== */
/* gr-line-equation                                                    */
/* ================================================================== */

const eqOpt = (m, c) => Y(yeq(F(m), F(c)));

export const leqPointGradient = G('gr-leq-point-gradient', 'gr-line-equation', (rng, d) => {
  const m = d === 'hard' ? pick(rng, [frac(1, 2), frac(-1, 2), frac(2, 3), frac(-3, 4), frac(-2), frac(5)]) : frac(nz(rng, d === 'easy' ? 2 : -6, 7));
  const x1 = d === 'hard' ? pick(rng, [2, 4, 6, -2, -4, 3, -3]) * (m.d === 1 ? 1 : 1) : nz(rng, -5, 6);
  if (!Number.isInteger(m.mul(x1).value())) throw new Error('r');
  const c = int(rng, -10, 12);
  const y1 = m.mul(x1).add(c).value();
  if (c === y1) throw new Error('r');
  const ans = eqOpt(m, c);
  const dist = [eqOpt(m, y1), eqOpt(m, y1 + m.mul(x1).value()), eqOpt(m, y1 - x1), eqOpt(c, m), eqOpt(m, -c), eqOpt(m.neg(), y1 + m.mul(x1).value()), eqOpt(m, x1)];
  return {
    prompt: `A straight line has gradient $${m.tex()}$ and passes through the point ${P(x1, y1)}.<br>Work out the equation of the line. Give your answer in the form $y = mx + c$.`,
    answer: ans,
    distractors: uniq(dist, ans),
    typed: { kind: 'text', accept: linAccept(m, c, 'x', 'y=') },
    solution: [
      `The gradient is $${m.tex()}$, so the line is $y = ${lin(m, 0).replace(/^0$/, '')} + c$.`,
      `Substitute the point ${P(x1, y1)}: $${y1} = ${m.tex()} \\times ${par(x1)} + c = ${m.mul(x1).tex()} + c$`,
      `$c = ${y1} - ${par(m.mul(x1))} = ${c}$`,
      `Answer: $${yeq(m, c)}$`,
    ],
  };
}, { title: 'Equation from gradient and a point' });

export const leqTwoPoints = G('gr-leq-two-points', 'gr-line-equation', (rng, d) => {
  const m = d === 'easy' ? frac(int(rng, 2, 5)) : d === 'medium' ? frac(nz(rng, -5, 5)) : pick(rng, [frac(1, 2), frac(-1, 2), frac(3, 2), frac(-2, 3), frac(1, 3), frac(-3, 4)]);
  const c = int(rng, -8, 9);
  const x1 = int(rng, -4, 3) * m.d; const x2 = x1 + int(rng, 1, 3) * m.d;
  if (x1 === 0 || x2 === 0) throw new Error('r');
  const y1 = m.mul(x1).add(c).value(); const y2 = m.mul(x2).add(c).value();
  const ans = eqOpt(m, c);
  const mi = m.inv();
  const dist = [eqOpt(mi, y1 - mi.mul(x1).value()), eqOpt(m.neg(), y1 + m.mul(x1).value()), eqOpt(m, y1), eqOpt(m, -c), eqOpt(m, y1 + m.mul(x1).value()), eqOpt(m, c + 1), eqOpt(frac(y2 - y1), c)];
  return {
    prompt: `A straight line passes through the points ${P(x1, y1)} and ${P(x2, y2)}.<br>Work out the equation of the line.`,
    answer: ans,
    distractors: uniq(dist, ans),
    typed: { kind: 'text', accept: linAccept(m, c, 'x', 'y=') },
    solution: [
      `Gradient $= \\frac{${y2} - ${par(y1)}}{${x2} - ${par(x1)}} = \\frac{${y2 - y1}}{${x2 - x1}} = ${m.tex()}$`,
      `So $y = ${lin(m, 0)} + c$. Substitute ${P(x1, y1)}: $${y1} = ${m.mul(x1).tex()} + c$`,
      `$c = ${c}$`,
      `Answer: $${yeq(m, c)}$`,
    ],
  };
}, { title: 'Equation from two points' });

export const leqGraph = G('gr-leq-graph', 'gr-line-equation', (rng, d) => {
  const m = d === 'easy' ? frac(int(rng, 1, 3)) : d === 'medium' ? frac(nz(rng, -3, 3)) : pick(rng, [frac(1, 2), frac(-1, 2), frac(2, 3), frac(-3, 2), frac(-1, 3), frac(3, 4)]);
  const c = d === 'easy' ? int(rng, 1, 4) : nz(rng, -4, 4);
  const pts = []; for (let x = -6; x <= 6; x += 1) { const y = m.mul(x).add(c).value(); if (Number.isInteger(y) && Math.abs(y) <= 6) pts.push([x, y]); }
  if (pts.length < 2 || pts[pts.length - 1][0] - pts[0][0] < 3) throw new Error('r');
  const cg = coordGrid({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, unit: 24 });
  const xInt = m.n !== 0 ? frac(-c).div(m) : null;
  const vis = cg.wrap(cg.lineEq(m.value(), c));
  const ans = eqOpt(m, c);
  const dist = [eqOpt(m.neg(), c), eqOpt(m.inv(), c), eqOpt(m, -c), xInt && xInt.d === 1 ? eqOpt(m, xInt) : null, eqOpt(c, m), eqOpt(m.inv().neg(), c), eqOpt(m.add(1), c)];
  const A = pts[0]; const B = pts[pts.length - 1];
  return {
    prompt: 'Work out the equation of the straight line shown on the grid.',
    visual: vis,
    answer: ans,
    distractors: uniq(dist.filter(Boolean), ans),
    typed: { kind: 'text', accept: linAccept(m, c, 'x', 'y=') },
    solution: [
      `The line crosses the $y$-axis at ${P(0, c)}, so $c = ${c}$.`,
      `Use two points on the line, e.g. ${P(...A)} and ${P(...B)}: gradient $= ${fracEq(B[1] - A[1], B[0] - A[0])}$${m.n < 0 ? ' (it slopes downwards)' : ''}.`,
      `Answer: $${yeq(m, c)}$`,
    ],
  };
}, { title: 'Equation of a line from its graph' });

export const leqPointOnLine = G('gr-leq-point-on-line', 'gr-line-equation', (rng, d) => {
  const m = d === 'hard' ? frac(nz(rng, -4, 4), pick(rng, [1, 2])) : frac(nz(rng, -5, 5));
  const c = int(rng, -6, 8);
  const x1 = int(rng, -3, 2) * m.d; const x2 = x1 + int(rng, 1, 3) * m.d;
  const A = [x1, m.mul(x1).add(c).value()]; const B = [x2, m.mul(x2).add(c).value()];
  const k = pick(rng, [10, 12, 20, 25, 30, -10, -20, 50, 100]) * m.d;
  const ask = chance(rng) ? 'y' : 'x';
  const yk = m.mul(k).add(c).value();
  const ans = ask === 'y' ? yk : k;
  const prompt = ask === 'y'
    ? `A straight line passes through A${P(...A)} and B${P(...B)}.<br>The point C$(${k}, p)$ also lies on the line.<br>Work out the value of $p$.`
    : `A straight line passes through A${P(...A)} and B${P(...B)}.<br>The point C$(p, ${yk})$ also lies on the line.<br>Work out the value of $p$.`;
  const dist = ask === 'y' ? [m.neg().mul(k).add(c).value(), m.mul(k).value(), m.mul(k).sub(c).value(), m.inv().mul(k).add(c).value(), yk + m.value()] : [frac(yk + c).div(m).value(), frac(yk).div(m).value(), -k, m.mul(yk).add(c).value(), k + m.d];
  return {
    prompt,
    answer: T(ans),
    distractors: uniq(dist.filter((v) => Number.isInteger(v)).map(T), T(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Gradient of AB $= \\frac{${B[1]} - ${par(A[1])}}{${x2} - ${par(x1)}} = ${m.tex()}$, and substituting A gives $c = ${c}$: the line is $${yeq(m, c)}$.`,
      ask === 'y' ? `At $x = ${k}$: $p = ${m.tex()} \\times ${par(k)}${c ? ` ${c < 0 ? '-' : '+'} ${Math.abs(c)}` : ''} = ${yk}$` : `Solve $${yk} = ${lin(m, c)}$: $${lin(m, 0)} = ${yk - c}$, so $p = ${k}$.`,
      `Answer: $p = ${ans}$`,
    ],
  };
}, { title: 'Use the equation of a line through two points' });

/* ================================================================== */
/* gr-parallel-perpendicular                                           */
/* ================================================================== */

/** Display y = mx + c in a rearranged form for harder options. */
function rearranged(rng, m, c) {
  const M = F(m); const C = F(c);
  const k = M.d * C.d / gcd(M.d, C.d) * pick(rng, [1, 2]);
  const a = M.mul(k).value(); const b = C.mul(k).value();
  const forms = [
    () => `${k === 1 ? '' : k}y = ${lin(a, b)}`,
    () => (k === 1 ? `y ${a > 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}x = ${b}` : `${k}y ${a > 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}x = ${b}`),
  ];
  return pick(rng, forms)();
}

export const ppIdentify = G('gr-pp-identify', 'gr-parallel-perpendicular', (rng, d) => {
  const perp = d === 'easy' ? false : chance(rng, 0.55);
  const m = d === 'hard' ? pick(rng, [frac(2), frac(-3), frac(1, 2), frac(-2, 3), frac(3, 4), frac(4)]) : perp ? pick(rng, [frac(2), frac(3), frac(-4), frac(1, 2), frac(-1, 3), frac(5)]) : frac(nz(rng, -6, 6));
  if (m.eq(1) || m.eq(-1)) throw new Error('r');
  const c = nz(rng, -6, 6);
  const target = perp ? m.inv().neg() : m;
  const c2 = nz(rng, -9, 9);
  const show = (mm, cc) => (d === 'hard' && chance(rng, 0.5) ? rearranged(rng, mm, cc) : yeq(mm, cc));
  const ans = Y(show(target, c2));
  const wrongM = perp ? [m, m.inv(), m.neg(), m.inv().neg().neg()] : [m.neg(), m.inv(), frac(c), m.inv().neg(), m.add(1)];
  const dist = wrongM.filter((w) => !w.eq(target)).map((w) => Y(show(w, pick(rng, [c, c2, -c, nz(rng, -7, 7)]))));
  dist.push(Y(yeq(frac(c), m)));
  return {
    prompt: `Which of these lines is ${perp ? '<b>perpendicular</b>' : '<b>parallel</b>'} to the line $${yeq(m, c)}$?`,
    answer: ans,
    distractors: uniq(dist, ans),
    solution: [
      perp ? 'Perpendicular lines have gradients that multiply to $-1$: the new gradient is the <b>negative reciprocal</b> ("flip it and change the sign").' : 'Parallel lines have the <b>same gradient</b>; the intercept can be anything.',
      `The gradient of $${yeq(m, c)}$ is $${m.tex()}$, so we need gradient $${target.tex()}$.`,
      d === 'hard' ? 'Rearrange each option into $y = mx + c$ to read its gradient.' : 'Look at the number in front of $x$ in each option.',
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Spot parallel and perpendicular lines' });

export const ppParallelThrough = G('gr-pp-parallel-through', 'gr-parallel-perpendicular', (rng, d) => {
  const m = d === 'hard' ? pick(rng, [frac(1, 2), frac(-3, 2), frac(2, 3), frac(-1, 4)]) : frac(nz(rng, -5, 6));
  const c0 = nz(rng, -8, 8);
  const x1 = nz(rng, -4, 4) * m.d; const c = int(rng, -9, 10);
  const y1 = m.mul(x1).add(c).value();
  if (c === c0 || c === y1) throw new Error('r');
  const given = d === 'hard' && chance(rng) ? rearranged(rng, m, c0) : yeq(m, c0);
  const ans = eqOpt(m, c);
  const dist = [eqOpt(m, c0), eqOpt(m, y1), eqOpt(m.inv().neg(), y1 - m.inv().neg().mul(x1).value()), eqOpt(m, y1 + m.mul(x1).value()), eqOpt(m.neg(), y1 + m.mul(x1).value()), eqOpt(m, -c)];
  return {
    prompt: `Line L is parallel to $${given}$ and passes through ${P(x1, y1)}.<br>Work out the equation of line L.`,
    answer: ans,
    distractors: uniq(dist, ans),
    typed: { kind: 'text', accept: linAccept(m, c, 'x', 'y=') },
    solution: [
      `Parallel lines have the same gradient. ${given.startsWith('y =') ? '' : `Rearranging gives $${yeq(m, c0)}$, so `}the gradient is $${m.tex()}$.`,
      `Line L: $y = ${lin(m, 0)} + c$. Substitute ${P(x1, y1)}: $${y1} = ${m.mul(x1).tex()} + c$, so $c = ${c}$.`,
      `Answer: $${yeq(m, c)}$`,
    ],
  };
}, { title: 'Equation of a parallel line' });

export const ppPerpThrough = G('gr-pp-perp-through', 'gr-parallel-perpendicular', (rng, d) => {
  const m0 = pick(rng, [frac(2), frac(3), frac(4), frac(-2), frac(-3), frac(1, 2), frac(-1, 3), frac(2, 3), frac(-3, 4)]);
  const m = m0.inv().neg();
  const c0 = nz(rng, -6, 6);
  const x1 = nz(rng, -4, 4) * m.d; const c = int(rng, -8, 9);
  const y1 = m.mul(x1).add(c).value();
  if (c === y1) throw new Error('r');
  const ask = d === 'hard' ? pick(rng, ['xint', 'eq']) : 'eq';
  if (ask === 'xint') {
    if (m.n === 0) throw new Error('r');
    const xi = frac(-c).div(m);
    if (xi.d !== 1 || xi.n === 0) throw new Error('r');
    const xiW = frac(-c).div(m0);
    const dist = [xiW, frac(-c).div(m0.inv()), frac(c).div(m), frac(c), xi.add(1), frac(-y1).div(m)].filter((f) => !f.eq(xi));
    return {
      prompt: `Line A has equation $${yeq(m0, c0)}$.<br>Line B is perpendicular to line A and passes through the point ${P(x1, y1)}.<br>Work out the coordinates of the point where line B crosses the $x$-axis.`,
      answer: `$(${xi.tex()}, 0)$`,
      distractors: uniq([...dist.map((f) => `$(${f.tex()}, 0)$`), `$(0, ${c})$`], `$(${xi.tex()}, 0)$`),
      typed: { kind: 'coord', x: xi.value(), y: 0 },
      solution: [
        `Gradient of A is $${m0.tex()}$, so the perpendicular gradient is $${m.tex()}$ (negative reciprocal).`,
        `Line B: $y = ${lin(m, 0)} + c$ through ${P(x1, y1)} gives $c = ${c}$, so B is $${yeq(m, c)}$.`,
        `On the $x$-axis $y = 0$: $0 = ${lin(m, c)}$, so $x = ${xi.tex()}$.`,
        `Answer: $(${xi.tex()}, 0)$`,
      ],
    };
  }
  const ans = eqOpt(m, c);
  const dist = [eqOpt(m0, y1 - m0.mul(x1).value()), eqOpt(m0.inv(), y1 - m0.inv().mul(x1).value()), eqOpt(m0.neg(), y1 + m0.mul(x1).value()), eqOpt(m, y1), eqOpt(m, c0), eqOpt(m, -c)];
  return {
    prompt: `Line L is perpendicular to $${yeq(m0, c0)}$ and passes through ${P(x1, y1)}.<br>Work out the equation of line L.`,
    answer: ans,
    distractors: uniq(dist, ans),
    typed: { kind: 'text', accept: linAccept(m, c, 'x', 'y=') },
    solution: [
      `Gradient of $${yeq(m0, c0)}$ is $${m0.tex()}$. Perpendicular gradient $= ${m0.d === 1 && m0.n > 0 ? '' : `-\\frac{1}{${m0.n < 0 ? `(${m0.tex()})` : m0.tex()}} = `}${m.tex()}$ (flip it and change the sign).`,
      `Check: $${m0.tex()} \\times ${par(m)} = -1$ ✓`,
      `Substitute ${P(x1, y1)} into $y = ${lin(m, 0)} + c$: $${y1} = ${m.mul(x1).tex()} + c$, so $c = ${c}$.`,
      `Answer: $${yeq(m, c)}$`,
    ],
  };
}, { title: 'Equation of a perpendicular line' });

export const ppUnknown = G('gr-pp-unknown', 'gr-parallel-perpendicular', (rng, d) => {
  // Line through two points is perpendicular (or parallel) to another; find an unknown coordinate.
  const perp = d === 'easy' ? false : chance(rng, 0.7);
  const rise = nz(rng, -5, 6); const run = int(rng, 2, 5);
  const g0 = frac(rise, run);
  if (g0.n === 0) throw new Error('r');
  const P1 = [int(rng, -3, 4), int(rng, -3, 8)]; const P2 = [P1[0] + run, P1[1] + rise];
  const g = perp ? g0.inv().neg() : g0;
  const c = int(rng, -5, 10);
  const yT = c + g.n * pick(rng, [1, 2, 3, -1, -2]);
  const xT = frac(yT - c).div(g);
  if (xT.d !== 1 || xT.n === 0) throw new Error('r');
  const wrong = [frac(yT - c).div(g0), frac(yT - c).div(g.neg()), frac(yT - c).mul(g), frac(yT - c).div(g0.inv()), xT.add(1)].filter((f) => !f.eq(xT) && f.d === 1);
  return {
    prompt: `A straight line<br>&bull; is ${perp ? 'perpendicular' : 'parallel'} to the straight line through ${P(...P1)} and ${P(...P2)}<br>&bull; and passes through ${P(0, c)} and $(x, ${yT})$.<br>Work out the value of $x$.`,
    answer: T(xT),
    distractors: uniq(wrong.map(T), T(xT)),
    typed: { kind: 'number', value: xT },
    solution: [
      `Gradient through ${P(...P1)} and ${P(...P2)}: $${fracEq(rise, run)}$.`,
      perp ? `Perpendicular gradient $= ${g.tex()}$ (negative reciprocal).` : `Parallel, so the same gradient $${g.tex()}$.`,
      `The line is $${yeq(g, c)}$ (it passes through ${P(0, c)}). Set $y = ${yT}$: $${lin(g, 0)} = ${yT - c}$.`,
      `$x = ${xT.tex()}$`,
      `Answer: $${xT.tex()}$`,
    ],
  };
}, { title: 'Parallel/perpendicular lines with an unknown coordinate' });

export const linearGenerators = [
  coordRead, coordWhichPoint, coordCompleteShape, coordMove,
  hvNameLine, hvPointOn, hvIntersection,
  tableValue, tableOnLine, tableWhichEq, tableReadGraph,
  midFind, midEndpoint, midGrid,
  giEquation, giTwoPoints, giGraph, giIntercepts,
  leqPointGradient, leqTwoPoints, leqGraph, leqPointOnLine,
  ppIdentify, ppParallelThrough, ppPerpThrough, ppUnknown,
];

void [Frac, mfmt];
