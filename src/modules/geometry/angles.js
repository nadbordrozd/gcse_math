// Angles unit: angle facts, triangles & quadrilaterals, parallel lines, polygons, bearings.
import { pick, int, size, shuffle, chance, terms, tnum } from '../../core.js';
import {
  line, polygon, text, dot, rightMark, equalTicks, parallelArrows, figure, arcLabel, pointLabel, labelAt,
  polar, add, sub, scale, unit, mid, centroid, place, triFromAngles, polyFromAngles, regularPoly, northLine,
  ggen, degT, degS, bearingT, angleWrongs, wrongs, extend, along, intersect, FILL, MUTED, ACCENT, textWidth,
} from './diagrams.js';

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

/** Split total into k integer parts within [lo, hi], each a multiple of step. */
function partition(rng, total, k, { lo = 30, hi = 150, step = 1 } = {}) {
  for (let t = 0; t < 400; t += 1) {
    const parts = [];
    let left = total;
    for (let i = 0; i < k - 1; i += 1) {
      const minNow = Math.max(lo, left - hi * (k - 1 - i));
      const maxNow = Math.min(hi, left - lo * (k - 1 - i));
      if (maxNow < minNow) break;
      const v = step * Math.round((minNow + rng() * (maxNow - minNow)) / step);
      parts.push(v); left -= v;
    }
    if (parts.length === k - 1 && left >= lo && left <= hi && left % step === 0) return shuffle(rng, [...parts, left]);
  }
  throw new Error('partition failed');
}
/** "ax + b = total" collected and rearranged to "ax = total − b" (skipping steps that do nothing). TeX, no $. */
function collectT(a, b, total) {
  const ax = a === 1 ? 'x' : `${tnum(a)}x`;
  return b === 0 ? `${ax} = ${tnum(total)}` : `${terms([[a, 'x'], [b, '']])} = ${tnum(total)}$, so $${ax} = ${tnum(total - b)}`;
}
/** Final division step: "x = rhs ÷ a = x" (or just "x = rhs" when a = 1). TeX, no $. */
const divT = (a, rhs) => (a === 1 ? `x = ${tnum(rhs)}` : `x = ${tnum(rhs)} \\div ${tnum(a)} = ${tnum(rhs / a)}`);
const ex = (a, b) => terms([[a, 'x'], [b, '']]);          // TeX expression ax + b
const exS = (a, b) => ex(a, b).replace(/ - /g, ' − ');  // SVG label
const sumT = (vals) => vals.map((v) => tnum(v)).join(' + ');

/* ------------------------------------------------------------------ */
/* Rays from a point (straight line / around a point)                  */
/* ------------------------------------------------------------------ */

/**
 * Draw rays from O in the given maths directions (degrees) and label the regions between consecutive rays.
 * regions: [{ from, to, label, right }] where from/to are directions, region is swept anticlockwise from `from` to `to`.
 */
export function raysBody(O, R, dirs, regions, { lens = null } = {}) {
  let out = '';
  dirs.forEach((dg, i) => { const E = polar(O, lens ? lens[i] : R, dg); out += line(O[0], O[1], E[0], E[1], { width: 2 }); });
  for (const g of regions) {
    const P = polar(O, 50, g.from); const Q = polar(O, 50, g.to);
    const sizeDeg = ((g.to - g.from) % 360 + 360) % 360;
    if (g.right) out += rightMark(O, P, Q, 13);
    else out += arcLabel(O, P, Q, g.label, { reflex: sizeDeg > 180 });
  }
  return out + dot(O[0], O[1], 3);
}

/* ================================================================== */
/* geo-angle-basics                                                    */
/* ================================================================== */

export const angleStraightLine = ggen('geo-angle-straight-line', 'geo-angle-basics', (rng, d) => {
  const W = 420; const H = 215; const O = [210, 170]; const R = 160;
  if (d === 'hard') {
    // Algebra: e.g. 3x, x + 20 and 70° on a straight line.
    for (let t = 0; t < 300; t += 1) {
      const x = int(rng, 10, 35);
      const a1 = int(rng, 1, 4); const a2 = int(rng, 1, 3);
      const b1 = pick(rng, [0, 10, 20, 30, -10, 15, 25]);
      const c = 180 - (a1 * x + b1) - a2 * x;
      const angs = [a1 * x + b1, a2 * x, c];
      if (a1 === a2 || angs.some((v) => v < 30 || v > 130) || c % 5) continue;
      const order = shuffle(rng, [0, 1, 2]);
      const labels = [exS(a1, b1), exS(a2, 0), degS(c)];
      let dir = 0; const dirs = [0]; const regions = [];
      for (const k of order) { regions.push({ from: dir, to: dir + angs[k], label: labels[k] }); dir += angs[k]; dirs.push(dir); }
      const body = raysBody(O, R, dirs, regions);
      const visual = figure(W, H, body, { nda: true });
      const S = a1 + a2;
      return {
        prompt: `The angles on a straight line are shown in the diagram.<br>Work out the value of $x$.`,
        visual,
        answer: `$x = ${x}$`,
        distractors: wrongs(x, [(180 - c) / S, (180 - c + b1) / S, (360 - c - b1) / S, a1 * x + b1, a2 * x, (180 - b1) / S, (180 - c - b1) / (S + 1), x + 5, x - 5, x + 10], { integer: true, near: [2, 3, 4] }).map((v) => `$x = ${v}$`),
        typed: { kind: 'number', value: x },
        solution: [
          'Angles on a straight line add up to $180^\\circ$.',
          `$${ex(a1, b1)} + ${ex(a2, 0)} + ${c} = 180$`,
          `$${collectT(S, b1 + c, 180)}$`,
          `$${divT(S, 180 - b1 - c)}$`,
          `Answer: $x = ${x}$`,
        ],
      };
    }
    throw new Error('no algebra case');
  }
  const k = d === 'easy' ? 2 : pick(rng, [2, 3, 3]);
  const angs = partition(rng, 180, k, { lo: k === 2 ? 35 : 30, hi: 145, step: d === 'easy' ? 5 : 1 });
  const xi = int(rng, 0, k - 1);
  const x = angs[xi];
  let dir = 0; const dirs = [0]; const regions = [];
  angs.forEach((a, i) => { regions.push({ from: dir, to: dir + a, label: i === xi ? 'x' : degS(a) }); dir += a; dirs.push(dir); });
  let body = raysBody(O, R, dirs, regions);
  const A = polar(O, R, 180); const C = polar(O, R, 0);
  body += labelAt(A, 'A', 90, 14, { italic: true }) + labelAt(C, 'C', 90, 14, { italic: true }) + labelAt(O, 'B', 90, 16, { italic: true });
  const known = angs.filter((_, i) => i !== xi);
  const visual = figure(W, H, body, { nda: true });
  return {
    prompt: `$ABC$ is a straight line.<br>Work out the size of angle $x$.`,
    visual,
    answer: degT(x),
    distractors: angleWrongs(x, [360 - known.reduce((s, v) => s + v, 0), 90 - (known.length === 1 ? known[0] : known[0]) > 0 ? 90 - known[0] : 0, known.reduce((s, v) => s + v, 0), 180 - known[0], ...known]),
    typed: { kind: 'number', value: x },
    hint: 'What do angles on a straight line add up to?',
    solution: [
      'Angles on a straight line add up to $180^\\circ$.',
      `The other angle${known.length > 1 ? 's add' : ' is'} ${known.length > 1 ? `up to $${sumT(known)} = ${known.reduce((s, v) => s + v, 0)}^\\circ$` : degT(known[0])}.`,
      `$x = 180 - ${known.reduce((s, v) => s + v, 0)} = ${x}^\\circ$`,
      `Answer: ${degT(x)}`,
    ],
  };
}, { title: 'Angles on a straight line' });

export const angleAroundPoint = ggen('geo-angle-around-point', 'geo-angle-basics', (rng, d) => {
  const W = 400; const H = 300; const O = [200, 150]; const R = 125;
  const rot = int(rng, 0, 359);
  if (d === 'hard') {
    for (let t = 0; t < 300; t += 1) {
      const x = int(rng, 15, 45);
      const k = pick(rng, [3, 4]);
      const coefs = Array.from({ length: k - 1 }, () => int(rng, 1, 4));
      const consts = coefs.map(() => pick(rng, [0, 0, 10, 20, -10, 30, 15]));
      const angs = coefs.map((a, i) => a * x + consts[i]);
      const last = 360 - angs.reduce((s, v) => s + v, 0);
      const all = [...angs, last];
      if (all.some((v) => v < 40 || v > 170) || last % 5) continue;
      if (new Set(coefs.map((a, i) => `${a},${consts[i]}`)).size < coefs.length) continue;
      const labels = [...coefs.map((a, i) => exS(a, consts[i])), degS(last)];
      const order = shuffle(rng, all.map((_, i) => i));
      let dir = rot; const dirs = []; const regions = [];
      for (const i of order) { dirs.push(dir); regions.push({ from: dir, to: dir + all[i], label: labels[i] }); dir += all[i]; }
      const S = coefs.reduce((s, v) => s + v, 0); const C = consts.reduce((s, v) => s + v, 0);
      return {
        prompt: 'The diagram shows angles around a point.<br>Work out the value of $x$.',
        visual: figure(W, H, raysBody(O, R, dirs, regions), { nda: true }),
        answer: `$x = ${x}$`,
        distractors: wrongs(x, [(180 - last - C) / S, (360 - last) / S, (360 - C) / S, (360 - last + C) / S, angs[0], x + 5, x - 5, x + 10], { integer: true, near: [2, 3, 4] }).map((v) => `$x = ${v}$`),
        typed: { kind: 'number', value: x },
        solution: [
          'Angles around a point add up to $360^\\circ$.',
          `$${coefs.map((a, i) => ex(a, consts[i])).join(' + ')} + ${last} = 360$`,
          `Collect terms: $${collectT(S, C + last, 360)}$`,
          `$${divT(S, 360 - C - last)}$`,
          `Answer: $x = ${x}$`,
        ],
      };
    }
    throw new Error('no algebra case');
  }
  const k = d === 'easy' ? 3 : pick(rng, [3, 4]);
  const useRight = d === 'medium' && chance(rng, 0.5);
  let angs;
  if (useRight) angs = [90, ...partition(rng, 270, k - 1, { lo: 45, hi: 170, step: 1 })];
  else angs = partition(rng, 360, k, { lo: 45, hi: 170, step: d === 'easy' ? 5 : 1 });
  const xi = useRight ? int(rng, 1, k - 1) : int(rng, 0, k - 1);
  const x = angs[xi];
  let dir = rot; const dirs = []; const regions = [];
  angs.forEach((a, i) => { dirs.push(dir); regions.push({ from: dir, to: dir + a, label: i === xi ? 'x' : degS(a), right: a === 90 && i !== xi }); dir += a; });
  const known = angs.filter((_, i) => i !== xi);
  const ks = known.reduce((s, v) => s + v, 0);
  const pie = chance(rng, 0.25);
  return {
    prompt: pie ? 'The diagram shows part of a pie chart, with the angles at the centre.<br>Work out the size of angle $x$.' : 'The diagram shows angles around a point.<br>Work out the size of angle $x$.',
    visual: figure(W, H, (pie ? `<circle cx="${O[0]}" cy="${O[1]}" r="${R}" fill="none" stroke="currentColor" stroke-width="2"/>` : '') + raysBody(O, R, dirs, regions), { nda: true }),
    answer: degT(x),
    distractors: angleWrongs(x, [180 - ks, ks, 360 - ks + 90, 360 - ks - 90, ks - 180, 270 - ks]),
    typed: { kind: 'number', value: x },
    hint: 'What do angles around a point add up to?',
    solution: [
      'Angles around a point add up to $360^\\circ$.',
      `The known angles add up to $${sumT(known)} = ${ks}^\\circ$${useRight ? ' (the square mark means $90^\\circ$)' : ''}.`,
      `$x = 360 - ${ks} = ${x}^\\circ$`,
      `Answer: ${degT(x)}`,
    ],
  };
}, { title: 'Angles around a point' });

