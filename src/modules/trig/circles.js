// Parts of a circle and circle theorems. Every diagram is built from the actual angles: points are placed on
// the unit circle at positions whose arcs give exactly the angles stated in the question.
import { gen, pick, int, shuffle, num, tnum, chance, terms } from '../../core.js';
import { fig, onCircle, FILL, FILL2, ACCENT, ACCENT2 } from './diagrams.js';
import { path as svgPath } from '../../svg.js';
import { At } from './helpers.js';

const deg = (d) => `${d}°`;
const rad = (d) => (d * Math.PI) / 180;
const tanDir = (a) => [-Math.sin(rad(a)), Math.cos(rad(a))];

/**
 * Circle figure. on: { A: angleDeg } points on the unit circle centre O; ext: { P: [x, y] } other points.
 * draw(g) adds chords etc.; names on the circle are pushed outwards from O.
 */
function circleFig({ on = {}, ext = {}, showO = true, rotate = 0, draw, nameDirs = {}, width = 340, height = 260, hideNames = [] }) {
  const pts = { O: [0, 0] };
  for (const [k, a] of Object.entries(on)) pts[k] = onCircle([0, 0], 1, a);
  Object.assign(pts, ext);
  return fig({
    pts, rotate, circles: [['O', 1]], width, height, pad: 30,
    draw: (g) => {
      let out = g.circle('O', 1);
      out += draw(g);
      for (const k of Object.keys(on)) if (!hideNames.includes(k)) out += g.name(k, k, nameDirs[k] ? { dir: nameDirs[k] } : { away: 'O' });
      for (const k of Object.keys(ext)) if (!hideNames.includes(k)) out += g.name(k, k, nameDirs[k] ? { dir: nameDirs[k] } : { away: 'O' });
      if (showO) out += g.dot('O', 3) + g.freeName('O', 'O', { size: 15, offset: 4 });
      return out;
    },
  });
}

/** Screen direction for the O label pointing away from a list of points (mean direction reversed). */
function awayDir(points) {
  let x = 0; let y = 0;
  for (const p of points) { const n = Math.hypot(p[0], p[1]) || 1; x += p[0] / n; y += p[1] / n; }
  const n = Math.hypot(x, y);
  if (n < 0.2) return [0.7, 0.75];
  return [-x / n, y / n]; // maths -> screen (y flips)
}

const rot = (rng) => pick(rng, [0, 0, 0, 20, -20, 35, -35, 180]);

/* ------------------------------------------------------------------ */
/* trig-circle-parts                                                   */
/* ------------------------------------------------------------------ */

const PARTS = ['radius', 'diameter', 'chord', 'tangent', 'arc', 'sector', 'segment', 'circumference'];

function partFig(part, rng) {
  const a = int(rng, 0, 359);
  const b = a + int(rng, 70, 140);
  const P1 = onCircle([0, 0], 1, a); const P2 = onCircle([0, 0], 1, b);
  return fig({
    pts: { O: [0, 0], P: P1, Q: P2 }, circles: [['O', 1.25]], width: 300, height: 240, pad: 26, nda: false,
    bounds: [[1.3, 1.3], [-1.3, -1.3]],
    draw: (g) => {
      const R = g.k; const C = g.P('O'); const A = g.P('P'); const B = g.P('Q');
      let out = '';
      if (part === 'sector') out += svgPath(`M ${C[0]} ${C[1]} L ${A[0]} ${A[1]} A ${R} ${R} 0 0 0 ${B[0]} ${B[1]} Z`, { fill: FILL2, color: ACCENT, width: 2.5 });
      if (part === 'segment') out += svgPath(`M ${A[0]} ${A[1]} A ${R} ${R} 0 0 0 ${B[0]} ${B[1]} Z`, { fill: FILL2, color: ACCENT, width: 2.5 });
      out += g.circle('O', 1, { width: part === 'circumference' ? 4 : 2, color: part === 'circumference' ? ACCENT : 'currentColor' });
      out += g.dot('O', 3);
      if (part === 'radius') out += g.seg('O', 'P', { color: ACCENT, width: 3.2 });
      if (part === 'diameter') out += g.seg('P', onCircle([0, 0], 1, a + 180), { color: ACCENT, width: 3.2 });
      if (part === 'chord') out += g.seg('P', 'Q', { color: ACCENT, width: 3.2 });
      if (part === 'tangent') { const t = tanDir(a); out += g.seg([P1[0] - 0.9 * t[0], P1[1] - 0.9 * t[1]], [P1[0] + 0.9 * t[0], P1[1] + 0.9 * t[1]], { color: ACCENT, width: 3.2 }); }
      if (part === 'arc') out += svgPath(`M ${A[0]} ${A[1]} A ${R} ${R} 0 0 0 ${B[0]} ${B[1]}`, { color: ACCENT, width: 5 });
      if (part === 'radius') g.seg('O', 'P');
      if (part === 'diameter') g.seg('P', onCircle([0, 0], 1, a + 180));
      if (part === 'sector') { g.seg('O', 'P'); g.seg('O', 'Q'); }
      return out + g.freeName('O', 'O', { size: 15, offset: 4 });
    },
  });
}

const PART_DEFS = {
  radius: 'a straight line from the centre to the circumference',
  diameter: 'a straight line from one side of the circle to the other, through the centre',
  chord: 'a straight line joining two points on the circumference (not through the centre)',
  tangent: 'a straight line that touches the circle at exactly one point',
  arc: 'part of the circumference',
  sector: 'the region between two radii and an arc (a "pizza slice")',
  segment: 'the region between a chord and an arc',
  circumference: 'the distance all the way round the circle (its perimeter)',
};

export const circlePartName = gen('trig-circle-part-name', 'trig-circle-parts', (rng, d) => {
  const pool = d === 'easy' ? ['radius', 'diameter', 'chord', 'tangent', 'circumference'] : d === 'medium' ? PARTS : ['sector', 'segment', 'arc', 'chord', 'tangent', 'circumference'];
  if (d === 'hard') rng();
  const part = pick(rng, pool);
  const isRegion = ['sector', 'segment'].includes(part);
  const isLine = ['radius', 'diameter', 'chord', 'tangent'].includes(part);
  const confusers = { radius: ['diameter', 'chord'], diameter: ['radius', 'chord'], chord: ['diameter', 'tangent'], tangent: ['chord', 'radius'], arc: ['circumference', 'chord'], sector: ['segment', 'arc'], segment: ['sector', 'chord'], circumference: ['arc', 'diameter'] }[part];
  const ds = [...confusers, ...shuffle(rng, PARTS.filter((p) => p !== part && !confusers.includes(p)))];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    prompt: `The diagram shows a circle with centre $O$. What is the name of the ${isRegion ? 'shaded region' : isLine ? 'coloured line' : 'coloured curve'}?`,
    visual: partFig(part, rng),
    answer: cap(part),
    distractors: ds.map(cap),
    solution: [
      `A ${part} is ${PART_DEFS[part]}.`,
      part === 'sector' ? 'Sectors are bounded by two radii; segments are cut off by a chord.' : part === 'segment' ? 'A segment is cut off by a chord; a sector is bounded by two radii.' : part === 'chord' ? 'It does not pass through the centre, so it is not a diameter.' : part === 'diameter' ? 'It passes through the centre, so it is a diameter (the longest chord).' : part === 'tangent' ? 'It touches the circle but does not cross it.' : part === 'arc' ? 'An arc is only part of the circumference.' : part === 'radius' ? 'It goes from the centre to the edge.' : 'The whole curve round the circle is the circumference.',
      `Answer: <b>${cap(part)}</b>`,
    ],
  };
}, { title: 'Name the part of the circle' });

