// Properties of shapes unit: 2D properties, symmetry, 3D shapes & nets, plans & elevations, constructions & loci.
import { pick, int, shuffle, chance, sample, tnum, num, roundTo } from '../../core.js';
import { plane } from '../../svg.js';
import {
  ggen, svg, line, polygon, path, text, dot, circle, figure, place, polar, add, sub, scale, mid, centroid, unit,
  rightMark, equalTicks, parallelArrows, arcLabel, htext, panelGrid, LABEL_SETS, squareGrid, polyFromAngles,
  FILL, FILL2, ACCENT, ACCENT2, MUTED, GRID, SHADE, wrongs, textWidth,
} from './diagrams.js';
import { polyhedronFig, regularPrism, regularPyramid, boxSolid, isoStack, cylinderFig, coneFig, sphereFig } from './solids.js';

const C = (p) => `$(${tnum(p[0])}, ${tnum(p[1])})$`;

/** Fit a list of polygons (maths coords) into a box at (x0, y0, w, h). Returns markup. */
function drawPolys(polys, x0, y0, w, h, { fill = FILL, pad = 14, marks = null } = {}) {
  const all = polys.flat();
  const pl = place(all, { width: w, height: h, pad });
  let out = '';
  for (const p of polys) out += polygon(p.map(pl.map).map(([x, y]) => [x + x0, y + y0]), { fill, width: 2 });
  if (marks) out += marks((p) => { const q = pl.map(p); return [q[0] + x0, q[1] + y0]; });
  return out;
}

/* ================================================================== */
/* geo-2d-properties                                                   */
/* ================================================================== */

const QUAD_DRAW = {
  Square: { pts: [[0, 0], [3, 0], [3, 3], [0, 3]], ticks: [[0, 1], [1, 2], [2, 3], [3, 0]], rights: [0, 1, 2, 3] },
  Rectangle: { pts: [[0, 0], [4.5, 0], [4.5, 2.5], [0, 2.5]], ticks2: [[[0, 1], [2, 3]], [[1, 2], [3, 0]]], rights: [0, 1, 2, 3] },
  Rhombus: { pts: [[0, 0], [3, 0], [4.6, 2.5], [1.6, 2.5]], ticks: [[0, 1], [1, 2], [2, 3], [3, 0]], arrows: [[[0, 1], [3, 2]], [[0, 3], [1, 2]]] },
  Parallelogram: { pts: [[0, 0], [4, 0], [5.3, 2.4], [1.3, 2.4]], ticks2: [[[0, 1], [3, 2]], [[1, 2], [0, 3]]], arrows: [[[0, 1], [3, 2]], [[0, 3], [1, 2]]] },
  Kite: { pts: [[0, 0], [1.6, 1.6], [0, 4.3], [-1.6, 1.6]], ticks2: [[[0, 1], [3, 0]], [[1, 2], [2, 3]]] },
  Trapezium: { pts: [[0, 0], [5, 0], [3.6, 2.4], [0.8, 2.4]], arrows: [[[0, 1], [3, 2]]] },
  'Isosceles trapezium': { pts: [[0, 0], [5, 0], [3.8, 2.4], [1.2, 2.4]], arrows: [[[0, 1], [3, 2]]], ticks: [[1, 2], [3, 0]] },
  'Equilateral triangle': { pts: [[0, 0], [4, 0], [2, 3.46]], ticks: [[0, 1], [1, 2], [2, 0]] },
  'Isosceles triangle': { pts: [[0, 0], [3, 0], [1.5, 3.8]], ticks: [[1, 2], [2, 0]] },
  'Scalene triangle': { pts: [[0, 0], [5, 0], [1.3, 2.6]] },
  'Right-angled triangle': { pts: [[0, 0], [4.5, 0], [0, 3]], rights: [0] },
};

const DESCRIPTIONS = [
  ['All four sides are equal and all four angles are right angles.', 'Square'],
  ['Opposite sides are equal, all angles are right angles, but the sides are not all equal.', 'Rectangle'],
  ['All four sides are equal but the angles are not right angles.', 'Rhombus'],
  ['Two pairs of parallel sides, no right angles and the sides are not all equal.', 'Parallelogram'],
  ['Two pairs of equal sides next to each other, and no parallel sides.', 'Kite'],
  ['Exactly one pair of parallel sides.', 'Trapezium'],
  ['Exactly one pair of parallel sides, and the other two sides are equal.', 'Isosceles trapezium'],
  ['Its diagonals are equal in length but do not cross at right angles.', 'Rectangle'],
  ['Its diagonals cross at right angles, and it has exactly one line of symmetry.', 'Kite'],
  ['It has rotational symmetry of order 2 but no lines of symmetry.', 'Parallelogram'],
  ['Its diagonals are equal and cross at right angles.', 'Square'],
  ['It has four lines of symmetry.', 'Square'],
  ['Its diagonals cross at right angles and bisect each other, but are not equal.', 'Rhombus'],
];
const TRI_ANGLE_TYPES = (a, b, c) => {
  const s = [a, b, c];
  if (s.includes(90)) return 'Right-angled triangle';
  if (a === b && b === c) return 'Equilateral triangle';
  if (a === b || b === c || a === c) return 'Isosceles triangle';
  return 'Scalene triangle';
};
const ALL_NAMES = Object.keys(QUAD_DRAW);

export const shapeName = ggen('geo-2d-name-shape', 'geo-2d-properties', (rng, d) => {
  const mode = d === 'easy' ? 'diagram' : d === 'medium' ? pick(rng, ['diagram', 'describe', 'triAngles']) : pick(rng, ['describe', 'triAngles', 'describe']);
  if (mode === 'diagram') {
    const name = pick(rng, ALL_NAMES);
    const s = QUAD_DRAW[name];
    const rot = (pick(rng, [0, 0, 15, -15, 30, -25, 90]) * Math.PI) / 180;
    const pts = s.pts.map(([x, y]) => [x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)]);
    const W = 340; const H = 240;
    const pl = place(pts, { width: W, height: H, pad: 40 });
    const V = pts.map(pl.map);
    let body = polygon(V, { fill: FILL });
    const tk = (i, j, n) => { const both = (s.arrows || []).some((pr) => pr.some(([a, b]) => (a === i && b === j) || (a === j && b === i))); const Q = both ? [V[i][0] + (V[j][0] - V[i][0]) * 0.6, V[i][1] + (V[j][1] - V[i][1]) * 0.6] : V[j]; return equalTicks(V[i], Q, n); };
    for (const [i, j] of s.ticks || []) body += tk(i, j, 1);
    (s.ticks2 || []).forEach((pair, k) => { for (const [i, j] of pair) body += tk(i, j, k + 1); });
    (s.arrows || []).forEach((pair, k) => { for (const [i, j] of pair) body += parallelArrows(V[i], V[j], k + 1); });
    for (const i of s.rights || []) body += rightMark(V[i], V[(i + 1) % V.length], V[(i + V.length - 1) % V.length], 11);
    const tri = name.includes('triangle');
    return {
      prompt: 'Matching dashes show equal sides and matching arrows show parallel sides.<br>What is the name of this shape?',
      visual: figure(W, H, body),
      answer: name,
      distractors: shuffle(rng, ALL_NAMES.filter((n) => n !== name && n.includes('triangle') === tri)).concat(shuffle(rng, ALL_NAMES.filter((n) => n.includes('triangle') !== tri))),
      count: 4,
      solution: [
        'Read the marks: dashes = equal sides, arrows = parallel sides, squares = right angles.',
        `These marks fit a ${name.toLowerCase()}: ${DESCRIPTIONS.find((x) => x[1] === name)?.[0].toLowerCase() || { 'Equilateral triangle': 'all three sides equal.', 'Isosceles triangle': 'two equal sides.', 'Scalene triangle': 'no equal sides and no right angle.', 'Right-angled triangle': 'one angle is a right angle.' }[name]}`,
        `Answer: ${name}`,
      ],
    };
  }
  if (mode === 'triAngles') {
    const type = pick(rng, ['Equilateral triangle', 'Isosceles triangle', 'Scalene triangle', 'Right-angled triangle', 'Isosceles triangle']);
    let a; let b;
    if (type === 'Equilateral triangle') { a = 60; b = 60; } else if (type === 'Right-angled triangle') { a = 90; b = int(rng, 20, 70); if (b === 45) b = 40; } else if (type === 'Isosceles triangle') { a = int(rng, 20, 80); if (a === 60 || a === 45) a = 50; b = chance(rng, 0.5) ? a : 180 - 2 * a; } else { a = int(rng, 25, 85); b = int(rng, 25, 150 - a); }
    const c = 180 - a - b;
    if (TRI_ANGLE_TYPES(a, b, c) !== type) throw new Error('type clash');
    return {
      prompt: `Two angles of a triangle are $${a}^\\circ$ and $${b}^\\circ$.<br>What type of triangle is it?`,
      answer: type,
      distractors: ['Equilateral triangle', 'Isosceles triangle', 'Scalene triangle', 'Right-angled triangle'].filter((t) => t !== type),
      count: 4,
      solution: [`The third angle is $180 - ${a} - ${b} = ${c}^\\circ$.`, `The angles are $${a}^\\circ$, $${b}^\\circ$ and $${c}^\\circ$: ${type === 'Isosceles triangle' ? 'two are equal, so two sides are equal' : type === 'Right-angled triangle' ? 'one is $90^\\circ$' : type === 'Equilateral triangle' ? 'all three are equal' : 'all different and none is $90^\\circ$'}.`, `Answer: ${type}`],
    };
  }
  const [desc, name] = pick(rng, DESCRIPTIONS);
  return {
    prompt: `A quadrilateral has this property:<br><i>${desc}</i><br>What is the quadrilateral?`,
    answer: name,
    distractors: shuffle(rng, ['Square', 'Rectangle', 'Rhombus', 'Parallelogram', 'Kite', 'Trapezium'].filter((n) => n !== name)),
    count: 4,
    solution: [`Check each quadrilateral against the property.`, `Only a ${name.toLowerCase()} fits: ${desc.charAt(0).toLowerCase() + desc.slice(1)}`, `Answer: ${name}`],
  };
}, { title: 'Name triangles and quadrilaterals' });

const STATEMENTS = [
  { s: 'All four sides are equal', yes: ['Square', 'Rhombus'] },
  { s: 'All four angles are right angles', yes: ['Square', 'Rectangle'] },
  { s: 'The diagonals cross at right angles', yes: ['Square', 'Rhombus', 'Kite'] },
  { s: 'The diagonals are equal in length', yes: ['Square', 'Rectangle', 'Isosceles trapezium'] },
  { s: 'Opposite sides are parallel', yes: ['Square', 'Rectangle', 'Rhombus', 'Parallelogram'] },
  { s: 'Opposite angles are equal', yes: ['Square', 'Rectangle', 'Rhombus', 'Parallelogram'] },
  { s: 'It has exactly one line of symmetry', yes: ['Kite', 'Isosceles trapezium'] },
  { s: 'It has rotational symmetry of order 2', yes: ['Rectangle', 'Rhombus', 'Parallelogram'] },
  { s: 'It has no lines of symmetry', yes: ['Parallelogram', 'Trapezium'] },
  { s: 'The diagonals bisect each other', yes: ['Square', 'Rectangle', 'Rhombus', 'Parallelogram'] },
  { s: 'It has exactly one pair of parallel sides', yes: ['Trapezium', 'Isosceles trapezium'] },
  { s: 'It has four lines of symmetry', yes: ['Square'] },
];