export const angleVertOpp = ggen('geo-angle-vert-opp', 'geo-angle-basics', (rng, d) => {
  const W = 400; const H = 260; const O = [200, 130]; const R = 150;
  const rot = int(rng, -30, 30);
  if (d === 'easy') {
    const a = int(rng, 6, 16) * 5;
    const dirs = [rot, rot + a, rot + 180, rot + 180 + a];
    // regions: 0:[d0,d1]=a, 1:[d1,d2]=180-a, 2:[d2,d3]=a, 3:[d3,d0+360]=180-a
    const sizes = [a, 180 - a, a, 180 - a];
    const gi = int(rng, 0, 3);
    const xi = pick(rng, [(gi + 2) % 4, (gi + 1) % 4, (gi + 3) % 4]);
    const regions = [0, 1, 2, 3].map((i) => ({ from: dirs[i], to: i === 3 ? dirs[0] + 360 : dirs[i + 1], label: i === gi ? degS(sizes[i]) : i === xi ? 'x' : null })).filter((g) => g.label);
    const x = sizes[xi];
    const opp = (gi + 2) % 4 === xi;
    return {
      prompt: 'Two straight lines cross.<br>Work out the size of angle $x$.',
      visual: figure(W, H, raysBody(O, R, dirs, regions), { nda: true }),
      answer: degT(x),
      distractors: angleWrongs(x, [180 - x, 360 - sizes[gi], 90 - (x % 90), sizes[gi] / 2, 2 * sizes[gi]]),
      typed: { kind: 'number', value: x },
      solution: opp ? [
        '$x$ is opposite the given angle where the lines cross.',
        '<b>Vertically opposite angles are equal.</b>',
        `Answer: ${degT(x)}`,
      ] : [
        `$x$ and the ${degS(sizes[gi])} angle lie next to each other on a straight line.`,
        `Angles on a straight line add up to $180^\\circ$: $x = 180 - ${sizes[gi]} = ${x}^\\circ$`,
        `Answer: ${degT(x)}`,
      ],
    };
  }
  if (d === 'medium') {
    // Three lines through a point: six angles p, q, r, p, q, r.
    const [p, q, r] = partition(rng, 180, 3, { lo: 35, hi: 100, step: 1 });
    const sizes = [p, q, r, p, q, r];
    const dirs = [0, p, p + q, 180, 180 + p, 180 + p + q].map((v) => v + rot);
    const g1 = int(rng, 0, 5); const g2 = (g1 + 1) % 6;
    const xi = pick(rng, [(g1 + 2) % 6, (g1 + 5) % 6, (g1 + 3) % 6 === g2 ? (g1 + 4) % 6 : (g1 + 4) % 6]);
    const x = sizes[xi];
    const regions = sizes.map((s, i) => ({ from: dirs[i], to: i === 5 ? dirs[0] + 360 : dirs[i + 1], label: i === g1 || i === g2 ? degS(s) : i === xi ? 'x' : null })).filter((g) => g.label);
    const a = sizes[g1]; const b = sizes[g2];
    const third = 180 - a - b;
    const direct = sizes[xi] === third && (xi === (g1 + 2) % 6 || xi === (g2 + 4) % 6 + 0);
    return {
      prompt: 'Three straight lines meet at a point.<br>Work out the size of angle $x$.',
      visual: figure(W, H, raysBody(O, R, dirs, regions), { nda: true }),
      answer: degT(x),
      distractors: angleWrongs(x, [360 - a - b, a + b, 180 - a, 180 - b, third === x ? a : third]),
      typed: { kind: 'number', value: x },
      solution: [
        `The angles ${degS(a)}, ${degS(b)} and the angle next to them make a straight line, so that angle is $180 - ${a} - ${b} = ${third}^\\circ$.`,
        'Vertically opposite angles are equal, so each angle equals the one directly opposite it.',
        direct ? `$x$ is the third angle on the straight line: $x = ${x}^\\circ$` : `$x$ is opposite an angle of ${degS(x)}, so $x = ${x}^\\circ$`,
        `Answer: ${degT(x)}`,
      ],
    };
  }
  // hard: algebra with vertically opposite (equal) or adjacent (sum 180) angles
  for (let t = 0; t < 300; t += 1) {
    const x = int(rng, 8, 30);
    const sameType = chance(rng, 0.6);
    const a1 = int(rng, 2, 6); const a2 = int(rng, 1, a1 - 1);
    const v = sameType ? int(rng, 40, 140) : int(rng, 45, 135);
    const v2 = sameType ? v : 180 - v;
    const b1 = v - a1 * x; const b2 = v2 - a2 * x;
    if (Math.abs(b1) > 60 || Math.abs(b2) > 80 || b1 === 0 || v < 35 || v2 < 35) continue;
    const dirs = [rot, rot + v, rot + 180, rot + 180 + v];
    const regions = sameType
      ? [{ from: dirs[0], to: dirs[1], label: exS(a1, b1) }, { from: dirs[2], to: dirs[3], label: exS(a2, b2) }]
      : [{ from: dirs[0], to: dirs[1], label: exS(a1, b1) }, { from: dirs[1], to: dirs[2], label: exS(a2, b2) }];
    const wrongX = sameType ? (180 - b1 - b2) / (a1 + a2) : (b2 - b1) / (a1 - a2);
    return {
      prompt: 'Two straight lines cross.<br>Work out the value of $x$.',
      visual: figure(W, H, raysBody(O, R, dirs, regions), { nda: true }),
      answer: `$x = ${x}$`,
      distractors: wrongs(x, [wrongX, (b2 + b1) / (a1 - a2), v, (180 - b1) / a1, (b1 - b2) / (a1 - a2) * -1, x + 5, x - 5, x + 2], { integer: true, near: [1, 3, 4] }).map((w) => `$x = ${w}$`),
      typed: { kind: 'number', value: x },
      solution: sameType ? [
        'The two marked angles are <b>vertically opposite</b>, so they are equal.',
        `$${ex(a1, b1)} = ${ex(a2, b2)}$`,
        `$${a1 - a2 === 1 ? 'x' : `${a1 - a2}x`} = ${b2 - b1}$`,
        ...(a1 - a2 === 1 ? [] : [`$${divT(a1 - a2, b2 - b1)}$`]),
        `Answer: $x = ${x}$`,
      ] : [
        'The two marked angles are next to each other on a straight line, so they add up to $180^\\circ$.',
        `$${ex(a1, b1)} + ${ex(a2, b2)} = 180$`,
        `$${ex(a1 + a2, b1 + b2)} = 180$, so $${tnum(a1 + a2)}x = ${180 - b1 - b2}$`,
        `$x = ${x}$`,
        `Answer: $x = ${x}$`,
      ],
    };
  }
  throw new Error('no case');
}, { title: 'Vertically opposite angles' });

const TYPES = [
  { name: 'Acute', test: (v) => v > 0 && v < 90, desc: 'less than $90^\\circ$' },
  { name: 'Right angle', test: (v) => v === 90, desc: 'exactly $90^\\circ$' },
  { name: 'Obtuse', test: (v) => v > 90 && v < 180, desc: 'between $90^\\circ$ and $180^\\circ$' },
  { name: 'Reflex', test: (v) => v > 180 && v < 360, desc: 'between $180^\\circ$ and $360^\\circ$' },
];
const typeOf = (v) => TYPES.find((t) => t.test(v));
const randomOfType = (rng, name, hard) => {
  if (name === 'Acute') return hard ? pick(rng, [85, 88, 89, int(rng, 5, 89)]) : int(rng, 2, 17) * 5;
  if (name === 'Right angle') return 90;
  if (name === 'Obtuse') return hard ? pick(rng, [91, 95, 175, 179, int(rng, 91, 179)]) : int(rng, 19, 35) * 5;
  return hard ? pick(rng, [181, 185, 270, 355, int(rng, 181, 359)]) : int(rng, 37, 71) * 5;
};

function drawAngleFigure(rng, v, labelText = null) {
  const W = 300; const H = 190;
  const rot = v > 180 ? int(rng, -20, 20) : int(rng, -15, 30);
  const O = v > 180 ? [150, 95] : [100 + (v > 100 ? 50 : 0), 140];
  const R = v > 180 ? 88 : 130;
  const P = polar(O, R, rot); const Q = polar(O, R, rot + v);
  let body = line(...O, ...P, { width: 2.2 }) + line(...O, ...Q, { width: 2.2 });
  body += v === 90 ? rightMark(O, P, Q, 14) : arcLabel(O, P, Q, labelText, { reflex: v > 180, r: v > 180 ? 24 : 30 });
  return figure(W, H, body);
}

export const angleTypes = ggen('geo-angle-types', 'geo-angle-basics', (rng, d) => {
  const mode = d === 'easy' ? pick(rng, ['classify', 'diagram']) : d === 'medium' ? pick(rng, ['classify', 'pick', 'diagram']) : pick(rng, ['pick', 'classify']);
  const hard = d === 'hard';
  if (mode === 'pick') {
    const want = pick(rng, ['Acute', 'Obtuse', 'Reflex']);
    const ans = randomOfType(rng, want, hard);
    const others = TYPES.filter((t) => t.name !== want).map((t) => t.name);
    const ds = [];
    for (const name of [...others, ...others, ...others]) {
      const v = randomOfType(rng, name, hard);
      if (!ds.includes(v) && v !== ans) ds.push(v);
    }
    // a value that is "the right size if you read the wrong way": 180 - ans
    if (want !== 'Reflex' && !ds.includes(180 - ans)) ds.unshift(180 - ans);
    const article = want === 'Acute' || want === 'Obtuse' ? 'an' : 'a';
    return {
      prompt: `Which of these angles is ${article} <b>${want.toLowerCase()}</b> angle?`,
      answer: degT(ans),
      distractors: ds.filter((v) => !typeOf(v) || typeOf(v).name !== want).map(degT),
      count: 4,
      solution: [
        `${want === 'Reflex' ? 'A reflex' : `An ${want.toLowerCase()}`} angle is ${TYPES.find((t) => t.name === want).desc}.`,
        `Only ${degT(ans)} fits.`,
        `Answer: ${degT(ans)}`,
      ],
    };
  }
  const want = pick(rng, ['Acute', 'Obtuse', 'Reflex', 'Acute', 'Obtuse', 'Reflex', 'Right angle']);
  const v = randomOfType(rng, want, hard);
  const opts = ['Acute', 'Right angle', 'Obtuse', 'Reflex'];
  if (mode === 'diagram') {
    return {
      prompt: 'What type of angle is marked in the diagram?',
      visual: drawAngleFigure(rng, v),
      answer: want,
      distractors: opts.filter((o) => o !== want),
      count: 4,
      solution: [
        'Acute: less than $90^\\circ$. Right angle: exactly $90^\\circ$. Obtuse: between $90^\\circ$ and $180^\\circ$. Reflex: more than $180^\\circ$.',
        want === 'Right angle' ? 'The square symbol marks a right angle.' : `The marked angle is ${want === 'Acute' ? 'smaller than a right angle' : want === 'Obtuse' ? 'bigger than a right angle but less than a straight line' : 'bigger than a straight line (half a turn)'}.`,
        `Answer: ${want}`,
      ],
    };
  }
  return {
    prompt: `What type of angle is ${degT(v)}?`,
    answer: want,
    distractors: opts.filter((o) => o !== want),
    count: 4,
    solution: [
      `${degT(v)} is ${typeOf(v).desc}.`,
      'Acute: less than $90^\\circ$. Obtuse: between $90^\\circ$ and $180^\\circ$. Reflex: between $180^\\circ$ and $360^\\circ$.',
      `Answer: ${want}`,
    ],
  };
}, { title: 'Types of angle' });

export const angleEstimate = ggen('geo-angle-estimate', 'geo-angle-basics', (rng, d) => {
  const reflex = d === 'hard' && chance(rng, 0.5);
  const v = reflex ? int(rng, 20, 34) * 10 : d === 'easy' ? pick(rng, [30, 40, 50, 60, 120, 130, 140, 150]) : pick(rng, [20, 30, 40, 50, 60, 70, 80, 100, 110, 120, 130, 140, 150, 160, 170]);
  const visual = drawAngleFigure(rng, v);
  const distract = reflex ? [360 - v, v - 180, v + 40, v - 40, v + 20] : [180 - v, v + 40, v - 40, v + 60, v - 60, v + 20];
  return {
    prompt: 'This angle is drawn accurately.<br>Which is the best estimate of its size?',
    visual,
    answer: degT(v),
    distractors: wrongs(v, distract, { min: 0, max: 359, integer: true }).filter((w) => Math.abs(w - v) >= 30 || w === 180 - v).map(degT),
    count: 4,
    solution: [
      `Compare with a right angle ($90^\\circ$)${reflex ? ' and a straight line ($180^\\circ$)' : ''}: the angle is ${reflex ? `more than $180^\\circ$, so it is reflex — about $${v - 180}^\\circ$ more than a straight line` : v < 90 ? 'smaller than a right angle, so it is acute' : 'bigger than a right angle, so it is obtuse'}.`,
      v !== 90 && !reflex ? `Don't confuse it with $${180 - v}^\\circ$ — that is reading the wrong scale on a protractor.` : 'Estimate by comparing with $90^\\circ$, $180^\\circ$ and $270^\\circ$.',
      `Answer: about ${degT(v)}`,
    ],
  };
}, { title: 'Estimate the size of an angle' });

/* ================================================================== */
/* geo-angles-triangles                                                */
/* ================================================================== */

/** Draw a triangle (maths coords from triFromAngles), with optional angle labels at A,B,C and vertex letters. */
export function drawTriangle(pts, { labels = [null, null, null], letters = null, right = [false, false, false], ticks = null, extendSide = null, extraLabel = null, W = 400, H = 260, nda = true, pad = 44 } = {}) {
  let Em = null;
  if (extendSide) {
    const [i, j] = extendSide;
    Em = add(pts[j], scale(sub(pts[j], pts[i]), 0.4));
  }
  const pl = place(Em ? [...pts, Em] : pts, { width: W, height: H, pad });
  const [A, B, C] = pl.P;
  const V = [A, B, C];
  const G = centroid(V);
  let body = polygon(V, { fill: FILL });
  const onLine = new Set();
  let away = null;
  if (extendSide) {
    // extendSide: [i, j, label] extends side Vi->Vj beyond Vj and labels the exterior angle at Vj
    const [i, j, lab] = extendSide;
    const E = pl.P[3];
    body += line(...V[j], ...E, { width: 2 });
    const k = 3 - i - j;
    if (lab) body += arcLabel(V[j], E, V[k], lab);
    // letters on the straight line go on the far side of the line from the triangle
    const u = unit(sub(E, V[i])); let nrm = [-u[1], u[0]];
    if ((V[k][0] - V[i][0]) * nrm[0] + (V[k][1] - V[i][1]) * nrm[1] > 0) nrm = scale(nrm, -1);
    away = nrm; onLine.add(i); onLine.add(j);
    if (letters) body += text(E[0] + nrm[0] * 15, E[1] + nrm[1] * 15, 'D', { size: 15, italic: true });
  }
  V.forEach((P, i) => {
    const others = V.filter((_, k) => k !== i);
    if (right[i]) body += rightMark(P, others[0], others[1], 13);
    else if (labels[i]) body += arcLabel(P, others[0], others[1], labels[i]);
    if (letters) body += onLine.has(i) ? text(P[0] + away[0] * 15, P[1] + away[1] * 15, letters[i], { size: 15, italic: true }) : pointLabel(P, letters[i], G, 16);
  });
  if (ticks) for (const [i, j] of ticks) body += equalTicks(V[i], V[j], 1, 7);
  if (extraLabel) body += extraLabel(V);
  return figure(W, H, body, { nda });
}