export const circlePartDef = gen('trig-circle-part-def', 'trig-circle-parts', (rng, d) => {
  const pool = d === 'easy' ? ['radius', 'diameter', 'chord', 'tangent', 'circumference'] : PARTS;
  const part = pick(rng, pool);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const reverse = d !== 'easy' && chance(rng, 0.5);
  if (reverse) {
    return {
      prompt: `Which of these describes a <b>${part}</b>?`,
      answer: cap(PART_DEFS[part]),
      distractors: shuffle(rng, PARTS.filter((p) => p !== part)).map((p) => cap(PART_DEFS[p])),
      count: 4,
      solution: [`A ${part} is ${PART_DEFS[part]}.`, `Answer: ${cap(PART_DEFS[part])}`],
    };
  }
  const stems = [`What is the name for ${PART_DEFS[part]}?`, `Complete the sentence: "${cap(PART_DEFS[part])} is called a …"`, `Which word means ${PART_DEFS[part]}?`, `${pick(rng, ['Ravi', 'Mia', 'Zara', 'Tom', 'Leo'])} draws ${PART_DEFS[part]}. What is it called?`, `In a circle, what do we call ${PART_DEFS[part]}?`];
  if (part === 'diameter') stems.push('What is the name of the longest chord of a circle?');
  return {
    prompt: pick(rng, stems),
    answer: cap(part),
    distractors: shuffle(rng, PARTS.filter((p) => p !== part)).map(cap),
    solution: [`A ${part} is ${PART_DEFS[part]}.`, `Answer: <b>${cap(part)}</b>`],
  };
}, { title: 'Circle vocabulary' });

export const circleRadiusDiameter = gen('trig-circle-radius-diameter', 'trig-circle-parts', (rng, d) => {
  let r = d === 'easy' ? int(rng, 2, 15) : d === 'medium' ? int(rng, 3, 30) + pick(rng, [0, 0.5]) : int(rng, 31, 199) / 20;
  if (d === 'hard' && Number.isInteger(r * 2)) r += 0.05;
  r = Math.round(r * 100) / 100;
  const mode = d === 'hard' ? pick(rng, ['d2r', 'op', 'chord']) : pick(rng, ['r2d', 'd2r', 'chord', 'op']);
  const u = pick(rng, ['cm', 'mm', 'm']);
  const f = (v) => `${num(v)} ${u}`;
  let prompt; let ans; let wrong; let sol;
  if (mode === 'r2d') { prompt = `A circle has radius ${f(r)}. What is its diameter?`; ans = 2 * r; wrong = [r / 2, r, r * r, 4 * r, r + 2]; sol = ['The diameter is twice the radius.', `$2 \\times ${tnum(r)} = ${tnum(2 * r)}$`]; }
  else if (mode === 'd2r') { prompt = `A circle has diameter ${f(2 * r)}. What is its radius?`; ans = r; wrong = [4 * r, 2 * r, r / 2, 2 * r - 2, r + 1]; sol = ['The radius is half the diameter.', `$${tnum(2 * r)} \\div 2 = ${tnum(r)}$`]; }
  else if (mode === 'chord') { prompt = `A circle has radius ${f(r)}. What is the length of the longest chord that can be drawn in this circle?`; ans = 2 * r; wrong = [r, r / 2, r * r, 3 * r, 4 * r]; sol = ['The longest chord passes through the centre: it is a diameter.', `Diameter $= 2 \\times ${tnum(r)} = ${tnum(2 * r)}$`]; }
  else { prompt = `$P$ and $Q$ are points on a circle with centre $O$. $PQ$ is a diameter of length ${f(2 * r)}. What is the length of $OP$?`; ans = r; wrong = [2 * r, r / 2, 4 * r, r + 1, Math.max(0.5, r - 1)]; sol = ['$OP$ goes from the centre to the circle, so it is a radius: half the diameter.', `$${tnum(2 * r)} \\div 2 = ${tnum(r)}$`]; }
  return {
    prompt,
    answer: f(ans),
    distractors: wrong.filter((v) => v > 0).map(f).filter((t) => !/\.\d{3,}/.test(t)),
    typed: { kind: 'number', value: ans },
    solution: [...sol, `Answer: <b>${f(ans)}</b>`],
  };
}, { title: 'Radius, diameter and the longest chord' });

/* ------------------------------------------------------------------ */
/* trig-circle-theorems (single step)                                  */
/* ------------------------------------------------------------------ */

const angFmt = (v) => `${v}°`;
const angOpts = (ans, list) => [...new Set(list.filter((v) => v > 0 && v < 360 && v !== ans).map(angFmt))];

/** Angle at the centre configuration: A at a0, B at a0 + 2x, C on the major arc. */
function centreConfig(rng, x, labels, { reflex = false } = {}) {
  // With C at the top: A and B placed symmetrically-ish below.
  const base = reflex ? 90 - x : 270 - x; // central angle AOB = 2x centred at the bottom (or top for reflex)
  const a0 = base + int(rng, -12, 12);
  const on = { A: a0, B: a0 + 2 * x };
  // C on the other arc
  const spare = 360 - 2 * x;
  // keep C away from the points diametrically opposite A and B, so no chord runs through O
  for (let i = 0; i < 30; i += 1) {
    on.C = a0 + 2 * x + spare * (0.3 + 0.4 * rng());
    const far = (t) => Math.abs((((on.C - t - 180) % 360) + 540) % 360 - 180) > 35;
    if (far(on.A) && far(on.B)) break;
  }
  const r = rot(rng);
  return circleFig({
    on, rotate: r,
    nameDirs: { O: awayDir([onCircle([0, 0], 1, on.A), onCircle([0, 0], 1, on.B)].map((p) => rotP(p, r))) },
    draw: (g) => {
      let out = g.seg('C', 'A') + g.seg('C', 'B') + g.seg('O', 'A') + g.seg('O', 'B');
      out += g.angle('C', 'A', 'B', labels.C ?? null);
      out += g.angle('O', 'A', 'B', labels.O ?? null, { reflex: false });
      return out;
    },
  });
}
const rotP = ([x, y], r) => [x * Math.cos(rad(r)) - y * Math.sin(rad(r)), x * Math.sin(rad(r)) + y * Math.cos(rad(r))];