export const shapeProperty = ggen('geo-2d-property', 'geo-2d-properties', (rng, d) => {
  const shapes = d === 'easy' ? ['Square', 'Rectangle', 'Kite', 'Parallelogram'] : ['Square', 'Rectangle', 'Rhombus', 'Parallelogram', 'Kite', 'Trapezium', 'Isosceles trapezium'];
  const shape = pick(rng, shapes);
  const trueS = STATEMENTS.filter((x) => x.yes.includes(shape));
  const falseS = STATEMENTS.filter((x) => !x.yes.includes(shape));
  const mode = chance(rng, 0.5) ? 'true' : 'false';
  const rot = (int(rng, -40, 40) * Math.PI) / 180;
  const base = QUAD_DRAW[shape].pts.map(([x, y]) => [x * (0.8 + rng() * 0.4), y]);
  const pts = base.map(([x, y]) => [x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)]);
  const visual = figure(260, 180, polygon(place(pts, { width: 260, height: 180, pad: 22 }).P, { fill: FILL }));
  if (mode === 'true' || trueS.length < 3) {
    const ans = pick(rng, trueS);
    return {
      visual,
      prompt: `Which statement is true for <b>every</b> ${shape.toLowerCase()}?`,
      answer: ans.s,
      distractors: shuffle(rng, falseS).map((x) => x.s),
      count: 4,
      solution: [`Think about the properties of a ${shape.toLowerCase()} — sketch one with the marks for equal and parallel sides.`, `"${ans.s}" is always true for a ${shape.toLowerCase()}.`, `The other statements are true for: ${shuffle(rng, falseS).slice(0, 2).map((x) => `"${x.s}" — ${x.yes.join(', ').toLowerCase()}`).join('; ')}.`, `Answer: ${ans.s}`],
    };
  }
  const ans = pick(rng, falseS);
  return {
    visual,
    prompt: `Which statement is <b>not</b> true for a ${shape.toLowerCase()}?`,
    answer: ans.s,
    distractors: shuffle(rng, trueS).map((x) => x.s),
    count: 4,
    solution: [`Go through the properties of a ${shape.toLowerCase()}.`, `"${ans.s}" is only true for: ${ans.yes.join(', ').toLowerCase()}.`, `Answer: ${ans.s}`],
  };
}, { title: 'Properties of quadrilaterals' });

const POLY_N = { 3: 'Triangle', 4: 'Quadrilateral', 5: 'Pentagon', 6: 'Hexagon', 7: 'Heptagon', 8: 'Octagon', 9: 'Nonagon', 10: 'Decagon' };

export const polygonNames = ggen('geo-2d-polygon-names', 'geo-2d-properties', (rng, d) => {
  const n = d === 'easy' ? int(rng, 5, 8) : int(rng, 5, 10);
  const mode = d === 'hard' ? pick(rng, ['sides', 'diagram']) : pick(rng, ['diagram', 'diagram', 'sides']);
  if (mode === 'sides') {
    const name = POLY_N[n];
    return {
      prompt: `How many sides does a <b>${name.toLowerCase()}</b> have?`,
      answer: `$${n}$`,
      distractors: wrongs(n, [n + 1, n - 1, n + 2, n - 2, 2 * n]).map((v) => `$${v}$`),
      typed: { kind: 'number', value: n },
      solution: ['Pent = 5, hex = 6, hept = 7, oct = 8, non = 9, dec = 10.', `A ${name.toLowerCase()} has ${n} sides.`, `Answer: $${n}$`],
    };
  }
  const regular = chance(rng, 0.3);
  const sum = (n - 2) * 180;
  let pts;
  if (regular) pts = Array.from({ length: n }, (_, i) => [Math.cos((2 * Math.PI * i) / n + 0.3), Math.sin((2 * Math.PI * i) / n + 0.3)]);
  else {
    const mean = sum / n; const angs = [];
    for (let i = 0; i < n - 1; i += 1) angs.push(int(rng, Math.round(mean - 25), Math.min(170, Math.round(mean + 20))));
    angs.push(sum - angs.reduce((s, v) => s + v, 0));
    if (angs[n - 1] < 60 || angs[n - 1] > 172) throw new Error('bad');
    pts = polyFromAngles(angs, rng);
  }
  const W = 300; const H = 230;
  const body = polygon(place(pts, { width: W, height: H, pad: 26 }).P, { fill: FILL });
  return {
    prompt: 'What is the name of this polygon?',
    visual: figure(W, H, body),
    answer: POLY_N[n],
    distractors: shuffle(rng, Object.values(POLY_N).filter((x) => x !== POLY_N[n] && x !== 'Triangle' && x !== 'Quadrilateral')),
    count: 4,
    solution: [`Count the sides: there are ${n}.`, `A polygon with ${n} sides is a ${POLY_N[n].toLowerCase()}.`, `Answer: ${POLY_N[n]}`],
  };
}, { title: 'Names of polygons' });

export const fourthVertex = ggen('geo-2d-fourth-vertex', 'geo-2d-properties', (rng, d) => {
  const kind = pick(rng, d === 'easy' ? ['square', 'rectangle'] : d === 'medium' ? ['rectangle', 'parallelogram', 'square'] : ['parallelogram', 'kite', 'square', 'rhombus']);
  const w = { xmin: -5, xmax: 5, ymin: -5, ymax: 5 };
  let A; let B; let Cc; let Dd;
  for (let t = 0; t < 100; t += 1) {
    A = [int(rng, -4, 2), int(rng, -4, 2)];
    if (kind === 'square') { const v = d === 'easy' ? [int(rng, 2, 5), 0] : [int(rng, 1, 4), int(rng, -2, 2)]; B = add(A, v); Cc = add(B, [-v[1], v[0]]); } else if (kind === 'rectangle') { const u = [int(rng, 2, 6), 0]; const v = [0, int(rng, 2, 5)]; if (chance(rng, 0.5)) { u.reverse(); v.reverse(); } B = add(A, u); Cc = add(B, v); } else if (kind === 'parallelogram' || kind === 'rhombus') {
      const u = [int(rng, 2, 5), int(rng, -1, 1)];
      let v = [int(rng, 1, 3), int(rng, 2, 4)];
      if (kind === 'rhombus') { if (u[1] !== 0) continue; v = pick(rng, [[3, 4], [4, 3]]).map((x, i) => (i === 0 ? x : x)); u[0] = 5; }
      B = add(A, u); Cc = add(B, v);
    } else { // kite: A top, C bottom on a vertical axis; B on the right, D its reflection
      const ax = A[0]; const top = [ax, int(rng, 2, 4)]; const bottom = [ax, int(rng, -5, -2)]; const bx = ax + int(rng, 1, 3); const by = int(rng, bottom[1] + 1, top[1] - 1);
      A = top; B = [bx, by]; Cc = bottom;
    }
    Dd = kind === 'kite' ? [2 * A[0] - B[0], B[1]] : add(A, sub(Cc, B));
    const all = [A, B, Cc, Dd];
    if (all.every(([x, y]) => x >= w.xmin && x <= w.xmax && y >= w.ymin && y <= w.ymax)) break;
    A = null;
  }
  if (!A) throw new Error('no placement');
  const { plane: pl } = { plane: null };
  void pl;
  return fourthVertexQ(kind, A, B, Cc, Dd, w);
}, { title: 'Missing vertex of a quadrilateral' });

function fourthVertexQ(kind, A, B, Cc, Dd, w) {
  const pl = plane({ ...w, unitPx: 28 });
  let extra = line(...pl.P(A), ...pl.P(B), { width: 2.2, color: ACCENT }) + line(...pl.P(B), ...pl.P(Cc), { width: 2.2, color: ACCENT });
  for (const [p, l] of [[A, 'A'], [B, 'B'], [Cc, 'C']]) extra += dot(...pl.P(p), 3.5) + htext(pl.P(p)[0] + 10, pl.P(p)[1] - 11, l, { size: 14, italic: true });
  const wrong = [add(B, sub(Cc, A)), add(Cc, sub(A, B)).map((x, i) => x + (i === 0 ? 1 : 0)), [Dd[1], Dd[0]], [Dd[0] + 1, Dd[1]], [Dd[0], Dd[1] - 1], add(A, sub(B, Cc))];
  const name = { square: 'square', rectangle: 'rectangle', parallelogram: 'parallelogram', rhombus: 'rhombus', kite: 'kite' }[kind];
  return {
    prompt: `$A$, $B$ and $C$ are three vertices of a ${name} $ABCD$.<br>What are the coordinates of $D$?`,
    visual: pl.wrap(extra),
    answer: C(Dd),
    distractors: wrong.filter((p) => p[0] !== Dd[0] || p[1] !== Dd[1]).map(C),
    typed: { kind: 'coord', x: Dd[0], y: Dd[1] },
    solution: kind === 'kite' ? [
      'In a kite $ABCD$ with $AB = AD$, the diagonal $AC$ is a line of symmetry.',
      `Here $AC$ is the vertical line $x = ${A[0]}$, so $D$ is the reflection of $B$ in it.`,
      `$B$ is ${B[0] - A[0]} to the right of the line, so $D$ is ${B[0] - A[0]} to the left: ${C(Dd)}.`,
      `Answer: ${C(Dd)}`,
    ] : [
      `In a ${name}, opposite sides are parallel and equal, so $\\vec{AD} = \\vec{BC}$.`,
      `From $B$ to $C$: ${Cc[0] - B[0]} across and ${Cc[1] - B[1]} up. Do the same from $A$.`,
      `$D = (${A[0]} + ${Cc[0] - B[0]}, ${A[1]} + ${Cc[1] - B[1]}) = (${Dd[0]}, ${Dd[1]})$`,
      `Answer: ${C(Dd)}`,
    ],
  };
}

/* ================================================================== */
/* geo-symmetry                                                        */
/* ================================================================== */

const pin = (order, blade) => Array.from({ length: order }, (_, k) => {
  const a = (2 * Math.PI * k) / order;
  return blade.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
});
const regN = (n, r0 = 0) => [Array.from({ length: n }, (_, i) => [Math.cos(Math.PI / 2 + r0 + (2 * Math.PI * i) / n), Math.sin(Math.PI / 2 + r0 + (2 * Math.PI * i) / n)])];
const SYM_SHAPES = [
  { name: 'rectangle', polys: [[[0, 0], [4, 0], [4, 2], [0, 2]]], lines: 2, rot: 2, lvl: 0 },
  { name: 'square', polys: [[[0, 0], [3, 0], [3, 3], [0, 3]]], lines: 4, rot: 4, lvl: 0 },
  { name: 'rhombus', polys: [[[0, 0], [2, 1.3], [4, 0], [2, -1.3]]], lines: 2, rot: 2, lvl: 1 },
  { name: 'parallelogram', polys: [[[0, 0], [3, 0], [4, 2], [1, 2]]], lines: 0, rot: 2, lvl: 1 },
  { name: 'kite', polys: [[[0, -1], [1.4, 1], [0, 3], [-1.4, 1]]], lines: 1, rot: 1, lvl: 0 },
  { name: 'isosceles trapezium', polys: [[[0, 0], [4, 0], [3, 2], [1, 2]]], lines: 1, rot: 1, lvl: 1 },
  { name: 'isosceles triangle', polys: [[[0, 0], [3, 0], [1.5, 3.5]]], lines: 1, rot: 1, lvl: 0 },
  { name: 'scalene triangle', polys: [[[0, 0], [4, 0], [1, 2.5]]], lines: 0, rot: 1, lvl: 0 },
  { name: 'equilateral triangle', polys: regN(3), lines: 3, rot: 3, lvl: 0 },
  { name: 'regular pentagon', polys: regN(5), lines: 5, rot: 5, lvl: 1 },
  { name: 'regular hexagon', polys: regN(6), lines: 6, rot: 6, lvl: 1 },
  { name: 'regular octagon', polys: regN(8, Math.PI / 8), lines: 8, rot: 8, lvl: 2 },
  { name: 'arrow', polys: [[[0, 1], [3, 1], [3, 0], [5, 2], [3, 4], [3, 3], [0, 3]]], lines: 1, rot: 1, lvl: 0 },
  { name: 'plus sign', polys: [[[1, 0], [2, 0], [2, 1], [3, 1], [3, 2], [2, 2], [2, 3], [1, 3], [1, 2], [0, 2], [0, 1], [1, 1]]], lines: 4, rot: 4, lvl: 1 },
  { name: 'L shape', polys: [[[0, 0], [3, 0], [3, 1], [1, 1], [1, 3], [0, 3]]], lines: 1, rot: 1, lvl: 2 },
  { name: 'step shape', polys: [[[0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [0, 2]]], lines: 0, rot: 1, lvl: 1 },
  { name: 'T shape', polys: [[[1, 0], [2, 0], [2, 2], [3, 2], [3, 3], [0, 3], [0, 2], [1, 2]]], lines: 1, rot: 1, lvl: 0 },
  { name: 'S shape', polys: [[[0, 2], [2, 2], [2, 1], [3, 1], [3, 0], [1, 0], [1, 1], [0, 1]]], lines: 0, rot: 2, lvl: 2 },
  { name: 'H shape', polys: [[[0, 0], [1, 0], [1, 1], [2, 1], [2, 0], [3, 0], [3, 3], [2, 3], [2, 2], [1, 2], [1, 3], [0, 3]]], lines: 2, rot: 2, lvl: 1 },
  { name: 'three-bladed pinwheel', polys: pin(3, [[0, 0], [2.4, 0], [2.4, 1.1]]), lines: 0, rot: 3, lvl: 2 },
  { name: 'four-bladed pinwheel', polys: pin(4, [[0, 0], [2.4, 0], [2.4, 1.1]]), lines: 0, rot: 4, lvl: 2 },
  { name: 'Z shape', polys: [[[0, 2], [3, 2], [1.4, 0.6], [3, 0.6], [3, 0], [0, 0], [1.6, 1.4], [0, 1.4]]], lines: 0, rot: 2, lvl: 2 },
];
const symPool = (d) => SYM_SHAPES.filter((s) => s.lvl <= (d === 'easy' ? 0 : d === 'medium' ? 1 : 2));
const rotPolys = (polys, deg) => { const a = (deg * Math.PI) / 180; return polys.map((p) => p.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)])); };