export const triThirdAngle = ggen('geo-tri-third-angle', 'geo-angles-triangles', (rng, d) => {
  if (d === 'hard') {
    // angles written in terms of x
    for (let t = 0; t < 300; t += 1) {
      const x = int(rng, 10, 30);
      const forms = shuffle(rng, [[1, 0], [int(rng, 2, 3), 0], [1, pick(rng, [10, 20, 30, -10, 15])], [int(rng, 2, 4), pick(rng, [-20, -10, 10, 5])]]).slice(0, 3);
      const angs = forms.map(([a, b]) => a * x + b);
      const sumA = forms.reduce((s, f) => s + f[0], 0); const sumB = forms.reduce((s, f) => s + f[1], 0);
      if (angs.reduce((s, v) => s + v, 0) !== 180 || angs.some((v) => v < 28 || v > 125)) continue;
      const pts = triFromAngles(angs[0], angs[1]);
      return {
        prompt: 'The angles of a triangle are shown.<br>Work out the value of $x$.',
        visual: drawTriangle(pts, { labels: forms.map(([a, b]) => exS(a, b)) }),
        answer: `$x = ${x}$`,
        distractors: wrongs(x, [(180 - sumB) / sumA + 0, (360 - sumB) / sumA, 180 / sumA, (180 + sumB) / sumA, angs[1], x + 5, x - 5, x + 10], { integer: true, near: [2, 3] }).map((v) => `$x = ${v}$`),
        typed: { kind: 'number', value: x },
        solution: [
          'Angles in a triangle add up to $180^\\circ$.',
          `$${forms.map(([a, b]) => ex(a, b)).join(' + ')} = 180$`,
          `$${collectT(sumA, sumB, 180)}$`,
          `$${divT(sumA, 180 - sumB)}$`,
          `Answer: $x = ${x}$`,
        ],
      };
    }
    throw new Error('no case');
  }
  const useRight = chance(rng, 0.3);
  const step = d === 'easy' ? 5 : 1;
  let angs;
  if (useRight) { const a = step * int(rng, Math.ceil(30 / step), Math.floor(60 / step)); angs = [90, a, 90 - a]; } else angs = partition(rng, 180, 3, { lo: 32, hi: 118, step });
  angs = shuffle(rng, angs);
  const xi = angs.indexOf(useRight ? angs.find((v) => v !== 90) : angs[int(rng, 0, 2)]);
  const x = angs[xi];
  const known = angs.filter((_, i) => i !== xi);
  const letters = chance(rng, 0.5) ? ['A', 'B', 'C'] : null;
  const pts = triFromAngles(angs[0], angs[1]);
  const visual = drawTriangle(pts, { labels: angs.map((v, i) => (i === xi ? 'x' : degS(v))), right: angs.map((v, i) => v === 90 && i !== xi), letters });
  const ks = known.reduce((s, v) => s + v, 0);
  return {
    prompt: 'Work out the size of angle $x$.',
    visual,
    answer: degT(x),
    distractors: angleWrongs(x, [360 - ks, ks, 180 - known[0], 180 - known[1], 90 - known[0], x + 90]),
    typed: { kind: 'number', value: x },
    hint: 'What do the angles in a triangle add up to?',
    solution: [
      'Angles in a triangle add up to $180^\\circ$.',
      `${useRight ? 'The square symbol means $90^\\circ$. ' : ''}$${sumT(known)} = ${ks}$`,
      `$x = 180 - ${ks} = ${x}^\\circ$`,
      `Answer: ${degT(x)}`,
    ],
  };
}, { title: 'Third angle of a triangle' });

export const triIsosceles = ggen('geo-tri-isosceles', 'geo-angles-triangles', (rng, d) => {
  const mode = d === 'easy' ? pick(rng, ['apex', 'base']) : d === 'medium' ? pick(rng, ['apex', 'base', 'baseOther']) : pick(rng, ['exterior', 'exteriorApex']);
  let apex; let base;
  if (mode === 'apex' || mode === 'exteriorApex') { apex = 2 * int(rng, d === 'easy' ? 10 : 12, d === 'easy' ? 40 : 55); if (d === 'easy') apex = 10 * Math.round(apex / 10); base = (180 - apex) / 2; } else { base = int(rng, d === 'easy' ? 7 : 32, d === 'easy' ? 15 : 78); if (d === 'easy') base *= 5; apex = 180 - 2 * base; }
  if (apex < 24 || base < 25 || base === 60) throw new Error('thin');
  const pts = triFromAngles(base, base); // A left, B right, C apex
  const letters = ['A', 'B', 'C'];
  let labels; let x; let sol; let ds; let extendSide = null; let prompt = '$AC = BC$.<br>Work out the size of angle $x$.';
  if (mode === 'apex') {
    labels = [pick(rng, ['x', 'x']), null, degS(apex)]; if (chance(rng, 0.5)) labels = [null, 'x', degS(apex)];
    x = base;
    sol = ['The triangle is isosceles ($AC = BC$), so the two base angles are equal.', `The base angles add up to $180 - ${apex} = ${180 - apex}^\\circ$.`, `Each base angle is $${180 - apex} \\div 2 = ${x}^\\circ$`];
    ds = [180 - apex, apex, 90 - apex / 2 === x ? 0 : 90 - apex / 2, (360 - apex) / 2, 180 - 2 * apex];
  } else if (mode === 'base' || mode === 'baseOther') {
    if (mode === 'base') { labels = [degS(base), null, 'x']; x = apex; sol = ['The triangle is isosceles ($AC = BC$), so angle $B$ is also ' + degT(base) + '.', `Angles in a triangle add up to $180^\\circ$: $x = 180 - ${base} - ${base}$`, `$x = ${apex}^\\circ$`]; ds = [180 - base, base, 90 - base, 360 - 2 * base, 180 - 2 * base + 10]; } else {
      labels = [degS(base), 'x', null]; x = base; sol = ['The triangle is isosceles ($AC = BC$), so the angles at $A$ and $B$ are equal.', `$x = ${base}^\\circ$`, `(The angle at $C$ would be $180 - 2 \\times ${base} = ${apex}^\\circ$.)`]; ds = [apex, 180 - base, (180 - base) / 2, 90 - base];
    }
  } else if (mode === 'exterior') {
    // exterior angle at B given, find apex
    const e = 180 - base;
    labels = [null, null, 'x']; x = apex; extendSide = [0, 1, degS(e)];
    sol = [`Angles on a straight line: angle $ABC = 180 - ${e} = ${base}^\\circ$.`, `Isosceles triangle ($AC = BC$): angle $BAC$ is also $${base}^\\circ$.`, `Angles in a triangle: $x = 180 - ${base} - ${base} = ${apex}^\\circ$`];
    ds = [180 - e, e - base, 360 - 2 * e, 180 - (180 - e), 2 * e - 90];
    prompt = '$AC = BC$ and $ABD$ is a straight line.<br>Work out the size of angle $x$.';
  } else {
    // apex given, find exterior angle at B
    const e = 180 - base;
    labels = [null, null, degS(apex)]; x = e; extendSide = [0, 1, 'x'];
    sol = [`Isosceles triangle ($AC = BC$): the base angles are equal, each $(180 - ${apex}) \\div 2 = ${base}^\\circ$.`, `Angles on a straight line: $x = 180 - ${base} = ${e}^\\circ$`];
    ds = [base, 180 - apex, apex + base + 0, 360 - e, 90 + apex];
    prompt = '$AC = BC$ and $ABD$ is a straight line.<br>Work out the size of angle $x$.';
  }
  return {
    prompt,
    visual: drawTriangle(pts, { labels, letters, ticks: [[0, 2], [1, 2]], extendSide }),
    answer: degT(x),
    distractors: angleWrongs(x, ds),
    typed: { kind: 'number', value: x },
    hint: 'The marks on two sides show they are equal, so the angles opposite them are equal.',
    solution: [...sol, `Answer: ${degT(x)}`],
  };
}, { title: 'Isosceles triangles' });

export const triExterior = ggen('geo-tri-exterior', 'geo-angles-triangles', (rng, d) => {
  const step = d === 'easy' ? 5 : 1;
  const [a, b] = [step * int(rng, Math.ceil(32 / step), Math.floor(80 / step)), step * int(rng, Math.ceil(32 / step), Math.floor(80 / step))];
  if (a + b > 150) throw new Error('too big');
  const pts = triFromAngles(a, b); // A left (a), B right (b), C top
  const e = 180 - b; // exterior at B on extension of AB beyond B
  const findExt = d === 'easy' ? true : chance(rng, 0.5);
  const c = 180 - a - b;
  let labels; let x; let ext; let sol; let ds;
  if (findExt) {
    labels = [degS(a), null, degS(c)]; ext = 'x'; x = e;
    sol = ['The exterior angle of a triangle equals the sum of the two interior angles opposite it.', `$x = ${a} + ${c} = ${x}^\\circ$`, `(Check: angle $B = 180 - ${a} - ${c} = ${b}^\\circ$ and $180 - ${b} = ${x}^\\circ$.)`];
    ds = [180 - a - c, 180 - a, 180 - c, 360 - a - c, a + c + b - 90];
  } else {
    labels = [degS(a), null, 'x']; ext = degS(e); x = c;
    sol = [`Angles on a straight line: angle $ABC = 180 - ${e} = ${b}^\\circ$.`, `Angles in a triangle: $x = 180 - ${a} - ${b} = ${c}^\\circ$`, `(Or: exterior angle = sum of opposite interior angles, so $x = ${e} - ${a} = ${c}^\\circ$.)`];
    ds = [e + a - 180 > 0 ? e + a : e + a, 180 - e, e - b, 180 - a, 360 - e - a];
  }
  return {
    prompt: '$ABD$ is a straight line.<br>Work out the size of angle $x$.',
    visual: drawTriangle(pts, { labels, letters: ['A', 'B', 'C'], extendSide: [0, 1, ext] }),
    answer: degT(x),
    distractors: angleWrongs(x, ds),
    typed: { kind: 'number', value: x },
    solution: [...sol, `Answer: ${degT(x)}`],
  };
}, { title: 'Exterior angle of a triangle' });

export const quadAngles = ggen('geo-quad-angles', 'geo-angles-triangles', (rng, d) => {
  const kind = d === 'easy' ? 'general' : d === 'medium' ? pick(rng, ['general', 'parallelogram', 'kite', 'trapezium']) : pick(rng, ['algebra', 'kite', 'algebra']);
  const W = 400; let H = 250;
  let angs; let labels; let x; let sol; let ds; let pts; let ticks = []; let arrows = []; let prompt = 'Work out the size of angle $x$.';
  let algebraAnswer = false;
  if (kind === 'general') {
    angs = partition(rng, 360, 4, { lo: 55, hi: 150, step: d === 'easy' ? 5 : 1 });
    const xi = int(rng, 0, 3); x = angs[xi];
    labels = angs.map((v, i) => (i === xi ? 'x' : degS(v)));
    const known = angs.filter((_, i) => i !== xi); const ks = known.reduce((s, v) => s + v, 0);
    pts = polyFromAngles(angs, rng);
    sol = ['Angles in a quadrilateral add up to $360^\\circ$.', `$${sumT(known)} = ${ks}$`, `$x = 360 - ${ks} = ${x}^\\circ$`];
    ds = [180 - ks + 180 - 180, 540 - ks, ks - 180, 180 - known[0], 360 - known[0] - known[1]];
  } else if (kind === 'parallelogram') {
    const a = int(rng, 50, 80); const b = 180 - a;
    angs = [a, b, a, b];
    pts = polyFromAngles(angs, rng, { spread: 0 }).map((p, i) => p);
    // make it a genuine parallelogram: sides 0 and 2 equal (automatic), stretch side 0
    pts = [[0, 0], [1.6, 0], [1.6 + Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)], [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)]];
    const gi = int(rng, 0, 3); const xi = pick(rng, [(gi + 1) % 4, (gi + 2) % 4, (gi + 3) % 4]);
    x = angs[xi];
    labels = angs.map((v, i) => (i === gi ? degS(v) : i === xi ? 'x' : null));
    arrows = [[0, 1, 1], [3, 2, 1], [0, 3, 2], [1, 2, 2]];
    prompt = 'The diagram shows a parallelogram.<br>Work out the size of angle $x$.';
    sol = (gi + 2) % 4 === xi ? ['In a parallelogram, <b>opposite angles are equal</b>.', `$x = ${x}^\\circ$`] : ['In a parallelogram, angles next to each other (between the parallel sides) add up to $180^\\circ$ — they are co-interior angles.', `$x = 180 - ${angs[gi]} = ${x}^\\circ$`];
    ds = [180 - x, 360 - angs[gi], 90 - (x % 90), (360 - 2 * angs[gi]) / 2 === x ? 0 : 360 - 2 * angs[gi], x / 2 + 45];
  } else if (kind === 'kite') {
    // kite with vertices top, right, bottom, left; equal angles at left and right
    const top = int(rng, 70, 110); const bottom = int(rng, 50, 76);
    const side = (360 - top - bottom) / 2;
    if (!Number.isInteger(side)) throw new Error('odd');
    // build: axis vertical; top vertex at (0, h1), bottom at (0, -h2), sides at (±w, 0)
    const w = 1; const h1 = w / Math.tan(((top / 2) * Math.PI) / 180); const h2 = w / Math.tan(((bottom / 2) * Math.PI) / 180);
    pts = [[0, h1], [-w, 0], [0, -h2], [w, 0]];
    angs = [top, side, bottom, side];
    const mode = d === 'hard' ? pick(rng, ['side', 'apex']) : pick(rng, ['side', 'top']);
    if (mode === 'apex') { labels = ['x', degS(side), degS(bottom), null]; x = top; sol = ['A kite has one pair of equal angles (between the unequal sides), so the unmarked side angle is also ' + degS(side) + '.', `Angles in a quadrilateral add up to $360^\\circ$: $x = 360 - ${side} - ${side} - ${bottom}$`, `$x = ${top}^\\circ$`]; ds = [360 - side - bottom, 180 - bottom, 2 * side, 180 - side, 360 - 2 * side]; } else
    if (mode === 'side') { labels = [degS(top), 'x', degS(bottom), null]; x = side; sol = ['A kite has one pair of equal angles (between the unequal sides).', `Angles in a quadrilateral add up to $360^\\circ$: the two equal angles add up to $360 - ${top} - ${bottom} = ${2 * side}^\\circ$.`, `$x = ${2 * side} \\div 2 = ${side}^\\circ$`]; ds = [2 * side, 360 - top - bottom - 90, 180 - top, 180 - bottom, (180 - top - bottom + 180) / 2 + 10]; } else { labels = [null, degS(side), degS(bottom), 'x']; x = side; sol = ['A kite has one pair of equal angles (between the unequal sides).', `So $x$ equals the other marked angle: $x = ${side}^\\circ$.`]; ds = [top, 360 - side - bottom - side, 180 - side, 360 - side - bottom, 180 - bottom]; }
    ticks = [[0, 1, 1], [0, 3, 1], [1, 2, 2], [3, 2, 2]];
    prompt = 'The diagram shows a kite.<br>Work out the size of angle $x$.';
  } else if (kind === 'trapezium') {
    const a = int(rng, 55, 80); const b = int(rng, 55, 85);
    angs = [a, b, 180 - b, 180 - a];
    pts = [[0, 0], [2, 0], [2 - Math.cos((b * Math.PI) / 180) * 0.9 / Math.sin((b * Math.PI) / 180), 0.9], [Math.cos((a * Math.PI) / 180) * 0.9 / Math.sin((a * Math.PI) / 180), 0.9]];
    const gi = int(rng, 0, 3); const xi = [3, 2, 1, 0][gi];
    x = angs[xi];
    labels = angs.map((v, i) => (i === gi ? degS(v) : i === xi ? 'x' : null));
    arrows = [[0, 1, 1], [3, 2, 1]];
    prompt = 'The diagram shows a trapezium.<br>Work out the size of angle $x$.';
    sol = ['The two arrowed sides are parallel.', 'Angles between the parallel sides on the same side are <b>co-interior</b>, so they add up to $180^\\circ$.', `$x = 180 - ${angs[gi]} = ${x}^\\circ$`];
    ds = [angs[gi], 360 - angs[gi], 90 + angs[gi] > 180 ? 0 : 90 + angs[gi], angs[gi] - 90 > 0 ? angs[gi] - 90 : 0, 270 - angs[gi]];
  } else {
    algebraAnswer = true;
    for (let t = 0; t < 300; t += 1) {
      const xv = int(rng, 15, 40);
      const forms = [[1, 0], [2, 0], [int(rng, 1, 3), pick(rng, [10, 20, 30, -10])], [int(rng, 2, 4), pick(rng, [-20, -30, 10, 0])]];
      const vals = forms.map(([a, b]) => a * xv + b);
      if (vals.reduce((s, v) => s + v, 0) !== 360 || vals.some((v) => v < 45 || v > 160)) continue;
      const order = shuffle(rng, [0, 1, 2, 3]);
      angs = order.map((i) => vals[i]);
      labels = order.map((i) => exS(...forms[i]));
      pts = polyFromAngles(angs, rng);
      const SA = forms.reduce((s, f) => s + f[0], 0); const SB = forms.reduce((s, f) => s + f[1], 0);
      x = xv;
      sol = ['Angles in a quadrilateral add up to $360^\\circ$.', `$${forms.map((f) => ex(...f)).join(' + ')} = 360$`, `$${collectT(SA, SB, 360)}$`, `$${divT(SA, 360 - SB)}$`];
      ds = [(180 - SB) / SA, 360 / SA, (360 + SB) / SA, vals[1], x + 5, x - 5, x + 10];
      prompt = 'Work out the value of $x$.';
      break;
    }
    if (!pts) throw new Error('no algebra quad');
  }
  if (kind === 'kite') H = 310;
  const pl = place(pts, { width: W, height: H, pad: kind === 'kite' ? 30 : 44 });
  const V = pl.P; const G = centroid(V);
  let body = polygon(V, { fill: FILL });
  V.forEach((P, i) => { if (labels[i]) body += arcLabel(P, V[(i + 3) % 4], V[(i + 1) % 4], labels[i]); });
  for (const [i, j, n] of ticks) body += equalTicks(V[i], V[j], n, 7);
  for (const [i, j, n] of arrows) body += parallelArrows(V[i], V[j], n, 7);
  void G;
  return {
    prompt,
    visual: figure(W, H, body, { nda: true }),
    answer: algebraAnswer ? `$x = ${x}$` : degT(x),
    distractors: algebraAnswer ? wrongs(x, ds, { integer: true, near: [2, 3] }).map((v) => `$x = ${v}$`) : angleWrongs(x, ds),
    typed: { kind: 'number', value: x },
    solution: [...sol, `Answer: ${algebraAnswer ? `$x = ${x}$` : degT(x)}`],
  };
}, { title: 'Angles in quadrilaterals' });