export const ctCentre = gen('trig-ct-centre', 'trig-circle-theorems', (rng, d) => {
  if (d === 'hard' && chance(rng, 0.5)) {
    // Reflex angle at the centre; C on the minor arc so angle ACB is obtuse.
    const y = int(rng, 95, 140); // angle ACB
    const R = 2 * y; // reflex AOB
    const minor = 360 - R;
    const a0 = 90 - minor / 2 + int(rng, -10, 10);
    const on = { A: a0, B: a0 + minor, C: a0 + minor * (0.35 + 0.3 * rng()) };
    const giveCentre = chance(rng, 0.5);
    const vis = circleFig({
      on, rotate: pick(rng, [0, 0, 180, 20, -20]),
      draw: (g) => g.seg('C', 'A') + g.seg('C', 'B') + g.seg('O', 'A') + g.seg('O', 'B')
        + g.angle('C', 'A', 'B', giveCentre ? 'x' : deg(y)) + g.angle('O', 'A', 'B', giveCentre ? deg(R) : 'x', { reflex: true, r: 16 }),
    });
    const ans = giveCentre ? y : R;
    return {
      prompt: `$A$, $B$ and $C$ are points on a circle with centre $O$. ${giveCentre ? `The <b>reflex</b> angle $AOB$ is ${deg(R)}.` : 'Angle $x$ is the <b>reflex</b> angle $AOB$.'} Work out the size of angle $x$.`,
      visual: vis,
      answer: angFmt(ans),
      distractors: angOpts(ans, giveCentre ? [minor, minor / 2, 180 - y, R - 180, 360 - y] : [y / 2, minor, 360 - y, 2 * (180 - y), 180 + y]).filter((t) => !t.includes('.')),
      typed: { kind: 'number', value: ans },
      solution: [
        '<b>The angle at the centre is twice the angle at the circumference.</b> Here angle $ACB$ stands on the major arc, so the matching angle at the centre is the <b>reflex</b> angle $AOB$.',
        giveCentre ? `$x = ${R} \\div 2 = ${y}^\\circ$` : `$x = 2 \\times ${y} = ${R}^\\circ$`,
        `(Check: the non-reflex angle $AOB$ is $360^\\circ - ${R}^\\circ = ${minor}^\\circ$.)`,
        `Answer: <b>${angFmt(ans)}</b>`,
      ],
    };
  }
  const x = int(rng, d === 'easy' ? 25 : 20, d === 'easy' ? 70 : 80);
  const giveCentre = chance(rng, 0.5);
  const xs = giveCentre ? 2 * x : x;
  const ans = giveCentre ? x : 2 * x;
  const vis = centreConfig(rng, x, giveCentre ? { O: deg(2 * x), C: 'x' } : { O: 'x', C: deg(x) });
  return {
    prompt: `$A$, $B$ and $C$ are points on a circle with centre $O$. Work out the size of angle $x$.`,
    visual: vis,
    answer: angFmt(ans),
    distractors: angOpts(ans, giveCentre ? [4 * x, 2 * x, 180 - 2 * x, 90 - x, 180 - x, 360 - 2 * x] : [x / 2, x, 180 - x, 180 - 2 * x, 90 + x, 360 - 2 * x].map((v) => (Number.isInteger(v) ? v : -1))),
    typed: { kind: 'number', value: ans },
    hint: 'Which angle is at the centre and which is at the circumference? Both stand on the arc $AB$.',
    solution: [
      '<b>The angle at the centre is twice the angle at the circumference</b> (when both stand on the same arc).',
      giveCentre ? `Angle $AOB = ${At(xs)}$ is at the centre, so the angle at the circumference is half of it.` : `Angle $ACB = ${At(xs)}$ is at the circumference, so the angle at the centre is double it.`,
      giveCentre ? `$x = ${2 * x} \\div 2 = ${x}$` : `$x = 2 \\times ${x} = ${2 * x}$`,
      `Answer: <b>${angFmt(ans)}</b>`,
    ],
  };
}, { title: 'Angle at the centre is twice the angle at the circumference' });

export const ctSemicircle = gen('trig-ct-semicircle', 'trig-circle-theorems', (rng, d) => {
  const a = int(rng, 20, 70);
  // A at 180, B at 0 (diameter), C at 2a (upper half): angle CAB = a.
  const r = rot(rng);
  const flipped = chance(rng);
  const on = { A: 180, B: 0, C: flipped ? 180 - 2 * a : 2 * a };
  // with flip the angle a is at B instead; keep labels consistent
  const atA = !flipped;
  const vis = circleFig({
    on, rotate: r, nameDirs: { O: awayDir([rotP(onCircle([0, 0], 1, on.C), r)]) },
    draw: (g) => g.seg('A', 'B') + g.seg('A', 'C') + g.seg('B', 'C')
      + g.angle(atA ? 'A' : 'B', 'C', atA ? 'B' : 'A', deg(a)) + g.angle(atA ? 'B' : 'A', atA ? 'A' : 'B', 'C', 'x'),
  });
  if (d === 'hard') {
    // algebra: the two acute angles are p x + q and r2 x + s2; the right angle is at C
    let p; let q; let r2; let s2; let xv;
    for (let i = 0; i < 200; i += 1) {
      xv = int(rng, 6, 20); p = int(rng, 2, 4); r2 = int(rng, 1, 3);
      q = a - p * xv; s2 = 90 - a - r2 * xv;
      if (Math.abs(q) <= 30 && Math.abs(s2) <= 30 && q !== 0 && s2 !== 0) break;
    }
    const ex = (m, c) => `${m === 1 ? '' : m}x ${c < 0 ? '-' : '+'} ${Math.abs(c)}`;
    const visA = circleFig({
      on, rotate: r, nameDirs: { O: awayDir([rotP(onCircle([0, 0], 1, on.C), r)]) },
      draw: (g) => g.seg('A', 'B') + g.seg('A', 'C') + g.seg('B', 'C')
        + g.angle(atA ? 'A' : 'B', 'C', atA ? 'B' : 'A', `(${ex(p, q)})°`.replace(/ /g, '')) + g.angle(atA ? 'B' : 'A', atA ? 'A' : 'B', 'C', `(${ex(r2, s2)})°`.replace(/ /g, '')),
    });
    const sumC = q + s2;
    return {
      prompt: `$A$, $B$ and $C$ are points on a circle with centre $O$. $AB$ is a diameter.<br>Angle $${atA ? 'CAB' : 'CBA'} = (${ex(p, q)})^\\circ$ and angle $${atA ? 'ABC' : 'BAC'} = (${ex(r2, s2)})^\\circ$. Work out the value of $x$.`,
      visual: visA,
      answer: num(xv),
      distractors: [(180 - sumC) / (p + r2), (360 - sumC) / (p + r2), (90 + sumC) / (p + r2), xv + 2, xv - 3, xv + 5].filter((v) => Number.isInteger(v) && v > 0 && v !== xv).map((v) => num(v)),
      typed: { kind: 'number', value: xv },
      solution: [
        '<b>The angle in a semicircle is $90^\\circ$</b>, so the other two angles of triangle $ABC$ add up to $90^\\circ$.',
        `$(${ex(p, q)}) + (${ex(r2, s2)}) = 90$`,
        `$${terms([[p + r2, 'x'], [sumC, '']])} = 90$${sumC ? `, so $${p + r2}x = ${90 - sumC}$` : ''} and $x = ${xv}$`,
        `Answer: <b>${xv}</b>`,
      ],
    };
  }
  const ans = 90 - a;
  return {
    prompt: `$A$, $B$ and $C$ are points on a circle with centre $O$. $AB$ is a diameter. Work out the size of angle $x$.`,
    visual: vis,
    answer: angFmt(ans),
    distractors: angOpts(ans, [180 - a, a, 90, 180 - 2 * a, 2 * a, 90 + a]),
    typed: { kind: 'number', value: ans },
    hint: 'What is the angle at $C$?',
    solution: [
      '<b>The angle in a semicircle is a right angle</b>, so angle $ACB = 90^\\circ$.',
      `Angles in a triangle add up to $180^\\circ$: $x = 180^\\circ - 90^\\circ - ${At(a)}$`,
      `$x = ${ans}^\\circ$`,
      `Answer: <b>${angFmt(ans)}</b>`,
    ],
  };
}, { title: 'Angle in a semicircle' });

