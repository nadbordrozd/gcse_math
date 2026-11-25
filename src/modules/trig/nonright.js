// Non-right-angled triangles: sine rule, cosine rule, ½ab sin C, and mixed problems.
import { gen, pick, int, shuffle, num, tnum, roundTo, chance, sample, names } from '../../core.js';
import { fig, FILL, FILL2, ACCENT } from './diagrams.js';
import { path as svgPath } from '../../svg.js';
import {
  DP1, roundingFor, L, A, At, fmtVals, sinD, cosD, asinD, acosD, approxT,
} from './helpers.js';

/* ------------------------------------------------------------------ */
/* General triangle figure                                             */
/* ------------------------------------------------------------------ */

/**
 * Triangle with vertices named n[0], n[1], n[2] (default A, B, C) with angles angs (degrees) at those vertices,
 * drawn to shape. sides: { 'AB': label, ... } using the vertex names; angles: { A: label }.
 */
export function triFig({ angs, n = ['A', 'B', 'C'], sides = {}, angles = {}, rotate = 0, flip = false, showNames = true, width = 360, height = 230 }) {
  const [a0, b0] = angs;
  // side opposite vertex 2 (between vertex 0 and 1) has length 1
  const c = 1; const b = (c * sinD(angs[1])) / sinD(angs[2]); // side from vertex 0 to vertex 2
  const P0 = [0, 0]; const P1 = [c, 0]; const P2 = [b * cosD(a0), b * sinD(a0)];
  void b0;
  const pts = { [n[0]]: P0, [n[1]]: P1, [n[2]]: P2 };
  return fig({
    pts, rotate, flip, width, height, pad: 40,
    draw: (g) => {
      let out = g.poly(n);
      for (const [v, lab] of Object.entries(angles)) {
        if (lab === null || lab === undefined) continue;
        const i = n.indexOf(v);
        out += g.angle(v, n[(i + 1) % 3], n[(i + 2) % 3], lab);
      }
      for (const [s, lab] of Object.entries(sides)) if (lab) out += g.side(s[0], s[1], lab);
      if (showNames) out += g.polyNames(n);
      return out;
    },
  });
}

/** Random triangle letters. */
const LETTER_SETS = [['A', 'B', 'C'], ['P', 'Q', 'R'], ['X', 'Y', 'Z'], ['L', 'M', 'N'], ['D', 'E', 'F']];
const orient = (rng) => ({ rotate: pick(rng, [0, 0, 0, 180, 12, -12, 165]), flip: chance(rng) });

/** Random angles (integers) for a triangle, each in [lo, hi], none equal to 90. */
function randomAngles(rng, { lo = 28, hi = 110, avoid90 = true } = {}) {
  for (;;) {
    const a = int(rng, lo, hi); const b = int(rng, lo, hi); const c = 180 - a - b;
    if (c < lo || c > hi) continue;
    if (avoid90 && [a, b, c].some((x) => Math.abs(x - 90) < 4)) continue;
    if (new Set([a, b, c]).size < 3) continue;
    return [a, b, c];
  }
}

/* ------------------------------------------------------------------ */
/* trig-sine-rule                                                      */
/* ------------------------------------------------------------------ */

export const sineSide = gen('trig-sine-side', 'trig-sine-rule', (rng, d) => {
  const [P, Q, R] = pick(rng, LETTER_SETS);
  const angs = randomAngles(rng, { lo: 30, hi: 115 });
  // Known side opposite vertex 0 (QR), unknown side opposite vertex 1 (PR).
  const known = d === 'hard' ? int(rng, 50, 250) / 10 : int(rng, 6, 25);
  const unit = pick(rng, ['cm', 'cm', 'm']);
  const a = known; const b = (a * sinD(angs[1])) / sinD(angs[0]);
  // Which angles are given? easy/medium: angles at P and Q; hard (or medium sometimes): angles at Q and R (need P = 180 - Q - R)
  const needThird = d === 'hard' || (d === 'medium' && chance(rng, 0.4));
  const angles = needThird ? { [Q]: `${angs[1]}°`, [R]: `${angs[2]}°` } : { [P]: `${angs[0]}°`, [Q]: `${angs[1]}°` };
  const r = roundingFor(rng, d);
  const f = (v) => `${r.fmt(v)} ${unit}`;
  const vis = triFig({ angs, n: [P, Q, R], sides: { [Q + R]: L(a, unit), [P + R]: 'x' }, angles, ...orient(rng) });
  const wrong = [
    (a * sinD(angs[0])) / sinD(angs[1]), // ratio upside down
    (a * sinD(angs[2])) / sinD(angs[0]), // used the wrong angle
    (a * sinD(angs[1])) / sinD(angs[2]),
    a * sinD(angs[1]),
    (a * Math.sin(angs[1])) / Math.sin(angs[0]), // radians
    needThird ? (a * sinD(angs[1])) / sinD(angs[2]) : NaN,
  ];
  return {
    prompt: `Work out the value of $x$. ${r.text}`,
    visual: vis,
    answer: f(b),
    distractors: fmtVals(wrong, f),
    typed: r.typed(b),
    calculator: true,
    hint: 'Pair each side with the angle opposite it.',
    solution: [
      ...(needThird ? [`First find angle $${P}$ (opposite the known side): angles in a triangle add up to $180^\\circ$, so $${P} = 180^\\circ - ${At(angs[1])} - ${At(angs[2])} = ${At(angs[0])}$.`] : []),
      `Sine rule – each side over the sine of its <b>opposite</b> angle: $x$ is opposite $${At(angs[1])}$ and ${L(a, unit)} is opposite $${At(angs[0])}$.`,
      `$\\frac{x}{\\sin ${At(angs[1])}} = \\frac{${tnum(a)}}{\\sin ${At(angs[0])}}$`,
      `$x = \\frac{${tnum(a)} \\times \\sin ${At(angs[1])}}{\\sin ${At(angs[0])}} = ${approxT(b)}$`,
      `Answer: <b>${f(b)}</b>`,
    ],
  };
}, { title: 'Sine rule: find a side' });

export const sineAngle = gen('trig-sine-angle', 'trig-sine-rule', (rng, d) => {
  const [P, Q, R] = pick(rng, LETTER_SETS);
  const unit = 'cm';
  // Known: side a = QR opposite angle P (given), side b = PR (b < a), find acute angle Q.
  let angP; let a; let b; let angQ;
  for (let i = 0; i < 200; i += 1) {
    angP = int(rng, 40, 115); if (angP >= 84 && angP <= 96) continue;
    a = d === 'hard' ? int(rng, 60, 200) / 10 : int(rng, 8, 25);
    b = d === 'hard' ? int(rng, 40, Math.round(a * 10) - 5) / 10 : int(rng, 5, a - 1);
    angQ = asinD((b * sinD(angP)) / a);
    if (angQ > 20 && angP + angQ < 160 && Math.abs(angQ - 90) > 5 && Math.abs(angQ - angP) > 4) break;
  }
  const angR = 180 - angP - angQ;
  const askR = d === 'hard' && chance(rng, 0.5);
  const ans = askR ? angR : angQ;
  const vis = triFig({ angs: [angP, angQ, angR], n: [P, Q, R], sides: { [Q + R]: L(a, unit), [P + R]: L(b, unit) }, angles: { [P]: `${angP}°`, [askR ? R : Q]: 'x' }, ...orient(rng) });
  const f = (v) => A(roundTo(v, 1), 1);
  const inv = (a * sinD(angP)) / b;
  const wrong = askR
    ? [angQ, 180 - angQ, 180 - angP - (180 - angQ), inv <= 1 ? 180 - angP - asinD(inv) : NaN, 180 - angP - asinD(roundTo((b * sinD(angP)) / a, 1))]
    : [180 - angQ, inv <= 1 ? asinD(inv) : NaN, angR, asinD(Math.min(1, b / a)), asinD(roundTo((b * sinD(angP)) / a, 1)), asinD(Math.min(1, (b * sinD(angP)) / (a + b)))];
  return {
    prompt: `Work out the size of angle $x$. Give your answer to 1 decimal place.`,
    visual: vis,
    answer: f(ans),
    distractors: fmtVals(wrong, f),
    typed: DP1.typed(ans),
    calculator: true,
    hint: 'Use the sine rule with the sines on top: $\\frac{\\sin A}{a} = \\frac{\\sin B}{b}$.',
    solution: [
      `Sine rule with the angles on top. ${L(b, unit)} is opposite angle $${Q}$; ${L(a, unit)} is opposite the $${At(angP)}$ angle.`,
      `$\\frac{\\sin ${Q}}{${tnum(b)}} = \\frac{\\sin ${At(angP)}}{${tnum(a)}}$, so $\\sin ${Q} = \\frac{${tnum(b)} \\times \\sin ${At(angP)}}{${tnum(a)}} = ${approxT((b * sinD(angP)) / a)}$`,
      `$${Q} = \\sin^{-1}(${approxT((b * sinD(angP)) / a)}) = ${approxT(angQ)}^\\circ$`,
      ...(askR ? [`Angles in a triangle add to $180^\\circ$: $x = 180^\\circ - ${At(angP)} - ${approxT(angQ)}^\\circ = ${approxT(angR)}^\\circ$`] : []),
      `Answer: <b>${f(ans)}</b>`,
    ],
  };
}, { title: 'Sine rule: find an angle' });