export const triMultiStep = ggen('geo-tri-multistep', 'geo-angles-triangles', (rng, d) => {
  const tpl = d === 'easy' ? 'bowtie' : pick(rng, d === 'medium' ? ['bowtie', 'isoExt', 'equiIso'] : ['equiIso', 'isoExt', 'rightLine']);
  const W = 420; const H = 250;
  if (tpl === 'bowtie') {
    // Two triangles meeting at a point O where two straight lines cross. Triangle 1: angles p, q (at A, B); triangle 2: angle r at C, x at D.
    const step = d === 'easy' ? 5 : 1;
    const o = step * int(rng, Math.ceil(40 / step), Math.floor(80 / step));
    const p = step * int(rng, Math.ceil(35 / step), Math.floor((140 - o) / step));
    const q = 180 - o - p;
    const r = step * int(rng, Math.ceil(35 / step), Math.floor((140 - o) / step));
    const x = 180 - o - r;
    if (q < 30 || x < 30) throw new Error('thin');
    // Build: O at origin, line 1 direction +/-u, line 2 +/-v with angle o between them (left triangle opens left).
    const O = [0, 0];
    const dirA = 180 - o / 2; const dirB = 180 + o / 2;
    // triangle OAB with angle at A = p, at B = q. Use law of sines: OA/sin q = OB/sin p
    const OA = Math.sin((q * Math.PI) / 180); const OB = Math.sin((p * Math.PI) / 180);
    const A = [OA * Math.cos((dirA * Math.PI) / 180), OA * Math.sin((dirA * Math.PI) / 180)];
    const B = [OB * Math.cos((dirB * Math.PI) / 180), OB * Math.sin((dirB * Math.PI) / 180)];
    const OC = Math.sin((x * Math.PI) / 180); const OD = Math.sin((r * Math.PI) / 180);
    const C = [-OC * Math.cos((dirB * Math.PI) / 180), -OC * Math.sin((dirB * Math.PI) / 180)];
    const Dd = [-OD * Math.cos((dirA * Math.PI) / 180), -OD * Math.sin((dirA * Math.PI) / 180)];
    const pl = place([A, B, O, C, Dd], { width: W, height: H, pad: 40 });
    const [sA, sB, sO, sC, sD] = pl.P;
    let body = polygon([sA, sB, sO], { fill: FILL }) + polygon([sO, sC, sD], { fill: FILL });
    body += arcLabel(sA, sB, sO, degS(p)) + arcLabel(sB, sA, sO, degS(q)) + arcLabel(sC, sD, sO, degS(r)) + arcLabel(sD, sC, sO, 'x');
    body += pointLabel(sA, 'A', centroid([sA, sB, sO])) + pointLabel(sB, 'B', centroid([sA, sB, sO])) + pointLabel(sC, 'C', centroid([sC, sD, sO])) + pointLabel(sD, 'D', centroid([sC, sD, sO]));
    body += labelAt(sO, 'O', -90, 16, { italic: true });
    return {
      prompt: '$AOC$ and $BOD$ are straight lines.<br>Work out the size of angle $x$.',
      visual: figure(W, H, body, { nda: true }),
      answer: degT(x),
      distractors: angleWrongs(x, [180 - r - p, 180 - r - q, o, 180 - o, p + q - r, 360 - p - q - r]),
      typed: { kind: 'number', value: x },
      solution: [
        `Angles in triangle $AOB$: angle $AOB = 180 - ${p} - ${q} = ${o}^\\circ$.`,
        `Vertically opposite angles are equal, so angle $COD = ${o}^\\circ$.`,
        `Angles in triangle $COD$: $x = 180 - ${o} - ${r} = ${x}^\\circ$`,
        `Answer: ${degT(x)}`,
      ],
    };
  }
  if (tpl === 'isoExt') {
    // Isosceles triangle ABC with AB = AC... use apex A at top; BCD straight; find exterior angle ACD given apex.
    const apex = 2 * int(rng, 12, 45); const base = (180 - apex) / 2;
    const pts = triFromAngles(base, base);
    const pl = place([...pts, [1.45, 0]], { width: W, height: H, pad: 40 });
    const [B, C, A, D] = pl.P;
    const askApex = chance(rng, 0.5);
    let body = polygon([B, C, A], { fill: FILL }) + line(...C, ...D, { width: 2 });
    body += equalTicks(A, B, 1) + equalTicks(A, C, 1);
    body += askApex ? arcLabel(A, B, C, 'x') + arcLabel(C, D, A, degS(180 - base)) : arcLabel(A, B, C, degS(apex)) + arcLabel(C, D, A, 'x');
    body += pointLabel(A, 'A', centroid([A, B, C])) + labelAt(B, 'B', 90, 15, { italic: true }) + labelAt(C, 'C', 90, 15, { italic: true }) + labelAt(D, 'D', 90, 15, { italic: true });
    const x = askApex ? apex : 180 - base;
    return {
      prompt: '$AB = AC$ and $BCD$ is a straight line.<br>Work out the size of angle $x$.',
      visual: figure(W, H, body, { nda: true }),
      answer: degT(x),
      distractors: angleWrongs(x, askApex ? [base, 180 - 2 * (180 - base) > 0 ? 0 : 0, 2 * (180 - base) - 180 + 10, 180 - (180 - base), 360 - 2 * (180 - base), (180 - base) - base] : [base, apex, 180 - apex, 180 - base / 2, 90 + apex / 2 + 10]),
      typed: { kind: 'number', value: x },
      solution: askApex ? [
        `Angles on a straight line: angle $ACB = 180 - ${180 - base} = ${base}^\\circ$.`,
        `$AB = AC$ so the triangle is isosceles: angle $ABC = ${base}^\\circ$ too.`,
        `Angles in a triangle: $x = 180 - ${base} - ${base} = ${apex}^\\circ$`,
        `Answer: ${degT(x)}`,
      ] : [
        `$AB = AC$, so the base angles are equal: each is $(180 - ${apex}) \\div 2 = ${base}^\\circ$.`,
        `Angles on a straight line: $x = 180 - ${base} = ${x}^\\circ$`,
        `Answer: ${degT(x)}`,
      ],
    };
  }
  if (tpl === 'equiIso') {
    // B, C, D straight line; ABC equilateral; CE = DE (E above CD); angle CED = e; x = angle ACE.
    const e = 2 * int(rng, 10, 40);
    const base = (180 - e) / 2;
    const x = 180 - 60 - base;
    const Bm = [0, 0]; const Cm = [1, 0]; const Am = [0.5, Math.sqrt(3) / 2];
    const cd = 0.9; const Dm = [1 + cd, 0]; const Em = [1 + cd / 2, (cd / 2) * Math.tan((base * Math.PI) / 180)];
    const pl = place([Bm, Cm, Am, Dm, Em], { width: W, height: H, pad: 36 });
    const [B, C, A, Dp, E] = pl.P;
    let body = polygon([B, C, A], { fill: FILL }) + polygon([C, Dp, E], { fill: FILL }) + line(...B, ...Dp, { width: 2 });
    body += arcLabel(E, C, Dp, degS(e)) + arcLabel(C, A, E, 'x') + equalTicks(C, E, 1) + equalTicks(Dp, E, 1);
    body += labelAt(A, 'A', -90, 14, { italic: true }) + labelAt(B, 'B', 90, 15, { italic: true }) + labelAt(C, 'C', 90, 15, { italic: true }) + labelAt(Dp, 'D', 90, 15, { italic: true }) + labelAt(E, 'E', -90, 14, { italic: true });
    return {
      prompt: '$BCD$ is a straight line.<br>Triangle $ABC$ is equilateral.<br>$CE = DE$<br>Work out the size of angle $x$.',
      visual: figure(W, H, body, { nda: true }),
      answer: degT(x),
      distractors: angleWrongs(x, [180 - 60 - e, 120 - (180 - e), 180 - base, 60 + base > 180 ? 0 : 180 - 60 - (180 - e) + 180, base, 120 - e / 2, 180 - 90 - base]),
      typed: { kind: 'number', value: x },
      solution: [
        'An equilateral triangle has all angles $60^\\circ$, so angle $ACB = 60^\\circ$.',
        `$CE = DE$, so triangle $CDE$ is isosceles: angle $ECD = (180 - ${e}) \\div 2 = ${base}^\\circ$.`,
        `Angles on a straight line at $C$: $x = 180 - 60 - ${base} = ${x}^\\circ$`,
        `Answer: ${degT(x)}`,
      ],
    };
  }
  // rightLine: right-angled triangle on a straight line with an isosceles neighbour
  const a = int(rng, 25, 65);
  // A-B-C-D straight line? Simpler: triangle ABC right-angled at B, C-D on line BD; triangle ACD isosceles with AC = CD; find angle CAD = x.
  const angACB = 90 - a; // angle at A in triangle ABC is a, at C is 90-a
  const ext = 180 - angACB; // angle ACD
  const x = (180 - ext) / 2;
  if (!Number.isInteger(x)) throw new Error('odd');
  const Bm = [0, 0]; const Am = [0, 1]; const Cm = [Math.tan((a * Math.PI) / 180), 0];
  const AC = Math.hypot(Cm[0], 1); const Dm = [Cm[0] + AC, 0];
  const pl = place([Am, Bm, Cm, Dm], { width: W, height: H, pad: 36 });
  const [A, B, C, Dp] = pl.P;
  let body = polygon([A, B, C], { fill: FILL }) + polygon([A, C, Dp], { fill: FILL }) + rightMark(B, A, C, 13);
  body += arcLabel(A, B, C, degS(a)) + arcLabel(Dp, A, C, 'x') + equalTicks(A, C, 1) + equalTicks(C, Dp, 1);
  body += labelAt(A, 'A', -90, 14, { italic: true }) + labelAt(B, 'B', 90, 15, { italic: true }) + labelAt(C, 'C', 90, 15, { italic: true }) + labelAt(Dp, 'D', 90, 15, { italic: true });
  return {
    prompt: '$BCD$ is a straight line.<br>$AC = CD$<br>Work out the size of angle $x$.',
    visual: figure(W, H, body, { nda: true }),
    answer: degT(x),
    distractors: angleWrongs(x, [angACB, ext, a, 180 - ext, (180 - angACB) / 2 === x ? 0 : (180 - angACB), 90 - x]),
    typed: { kind: 'number', value: x },
    solution: [
      `Angles in triangle $ABC$: angle $ACB = 180 - 90 - ${a} = ${angACB}^\\circ$.`,
      `Angles on a straight line: angle $ACD = 180 - ${angACB} = ${ext}^\\circ$.`,
      `$AC = CD$, so triangle $ACD$ is isosceles and angles $CAD$ and $CDA$ are equal: $x = (180 - ${ext}) \\div 2 = ${x}^\\circ$`,
      `Answer: ${degT(x)}`,
    ],
  };
}, { title: 'Multi-step angle problems', learn: ['geo-angles-triangles', 'geo-angle-basics'] });

/* ================================================================== */
/* geo-parallel-lines                                                  */
/* ================================================================== */

const REGIONS = ['UR', 'UL', 'LL', 'LR'];
function regionSize(region, t) { return region === 'UR' || region === 'LL' ? t : 180 - t; }
/** Relationship between two angle positions (intersection P or Q; region). */
function relation(a, b) {
  if (a.X === b.X) {
    const ia = REGIONS.indexOf(a.r); const ib = REGIONS.indexOf(b.r);
    return (ia + 2) % 4 === ib ? 'vert' : 'straight';
  }
  const [p, q] = a.X === 'P' ? [a, b] : [b, a];
  if (p.r === q.r) return 'corr';
  if ((p.r === 'LL' && q.r === 'UR') || (p.r === 'LR' && q.r === 'UL')) return 'alt';
  if ((p.r === 'LL' && q.r === 'UL') || (p.r === 'LR' && q.r === 'UR')) return 'coint';
  return null;
}
const REASON = {
  vert: 'vertically opposite angles are equal',
  straight: 'angles on a straight line add up to $180^\\circ$',
  corr: 'corresponding angles are equal',
  alt: 'alternate angles are equal',
  coint: 'co-interior angles add up to $180^\\circ$',
};
const REL_NAME = { vert: 'vertically opposite', corr: 'corresponding', alt: 'alternate', coint: 'co-interior', straight: 'on a straight line with' };