export const ctSameSegment = gen('trig-ct-same-segment', 'trig-circle-theorems', (rng, d) => {
  const y = int(rng, 25, 70);
  // A at a0, B at a0 + 2y (minor arc AB = 2y); C and D on the major arc.
  const a0 = 250 - y + int(rng, -10, 10);
  const spare = 360 - 2 * y;
  const on = { A: a0, B: a0 + 2 * y, C: a0 + 2 * y + spare * (0.2 + 0.15 * rng()), D: a0 + 2 * y + spare * (0.6 + 0.2 * rng()) };
  const algebra = d === 'hard';
  let k = 0; let c = 0; let xVal = 0;
  if (algebra) { k = pick(rng, [2, 3]); xVal = int(rng, 5, Math.floor((y - 5) / k)); c = y - k * xVal; if (c <= 0) { c = 5; xVal = (y - 5) / k; } }
  const algTex = algebra ? `${k}x ${c >= 0 ? '+' : '-'} ${Math.abs(c)}` : '';
  const labelD = algebra ? `(${k}x+${c})°` : 'x';
  const vis = circleFig({
    on, rotate: rot(rng), showO: false,
    draw: (g) => g.seg('A', 'C') + g.seg('B', 'C') + g.seg('A', 'D') + g.seg('B', 'D') + g.angle('C', 'A', 'B', deg(y)) + g.angle('D', 'A', 'B', labelD),
  });
  if (algebra && Number.isInteger(xVal)) {
    return {
      prompt: `$A$, $B$, $C$ and $D$ are points on a circle. Angle $ACB = ${At(y)}$ and angle $ADB = (${algTex})^\\circ$.<br>Work out the value of $x$.`,
      visual: vis,
      answer: num(xVal),
      distractors: [num((180 - y - c) / k), num((y + c) / k), num(y - c), num((2 * y - c) / k), num(xVal + 1), num(xVal - 1)].filter((s) => !s.includes('.') || s.split('.')[1].length <= 1),
      typed: { kind: 'number', value: xVal },
      solution: [
        '<b>Angles in the same segment are equal</b>: angles $ACB$ and $ADB$ both stand on the chord $AB$.',
        `So $${algTex} = ${y}$`,
        `$${k}x = ${y - c}$, so $x = ${xVal}$`,
        `Answer: <b>${xVal}</b>`,
      ],
    };
  }
  return {
    prompt: `$A$, $B$, $C$ and $D$ are points on a circle. Work out the size of angle $x$.`,
    visual: vis,
    answer: angFmt(y),
    distractors: angOpts(y, [180 - y, 2 * y, y / 2, 90 - y, 360 - 2 * y].map((v) => (Number.isInteger(v) ? v : -1))),
    typed: { kind: 'number', value: y },
    solution: [
      'Angles $ACB$ and $ADB$ both stand on the same chord $AB$, from the same side of it.',
      '<b>Angles in the same segment are equal.</b>',
      `Answer: <b>${angFmt(y)}</b>`,
    ],
  };
}, { title: 'Angles in the same segment' });

export const ctCyclic = gen('trig-ct-cyclic', 'trig-circle-theorems', (rng, d) => {
  const a = int(rng, 55, 125);
  // vertices anticlockwise A, B, C, D with arc B->D (through C) = 2a so angle at A = a.
  const tB = int(rng, 0, 359); const tD = tB + 2 * a;
  const tC = tB + 2 * a * (0.35 + 0.3 * rng());
  const spare = 360 - 2 * a; const tA = tD + spare * (0.35 + 0.3 * rng());
  const on = { A: tA, B: tB, C: tC, D: tD };
  const algebra = d === 'hard';
  let p; let q; let xv; let pTex; let qTex;
  if (algebra) {
    // angle A = p*x + q1, angle C = 180 - that, written as r*x + q2
    for (;;) {
      xv = int(rng, 10, 40); const m1 = int(rng, 2, 4); const m2 = int(rng, 1, 3);
      const q1 = a - m1 * xv; const q2 = 180 - a - m2 * xv;
      if (q1 > -40 && q2 > -40 && q1 !== 0 && q2 !== 0 && Math.abs(q1) < 80 && Math.abs(q2) < 80) { p = [m1, q1]; q = [m2, q2]; break; }
    }
    pTex = `${p[0]}x ${p[1] < 0 ? '-' : '+'} ${Math.abs(p[1])}`; qTex = `${q[0] === 1 ? '' : q[0]}x ${q[1] < 0 ? '-' : '+'} ${Math.abs(q[1])}`;
  }
  const vis = circleFig({
    on, rotate: 0, showO: false,
    draw: (g) => g.poly('ABCD', { fill: FILL, fillOpacity: 0.6 }) + g.angle('A', 'B', 'D', algebra ? `(${pTex})°`.replace(/ /g, '') : deg(a)) + g.angle('C', 'D', 'B', algebra ? `(${qTex})°`.replace(/ /g, '') : 'x'),
  });
  if (algebra) {
    return {
      prompt: `$ABCD$ is a cyclic quadrilateral. Angle $DAB = (${pTex})^\\circ$ and angle $BCD = (${qTex})^\\circ$.<br>Work out the value of $x$.`,
      visual: vis,
      answer: num(xv),
      distractors: [num((360 - p[1] - q[1]) / (p[0] + q[0])), num((q[1] - p[1]) / (p[0] - q[0] || 1)), num((90 - p[1] - q[1]) / (p[0] + q[0])), num(xv + 5), num(xv - 2)].filter((s) => /^\d+$/.test(s) && s !== num(xv)),
      typed: { kind: 'number', value: xv },
      solution: [
        '<b>Opposite angles of a cyclic quadrilateral add up to $180^\\circ$.</b>',
        `$(${pTex}) + (${qTex}) = 180$`,
        `$${terms([[p[0] + q[0], 'x'], [p[1] + q[1], '']])} = 180$${p[1] + q[1] ? `, so $${p[0] + q[0]}x = ${180 - p[1] - q[1]}$` : ''} and $x = ${xv}$`,
        `Answer: <b>${xv}</b>`,
      ],
    };
  }
  const ans = 180 - a;
  return {
    prompt: `$A$, $B$, $C$ and $D$ are points on a circle. Work out the size of angle $x$.`,
    visual: vis,
    answer: angFmt(ans),
    distractors: angOpts(ans, [a, 360 - a, 90 - a / 2, a / 2, 2 * a, 90].map((v) => (Number.isInteger(v) ? v : -1))),
    typed: { kind: 'number', value: ans },
    solution: [
      '$ABCD$ is a <b>cyclic quadrilateral</b> (all four vertices are on the circle).',
      '<b>Opposite angles of a cyclic quadrilateral add up to $180^\\circ$</b> (they are not equal!).',
      `$x = 180^\\circ - ${At(a)} = ${ans}^\\circ$`,
      `Answer: <b>${angFmt(ans)}</b>`,
    ],
  };
}, { title: 'Opposite angles of a cyclic quadrilateral' });

/** Two tangents from P touching at A and B; angle APB = p. */
function tangentsConfig(rng, p, draw, { C = null } = {}) {
  const h = 90 - p / 2; // A, B at ±h from the direction of P
  const dirP = pick(rng, [0, 180, 0, 15, -15, 165, 200]);
  const OP = 1 / Math.sin(rad(p / 2));
  const on = { A: dirP + h, B: dirP - h };
  if (C !== null) on.C = dirP + 180 + C;
  const ext = { P: onCircle([0, 0], OP, dirP) };
  return circleFig({ on, ext, draw, width: 380, height: 240, nameDirs: { O: awayDir([[Math.cos(rad(dirP)), Math.sin(rad(dirP))]]) } });
}