export const sineWhich = gen('trig-sine-which', 'trig-sine-rule', (rng, d) => {
  if (d === 'hard') { rng(); rng(); } // hard draws its own numbers, never a copy of easy
  const [P, Q, R] = pick(rng, LETTER_SETS);
  const angs = randomAngles(rng, { lo: 30, hi: 110 });
  const a = int(rng, 6, 30);
  const findAngle = d !== 'easy' && chance(rng, 0.5);
  const unit = 'cm';
  let vis; let ans; let ds; let sol;
  if (!findAngle) {
    vis = triFig({ angs, n: [P, Q, R], sides: { [Q + R]: L(a, unit), [P + R]: 'x' }, angles: { [P]: `${angs[0]}°`, [Q]: `${angs[1]}°` }, ...orient(rng) });
    const [p, q] = [At(angs[0]), At(angs[1])];
    ans = `$\\frac{x}{\\sin ${q}} = \\frac{${a}}{\\sin ${p}}$`;
    ds = [`$\\frac{x}{\\sin ${p}} = \\frac{${a}}{\\sin ${q}}$`, `$\\frac{x}{${a}} = \\frac{\\sin ${p}}{\\sin ${q}}$`, `$x = ${a} \\times \\sin ${q}$`, `$\\frac{\\sin ${q}}{x} = \\frac{${a}}{\\sin ${p}}$`, `$x^2 = ${a}^2 + ${a}^2 - 2 \\times ${a} \\times ${a} \\cos ${q}$`];
    sol = [`Pair each side with the angle <b>opposite</b> it: $x$ is opposite $${q}$ and ${a} cm is opposite $${p}$.`, `Sine rule: $\\frac{x}{\\sin ${q}} = \\frac{${a}}{\\sin ${p}}$`, `Answer: ${ans}`];
  } else {
    const b = Math.round((a * sinD(angs[1])) / sinD(angs[0]) * 10) / 10;
    vis = triFig({ angs, n: [P, Q, R], sides: { [Q + R]: L(a, unit), [P + R]: L(b, unit) }, angles: { [P]: `${angs[0]}°`, [Q]: 'x' }, ...orient(rng) });
    const p = At(angs[0]);
    ans = `$\\frac{\\sin x}{${tnum(b)}} = \\frac{\\sin ${p}}{${a}}$`;
    ds = [`$\\frac{\\sin x}{${a}} = \\frac{\\sin ${p}}{${tnum(b)}}$`, `$\\frac{x}{${tnum(b)}} = \\frac{${p}}{${a}}$`, `$\\sin x = \\frac{${tnum(b)}}{${a}}$`, `$\\frac{${tnum(b)}}{\\sin ${p}} = \\frac{\\sin x}{${a}}$`];
    sol = [`Pair each side with the angle opposite it: ${num(b)} cm is opposite $x$ and ${a} cm is opposite $${p}$.`, `To find an angle, put the sines on top: $\\frac{\\sin x}{${tnum(b)}} = \\frac{\\sin ${p}}{${a}}$`, `Answer: ${ans}`];
  }
  return {
    prompt: `Which equation is correct for this triangle?`,
    visual: vis,
    answer: ans,
    distractors: ds,
    solution: sol,
  };
}, { title: 'Sine rule: set up the equation (spot the mismatch)' });

/* ------------------------------------------------------------------ */
/* trig-cosine-rule                                                    */
/* ------------------------------------------------------------------ */

const NICE60 = [[3, 8, 7], [5, 8, 7], [7, 15, 13], [8, 15, 13], [5, 21, 19], [16, 21, 19], [11, 35, 31], [24, 35, 31]];
const NICE120 = [[3, 5, 7], [7, 8, 13], [5, 16, 19], [11, 24, 31], [6, 10, 14], [9, 15, 21]];

export const cosSide = gen('trig-cos-side', 'trig-cosine-rule', (rng, d) => {
  const [P, Q, R] = pick(rng, LETTER_SETS);
  const unit = pick(rng, ['cm', 'm']);
  let b; let c; let ang; let exact = false;
  if (d === 'easy' && chance(rng, 0.5)) { [b, c] = shuffle(rng, pick(rng, NICE60).slice(0, 2)); ang = 60; exact = true; }
  else if (d === 'hard') { b = int(rng, 40, 180) / 10; c = int(rng, 40, 180) / 10; ang = chance(rng, 0.6) ? int(rng, 95, 140) : int(rng, 25, 85); }
  else { b = int(rng, 5, 20); c = int(rng, 5, 20); ang = int(rng, 25, 130); if (ang === 90 || ang === 60) ang += 3; }
  if (b === c) c += 1;
  if (!exact && Math.max(b, c) > 2.2 * Math.min(b, c)) { if (b > c) b = roundTo(c * (1.3 + 0.8 * rng()), d === 'hard' ? 1 : 0); else c = roundTo(b * (1.3 + 0.8 * rng()), d === 'hard' ? 1 : 0); }
  const a2 = b * b + c * c - 2 * b * c * cosD(ang);
  const a = Math.sqrt(a2);
  const r = exact ? null : roundingFor(rng, d);
  const f = (v) => (r ? `${r.fmt(v)} ${unit}` : L(roundTo(v, 6), unit));
  // vertex P has the angle, PQ = c, PR = b, QR = a
  const angQ = asinD((b * sinD(ang)) / a); const angQf = (b * b > a * a + c * c) ? 180 - angQ : angQ;
  const angs = [ang, angQf, 180 - ang - angQf];
  const vis = triFig({ angs, n: [P, Q, R], sides: { [P + Q]: L(c, unit), [P + R]: L(b, unit), [Q + R]: 'x' }, angles: { [P]: `${ang}°` }, ...orient(rng) });
  const wrong = [a2 < 2000 ? a2 : NaN, Math.sqrt(b * b + c * c + 2 * b * c * cosD(ang)), Math.sqrt(Math.abs((b * b + c * c - 2 * b * c) * cosD(ang))), Math.sqrt(Math.abs(b * b + c * c - 2 * b * c * Math.cos(ang))), Math.hypot(b, c), Math.sqrt(Math.abs(b * b + c * c - b * c * cosD(ang)))];
  return {
    prompt: `Work out the value of $x$.${r ? ` ${r.text}` : ''}`,
    visual: vis,
    answer: f(a),
    distractors: fmtVals(exact ? wrong.filter((v) => Number.isFinite(v) && Math.abs(v - Math.round(v)) < 1e-9) : wrong, f),
    typed: r ? r.typed(a) : { kind: 'number', value: Math.round(a) },
    calculator: true,
    hint: 'Two sides and the angle between them: use the cosine rule.',
    solution: [
      `You know two sides and the angle <b>between</b> them, so use the cosine rule: $a^2 = b^2 + c^2 - 2bc\\cos A$.`,
      `$x^2 = ${tnum(b)}^2 + ${tnum(c)}^2 - 2 \\times ${tnum(b)} \\times ${tnum(c)} \\times \\cos ${At(ang)}$`,
      `$x^2 = ${tnum(roundTo(b * b + c * c, 4))} ${ang > 90 ? '+' : '-'} ${exact ? tnum(b * c) : approxT(Math.abs(2 * b * c * cosD(ang)))} = ${exact ? tnum(Math.round(a2)) : approxT(a2)}$${ang > 90 ? ' (cos of an obtuse angle is negative, so this <i>adds</i>)' : ''}`,
      `$x = \\sqrt{${exact ? tnum(Math.round(a2)) : approxT(a2)}} = ${exact ? tnum(Math.round(a)) : approxT(a)}$`,
      `Answer: <b>${f(a)}</b>`,
    ],
  };
}, { title: 'Cosine rule: find a side' });