/** Two horizontal parallel lines and a transversal with angle t at UR. labels: {PUR: 'x', ...}. */
export function parallelFigure(t, labels, { W = 420, H = 270, letters = false } = {}) {
  const yP = 100; const yQ = 190; const gap = yQ - yP;
  const dx = gap / Math.tan((t * Math.PI) / 180);
  const P = [W / 2 + dx / 2, yP]; const Q = [W / 2 - dx / 2, yQ];
  let body = line(25, yP, W - 25, yP, { width: 2 }) + line(25, yQ, W - 25, yQ, { width: 2 });
  body += parallelArrows([W - 120, yP], [W - 60, yP], 1) + parallelArrows([W - 120, yQ], [W - 60, yQ], 1);
  const T1 = along(Q, P, -72); const T2 = along(P, Q, -72);
  body += line(...T1, ...T2, { width: 2 });
  const rays = (X) => ({ right: add(X, [60, 0]), up: polar(X, 60, t), left: add(X, [-60, 0]), down: polar(X, 60, t + 180) });
  const reg = { UR: ['right', 'up'], UL: ['up', 'left'], LL: ['left', 'down'], LR: ['down', 'right'] };
  for (const [key, lab] of Object.entries(labels)) {
    const X = key[0] === 'P' ? P : Q; const rr = rays(X); const [a, b] = reg[key.slice(1)];
    body += arcLabel(X, rr[a], rr[b], lab, { r: /^[a-h]$/.test(lab) ? 16 : null, arc: !/^[a-h]$/.test(lab), dist: /^[a-h]$/.test(lab) ? 24 : null });
  }
  if (letters) body += dot(...P, 2.5) + dot(...Q, 2.5);
  return figure(W, H, body, { nda: !Object.values(labels).every((l) => /^[a-h]$/.test(l)) });
}

export const parallelName = ggen('geo-par-name', 'geo-parallel-lines', (rng, d) => {
  const t = pick(rng, [int(rng, 52, 72), int(rng, 108, 128)]);
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const positions = ['P', 'Q'].flatMap((X) => REGIONS.map((r) => ({ X, r })));
  const labelOf = new Map(positions.map((p, i) => [`${p.X}${p.r}`, letters[i]]));
  const lab = (p) => labelOf.get(`${p.X}${p.r}`);
  const want = d === 'easy' ? pick(rng, ['vert', 'corr']) : d === 'medium' ? pick(rng, ['corr', 'alt', 'vert']) : pick(rng, ['alt', 'coint', 'corr']);
  const pairMode = d !== 'easy' && chance(rng, 0.45);
  const visual = parallelFigure(t, Object.fromEntries(positions.map((p) => [`${p.X}${p.r}`, lab(p)])));
  const name = REL_NAME[want];
  if (pairMode) {
    const pairs = [];
    for (let i = 0; i < 8; i += 1) for (let j = i + 1; j < 8; j += 1) pairs.push([positions[i], positions[j]]);
    const good = shuffle(rng, pairs.filter(([a, b]) => relation(a, b) === want));
    const [a, b] = good[0];
    const fmt = ([p, q]) => `$${lab(p)}$ and $${lab(q)}$`;
    const bad = shuffle(rng, pairs.filter(([p, q]) => relation(p, q) !== want && relation(p, q) !== null && relation(p, q) !== 'straight'));
    const others = shuffle(rng, pairs.filter(([p, q]) => relation(p, q) === null));
    return {
      prompt: `The diagram shows two parallel lines crossed by a straight line.<br>Which pair of angles are <b>${name}</b> angles?`,
      visual,
      answer: fmt([a, b]),
      distractors: [...bad.slice(0, 4), ...others.slice(0, 2)].map(fmt),
      count: 4,
      solution: [
        want === 'alt' ? 'Alternate angles are on opposite sides of the crossing line, between the parallel lines (a <b>Z</b> shape). They are equal.'
          : want === 'corr' ? 'Corresponding angles are in the same position at each crossing (an <b>F</b> shape). They are equal.'
            : want === 'coint' ? 'Co-interior angles are on the same side of the crossing line, between the parallel lines (a <b>C</b> shape). They add up to $180^\\circ$.'
              : 'Vertically opposite angles are opposite each other where two lines cross. They are equal.',
        `$${lab(a)}$ and $${lab(b)}$ fit this description.`,
        `Answer: ${fmt([a, b])}`,
      ],
    };
  }
  const candidates = shuffle(rng, positions.filter((p) => positions.some((q) => relation(p, q) === want)));
  const base = candidates[0];
  const target = positions.find((q) => q !== base && relation(base, q) === want);
  const ds = positions.filter((q) => q !== base && q !== target).sort((p, q) => (relation(base, q) ? 1 : 0) - (relation(base, p) ? 1 : 0)).map((p) => `$${lab(p)}$`);
  return {
    prompt: `The diagram shows two parallel lines crossed by a straight line.<br>Which angle is <b>${name}</b> ${want === 'straight' ? '' : 'to'} angle $${lab(base)}$?`,
    visual,
    answer: `$${lab(target)}$`,
    distractors: ds,
    solution: [
      want === 'alt' ? 'Alternate angles are on opposite sides of the crossing line, between the parallel lines (a <b>Z</b> shape).'
        : want === 'corr' ? 'Corresponding angles are in matching positions at the two crossings (an <b>F</b> shape).'
          : want === 'coint' ? 'Co-interior angles are between the parallel lines on the same side of the crossing line (a <b>C</b> shape).'
            : 'Vertically opposite angles are opposite each other at the same crossing.',
      `So the angle ${name} to $${lab(base)}$ is $${lab(target)}$.`,
      `Answer: $${lab(target)}$`,
    ],
  };
}, { title: 'Name alternate, corresponding and co-interior angles' });

function parallelPick(rng, { direct, allow = ['alt', 'corr', 'coint', 'vert'] }) {
  const positions = ['P', 'Q'].flatMap((X) => REGIONS.map((r) => ({ X, r })));
  for (let k = 0; k < 200; k += 1) {
    const g = pick(rng, positions); const x = pick(rng, positions);
    if (g === x) continue;
    const rel = relation(g, x);
    if (direct && !allow.includes(rel)) continue;
    if (!direct && (rel !== null)) continue;
    return { g, x, rel };
  }
  throw new Error('no pair');
}

export const parallelFind = ggen('geo-par-find', 'geo-parallel-lines', (rng, d) => {
  const direct = d === 'easy' || (d === 'medium' && chance(rng, 0.4));
  const t = d === 'easy' ? 5 * int(rng, 10, 26) : int(rng, 48, 132);
  if (t === 90) throw new Error('right');
  const { g, x, rel } = parallelPick(rng, { direct, allow: d === 'easy' ? ['alt', 'corr', 'vert'] : ['alt', 'corr', 'coint', 'vert'] });
  const gv = regionSize(g.r, t); const xv = regionSize(x.r, t);
  const visual = parallelFigure(t, { [`${g.X}${g.r}`]: degS(gv), [`${x.X}${x.r}`]: 'x' });
  let sol;
  if (direct) sol = [`The angle $x$ and the ${degS(gv)} angle are ${REL_NAME[rel]} angles.`, `${REASON[rel].charAt(0).toUpperCase() + REASON[rel].slice(1)}${rel === 'coint' ? `, so $x = 180 - ${gv} = ${xv}^\\circ$` : `, so $x = ${xv}^\\circ$`}.`];
  else {
    // step via the corresponding angle at x's intersection
    const mid1 = { X: x.X, r: g.r };
    const rel2 = relation(mid1, x);
    sol = [
      `Corresponding angles are equal, so the angle in the same position as ${degS(gv)} at the other crossing is also ${degS(gv)}.`,
      rel2 === 'vert' ? `$x$ is vertically opposite that angle, so $x = ${xv}^\\circ$.` : `$x$ is on a straight line with that angle, so $x = 180 - ${gv} = ${xv}^\\circ$.`,
    ];
  }
  return {
    prompt: 'The diagram shows two parallel lines and a straight line crossing them.<br>Work out the size of angle $x$.',
    visual,
    answer: degT(xv),
    distractors: angleWrongs(xv, [180 - xv, 360 - gv, 90 - (xv % 90), gv / 2 === xv ? 0 : 2 * gv > 359 ? 0 : 2 * gv, 270 - xv, xv + 90]),
    typed: { kind: 'number', value: xv },
    solution: [...sol, `Answer: ${degT(xv)}`],
  };
}, { title: 'Find an angle in parallel lines' });

export const parallelReason = ggen('geo-par-reason', 'geo-parallel-lines', (rng, d) => {
  const t = d === 'hard' ? int(rng, 48, 132) : 5 * int(rng, 10, 26);
  if (Math.abs(t - 90) < 4) throw new Error('right');
  const { g, x, rel } = parallelPick(rng, { direct: true, allow: d === 'easy' ? ['alt', 'corr'] : d === 'medium' ? ['alt', 'corr', 'coint', 'vert'] : ['alt', 'coint', 'coint', 'corr'] });
  const gv = regionSize(g.r, t); const xv = regionSize(x.r, t);
  const visual = parallelFigure(t, { [`${g.X}${g.r}`]: degS(gv), [`${x.X}${x.r}`]: 'x' });
  const opt = (v, r) => `$x = ${v}^\\circ$ because ${REASON[r]}`;
  const ds = [];
  for (const r of ['alt', 'corr', 'coint', 'vert']) {
    if (r === rel) continue;
    ds.push(opt(r === 'coint' ? 180 - gv : gv, r));
  }
  ds.push(opt(180 - xv, rel === 'coint' ? 'alt' : rel), opt(180 - gv === xv ? gv : 180 - gv, 'straight'));
  // classic misconception: thinking co-interior angles are equal (or alternate angles add to 180)
  if (d === 'hard') ds.unshift(rel === 'coint' ? `$x = ${gv}^\\circ$ because co-interior angles are equal` : `$x = ${180 - gv}^\\circ$ because ${rel === 'alt' ? 'alternate' : 'corresponding'} angles add up to $180^\\circ$`);
  return {
    prompt: 'The diagram shows two parallel lines.<br>Which statement gives the correct size of angle $x$ <b>and</b> the correct reason?',
    visual,
    answer: opt(xv, rel),
    distractors: d === 'hard' ? [ds[0], ...shuffle(rng, ds.slice(1))] : shuffle(rng, ds),
    count: 4,
    solution: [
      `$x$ and the ${degS(gv)} angle are ${REL_NAME[rel]} angles${rel === 'alt' ? ' (Z shape)' : rel === 'corr' ? ' (F shape)' : rel === 'coint' ? ' (C shape)' : ''}.`,
      `${REASON[rel].charAt(0).toUpperCase() + REASON[rel].slice(1)}, so $x = ${xv}^\\circ$.`,
      `Answer: ${opt(xv, rel)}`,
    ],
  };
}, { title: 'Parallel lines: angle with reason' });

export const parallelTriangle = ggen('geo-par-triangle', 'geo-parallel-lines', (rng, d) => {
  const step = d === 'easy' ? 5 : 1;
  const p = step * int(rng, Math.ceil(38 / step), Math.floor(80 / step));
  const q = step * int(rng, Math.ceil(38 / step), Math.floor(80 / step));
  const r = 180 - p - q;
  if (r < 30) throw new Error('thin');
  const W = 420; const H = 240; const yU = 65; const yL = 195; const h = yL - yU;
  const xr = W / 2 + int(rng, -30, 30);
  const R = [xr, yL];
  const P = [xr - h / Math.tan((p * Math.PI) / 180), yU];
  const Q = [xr + h / Math.tan((q * Math.PI) / 180), yU];
  if (P[0] < 40 || Q[0] > W - 40) throw new Error('wide');
  const named = {
    Pint: [P, Q, R, p], Pext: [P, [20, yU], R, 180 - p], Qint: [Q, P, R, q], Qext: [Q, [W - 20, yU], R, 180 - q],
    Rleft: [R, [20, yL], P, p], Rint: [R, P, Q, r], Rright: [R, [W - 20, yL], Q, q],
  };
  const combos = [
    { given: ['Pint', 'Rright'], target: 'Rint', steps: [`Alternate angles are equal: the angle between $RP$ and the lower line on the left is ${degS(p)}.`, `Angles on a straight line at $R$: $x = 180 - ${p} - ${q} = ${r}^\\circ$`] },
    { given: ['Rleft', 'Rint'], target: 'Qext', steps: [`Angles on a straight line at $R$: the angle between $RQ$ and the lower line on the right is $180 - ${p} - ${r} = ${q}^\\circ$.`, `Alternate angles are equal, so angle $PQR = ${q}^\\circ$.`, `Angles on a straight line at $Q$: $x = 180 - ${q} = ${180 - q}^\\circ$`] },
    { given: ['Pext', 'Rright'], target: 'Rint', steps: [`Angles on a straight line at $P$: angle $QPR = 180 - ${180 - p} = ${p}^\\circ$.`, `Alternate angles: the angle between $RP$ and the lower line on the left is also ${degS(p)}.`, `Angles on a straight line at $R$: $x = 180 - ${p} - ${q} = ${r}^\\circ$`] },
    { given: ['Qext', 'Rleft'], target: 'Rint', steps: [`Angles on a straight line at $Q$: angle $PQR = 180 - ${180 - q} = ${q}^\\circ$.`, `Alternate angles: the angle between $RQ$ and the lower line on the right is also ${degS(q)}.`, `Angles on a straight line at $R$: $x = 180 - ${p} - ${q} = ${r}^\\circ$`] },
    { given: ['Pint', 'Rint'], target: 'Rright', steps: [`Alternate angles are equal: the angle between $RP$ and the lower line on the left is ${degS(p)}.`, `Angles on a straight line at $R$: $x = 180 - ${p} - ${r} = ${q}^\\circ$`] },
  ];
  const c = pick(rng, d === 'easy' ? [combos[0], combos[4]] : combos);
  let body = line(20, yU, W - 20, yU, { width: 2 }) + line(20, yL, W - 20, yL, { width: 2 });
  body += parallelArrows([50, yU], [80, yU]) + parallelArrows([50, yL], [80, yL]);
  body += polygon([P, Q, R], { fill: FILL });
  for (const k of [...c.given, c.target]) {
    const [V, A, B, v] = named[k];
    body += arcLabel(V, A, B, k === c.target ? 'x' : degS(v));
  }
  body += labelAt(P, 'P', -90, 14, { italic: true }) + labelAt(Q, 'Q', -90, 14, { italic: true }) + labelAt(R, 'R', 90, 15, { italic: true });
  const x = named[c.target][3];
  const g1 = named[c.given[0]][3]; const g2 = named[c.given[1]][3];
  return {
    prompt: 'The diagram shows two parallel lines. $P$ and $Q$ are on the upper line and $R$ is on the lower line.<br>Work out the size of angle $x$.',
    visual: figure(W, H, body, { nda: true }),
    answer: degT(x),
    distractors: angleWrongs(x, [180 - x, g1 + g2 > 180 ? 360 - g1 - g2 : 180 - g1 - g2, g1, g2, 180 - g1, 180 - g2, 360 - g1 - g2 - x]),
    typed: { kind: 'number', value: x },
    solution: [...c.steps, `Answer: ${degT(x)}`],
  };
}, { title: 'Triangle between parallel lines', learn: ['geo-parallel-lines', 'geo-angles-triangles'] });