export const ctTangent = gen('trig-ct-tangent', 'trig-circle-theorems', (rng, d) => {
  const mode = d === 'easy' ? 'radius' : d === 'medium' ? pick(rng, ['radius', 'kite', 'isosceles']) : pick(rng, ['kite', 'isosceles']);
  if (mode === 'radius') {
    const a = int(rng, 25, 70); // angle AOP
    const aA = int(rng, 0, 359);
    const t = tanDir(aA); const sgn = pick(rng, [1, -1]);
    const Pp = [Math.cos(rad(aA)) + sgn * t[0] * Math.tan(rad(a)), Math.sin(rad(aA)) + sgn * t[1] * Math.tan(rad(a))];
    const Tp = [Math.cos(rad(aA)) - sgn * t[0] * 0.8, Math.sin(rad(aA)) - sgn * t[1] * 0.8];
    const vis = circleFig({
      on: { A: aA }, ext: { P: Pp }, hideNames: [], width: 360, height: 250,
      draw: (g) => g.seg(Tp, 'P') + g.seg('O', 'A') + g.seg('O', 'P') + g.right('A', 'O', 'P', 10) + g.angle('O', 'A', 'P', deg(a)) + g.angle('P', 'A', 'O', 'x'),
      nameDirs: { O: awayDir([[Math.cos(rad(aA)), Math.sin(rad(aA))], [Pp[0] / Math.hypot(...Pp), Pp[1] / Math.hypot(...Pp)]]) },
    });
    const ans = 90 - a;
    return {
      prompt: '$A$ is a point on a circle with centre $O$. $PA$ is a tangent to the circle at $A$.<br>Work out the size of angle $x$.',
      visual: vis,
      answer: angFmt(ans),
      distractors: angOpts(ans, [180 - a, a, 90 + a, 180 - 2 * a, 2 * a]),
      typed: { kind: 'number', value: ans },
      solution: [
        '<b>A tangent and a radius meet at $90^\\circ$</b>, so angle $OAP = 90^\\circ$.',
        `Angles in triangle $OAP$: $x = 180^\\circ - 90^\\circ - ${At(a)} = ${ans}^\\circ$`,
        `Answer: <b>${angFmt(ans)}</b>`,
      ],
    };
  }
  const p = 2 * int(rng, 20, 45);
  if (mode === 'kite') {
    const giveP = chance(rng, 0.5);
    const vis = tangentsConfig(rng, p, (g) => g.seg('P', 'A') + g.seg('P', 'B') + g.seg('O', 'A') + g.seg('O', 'B') + g.right('A', 'O', 'P', 9) + g.right('B', 'O', 'P', 9)
      + g.angle('P', 'A', 'B', giveP ? deg(p) : 'x') + g.angle('O', 'A', 'B', giveP ? 'x' : deg(180 - p)));
    const ans = giveP ? 180 - p : p;
    return {
      prompt: '$A$ and $B$ are points on a circle with centre $O$. $PA$ and $PB$ are tangents to the circle.<br>Work out the size of angle $x$.',
      visual: vis,
      answer: angFmt(ans),
      distractors: angOpts(ans, giveP ? [p, 2 * p, 360 - p, 90 - p / 2, 90 + p] : [180 - p, (180 - p) / 2, 90 - p, 2 * (180 - p) > 180 ? 90 : 360 - 2 * (180 - p), p / 2]),
      typed: { kind: 'number', value: ans },
      solution: [
        '<b>A tangent meets a radius at $90^\\circ$</b>, so angles $OAP$ and $OBP$ are both $90^\\circ$.',
        `$OAPB$ is a quadrilateral, so its angles add up to $360^\\circ$: $x = 360^\\circ - 90^\\circ - 90^\\circ - ${At(giveP ? p : 180 - p)}$`,
        `$x = ${ans}^\\circ$`,
        `Answer: <b>${angFmt(ans)}</b>`,
      ],
    };
  }
  // isosceles triangle PAB
  const vis = tangentsConfig(rng, p, (g) => g.seg('P', 'A') + g.seg('P', 'B') + g.seg('A', 'B') + g.ticks('P', 'A') + g.ticks('P', 'B') + g.angle('P', 'A', 'B', deg(p)) + g.angle('A', 'P', 'B', 'x'));
  const ans = (180 - p) / 2;
  return {
    prompt: '$A$ and $B$ are points on a circle with centre $O$. $PA$ and $PB$ are tangents to the circle.<br>Work out the size of angle $x$.',
    visual: vis,
    answer: angFmt(ans),
    distractors: angOpts(ans, [180 - p, p, 90 - p, 90, p / 2, 2 * p]),
    typed: { kind: 'number', value: ans },
    solution: [
      '<b>Tangents from the same point to a circle are equal in length</b>: $PA = PB$, so triangle $PAB$ is isosceles.',
      `The base angles are equal: $x = (180^\\circ - ${At(p)}) \\div 2$`,
      `$x = ${ans}^\\circ$`,
      `Answer: <b>${angFmt(ans)}</b>`,
    ],
  };
}, { title: 'Tangents: radius at 90°, equal tangents' });

// Name the theorem.
const REASONS = {
  centre: 'The angle at the centre is twice the angle at the circumference',
  semicircle: 'The angle in a semicircle is a right angle',
  segment: 'Angles in the same segment are equal',
  cyclic: 'Opposite angles of a cyclic quadrilateral add up to 180°',
  tangentRadius: 'A tangent and a radius meet at 90°',
  tangentsEqual: 'Tangents from a point outside a circle are equal in length',
  alternate: 'Alternate segment theorem: the angle between a tangent and a chord equals the angle in the alternate segment',
  chord: 'The perpendicular from the centre to a chord bisects the chord',
};