export const cosAngle = gen('trig-cos-angle', 'trig-cosine-rule', (rng, d) => {
  const [P, Q, R] = pick(rng, LETTER_SETS);
  const unit = 'cm';
  let a; let b; let c; let ang;
  if (d === 'easy' && chance(rng, 0.5)) {
    const t = pick(rng, [...NICE60.map((x) => [...x, 60]), ...NICE120.map((x) => [...x, 120])]);
    [b, c, a, ang] = [t[0], t[1], t[2], t[3]];
  } else {
    for (let i = 0; i < 200; i += 1) {
      b = d === 'hard' ? int(rng, 40, 160) / 10 : int(rng, 4, 18); c = d === 'hard' ? int(rng, 40, 160) / 10 : int(rng, 4, 18);
      a = d === 'hard' ? int(rng, 40, 220) / 10 : int(rng, 4, 24);
      if (!(a < b + c && b < a + c && c < a + b) || b === c) continue;
      ang = acosD((b * b + c * c - a * a) / (2 * b * c));
      if (ang > 25 && ang < 150 && Math.abs(ang - 90) > 3 && (d !== 'hard' || ang > 95 || chance(rng, 0.4))) break;
    }
  }
  const cosv = (b * b + c * c - a * a) / (2 * b * c);
  const angQ = acosD((a * a + c * c - b * b) / (2 * a * c));
  const angs = [ang, angQ, 180 - ang - angQ];
  const vis = triFig({ angs, n: [P, Q, R], sides: { [P + Q]: L(c, unit), [P + R]: L(b, unit), [Q + R]: L(a, unit) }, angles: { [P]: 'x' }, ...orient(rng) });
  const f = (v) => A(roundTo(v, 1), 1);
  const wrong = [180 - ang, angQ, 180 - ang - angQ, Math.abs((b * b + c * c - a * a) / (b * c)) <= 1 ? acosD((b * b + c * c - a * a) / (b * c)) : NaN, acosD(roundTo(cosv, 1)), acosD(Math.max(-1, Math.min(1, (a * a + b * b + c * c) / (2 * b * c) - 1)))];
  return {
    prompt: 'Work out the size of angle $x$. Give your answer to 1 decimal place.',
    visual: vis,
    answer: f(ang),
    distractors: fmtVals(wrong, f),
    typed: DP1.typed(ang),
    calculator: true,
    hint: 'Three sides known: rearrange the cosine rule to $\\cos A = \\frac{b^2 + c^2 - a^2}{2bc}$.',
    solution: [
      `All three sides are known, so use the cosine rule for an angle: $\\cos A = \\frac{b^2 + c^2 - a^2}{2bc}$, where $a$ is the side <b>opposite</b> the angle (${L(a, unit)}).`,
      `$\\cos x = \\frac{${tnum(b)}^2 + ${tnum(c)}^2 - ${tnum(a)}^2}{2 \\times ${tnum(b)} \\times ${tnum(c)}} = \\frac{${tnum(roundTo(b * b + c * c - a * a, 4))}}{${tnum(roundTo(2 * b * c, 4))}} = ${approxT(cosv)}$`.replace('= -', '= -'),
      `$x = \\cos^{-1}(${cosv < 0 ? '-' : ''}${approxT(Math.abs(cosv))}) = ${approxT(ang)}^\\circ$${cosv < 0 ? ' (a negative cosine means an obtuse angle)' : ''}`,
      `Answer: <b>${f(ang)}</b>`,
    ],
  };
}, { title: 'Cosine rule: find an angle' });

/* ------------------------------------------------------------------ */
/* trig-area-sine                                                      */
/* ------------------------------------------------------------------ */

export const areaFind = gen('trig-area-find', 'trig-area-sine', (rng, d) => {
  const [P, Q, R] = pick(rng, LETTER_SETS);
  const unit = 'cm';
  const exact = d === 'easy' && chance(rng, 0.5);
  let a; let b; let C;
  if (exact) { a = 2 * int(rng, 2, 9); b = int(rng, 3, 15); C = 30; }
  else {
    for (let i = 0; i < 100; i += 1) {
      if (d === 'hard') { a = int(rng, 40, 180) / 10; b = int(rng, 40, 180) / 10; } else { a = int(rng, 4, 20); b = int(rng, 4, 20); }
      C = int(rng, 25, 140);
      // keep away from 90 degrees (sin C close to 1 would let "forgot sin" give the same answer) and from very thin triangles
      if ((C < 75 || C > 105) && a !== b && Math.max(a, b) <= 2.2 * Math.min(a, b)) break;
    }
  }
  if (exact && Math.max(a, b) > 2 * Math.min(a, b)) b = Math.round(a * 0.75) + 1;
  if (a === b) b += 1;
  const area = 0.5 * a * b * sinD(C);
  const hardSplit = d === 'hard' && chance(rng, 0.5); // angle at R not given; given the two other angles instead
  // R is the vertex with angle C between sides RP (=a) and RQ (=b)
  const c = Math.sqrt(a * a + b * b - 2 * a * b * cosD(C));
  const angP = asinD((b * sinD(C)) / c); const angPf = b * b > a * a + c * c ? 180 - angP : angP;
  const angs = [angPf, 180 - C - angPf, C];
  const shownP = Math.round(angs[0]); const shownQ = 180 - C - shownP;
  const angles = hardSplit ? { [P]: `${shownP}°`, [Q]: `${shownQ}°` } : { [R]: `${C}°` };
  const vis = triFig({ angs, n: [P, Q, R], sides: { [R + P]: L(a, unit), [R + Q]: L(b, unit) }, angles, ...orient(rng) });
  const r = exact ? null : roundingFor(rng, d);
  const fa = (v) => (r ? `${r.fmt(v)} cm²` : `${num(roundTo(v, 6))} cm²`);
  const wrong = [2 * area, 0.5 * a * b, 0.5 * a * b * Math.abs(cosD(C)), 0.5 * a * b * Math.abs(Math.sin(C)), a * b * sinD(C) / 4, hardSplit ? 0.5 * a * b * sinD(shownP) : 0.5 * a * b * sinD(180 - C - 30)];
  return {
    prompt: `Work out the area of triangle $${P}${Q}${R}$.${r ? ` ${r.text}` : ' Do not use a calculator.'}`,
    visual: vis,
    answer: fa(area),
    distractors: fmtVals(exact ? [a * b / 2, a * b, a * b / 8, a + b, 0.5 * (a + b), (a * b) / 6].filter((v) => Math.abs(v * 2 - Math.round(v * 2)) < 1e-9 && Math.abs(v - area) > 1e-9) : wrong, fa),
    typed: r ? r.typed(area) : { kind: 'number', value: roundTo(area, 6) },
    calculator: !exact,
    hint: 'Area $= \\frac{1}{2}ab\\sin C$, where $C$ is the angle <b>between</b> sides $a$ and $b$.',
    solution: [
      ...(hardSplit ? [`The formula needs the angle <b>between</b> the two known sides, at $${R}$: $${R} = 180^\\circ - ${At(shownP)} - ${At(shownQ)} = ${At(C)}$.`] : []),
      `Area $= \\frac{1}{2}ab\\sin C$ with the two sides ${L(a, unit)} and ${L(b, unit)} and the angle between them, $${At(C)}$.`,
      exact ? `$\\sin ${At(C)} = \\frac{1}{2}$${C === 150 ? ' (the same as $\\sin 30^\\circ$)' : ''}, so area $= \\frac{1}{2} \\times ${a} \\times ${b} \\times \\frac{1}{2} = ${tnum(area)}$`
        : `Area $= \\frac{1}{2} \\times ${tnum(a)} \\times ${tnum(b)} \\times \\sin ${At(C)} = ${approxT(area)}$`,
      `Answer: <b>${fa(area)}</b>`,
    ],
  };
}, { title: 'Area = ½ab sin C' });