export const parallelAlgebra = ggen('geo-par-algebra', 'geo-parallel-lines', (rng, d) => {
  for (let k = 0; k < 300; k += 1) {
    const rel = pick(rng, d === 'easy' ? ['alt', 'corr'] : ['alt', 'corr', 'coint', 'vert']);
    const positions = ['P', 'Q'].flatMap((X) => REGIONS.map((r) => ({ X, r })));
    const pairs = [];
    for (const a of positions) for (const b of positions) if (a !== b && relation(a, b) === rel) pairs.push([a, b]);
    const [g, h] = pick(rng, pairs);
    const x = int(rng, d === 'easy' ? 10 : 8, d === 'hard' ? 40 : 30);
    const a1 = int(rng, 2, d === 'easy' ? 3 : 5); const a2 = d === 'easy' ? 1 : int(rng, 1, a1 - 1);
    const t = int(rng, 50, 130);
    if (Math.abs(t - 90) < 6) continue;
    const v1 = regionSize(g.r, t); const v2 = regionSize(h.r, t);
    const b1 = v1 - a1 * x; const b2 = v2 - a2 * x;
    if (b1 === 0 || Math.abs(b1) > 70 || Math.abs(b2) > 90) continue;
    if (rel === 'coint' && a1 === a2) continue;
    const askAngle = d === 'hard' && chance(rng, 0.5);
    const visual = parallelFigure(t, { [`${g.X}${g.r}`]: exS(a1, b1), [`${h.X}${h.r}`]: exS(a2, b2) });
    const eqT = rel === 'coint' ? `${ex(a1, b1)} + ${ex(a2, b2)} = 180` : `${ex(a1, b1)} = ${ex(a2, b2)}`;
    const wrongX = rel === 'coint' ? (b2 - b1) / (a1 - a2) : (180 - b1 - b2) / (a1 + a2);
    const solve = rel === 'coint'
      ? [`$${ex(a1 + a2, b1 + b2)} = 180$`, `$${tnum(a1 + a2)}x = ${180 - b1 - b2}$, so $x = ${x}$`]
      : (a1 - a2 === 1 ? [`$x = ${b2 - b1}$`] : [`$${a1 - a2}x = ${b2 - b1}$`, `$${divT(a1 - a2, b2 - b1)}$`]);
    const sol = [
      `The two marked angles are ${REL_NAME[rel]} angles, so ${rel === 'coint' ? 'they add up to $180^\\circ$' : 'they are equal'}.`,
      `$${eqT}$`, ...solve,
    ];
    if (askAngle) {
      return {
        prompt: `The diagram shows two parallel lines.<br>Work out the size of the angle marked $${ex(a1, b1)}$.`,
        visual,
        answer: degT(v1),
        distractors: angleWrongs(v1, [180 - v1, x, Number.isInteger(wrongX) ? a1 * wrongX + b1 : 0, v1 + a1, v1 - a1]),
        typed: { kind: 'number', value: v1 },
        solution: [...sol, `The angle is $${a1} \\times ${x} ${b1 < 0 ? '-' : '+'} ${Math.abs(b1)} = ${v1}^\\circ$`, `Answer: ${degT(v1)}`],
      };
    }
    return {
      prompt: 'The diagram shows two parallel lines.<br>Work out the value of $x$.',
      visual,
      answer: `$x = ${x}$`,
      distractors: wrongs(x, [wrongX, v1, (b2 + b1) / (a1 - a2), (180 - b1) / a1, x + 5, x - 5, x + 10, x + 2], { integer: true, near: [1, 3, 4] }).map((v) => `$x = ${v}$`),
      typed: { kind: 'number', value: x },
      solution: [...sol, `Answer: $x = ${x}$`],
    };
  }
  throw new Error('no algebra');
}, { title: 'Parallel lines with algebra', learn: ['geo-parallel-lines', 'alg-solve-brackets-both-sides'] });

/* ================================================================== */
/* geo-polygon-angles                                                  */
/* ================================================================== */

const POLY_NAMES = { 3: 'equilateral triangle', 4: 'square', 5: 'regular pentagon', 6: 'regular hexagon', 7: 'regular heptagon', 8: 'regular octagon', 9: 'regular nonagon', 10: 'regular decagon', 12: 'regular dodecagon (12 sides)' };
const polyName = (n) => POLY_NAMES[n] || `regular polygon with ${n} sides`;

/** Regular polygon figure with one exterior or interior angle marked. */
export function regularFigure(n, mark, label, { W = 360, H = 260, full = true, rot = 0 } = {}) {
  const R = Math.min(105, 330 / (2 * Math.sin(Math.PI / n)) / (n > 10 ? 1.6 : 2.4));
  const c = [W / 2 - (mark === 'ext' ? 20 : 0), H / 2 + 5];
  // bottom edge horizontal (before rotation)
  const start = -90 - 180 / n + rot;
  const V = regularPoly(n, c, Math.min(R, 110), start);
  let body = polygon(V, { fill: FILL });
  // bottom edge is V[0]->V[1] (left to right)
  const A = V[0]; const B = V[1]; const Cn = V[2];
  if (mark === 'ext') {
    const E = along(B, add(B, sub(B, A)), 70);
    body += line(...B, ...E, { width: 2, dash: '5 4' });
    body += arcLabel(B, E, Cn, label);
  } else if (mark === 'int') {
    body += arcLabel(B, A, Cn, label);
  }
  void full;
  return figure(W, H, body, { nda: true });
}

export const polyRegularAngles = ggen('geo-poly-regular-angles', 'geo-polygon-angles', (rng, d) => {
  const n = pick(rng, size(d, [5, 6, 8, 9, 10, 12], [8, 9, 10, 12, 15, 18, 20], [15, 18, 20, 24, 30, 36, 40, 45, 60, 72]));
  const ext = 360 / n; const intA = 180 - ext; const sum = (n - 2) * 180;
  const rot = pick(rng, [0, 0, 10, -10, 20, -20, 30, -30, 15, -15]);
  const ask = d === 'easy' ? pick(rng, ['ext', 'int']) : pick(rng, ['ext', 'int', 'int', 'sum']);
  const name = polyName(n);
  const showDiagram = n <= 12;
  const val = ask === 'ext' ? ext : ask === 'int' ? intA : sum;
  const prompt = ask === 'sum' ? `Work out the <b>sum</b> of the interior angles of a ${name.replace('regular ', '')}.`
    : `${showDiagram ? `The diagram shows a ${name}.` : `A regular polygon has ${n} sides.`}<br>Work out the size of ${ask === 'ext' ? 'one <b>exterior</b>' : 'one <b>interior</b>'} angle${showDiagram ? ' $x$' : ''}.`;
  const sol = ask === 'ext' ? ['The exterior angles of any polygon add up to $360^\\circ$.', `A regular polygon has ${n} equal exterior angles: $360 \\div ${n} = ${ext}^\\circ$`]
    : ask === 'int' ? [`Each exterior angle is $360 \\div ${n} = ${ext}^\\circ$.`, `Interior and exterior angles make a straight line: $180 - ${ext} = ${intA}^\\circ$`]
      : ['A polygon with $n$ sides can be split into $n - 2$ triangles.', `Sum $= (${n} - 2) \\times 180 = ${n - 2} \\times 180 = ${tnum(sum)}^\\circ$`];
  const ds = ask === 'ext' ? [intA, 180 / n, sum / n === intA ? 0 : sum, 360 - ext, ext * 2] : ask === 'int' ? [ext, sum, 360 / n * 2, 180 - 180 / n, (n * 180) / n === 180 ? 0 : 0, 360 - intA, intA + 10] : [n * 180, (n - 1) * 180, 360, sum + 360, (n - 3) * 180, intA];
  return {
    prompt,
    visual: ask !== 'sum' && showDiagram ? regularFigure(n, ask, 'x', { rot }) : undefined,
    answer: degT(val),
    distractors: wrongs(val, ds, { min: 0, max: 100000, integer: true, near: [10, 20, 30] }).map(degT),
    typed: { kind: 'number', value: val },
    solution: [...sol, `Answer: ${degT(val)}`],
  };
}, { title: 'Interior and exterior angles of regular polygons' });

export const polySidesFromAngle = ggen('geo-poly-sides', 'geo-polygon-angles', (rng, d) => {
  const n = pick(rng, size(d, [5, 6, 8, 9, 10, 12, 15, 18, 20], [8, 9, 10, 12, 15, 18, 20, 24, 30, 36], [15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90]));
  const ext = 360 / n; const intA = 180 - ext;
  if (d === 'hard' && chance(rng, 0.35)) {
    // interior angle is k times the exterior angle
    const k = intA / ext;
    if (!Number.isInteger(k)) throw new Error('not a multiple');
    return {
      prompt: `For a regular polygon, each interior angle is <b>${k} times</b> the size of each exterior angle.<br>How many sides does the polygon have?`,
      answer: `$${n}$`,
      distractors: wrongs(n, [k, k + 1, 180 / (k + 1), 2 * k, 2 * k + 1, n + 2, n - 2], { min: 2, integer: true }).map((v) => `$${v}$`),
      typed: { kind: 'number', value: n },
      solution: [
        'An interior angle and an exterior angle make a straight line: interior + exterior $= 180^\\circ$.',
        `So $${k}e + e = 180$, giving $${k + 1}e = 180$ and $e = ${ext}^\\circ$.`,
        `Exterior angles add up to $360^\\circ$: number of sides $= 360 \\div ${ext} = ${n}$`,
        `Answer: $${n}$`,
      ],
    };
  }
  const fromInt = ext < 12 ? true : d === 'easy' ? false : d === 'medium' ? chance(rng, 0.5) : chance(rng, 0.85);
  const given = fromInt ? intA : ext;
  const W = 380; const H = 210;
  // Part of the polygon: a horizontal bottom edge with sides rising on both ends (like the papers).
  const per = n <= 6 ? 1 : 2;
  const L = Math.min((n > 20 ? 92 : n > 10 ? 78 : 66) + pick(rng, [-8, -4, 0, 4, 8]), (W - 30) / (1 + 2 * per * Math.max(0.5, Math.cos((ext * Math.PI) / 180))));
  const yb = H - 30;
  const A = [W / 2 - L / 2, yb]; const B = [W / 2 + L / 2, yb];
  const left = [A]; const right = [B];
  for (let i = 1; i <= per; i += 1) {
    left.push(polar(left[i - 1], L, 180 - i * ext));
    right.push(polar(right[i - 1], L, i * ext));
  }
  let body = line(...A, ...B, { width: 2.2 });
  for (let i = 0; i < per; i += 1) body += line(...left[i], ...left[i + 1], { width: 2.2 }) + line(...right[i], ...right[i + 1], { width: 2.2 });
  if (fromInt) body += arcLabel(A, B, left[1], degS(intA));
  else {
    const E = [A[0] - 70, yb];
    body += line(...A, ...E, { width: 1.6, dash: '5 4' }) + arcLabel(A, E, left[1], degS(ext), { r: ext < 30 ? 40 : 28 });
  }
  const ds = fromInt ? [360 / intA, 180 / ext, intA / 10, n + 1, n - 1, n + 2, n * 2, 360 / (intA / 2)] : [180 / ext, 360 / (180 - ext), n + 1, n - 1, n * 2, n + 2, ext / 2];
  return {
    prompt: `Part of a regular polygon is shown.<br>Each ${fromInt ? '<b>interior</b>' : '<b>exterior</b>'} angle is ${degT(given)}.<br>How many sides does the polygon have?`,
    visual: figure(W, H, body, { nda: true }),
    answer: `$${n}$`,
    distractors: wrongs(n, ds, { min: 2, integer: true }).map((v) => `$${v}$`),
    typed: { kind: 'number', value: n },
    solution: fromInt ? [
      `Each exterior angle is $180 - ${intA} = ${ext}^\\circ$.`,
      'The exterior angles add up to $360^\\circ$.',
      `Number of sides $= 360 \\div ${ext} = ${n}$`,
      `Answer: $${n}$`,
    ] : [
      'The exterior angles of a polygon add up to $360^\\circ$.',
      `Number of sides $= 360 \\div ${ext} = ${n}$`,
      `Answer: $${n}$`,
    ],
  };
}, { title: 'Number of sides from an angle' });