export const symLines = ggen('geo-sym-lines', 'geo-symmetry', (rng, d) => {
  const s = pick(rng, symPool(d));
  const rot = pick(rng, [0, 0, 90, 30, -20, 45]);
  const W = 300; const H = 230;
  const body = drawPolys(rotPolys(s.polys, rot), 0, 0, W, H, { pad: 30 });
  const askRot = chance(rng, 0.35) && d !== 'easy';
  const ans = askRot ? s.rot : s.lines;
  return {
    prompt: askRot ? 'What is the order of rotational symmetry of this shape?' : 'How many lines of symmetry does this shape have?',
    visual: figure(W, H, body),
    answer: `$${ans}$`,
    distractors: wrongs(ans, [askRot ? s.lines : s.rot, ans + 1, ans - 1, ans + 2, ans * 2, 0, 1].map((v) => (askRot && v === 0 ? 1 : v)), { min: -1, integer: true }).filter((v) => v >= (askRot ? 1 : 0)).map((v) => `$${v}$`),
    typed: { kind: 'number', value: ans },
    solution: askRot ? [
      'The order of rotational symmetry is the number of times the shape looks exactly the same during one full turn.',
      `This ${s.name} fits onto itself ${s.rot} time${s.rot > 1 ? 's' : ''} in a full turn${s.rot === 1 ? ' (only back at the start), so it has no rotational symmetry — order 1' : ''}.`,
      `Answer: $${ans}$`,
    ] : [
      'A line of symmetry is a mirror line: each half is a reflection of the other.',
      `This ${s.name} has ${s.lines === 0 ? 'no lines of symmetry' : `${s.lines} line${s.lines === 1 ? '' : 's'} of symmetry`}.${s.name === 'parallelogram' ? ' (Folding along a diagonal does NOT work for a parallelogram.)' : ''}`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Lines and order of symmetry' });

export const symWhich = ggen('geo-sym-which', 'geo-symmetry', (rng, d) => {
  const props = d === 'easy'
    ? [['exactly one line of symmetry', (s) => s.lines === 1], ['no lines of symmetry', (s) => s.lines === 0]]
    : [['exactly one line of symmetry', (s) => s.lines === 1], ['no lines of symmetry', (s) => s.lines === 0], ['rotational symmetry of order 2', (s) => s.rot === 2], ['rotational symmetry but no lines of symmetry', (s) => s.rot > 1 && s.lines === 0], ['exactly two lines of symmetry', (s) => s.lines === 2], ['more than two lines of symmetry', (s) => s.lines > 2]];
  const [desc, test] = pick(rng, props);
  const pool = symPool(d === 'easy' ? 'medium' : 'hard');
  const yes = pool.filter(test); const no = pool.filter((s) => !test(s));
  if (!yes.length || no.length < 3) throw new Error('pool');
  const good = pick(rng, yes); const bad = sample(rng, no, 3);
  const order = shuffle(rng, [good, ...bad]);
  const labels = pick(rng, LABEL_SETS);
  const vis = panelGrid(order.map((s) => (x0, y0, w, h) => drawPolys(rotPolys(s.polys, pick(rng, [0, 0, 90, 20])), x0, y0, w, h, { pad: 18 })), labels, { cols: 4, w: 110, h: 100, gap: 10 });
  const ans = labels[order.indexOf(good)];
  return {
    prompt: `Which shape has <b>${desc}</b>?`,
    visual: vis,
    answer: ans,
    distractors: labels.filter((l) => l !== ans),
    count: 4,
    solution: [
      `Check each shape for ${desc}.`,
      ...order.map((s, i) => `${labels[i]}: ${s.lines} line${s.lines === 1 ? '' : 's'} of symmetry, rotational order ${s.rot}.`).slice(0, 4),
      `Answer: ${ans}`,
    ].slice(0, 6),
  };
}, { title: 'Which shape has this symmetry?' });

export const symPoint = ggen('geo-sym-point', 'geo-symmetry', (rng, d) => {
  const a = int(rng, -3, 4); const b = int(rng, -2, 6);
  const p = int(rng, 3, 6); const r = int(rng, 1, p - 1); const q = int(rng, 3, 6); const s = int(rng, 1, q - 1);
  const V = [[a + p, b + s], [a + r, b + q], [a - r, b + q], [a - p, b + s], [a - p, b - s], [a - r, b - q], [a + r, b - q], [a + p, b - s]];
  const both = d !== 'easy' && chance(rng, 0.6);
  const lines = d === 'easy' ? pick(rng, [['x'], ['y']]) : ['x', 'y'];
  const Pi = 1; const P = V[Pi];
  const Qi = both ? 5 : lines[0] === 'x' ? 2 : 6;
  const Q = V[Qi];
  const W = 380; const H = 280;
  const pl = place(V, { width: W, height: H, pad: 54 });
  const S = V.map(pl.map);
  let body = polygon(S, { fill: FILL });
  const cS = pl.map([a, b]);
  if (lines.includes('x')) body += line(cS[0], 14, cS[0], H - 14, { color: ACCENT2, dash: '7 5', width: 2 }) + htext(cS[0] + 8, 20, `x = ${num(a)}`, { size: 13, italic: true, color: ACCENT2, anchor: 'start' });
  if (lines.includes('y')) body += line(14, cS[1], W - 14, cS[1], { color: ACCENT2, dash: '7 5', width: 2 }) + htext(W - 40, cS[1] - 12, `y = ${num(b)}`, { size: 13, italic: true, color: ACCENT2 });
  const lab = (pt, l) => { const u = unit(sub(pt, centroid(S))); return dot(...pt, 3.5) + htext(pt[0] + u[0] * 15, pt[1] + u[1] * 15, l, { size: 15, italic: true }); };
  body += lab(S[Pi], 'P') + lab(S[Qi], 'Q');
  const lineTxt = lines.length === 2 ? `$x = ${tnum(a)}$ and $y = ${tnum(b)}$ are lines of symmetry` : `$${lines[0] === 'x' ? `x = ${tnum(a)}` : `y = ${tnum(b)}`}$ is a line of symmetry`;
  return {
    prompt: `The shape is drawn on a coordinate grid (not shown). ${lineTxt} of the shape.<br>$P$ is the point ${C(P)}. Work out the coordinates of $Q$.`,
    visual: figure(W, H, body, { nda: true }),
    answer: C(Q),
    distractors: [[2 * a - P[0], P[1]], [P[0], 2 * b - P[1]], [2 * a - P[0], 2 * b - P[1]], [-P[0], -P[1]], [a - P[0], b - P[1]], [P[1], P[0]], [-P[0], P[1]]].filter((x) => x[0] !== Q[0] || x[1] !== Q[1]).map(C),
    typed: { kind: 'coord', x: Q[0], y: Q[1] },
    solution: [
      ...(Q[0] !== P[0] ? [`Reflect in $x = ${a}$: $P$ is ${P[0] - a} to the right of the line, so the image is ${P[0] - a} to the left: $x = ${a} - ${P[0] - a} = ${2 * a - P[0]}$.`] : []),
      ...(Q[1] !== P[1] ? [`Reflect in $y = ${b}$: $P$ is ${P[1] - b} above the line, so the image is ${P[1] - b} below: $y = ${b} - ${P[1] - b} = ${2 * b - P[1]}$.`] : []),
      `Answer: ${C(Q)}`,
    ],
  };
}, { title: 'Coordinates using lines of symmetry' });

/* ================================================================== */
/* geo-3d-properties                                                   */
/* ================================================================== */

const SOLIDS = [
  { name: 'Cube', f: 6, e: 12, v: 8, make: (r) => boxSolid(1.6, 1.6, 1.9 + r() * 0.8), lvl: 0 },
  { name: 'Cuboid', f: 6, e: 12, v: 8, make: (r) => boxSolid(2 + r() * 1.2, 1.1 + r() * 0.8, 1.4 + r() * 1.4), lvl: 0 },
  { name: 'Triangular prism', f: 5, e: 9, v: 6, make: (r) => regularPrism(3, { depth: 2 + r() * 1.4 }), lvl: 0 },
  { name: 'Square-based pyramid', f: 5, e: 8, v: 5, make: (r) => regularPyramid(4, { rot: 0.15 + r() * 0.5, height: 1.2 + r() * 0.8 }), lvl: 0 },
  { name: 'Triangular-based pyramid', f: 4, e: 6, v: 4, make: (r) => regularPyramid(3, { rot: 0.2 + r() * 0.8, height: 1.2 + r() * 0.8 }), lvl: 1 },
  { name: 'Pentagonal prism', f: 7, e: 15, v: 10, make: (r) => regularPrism(5, { depth: 1.6 + r() * 1.2 }), lvl: 1 },
  { name: 'Hexagonal prism', f: 8, e: 18, v: 12, make: (r) => regularPrism(6, { depth: 1.6 + r() * 1.2 }), lvl: 1 },
  { name: 'Pentagon-based pyramid', f: 6, e: 10, v: 6, make: (r) => regularPyramid(5, { rot: r() * 1.2, height: 1.3 + r() * 0.7 }), lvl: 2 },
  { name: 'Hexagon-based pyramid', f: 7, e: 12, v: 7, make: (r) => regularPyramid(6, { rot: r() * 1, height: 1.3 + r() * 0.7 }), lvl: 2 },
  { name: 'Octagonal prism', f: 10, e: 24, v: 16, make: (r) => regularPrism(8, { depth: 1.5 + r() * 1 }), lvl: 2 },
];

export const solidFEV = ggen('geo-3d-fev', 'geo-3d-properties', (rng, d) => {
  const s = pick(rng, SOLIDS.filter((x) => x.lvl <= (d === 'easy' ? 0 : d === 'medium' ? 1 : 2)));
  const what = pick(rng, ['faces', 'edges', 'vertices']);
  const ans = what === 'faces' ? s.f : what === 'edges' ? s.e : s.v;
  const { verts, faces } = s.make(rng);
  return {
    prompt: `The diagram shows a ${s.name.toLowerCase()}.<br>How many <b>${what}</b> does it have?`,
    visual: polyhedronFig(verts, faces),
    answer: `$${ans}$`,
    distractors: wrongs(ans, [s.f, s.e, s.v, ans + 1, ans - 1, ans + 2, ans - 2].filter((v) => v !== ans), { min: 0, integer: true }).map((v) => `$${v}$`),
    typed: { kind: 'number', value: ans },
    solution: [
      'Faces are the flat surfaces, edges are where two faces meet, vertices are the corners.',
      `A ${s.name.toLowerCase()} has ${s.f} faces, ${s.e} edges and ${s.v} vertices. Remember the hidden ones at the back (dashed).`,
      `Check with Euler: faces + vertices − edges $= ${s.f} + ${s.v} - ${s.e} = 2$.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Faces, edges and vertices' });

export const solidName = ggen('geo-3d-name', 'geo-3d-properties', (rng, d) => {
  const pool = SOLIDS.filter((x) => x.lvl <= (d === 'easy' ? 0 : 2));
  const s = pick(rng, pool);
  const mode = pick(rng, d === 'easy' ? ['fev', 'diagram'] : ['fev', 'one', 'one']);
  if (mode === 'diagram') {
    const { verts, faces } = s.make(rng);
    return {
      prompt: 'What is the name of this 3D shape?',
      visual: polyhedronFig(verts, faces),
      answer: s.name,
      distractors: shuffle(rng, pool.filter((x) => x.name !== s.name)).map((x) => x.name),
      count: 4,
      solution: [`It has ${s.f} faces, ${s.e} edges and ${s.v} vertices.`, s.name.includes('prism') || s.name === 'Cube' || s.name === 'Cuboid' ? 'It has the same cross-section all the way through, so it is a prism.' : 'Its faces meet at a point at the top, so it is a pyramid.', `Answer: ${s.name}`],
    };
  }
  if (mode === 'one') {
    const what = pick(rng, ['faces', 'edges', 'vertices']);
    const val = s[what[0]];
    const others = pool.filter((x) => x[what[0]] !== val);
    if (others.length < 3) throw new Error('pool');
    return {
      prompt: `Which solid has exactly <b>${val} ${what}</b>?`,
      answer: s.name,
      distractors: shuffle(rng, others).map((x) => x.name),
      count: 4,
      solution: [...shuffle(rng, [s, ...others.slice(0, 3)]).map((x) => `${x.name}: ${x.f} faces, ${x.e} edges, ${x.v} vertices.`).slice(0, 4), `Answer: ${s.name}`],
    };
  }
  return {
    prompt: `A solid has ${s.f} faces, ${s.e} edges and ${s.v} vertices.<br>What could it be?`,
    answer: s.name,
    distractors: shuffle(rng, pool.filter((x) => x.f !== s.f || x.e !== s.e || x.v !== s.v)).map((x) => x.name),
    count: 4,
    solution: [`Think about each solid: a prism with an $n$-sided cross-section has $n + 2$ faces, $3n$ edges and $2n$ vertices; a pyramid with an $n$-sided base has $n + 1$ faces, $2n$ edges and $n + 1$ vertices.`, `${s.f} faces, ${s.e} edges and ${s.v} vertices fit a ${s.name.toLowerCase()}.`, `Answer: ${s.name}`],
  };
}, { title: 'Name a 3D solid' });

export const solidFormula = ggen('geo-3d-formula', 'geo-3d-properties', (rng, d) => {
  const kind = pick(rng, ['prism', 'pyramid']);
  const what = pick(rng, ['faces', 'edges', 'vertices']);
  if (d === 'hard' && chance(rng, 0.5)) {
    const expr = kind === 'prism' ? { faces: 'n + 2', edges: '3n', vertices: '2n' } : { faces: 'n + 1', edges: '2n', vertices: 'n + 1' };
    const ans = `$${expr[what]}$`;
    return {
      prompt: `The ${kind === 'prism' ? 'cross-section of a prism' : 'base of a pyramid'} has $n$ sides.<br>Which expression gives the number of <b>${what}</b>?`,
      answer: ans,
      distractors: ['n', 'n + 1', 'n + 2', '2n', '3n', '2n + 2', 'n - 1'].map((x) => `$${x}$`).filter((x) => x !== ans),
      count: 4,
      solution: kind === 'prism' ? ['A prism has two end faces (the $n$-gons) plus $n$ rectangles: $n + 2$ faces.', 'Each end has $n$ edges and there are $n$ edges joining them: $3n$ edges. Each end has $n$ vertices: $2n$ vertices.', `Answer: ${ans}`]
        : ['A pyramid has the base plus $n$ triangles: $n + 1$ faces.', 'The base has $n$ edges and $n$ more go up to the apex: $2n$ edges. The base has $n$ vertices plus the apex: $n + 1$.', `Answer: ${ans}`],
    };
  }
  const n = int(rng, d === 'easy' ? 5 : 7, d === 'easy' ? 8 : 20);
  const val = kind === 'prism' ? { faces: n + 2, edges: 3 * n, vertices: 2 * n }[what] : { faces: n + 1, edges: 2 * n, vertices: n + 1 }[what];
  return {
    prompt: `A ${kind} has ${kind === 'prism' ? 'a cross-section' : 'a base'} with ${n} sides.<br>How many <b>${what}</b> does it have?`,
    answer: `$${val}$`,
    distractors: wrongs(val, [n, n + 1, n + 2, 2 * n, 3 * n, 2 * n + 2, n + 3].filter((v) => v !== val), { integer: true }).map((v) => `$${v}$`),
    typed: { kind: 'number', value: val },
    solution: kind === 'prism' ? [`A prism with an $n$-sided cross-section has $n + 2$ faces, $3n$ edges and $2n$ vertices.`, `With $n = ${n}$: ${what} $= ${val}$.`, `Answer: $${val}$`] : [`A pyramid with an $n$-sided base has $n + 1$ faces, $2n$ edges and $n + 1$ vertices.`, `With $n = ${n}$: ${what} $= ${val}$.`, `Answer: $${val}$`],
  };
}, { title: 'Faces, edges and vertices of prisms and pyramids' });

/* ---------- nets ---------- */

const ROLL = {
  E: ([x, y, z]) => [z, y, -x], W: ([x, y, z]) => [-z, y, x], N: ([x, y, z]) => [x, z, -y], S: ([x, y, z]) => [x, -z, y],
};
function isCubeNet(cells) {
  const set = new Set(cells.map((c) => c.join(',')));
  const normals = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const seen = new Map();
  const stack = [[cells[0], normals]];
  seen.set(cells[0].join(','), true);
  const faces = new Set();
  while (stack.length) {
    const [c, ns] = stack.pop();
    const down = ns.findIndex((n) => n[2] === -1);
    faces.add(down);
    for (const [dir, [dx, dy]] of Object.entries({ E: [1, 0], W: [-1, 0], N: [0, 1], S: [0, -1] })) {
      const nc = [c[0] + dx, c[1] + dy]; const k = nc.join(',');
      if (!set.has(k) || seen.has(k)) continue;
      seen.set(k, true);
      stack.push([nc, ns.map(ROLL[dir])]);
    }
  }
  return faces.size === 6;
}
function randomHexomino(rng) {
  for (;;) {
    const cells = [[0, 0]]; const set = new Set(['0,0']);
    while (cells.length < 6) {
      const c = pick(rng, cells); const [dx, dy] = pick(rng, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
      const n = [c[0] + dx, c[1] + dy]; if (set.has(n.join(','))) continue;
      set.add(n.join(',')); cells.push(n);
    }
    const xs = cells.map((c) => c[0]); const ys = cells.map((c) => c[1]);
    if (Math.max(...xs) - Math.min(...xs) > 4 || Math.max(...ys) - Math.min(...ys) > 4) continue;
    const mx = Math.min(...xs); const my = Math.min(...ys);
    return cells.map(([x, y]) => [x - mx, y - my]);
  }
}
const netKey = (cells) => cells.map((c) => c.join(',')).sort().join(';');

function drawNet(cells, x0, y0, w, h) {
  const xs = cells.map((c) => c[0]); const ys = cells.map((c) => c[1]);
  const cw = Math.max(...xs) + 1; const ch = Math.max(...ys) + 1;
  const s = Math.min((w - 16) / cw, (h - 12) / ch, 24);
  const ox = x0 + (w - cw * s) / 2; const oy = y0 + (h - ch * s) / 2;
  return cells.map(([x, y]) => polygon([[ox + x * s, oy + (ch - 1 - y) * s], [ox + (x + 1) * s, oy + (ch - 1 - y) * s], [ox + (x + 1) * s, oy + (ch - y) * s], [ox + x * s, oy + (ch - y) * s]], { fill: FILL, width: 1.8 })).join('');
}

/** Hand-drawn nets of other solids, in a box. */
function otherNet(kind, x0, y0, w, h) {
  const g = (pts) => { const pl = place(pts.flat(), { width: w, height: h, pad: 10 }); return pts.map((p) => polygon(p.map(pl.map).map(([x, y]) => [x + x0, y + y0]), { fill: FILL, width: 1.8 })).join(''); };
  const t = Math.sqrt(3) / 2;
  if (kind === 'Triangular prism') return g([[[0, 0], [1, 0], [1, 2.4], [0, 2.4]], [[1, 0], [2, 0], [2, 2.4], [1, 2.4]], [[2, 0], [3, 0], [3, 2.4], [2, 2.4]], [[1, 2.4], [2, 2.4], [1.5, 2.4 + t]], [[1, 0], [2, 0], [1.5, -t]]]);
  if (kind === 'Square-based pyramid') return g([[[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 1], [1, 1], [0.5, 2]], [[0, 0], [1, 0], [0.5, -1]], [[1, 0], [1, 1], [2, 0.5]], [[0, 0], [0, 1], [-1, 0.5]]]);
  if (kind === 'Triangular-based pyramid') return g([[[0, 0], [1, 0], [0.5, t]], [[0, 0], [1, 0], [0.5, -t]], [[1, 0], [0.5, t], [1.5, t]], [[0, 0], [0.5, t], [-0.5, t]]]);
  if (kind === 'Cuboid') return g([[[0, 1], [2, 1], [2, 2], [0, 2]], [[0, 0], [2, 0], [2, 1], [0, 1]], [[0, 2], [2, 2], [2, 3], [0, 3]], [[0, 3], [2, 3], [2, 4], [0, 4]], [[-1, 1], [0, 1], [0, 2], [-1, 2]], [[2, 1], [3, 1], [3, 2], [2, 2]]]);
  if (kind === 'Pentagonal prism') {
    const pent = (cx, cy, r, a0) => Array.from({ length: 5 }, (_, i) => [cx + r * Math.cos(a0 + (2 * Math.PI * i) / 5), cy + r * Math.sin(a0 + (2 * Math.PI * i) / 5)]);
    const rects = Array.from({ length: 5 }, (_, i) => [[i * 0.8, 0], [(i + 1) * 0.8, 0], [(i + 1) * 0.8, 1.6], [i * 0.8, 1.6]]);
    return g([...rects, pent(1.2, 1.6 + 0.55, 0.68, -Math.PI / 2 + Math.PI / 5 * 0), pent(1.2, -0.55, 0.68, Math.PI / 2)]);
  }
  return '';
}
function roundNet(kind, x0, y0, w, h) {
  const cx = x0 + w / 2;
  if (kind === 'Cylinder') {
    const rw = w * 0.6; const rh = h * 0.42; const R = rw / (2 * Math.PI) * 1.0 + 8;
    const top = y0 + (h - rh) / 2;
    return polygon([[cx - rw / 2, top], [cx + rw / 2, top], [cx + rw / 2, top + rh], [cx - rw / 2, top + rh]], { fill: FILL, width: 1.8 }) + circle(cx - rw / 4, top - R, R, { fill: FILL, width: 1.8 }) + circle(cx + rw / 4, top + rh + R, R, { fill: FILL, width: 1.8 });
  }
  // cone: sector + circle
  const c = [cx - 10, y0 + 14]; const R = h * 0.62;
  const p1 = polar(c, R, -60); const p2 = polar(c, R, -120);
  return path(`M ${c[0]} ${c[1]} L ${p1[0]} ${p1[1]} A ${R} ${R} 0 0 1 ${p2[0]} ${p2[1]} Z`, { fill: FILL, width: 1.8 }) + circle(c[0] + R * 0.75, c[1] + R * 0.5, R * 0.22, { fill: FILL, width: 1.8 });
}

export const solidNets = ggen('geo-3d-nets', 'geo-3d-properties', (rng, d) => {
  const mode = d === 'easy' ? 'solidOfNet' : pick(rng, ['cubeYes', 'cubeNo', 'solidOfNet']);
  const labels = pick(rng, LABEL_SETS);
  if (mode === 'solidOfNet') {
    const kinds = ['Cube', 'Triangular prism', 'Square-based pyramid', 'Triangular-based pyramid', 'Cuboid', 'Cylinder', 'Cone', 'Pentagonal prism'];
    const kind = pick(rng, kinds);
    const W = 300; const H = 220;
    let body;
    if (kind === 'Cube') { let net; do { net = randomHexomino(rng); } while (!isCubeNet(net)); body = drawNet(net, 0, 0, W, H); } else if (kind === 'Cylinder' || kind === 'Cone') body = roundNet(kind, 0, 0, W, H); else body = otherNet(kind, 0, 0, W, H);
    return {
      prompt: 'This is the net of a 3D shape.<br>Which shape does it make?',
      visual: svg(W, H, body, { maxWidth: W }),
      answer: kind,
      distractors: shuffle(rng, kinds.filter((k) => k !== kind)),
      count: 4,
      solution: [
        'Look at the shapes of the faces and how many there are.',
        { Cube: '6 equal squares', 'Triangular prism': '2 triangles and 3 rectangles', 'Square-based pyramid': '1 square and 4 triangles', 'Triangular-based pyramid': '4 triangles', Cuboid: '6 rectangles in 3 matching pairs', Cylinder: '2 circles and a rectangle (which rolls into the curved surface)', Cone: 'a sector (which rolls into the curved surface) and a circle', 'Pentagonal prism': '2 pentagons and 5 rectangles' }[kind] + ` fold to make a ${kind.toLowerCase()}.`,
        `Answer: ${kind}`,
      ],
    };
  }
  // four hexominoes: exactly one is (or is not) a cube net
  const want = mode === 'cubeYes';
  const pickNets = [];
  const keys = new Set();
  let guard = 0;
  while (pickNets.length < 4 && guard < 2000) {
    guard += 1;
    const n = randomHexomino(rng); const k = netKey(n);
    if (keys.has(k)) continue;
    const ok = isCubeNet(n);
    const needOdd = pickNets.length === 0;
    if (needOdd ? ok !== want : ok === want) continue;
    keys.add(k); pickNets.push(n);
  }
  if (pickNets.length < 4) throw new Error('nets');
  const order = shuffle(rng, [0, 1, 2, 3]);
  const vis = panelGrid(order.map((i) => (x0, y0, w, h) => drawNet(pickNets[i], x0, y0, w, h)), labels, { cols: 4, w: 112, h: 118, gap: 10 });
  const ans = labels[order.indexOf(0)];
  return {
    prompt: want ? 'Which of these is the net of a cube?' : 'Three of these are nets of a cube. Which one is <b>not</b>?',
    visual: vis,
    answer: ans,
    distractors: labels.filter((l) => l !== ans),
    count: 4,
    solution: [
      'Imagine folding each net: choose one square as the base and fold the others up.',
      'A net of a cube must give 6 different faces with no two squares landing on the same face (a row of more than four squares, or a 2 × 3 block, never works).',
      `${ans} is the one that ${want ? 'folds into a cube' : 'does not fold into a cube — two squares overlap'}.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Nets of 3D shapes' });

export const solidEdges = ggen('geo-3d-edge-length', 'geo-3d-properties', (rng, d) => {
  const mode = d === 'easy' ? 'cube' : d === 'medium' ? pick(rng, ['cube', 'cuboid']) : pick(rng, ['pyramid', 'cuboidReverse']);
  if (mode === 'cube') {
    const s = int(rng, 2, 15); const rev = chance(rng, 0.5);
    return rev ? {
      prompt: `The total length of all the edges of a cube is $${12 * s}$ cm.<br>Work out the length of one edge.`,
      visual: polyhedronFig(...Object.values(boxSolid(1.6, 1.6, 2.2))),
      answer: `$${s}$ cm`, distractors: wrongs(s, [12 * s / 6, 12 * s / 8, 12 * s / 4, s + 1, s * 2, 12 * s / 3].filter(Number.isInteger)).map((v) => `$${v}$ cm`),
      typed: { kind: 'number', value: s },
      solution: ['A cube has 12 edges, all the same length.', `$${12 * s} \\div 12 = ${s}$`, `Answer: $${s}$ cm`],
    } : {
      prompt: `A cube has edges of length ${s} cm.<br>Work out the total length of all its edges.`,
      visual: polyhedronFig(...Object.values(boxSolid(1.6, 1.6, 2.2))),
      answer: `$${12 * s}$ cm`, distractors: wrongs(12 * s, [6 * s, 8 * s, 4 * s, s ** 3, 6 * s * s, 10 * s]).map((v) => `$${tnum(v)}$ cm`),
      typed: { kind: 'number', value: 12 * s },
      solution: ['A cube has 12 edges.', `$12 \\times ${s} = ${12 * s}$`, `Answer: $${12 * s}$ cm`],
    };
  }
  if (mode === 'cuboid' || mode === 'cuboidReverse') {
    const a = int(rng, 2, 12); const b = int(rng, 2, 10); const c = int(rng, 2, 9);
    const tot = 4 * (a + b + c);
    if (mode === 'cuboidReverse') {
      return {
        prompt: `A cuboid has length ${a} cm and width ${b} cm. The total length of all 12 edges is $${tot}$ cm.<br>Work out the height of the cuboid.`,
        visual: polyhedronFig(...Object.values(boxSolid(2.6, 1.4, 2.0))),
        answer: `$${c}$ cm`, distractors: wrongs(c, [tot / 4 - a, tot - a - b, (tot - 2 * a - 2 * b) / 2, tot / 12, c + 2, (tot - 4 * a - 4 * b) / 2].filter((v) => Number.isInteger(v) && v > 0)).map((v) => `$${v}$ cm`),
        typed: { kind: 'number', value: c },
        solution: ['A cuboid has 4 edges of each length: $4(l + w + h)$.', `$4(${a} + ${b} + h) = ${tot}$, so $${a} + ${b} + h = ${tot / 4}$`, `$h = ${tot / 4} - ${a + b} = ${c}$`, `Answer: $${c}$ cm`],
      };
    }
    return {
      prompt: `A cuboid measures ${a} cm by ${b} cm by ${c} cm.<br>Work out the total length of all its edges.`,
      visual: polyhedronFig(...Object.values(boxSolid(2.6, 1.4, 2.0))),
      answer: `$${tot}$ cm`, distractors: wrongs(tot, [a + b + c, 2 * (a + b + c), 3 * (a + b + c), a * b * c, 2 * (a * b + b * c + a * c), tot + 4]).map((v) => `$${tnum(v)}$ cm`),
      typed: { kind: 'number', value: tot },
      solution: ['A cuboid has 12 edges: 4 of each length.', `$4 \\times (${a} + ${b} + ${c}) = 4 \\times ${a + b + c} = ${tot}$`, `Answer: $${tot}$ cm`],
    };
  }
  // pyramid: square base, sloping edges s, total T -> base area
  const s = int(rng, 5, 15); const b = int(rng, 3, 12);
  const T = 4 * s + 4 * b;
  return {
    prompt: `A pyramid has a square base. Each of the four sloping edges has length ${s} cm.<br>The total length of all eight edges is $${T}$ cm.<br>Work out the area of the square base.`,
    visual: polyhedronFig(...Object.values(regularPyramid(4, { rot: 0.35 }))),
    answer: `$${b * b}$ cm²`, distractors: wrongs(b * b, [b, 4 * b, (T - s) / 7 * ((T - s) / 7), ((T / 8) ** 2), (T - 4 * s) ** 2 / 4, b * b * 2].filter((v) => Number.isInteger(v))).map((v) => `$${tnum(v)}$ cm²`),
    typed: { kind: 'number', value: b * b },
    solution: [`The four sloping edges total $4 \\times ${s} = ${4 * s}$ cm.`, `The four base edges total $${T} - ${4 * s} = ${4 * b}$ cm, so each is $${b}$ cm.`, `Base area $= ${b} \\times ${b} = ${b * b}$ cm²`, `Answer: $${b * b}$ cm²`],
  };
}, { title: 'Total edge length' });

/* ================================================================== */
/* geo-plans-elevations                                                */
/* ================================================================== */

/** Random heights grid with all top faces visible (heights non-increasing towards the front and the right). */
function randomStack(rng, d) {
  const rows = int(rng, 2, d === 'easy' ? 2 : 3); const cols = int(rng, 2, d === 'easy' ? 3 : 4);
  for (let t = 0; t < 200; t += 1) {
    const h = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const capBack = r > 0 ? h[r - 1][c] : 3; const capLeft = c > 0 ? h[r][c - 1] : 3;
        h[r][c] = int(rng, 0, Math.min(capBack, capLeft, d === 'easy' ? 2 : 3));
      }
    }
    // need every row/column used and some variety
    if (h.some((row) => row.every((x) => x === 0))) continue;
    if (h[0].some((x, c) => h.every((row) => row[c] === 0))) continue;
    const flat = h.flat();
    if (new Set(flat.filter((x) => x > 0)).size < 2 && d !== 'easy') continue;
    if (flat.filter((x) => x > 0).length < 3) continue;
    return h;
  }
  throw new Error('stack');
}
const plan = (h) => { const cells = []; h.forEach((row, r) => row.forEach((v, c) => { if (v > 0) cells.push([c, h.length - 1 - r]); })); return cells; };
const frontElev = (h) => { const cells = []; for (let c = 0; c < h[0].length; c += 1) { const m = Math.max(...h.map((row) => row[c])); for (let k = 0; k < m; k += 1) cells.push([c, k]); } return cells; };
const sideElev = (h) => { const cells = []; const rows = h.length; for (let i = 0; i < rows; i += 1) { const r = rows - 1 - i; const m = Math.max(...h[r]); for (let k = 0; k < m; k += 1) cells.push([i, k]); } return cells; };
const mirrorCells = (cells) => { const mx = Math.max(...cells.map((c) => c[0])); return cells.map(([x, y]) => [mx - x, y]); };
const flipCells = (cells) => { const my = Math.max(...cells.map((c) => c[1])); return cells.map(([x, y]) => [x, my - y]); };
const cellKey = (cells) => { const mx = Math.min(...cells.map((c) => c[0])); const my = Math.min(...cells.map((c) => c[1])); return cells.map(([x, y]) => `${x - mx},${y - my}`).sort().join(';'); };

function drawCells(cells, x0, y0, w, h, s0 = 26) {
  const xs = cells.map((c) => c[0]); const ys = cells.map((c) => c[1]);
  const cw = Math.max(...xs) + 1; const ch = Math.max(...ys) + 1;
  const s = Math.min(s0, (w - 10) / cw, (h - 10) / ch);
  const ox = x0 + (w - cw * s) / 2; const oy = y0 + (h - ch * s) / 2;
  return cells.map(([x, y]) => polygon([[ox + x * s, oy + (ch - 1 - y) * s], [ox + (x + 1) * s, oy + (ch - 1 - y) * s], [ox + (x + 1) * s, oy + (ch - y) * s], [ox + x * s, oy + (ch - y) * s]], { fill: FILL, width: 1.8 })).join('');
}

export const planChoose = ggen('geo-plan-choose', 'geo-plans-elevations', (rng, d) => {
  const h = randomStack(rng, d);
  const view = pick(rng, d === 'easy' ? ['plan', 'front'] : ['plan', 'front', 'side']);
  const P = plan(h); const F = frontElev(h); const S = sideElev(h);
  const correct = view === 'plan' ? P : view === 'front' ? F : S;
  const cands = [correct, P, F, S, mirrorCells(correct), flipCells(correct), mirrorCells(P), correct.slice(0, -1), [...correct, [Math.max(...correct.map((c) => c[0])) + 1, 0]]];
  const uniq = [];
  for (const c of cands) if (c.length && !uniq.some((u) => cellKey(u) === cellKey(c))) uniq.push(c);
  if (uniq.length < 4) throw new Error('not enough');
  const chosen = [uniq[0], ...shuffle(rng, uniq.slice(1)).slice(0, 3)];
  const order = shuffle(rng, [0, 1, 2, 3]);
  const labels = pick(rng, LABEL_SETS);
  const stack = isoStack(h, { W: 330, H: 230, arrowFront: view !== 'plan', arrowSide: view === 'side' });
  const top = svg(stack.width, stack.height, stack.body, { maxWidth: 330 });
  const opts = panelGrid(order.map((i) => (x0, y0, w, hh) => drawCells(chosen[i], x0, y0, w, hh)), labels, { cols: 4, w: 110, h: 100, gap: 10 });
  const ans = labels[order.indexOf(0)];
  const vname = view === 'plan' ? 'plan' : view === 'front' ? 'front elevation' : 'side elevation';
  return {
    prompt: `A solid is made from centimetre cubes.<br>Which diagram shows the <b>${vname}</b> of the solid${view === 'side' ? ' (viewed from the side shown by the arrow)' : view === 'front' ? ' (viewed from the front, shown by the arrow)' : ' (the view from directly above)'}?`,
    visual: `<div>${top}${opts}</div>`,
    answer: ans,
    distractors: labels.filter((l) => l !== ans),
    count: 4,
    solution: [
      view === 'plan' ? 'The plan is the view from directly above: you see one square for every column of cubes, whatever its height.' : view === 'front' ? 'The front elevation is the view from the front: each column shows the height of its tallest stack.' : 'The side elevation is the view from the side: each column shows the tallest stack in that row.',
      `So it has ${correct.length} square${correct.length === 1 ? '' : 's'} arranged as in diagram ${ans}.`,
      'Watch out for the other views and for mirror images.',
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Choose the plan or elevation' });

export const planCount = ggen('geo-plan-count', 'geo-plans-elevations', (rng, d) => {
  const h = randomStack(rng, d);
  const n = h.flat().reduce((s, v) => s + v, 0);
  const stack = isoStack(h, { W: 330, H: 240 });
  const toCuboid = d !== 'easy' && chance(rng, 0.6);
  if (toCuboid) {
    const L = h[0].length; const Wd = h.length; const Ht = Math.max(...h.flat());
    const ans = L * Wd * Ht - n;
    return {
      prompt: `A solid is made from ${n} centimetre cubes, as shown.<br>More cubes are added to make a cuboid ${L} cm long, ${Wd} cm wide and ${Ht} cm high.<br>How many cubes are added?`,
      visual: svg(stack.width, stack.height, stack.body, { maxWidth: 330 }),
      answer: `$${ans}$`,
      distractors: wrongs(ans, [L * Wd * Ht, n, ans + 1, ans - 1, L * Wd * Ht - plan(h).length, ans + L]).map((v) => `$${v}$`),
      typed: { kind: 'number', value: ans },
      solution: [`The cuboid needs $${L} \\times ${Wd} \\times ${Ht} = ${L * Wd * Ht}$ cubes.`, `There are already ${n}.`, `$${L * Wd * Ht} - ${n} = ${ans}$`, `Answer: $${ans}$`],
    };
  }
  return {
    prompt: 'This solid is made from centimetre cubes. There are no hidden gaps (every stack rests on the ground).<br>What is the volume of the solid?',
    visual: svg(stack.width, stack.height, stack.body, { maxWidth: 330 }),
    answer: `$${n}$ cm³`,
    distractors: wrongs(n, [n + 1, n - 1, plan(h).length, frontElev(h).length, n + 2, n - 2]).map((v) => `$${v}$ cm³`),
    typed: { kind: 'number', value: n },
    solution: ['Count the cubes stack by stack (each stack goes down to the ground).', `Stack heights: ${h.flat().filter((x) => x > 0).join(', ')}.`, `Total $= ${n}$ cubes, each 1 cm³.`, `Answer: $${n}$ cm³`],
  };
}, { title: 'Counting cubes in a solid' });

const VIEW_SOLIDS = [
  { name: 'Cylinder', plan: 'circle', front: 'rect', side: 'rect' },
  { name: 'Cone', plan: 'circleDot', front: 'tri', side: 'tri' },
  { name: 'Sphere', plan: 'circle', front: 'circle', side: 'circle' },
  { name: 'Cube', plan: 'square', front: 'square', side: 'square' },
  { name: 'Cuboid', plan: 'rect', front: 'rect', side: 'square' },
  { name: 'Triangular prism', plan: 'rect', front: 'tri', side: 'rect' },
  { name: 'Square-based pyramid', plan: 'squareX', front: 'tri', side: 'tri' },
  { name: 'Hemisphere', plan: 'circle', front: 'semi', side: 'semi' },
];
function viewShape(kind, x0, y0, w, h) {
  const cx = x0 + w / 2; const cy = y0 + h / 2; const r = Math.min(w, h) * 0.36;
  if (kind === 'circle') return circle(cx, cy, r, { fill: FILL, width: 2 });
  if (kind === 'circleDot') return circle(cx, cy, r, { fill: FILL, width: 2 }) + dot(cx, cy, 3);
  if (kind === 'square') return polygon([[cx - r, cy - r], [cx + r, cy - r], [cx + r, cy + r], [cx - r, cy + r]], { fill: FILL, width: 2 });
  if (kind === 'squareX') return polygon([[cx - r, cy - r], [cx + r, cy - r], [cx + r, cy + r], [cx - r, cy + r]], { fill: FILL, width: 2 }) + line(cx - r, cy - r, cx + r, cy + r, { width: 1.6 }) + line(cx + r, cy - r, cx - r, cy + r, { width: 1.6 });
  if (kind === 'rect') return polygon([[cx - r * 1.3, cy - r * 0.7], [cx + r * 1.3, cy - r * 0.7], [cx + r * 1.3, cy + r * 0.7], [cx - r * 1.3, cy + r * 0.7]], { fill: FILL, width: 2 });
  if (kind === 'tri') return polygon([[cx - r, cy + r * 0.8], [cx + r, cy + r * 0.8], [cx, cy - r * 0.9]], { fill: FILL, width: 2 });
  return path(`M ${cx - r} ${cy + r * 0.5} A ${r} ${r} 0 0 1 ${cx + r} ${cy + r * 0.5} Z`, { fill: FILL, width: 2 });
}

export const planNameSolid = ggen('geo-plan-name-solid', 'geo-plans-elevations', (rng, d) => {
  const s = pick(rng, VIEW_SOLIDS);
  const show = d === 'easy' ? ['plan', 'front', 'side'] : d === 'medium' ? ['plan', 'front'] : pick(rng, [['plan', 'front'], ['front', 'side'], ['plan', 'side']]);
  const consistent = VIEW_SOLIDS.filter((x) => show.every((v) => x[v] === s[v]));
  if (consistent.length > 1) throw new Error('ambiguous');
  const names = { plan: 'Plan', front: 'Front elevation', side: 'Side elevation' };
  const W = 120 * show.length + 20 * (show.length - 1);
  let body = '';
  const W0 = int(rng, 3, 12); const D0 = ['Cuboid', 'Triangular prism'].includes(s.name) ? W0 + int(rng, 2, 6) : W0;
  show.forEach((v, i) => {
    const x0 = i * 140;
    body += text(x0 + 60, 12, names[v], { size: 13, bold: true }) + viewShape(s[v], x0, 24, 120, 110);
    body += text(x0 + 60, 150, `${v === 'side' ? D0 : W0} cm`, { size: 13 });
  });
  return {
    prompt: `The ${show.map((v) => names[v].toLowerCase()).join(' and ').replace(/ and (?=.* and )/, ', ')} of a solid are shown.<br>What is the solid?`,
    visual: svg(W, 160, body, { maxWidth: W }),
    answer: s.name,
    distractors: shuffle(rng, VIEW_SOLIDS.filter((x) => x.name !== s.name && show.some((v) => x[v] === s[v]))).concat(shuffle(rng, VIEW_SOLIDS.filter((x) => x.name !== s.name))).map((x) => x.name),
    count: 4,
    solution: [
      'The plan is the view from above; the elevations are views from the front and side.',
      `${show.map((v) => `${names[v]}: ${{ circle: 'a circle', circleDot: 'a circle with a point in the middle (the apex)', square: 'a square', squareX: 'a square with its diagonals (edges meeting at the top)', rect: 'a rectangle', tri: 'a triangle', semi: 'a semicircle' }[s[v]]}`).join('. ')}.`,
      `Only a ${s.name.toLowerCase()} gives these views.`,
      `Answer: ${s.name}`,
    ],
  };
}, { title: 'Identify a solid from its plan and elevations' });

/* ================================================================== */
/* geo-constructions-loci                                              */
/* ================================================================== */

const LOCI = [
  { key: 'circle', q: (r) => `the locus of points exactly ${r} cm from point $A$` },
  { key: 'disc', q: (r) => `the region of points less than ${r} cm from point $A$` },
  { key: 'perp', q: () => 'the locus of points the same distance from $A$ and from $B$' },
  { key: 'bisector', q: () => 'the locus of points the same distance from the lines $AB$ and $AC$' },
  { key: 'stadium', q: (r) => `the locus of points exactly ${r} cm from the line segment $AB$` },
  { key: 'parallel', q: (r) => `the locus of points exactly ${r} cm from the (infinitely long) straight line $L$` },
];
function lociPanel(key, x0, y0, w, h) {
  const cx = x0 + w / 2; const cy = y0 + h / 2;
  const A = [cx - 26, cy + 8]; const B = [cx + 26, cy + 8];
  const L = (s) => htext(...s, ...[]);
  void L;
  const pt = (P, l, dx = -10, dy = 12) => dot(...P, 3) + text(P[0] + dx, P[1] + dy, l, { size: 13, italic: true });
  const red = { color: ACCENT, width: 2.4 };
  switch (key) {
    case 'circle': return circle(cx, cy, 36, red) + pt([cx, cy], 'A', 0, 13);
    case 'disc': return circle(cx, cy, 36, { ...red, fill: 'var(--d-accent, #2f5bd3)' }).replace('fill="var(--d-accent, #2f5bd3)"', 'fill="var(--d-accent, #2f5bd3)" fill-opacity="0.25"') + pt([cx, cy], 'A', 0, 13);
    case 'perp': return line(...A, ...B, { width: 1.6, color: MUTED }) + line(cx, y0 + 6, cx, y0 + h - 6, red) + pt(A, 'A', -4, 13) + pt(B, 'B', 4, 13);
    case 'bisector': { const V = [x0 + 18, y0 + h - 18]; const P1 = [x0 + w - 12, y0 + h - 18]; const P2 = polar(V, w * 0.85, 60); return line(...V, ...P1, { width: 1.8 }) + line(...V, ...P2, { width: 1.8 }) + line(...V, ...polar(V, w * 0.9, 30), red) + text(V[0] - 8, V[1] + 6, 'A', { size: 13, italic: true }) + text(P1[0] - 4, P1[1] + 13, 'B', { size: 13, italic: true }) + text(P2[0] + 8, P2[1] + 4, 'C', { size: 13, italic: true }); }
    case 'stadium': { const r = 22; return path(`M ${A[0]} ${A[1] - r} L ${B[0]} ${B[1] - r} A ${r} ${r} 0 0 1 ${B[0]} ${B[1] + r} L ${A[0]} ${A[1] + r} A ${r} ${r} 0 0 1 ${A[0]} ${A[1] - r} Z`, red) + line(...A, ...B, { width: 1.8 }) + pt(A, 'A', -4, 13) + pt(B, 'B', 4, 13); }
    case 'parallel': return line(x0 + 6, cy, x0 + w - 6, cy, { width: 1.8 }) + line(x0 + 6, cy - 24, x0 + w - 6, cy - 24, red) + line(x0 + 6, cy + 24, x0 + w - 6, cy + 24, red) + text(x0 + 12, cy - 9, 'L', { size: 13, italic: true });
    case 'perpWrong': return line(...A, ...B, { width: 1.6, color: MUTED }) + line(cx + 14, y0 + 6, cx - 14, y0 + h - 6, red) + pt(A, 'A', -4, 13) + pt(B, 'B', 4, 13);
    case 'circleB': return line(...A, ...B, { width: 1.6, color: MUTED }) + circle(...mid(A, B), 26, red) + pt(A, 'A', -4, 13) + pt(B, 'B', 4, 13);
    case 'bisectorWrong': { const V = [x0 + 18, y0 + h - 18]; const P1 = [x0 + w - 12, y0 + h - 18]; const P2 = polar(V, w * 0.85, 60); return line(...V, ...P1, { width: 1.8 }) + line(...V, ...P2, { width: 1.8 }) + line(...mid(V, P1), ...mid(V, P2), red) + text(V[0] - 8, V[1] + 6, 'A', { size: 13, italic: true }) + text(P1[0] - 4, P1[1] + 13, 'B', { size: 13, italic: true }) + text(P2[0] + 8, P2[1] + 4, 'C', { size: 13, italic: true }); }
    case 'stadiumWrong': { const r = 22; return polygon([[A[0], A[1] - r], [B[0], B[1] - r], [B[0], B[1] + r], [A[0], A[1] + r]], { fill: 'none', ...red }) + line(...A, ...B, { width: 1.8 }) + pt(A, 'A', -4, 13) + pt(B, 'B', 4, 13); }
    case 'single': return line(x0 + 6, cy, x0 + w - 6, cy, { width: 1.8 }) + line(x0 + 6, cy - 24, x0 + w - 6, cy - 24, red) + text(x0 + 12, cy - 9 + 24, 'L', { size: 13, italic: true });
    default: return '';
  }
}
const LOCI_WRONG = { circle: ['disc', 'circleB', 'stadium', 'perp'], disc: ['circle', 'circleB', 'stadium', 'bisector'], perp: ['perpWrong', 'circleB', 'bisector', 'circle'], bisector: ['bisectorWrong', 'perp', 'parallel', 'circle'], stadium: ['stadiumWrong', 'circleB', 'parallel', 'disc'], parallel: ['single', 'stadium', 'perp', 'circle'] };

export const lociWhich = ggen('geo-loci-which', 'geo-constructions-loci', (rng, d) => {
  const pool = d === 'easy' ? LOCI.filter((x) => ['circle', 'disc', 'perp'].includes(x.key)) : d === 'medium' ? LOCI.filter((x) => x.key !== 'stadium') : LOCI;
  const L0 = pick(rng, pool);
  const r = int(rng, 2, 5);
  const keys = [L0.key, ...shuffle(rng, LOCI_WRONG[L0.key]).slice(0, 3)];
  const order = shuffle(rng, [0, 1, 2, 3]);
  const labels = pick(rng, LABEL_SETS);
  const vis = panelGrid(order.map((i) => (x0, y0, w, h) => lociPanel(keys[i], x0, y0, w, h)), labels, { cols: 4, w: 112, h: 104, gap: 10 });
  const ans = labels[order.indexOf(0)];
  const explain = { circle: 'Points a fixed distance from a point form a <b>circle</b> centred on that point (just the line, not the inside).', disc: 'Points <b>less than</b> a distance from a point fill the <b>inside</b> of a circle.', perp: 'Points equidistant from two points lie on the <b>perpendicular bisector</b> of the line joining them — it crosses $AB$ at its midpoint at right angles.', bisector: 'Points equidistant from two lines that meet lie on the <b>angle bisector</b>.', stadium: 'Points a fixed distance from a line segment form two parallel lines joined by two semicircles (a "running track" shape).', parallel: 'Points a fixed distance from a long straight line form <b>two</b> parallel lines, one on each side.' };
  return {
    prompt: `Which diagram shows ${L0.q(r)}? (The locus is drawn in colour.)`,
    visual: vis,
    answer: ans,
    distractors: labels.filter((l) => l !== ans),
    count: 4,
    solution: [explain[L0.key], `That is diagram ${ans}.`, `Answer: ${ans}`],
  };
}, { title: 'Recognise loci' });

/** Region question: rectangle with points; up to two boundaries (perpendicular bisector / circle / angle bisector). */
export const lociRegion = ggen('geo-loci-region', 'geo-constructions-loci', (rng, d) => {
  const mode = d === 'easy' ? 'twoCircles' : pick(rng, ['bisCircle', 'twoCircles', 'bisCircle', d === 'hard' ? 'angleCircle' : 'bisCircle']);
  const Wc = 10; const Hc = 7; // cm grid
  const s = 34; const g = squareGrid(Wc, Hc, { s, x0: 12, y0: 12, dashed: true });
  const M = (p) => g.P(p);
  let conds; let tests; let draws = '';
  const pts = {};
  if (mode === 'twoCircles') {
    const P = [int(rng, 2, 4), int(rng, 2, 5)]; const Q = [int(rng, 5, 8), int(rng, 2, 5)];
    const r1 = int(rng, 2, 4); const r2 = int(rng, 2, 4);
    const dPQ = Math.hypot(P[0] - Q[0], P[1] - Q[1]);
    if (dPQ >= r1 + r2 - 0.8 || dPQ <= Math.abs(r1 - r2) + 0.8) throw new Error('circles');
    pts.P = P; pts.Q = Q;
    draws += circle(...M(P), r1 * s, { color: ACCENT, width: 2 }) + circle(...M(Q), r2 * s, { color: ACCENT2, width: 2 });
    conds = [[`less than ${r1} cm from $P$`, `more than ${r1} cm from $P$`], [`less than ${r2} cm from $Q$`, `more than ${r2} cm from $Q$`]];
    tests = [(x) => Math.hypot(x[0] - P[0], x[1] - P[1]) - r1, (x) => Math.hypot(x[0] - Q[0], x[1] - Q[1]) - r2];
  } else if (mode === 'bisCircle') {
    const A = [int(rng, 1, 3), int(rng, 1, 6)]; const B = [int(rng, 6, 9), int(rng, 1, 6)]; const Cp = [int(rng, 3, 7), int(rng, 2, 5)];
    const r = int(rng, 2, 3);
    if (Math.hypot(Cp[0] - (A[0] + B[0]) / 2, Cp[1] - (A[1] + B[1]) / 2) > r - 0.6) throw new Error('far');
    pts.A = A; pts.B = B; pts.C = Cp;
    // perpendicular bisector across the rectangle
    const m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; const dir = [-(B[1] - A[1]), B[0] - A[0]];
    const far = (t) => [m[0] + dir[0] * t, m[1] + dir[1] * t];
    draws += `<g clip-path="url(#lociclip)">${line(...M(far(-10)), ...M(far(10)), { color: ACCENT, width: 2, dash: '7 5' })}</g>`;
    draws += circle(...M(Cp), r * s, { color: ACCENT2, width: 2 });
    conds = [['closer to $A$ than to $B$', 'closer to $B$ than to $A$'], [`less than ${r} cm from $C$`, `more than ${r} cm from $C$`]];
    tests = [(x) => Math.hypot(x[0] - A[0], x[1] - A[1]) - Math.hypot(x[0] - B[0], x[1] - B[1]), (x) => Math.hypot(x[0] - Cp[0], x[1] - Cp[1]) - r];
  } else {
    // garden corner: lines along the bottom edge (AB) and the left edge (AD); bisector of angle A
    const r = int(rng, 3, 5); const Cp = [int(rng, 2, 4), int(rng, 2, 4)];
    pts.A = [0, 0]; pts.C = Cp;
    draws += line(...M([0, 0]), ...M([7, 7]), { color: ACCENT, width: 2, dash: '7 5' }) + circle(...M(Cp), r * s, { color: ACCENT2, width: 2 });
    conds = [['closer to the bottom edge than to the left edge', 'closer to the left edge than to the bottom edge'], [`less than ${r} cm from $C$`, `more than ${r} cm from $C$`]];
    tests = [(x) => x[1] - x[0], (x) => Math.hypot(x[0] - Cp[0], x[1] - Cp[1]) - r];
  }
  // find a good label point for each of the 4 combinations
  const combos = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const best = combos.map(() => null);
  for (let x = 0.5; x <= Wc - 0.5; x += 0.25) {
    for (let y = 0.5; y <= Hc - 0.5; y += 0.25) {
      const v = tests.map((t) => t([x, y]));
      const ci = combos.findIndex(([a, b]) => (a === 0 ? v[0] < 0 : v[0] > 0) && (b === 0 ? v[1] < 0 : v[1] > 0));
      const clear = Math.min(Math.abs(v[0]) / (mode === 'bisCircle' ? 1.2 : mode === 'angleCircle' ? 1.414 : 1), Math.abs(v[1]), x, y, Wc - x, Hc - y,
        ...Object.values(pts).map((p) => Math.hypot(p[0] - x, p[1] - y) * 0.8));
      if (!best[ci] || clear > best[ci].clear) best[ci] = { p: [x, y], clear };
    }
  }
  if (best.some((b) => !b || b.clear < 0.45)) throw new Error('tiny region');
  const labels = pick(rng, [['R', 'S', 'T', 'U'], ['P', 'Q', 'R', 'S'].filter((l) => !pts[l]).length === 4 ? ['W', 'X', 'Y', 'Z'] : ['W', 'X', 'Y', 'Z'], ['J', 'K', 'L', 'M']]);
  const order = shuffle(rng, [0, 1, 2, 3]);
  const lab = combos.map((_, i) => labels[order[i]]);
  let body = g.body + `<defs><clipPath id="lociclip"><rect x="${M([0, Hc])[0]}" y="${M([0, Hc])[1]}" width="${Wc * s}" height="${Hc * s}"/></clipPath></defs>` + polygon([M([0, 0]), M([Wc, 0]), M([Wc, Hc]), M([0, Hc])], { fill: 'none', width: 2 });
  body += `<g clip-path="url(#lociclip)">${draws}</g>`;
  for (const [nm, p] of Object.entries(pts)) body += dot(...M(p), 3.5) + htext(M(p)[0] + 9, M(p)[1] - 10, nm, { size: 14, italic: true });
  combos.forEach((_, i) => { body += htext(...M(best[i].p), lab[i], { size: 16, bold: true }); });
  const target = int(rng, 0, 3);
  const [a, b] = combos[target];
  const desc = `${conds[0][a]} <b>and</b> ${conds[1][b]}`;
  const ans = lab[target];
  return {
    prompt: `The diagram is drawn on a centimetre grid${mode === 'angleCircle' ? ' and shows the corner of a garden' : ''}.${mode === 'bisCircle' ? ' The dashed line is the perpendicular bisector of $AB$.' : mode === 'angleCircle' ? ' The dashed line bisects the angle at the corner.' : ''}<br>Which labelled region contains the points that are ${desc}?`,
    visual: svg(g.width, g.height, body, { maxWidth: 380 }),
    answer: `Region ${ans}`,
    distractors: lab.filter((l) => l !== ans).map((l) => `Region ${l}`),
    count: 4,
    solution: [
      mode === 'twoCircles' ? `Points less than ${'r'} cm from a point are inside the circle around it; more than that are outside.`.replace(`${'r'} cm`, 'the radius') : mode === 'bisCircle' ? 'Points closer to $A$ than $B$ are on $A$’s side of the perpendicular bisector. Points less than the radius from $C$ are inside the circle.' : 'Points closer to one edge than the other lie on that edge’s side of the angle bisector. Points less than the radius from $C$ are inside the circle.',
      `Region ${ans} is ${desc.replace(/<\/?b>/g, '')}.`,
      `Answer: Region ${ans}`,
    ],
  };
}, { title: 'Regions defined by loci' });

function constructionPanel(kind, letters, rng) {
  const W = 300; const H = 230; let body = '';
  const arc = (c, r, a0, a1) => {
    const [s, e] = a0 < a1 ? [a0, a1] : [a1, a0];
    const p1 = polar(c, r, s); const p2 = polar(c, r, e);
    return path(`M ${p1[0]} ${p1[1]} A ${r} ${r} 0 ${e - s > 180 ? 1 : 0} 0 ${p2[0]} ${p2[1]}`, { width: 1.3, color: MUTED });
  };
  const L = (P, t, dx, dy) => text(P[0] + dx, P[1] + dy, t, { size: 15, italic: true });
  const deg = (P, Q) => (Math.atan2(-(Q[1] - P[1]), Q[0] - P[0]) * 180) / Math.PI;
  if (kind === 'perp') {
    const half = int(rng, 65, 90); const tilt = int(rng, -12, 12);
    const M = [150, 120]; const A = polar(M, half, 180 + tilt); const B = polar(M, half, tilt);
    const r = half + int(rng, 25, 40); const hgt = Math.sqrt(r * r - half * half);
    const top = polar(M, hgt, 90 + tilt); const bot = polar(M, hgt, -90 + tilt);
    const aT = deg(A, top); const aB = deg(A, bot); const bT = deg(B, top); const bB = deg(B, bot);
    body += line(...A, ...B, { width: 2 }) + arc(A, r, aT - 12, aT + 12) + arc(A, r, aB - 12, aB + 12) + arc(B, r, bT - 12, bT + 12) + arc(B, r, bB - 12, bB + 12);
    body += line(...polar(top, 18, 90 + tilt), ...polar(bot, 18, -90 + tilt), { width: 2, color: ACCENT });
    body += dot(...A, 3) + dot(...B, 3) + L(A, letters[0], -12, 4) + L(B, letters[1], 12, 4);
  } else if (kind === 'angle') {
    const ang = int(rng, 45, 85); const V = [55, 195]; const P1 = polar(V, 225, 0); const P2 = polar(V, 205, ang);
    const r = int(rng, 60, 80); const q1 = polar(V, r, 0); const q2 = polar(V, r, ang);
    const meet = polar(V, 2 * r * Math.cos((ang * Math.PI) / 360), ang / 2);
    body += line(...V, ...P1, { width: 2 }) + line(...V, ...P2, { width: 2 }) + arc(V, r, -10, ang + 10);
    const R2 = Math.hypot(meet[0] - q1[0], meet[1] - q1[1]);
    body += arc(q1, R2, deg(q1, meet) - 14, deg(q1, meet) + 14) + arc(q2, R2, deg(q2, meet) - 14, deg(q2, meet) + 14);
    body += line(...V, ...polar(V, 215, ang / 2), { width: 2, color: ACCENT });
    body += L(V, letters[1], -12, 6) + L(P1, letters[0], 4, 14) + L(P2, letters[2], 8, -4);
  } else if (kind === 'perpPoint') {
    const A = [35, 165]; const B = [265, 165]; const px = int(rng, 110, 190); const Pp = [px, int(rng, 50, 75)]; const dy = 165 - Pp[1]; const r = dy + int(rng, 25, 45);
    const dx = Math.sqrt(r * r - dy * dy);
    const x1 = [px - dx, 165]; const x2 = [px + dx, 165];
    const below = [px, 165 + int(rng, 35, 50)]; const R2 = Math.hypot(below[0] - x1[0], below[1] - x1[1]);
    body += line(...A, ...B, { width: 2 }) + arc(Pp, r, deg(Pp, x1) - 8, deg(Pp, x1) + 8) + arc(Pp, r, deg(Pp, x2) - 8, deg(Pp, x2) + 8);
    body += arc(x1, R2, deg(x1, below) - 12, deg(x1, below) + 12) + arc(x2, R2, deg(x2, below) - 12, deg(x2, below) + 12);
    body += line(...Pp, below[0], below[1] + 10, { width: 2, color: ACCENT }) + dot(...Pp, 3) + L(Pp, letters[0], 12, -4) + L(A, letters[1], -10, 14) + L(B, letters[2], 10, 14);
  } else if (kind === 'sss') {
    const ab = int(rng, 160, 200); const A = [150 - ab / 2, 190]; const B = [150 + ab / 2, 190]; const ac = int(rng, 100, 140); const bc = int(rng, 110, 150);
    const x = (ab * ab + ac * ac - bc * bc) / (2 * ab); const y = Math.sqrt(Math.max(1, ac * ac - x * x)); const Cc = [A[0] + x, A[1] - y];
    body += polygon([A, B, Cc], { fill: 'none', width: 2, color: ACCENT }) + line(...A, ...B, { width: 2 });
    body += arc(A, ac, deg(A, Cc) - 12, deg(A, Cc) + 12) + arc(B, bc, deg(B, Cc) - 12, deg(B, Cc) + 12);
    body += L(A, letters[0], -12, 6) + L(B, letters[1], 12, 6) + L(Cc, letters[2], 0, -12);
  } else {
    const V = [60, 195]; const r = int(rng, 90, 120); const q = polar(V, r, 0); const t = polar(V, r, 60);
    body += line(...V, 275, 195, { width: 2 }) + arc(V, r, -8, 72) + arc(q, r, deg(q, t) - 14, deg(q, t) + 14) + line(...V, ...polar(V, 205, 60), { width: 2, color: ACCENT });
    body += L(V, letters[0], -12, 6) + L([275, 195], letters[1], 6, 14);
  }
  return figure(W, H, body);
}

export const constructRecognise = ggen('geo-construct-recognise', 'geo-constructions-loci', (rng, d) => {
  const kinds = d === 'easy' ? ['perp', 'angle'] : ['perp', 'angle', 'perpPoint', 'sss', 'sixty'];
  const kind = pick(rng, kinds);
  const letters = pick(rng, [['A', 'B', 'C'], ['P', 'Q', 'R'], ['X', 'Y', 'Z'], ['D', 'E', 'F'], ['L', 'M', 'N']]);
  const [a, b, c] = letters;
  const names = {
    perp: `The perpendicular bisector of $${a}${b}$`,
    angle: `The bisector of angle $${a}${b}${c}$`,
    perpPoint: `The perpendicular from $${a}$ to the line $${b}${c}$`,
    sss: `Triangle $${a}${b}${c}$ from its three side lengths`,
    sixty: `An angle of $60^\\circ$ at $${a}$`,
  };
  const wrongNames = [
    `The perpendicular bisector of $${a}${b}$`, `The bisector of angle $${a}${b}${c}$`, `The perpendicular from $${a}$ to the line $${b}${c}$`,
    `The midpoint of $${a}${b}$ only`, `An angle of $45^\\circ$ at $${b}$`, `An angle of $60^\\circ$ at $${a}$`, `The locus of points ${3} cm from $${a}$`,
  ];
  const ans = names[kind];
  return {
    prompt: 'The diagram shows a construction with ruler and compasses (the coloured line is the result).<br>What has been constructed?',
    visual: constructionPanel(kind, letters, rng),
    answer: ans,
    distractors: shuffle(rng, wrongNames.filter((x) => x !== ans)),
    count: 4,
    solution: [
      { perp: 'Arcs of the same radius from both ends of the line cross above and below it; joining the crossings gives the perpendicular bisector.', angle: 'An arc from the vertex cuts both arms; equal arcs from those two points cross; joining the vertex to the crossing bisects the angle.', perpPoint: 'An arc from the point cuts the line twice; equal arcs from those two points cross on the other side; joining gives the perpendicular from the point to the line.', sss: 'Arcs drawn from each end of the base, with radii equal to the other two sides, cross at the third vertex.', sixty: 'An arc from the vertex, then an arc of the same radius from where it cuts the line, makes an equilateral triangle — so the angle is $60^\\circ$.' }[kind],
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Recognise ruler-and-compass constructions' });

const SCALE_CTX = [
  { t: (L) => `A goat is tied to a post with a rope ${L} m long.`, what: 'the boundary of the region the goat can reach' },
  { t: (L) => `A garden sprinkler waters the ground up to ${L} m from the sprinkler.`, what: 'the edge of the watered region' },
  { t: (L) => `A mobile phone mast has a range of ${L} km.`, what: 'the edge of the area the mast covers' },
  { t: (L) => `A dog is on a lead ${L} m long, fixed to a hook in a wall.`, what: 'the boundary of where the dog can reach' },
  { t: (L) => `A lighthouse can be seen up to ${L} km away.`, what: 'the boundary of the region where the lighthouse can be seen' },
  { t: (L) => `A wifi router reaches up to ${L} m.`, what: 'the edge of the area with wifi' },
];

export const lociScale = ggen('geo-loci-scale', 'geo-constructions-loci', (rng, d) => {
  const ctx = pick(rng, SCALE_CTX);
  const km = ctx.t(1).includes('km');
  const k = km ? pick(rng, [2, 5, 10, 20]) : pick(rng, [2, 4, 5, 10, 50]);
  const rcm = d === 'easy' ? int(rng, 2, 6) : roundTo(int(rng, 4, 14) / 2, 1);
  const L = roundTo(rcm * k, 2);
  const u = km ? 'km' : 'm';
  const reverse = d === 'hard' && chance(rng, 0.5);
  if (reverse) {
    return {
      prompt: `On a scale drawing, 1 cm represents ${k} ${u}.<br>A circle on the drawing shows ${ctx.what}. Its radius on the drawing is ${num(rcm)} cm.<br>What is this distance in real life?`,
      answer: `$${tnum(L)}$ ${u}`,
      distractors: wrongs(L, [rcm / k, rcm + k, 2 * L, L / 2, rcm * k * 10]).map((v) => `$${tnum(v)}$ ${u}`),
      typed: { kind: 'number', value: L },
      solution: [`Each 1 cm on the drawing is ${k} ${u} in real life.`, `$${tnum(rcm)} \\times ${k} = ${tnum(L)}$ ${u}`, `Answer: $${tnum(L)}$ ${u}`],
    };
  }
  return {
    prompt: `${ctx.t(num(L))}<br>On a scale drawing, 1 cm represents ${k} ${u}. The locus of ${ctx.what} is drawn as a circle.<br>What radius should the circle have on the drawing?`,
    answer: `$${tnum(rcm)}$ cm`,
    distractors: wrongs(rcm, [L * k, L, 2 * rcm, rcm / 2, L / (k * 10), rcm + 1]).map((v) => `$${tnum(v)}$ cm`),
    typed: { kind: 'number', value: rcm },
    solution: [`Points within ${num(L)} ${u} of a fixed point make a circle of radius ${num(L)} ${u}.`, `On the drawing: $${tnum(L)} \\div ${k} = ${tnum(rcm)}$ cm`, `Answer: $${tnum(rcm)}$ cm`],
  };
}, { title: 'Loci with scale drawings' });

export const triangleConstruct = ggen('geo-construct-triangle', 'geo-constructions-loci', (rng, d) => {
  if (chance(rng, 0.5)) {
    // two sides given: which could be the third?
    const a = int(rng, 3, 12); const b = int(rng, 3, 12);
    const lo = Math.abs(a - b); const hi = a + b;
    const ok = int(rng, lo + 1, hi - 1);
    const bad = [hi, hi + int(rng, 1, 4), lo, Math.max(1, lo - int(rng, 1, 2)), hi + 6].filter((v, i, arr) => v > 0 && v !== ok && arr.indexOf(v) === i);
    return {
      prompt: `Two sides of a triangle are ${a} cm and ${b} cm.<br>Which of these could be the length of the third side?`,
      answer: `$${ok}$ cm`,
      distractors: bad.map((v) => `$${v}$ cm`),
      count: 4,
      typed: undefined,
      solution: [
        'Any two sides of a triangle must add up to more than the third side.',
        `So the third side must be less than $${a} + ${b} = ${hi}$ and more than $${Math.max(a, b)} - ${Math.min(a, b)} = ${lo}$.`,
        `Only $${ok}$ cm is between ${lo} and ${hi}.`,
        `Answer: $${ok}$ cm`,
      ],
    };
  }
  const wantPossible = chance(rng, 0.5);
  const mk = (ok) => {
    for (;;) {
      const a = int(rng, 2, 12); const b = int(rng, 2, 12);
      const c = ok ? int(rng, Math.abs(a - b) + 1, a + b - 1) : (d === 'hard' ? a + b : a + b + int(rng, 1, 5));
      if (c >= 2 && c <= 20) return [a, b, c];
    }
  };
  const good = mk(wantPossible);
  const others = [];
  while (others.length < 3) { const t = mk(!wantPossible); if (!others.some((o) => o.join() === t.join()) && t.join() !== good.join()) others.push(t); }
  const fmt = (t) => `${t[0]} cm, ${t[1]} cm, ${t[2]} cm`;
  const g = [...good].sort((x, y) => x - y);
  return {
    prompt: wantPossible ? 'Which set of three lengths <b>could</b> be used to construct a triangle?' : 'Three of these sets of lengths can be used to construct a triangle. Which set <b>cannot</b>?',
    answer: fmt(good),
    distractors: others.map(fmt),
    count: 4,
    solution: [
      'For a triangle, the two shorter sides must add up to <b>more</b> than the longest side, or the arcs won’t meet.',
      `${fmt(good)}: $${g[0]} + ${g[1]} = ${g[0] + g[1]}$, which is ${g[0] + g[1] > g[2] ? 'more than' : g[0] + g[1] === g[2] ? 'equal to' : 'less than'} $${g[2]}$.`,
      `Answer: ${fmt(good)}`,
    ],
  };
}, { title: 'Can these lengths make a triangle?' });

export const shapeGenerators = [
  shapeName, shapeProperty, polygonNames, fourthVertex,
  symLines, symWhich, symPoint,
  solidFEV, solidName, solidFormula, solidNets, solidEdges,
  planChoose, planCount, planNameSolid,
  lociWhich, lociRegion, constructRecognise, lociScale, triangleConstruct,
];

void [scale, centroid, arcLabel, FILL2, SHADE, GRID, cylinderFig, coneFig, sphereFig, textWidth];