export const ctReason = gen('trig-ct-reason', 'trig-circle-theorems', (rng, d) => {
  if (d === 'hard') { rng(); rng(); } // hard draws its own numbers, never a copy of easy
  const key = pick(rng, d === 'easy' ? ['centre', 'semicircle', 'segment', 'cyclic', 'tangentRadius'] : d === 'medium' ? Object.keys(REASONS) : ['alternate', 'chord', 'tangentsEqual', 'segment', 'cyclic', 'centre']);
  let vis; let statement;
  if (key === 'centre') {
    const x = int(rng, 25, 70);
    vis = centreConfig(rng, x, { O: deg(2 * x), C: deg(x) });
    statement = `Angle $AOB = 2 \\times$ angle $ACB$`;
  } else if (key === 'semicircle') {
    const a = int(rng, 20, 70);
    vis = circleFig({ on: { A: 180, B: 0, C: 2 * a }, rotate: rot(rng), nameDirs: { O: [0.2, 1] }, draw: (g) => g.seg('A', 'B') + g.seg('A', 'C') + g.seg('B', 'C') + g.right('C', 'A', 'B', 10) });
    statement = `Angle $ACB = 90^\\circ$ ($AB$ is a diameter)`;
  } else if (key === 'segment') {
    const y = int(rng, 25, 70); const a0 = 250 - y; const spare = 360 - 2 * y;
    vis = circleFig({ on: { A: a0, B: a0 + 2 * y, C: a0 + 2 * y + spare * 0.3, D: a0 + 2 * y + spare * 0.7 }, showO: false, rotate: rot(rng), draw: (g) => g.seg('A', 'C') + g.seg('B', 'C') + g.seg('A', 'D') + g.seg('B', 'D') + g.angle('C', 'A', 'B', deg(y)) + g.angle('D', 'A', 'B', deg(y)) });
    statement = 'Angle $ACB$ = angle $ADB$';
  } else if (key === 'cyclic') {
    const a = int(rng, 60, 120); const tB = int(rng, 0, 359);
    vis = circleFig({ on: { A: tB + 2 * a + (360 - 2 * a) / 2, B: tB, C: tB + a, D: tB + 2 * a }, showO: false, draw: (g) => g.poly('ABCD', { fillOpacity: 0.6 }) + g.angle('A', 'B', 'D', deg(a)) + g.angle('C', 'D', 'B', deg(180 - a)) });
    statement = `Angle $DAB$ + angle $BCD = 180^\\circ$`;
  } else if (key === 'tangentRadius') {
    const aA = int(rng, 0, 359); const t = tanDir(aA);
    const Pp = [Math.cos(rad(aA)) + 1.1 * t[0], Math.sin(rad(aA)) + 1.1 * t[1]];
    vis = circleFig({ on: { A: aA }, ext: { P: Pp }, draw: (g) => g.seg([Math.cos(rad(aA)) - 0.7 * t[0], Math.sin(rad(aA)) - 0.7 * t[1]], 'P') + g.seg('O', 'A') + g.right('A', 'O', 'P', 10), nameDirs: { O: awayDir([[Math.cos(rad(aA)), Math.sin(rad(aA))]]) } });
    statement = 'Angle $OAP = 90^\\circ$ ($PA$ is a tangent)';
  } else if (key === 'tangentsEqual') {
    const p = 2 * int(rng, 18, 40);
    vis = tangentsConfig(rng, p, (g) => g.seg('P', 'A') + g.seg('P', 'B') + g.ticks('P', 'A') + g.ticks('P', 'B'));
    statement = '$PA = PB$ ($PA$ and $PB$ are tangents)';
  } else if (key === 'alternate') {
    vis = altSegFig(rng, { a: 60, b: 55, c: 65 }, { TAB: deg(65), C: deg(65) });
    statement = 'Angle $TAB$ = angle $ACB$ ($ST$ is a tangent at $A$)';
  } else {
    const a1 = int(rng, 200, 240); const a2 = a1 + int(rng, 70, 110);
    const M = [(Math.cos(rad(a1)) + Math.cos(rad(a2))) / 2, (Math.sin(rad(a1)) + Math.sin(rad(a2))) / 2];
    vis = circleFig({ on: { A: a1, B: a2 }, ext: { M }, rotate: rot(rng), nameDirs: { M: awayDir([M]).map((v) => -v), O: awayDir([M]) }, draw: (g) => g.seg('A', 'B') + g.seg('O', 'M') + g.right('M', 'B', 'O', 9) + g.ticks('A', 'M') + g.ticks('M', 'B') });
    statement = '$AM = MB$ ($OM$ is perpendicular to the chord $AB$)';
  }
  return {
    prompt: `Which circle theorem gives this fact?<br>${statement}`,
    visual: vis,
    answer: REASONS[key],
    distractors: shuffle(rng, Object.keys(REASONS).filter((k) => k !== key)).map((k) => REASONS[k]),
    solution: [`${statement}.`, `Reason: ${REASONS[key]}.`, `Answer: ${REASONS[key]}`],
  };
}, { title: 'Name the circle theorem' });

/* ------------------------------------------------------------------ */
/* trig-circle-theorems-multi                                          */
/* ------------------------------------------------------------------ */

/**
 * Inscribed triangle ABC with angles a (at A), b (at B), c (at C) and a tangent ST at A.
 * A at the bottom; T on the side of B, S on the side of C. labels: { TAB, SAC, A, B, C } -> text.
 */
function altSegFig(rng, { a, b, c }, labels, { showO = false, rotate = null, extra = null } = {}) {
  const tA = 270; const tB = tA + 2 * c; const tC = tB + 2 * a;
  const on = { A: tA, B: tB, C: tC };
  const Ap = onCircle([0, 0], 1, tA);
  const ext = { T: [Ap[0] + 1.25, Ap[1]], S: [Ap[0] - 1.25, Ap[1]] };
  return circleFig({
    on, ext, showO, rotate: rotate ?? pick(rng, [0, 0, 15, -15, 180]), width: 360, height: 260,
    nameDirs: { T: [0.3, 1], S: [-0.3, 1] },
    draw: (g) => {
      let out = g.seg('S', 'T') + g.poly('ABC', { fillOpacity: 0 });
      if (labels.TAB) out += g.angle('A', 'T', 'B', labels.TAB);
      if (labels.SAC) out += g.angle('A', 'C', 'S', labels.SAC);
      if (labels.A) out += g.angle('A', 'B', 'C', labels.A);
      if (labels.B) out += g.angle('B', 'C', 'A', labels.B);
      if (labels.C) out += g.angle('C', 'A', 'B', labels.C);
      if (extra) out += extra(g);
      return out;
    },
  });
}

/** Random triangle angles (integers) each in [lo, hi]. */
function triAngles(rng, lo = 35, hi = 85) {
  for (;;) { const a = int(rng, lo, hi); const b = int(rng, lo, hi); const c = 180 - a - b; if (c >= lo && c <= hi && new Set([a, b, c]).size === 3) return { a, b, c }; }
}

export const ctmAltSegment = gen('trig-ctm-alt-segment', 'trig-circle-theorems-multi', (rng, d) => {
  const { a, b, c } = triAngles(rng);
  const mode = d === 'easy' ? 'direct' : d === 'medium' ? pick(rng, ['triangle', 'direct2']) : pick(rng, ['triangle', 'both']);
  let labels; let ans; let wrong; let sol;
  const TS = '$ST$ is a tangent to the circle at $A$.';
  if (mode === 'direct') {
    labels = { TAB: deg(c), C: 'x' }; ans = c; wrong = [180 - c, 90 - c, 2 * c, b, a];
    sol = ['<b>Alternate segment theorem</b>: the angle between a tangent and a chord equals the angle in the alternate segment.', `The angle between tangent $AT$ and chord $AB$ is ${At(c).replace(/^/, '$').replace(/$/, '$')}, so the angle at $C$ (in the other segment) is the same.`, `Answer: <b>${deg(c)}</b>`];
  } else if (mode === 'direct2') {
    labels = { SAC: deg(b), B: 'x' }; ans = b; wrong = [180 - b, 90 - b, c, a, 2 * b];
    sol = ['<b>Alternate segment theorem</b>: the angle between tangent $AS$ and chord $AC$ equals the angle $ABC$ in the alternate segment.', `So $x = ${b}^\\circ$.`, `Answer: <b>${deg(b)}</b>`];
  } else if (mode === 'triangle') {
    labels = { TAB: deg(c), B: deg(b), A: 'x' }; ans = a; wrong = [c, 180 - c - b + (c - b), 180 - b, 90 - c, 180 - 2 * c, b + c];
    sol = [`Alternate segment theorem: angle $ACB$ = angle $TAB = ${c}^\\circ$.`, `Angles in triangle $ABC$ add up to $180^\\circ$: $x = 180^\\circ - ${b}^\\circ - ${c}^\\circ$`, `$x = ${a}^\\circ$`, `Answer: <b>${deg(a)}</b>`];
  } else {
    labels = { TAB: deg(c), SAC: deg(b), A: 'x' }; ans = a; wrong = [180 - c, 180 - b, b + c, 90 - c + b > 0 ? Math.abs(b - c) + 20 : 50, 360 - b - c];
    sol = [`Angles on a straight line $SAT$ add up to $180^\\circ$: angle $SAC$ + angle $CAB$ + angle $BAT = 180^\\circ$.`, `$x = 180^\\circ - ${b}^\\circ - ${c}^\\circ = ${a}^\\circ$`, `(Check with the alternate segment theorem: angle $C = ${c}^\\circ$ and angle $B = ${b}^\\circ$, so angle $A = ${a}^\\circ$ ✓)`, `Answer: <b>${deg(a)}</b>`];
  }
  const vis = altSegFig(rng, { a, b, c }, labels);
  return {
    prompt: `$A$, $B$ and $C$ are points on a circle. ${TS}<br>Work out the size of angle $x$.`,
    visual: vis,
    answer: deg(ans),
    distractors: angOpts(ans, wrong),
    typed: { kind: 'number', value: ans },
    solution: sol,
  };
}, { title: 'Alternate segment theorem' });