export const polyMissingAngle = ggen('geo-poly-missing', 'geo-polygon-angles', (rng, d) => {
  const n = d === 'easy' ? 5 : pick(rng, d === 'medium' ? [5, 6] : [5, 6]);
  const sum = (n - 2) * 180;
  const W = 420; const H = 280;
  let angs; let labels; let x; let sol; let ds; let answerT; let typedV;
  if (d === 'hard') {
    for (let t = 0; t < 400 && !angs; t += 1) {
      const xv = int(rng, 15, 45);
      const forms = Array.from({ length: n }, (_, i) => (i < 3 ? [pick(rng, [1, 2, 3, 4]), pick(rng, [0, 0, 10, 20, -10, 30])] : [0, 0]));
      const knownCount = n - 3;
      const rem = sum - forms.slice(0, 3).reduce((s, [a, b]) => s + a * xv + b, 0);
      if (rem < knownCount * 100 || rem > knownCount * 160 || rem % 5) continue;
      const knownVals = partition(rng, rem, knownCount, { lo: 95, hi: 165, step: 5 });
      const vals = forms.map(([a, b], i) => (i < 3 ? a * xv + b : knownVals[i - 3]));
      if (vals.some((v) => !(v >= 70 && v <= 170))) continue;
      const order = shuffle(rng, vals.map((_, i) => i));
      angs = order.map((i) => vals[i]);
      labels = order.map((i) => (i < 3 ? exS(...forms[i]) : degS(vals[i])));
      const SA = forms.slice(0, 3).reduce((s, f) => s + f[0], 0); const SB = forms.slice(0, 3).reduce((s, f) => s + f[1], 0);
      const K = knownVals.reduce((s, v) => s + v, 0);
      x = xv; typedV = xv; answerT = `$x = ${xv}$`;
      sol = [`A ${n === 5 ? 'pentagon' : 'hexagon'} has interior angles adding up to $(${n} - 2) \\times 180 = ${sum}^\\circ$.`, `$${forms.slice(0, 3).map((f) => ex(...f)).join(' + ')} + ${sumT(knownVals)} = ${sum}$`, `$${collectT(SA, SB + K, sum)}$`, `$${divT(SA, sum - SB - K)}$`];
      ds = [(360 - SB - K) / SA, ((n - 1) * 180 - SB - K) / SA, (n * 180 - SB - K) / SA, vals[0], xv + 5, xv - 5, xv + 10];
    }
    if (!angs) throw new Error('no hard polygon');
    ds = wrongs(x, ds, { integer: true, near: [2, 3] }).map((v) => `$x = ${v}$`);
  } else {
    angs = partition(rng, sum, n, { lo: n === 5 ? 85 : 100, hi: 165, step: d === 'easy' ? 5 : 1 });
    const xi = int(rng, 0, n - 1); x = angs[xi];
    labels = angs.map((v, i) => (i === xi ? 'x' : degS(v)));
    const known = angs.filter((_, i) => i !== xi); const K = known.reduce((s, v) => s + v, 0);
    typedV = x; answerT = degT(x);
    sol = [`A ${n === 5 ? 'pentagon' : 'hexagon'} can be split into ${n - 2} triangles, so its interior angles add up to $${n - 2} \\times 180 = ${sum}^\\circ$.`, `The known angles add up to $${sumT(known)} = ${K}^\\circ$.`, `$x = ${sum} - ${K} = ${x}^\\circ$`];
    ds = angleWrongs(x, [(n - 1) * 180 - K, n * 180 - K, 360 - K + 360 * 0, (n - 3) * 180 - K + 360, K - 360, 180 - (K % 180)]);
  }
  const pts = polyFromAngles(angs, rng);
  const V = place(pts, { width: W, height: H, pad: 40 }).P;
  let body = polygon(V, { fill: FILL });
  V.forEach((P, i) => { body += arcLabel(P, V[(i + n - 1) % n], V[(i + 1) % n], labels[i], { r: 20 }); });
  return {
    prompt: `The diagram shows a ${n === 5 ? 'pentagon' : 'hexagon'}.<br>Work out the ${d === 'hard' ? 'value of $x$' : 'size of angle $x$'}.`,
    visual: figure(W, H, body, { nda: true }),
    answer: answerT,
    distractors: ds,
    typed: { kind: 'number', value: typedV },
    solution: [...sol, `Answer: ${answerT}`],
  };
}, { title: 'Missing angle in a polygon' });

/** Regular polygon in maths coords built on edge A->B, lying to the left of the direction A->B. */
function regularOnEdge(A, B, n) {
  const pts = [A, B];
  let dirv = sub(B, A); const L = Math.hypot(...dirv); let ang = Math.atan2(dirv[1], dirv[0]);
  for (let i = 2; i < n; i += 1) {
    ang += (2 * Math.PI) / n;
    const prev = pts[pts.length - 1];
    pts.push([prev[0] + L * Math.cos(ang), prev[1] + L * Math.sin(ang)]);
  }
  void dirv;
  return pts;
}

export const polyComposite = ggen('geo-poly-composite', 'geo-polygon-angles', (rng, d) => {
  const mode = d === 'easy' ? 'twoPolys' : pick(rng, ['twoPolys', 'diagonal']);
  const W = 420; const H = 270;
  if (mode === 'twoPolys') {
    const pairs = [[4, 6], [4, 8], [5, 6], [6, 8], [5, 8], [5, 5], [4, 5], [6, 6], [8, 8], [5, 10], [6, 12], [3, 12], [8, 10]];
    const [n1, n2] = pick(rng, d === 'easy' ? [[4, 6], [4, 8], [6, 6], [6, 8], [8, 8], [4, 5], [5, 6], [5, 5], [4, 10], [6, 12], [3, 12]] : pairs);
    const i1 = 180 - 360 / n1; const i2 = 180 - 360 / n2;
    const x = 360 - i1 - i2;
    // shared edge S=(0,0) -> T=(0,1). Poly 1 to the left of S->T... regularOnEdge puts polygon left of direction.
    const S = [0, 0]; const T = [0, 1];
    const p1 = regularOnEdge(S, T, n1).map((p) => [-p[0], p[1]]); // mirror to put it left... ensure on left side (x<0)
    const p2raw = regularOnEdge(T, S, n2); // left of T->S (downward) is +x side
    const side1 = p1.reduce((s, p) => s + p[0], 0) < 0 ? p1 : p1.map((p) => [-p[0], p[1]]);
    const side2 = p2raw.reduce((s, p) => s + p[0], 0) > 0 ? p2raw : p2raw.map((p) => [-p[0], p[1]]);
    const rotA = (pick(rng, [0, 0, 15, -15, 30, -30, 45, 90, -60]) * Math.PI) / 180;
    const rotP = (p) => [p[0] * Math.cos(rotA) - p[1] * Math.sin(rotA), p[0] * Math.sin(rotA) + p[1] * Math.cos(rotA)];
    side1.splice(0, side1.length, ...side1.map(rotP)); side2.splice(0, side2.length, ...side2.map(rotP));
    const all = [...side1, ...side2];
    const pl = place(all, { width: W, height: H, pad: 34 });
    const V1 = side1.map(pl.map); const V2 = side2.map(pl.map);
    let body = polygon(V1, { fill: FILL }) + polygon(V2, { fill: 'var(--d-fill2, #fde9d9)' });
    const sS = pl.map(rotP(S));
    // neighbours of S in each polygon (not T)
    const nb = (V, sm) => { const tS = pl.map(rotP(T)); const cand = V.filter((p) => Math.hypot(p[0] - sm[0], p[1] - sm[1]) > 1 && Math.hypot(p[0] - tS[0], p[1] - tS[1]) > 1); return cand.sort((a, b) => Math.hypot(a[0] - sm[0], a[1] - sm[1]) - Math.hypot(b[0] - sm[0], b[1] - sm[1]))[0]; };
    const a1 = nb(V1, sS); const a2 = nb(V2, sS);
    body += arcLabel(sS, a1, a2, 'x', { reflex: x > 180 });
    return {
      prompt: `${n1 === n2 ? `The diagram shows two ${polyName(n1).replace(/(\w+)$/, '$1s').replace('(12 sides)s', 's (12 sides)')}` : `The diagram shows a ${polyName(n1)} and a ${polyName(n2)}`} that share a side.<br>Work out the size of angle $x$.`,
      visual: figure(W, H, body, { nda: true }),
      answer: degT(x),
      distractors: angleWrongs(x, [180 - x, 360 - (360 / n1) - (360 / n2), 360 / n1 + 360 / n2, i1 + i2 - 180, 360 - i1 - i2 - 30, 180 - i1 + 180 - i2]),
      typed: { kind: 'number', value: x },
      solution: [
        ...(n1 === n2 ? [`Each interior angle of a ${polyName(n1)} is $180 - 360 \\div ${n1} = ${i1}^\\circ$, and there is one from each polygon at the point.`] : [
          `Interior angle of the ${polyName(n1)}: $180 - 360 \\div ${n1} = ${i1}^\\circ$.`,
          `Interior angle of the ${polyName(n2)}: $180 - 360 \\div ${n2} = ${i2}^\\circ$.`]),
        `Angles around a point add up to $360^\\circ$: $x = 360 - ${i1} - ${i2} = ${x}^\\circ$`,
        `Answer: ${degT(x)}`,
      ],
    };
  }
  // diagonal in a regular polygon: triangle of three consecutive vertices
  const n = pick(rng, [5, 6, 9, 10, 12, 15]);
  const intA = 180 - 360 / n; const base = (180 - intA) / 2;
  const c = [W / 2, H / 2]; const R = 100;
  const V = regularPoly(n, c, R, -90 - 180 / n + pick(rng, [0, 0, 12, -12, 24, -24, 36]));
  const A = V[0]; const B = V[1]; const C = V[2]; const Dv = V[3];
  const ask = pick(rng, ['base', 'rest']);
  let body = polygon(V, { fill: FILL }) + line(...A, ...C, { width: 2 });
  const x = ask === 'base' ? base : intA - base;
  body += ask === 'base' ? arcLabel(C, A, B, 'x') : arcLabel(C, A, Dv, 'x');
  body += pointLabel(A, 'A', c) + pointLabel(B, 'B', c) + pointLabel(C, 'C', c) + pointLabel(Dv, 'D', c);
  return {
    prompt: `$ABCD$… is a ${polyName(n)}. $AC$ is a diagonal.<br>Work out the size of angle $x$.`,
    visual: figure(W, H, body, { nda: true }),
    answer: degT(x),
    distractors: angleWrongs(x, ask === 'base' ? [intA, 360 / n, 180 - intA, intA / 2, 90 - base] : [base, intA, 360 / n, intA - 360 / n === x ? 0 : intA - 360 / n, 180 - base]),
    typed: { kind: 'number', value: x },
    solution: [
      `Each interior angle of a ${polyName(n)} is $180 - 360 \\div ${n} = ${intA}^\\circ$, so angle $ABC = ${intA}^\\circ$.`,
      `$AB = BC$, so triangle $ABC$ is isosceles: angle $BCA = (180 - ${intA}) \\div 2 = ${base}^\\circ$.`,
      ...(ask === 'rest' ? [`Angle $ACD = ${intA} - ${base} = ${x}^\\circ$`] : []),
      `Answer: ${degT(x)}`,
    ],
  };
}, { title: 'Regular polygons combined', learn: ['geo-polygon-angles', 'geo-angles-triangles'] });

/* ================================================================== */
/* geo-bearings                                                        */
/* ================================================================== */

const COMPASS = { North: 0, 'North-East': 45, East: 90, 'South-East': 135, South: 180, 'South-West': 225, West: 270, 'North-West': 315 };
const bearingOf = (from, to) => ((Math.round((Math.atan2(to[0] - from[0], -(to[1] - from[1])) * 180) / Math.PI) % 360) + 360) % 360;
const back = (b) => (b + 180) % 360;
const bWrongs = (ans, list) => wrongs(ans, list.map((v) => ((v % 360) + 360) % 360), { min: -1, max: 359, integer: true, exclusiveMin: true, near: [90, 180, 10, 45] }).filter((v) => v !== ans).map(bearingT);

function compassRose(c, R = 55) {
  let out = '';
  for (const [nm, b] of Object.entries(COMPASS)) {
    const P = polar(c, b % 90 === 0 ? R : R * 0.7, 90 - b);
    out += line(...c, ...P, { width: b % 90 === 0 ? 1.8 : 1, color: b % 90 === 0 ? 'currentColor' : MUTED });
    if (b % 90 === 0) out += text(...polar(c, R + 13, 90 - b), nm[0], { size: 14, bold: true });
  }
  return out;
}

export const bearingCompass = ggen('geo-bear-compass', 'geo-bearings', (rng, d) => {
  const names = d === 'easy' ? ['East', 'South', 'West', 'North-East', 'South-East', 'South-West', 'North-West'] : Object.keys(COMPASS);
  const dir = pick(rng, names);
  const reverse = d !== 'easy' && chance(rng, d === 'hard' ? 0.75 : 0.5);
  const [P1, P2] = pick(rng, [['A', 'B'], ['P', 'Q'], ['C', 'D'], ['X', 'Y']]);
  const b = COMPASS[dir];
  const ans = reverse ? back(b) : b;
  const ansWrong = [360 - ans, reverse ? b : back(b), ans + 90, ans - 90, 360 - b];
  const W = 300; const H = 200; const c = [150, 100];
  const visual = figure(W, H, compassRose(c, 62));
  const article = /^[AEIOU]/.test(dir) ? 'due' : 'due';
  const where = dir.includes('-') ? dir : `${article} ${dir}`;
  return {
    prompt: reverse ? `$${P2}$ is ${where} of $${P1}$.<br>Work out the bearing of $${P1}$ from $${P2}$.` : `$${P2}$ is ${where} of $${P1}$.<br>Write down the bearing of $${P2}$ from $${P1}$.`,
    visual,
    answer: bearingT(ans),
    distractors: bWrongs(ans, ansWrong),
    typed: { kind: 'number', value: ans },
    solution: reverse ? [
      `Bearings are measured clockwise from North and written with three figures.`,
      `The bearing of $${P2}$ from $${P1}$ is ${bearingT(b)}.`,
      `Going back the other way, add or subtract $180^\\circ$: $${b} ${b < 180 ? '+' : '-'} 180 = ${ans}$.`,
      `Answer: ${bearingT(ans)}`,
    ] : [
      'Bearings are measured clockwise from North and written with three figures.',
      `${dir} is ${b === 0 ? '$0^\\circ$' : `$${b}^\\circ$ clockwise from North`}.`,
      `Answer: ${bearingT(ans)}`,
    ],
  };
}, { title: 'Compass directions as bearings' });