export const areaReverse = gen('trig-area-reverse', 'trig-area-sine', (rng, d) => {
  const [P, Q, R] = pick(rng, LETTER_SETS);
  const unit = 'cm';
  const findAngle = d === 'hard' ? chance(rng, 0.6) : d === 'medium' ? chance(rng, 0.5) : false;
  const a = int(rng, 5, 20); let b = int(rng, 5, 20); if (b === a) b += 1;
  const C = int(rng, 25, 80);
  const areaTrue = 0.5 * a * b * sinD(C);
  const area = d === 'easy' ? roundTo(areaTrue, 1) : roundTo(areaTrue, 1);
  if (findAngle) {
    const s = (2 * area) / (a * b);
    const x = asinD(s);
    const f = (v) => A(roundTo(v, 1), 1);
    const c = Math.sqrt(a * a + b * b - 2 * a * b * cosD(x));
    const angP = asinD((b * sinD(x)) / c);
    const angs = [angP, 180 - x - angP, x];
    const vis = triFig({ angs, n: [P, Q, R], sides: { [R + P]: L(a, unit), [R + Q]: L(b, unit) }, angles: { [R]: 'x' }, ...orient(rng) });
    return {
      prompt: `The area of triangle $${P}${Q}${R}$ is ${num(area)} cm². Angle $x$ is acute.<br>Work out the size of angle $x$. Give your answer to 1 decimal place.`,
      visual: vis,
      answer: f(x),
      distractors: fmtVals([180 - x, area / (a * b) <= 1 ? asinD(area / (a * b)) : NaN, acosD(Math.min(1, s)), asinD(roundTo(s, 1)), (2 * area) / (a * b) * 90, 90 - x], f),
      typed: DP1.typed(x),
      calculator: true,
      solution: [
        `Use area $= \\frac{1}{2}ab\\sin C$: $${tnum(area)} = \\frac{1}{2} \\times ${a} \\times ${b} \\times \\sin x$`,
        `$${tnum(area)} = ${tnum(a * b / 2)}\\sin x$, so $\\sin x = \\frac{${tnum(area)}}{${tnum(a * b / 2)}} = ${approxT(s)}$`,
        `$x = \\sin^{-1}(${approxT(s)}) = ${approxT(x)}^\\circ$`,
        `Answer: <b>${f(x)}</b>`,
      ],
    };
  }
  // find a side: area, angle and one side known
  const r = roundingFor(rng, d);
  const areaG = d === 'easy' ? Math.round(areaTrue) : area;
  const bb = (2 * areaG) / (a * sinD(C));
  const f = (v) => `${r.fmt(v)} ${unit}`;
  const c = Math.sqrt(a * a + bb * bb - 2 * a * bb * cosD(C));
  const angP = asinD(Math.min(1, (bb * sinD(C)) / c)); const angPf = bb * bb > a * a + c * c ? 180 - angP : angP;
  const vis = triFig({ angs: [angPf, 180 - C - angPf, C], n: [P, Q, R], sides: { [R + P]: L(a, unit), [R + Q]: 'x' }, angles: { [R]: `${C}°` }, ...orient(rng) });
  return {
    prompt: `The area of triangle $${P}${Q}${R}$ is ${num(areaG)} cm².<br>Work out the value of $x$. ${r.text}`,
    visual: vis,
    answer: f(bb),
    distractors: fmtVals([areaG / (a * sinD(C)), (2 * areaG) / (a * Math.abs(Math.sin(C))), (2 * areaG) / (a * cosD(C)), (2 * areaG) / a, 2 * areaG * sinD(C) / a, (areaG * a * sinD(C)) / 2], f),
    typed: r.typed(bb),
    calculator: true,
    solution: [
      `Use area $= \\frac{1}{2}ab\\sin C$ with the angle between the two sides: $${tnum(areaG)} = \\frac{1}{2} \\times ${a} \\times x \\times \\sin ${At(C)}$`,
      `$\\frac{1}{2} \\times ${a} \\times \\sin ${At(C)} = ${approxT(0.5 * a * sinD(C))}$, so $${tnum(areaG)} = ${approxT(0.5 * a * sinD(C))}x$`,
      `$x = \\frac{${tnum(areaG)}}{${approxT(0.5 * a * sinD(C))}} = ${approxT(bb)}$`,
      `Answer: <b>${f(bb)}</b>`,
    ],
  };
}, { title: 'Area = ½ab sin C in reverse (find a side or angle)', learn: ['trig-area-sine', 'trig-sohcahtoa-angle'] });