export const ctmTangentsCircumference = gen('trig-ctm-tangents-circumference', 'trig-circle-theorems-multi', (rng, d) => {
  const p = 2 * int(rng, 20, 42);
  const aob = 180 - p; const acb = aob / 2;
  if (!Number.isInteger(acb)) throw new Error('odd');
  const giveP = d !== 'hard' || chance(rng, 0.5);
  const vis = tangentsConfig(rng, p, (g) => g.seg('P', 'A') + g.seg('P', 'B') + g.seg('O', 'A') + g.seg('O', 'B') + g.seg('C', 'A') + g.seg('C', 'B')
    + g.angle('P', 'A', 'B', giveP ? deg(p) : 'x') + g.angle('C', 'A', 'B', giveP ? 'x' : deg(acb)), { C: int(rng, -25, 25) });
  const ans = giveP ? acb : p;
  return {
    prompt: '$A$, $B$ and $C$ are points on a circle with centre $O$. $PA$ and $PB$ are tangents to the circle.<br>Work out the size of angle $x$.',
    visual: vis,
    answer: deg(ans),
    distractors: angOpts(ans, giveP ? [aob, p, p / 2, 2 * aob > 180 ? 90 - p / 2 + 10 : 2 * aob, 90 - p, 180 - acb] : [180 - acb, 180 - 2 * acb === p ? 2 * acb : 0, acb, 90 - acb, 360 - 2 * acb - 180 + 10]),
    typed: { kind: 'number', value: ans },
    solution: giveP ? [
      '<b>Tangent and radius meet at $90^\\circ$</b>: angles $OAP$ and $OBP$ are $90^\\circ$.',
      `Angles in quadrilateral $OAPB$ add up to $360^\\circ$: angle $AOB = 360 - 90 - 90 - ${p} = ${aob}^\\circ$.`,
      `<b>Angle at the centre is twice the angle at the circumference</b>: $x = ${aob} \\div 2 = ${acb}^\\circ$.`,
      `Answer: <b>${deg(acb)}</b>`,
    ] : [
      `<b>Angle at the centre is twice the angle at the circumference</b>: angle $AOB = 2 \\times ${acb} = ${aob}^\\circ$.`,
      '<b>Tangent and radius meet at $90^\\circ$</b>: angles $OAP$ and $OBP$ are $90^\\circ$.',
      `Angles in quadrilateral $OAPB$: $x = 360 - 90 - 90 - ${aob} = ${p}^\\circ$.`,
      `Answer: <b>${deg(p)}</b>`,
    ],
  };
}, { title: 'Two tangents and the angle at the circumference' });

export const ctmCentreIsosceles = gen('trig-ctm-centre-isosceles', 'trig-circle-theorems-multi', (rng, d) => {
  if (d === 'hard') { rng(); rng(); } // hard draws its own numbers, never a copy of easy
  const a = int(rng, 25, 75); // angle BAC at circumference
  // B and C with arc BC = 2a; A on the major arc
  const tB = 270 - a + int(rng, -10, 10); const tC = tB + 2 * a;
  let tA = tC + (360 - 2 * a) / 2;
  for (let i = 0; i < 30; i += 1) {
    tA = tC + (360 - 2 * a) * (0.25 + 0.5 * rng());
    const far = (t) => Math.abs((((tA - t - 180) % 360) + 540) % 360 - 180) > 22;
    if (far(tB) && far(tC)) break;
  }
  const giveAngleOBC = d === 'hard' && chance(rng, 0.5);
  const ans = giveAngleOBC ? a : 90 - a;
  const r = rot(rng);
  const vis = circleFig({
    on: { A: tA, B: tB, C: tC }, rotate: r,
    nameDirs: { O: awayDir([onCircle([0, 0], 1, tB), onCircle([0, 0], 1, tC)].map((pp) => rotP(pp, r))).map((v) => -v) },
    draw: (g) => g.seg('A', 'B') + g.seg('A', 'C') + g.seg('O', 'B') + g.seg('O', 'C') + g.seg('B', 'C')
      + g.angle('A', 'B', 'C', giveAngleOBC ? 'x' : deg(a)) + g.angle('B', 'C', 'O', giveAngleOBC ? deg(90 - a) : 'x'),
  });
  return {
    prompt: '$A$, $B$ and $C$ are points on a circle with centre $O$.<br>Work out the size of angle $x$.',
    visual: vis,
    answer: deg(ans),
    distractors: angOpts(ans, giveAngleOBC ? [2 * (90 - a), 180 - 2 * (90 - a), 90 - a, (180 - 2 * (90 - a)) / 2 + 10, 90 + a] : [a, 2 * a, 180 - 2 * a, 90 - a / 2, 180 - a]),
    typed: { kind: 'number', value: ans },
    solution: giveAngleOBC ? [
      `$OB = OC$ (radii), so triangle $OBC$ is isosceles: angle $OCB = ${90 - a}^\\circ$ too.`,
      `Angle $BOC = 180 - 2 \\times ${90 - a} = ${2 * a}^\\circ$.`,
      `<b>Angle at the centre is twice the angle at the circumference</b>: $x = ${2 * a} \\div 2 = ${a}^\\circ$.`,
      `Answer: <b>${deg(a)}</b>`,
    ] : [
      `<b>Angle at the centre is twice the angle at the circumference</b>: angle $BOC = 2 \\times ${a} = ${2 * a}^\\circ$.`,
      '$OB = OC$ (both radii), so triangle $OBC$ is <b>isosceles</b> and its base angles are equal.',
      `$x = (180 - ${2 * a}) \\div 2 = ${90 - a}^\\circ$`,
      `Answer: <b>${deg(90 - a)}</b>`,
    ],
  };
}, { title: 'Angle at the centre with an isosceles triangle' });

