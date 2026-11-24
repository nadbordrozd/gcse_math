// Pythagoras' theorem: basic, problems, 3D (3D lives in solids.js).
import { gen, pick, int, size, shuffle, names, num, tnum, roundTo, tidy, chance } from '../../core.js';
import { fig, rightTriangleFig, displayLegs, FILL, MUTED } from './diagrams.js';
import { plane, text as svgText } from '../../svg.js';
import {
  DP1, roundingFor, L, fmtVals, typedInt, triple, allTriples, pickRotation, approx, approxT, nice, surd, surdTex, sqrtTex, isSquare,
} from './helpers.js';

const deg = (r) => (r * 180) / Math.PI;
const sq = (x) => tidy(x * x);

/** Pick two legs by difficulty: easy -> triple, otherwise non-triple integers (medium) or 1 dp decimals (hard). */
function legsFor(rng, d, { maxC = 30 } = {}) {
  if (d === 'easy') return triple(rng, { maxC });
  for (let i = 0; i < 100; i += 1) {
    const p = d === 'medium' ? int(rng, 3, 16) : int(rng, 25, 150) / 10;
    const q = d === 'medium' ? int(rng, 4, 20) : int(rng, 25, 150) / 10;
    if (p === q || Math.max(p, q) / Math.min(p, q) > 3.2) continue;
    const c = Math.hypot(p, q);
    if (Math.abs(c - Math.round(c)) < 0.02) continue;
    return [p, q, c];
  }
  return [5, 7, Math.hypot(5, 7)];
}

/* ------------------------------------------------------------------ */
/* trig-pythagoras                                                     */
/* ------------------------------------------------------------------ */

export const pythHyp = gen('trig-pyth-hyp', 'trig-pythagoras', (rng, d) => {
  const unit = pick(rng, ['cm', 'cm', 'm', 'mm']);
  const [p, q, c] = legsFor(rng, d);
  const r = d === 'easy' ? null : roundingFor(rng, d);
  const f = (v) => (r ? `${r.fmt(v)} ${unit}` : L(v, unit));
  const useNames = d === 'hard' && chance(rng, 0.5);
  const vis = rightTriangleFig({
    angleA: deg(Math.atan2(q, p)), rotate: pickRotation(rng, d), flip: chance(rng),
    sides: { CA: L(p, unit), CB: L(q, unit), AB: useNames ? null : 'x' }, names: useNames,
  });
  const target = useNames ? '$AB$' : 'the side marked $x$';
  const wrong = [
    Math.sqrt(Math.abs(q * q - p * p)), p + q, sq(p) + sq(q) < 1500 ? sq(p) + sq(q) : NaN, Math.sqrt(2 * p + 2 * q),
    Math.max(p, q) + Math.min(p, q) / 2,
  ];
  const x = useNames ? 'AB' : 'x';
  return {
    prompt: `Work out the length of ${target}.${r ? ` ${r.text}` : ''}`,
    visual: vis,
    answer: f(c),
    distractors: fmtVals(r ? wrong : wrong.filter(Number.isInteger), f),
    typed: r ? r.typed(c) : typedInt(c),
    calculator: Boolean(r),
    hint: 'Which side is opposite the right angle?',
    solution: [
      `$${x}$ is opposite the right angle, so it is the <b>hypotenuse</b>. Pythagoras: $${x}^2 = a^2 + b^2$ (add the squares of the two shorter sides).`,
      `$${x}^2 = ${tnum(p)}^2 + ${tnum(q)}^2 = ${tnum(sq(p))} + ${tnum(sq(q))} = ${tnum(sq(p) + sq(q))}$`,
      `Square root: $${x} = \\sqrt{${tnum(sq(p) + sq(q))}} = ${r ? approxT(c) : tnum(c)}$${r ? ` = ${r.fmt(c)} ${unit} (${r.short})` : ''}`,
      `Answer: <b>${f(c)}</b>. Check: the hypotenuse must be the longest side.`,
    ],
  };
}, { title: 'Find the hypotenuse from a diagram' });

export const pythShort = gen('trig-pyth-short', 'trig-pythagoras', (rng, d) => {
  const unit = pick(rng, ['cm', 'cm', 'm', 'mm']);
  let [p, q, c] = legsFor(rng, d);
  if (d === 'hard') { c = roundTo(c + int(rng, -4, 4) / 10, 1); if (c <= Math.max(p, q) + 0.3) c = roundTo(Math.max(p, q) + 1.3, 1); q = Math.sqrt(c * c - p * p); }
  else if (d === 'medium') { c = Math.round(c) + int(rng, 0, 1); q = Math.sqrt(c * c - p * p); }
  // unknown is q (CB)
  const r = d === 'easy' ? null : roundingFor(rng, d);
  const f = (v) => (r ? `${r.fmt(v)} ${unit}` : L(v, unit));
  const vis = rightTriangleFig({
    angleA: deg(Math.atan2(q, p)), rotate: pickRotation(rng, d), flip: chance(rng),
    sides: { CA: L(p, unit), CB: 'x', AB: L(c, unit) },
  });
  const wrong = [Math.hypot(p, c), sq(c) - sq(p) < 1500 ? sq(c) - sq(p) : NaN, c - p, c + p, Math.sqrt(2 * c - 2 * p), (c + p) / 2];
  return {
    prompt: `Work out the value of $x$.${r ? ` ${r.text}` : ''}`,
    visual: vis,
    answer: f(q),
    distractors: fmtVals(r ? wrong : wrong.filter(Number.isInteger), f),
    typed: r ? r.typed(q) : typedInt(q),
    calculator: Boolean(r),
    hint: 'Is $x$ the hypotenuse, or one of the shorter sides?',
    solution: [
      `The hypotenuse (opposite the right angle) is ${L(c, unit)}. $x$ is a <b>shorter side</b>, so <b>subtract</b>: $x^2 = c^2 - a^2$.`,
      `$x^2 = ${tnum(c)}^2 - ${tnum(p)}^2 = ${tnum(sq(c))} - ${tnum(sq(p))} = ${tnum(tidy(sq(c) - sq(p)))}$`,
      `$x = \\sqrt{${tnum(tidy(sq(c) - sq(p)))}} = ${r ? approxT(q) : tnum(q)}$${r ? ` = ${r.fmt(q)} ${unit} (${r.short})` : ''}`,
      `Answer: <b>${f(q)}</b>. (Adding the squares would give ${approx(Math.hypot(p, c))} ${unit}, longer than the hypotenuse – impossible.)`,
    ],
  };
}, { title: 'Find a shorter side from a diagram' });