export const areaSegment = gen('trig-area-segment', 'trig-area-sine', (rng, d) => {
  const rr = d === 'hard' ? int(rng, 40, 150) / 10 : int(rng, 4, 15);
  const th = d === 'easy' ? pick(rng, [70, 80, 100, 110, 120, 130]) : int(rng, 60, 140);
  const sector = (th / 360) * Math.PI * rr * rr; const tri = 0.5 * rr * rr * sinD(th);
  const seg = sector - tri;
  const r = roundingFor(rng, d);
  const f = (v) => `${r.fmt(v)} cm²`;
  const rot = int(rng, 0, 359);
  const a1 = rot; const a2 = rot + th;
  const P1 = [Math.cos((a1 * Math.PI) / 180), Math.sin((a1 * Math.PI) / 180)];
  const P2 = [Math.cos((a2 * Math.PI) / 180), Math.sin((a2 * Math.PI) / 180)];
  const vis = fig({
    pts: { O: [0, 0], A: P1, B: P2 }, circles: [['O', 1]], width: 300, height: 240, pad: 30,
    draw: (g) => {
      const Ap = g.P('A'); const Bp = g.P('B'); const R = g.k;
      // segment: arc from A to B (anticlockwise in maths = sweep 0 in screen) then chord back
      const seg2 = svgPath(`M ${Ap[0]} ${Ap[1]} A ${R} ${R} 0 0 0 ${Bp[0]} ${Bp[1]} Z`, { fill: FILL2, color: 'none', width: 0 });
      return seg2 + g.circle('O', 1) + g.seg('O', 'A') + g.seg('O', 'B') + g.seg('A', 'B') + g.dot('O') + g.name('O', 'O', { away: [(P1[0] + P2[0]) / 2, (P1[1] + P2[1]) / 2] })
        + g.angle('O', 'A', 'B', `${th}°`) + g.side('O', 'A', L(rr, 'cm'), { inside: 'B' });
    },
  });
  return {
    prompt: `The diagram shows a circle, centre $O$, radius ${L(rr, 'cm')}. $A$ and $B$ are points on the circle and angle $AOB = ${At(th)}$.<br>Work out the area of the shaded segment. ${r.text}`,
    visual: vis,
    answer: f(seg),
    distractors: fmtVals([sector, tri, sector + tri, Math.PI * rr * rr - seg, (th / 360) * 2 * Math.PI * rr - tri, (th / 360) * Math.PI * rr * rr - rr * rr * sinD(th)], f),
    typed: r.typed(seg),
    calculator: true,
    solution: [
      'Segment = sector − triangle.',
      `Sector $= \\frac{${th}}{360} \\times \\pi \\times ${tnum(rr)}^2 = ${approxT(sector)}$ cm²`,
      `Triangle $AOB = \\frac{1}{2} \\times ${tnum(rr)} \\times ${tnum(rr)} \\times \\sin ${At(th)} = ${approxT(tri)}$ cm² (two radii with the angle between them)`,
      `Segment $= ${approxT(sector)} - ${approxT(tri)} = ${approxT(seg)}$. Answer: <b>${f(seg)}</b>`,
    ],
  };
}, { title: 'Area of a segment (sector − ½ab sin C)', learn: ['trig-area-sine', 'geo-arcs-sectors'] });

/* ------------------------------------------------------------------ */
/* trig-sine-cosine-problems (mixed / choosing the rule)               */
/* ------------------------------------------------------------------ */

export const scWhichEquation = gen('trig-sc-which-equation', 'trig-sine-cosine-problems', (rng, d) => {
  if (d === 'hard') { rng(); rng(); } // hard draws its own numbers, never a copy of easy
  const [P, Q, R] = pick(rng, LETTER_SETS);
  const unit = 'cm';
  const kind = pick(rng, d === 'easy' ? ['cosSide', 'sineSide'] : d === 'medium' ? ['cosSide', 'sineSide', 'cosAngle', 'sineAngle'] : ['cosAngle', 'sineAngle', 'cosAngle', 'sineSide']);
  const angs = randomAngles(rng, { lo: 32, hi: 108 });
  const s1 = int(rng, 5, 20); let s2 = int(rng, 5, 20); if (s2 === s1) s2 += 2;
  const [pa, qa] = [At(angs[0]), At(angs[1])];
  let vis; let ans; let ds; let why;
  const cosEq = (x, b, c, ang) => `$${x}^2 = ${b}^2 + ${c}^2 - 2 \\times ${b} \\times ${c} \\times \\cos ${ang}$`;
  if (kind === 'cosSide') {
    vis = triFig({ angs, n: [P, Q, R], sides: { [P + Q]: L(s1, unit), [P + R]: L(s2, unit), [Q + R]: 'x' }, angles: { [P]: `${angs[0]}°` }, ...orient(rng) });
    ans = cosEq('x', s1, s2, pa);
    ds = [`$\\frac{x}{\\sin ${pa}} = \\frac{${s1}}{\\sin ${qa}}$`, `$x^2 = ${s1}^2 + ${s2}^2$`, `$x = ${s1}\\cos ${pa}$`, `$x^2 = ${s1}^2 + ${s2}^2 + 2 \\times ${s1} \\times ${s2} \\times \\cos ${pa}$`, `$x^2 = ${s1}^2 - ${s2}^2 - 2 \\times ${s1} \\times ${s2} \\times \\cos ${pa}$`];
    why = 'Two sides and the angle <b>between</b> them, and you want the side opposite that angle: cosine rule.';
  } else if (kind === 'sineSide') {
    vis = triFig({ angs, n: [P, Q, R], sides: { [Q + R]: L(s1, unit), [P + R]: 'x' }, angles: { [P]: `${angs[0]}°`, [Q]: `${angs[1]}°` }, ...orient(rng) });
    ans = `$\\frac{x}{\\sin ${qa}} = \\frac{${s1}}{\\sin ${pa}}$`;
    ds = [`$\\frac{x}{\\sin ${pa}} = \\frac{${s1}}{\\sin ${qa}}$`, `$\\frac{\\sin ${qa}}{x} = \\frac{${s1}}{\\sin ${pa}}$`, `$x = ${s1}\\sin ${qa}$`, `$\\frac{x}{${s1}} = \\frac{\\sin ${pa}}{\\sin ${qa}}$`, `$x = \\frac{${s1}}{\\sin ${qa}}$`];
    why = 'You know two angles and a side opposite one of them: pair each side with its opposite angle in the sine rule.';
  } else if (kind === 'cosAngle') {
    let third = int(rng, Math.abs(s1 - s2) + 2, s1 + s2 - 2);
    while (third === s1 || third === s2) third += 1;
    const sides3 = [s1, s2, third];
    vis = triFig({ angs: (() => { const [a, b, c] = [sides3[2], sides3[1], sides3[0]]; const A0 = acosD((b * b + c * c - a * a) / (2 * b * c)); const B0 = acosD((a * a + c * c - b * b) / (2 * a * c)); return [A0, B0, 180 - A0 - B0]; })(), n: [P, Q, R], sides: { [P + Q]: L(sides3[0], unit), [P + R]: L(sides3[1], unit), [Q + R]: L(sides3[2], unit) }, angles: { [P]: 'x' }, ...orient(rng) });
    ans = `$\\cos x = \\frac{${sides3[0]}^2 + ${sides3[1]}^2 - ${sides3[2]}^2}{2 \\times ${sides3[0]} \\times ${sides3[1]}}$`;
    ds = [`$\\cos x = \\frac{${sides3[0]}^2 + ${sides3[2]}^2 - ${sides3[1]}^2}{2 \\times ${sides3[0]} \\times ${sides3[2]}}$`, `$\\cos x = \\frac{${sides3[0]}^2 + ${sides3[1]}^2 + ${sides3[2]}^2}{2 \\times ${sides3[0]} \\times ${sides3[1]}}$`, `$\\sin x = \\frac{${sides3[2]}}{${sides3[0]}}$`, `$\\cos x = \\frac{${sides3[2]}^2 - ${sides3[0]}^2 - ${sides3[1]}^2}{2 \\times ${sides3[0]} \\times ${sides3[1]}}$`];
    why = `Three sides and no angles: cosine rule for an angle. The side <b>opposite</b> $x$ (${sides3[2]} cm) is the one subtracted.`;
  } else {
    let b = Math.round((s1 * sinD(angs[1])) / sinD(angs[0]));
    if (b === s1) b = s1 > 6 ? s1 - 1 : s1 + 1;
    vis = triFig({ angs, n: [P, Q, R], sides: { [Q + R]: L(s1, unit), [P + R]: L(b, unit) }, angles: { [P]: `${angs[0]}°`, [Q]: 'x' }, ...orient(rng) });
    ans = `$\\frac{\\sin x}{${b}} = \\frac{\\sin ${pa}}{${s1}}$`;
    ds = [`$\\frac{\\sin x}{${s1}} = \\frac{\\sin ${pa}}{${b}}$`, `$\\cos x = \\frac{${b}}{${s1}}$`, `$\\sin x = \\frac{${b}}{${s1}}$`, cosEq(`\\sin x`, s1, b, pa)];
    why = 'An angle and the side opposite it are both known, plus another side: sine rule (sines on top to find an angle).';
  }
  return {
    prompt: 'Which equation should be used to work out $x$?',
    visual: vis,
    answer: ans,
    distractors: ds,
    solution: [why, 'Check each side is paired with the correct angle (opposite it).', `Answer: ${ans}`],
  };
}, { title: 'Choose the right rule (which equation?)', learn: ['trig-sine-cosine-problems', 'trig-sine-rule', 'trig-cosine-rule'] });