export const ctmCyclicMulti = gen('trig-ctm-cyclic-multi', 'trig-circle-theorems-multi', (rng, d) => {
  const mode = d === 'easy' ? 'exterior' : pick(rng, ['exterior', 'isosceles', 'centre']);
  const a = mode === 'centre' ? 2 * int(rng, 28, 42) : 2 * int(rng, 30, 60); // angle DAB (even so halves are whole)
  const tB = int(rng, -40, 20); const tD = tB + 2 * a; const tC = tB + a; const tA = tD + (360 - 2 * a) / 2 + int(rng, -10, 10);
  const on = { A: tA, B: tB, C: tC, D: tD };
  if (mode === 'exterior') {
    // extend DC beyond C to E: exterior angle BCE = angle DAB
    const Cp = onCircle([0, 0], 1, tC); const Dp = onCircle([0, 0], 1, tD);
    const E = [Cp[0] + (Cp[0] - Dp[0]) * 0.7, Cp[1] + (Cp[1] - Dp[1]) * 0.7];
    const vis = circleFig({ on, ext: { E }, showO: false, draw: (g) => g.poly('ABCD', { fillOpacity: 0.5 }) + g.seg('C', 'E') + g.angle('A', 'B', 'D', deg(a)) + g.angle('C', 'B', 'E', 'x') });
    return {
      prompt: '$ABCD$ is a cyclic quadrilateral. $DCE$ is a straight line.<br>Work out the size of angle $x$.',
      visual: vis,
      answer: deg(a),
      distractors: angOpts(a, [180 - a, a / 2, 90 - a / 2, 2 * a > 180 ? 360 - 2 * a : 2 * a, 90]),
      typed: { kind: 'number', value: a },
      solution: [
        `<b>Opposite angles of a cyclic quadrilateral add up to $180^\\circ$</b>: angle $BCD = 180 - ${a} = ${180 - a}^\\circ$.`,
        `<b>Angles on a straight line add up to $180^\\circ$</b>: $x = 180 - ${180 - a} = ${a}^\\circ$.`,
        '(The exterior angle of a cyclic quadrilateral equals the interior opposite angle.)',
        `Answer: <b>${deg(a)}</b>`,
      ],
    };
  }
  if (mode === 'isosceles') {
    // CB = CD: angle CBD = a / 2
    const vis = circleFig({ on, showO: false, draw: (g) => g.poly('ABCD', { fillOpacity: 0.5 }) + g.seg('B', 'D') + g.ticks('C', 'B') + g.ticks('C', 'D') + g.angle('A', 'B', 'D', deg(a)) + g.angle('B', 'C', 'D', 'x') });
    return {
      prompt: '$ABCD$ is a cyclic quadrilateral with $CB = CD$.<br>Work out the size of angle $x$.',
      visual: vis,
      answer: deg(a / 2),
      distractors: angOpts(a / 2, [180 - a, a, (180 - a) / 2, 90 - a / 2, 2 * a > 180 ? 30 : 180 - 2 * a]),
      typed: { kind: 'number', value: a / 2 },
      solution: [
        `<b>Opposite angles of a cyclic quadrilateral add up to $180^\\circ$</b>: angle $BCD = 180 - ${a} = ${180 - a}^\\circ$.`,
        '$CB = CD$, so triangle $BCD$ is isosceles and angles $CBD$ and $CDB$ are equal.',
        `$x = (180 - ${180 - a}) \\div 2 = ${a / 2}^\\circ$`,
        `Answer: <b>${deg(a / 2)}</b>`,
      ],
    };
  }
  // centre: O inside; angle BOD (centre) given, find angle BCD
  const bod = 2 * a > 180 ? null : 2 * a;
  const reflexCase = bod === null;
  const vis = circleFig({ on, showO: true, nameDirs: { O: [0, 0] }, draw: (g) => g.poly(['B', 'C', 'D'], { fillOpacity: 0 }) + g.seg('A', 'B') + g.seg('A', 'D') + g.seg('O', 'B') + g.seg('O', 'D') + g.angle('O', 'B', 'D', reflexCase ? null : deg(2 * a)) + g.angle('C', 'D', 'B', 'x') });
  if (reflexCase) throw new Error('reflex');
  return {
    prompt: '$A$, $B$, $C$ and $D$ are points on a circle with centre $O$.<br>Work out the size of angle $x$.',
    visual: vis,
    answer: deg(180 - a),
    distractors: angOpts(180 - a, [a, 2 * a, 360 - 2 * a, 90 - a / 2, 180 - 2 * a]),
    typed: { kind: 'number', value: 180 - a },
    solution: [
      `<b>Angle at the centre is twice the angle at the circumference</b>: angle $BAD = ${2 * a} \\div 2 = ${a}^\\circ$.`,
      `$ABCD$ is a cyclic quadrilateral, so <b>opposite angles add up to $180^\\circ$</b>.`,
      `$x = 180 - ${a} = ${180 - a}^\\circ$`,
      `Answer: <b>${deg(180 - a)}</b>`,
    ],
  };
}, { title: 'Cyclic quadrilaterals: exterior angle, isosceles, centre' });

export const ctmSemicircleSegment = gen('trig-ctm-semicircle-segment', 'trig-circle-theorems-multi', (rng, d) => {
  const a = int(rng, 22, 68); // angle CAB
  // A at 180, B at 0 (diameter); C at 2a above (angle CAB = a). D on the lower arc (same side as ... ) : angle ADC subtends AC.
  // ADC (D on the lower arc between B and A going clockwise) stands on arc AC = 180 - 2a ... angle ADC = angle ABC = 90 - a
  const tD = -int(rng, 40, 140);
  const on = { A: 180, B: 0, C: 2 * a, D: tD };
  const r = rot(rng);
  const vis = circleFig({
    on, rotate: r, nameDirs: { O: [0.25, -1] },
    draw: (g) => g.seg('A', 'B') + g.seg('A', 'C') + g.seg('B', 'C') + g.seg('D', 'A') + g.seg('D', 'C') + g.angle('A', 'C', 'B', deg(a)) + g.angle('D', 'A', 'C', 'x'),
  });
  if (d === 'hard') {
    const y = 90 - a; // angle ADC
    const visH = circleFig({
      on, rotate: r,
      draw: (g) => g.seg('A', 'B') + g.seg('A', 'C') + g.seg('B', 'C') + g.seg('D', 'A') + g.seg('D', 'C') + g.seg('O', 'C') + g.angle('D', 'A', 'C', deg(y)) + g.angle('C', 'O', 'A', 'x'),
    });
    return {
      prompt: '$A$, $B$, $C$ and $D$ are points on a circle with centre $O$. $AB$ is a diameter.<br>Work out the size of angle $x$ (angle $OCA$).',
      visual: visH,
      answer: deg(a),
      distractors: angOpts(a, [y, 180 - 2 * y, 90 + y, 2 * y, 180 - y, 90 - y / 2].map((v) => (Number.isInteger(v) ? v : -1))),
      typed: { kind: 'number', value: a },
      solution: [
        `<b>Angles in the same segment are equal</b>: angle $ABC$ = angle $ADC = ${y}^\\circ$ (both stand on chord $AC$).`,
        `<b>The angle in a semicircle is $90^\\circ$</b>, so angle $CAB = 180 - 90 - ${y} = ${a}^\\circ$.`,
        `$OA = OC$ (radii), so triangle $OAC$ is isosceles and $x$ = angle $OAC = ${a}^\\circ$.`,
        `Answer: <b>${deg(a)}</b>`,
      ],
    };
  }
  const ans = 90 - a;
  return {
    prompt: '$A$, $B$, $C$ and $D$ are points on a circle with centre $O$. $AB$ is a diameter.<br>Work out the size of angle $x$.',
    visual: vis,
    answer: deg(ans),
    distractors: angOpts(ans, [a, 180 - a, 90 + a, 2 * a, 180 - 2 * a]),
    typed: { kind: 'number', value: ans },
    solution: [
      '<b>The angle in a semicircle is $90^\\circ$</b>: angle $ACB = 90^\\circ$.',
      `Angles in triangle $ABC$: angle $ABC = 180 - 90 - ${a} = ${ans}^\\circ$.`,
      `<b>Angles in the same segment are equal</b>: angles $ADC$ and $ABC$ both stand on chord $AC$, so $x = ${ans}^\\circ$.`,
      `Answer: <b>${deg(ans)}</b>`,
    ],
  };
}, { title: 'Semicircle then same segment' });

export const circlePartGenerators = [circlePartName, circlePartDef, circleRadiusDiameter];
export const circleTheoremGenerators = [ctCentre, ctSemicircle, ctSameSegment, ctCyclic, ctTangent, ctReason];
export const circleTheoremMultiGenerators = [ctmAltSegment, ctmTangentsCircumference, ctmCentreIsosceles, ctmCyclicMulti, ctmSemicircleSegment];

void [ACCENT2, FILL];