export const pythConverse = gen('trig-pyth-converse', 'trig-pythagoras', (rng, d) => {
  let t; let k;
  if (d === 'easy') { t = pick(rng, [[3, 4, 5], [5, 12, 13], [6, 8, 10]]); k = pick(rng, [1, 1, 2, 3]); }
  else if (d === 'medium') { t = pick(rng, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]); k = pick(rng, [0.5, 2, 3, 4, 10]); }
  else { t = pick(rng, [[8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37], [3, 4, 5], [5, 12, 13]]); k = pick(rng, [0.1, 0.2, 0.3, 0.5, 1, 1.5]); }
  const [a, b, c] = t.map((v) => tidy(v * k));
  const unit = pick(rng, ['cm', 'm']);
  const sqs = (v) => `${tnum(v)}^2`;
  const mode = pick(rng, ['sets', 'check', 'third']);
  if (mode === 'third') {
    // Two sides known; the third side is the hypotenuse or a shorter side.
    const findHyp = chance(rng, 0.6);
    const [g1, g2, ans] = findHyp ? [a, b, c] : [a, c, b];
    const f = (v) => `${num(v)} ${unit}`;
    const wrong = findHyp ? [a + b, b - a, sq(a) + sq(b), (a + b) / 2, c + k] : [a + c, c - a, sq(c) - sq(a), (a + c) / 2, Math.max(1, b - k)];
    return {
      prompt: `A right-angled triangle has two sides of length ${f(g1)} and ${f(g2)}.${findHyp ? ' Neither of them is the hypotenuse.' : ` The hypotenuse is ${f(g2)}.`}<br>What is the length of the third side?`,
      answer: f(ans),
      distractors: fmtVals(wrong.filter((v) => nice(v, 2)), f),
      typed: { kind: 'number', value: ans },
      solution: [
        findHyp ? `The third side is the hypotenuse, so add the squares: $${sqs(a)} + ${sqs(b)} = ${tnum(sq(a))} + ${tnum(sq(b))} = ${tnum(sq(a) + sq(b))}$`
          : `The third side is a shorter side, so subtract the squares: $${sqs(c)} - ${sqs(a)} = ${tnum(sq(c))} - ${tnum(sq(a))} = ${tnum(tidy(sq(c) - sq(a)))}$`,
        `Square root: $\\sqrt{${tnum(findHyp ? sq(a) + sq(b) : tidy(sq(c) - sq(a)))}} = ${tnum(ans)}$`,
        `Answer: <b>${f(ans)}</b>`,
      ],
    };
  }
  if (mode === 'check') {
    const isRight = chance(rng, 0.5);
    const stepC = k < 1 ? k : 1;
    const cc = isRight ? c : tidy(c + (chance(rng) || c - stepC <= b ? 1 : -1) * stepC);
    const lhs = tidy(sq(a) + sq(b)); const rhs = sq(cc);
    const ang = Math.acos((b * b + cc * cc - a * a) / (2 * b * cc));
    const vis = fig({
      pts: { P: [0, 0], Q: [cc, 0], R: [b * Math.cos(ang), b * Math.sin(ang)] }, rotate: pick(rng, [0, 0, 180, 15, -10]),
      width: 320, height: 180,
      draw: (g) => g.poly('PQR') + g.side('P', 'Q', `${num(cc)} ${unit}`) + g.side('P', 'R', `${num(b)} ${unit}`) + g.side('Q', 'R', `${num(a)} ${unit}`),
    });
    const yes = `Yes, because $${sqs(a)} + ${sqs(b)} = ${sqs(cc)}$`;
    const no = `No, because $${sqs(a)} + ${sqs(b)} = ${tnum(lhs)}$ but $${sqs(cc)} = ${tnum(rhs)}$`;
    const ans = isRight ? yes : no;
    return {
      prompt: `Is this triangle right-angled? It is not drawn accurately, so you must calculate. (Sides ${num(a)} ${unit}, ${num(b)} ${unit} and ${num(cc)} ${unit}.)`,
      visual: vis,
      answer: ans,
      distractors: isRight
        ? [`No, because $${tnum(a)} + ${tnum(b)} \\ne ${tnum(cc)}$`, `No, because $${sqs(a)} + ${sqs(cc)} \\ne ${sqs(b)}$`, `Yes, because $${tnum(a)} + ${tnum(b)} > ${tnum(cc)}$`]
        : [`Yes, because $${sqs(a)} + ${sqs(b)}$ is close to $${sqs(cc)}$`, `Yes, because $${tnum(a)} + ${tnum(b)} > ${tnum(cc)}$`, `No, because $${tnum(a)} + ${tnum(b)} \\ne ${tnum(cc)}$`],
      count: 4,
      solution: [
        'If a triangle is right-angled, the squares of the two shorter sides add up to the square of the longest side.',
        `$${sqs(a)} + ${sqs(b)} = ${tnum(sq(a))} + ${tnum(sq(b))} = ${tnum(lhs)}$ and $${sqs(cc)} = ${tnum(rhs)}$.`,
        isRight ? 'They are equal, so the triangle <b>is</b> right-angled (the right angle is opposite the longest side).' : 'They are not equal, so the triangle is <b>not</b> right-angled – being close is not enough.',
        `Answer: ${ans}`,
      ],
    };
  }
  const fmt = (s) => s.map((v) => `${num(v)} ${unit}`).join(', ');
  const step = k < 1 ? k : 1;
  const wrongs = shuffle(rng, [
    [a, b, tidy(c + step)], [a, tidy(b + step), c], [tidy(a + step), b, c], [a, b, tidy(a + b)], [tidy(a - step), b, c], [a, tidy(b - step), c],
    [a, tidy(a + step), tidy(a + 2 * step)], [tidy(a + step), tidy(b + step), tidy(c + step)], [b, c, tidy(b + c - a)],
  ].filter((s) => s.every((v) => v > 0) && s[0] + s[1] > s[2] && Math.abs(s[0] * s[0] + s[1] * s[1] - s[2] * s[2]) > 1e-6));
  const check = (s) => `$${tnum(s[0])}^2 + ${tnum(s[1])}^2 = ${tnum(sq(s[0]) + sq(s[1]))}$ and $${tnum(s[2])}^2 = ${tnum(sq(s[2]))}$`;
  return {
    prompt: pick(rng, ['Which set of lengths could be the three sides of a <b>right-angled</b> triangle?', 'Only one of these sets of lengths makes a right-angled triangle. Which one?', 'Which of these sets of side lengths makes a <b>right-angled</b> triangle?']),
    answer: fmt([a, b, c]),
    distractors: wrongs.map(fmt),
    solution: [
      'In a right-angled triangle the two shorter sides squared add up to the longest side squared: $a^2 + b^2 = c^2$.',
      `Test each set. For ${fmt([a, b, c])}: ${check([a, b, c])} – equal ✓`,
      `For example ${fmt(wrongs[0])}: ${check(wrongs[0])} – not equal ✗`,
      `Answer: <b>${fmt([a, b, c])}</b>`,
    ],
  };
}, { title: 'Which lengths make a right-angled triangle?' });