export const scQuadrilateral = gen('trig-sc-quadrilateral', 'trig-sine-cosine-problems', (rng, d) => {
  const unit = 'cm';
  // ABCD with diagonal BD. Triangle ABD: AB, AD, angle A -> BD (cosine rule).
  // Triangle BCD: angle C and angle CBD given -> CD by sine rule; or BC given -> area of ABCD.
  const ab = int(rng, 6, 15); let ad = int(rng, 6, 15); if (ad === ab) ad += 1;
  const angA = int(rng, 55, 115);
  const bd = Math.sqrt(ab * ab + ad * ad - 2 * ab * ad * cosD(angA));
  const ask = d === 'easy' ? 'bd' : pick(rng, ['cd', 'area']);
  const angC = int(rng, 50, 95); const angCBD = int(rng, 30, 70);
  const angBDC = 180 - angC - angCBD;
  const cd = (bd * sinD(angCBD)) / sinD(angC);
  const bc = (bd * sinD(angBDC)) / sinD(angC);
  const bcGiven = Math.round(bc);
  // geometry for drawing: A at origin, B along x, D at angle A
  const Ap = [0, 0]; const Bp = [ab, 0]; const Dp = [ad * cosD(angA), ad * sinD(angA)];
  // C on the far side of BD from A, with angle CBD
  const ux = (Dp[0] - Bp[0]) / bd; const uy = (Dp[1] - Bp[1]) / bd;
  const rotC = (v, t) => [v[0] * cosD(t) - v[1] * sinD(t), v[0] * sinD(t) + v[1] * cosD(t)];
  const sideA = (Dp[0] - Bp[0]) * (Ap[1] - Bp[1]) - (Dp[1] - Bp[1]) * (Ap[0] - Bp[0]);
  const dir = rotC([ux, uy], sideA > 0 ? -angCBD : angCBD);
  const blen = ask === 'area' ? bcGiven : bc;
  const Cp = [Bp[0] + dir[0] * blen, Bp[1] + dir[1] * blen];
  const r = roundingFor(rng, d);
  let prompt; let ans; let f; let wrong; let sol;
  const labels = { AB: L(ab, unit), AD: L(ad, unit) };
  const angles = { A: `${angA}°` };
  if (ask === 'bd') {
    f = (v) => `${r.fmt(v)} ${unit}`;
    ans = bd; prompt = `Work out the length of the diagonal $BD$. ${r.text}`;
    wrong = [bd * bd < 1000 ? bd * bd : NaN, Math.sqrt(ab * ab + ad * ad + 2 * ab * ad * cosD(angA)), Math.hypot(ab, ad), Math.sqrt(Math.abs((ab * ab + ad * ad - 2 * ab * ad) * cosD(angA)))];
    sol = [`In triangle $ABD$ you know two sides and the angle between them: [[trig-cosine-rule|cosine rule]].`, `$BD^2 = ${ab}^2 + ${ad}^2 - 2 \\times ${ab} \\times ${ad} \\times \\cos ${At(angA)} = ${approxT(bd * bd)}$`, `$BD = ${approxT(bd)}$`, `Answer: <b>${f(bd)}</b>`];
  } else if (ask === 'cd') {
    f = (v) => `${r.fmt(v)} ${unit}`;
    ans = cd; prompt = `Work out the length of $CD$. ${r.text}`;
    angles.C = `${angC}°`; angles.CBD = `${angCBD}°`;
    wrong = [(bd * sinD(angC)) / sinD(angCBD), (bd * sinD(angBDC)) / sinD(angC), (ab * sinD(angCBD)) / sinD(angC), (Math.hypot(ab, ad) * sinD(angCBD)) / sinD(angC), cd * 1.1];
    sol = [
      `Step 1 – triangle $ABD$ (two sides and the included angle): cosine rule. $BD^2 = ${ab}^2 + ${ad}^2 - 2 \\times ${ab} \\times ${ad}\\cos ${At(angA)}$, so $BD = ${approxT(bd)}$ cm.`,
      `Step 2 – triangle $BCD$: $CD$ is opposite the $${At(angCBD)}$ angle and $BD$ is opposite the $${At(angC)}$ angle: [[trig-sine-rule|sine rule]].`,
      `$CD = \\frac{${approxT(bd)} \\times \\sin ${At(angCBD)}}{\\sin ${At(angC)}} = ${approxT(cd)}$`,
      `Answer: <b>${f(cd)}</b>`,
    ];
  } else {
    f = (v) => `${r.fmt(v)} cm²`;
    const t1 = 0.5 * ab * ad * sinD(angA); const t2 = 0.5 * bd * bcGiven * sinD(angCBD);
    ans = t1 + t2; prompt = `Work out the area of quadrilateral $ABCD$. ${r.text}`;
    labels.BC = L(bcGiven, unit); angles.CBD = `${angCBD}°`;
    wrong = [t1, t1 * 2 + t2, 0.5 * ab * ad + 0.5 * bd * bcGiven, t1 + 0.5 * ad * bcGiven * sinD(angCBD), t1 + t2 * 2, ab * ad * sinD(angA) + bd * bcGiven * sinD(angCBD)];
    sol = [
      `Split along $BD$. Triangle $ABD$: area $= \\frac{1}{2} \\times ${ab} \\times ${ad} \\times \\sin ${At(angA)} = ${approxT(t1)}$ cm².`,
      `For triangle $BCD$ you need $BD$ (cosine rule in $ABD$): $BD = \\sqrt{${ab}^2 + ${ad}^2 - 2 \\times ${ab} \\times ${ad}\\cos ${At(angA)}} = ${approxT(bd)}$ cm.`,
      `Triangle $BCD$: area $= \\frac{1}{2} \\times ${approxT(bd)} \\times ${bcGiven} \\times \\sin ${At(angCBD)} = ${approxT(t2)}$ cm².`,
      `Total $= ${approxT(t1)} + ${approxT(t2)} = ${approxT(ans)}$. Answer: <b>${f(ans)}</b>`,
    ];
  }
  const vis = fig({
    pts: { A: Ap, B: Bp, C: Cp, D: Dp }, rotate: pick(rng, [0, 0, 10, -8]), width: 380, height: 250,
    draw: (g) => {
      let out = g.poly('ABCD') + g.seg('B', 'D', { width: 1.8 });
      out += g.angle('A', 'B', 'D', angles.A);
      if (angles.C) out += g.angle('C', 'D', 'B', angles.C);
      if (angles.CBD) out += g.angle('B', 'D', 'C', angles.CBD);
      for (const [k, v] of Object.entries(labels)) out += g.side(k[0], k[1], v);
      return out + g.polyNames('ABCD');
    },
  });
  return {
    prompt: `The diagram shows quadrilateral $ABCD$ with diagonal $BD$.<br>${prompt}`,
    visual: vis,
    answer: f(ans),
    distractors: fmtVals(wrong, f),
    typed: r.typed(ans),
    calculator: true,
    solution: sol,
  };
}, { title: 'Multi-step: quadrilateral with a diagonal', learn: ['trig-sine-cosine-problems', 'trig-cosine-rule', 'trig-sine-rule', 'trig-area-sine'] });