export const bearingRead = ggen('geo-bear-read', 'geo-bearings', (rng, d) => {
  const W = 380; const H = 300;
  const A = [W / 2, H / 2 + 10];
  if (d === 'hard') {
    // bearing of B given (< 180), angle BAC given, C further clockwise
    const bB = 5 * int(rng, 6, 30); const ang = 5 * int(rng, 8, 24);
    const bC = bB + ang;
    if (bC >= 345 || bC < 190) throw new Error('range');
    const B = polar(A, 115, 90 - bB); const C = polar(A, 115, 90 - bC);
    let body = northLine(A, 105) + line(...A, ...B, { width: 2 }) + line(...A, ...C, { width: 2 });
    body += arcLabel(A, [A[0], A[1] - 50], B, degS(bB), { r: 24 }) + arcLabel(A, B, C, degS(ang), { r: 34 });
    body += dot(...B) + dot(...C) + dot(...A) + pointLabel(B, 'B', A, 14) + pointLabel(C, 'C', A, 14) + labelAt(A, 'A', 180, 14, { italic: true });
    return {
      prompt: 'Work out the bearing of $C$ from $A$.',
      visual: figure(W, H, body, { nda: true }),
      answer: bearingT(bC),
      distractors: bWrongs(bC, [360 - bC, ang - bB > 0 ? ang - bB : 0, bB + 180 - ang, 180 - bB + ang, back(bC), bC - 2 * ang + 360]),
      typed: { kind: 'number', value: bC },
      solution: [
        'A bearing is the angle measured <b>clockwise from North</b>.',
        `From North clockwise to $B$ is $${bB}^\\circ$, then a further $${ang}^\\circ$ to $C$.`,
        `$${bB} + ${ang} = ${bC}$`,
        `Answer: ${bearingT(bC)}`,
      ],
    };
  }
  const b = d === 'easy' ? 5 * int(rng, 4, 34) : pick(rng, [int(rng, 190, 345), int(rng, 100, 170)]);
  const B = polar(A, 120, 90 - b);
  const anti = b > 180;
  let body = northLine(A, 105) + line(...A, ...B, { width: 2 });
  body += arcLabel(A, [A[0], A[1] - 50], B, degS(anti ? 360 - b : b), { r: 26 });
  body += dot(...A) + dot(...B) + pointLabel(B, 'B', A, 14) + labelAt(A, 'A', anti ? 0 : 180, 14, { italic: true });
  return {
    prompt: `Work out the bearing of $B$ from $A$.`,
    visual: figure(W, H, body, { nda: true }),
    answer: bearingT(b),
    distractors: bWrongs(b, anti ? [360 - b, back(b), 180 - (360 - b) > 0 ? 180 - (360 - b) : 0, 270 - (360 - b), b - 90] : [360 - b, back(b), 180 - b, b + 90, 90 - b > 0 ? 90 - b : 0]),
    typed: { kind: 'number', value: b },
    solution: anti ? [
      'A bearing is measured <b>clockwise from North</b>.',
      `The diagram shows the angle going <b>anticlockwise</b> from North: $${360 - b}^\\circ$.`,
      `Clockwise angle $= 360 - ${360 - b} = ${b}^\\circ$`,
      `Answer: ${bearingT(b)}`,
    ] : [
      'A bearing is measured <b>clockwise from North</b> and written with three figures.',
      `The marked angle is clockwise from North: $${b}^\\circ$.`,
      `Answer: ${bearingT(b)}`,
    ],
  };
}, { title: 'Read a bearing from a diagram' });

export const bearingBack = ggen('geo-bear-back', 'geo-bearings', (rng, d) => {
  const b = d === 'easy' ? 5 * int(rng, 6, 30) : d === 'medium' ? pick(rng, [int(rng, 28, 152), int(rng, 208, 332)]) : int(rng, 208, 332);
  if (b === 180 || Math.abs((b % 180) - 90) < 4) throw new Error('axis');
  const ans = back(b);
  const W = 400; const H = 310;
  const dirv = polar([0, 0], 1, 90 - b);
  const span = Math.min(230, 170 / Math.max(0.01, Math.abs(dirv[1])), (W - 90) / Math.max(0.01, Math.abs(dirv[0])));
  const top = 100 + (170 - span * Math.abs(dirv[1])) / 2;
  const A = [W / 2 - (dirv[0] * span) / 2, dirv[1] > 0 ? top : top + span * Math.abs(dirv[1])];
  const B = add(A, scale(dirv, span));
  let body = northLine(A, 72) + northLine(B, 72) + line(...A, ...B, { width: 2 });
  const hard = d === 'hard';
  // easy/medium: the bearing is given in words and marked; hard: only the anticlockwise angle at A is marked
  body += arcLabel(A, [A[0], A[1] - 40], B, degS(b > 180 ? 360 - b : b), { r: 24 });
  body += dot(...A) + dot(...B) + labelAt(A, 'A', dirv[0] > 0 ? 180 : 0, 14, { italic: true }) + labelAt(B, 'B', dirv[0] > 0 ? 0 : 180, 14, { italic: true });
  return {
    prompt: hard ? 'The diagram shows the positions of $A$ and $B$.<br>Work out the bearing of $A$ from $B$.' : `The bearing of $B$ from $A$ is ${bearingT(b)}.<br>Work out the bearing of $A$ from $B$.`,
    visual: figure(W, H, body, { nda: true }),
    answer: bearingT(ans),
    distractors: bWrongs(ans, hard ? [360 - b, 180 - (360 - b), 360 - b + 180, b, (360 - b) + 90] : [360 - b, b, 180 - b, b + 90, 360 - ans, ans + 90]),
    typed: { kind: 'number', value: ans },
    solution: [
      ...(hard ? [`The marked angle at $A$ is measured anticlockwise from North, so the bearing of $B$ from $A$ is $360 - ${360 - b} = ${b}^\\circ$.`] : []),
      'The two North lines are [[geo-parallel-lines|parallel]], so the bearing back the other way differs by exactly $180^\\circ$.',
      `$${b} ${b < 180 ? '+' : '-'} 180 = ${ans}$`,
      `Answer: ${bearingT(ans)}`,
    ],
  };
}, { title: 'Back bearings' });

export const bearingProblem = ggen('geo-bear-problem', 'geo-bearings', (rng, d) => {
  const W = 420; const H = 300;
  const mode = d === 'easy' ? 'square' : d === 'medium' ? pick(rng, ['square', 'equi', 'angle']) : pick(rng, ['equi', 'angle', 'angle']);
  if (mode === 'square') {
    // B is d km due (S/N) of A and d km due (W/E) of C.
    const dist = int(rng, 3, 12);
    const ns = pick(rng, ['South', 'North']); const ew = pick(rng, ['West', 'East']);
    const B = [W / 2, ns === 'South' ? H / 2 + 55 : H / 2 - 30];
    const A = [B[0], B[1] + (ns === 'South' ? -110 : 110)]; // B is south of A => A is north of B
    const C = [B[0] + (ew === 'West' ? 110 : -110), B[1]];
    const ask = pick(rng, [['A', 'C'], ['C', 'A']]);
    const pts = { A, B, C };
    const ans = bearingOf(pts[ask[1]], pts[ask[0]]);
    let body = line(...A, ...B, { width: 2 }) + line(...B, ...C, { width: 2 }) + line(...A, ...C, { width: 1.6, dash: '6 5' });
    body += rightMark(B, A, C, 12) + dot(...A) + dot(...B) + dot(...C);
    if (!(ask[1] === 'A' && ns === 'North')) body += northLine(pts[ask[1]], 60);
    const cen = centroid([A, B, C]);
    const sx = ew === 'West' ? -1 : 1;
    body += text(A[0] + 16 * sx, A[1] + 4, 'A', { size: 15, italic: true }) + text(B[0] + 15 * sx, B[1] + (ns === 'South' ? 14 : -14), 'B', { size: 15, italic: true }) + text(C[0] - 16 * sx, C[1], 'C', { size: 15, italic: true });
    body += text(...add(mid(A, B), [ew === 'West' ? -28 : 28, 0]), `${dist} km`, { size: 13 }) + text(...add(mid(B, C), [0, ns === 'South' ? 16 : -16]), `${dist} km`, { size: 13 });
    return {
      prompt: `$B$ is ${dist} km due ${ns} of $A$ and ${dist} km due ${ew} of $C$.<br>Work out the bearing of $${ask[0]}$ from $${ask[1]}$.`,
      visual: figure(W, H, body, { nda: true }),
      answer: bearingT(ans),
      distractors: bWrongs(ans, [back(ans), 360 - ans, ans + 90, ans - 90, 45, ans + 45]),
      typed: { kind: 'number', value: ans },
      solution: [
        `Triangle $ABC$ has a right angle at $B$ and two equal sides of ${dist} km, so its other two angles are each $45^\\circ$.`,
        `From $${ask[1]}$, $${ask[0]}$ is exactly ${['North-East', 'South-East', 'South-West', 'North-West'][[45, 135, 225, 315].indexOf(ans)]}.`,
        'Measure clockwise from North at ' + `$${ask[1]}$: ${bearingT(ans)}.`,
        `Answer: ${bearingT(ans)}`,
      ],
    };
  }
  if (mode === 'equi') {
    // Equilateral triangle ABC; bearing of B from A is p; C on the left of A->B.
    const p = pick(rng, [90, 90, 70, 75, 80, 85, 95, 100, 105, 110, 115]);
    const A = [0, 0]; const dirv = polar([0, 0], 1, 90 - p);
    const B = scale(dirv, 1);
    const C = add(A, polar([0, 0], 1, 90 - p + 60)); // rotate anticlockwise (screen up) by 60
    const pts = { A, B, C };
    const pairs = [['C', 'A'], ['C', 'B'], ['A', 'C'], ['B', 'C']];
    const [to, from] = pick(rng, pairs);
    const ans = bearingOf(pts[from], pts[to]);
    const pl = place([A, B, C].map((q) => [q[0], -q[1]]), { width: W, height: H, pad: 60, padTop: 95 });
    const sA = pl.map([A[0], -A[1]]); const sB = pl.map([B[0], -B[1]]); const sC = pl.map([C[0], -C[1]]);
    const sp = { A: sA, B: sB, C: sC };
    let body = polygon([sA, sB, sC], { fill: FILL }) + northLine(sA, 55) + northLine(sp[from] === sA ? sB : sp[from], 55);
    const cen = centroid([sA, sB, sC]);
    body += pointLabel(sA, 'A', cen, 16) + pointLabel(sB, 'B', cen, 16) + (from === 'C' ? text(sC[0] + 16, sC[1] + 6, 'C', { size: 15, italic: true }) : pointLabel(sC, 'C', cen, 16));
    body += equalTicks(sA, sB) + equalTicks(sB, sC) + equalTicks(sC, sA);
    return {
      prompt: `$ABC$ is an equilateral triangle, as shown in the diagram.<br>The bearing of $B$ from $A$ is ${bearingT(p)}.<br>Work out the bearing of $${to}$ from $${from}$.`,
      visual: figure(W, H, body, { nda: true }),
      answer: bearingT(ans),
      distractors: bWrongs(ans, [back(ans), 360 - ans, ans + 60, ans - 60, p, ans + 120]),
      typed: { kind: 'number', value: ans },
      solution: [
        'Each angle in an equilateral triangle is $60^\\circ$.',
        ...(from === 'A' || (to === 'A' && from === 'C') ? [`At $A$, $C$ is $60^\\circ$ anticlockwise from $B$, so the bearing of $C$ from $A$ is $${p} - 60 = ${p - 60}^\\circ$.`] : []),
        ...(to === 'A' && from === 'C' ? [`Going back the other way adds $180^\\circ$: $${p - 60} + 180 = ${p + 120}^\\circ$.`] : []),
        ...(from === 'B' || (to === 'B' && from === 'C') ? [`The bearing of $A$ from $B$ is $${p} + 180 = ${p + 180}^\\circ$. At $B$, $C$ is $60^\\circ$ clockwise from $A$: $${p + 180} + 60 = ${p + 240}^\\circ$${p + 240 >= 360 ? `, and subtract 360 because a bearing must be less than $360^\\circ$: $${p + 240 - 360}^\\circ$` : ''}.`] : []),
        ...(to === 'B' && from === 'C' ? [`That is the bearing of $C$ from $B$; going back the other way subtracts $180^\\circ$: $${p + 60}^\\circ$.`] : []),
        `Answer: ${bearingT(ans)}`,
      ],
    };
  }
  // angle: bearing of B from A is p, bearing of C from B is q. Work out angle ABC.
  for (let t = 0; t < 200; t += 1) {
    const p = int(rng, 30, 150); const q = int(rng, 150, 300);
    const ba = back(p);
    let ang = Math.abs(q - ba); if (ang > 180) ang = 360 - ang;
    if (ang < 35 || ang > 150) continue;
    const A = [0, 0]; const B = polar([0, 0], 1, 90 - p); const C = add(B, polar([0, 0], 0.9, 90 - q));
    const pl = place([A, B, C].map((v) => [v[0], -v[1]]), { width: W, height: H, pad: 60, padTop: 95 });
    const [sA, sB, sC] = [A, B, C].map((v) => pl.map([v[0], -v[1]]));
    let body = line(...sA, ...sB, { width: 2 }) + line(...sB, ...sC, { width: 2 }) + northLine(sA, 60) + northLine(sB, 60);
    body += arcLabel(sA, [sA[0], sA[1] - 30], sB, degS(p), { r: 22 });
    body += arcLabel(sB, sA, sC, 'x', { r: 24 });
    body += dot(...sA) + dot(...sB) + dot(...sC);
    const cen = centroid([sA, sB, sC]);
    body += text(sA[0] + (sB[0] > sA[0] ? -14 : 14), sA[1] + 6, 'A', { size: 15, italic: true }) + pointLabel(sB, 'B', add(sB, add(unit(sub(sA, sB)), unit(sub(sC, sB)))), 18) + pointLabel(sC, 'C', cen, 16);
    return {
      prompt: `The bearing of $B$ from $A$ is ${bearingT(p)}.<br>The bearing of $C$ from $B$ is ${bearingT(q)}.<br>Work out the size of angle $ABC$, marked $x$.`,
      visual: figure(W, H, body, { nda: true }),
      answer: degT(ang),
      distractors: angleWrongs(ang, [Math.abs(q - p), 180 - ang, 360 - q - p > 0 ? 360 - q - p : 0, q - 180, 180 - p, Math.abs(q - p - 90)]),
      typed: { kind: 'number', value: ang },
      solution: [
        `The bearing of $A$ from $B$ is $${p} + 180 = ${ba}^\\circ$ (the North lines are parallel).`,
        `Angle $ABC$ is the difference between the bearings of $A$ and $C$ from $B$: $|${q} - ${ba}| = ${Math.abs(q - ba)}^\\circ$${Math.abs(q - ba) > 180 ? `, so the angle inside the triangle is $360 - ${Math.abs(q - ba)} = ${ang}^\\circ$` : ''}.`,
        `Answer: ${degT(ang)}`,
      ],
    };
  }
  throw new Error('no bearing angle');
}, { title: 'Bearings problems', learn: ['geo-bearings', 'geo-parallel-lines'] });

export const angleGenerators = [
  angleStraightLine, angleAroundPoint, angleVertOpp, angleTypes, angleEstimate,
  triThirdAngle, triIsosceles, triExterior, quadAngles, triMultiStep,
  parallelName, parallelFind, parallelReason, parallelTriangle, parallelAlgebra,
  polyRegularAngles, polySidesFromAngle, polyMissingAngle, polyComposite,
  bearingCompass, bearingRead, bearingBack, bearingProblem,
];

void [intersect, ACCENT, textWidth, unit, mid];