export const pythExact = gen('trig-pyth-exact', 'trig-pythagoras', (rng, d) => {
  const unit = 'cm';
  let p; let q; let n; let hyp = true; let c2 = null;
  for (let i = 0; i < 200; i += 1) {
    if (d === 'easy') { p = int(rng, 1, 7); q = int(rng, 2, 9); n = p * p + q * q; if (p !== q && surd(n).k === 1 && !isSquare(n)) break; }
    else if (d === 'medium') { p = int(rng, 2, 9); q = int(rng, 2, 12); n = p * p + q * q; if (p !== q && surd(n).k > 1 && surd(n).s > 1) break; }
    else {
      // shorter side: hypotenuse given as a surd k√s
      hyp = false;
      p = int(rng, 1, 9); const k = int(rng, 2, 5); const s = pick(rng, [2, 3, 5, 6, 7, 10]); c2 = k * k * s; n = c2 - p * p;
      if (n > 1 && surd(n).k > 1 && surd(n).s > 1) { q = Math.sqrt(n); break; }
    }
  }
  const { k, s } = surd(n);
  const ans = `$${surdTex(k, s)}$ cm`;
  const sur = (m) => (m > 0 && !isSquare(m) ? `$${sqrtTex(m)}$ cm` : null);
  const vis = rightTriangleFig({
    angleA: deg(Math.atan2(hyp ? q : Math.sqrt(n), p)), rotate: pickRotation(rng, d), flip: chance(rng),
    sides: hyp ? { CA: L(p, unit), CB: L(q, unit), AB: 'x' } : { CA: L(p, unit), CB: 'x', AB: `${surdTex(surd(c2).k, surd(c2).s).replace(/\\sqrt\{(\d+)\}/, '√$1')} cm` },
  });
  const ds = hyp
    ? [`$${surdTex(k * k, s)}$ cm`, `$${surdTex(s, k)}$ cm`.replace('\\sqrt{1}', ''), sur(Math.abs(q * q - p * p)), sur(p + q), sur(2 * p + 2 * q), `$${surdTex(k, s + 1)}$ cm`, `$${surdTex(k + 1, s)}$ cm`, `$${surdTex(2 * k, s)}$ cm`]
    : [sur(c2 + p * p), `$${surdTex(k * k, s)}$ cm`, `$${surdTex(s, k)}$ cm`, `$${surdTex(k + 1, s)}$ cm`, sur(c2 - p), `$${surdTex(2 * k, s)}$ cm`, `$${surdTex(k, s + 1)}$ cm`];
  const cTex = c2 ? surdTex(surd(c2).k, surd(c2).s) : '';
  return {
    prompt: `Work out the <b>exact</b> value of $x$. Give your answer as a surd in its simplest form.`,
    visual: vis,
    answer: ans,
    distractors: ds.filter((t) => t && !/\\sqrt\{1\}|^\$1\\sqrt/.test(t) && t !== ans),
    solution: hyp ? [
      `$x$ is the hypotenuse: $x^2 = ${p}^2 + ${q}^2 = ${p * p} + ${q * q} = ${n}$`,
      `So $x = \\sqrt{${n}}$.`,
      ...(k > 1 ? [`Simplify: $${n} = ${k * k} \\times ${s}$, so $\\sqrt{${n}} = \\sqrt{${k * k}} \\times \\sqrt{${s}} = ${k}\\sqrt{${s}}$`] : [`${n} has no square factor (other than 1), so $\\sqrt{${n}}$ is already in its simplest form.`]),
      `Answer: ${ans}`,
    ] : [
      `$x$ is a shorter side, so subtract: $x^2 = (${cTex})^2 - ${p}^2$`,
      `$(${cTex})^2 = ${surd(c2).k}^2 \\times ${surd(c2).s} = ${c2}$, so $x^2 = ${c2} - ${p * p} = ${n}$`,
      `$x = \\sqrt{${n}} = \\sqrt{${k * k} \\times ${s}} = ${k}\\sqrt{${s}}$`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Exact answers (surds) with Pythagoras' });

// Spot the error in a student's working.
export const pythError = gen('trig-pyth-error', 'trig-pythagoras', (rng, d) => {
  const [p0, q0, c0] = triple(rng, { maxC: d === 'easy' ? 15 : 30 });
  const [p, q] = [Math.min(p0, q0), Math.max(p0, q0)];
  const c = c0;
  const who = names(rng, 1)[0];
  // Cases: what is unknown and which error
  const cases = [
    { key: 'add', unknownHyp: false, lines: [`$x^2 = ${c}^2 + ${p}^2$`, `$x^2 = ${c * c} + ${p * p} = ${c * c + p * p}$`, `$x = ${approxT(Math.sqrt(c * c + p * p))}$`],
      stmt: `${who} added the squares. $x$ is not the hypotenuse, so it should be $x^2 = ${c}^2 - ${p}^2$` },
    { key: 'noroot', unknownHyp: true, lines: [`$x^2 = ${p}^2 + ${q}^2$`, `$x^2 = ${p * p} + ${q * q}$`, `$x = ${c * c}$`],
      stmt: `${who} forgot to square root: $x = \\sqrt{${c * c}} = ${c}$` },
    { key: 'double', unknownHyp: true, lines: [`$x^2 = ${p}^2 + ${q}^2$`, `$x^2 = ${2 * p} + ${2 * q} = ${2 * (p + q)}$`, `$x = ${approxT(Math.sqrt(2 * (p + q)))}$`],
      stmt: `${who} doubled instead of squaring: $${p}^2 = ${p * p}$, not $${2 * p}$` },
    { key: 'sub', unknownHyp: true, lines: [`$x^2 = ${q}^2 - ${p}^2$`, `$x^2 = ${q * q} - ${p * p} = ${q * q - p * p}$`, `$x = ${approxT(Math.sqrt(q * q - p * p))}$`],
      stmt: `${who} subtracted. $x$ is the hypotenuse, so it should be $x^2 = ${p}^2 + ${q}^2$` },
    { key: 'rootterms', unknownHyp: true, lines: [`$x^2 = ${p}^2 + ${q}^2$`, `$x = ${p} + ${q}$`, `$x = ${p + q}$`],
      stmt: `${who} square-rooted each term: $\\sqrt{${p}^2 + ${q}^2}$ is not $${p} + ${q}$` },
  ];
  const pool = d === 'easy' ? cases.filter((k) => k.key !== 'rootterms') : cases;
  const cs = pick(rng, pool);
  // Make wrong statements about the *same* working, so they are plausible but false.
  const others = shuffle(rng, cases.filter((k) => k.key !== cs.key));
  const fakeStmts = others.map((k) => k.stmt);
  const vis = rightTriangleFig({
    angleA: deg(Math.atan2(cs.unknownHyp ? q : Math.sqrt(c * c - p * p), p)), rotate: pickRotation(rng, 'easy'), flip: chance(rng),
    sides: cs.unknownHyp ? { CA: `${p} cm`, CB: `${q} cm`, AB: 'x' } : { CA: `${p} cm`, CB: 'x', AB: `${c} cm` },
    width: 300, height: 190,
  });
  const right = cs.unknownHyp ? `$x = \\sqrt{${p * p} + ${q * q}} = ${c}$` : `$x = \\sqrt{${c * c} - ${p * p}} = ${q}$`;
  return {
    prompt: `${who} works out the value of $x$.<br>${cs.lines.join('<br>')}<br>Which statement describes ${who}'s mistake?`,
    visual: vis,
    answer: cs.stmt,
    distractors: fakeStmts,
    count: 4,
    solution: [
      cs.unknownHyp ? '$x$ is opposite the right angle, so it is the hypotenuse: add the squares, then square root.' : '$x$ is a shorter side (the hypotenuse is the side opposite the right angle): subtract the squares, then square root.',
      `The mistake: ${cs.stmt}.`,
      `Correct working: ${right} cm.`,
      `Answer: ${cs.stmt}`,
    ],
  };
}, { title: "Spot the error in someone's Pythagoras working" });

/* ------------------------------------------------------------------ */
/* trig-pythagoras-problems                                            */
/* ------------------------------------------------------------------ */

// Each context: { find: 'hyp' | 'leg', unit, scale: [lo, hi] range for the known lengths, make(v) -> prompt }
// v = { a, b, c } with a, b legs and c hypotenuse (known values formatted inside the template).
const W = (x, u) => `${num(x)} ${u}`;
const PYTH_CONTEXTS = [
  { find: 'hyp', aSmall: true, unit: 'm', k: [0.5, 1], lead: 'The ladder is the hypotenuse; the wall and ground are at right angles.',
    make: (v, u) => `The foot of a ladder is ${W(v.a, u)} from a vertical wall. The top of the ladder reaches ${W(v.b, u)} up the wall. How long is the ladder?` },
  { find: 'leg', shown: 'a', aSmall: true, unit: 'm', k: [0.5, 1], lead: 'The ladder is the hypotenuse; the height up the wall is a shorter side.',
    make: (v, u) => `A ladder ${W(v.c, u)} long leans against a vertical wall. Its foot is ${W(v.a, u)} from the wall on horizontal ground. How far up the wall does the ladder reach?` },
  { find: 'hyp', unit: 'cm', k: [2, 4], lead: 'The diagonal of the rectangular screen is the hypotenuse of a right-angled triangle.',
    make: (v, u) => `A rectangular TV screen is ${W(v.b, u)} wide and ${W(v.a, u)} high. Screens are measured by their diagonal. Work out the length of the diagonal.` },
  { find: 'hyp', unit: 'km', k: [1, 2], lead: 'North and east are at right angles, so the straight-line distance back is the hypotenuse.',
    make: (v, u) => `A ship sails ${W(v.a, u)} due north and then ${W(v.b, u)} due east. How far is the ship from its starting point?` },
  { find: 'leg', shown: 'a', unit: 'm', k: [2, 5], lead: 'The string is the hypotenuse; the height is a shorter side.',
    make: (v, u) => `A kite is on a string of length ${W(v.c, u)}. The kite is directly above a point on the ground ${W(v.a, u)} from where the string is held at ground level. How high is the kite?` },
  { find: 'hyp', aSmall: true, triples: [[7, 24, 25], [9, 40, 41], [12, 35, 37]], minRatio: 3, unit: 'm', k: [0.1], lead: 'The sloping surface of the ramp is the hypotenuse.',
    make: (v, u) => `A ramp rises ${W(v.a, u)} vertically over a horizontal distance of ${W(v.b, u)}. How long is the sloping surface of the ramp?` },
  { find: 'leg', shown: 'b', unit: 'm', k: [1, 2], lead: 'The wire is the hypotenuse; the pole is vertical so it meets the ground at a right angle.',
    make: (v, u) => `A wire ${W(v.c, u)} long runs from the top of a vertical flagpole to a peg in the ground. The flagpole is ${W(v.b, u)} tall. How far is the peg from the foot of the flagpole?` },
  { find: 'hyp', unit: 'cm', k: [5, 10], lead: 'The diagonal brace goes across a rectangle, so it is the hypotenuse.',
    make: (v, u) => `A rectangular gate is ${W(v.b, u)} wide and ${W(v.a, u)} tall. A wooden brace goes diagonally from one corner to the opposite corner. How long is the brace?` },
  { find: 'leg', shown: 'a', unit: 'cm', k: [1, 2], lead: 'The diagonal of the rectangle is the hypotenuse; the length is a shorter side.',
    make: (v, u) => `A rectangular photo frame has a diagonal of ${W(v.c, u)}. It is ${W(v.a, u)} wide. How tall is the frame?` },
  { find: 'hyp', unit: 'km', k: [5, 10], lead: 'West and south are at right angles, so the direct distance is the hypotenuse.',
    make: (v, u) => `A plane flies ${W(v.b, u)} due west and then ${W(v.a, u)} due south. How far is the plane from where it started?` },
  { find: 'leg', shown: 'b', unit: 'm', k: [0.5, 1], lead: 'The guy rope is the hypotenuse; the tent pole is vertical.',
    make: (v, u) => `A vertical tent pole is ${W(v.b, u)} tall. A guy rope ${W(v.c, u)} long is tied to the top of the pole and pegged to flat ground. How far is the peg from the bottom of the pole?` },
  { find: 'hyp', unit: 'm', k: [1, 2], lead: 'Swimming corner to corner across a rectangle: the diagonal is the hypotenuse.',
    make: (v, u) => `A rectangular swimming pool is ${W(v.b, u)} long and ${W(v.a, u)} wide. Ana swims in a straight line from one corner to the opposite corner. How far does she swim?` },
  { find: 'leg', shown: 'a', aSmall: true, unit: 'm', k: [0.5, 1], lead: 'The slide is the hypotenuse; the ladder of the slide is vertical.',
    make: (v, u) => `A playground slide is ${W(v.c, u)} long. The top of the slide is ${W(v.a, u)} above the ground, directly above the bottom of the vertical ladder. How far is the bottom of the slide from the bottom of the ladder?` },
  { find: 'hyp', unit: 'm', k: [5, 10], lead: 'The path cuts diagonally across a rectangle, so it is the hypotenuse.',
    make: (v, u) => `A rectangular park is ${W(v.b, u)} long and ${W(v.a, u)} wide. A straight path goes diagonally from one corner to the opposite corner. How long is the path?` },
  { find: 'leg', shown: 'b', aSmall: true, unit: 'cm', k: [1], lead: 'The diagonal of the phone screen is the hypotenuse; the width is a shorter side.',
    make: (v, u) => `A rectangular phone screen has a diagonal of ${W(v.c, u)} and a height of ${W(v.b, u)}. How wide is the screen?` },
  { find: 'hyp', unit: 'm', k: [1, 2], lead: 'The rope goes straight down a slope: horizontal and vertical are at right angles, so the rope is the hypotenuse.',
    make: (v, u) => `A rope is stretched in a straight line from the top of a cliff ${W(v.b, u)} high to a rock on flat ground ${W(v.a, u)} from the foot of the cliff. How long is the rope?` },
];

// Two-step contexts: a difference first (zip wire between posts, shortcut across a field).
export const pythWord = gen('trig-pyth-word', 'trig-pythagoras-problems', (rng, d) => {
  const ctxIndex = int(rng, 0, PYTH_CONTEXTS.length + 1);
  const r = d === 'easy' ? null : roundingFor(rng, d);
  if (ctxIndex >= PYTH_CONTEXTS.length) {
    // Special two-step contexts
    const u = 'm';
    const [a0, b0, c] = d === 'easy' ? triple(rng, { maxC: 30 }) : legsFor(rng, d === 'hard' ? 'hard' : 'medium');
    const a = Math.min(a0, b0); const b = Math.max(a0, b0);
    if (ctxIndex === PYTH_CONTEXTS.length) {
      // zip wire: posts of height h1 > h2, horizontal distance b, height difference a
      const h2 = d === 'hard' ? int(rng, 15, 40) / 10 : int(rng, 2, 5);
      const h1 = tidy(h2 + a);
      const f = (v) => (r ? `${r.fmt(v)} ${u}` : L(v, u));
      return {
        prompt: `A zip wire runs in a straight line from the top of a vertical post ${W(h1, u)} tall to the top of another vertical post ${W(h2, u)} tall. The posts stand on flat ground ${W(b, u)} apart. How long is the zip wire?${r ? ` ${r.text}` : ''}`,
        answer: f(c),
        distractors: fmtVals([Math.hypot(h1, b), Math.hypot(h2, b), Math.hypot(h1 + h2, b), a + b, Math.sqrt(Math.abs(b * b - a * a))].filter((v) => r || nice(v, 1)), f),
        typed: r ? r.typed(c) : typedInt(c),
        calculator: Boolean(r),
        solution: [
          `The difference in height of the posts is $${tnum(h1)} - ${tnum(h2)} = ${tnum(a)}$ m. This is the vertical side of a right-angled triangle; the horizontal side is ${W(b, u)}.`,
          `The wire is the hypotenuse: $x^2 = ${tnum(a)}^2 + ${tnum(b)}^2 = ${tnum(sq(a) + sq(b))}$`,
          `$x = \\sqrt{${tnum(sq(a) + sq(b))}} = ${r ? approxT(c) : tnum(c)}$`,
          `Answer: <b>${f(c)}</b>`,
        ],
      };
    }
    // shortcut: how much shorter is the diagonal than walking along two sides
    const save = a + b - c;
    const f = (v) => (r ? `${r.fmt(v)} ${u}` : L(v, u));
    return {
      prompt: `A rectangular field is ${W(b, u)} long and ${W(a, u)} wide. Kofi walks from one corner to the opposite corner. How much shorter is it to walk straight across the diagonal than to walk along the two edges?${r ? ` ${r.text}` : ''}`,
      answer: f(save),
      distractors: fmtVals([c, a + b, sq(a) + sq(b) - c, Math.sqrt(Math.abs(b * b - a * a)), a + b - Math.sqrt(Math.abs(b * b - a * a)), 2 * (a + b) - c].filter((v) => r || nice(v, 1)), f),
      typed: r ? r.typed(save) : typedInt(save),
      calculator: Boolean(r),
      solution: [
        `Walking along two edges: $${tnum(a)} + ${tnum(b)} = ${tnum(a + b)}$ m.`,
        `The diagonal is the hypotenuse: $\\sqrt{${tnum(a)}^2 + ${tnum(b)}^2} = \\sqrt{${tnum(sq(a) + sq(b))}} = ${r ? approxT(c) : tnum(c)}$ m.`,
        `Difference: $${tnum(a + b)} - ${r ? approxT(c) : tnum(c)} = ${r ? approxT(save) : tnum(save)}$ m.`,
        `Answer: <b>${f(save)}</b>`,
      ],
    };
  }
  const ctx = PYTH_CONTEXTS[ctxIndex];
  const u = ctx.unit;
  const kScale = pick(rng, ctx.k);
  let a; let b; let c;
  if (d === 'easy') {
    [a, b, c] = triple(rng, { maxC: 30, ...(ctx.triples ? { primitives: ctx.triples, maxC: 41 } : {}) }).map((v) => tidy(v * kScale));
    if (ctx.aSmall && a > b) [a, b] = [b, a];
  } else {
    let [p, q] = legsFor(rng, d === 'hard' ? 'hard' : 'medium');
    if (ctx.aSmall && p > q) [p, q] = [q, p];
    if (ctx.minRatio && q < p * ctx.minRatio) q = d === 'hard' ? roundTo(p * ctx.minRatio + int(rng, 1, 20) / 10, 1) : Math.ceil(p * ctx.minRatio) + int(rng, 0, 4);
    a = roundTo(p * kScale, 1); b = roundTo(q * kScale, 1);
    c = Math.hypot(a, b);
    if (ctx.find === 'leg') {
      // the hypotenuse is a given measurement: round it up to a tidy value, then recompute the unknown leg
      const step = kScale < 1 ? 0.1 : d === 'hard' ? 0.1 : 1;
      c = tidy(Math.ceil((c + step * 0.5) / step) * step);
      if (ctx.shown === 'a') b = Math.sqrt(c * c - a * a); else a = Math.sqrt(c * c - b * b);
    }
  }
  const shownLeg = ctx.find === 'leg' ? (ctx.shown === 'a' ? a : b) : null;
  const unknown = ctx.find === 'hyp' ? c : (ctx.shown === 'a' ? b : a);
  const f = (v) => (r ? `${r.fmt(v)} ${u}` : L(v, u));
  const wrong = ctx.find === 'hyp'
    ? [Math.sqrt(Math.abs(b * b - a * a)), a + b, sq(a) + sq(b) < 3000 ? sq(a) + sq(b) : NaN, Math.sqrt(2 * (a + b))]
    : [Math.hypot(c, shownLeg), c - shownLeg, sq(c) - sq(shownLeg) < 3000 ? sq(c) - sq(shownLeg) : NaN, c + shownLeg, Math.sqrt(2 * (c - shownLeg))];
  const vals = { a, b, c };
  const prompt = ctx.make(vals, u);
  return {
    prompt: `${prompt}${r ? ` ${r.text}` : ''}`,
    answer: f(unknown),
    distractors: fmtVals(r ? wrong : wrong.filter((v) => nice(v, 1)), f),
    typed: r ? r.typed(unknown) : { kind: 'number', value: unknown },
    calculator: Boolean(r),
    hint: 'Sketch a right-angled triangle and mark which side is the hypotenuse.',
    solution: ctx.find === 'hyp' ? [
      ctx.lead,
      `$h^2 = ${tnum(a)}^2 + ${tnum(b)}^2 = ${tnum(sq(a))} + ${tnum(sq(b))} = ${tnum(sq(a) + sq(b))}$`,
      `$h = \\sqrt{${tnum(sq(a) + sq(b))}} = ${r ? approxT(c) : tnum(c)}$`,
      `Answer: <b>${f(c)}</b>`,
    ] : [
      ctx.lead,
      `Subtract the squares: $x^2 = ${tnum(c)}^2 - ${tnum(shownLeg)}^2 = ${tnum(sq(c))} - ${tnum(sq(shownLeg))} = ${tnum(tidy(sq(c) - sq(shownLeg)))}$`,
      `$x = \\sqrt{${tnum(tidy(sq(c) - sq(shownLeg)))}} = ${r ? approxT(unknown) : tnum(unknown)}$`,
      `Answer: <b>${f(unknown)}</b>`,
    ],
  };
}, { title: 'Pythagoras in context (ladders, ships, screens…)', word: true });

export const pythCoords = gen('trig-pyth-coords', 'trig-pythagoras-problems', (rng, d) => {
  let dx; let dy;
  if (d === 'hard' || d === 'medium') {
    do { dx = int(rng, 2, 9); dy = int(rng, 2, 9); } while (isSquare(dx * dx + dy * dy) || dx === dy);
  } else {
    [dx, dy] = pick(rng, [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [4, 3], [3, 4]]);
  }
  const lim = d === 'easy' ? [1, 2] : [-6, 3];
  const x1 = int(rng, lim[0], lim[1]); const y1 = int(rng, lim[0], lim[1]);
  const sx = d === 'easy' ? 1 : pick(rng, [1, -1]); const sy = d === 'easy' ? pick(rng, [1, -1]) : pick(rng, [1, -1]);
  let x2 = x1 + sx * dx; let y2 = y1 + sy * dy;
  if (d === 'easy' && y2 < 0) { y2 = y1 + dy; }
  const n = dx * dx + dy * dy; const dist = Math.sqrt(n);
  const exact = d === 'hard' && chance(rng, 0.5);
  const r = d === 'easy' ? null : DP1;
  const fmtP = (x, y) => `(${tnum(x)}, ${tnum(y)})`;
  let ans; let distractors; let typed;
  const wrongVals = [dx + dy, n, Math.sqrt(Math.abs(dx * dx - dy * dy)), Math.hypot(x1 + x2, y1 + y2), Math.sqrt(2 * (dx + dy))];
  if (exact) {
    ans = `$${sqrtTex(n)}$`;
    distractors = [`$${sqrtTex(dx + dy)}$`, `$${tnum(n)}$`, isSquare(Math.abs(dx * dx - dy * dy)) ? null : `$${sqrtTex(Math.abs(dx * dx - dy * dy))}$`, `$${sqrtTex(2 * (dx + dy))}$`, `$${sqrtTex(n + 2 * dx * dy)}$`].filter((t) => t && t !== ans && !/\\sqrt\{1\}/.test(t));
    typed = undefined;
  } else if (r) {
    ans = r.fmt(dist); distractors = fmtVals(wrongVals, r.fmt); typed = r.typed(dist);
  } else {
    ans = num(dist); distractors = fmtVals(wrongVals.filter(Number.isInteger), num); typed = typedInt(dist);
  }
  let visual;
  if (d === 'easy') {
    const xmax = Math.max(x1, x2) + 1; const ymax = Math.max(y1, y2) + 1;
    const pl = plane({ xmin: 0, xmax, ymin: 0, ymax, unitPx: Math.min(26, 300 / xmax, 260 / ymax) });
    visual = pl.wrap(pl.point(x1, y1, 'A', { dx: -10, dy: y1 > y2 ? -12 : 12 }) + pl.point(x2, y2, 'B', { dx: 10, dy: y2 > y1 ? -12 : 12 }));
  }
  return {
    prompt: `$A$ is the point $${fmtP(x1, y1)}$ and $B$ is the point $${fmtP(x2, y2)}$.<br>Work out the length of the line segment $AB$.${exact ? ' Give your answer as a surd in its simplest form.' : r ? ` ${r.text}` : ''}`,
    visual,
    answer: ans,
    distractors,
    typed,
    calculator: Boolean(r) && !exact,
    solution: [
      `Make a right-angled triangle: across $${tnum(x2)} - ${x1 < 0 ? `(${tnum(x1)})` : tnum(x1)} = ${tnum(x2 - x1)}$ and up/down $${tnum(y2)} - ${y1 < 0 ? `(${tnum(y1)})` : tnum(y1)} = ${tnum(y2 - y1)}$.`,
      `$AB$ is the hypotenuse: $AB^2 = ${dx}^2 + ${dy}^2 = ${dx * dx} + ${dy * dy} = ${n}$ (squares are never negative).`,
      `$AB = \\sqrt{${n}}${exact ? (surd(n).k > 1 ? ` = ${sqrtTex(n)}` : '') : ` = ${r ? approxT(dist) : tnum(dist)}`}$`,
      `Answer: ${exact ? ans : `<b>${ans}</b>`}`,
    ],
  };
}, { title: 'Distance between two points' });

/** Isosceles triangle with apex A, base BC, foot of perpendicular M. */
function isoFig({ halfBase, height, labels = {}, showHeight = true, rotate = 0 }) {
  return fig({
    pts: { A: [0, height], B: [-halfBase, 0], C: [halfBase, 0], M: [0, 0] }, rotate, width: 320, height: 210,
    draw: (g) => {
      let out = g.poly('ABC');
      out += g.ticks('A', 'B') + g.ticks('A', 'C');
      if (showHeight) out += g.seg('A', 'M', { dash: '5 4', width: 1.6 }) + g.right('M', 'C', 'A', 10);
      if (labels.AB) out += g.side('A', 'B', labels.AB, { t: 0.42 });
      if (labels.AC) out += g.side('A', 'C', labels.AC, { t: 0.42 });
      if (labels.BC) out += g.side('B', 'C', labels.BC);
      if (labels.AM) out += g.side('M', 'A', labels.AM, { inside: 'C', t: 0.45 });
      return out;
    },
  });
}

export const pythIsosceles = gen('trig-pyth-isosceles', 'trig-pythagoras-problems', (rng, d) => {
  const unit = 'cm';
  // equal sides s, base b = 2h0, height h
  let half; let h; let s;
  if (d === 'hard') {
    half = int(rng, 30, 90) / 10; s = roundTo(half + int(rng, 15, 60) / 10, 1); h = Math.sqrt(s * s - half * half);
  } else {
    [half, h, s] = triple(rng, { maxC: 26 });
    if (half > h * 1.6) [half, h] = [h, half];
  }
  const mode = d === 'easy' ? 'height' : d === 'medium' ? pick(rng, ['area', 'height']) : pick(rng, ['area', 'area', 'height']);
  const r = d === 'hard' ? roundingFor(rng, d) : null;
  const f = (v, u = unit) => (r ? `${r.fmt(v)} ${u}` : L(v, u));
  const base = 2 * half;
  const vis = isoFig({ halfBase: half, height: Math.max(h, half * 0.7), labels: { AB: `${num(s)} cm`, AC: `${num(s)} cm`, BC: `${num(base)} cm`, AM: mode === 'height' ? 'h' : null }, showHeight: mode === 'height' });
  if (mode === 'height') {
    const wrong = [Math.sqrt(Math.max(0, s * s - base * base)) || NaN, Math.hypot(s, half), s - half, Math.sqrt(s * s + base * base), half + s];
    return {
      prompt: `The diagram shows an isosceles triangle. Work out the perpendicular height $h$.${r ? ` ${r.text}` : ''}`,
      visual: vis,
      answer: f(h),
      distractors: fmtVals(r ? wrong : wrong.filter((v) => nice(v)), (v) => f(v)),
      typed: r ? r.typed(h) : typedInt(h),
      calculator: Boolean(r),
      solution: [
        `The height splits the isosceles triangle into two identical right-angled triangles, so it cuts the base in half: $${tnum(base)} \\div 2 = ${tnum(half)}$ cm.`,
        `In one half, the hypotenuse is ${num(s)} cm: $h^2 = ${tnum(s)}^2 - ${tnum(half)}^2 = ${tnum(sq(s))} - ${tnum(sq(half))} = ${tnum(tidy(sq(s) - sq(half)))}$`,
        `$h = \\sqrt{${tnum(tidy(sq(s) - sq(half)))}} = ${r ? approxT(h) : tnum(h)}$`,
        `Answer: <b>${f(h)}</b>. Don't forget to halve the base!`,
      ],
    };
  }
  const area = half * h;
  const fa = (v) => (r ? `${r.fmt(v)} cm²` : `${num(tidy(v))} cm²`);
  const wrong = [base * h, half * s, base * s / 2, (Math.sqrt(Math.max(0, s * s - base * base)) || NaN) * half, half * h / 2, base * s];
  return {
    prompt: `The diagram shows an isosceles triangle. Work out its area.${r ? ` ${r.text}` : ''}`,
    visual: vis,
    answer: fa(area),
    distractors: fmtVals(r ? wrong : wrong.filter((v) => nice(v)), fa),
    typed: r ? r.typed(area) : typedInt(area),
    calculator: Boolean(r),
    solution: [
      `Area $= \\frac{1}{2} \\times \\text{base} \\times \\text{perpendicular height}$, so first find the height (it is not ${num(s)} cm – that side is sloping).`,
      `The height cuts the base in half: ${num(half)} cm. Pythagoras: $h^2 = ${tnum(s)}^2 - ${tnum(half)}^2 = ${tnum(tidy(sq(s) - sq(half)))}$, $h = ${r ? approxT(h) : tnum(h)}$ cm.`,
      `Area $= \\frac{1}{2} \\times ${tnum(base)} \\times ${r ? approxT(h) : tnum(h)} = ${r ? approxT(area) : tnum(area)}$`,
      `Answer: <b>${fa(area)}</b>`,
    ],
  };
}, { title: 'Isosceles triangles: height and area' });

/** Triples grouped by a shared leg, for two-triangle problems. */
const SHARED_LEG = (() => {
  const m = new Map();
  for (const t of allTriples(65)) for (const leg of [t[0], t[1]]) {
    const other = leg === t[0] ? t[1] : t[0];
    if (!m.has(leg)) m.set(leg, []);
    m.get(leg).push([other, t[2]]);
  }
  return [...m.entries()].filter(([, v]) => v.length >= 2).filter(([leg]) => leg <= 24);
})();

export const pythTwoTriangles = gen('trig-pyth-two-triangles', 'trig-pythagoras-problems', (rng, d) => {
  const unit = 'cm';
  const config = d === 'easy' ? 'altitude' : pick(rng, ['altitude', 'spiral']);
  const r = d === 'easy' ? null : roundingFor(rng, d);
  const f = (v) => (r ? `${r.fmt(v)} ${unit}` : L(v, unit));
  if (config === 'altitude') {
    // D - B - C on a line, A above B. Know AD, DB, BC; find AC.
    let h; let db; let ad; let bc; let ac;
    if (d === 'easy') {
      const [leg, pairs] = pick(rng, SHARED_LEG);
      const [p1, p2] = shuffle(rng, pairs).slice(0, 2);
      h = leg; [db, ad] = p1; [bc, ac] = p2;
    } else {
      h = int(rng, 5, 14); db = int(rng, 3, 12); const hy = Math.hypot(h, db);
      ad = d === 'hard' ? roundTo(hy + int(rng, 1, 9) / 10, 1) : Math.floor(hy) + 1;
      h = Math.sqrt(ad * ad - db * db); bc = intExceptLocal(rng, 4, 16, db); ac = Math.hypot(h, bc);
    }
    const vis = fig({
      pts: (() => { const hD = Math.max(h, (db + bc) * 0.35); return { D: [-Math.max(db, hD * 0.5), 0], B: [0, 0], C: [Math.max(bc, hD * 0.5), 0], A: [0, hD] }; })(), width: 380, height: 210,
      draw: (g) => g.poly('ADC') + g.seg('A', 'B', { width: 2 }) + g.right('B', 'C', 'A', 10)
        + g.side('A', 'D', L(ad, unit)) + g.side('D', 'B', L(db, unit)) + g.side('B', 'C', L(bc, unit)) + g.polyNames('ADBC'.split('').filter((x) => x !== 'B'))
        + g.name('B', 'B', { dir: [0, 1] }),
    });
    const wrong = [Math.hypot(ad, bc), Math.sqrt(Math.abs(bc * bc - h * h)), h + bc, Math.hypot(db + bc, h), sq(h) + sq(bc) < 2000 ? sq(h) + sq(bc) : NaN, Math.hypot(ad, db + bc)];
    return {
      prompt: `$DBC$ is a straight line and $AB$ is perpendicular to $DC$.<br>Work out the length of $AC$.${r ? ` ${r.text}` : ''}`,
      visual: vis,
      answer: f(ac),
      distractors: fmtVals(r ? wrong : wrong.filter((v) => nice(v)), f),
      typed: r ? r.typed(ac) : typedInt(ac),
      calculator: Boolean(r),
      solution: [
        `Two steps. First use triangle $ABD$ to find the shared side $AB$. $AD$ is its hypotenuse, so subtract:`,
        `$AB^2 = ${tnum(ad)}^2 - ${tnum(db)}^2 = ${tnum(tidy(sq(ad) - sq(db)))}$, so $AB = ${r ? approxT(h) : tnum(h)}$ cm. (Keep the full value on your calculator.)`,
        `Now triangle $ABC$: $AC$ is the hypotenuse, so add: $AC^2 = AB^2 + ${tnum(bc)}^2 = ${r ? approxT(h * h) : tnum(h * h)} + ${tnum(sq(bc))} = ${r ? approxT(h * h + bc * bc) : tnum(h * h + bc * bc)}$`,
        `$AC = ${r ? approxT(ac) : tnum(ac)}$. Answer: <b>${f(ac)}</b>`,
      ],
    };
  }
  // spiral: ABC right-angled at B, ACD right-angled at C. Know AB, BC, CD -> AD
  const ab = int(rng, 3, 10); const bc = int(rng, 3, 10); const cd = int(rng, 3, 12);
  const ac = Math.hypot(ab, bc); const ad = Math.hypot(ac, cd);
  const ang1 = Math.atan2(bc, ab); // angle BAC
  const B = [ab, 0]; const C = [ab, bc];
  // D is perpendicular to AC at C, on the far side from B
  const u = [-Math.sin(ang1), Math.cos(ang1)];
  const D = [C[0] + u[0] * cd, C[1] + u[1] * cd];
  const vis = fig({
    pts: { A: [0, 0], B, C, D }, rotate: pick(rng, [0, 0, 20, -15]), width: 360, height: 240,
    draw: (g) => g.poly('ABCD', { fill: FILL }) + g.seg('A', 'C') + g.right('B', 'A', 'C', 10) + g.right('C', 'A', 'D', 10)
      + g.side('A', 'B', L(ab, unit)) + g.side('B', 'C', L(bc, unit)) + g.side('C', 'D', L(cd, unit)) + g.polyNames('ABCD'),
  });
  const wrong = [Math.hypot(ab, cd), ab + bc + cd, Math.hypot(ab + bc, cd), Math.sqrt(Math.abs(cd * cd - ac * ac)), Math.hypot(ab, bc) + cd, Math.hypot(bc, cd)];
  return {
    prompt: `The diagram shows two right-angled triangles $ABC$ and $ACD$.<br>Work out the length of $AD$.${r ? ` ${r.text}` : ''}`,
    visual: vis,
    answer: f(ad),
    distractors: fmtVals(wrong, f),
    typed: r.typed(ad),
    calculator: true,
    solution: [
      `First find the shared side $AC$ in triangle $ABC$ (hypotenuse $AC$): $AC^2 = ${ab}^2 + ${bc}^2 = ${ab * ab + bc * bc}$.`,
      `Triangle $ACD$ has its right angle at $C$, so $AD$ is the hypotenuse: $AD^2 = AC^2 + ${cd}^2 = ${ab * ab + bc * bc} + ${cd * cd} = ${ab * ab + bc * bc + cd * cd}$.`,
      `(No need to square root $AC$ first – you need $AC^2$ anyway.) $AD = \\sqrt{${ab * ab + bc * bc + cd * cd}} = ${approxT(ad)}$`,
      `Answer: <b>${f(ad)}</b>`,
    ],
  };
}, { title: 'Two connected right-angled triangles' });

export const pythComposite = gen('trig-pyth-composite', 'trig-pythagoras-problems', (rng, d) => {
  const unit = 'cm';
  const mode = d === 'easy' ? 'trap' : pick(rng, ['trap', 'area']);
  if (mode === 'trap') {
    // right trapezium ABCD: A bottom-left, B bottom-right, C top-right, D top-left. AD vertical height.
    let diff; let h; let slant;
    if (d === 'hard') { do { diff = int(rng, 3, 12); h = int(rng, 4, 12); slant = Math.hypot(diff, h); } while (Number.isInteger(slant)); } else { [diff, h, slant] = triple(rng, { maxC: 26 }); }
    const top = int(rng, 4, 14); const bottom = top + diff;
    const r = d === 'hard' ? DP1 : null;
    const per = top + bottom + h + slant;
    const f = (v) => (r ? `${r.fmt(v)} ${unit}` : L(v, unit));
    const vis = fig({
      pts: { A: [0, 0], B: [bottom, 0], C: [top, Math.max(h, bottom * 0.3)], D: [0, Math.max(h, bottom * 0.3)] }, width: 380, height: 200,
      draw: (g) => g.poly('ABCD') + g.right('A', 'B', 'D', 11) + g.right('D', 'A', 'C', 11)
        + g.side('A', 'B', L(bottom, unit)) + g.side('D', 'C', L(top, unit)) + g.side('A', 'D', L(h, unit)),
    });
    const wrong = [top + bottom + h, top + bottom + h + Math.hypot(bottom, h), top + bottom + 2 * h, top + bottom + h + diff + h, 2 * (bottom + h), (top + bottom) * h / 2];
    return {
      prompt: `The diagram shows a trapezium. Work out its perimeter.${r ? ` ${r.text}` : ''}`,
      visual: vis,
      answer: f(per),
      distractors: fmtVals(r ? wrong : wrong.filter((v) => nice(v)), f),
      typed: r ? r.typed(per) : typedInt(per),
      calculator: Boolean(r),
      solution: [
        `The sloping side is missing. Split the trapezium into a rectangle and a right-angled triangle.`,
        `The triangle is $${bottom} - ${top} = ${diff}$ cm wide and ${h} cm tall, so the sloping side is $\\sqrt{${diff}^2 + ${h}^2} = \\sqrt{${diff * diff + h * h}} = ${r ? approxT(slant) : tnum(slant)}$ cm.`,
        `Perimeter $= ${bottom} + ${top} + ${h} + ${r ? approxT(slant) : tnum(slant)} = ${r ? approxT(per) : tnum(per)}$`,
        `Answer: <b>${f(per)}</b>`,
      ],
    };
  }
  // area of a right-angled triangle from hypotenuse and one side (medium), or from a ratio (hard)
  const [a0, b0, c0] = triple(rng, { maxC: d === 'hard' ? 60 : 30 });
  const a = a0; const b = b0; const c = c0;
  const area = (a * b) / 2;
  const fa = (v) => `${num(tidy(v))} cm²`;
  const ratio = d === 'hard';
  const g0 = gcdLocal(a, c);
  const visual = rightTriangleFig({ angleA: deg(Math.atan2(b, a)), rotate: pickRotation(rng, 'easy'), flip: chance(rng), sides: ratio ? { CA: 'a', AB: 'c' } : { CA: `${a} cm`, AB: `${c} cm` } });
  const wrong = [a * c / 2, a * b, a * c, (a + b) * c / 2 / 2, Math.hypot(a, c) * a / 2, b * c / 2];
  return {
    prompt: ratio ? `In this right-angled triangle, $a = ${a}$ cm and $a : c = ${a / g0} : ${c / g0}$.<br>Work out the area of the triangle.` : 'Work out the area of this right-angled triangle.',
    visual,
    answer: fa(area),
    distractors: fmtVals(wrong.filter((v) => nice(v * 2)), fa),
    typed: typedInt(area),
    solution: [
      ...(ratio ? [`$a : c = ${a / g0} : ${c / g0}$ and $a = ${a}$, so one part is $${a} \\div ${a / g0} = ${tnum(a / (a / g0))}$ and $c = ${c / g0} \\times ${tnum(a / (a / g0))} = ${c}$ cm.`] : []),
      `The area needs the two sides that meet at the right angle. The hypotenuse (${c} cm) is not one of them.`,
      `Third side: $\\sqrt{${c}^2 - ${a}^2} = \\sqrt{${c * c - a * a}} = ${b}$ cm.`,
      `Area $= \\frac{1}{2} \\times ${a} \\times ${b} = ${tnum(area)}$. Answer: <b>${fa(area)}</b>`,
    ],
  };
}, { title: 'Perimeter and area problems needing Pythagoras' });

function gcdLocal(a, b) { while (b) [a, b] = [b, a % b]; return a; }

export const pythagorasGenerators = [pythHyp, pythShort, pythConverse, pythExact, pythError];
export const pythagorasProblemGenerators = [pythWord, pythCoords, pythIsosceles, pythTwoTriangles, pythComposite];

void [size, MUTED, svgText];

function intExceptLocal(rng, lo, hi, not) { for (;;) { const v = int(rng, lo, hi); if (v !== not) return v; } }