const bearing3 = (b) => `${String(((b % 360) + 360) % 360).padStart(3, '0')}°`;

/** Contexts for sine/cosine rule word problems. Each returns { prompt, value, unit, kind, sol, wrong }. */
const SC_CONTEXTS = [
  // Two ships from a harbour on different bearings -> distance apart (cosine rule)
  (rng) => {
    const b1 = int(rng, 10, 80); const b2 = b1 + int(rng, 40, 120); const d1 = int(rng, 8, 40); const d2 = int(rng, 8, 40);
    const ang = b2 - b1; const x = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * cosD(ang));
    return { prompt: `Two ships leave a harbour at the same time. Ship A sails ${d1} km on a bearing of ${bearing3(b1)}. Ship B sails ${d2} km on a bearing of ${bearing3(b2)}. How far apart are the ships now?`, unit: 'km', value: x, b: d1, c: d2, ang, lead: `The angle between their paths at the harbour is $${b2} - ${b1} = ${ang}^\\circ$.` };
  },
  // Walk two legs with a turn -> distance from start
  (rng) => {
    const b1 = int(rng, 20, 90); const turn = int(rng, 30, 100); const b2 = b1 + turn; const d1 = int(rng, 3, 12); const d2 = int(rng, 3, 12);
    const ang = 180 - turn; const x = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * cosD(ang));
    const who = names(rng, 1)[0];
    return { prompt: `${who} walks ${d1} km on a bearing of ${bearing3(b1)}, then ${d2} km on a bearing of ${bearing3(b2)}. How far is ${who} from the starting point?`, unit: 'km', value: x, b: d1, c: d2, ang, lead: `At the turning point the angle inside the triangle is $180^\\circ - (${b2} - ${b1})^\\circ = ${ang}^\\circ$ (co-interior angles with the north lines).` };
  },
  // Clock hands
  (rng) => {
    const h = int(rng, 1, 5); const hour = pick(rng, [2, 2.5, 3, 3.5, 4]); const minute = int(rng, 5, 8);
    const ang = h * 30; const x = Math.sqrt(hour * hour + minute * minute - 2 * hour * minute * cosD(ang));
    return { prompt: `The hour hand of a clock is ${num(hour)} cm long and the minute hand is ${minute} cm long. At ${h} o'clock, how far apart are the tips of the two hands?`, unit: 'cm', value: x, b: hour, c: minute, ang, lead: `At ${h} o'clock the hands are $${h} \\times 30^\\circ = ${ang}^\\circ$ apart (each hour mark is $360^\\circ \\div 12 = 30^\\circ$).` };
  },
  // Football goal width
  (rng) => {
    const d1 = int(rng, 12, 30); const d2 = d1 + int(rng, 1, 6); const ang = int(rng, 10, 22);
    const x = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * cosD(ang));
    return { prompt: `A footballer is ${d1} m from one goalpost and ${d2} m from the other. The angle between the lines from the ball to the two posts is ${ang}°. How wide is the goal?`, unit: 'm', value: x, b: d1, c: d2, ang, lead: `The goal width is opposite the ${ang}° angle between the two known lengths.` };
  },
  // Lighthouse two boats
  (rng) => {
    const d1 = int(rng, 2, 9); const d2 = int(rng, 2, 9) + 0.5; const ang = int(rng, 35, 140);
    const x = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * cosD(ang));
    return { prompt: `From a lighthouse, one boat is ${d1} km away and another boat is ${num(d2)} km away. The angle between the lines of sight to the two boats is ${ang}°. How far apart are the boats?`, unit: 'km', value: x, b: d1, c: d2, ang, lead: `Two sides and the angle between them (at the lighthouse).` };
  },
  // Triangular field area
  (rng) => {
    const d1 = int(rng, 30, 90); const d2 = int(rng, 30, 90); const ang = int(rng, 40, 130);
    return { prompt: `A triangular field has two sides of ${d1} m and ${d2} m with an angle of ${ang}° between them. Work out the area of the field.`, unit: 'm²', kind: 'area', value: 0.5 * d1 * d2 * sinD(ang), b: d1, c: d2, ang };
  },
  // Triangular garden: three sides -> largest angle
  (rng) => {
    let s; for (;;) { s = [int(rng, 4, 12), int(rng, 4, 12), int(rng, 6, 16)].sort((p, q) => p - q); if (s[2] < s[0] + s[1] - 1 && s[0] !== s[1]) break; }
    const ang = acosD((s[0] * s[0] + s[1] * s[1] - s[2] * s[2]) / (2 * s[0] * s[1]));
    return { prompt: `A triangular flower bed has sides of ${s[0]} m, ${s[1]} m and ${s[2]} m. Work out the size of the largest angle of the flower bed.`, unit: '°', kind: 'angle', value: ang, b: s[0], c: s[1], a: s[2] };
  },
  // Roof truss apex angle
  (rng) => {
    const raft = int(rng, 30, 60) / 10; const span = roundTo(raft * (1.2 + rng() * 0.6), 1);
    const ang = acosD((2 * raft * raft - span * span) / (2 * raft * raft));
    return { prompt: `A roof truss is an isosceles triangle. The two sloping rafters are each ${num(raft)} m long and the horizontal beam is ${num(span)} m long. Work out the angle between the two rafters at the top.`, unit: '°', kind: 'angle', value: ang, b: raft, c: raft, a: span };
  },
  // Orienteering: three checkpoints
  (rng) => {
    let s; for (;;) { s = [int(rng, 300, 900), int(rng, 300, 900), int(rng, 300, 900)]; if (s[2] < s[0] + s[1] - 100 && s[0] < s[1] + s[2] && s[1] < s[0] + s[2] && new Set(s).size === 3) break; }
    const ang = acosD((s[0] * s[0] + s[1] * s[1] - s[2] * s[2]) / (2 * s[0] * s[1]));
    return { prompt: `On an orienteering course, checkpoint P is ${s[0]} m from Q, Q is ${s[2]} m from R, and R is ${s[1]} m from P. Work out angle QPR.`, unit: '°', kind: 'angle', value: ang, b: s[0], c: s[1], a: s[2] };
  },
  // Two observers on a shore: sine rule
  (rng) => {
    const base = int(rng, 200, 800); const a1 = int(rng, 35, 75); const a2 = int(rng, 35, 75);
    const top = 180 - a1 - a2; const x = (base * sinD(a2)) / sinD(top);
    return { prompt: `Two coastguards, A and B, stand ${base} m apart on a straight shore. They both see a boat. The angle between the shore and the line from A to the boat is ${a1}°. At B the angle is ${a2}°. How far is the boat from A?`, unit: 'm', kind: 'sine', value: x, base, a1, a2, top };
  },
  // Plane flight: two legs, distance back (cosine)
  (rng) => {
    const d1 = int(rng, 60, 250); const d2 = int(rng, 60, 250); const turn = int(rng, 35, 110);
    const ang = 180 - turn; const x = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * cosD(ang));
    return { prompt: `A plane flies ${d1} km from airport A to beacon B. It then turns through ${turn}° and flies ${d2} km to airport C. How far is it from A to C in a straight line?`, unit: 'km', value: x, b: d1, c: d2, ang, lead: `Turning through ${turn}° leaves an angle of $180^\\circ - ${turn}^\\circ = ${ang}^\\circ$ inside the triangle at B.` };
  },
  // Triangular plot: sides and angle -> perimeter
  (rng) => {
    const d1 = int(rng, 20, 60); const d2 = int(rng, 20, 60); const ang = int(rng, 40, 120);
    const x = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * cosD(ang));
    return { prompt: `A triangular plot of land has sides of ${d1} m and ${d2} m with an angle of ${ang}° between them. Fencing is needed all the way round the plot. What length of fencing is needed?`, unit: 'm', kind: 'perimeter', value: x + d1 + d2, third: x, b: d1, c: d2, ang };
  },
  // Crane / ramp: sine rule angle
  (rng) => {
    const jib = int(rng, 15, 30); const cable = int(rng, 10, jib - 2); const angAtTop = int(rng, 40, 75);
    const angBase = asinD((cable * sinD(angAtTop)) / jib);
    return { prompt: `A triangular sail PQR has edges PQ = ${jib} m and QR = ${cable} m. Angle PRQ is ${angAtTop}°. Angle QPR is acute. Work out the size of angle QPR.`, unit: '°', kind: 'sineAngle', value: angBase, jib, cable, angAtTop };
  },
];

export const scWord = gen('trig-sc-word', 'trig-sine-cosine-problems', (rng, d) => {
  const pool = d === 'easy' ? [0, 2, 3, 4, 5] : d === 'hard' ? [1, 6, 7, 8, 9, 10, 11, 12] : SC_CONTEXTS.map((_, i) => i);
  const ctx = SC_CONTEXTS[pick(rng, pool)](rng);
  const isAngle = ['angle', 'sineAngle'].includes(ctx.kind);
  const r = isAngle ? DP1 : roundingFor(rng, d);
  const f = isAngle ? (v) => A(roundTo(v, 1), 1) : (v) => `${r.fmt(v)} ${ctx.unit}`;
  let wrong; let sol;
  if (ctx.kind === 'area') {
    wrong = [2 * ctx.value, 0.5 * ctx.b * ctx.c, 0.5 * ctx.b * ctx.c * Math.abs(cosD(ctx.ang)), ctx.b * ctx.c * sinD(ctx.ang) / 4];
    sol = [`Two sides and the angle between them: [[trig-area-sine|area]] $= \\frac{1}{2}ab\\sin C$.`, `$\\frac{1}{2} \\times ${ctx.b} \\times ${ctx.c} \\times \\sin ${At(ctx.ang)} = ${approxT(ctx.value)}$`, `Answer: <b>${f(ctx.value)}</b>`];
  } else if (ctx.kind === 'angle') {
    const cv = (ctx.b * ctx.b + ctx.c * ctx.c - ctx.a * ctx.a) / (2 * ctx.b * ctx.c);
    wrong = [180 - ctx.value, acosD(Math.max(-1, Math.min(1, (ctx.a * ctx.a + ctx.c * ctx.c - ctx.b * ctx.b) / (2 * ctx.a * ctx.c)))), acosD(roundTo(cv, 1)), 90 - ctx.value / 2, acosD(Math.max(-1, Math.min(1, cv * 2)))];
    sol = [`Three sides known → [[trig-cosine-rule|cosine rule]] for an angle. The angle wanted is opposite the side of ${num(ctx.a)}.`, `$\\cos\\theta = \\frac{${tnum(ctx.b)}^2 + ${tnum(ctx.c)}^2 - ${tnum(ctx.a)}^2}{2 \\times ${tnum(ctx.b)} \\times ${tnum(ctx.c)}} = ${cv < 0 ? '-' : ''}${approxT(Math.abs(cv))}$`, `$\\theta = ${approxT(ctx.value)}^\\circ$`, `Answer: <b>${f(ctx.value)}</b>`];
  } else if (ctx.kind === 'sine') {
    wrong = [(ctx.base * sinD(ctx.a1)) / sinD(ctx.top), (ctx.base * sinD(ctx.top)) / sinD(ctx.a2), ctx.base * sinD(ctx.a2), (ctx.base * sinD(ctx.a2)) / sinD(ctx.a1)];
    sol = [`The angle at the boat is $180^\\circ - ${ctx.a1}^\\circ - ${ctx.a2}^\\circ = ${ctx.top}^\\circ$.`, `The distance from A to the boat is opposite the ${ctx.a2}° angle at B; the ${ctx.base} m shore is opposite the ${ctx.top}° angle. [[trig-sine-rule|Sine rule]]:`, `$x = \\frac{${ctx.base} \\times \\sin ${At(ctx.a2)}}{\\sin ${At(ctx.top)}} = ${approxT(ctx.value)}$`, `Answer: <b>${f(ctx.value)}</b>`];
  } else if (ctx.kind === 'sineAngle') {
    wrong = [180 - ctx.value, 180 - ctx.angAtTop - ctx.value, ctx.jib * sinD(ctx.angAtTop) / ctx.cable <= 1 ? asinD((ctx.jib * sinD(ctx.angAtTop)) / ctx.cable) : NaN, asinD(roundTo((ctx.cable * sinD(ctx.angAtTop)) / ctx.jib, 1)), asinD(ctx.cable / ctx.jib)];
    sol = [`In triangle $PQR$: $QR = ${ctx.cable}$ m is opposite angle $QPR$, and $PQ = ${ctx.jib}$ m is opposite the ${ctx.angAtTop}° angle at $R$.`, `Sine rule: $\\frac{\\sin QPR}{${ctx.cable}} = \\frac{\\sin ${At(ctx.angAtTop)}}{${ctx.jib}}$, so $\\sin QPR = ${approxT((ctx.cable * sinD(ctx.angAtTop)) / ctx.jib)}$`, `$QPR = ${approxT(ctx.value)}^\\circ$`, `Answer: <b>${f(ctx.value)}</b>`];
  } else {
    const x = ctx.kind === 'perimeter' ? ctx.third : ctx.value;
    const extra = ctx.kind === 'perimeter' ? ctx.b + ctx.c : 0;
    wrong = [Math.sqrt(ctx.b * ctx.b + ctx.c * ctx.c + 2 * ctx.b * ctx.c * cosD(ctx.ang)) + extra, Math.hypot(ctx.b, ctx.c) + extra, x * x < 3000 ? x * x + extra : NaN, Math.sqrt(Math.abs((ctx.b * ctx.b + ctx.c * ctx.c - 2 * ctx.b * ctx.c) * cosD(ctx.ang))) + extra, ctx.kind === 'perimeter' ? x : ctx.b + ctx.c];
    sol = [
      `${ctx.lead ?? 'Two sides and the angle between them.'} Use [[trig-cosine-rule|the cosine rule]].`,
      `$x^2 = ${tnum(ctx.b)}^2 + ${tnum(ctx.c)}^2 - 2 \\times ${tnum(ctx.b)} \\times ${tnum(ctx.c)} \\times \\cos ${At(ctx.ang)} = ${approxT(x * x)}$`,
      `$x = ${approxT(x)}$${ctx.kind === 'perimeter' ? `, so the perimeter is $${approxT(x)} + ${ctx.b} + ${ctx.c} = ${approxT(ctx.value)}$` : ''}`,
      `Answer: <b>${f(ctx.value)}</b>`,
    ];
  }
  return {
    prompt: `${ctx.prompt} ${r.text}`,
    answer: f(ctx.value),
    distractors: fmtVals(wrong, f),
    typed: r.typed(ctx.value),
    calculator: true,
    hint: 'Sketch the triangle and mark what you know. Two sides and the included angle → cosine rule; pairs of opposite sides and angles → sine rule.',
    solution: sol,
  };
}, { title: 'Sine and cosine rule in context (bearings, fields, clocks…)', word: true, learn: ['trig-sine-cosine-problems', 'trig-cosine-rule', 'trig-sine-rule', 'trig-area-sine'] });

export const sineRuleGenerators = [sineSide, sineAngle, sineWhich];
export const cosineRuleGenerators = [cosSide, cosAngle];
export const areaSineGenerators = [areaFind, areaReverse, areaSegment];
export const sineCosineProblemGenerators = [scWhichEquation, scQuadrilateral, scWord];

void [sample, ACCENT, FILL, shuffle];
