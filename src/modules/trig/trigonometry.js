// Right-angled trigonometry: SOHCAHTOA for sides and angles, and exact trig values.
import { gen, pick, int, shuffle, names, num, tnum, roundTo, tidy, chance, frac, Frac } from '../../core.js';
import { fig, rightTriangleFig, FILL } from './diagrams.js';
import {
  DP1, roundingFor, L, A, At, fmtVals, sinD, cosD, tanD, asinD, acosD, atanD, approxT, pickRotation, rounding,
} from './helpers.js';

/* ------------------------------------------------------------------ */
/* Shared SOHCAHTOA machinery                                          */
/* ------------------------------------------------------------------ */

// Roles: opp, adj, hyp. Ratio for a pair of roles.
const RATIO = { 'opp,hyp': 'sin', 'hyp,opp': 'sin', 'adj,hyp': 'cos', 'hyp,adj': 'cos', 'opp,adj': 'tan', 'adj,opp': 'tan' };
const FN = { sin: sinD, cos: cosD, tan: tanD };
const INV = { sin: asinD, cos: acosD, tan: atanD };
const ROLE_NAME = { opp: 'opposite', adj: 'adjacent', hyp: 'hypotenuse' };
const LETTER = { sin: 'S', cos: 'C', tan: 'T' };
const MNEMONIC = { sin: 'SOH: $\\sin\\theta = \\frac{O}{H}$', cos: 'CAH: $\\cos\\theta = \\frac{A}{H}$', tan: 'TOA: $\\tan\\theta = \\frac{O}{A}$' };
const NUM_ROLE = { sin: 'opp', cos: 'adj', tan: 'opp' };
const DEN_ROLE = { sin: 'hyp', cos: 'hyp', tan: 'adj' };

/** Lengths of the three sides for angle th at A with one side known. */
function sidesFrom(th, role, value) {
  const s = sinD(th); const c = cosD(th);
  const hyp = role === 'hyp' ? value : role === 'opp' ? value / s : value / c;
  return { hyp, opp: hyp * s, adj: hyp * c };
}

/** x from known side k (role kr) for unknown role ur, plus every "wrong formula" value for distractors. */
function solveSide(th, kr, k, ur) {
  const fn = RATIO[`${kr},${ur}`];
  const numerator = ur === NUM_ROLE[fn]; // x on top -> multiply
  const x = sidesFrom(th, kr, k)[ur];
  const t = (f) => FN[f](th);
  const tr = (f) => Math.sin(th) * (f === 'sin' ? 1 : 0) + Math.cos(th) * (f === 'cos' ? 1 : 0) + Math.tan(th) * (f === 'tan' ? 1 : 0);
  const wrong = [
    numerator ? k / t(fn) : k * t(fn), // multiplied instead of divided (or vice versa)
    ...['sin', 'cos', 'tan'].filter((f) => f !== fn).flatMap((f) => [numerator ? k * t(f) : k / t(f), numerator ? k / t(f) : k * t(f)]),
    numerator ? k * tr(fn) : k / tr(fn), // calculator in radians
  ];
  return { x, fn, numerator, wrong };
}

/** Working lines for a side calculation. */
function sideWorking(th, kr, k, ur, unit, r, x, xName = 'x') {
  const fn = RATIO[`${kr},${ur}`];
  const numerator = ur === NUM_ROLE[fn];
  const top = numerator ? xName : tnum(k); const bottom = numerator ? tnum(k) : xName;
  const kTex = tnum(k);
  return [
    `From the $${At(th)}$ angle: $${xName}$ is the <b>${ROLE_NAME[ur]}</b> and ${L(k, unit)} is the <b>${ROLE_NAME[kr]}</b>. ${ROLE_NAME[ur].charAt(0).toUpperCase()} and ${ROLE_NAME[kr].charAt(0).toUpperCase()} → ${MNEMONIC[fn]}.`,
    `$\\${fn} ${At(th)} = \\frac{${top}}{${bottom}}$`,
    numerator ? `Multiply both sides by ${kTex}: $${xName} = ${kTex} \\times \\${fn} ${At(th)} = ${approxT(x)}$`
      : `Rearrange: $${xName} = \\frac{${kTex}}{\\${fn} ${At(th)}} = ${approxT(x)}$`,
    `Answer: <b>${r.fmt(x)} ${unit}</b> (${r.short})`,
  ];
}

/** Integer angle for calculator trig, avoiding 45 and multiples of 30 (they look like exact-value questions). */
function trigAngle(rng, lo = 22, hi = 68) {
  for (;;) { const a = int(rng, lo, hi); if (a !== 45 && a % 30 !== 0) return a; }
}

/** Sides object for the diagram: role -> label. A is the marked angle vertex, CA adjacent, CB opposite, AB hyp. */
const sideKeys = { adj: 'CA', opp: 'CB', hyp: 'AB' };

/* ------------------------------------------------------------------ */
/* trig-sohcahtoa-side                                                 */
/* ------------------------------------------------------------------ */

export const sohSide = gen('trig-soh-side', 'trig-sohcahtoa-side', (rng, d) => {
  const th = trigAngle(rng);
  const unit = pick(rng, ['cm', 'cm', 'm', 'mm']);
  const cases = {
    easy: [['hyp', 'opp'], ['hyp', 'adj'], ['adj', 'opp']],
    medium: [['hyp', 'opp'], ['hyp', 'adj'], ['adj', 'opp'], ['opp', 'hyp'], ['adj', 'hyp'], ['opp', 'adj']],
    hard: [['opp', 'hyp'], ['adj', 'hyp'], ['opp', 'adj'], ['hyp', 'opp'], ['opp', 'hyp']],
  }[d];
  const [kr, ur] = pick(rng, cases);
  const k = d === 'hard' ? int(rng, 25, 190) / 10 : int(rng, 4, 25);
  const r = roundingFor(rng, d);
  const { x, wrong } = solveSide(th, kr, k, ur);
  const f = (v) => `${r.fmt(v)} ${unit}`;
  const useNames = d === 'hard' && chance(rng, 0.5);
  const labels = { [sideKeys[kr]]: L(k, unit), [sideKeys[ur]]: useNames ? null : 'x' };
  const vis = rightTriangleFig({ angleA: th, angles: { A: `${th}°` }, sides: labels, rotate: pickRotation(rng, d), flip: chance(rng), names: useNames });
  const target = useNames ? { CA: 'AC', CB: 'BC', AB: 'AB' }[sideKeys[ur]] : 'x';
  return {
    prompt: `Work out the ${useNames ? `length of $${target}$` : 'value of $x$'}. ${r.text}`,
    visual: vis,
    answer: f(x),
    distractors: fmtVals(wrong, f),
    typed: r.typed(x),
    calculator: true,
    hint: 'Label the sides opposite, adjacent and hypotenuse from the marked angle, then choose sin, cos or tan.',
    solution: sideWorking(th, kr, k, ur, unit, r, x, target),
  };
}, { title: 'Find a side with sin, cos or tan' });

export const sohWhich = gen('trig-soh-which', 'trig-sohcahtoa-side', (rng, d) => {
  if (d === 'hard') { rng(); rng(); } // hard draws its own numbers, never a copy of easy
  const th = trigAngle(rng);
  const unit = 'cm';
  const [kr, ur] = pick(rng, d === 'easy' ? [['hyp', 'opp'], ['hyp', 'adj'], ['adj', 'opp']] : [['hyp', 'opp'], ['hyp', 'adj'], ['adj', 'opp'], ['opp', 'hyp'], ['adj', 'hyp'], ['opp', 'adj']]);
  const k = int(rng, 4, 20);
  const fn = RATIO[`${kr},${ur}`];
  const numerator = ur === NUM_ROLE[fn];
  const forms = [];
  for (const f of ['sin', 'cos', 'tan']) {
    forms.push({ f, mul: true, tex: `$x = ${k}\\${f} ${At(th)}$` });
    forms.push({ f, mul: false, tex: `$x = \\frac{${k}}{\\${f} ${At(th)}}$` });
  }
  const ans = forms.find((o) => o.f === fn && o.mul === numerator).tex;
  // Most tempting first: same ratio other operation, then other ratios.
  const ds = [forms.find((o) => o.f === fn && o.mul !== numerator).tex, ...shuffle(rng, forms.filter((o) => o.f !== fn).map((o) => o.tex))];
  if (d === 'hard') ds.push(`$x = \\frac{\\${fn} ${At(th)}}{${k}}$`);
  const vis = rightTriangleFig({ angleA: th, angles: { A: `${th}°` }, sides: { [sideKeys[kr]]: L(k, unit), [sideKeys[ur]]: 'x' }, rotate: pickRotation(rng, d), flip: chance(rng) });
  const top = numerator ? 'x' : k; const bottom = numerator ? k : 'x';
  return {
    prompt: 'Which equation gives the value of $x$?',
    visual: vis,
    answer: ans,
    distractors: ds,
    solution: [
      `Label the sides from the $${At(th)}$ angle: $x$ is the ${ROLE_NAME[ur]} and ${k} cm is the ${ROLE_NAME[kr]}.`,
      `${ROLE_NAME[ur].charAt(0).toUpperCase()} and ${ROLE_NAME[kr].charAt(0).toUpperCase()} → ${MNEMONIC[fn]}, so $\\${fn} ${At(th)} = \\frac{${top}}{${bottom}}$.`,
      numerator ? `$x$ is on top, so multiply: ${ans}` : `$x$ is on the bottom, so it swaps with $\\${fn} ${At(th)}$: ${ans}`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Which trig equation? (choose the ratio)' });

// Word contexts: role of known side (kr) and unknown (ur) relative to the angle; ranges for k.
const SIDE_CONTEXTS = [
  { kr: 'hyp', ur: 'opp', unit: 'm', k: [3, 9], ang: [62, 80], make: (k, a) => `A ladder ${k} m long leans against a vertical wall. The ladder makes an angle of ${a}° with the horizontal ground. How far up the wall does the ladder reach?` },
  { kr: 'hyp', ur: 'adj', unit: 'm', k: [3, 9], ang: [62, 80], make: (k, a) => `A ladder ${k} m long leans against a vertical wall, making an angle of ${a}° with the ground. How far is the foot of the ladder from the wall?` },
  { kr: 'adj', ur: 'opp', unit: 'm', k: [15, 60], ang: [20, 55], make: (k, a) => `Maya stands ${k} m from the base of a vertical tree on level ground. The angle of elevation of the top of the tree from her feet is ${a}°. How tall is the tree?` },
  { kr: 'opp', ur: 'adj', unit: 'm', k: [20, 80], ang: [8, 35], make: (k, a) => `From the top of a lighthouse ${k} m high, the angle of depression of a boat is ${a}°. How far is the boat from the base of the lighthouse?`, note: 'The angle of depression from the top equals the angle of elevation from the boat (alternate angles), so the angle in the triangle at the boat is ' },
  { kr: 'hyp', ur: 'opp', unit: 'm', k: [20, 60], ang: [30, 65], make: (k, a) => `A kite is flying on a straight string ${k} m long. The string makes an angle of ${a}° with the horizontal. How high is the kite above the point where the string is held?` },
  { kr: 'opp', ur: 'hyp', unit: 'm', k: [0.5, 1.5], dp: 1, ang: [4, 12], make: (k, a) => `A ramp rises ${k} m vertically. It makes an angle of ${a}° with the horizontal ground. How long is the sloping surface of the ramp?` },
  { kr: 'hyp', ur: 'opp', unit: 'km', k: [2, 9], ang: [8, 20], make: (k, a) => `A plane takes off and climbs in a straight line at an angle of ${a}° to the horizontal. How high is the plane after it has flown ${k} km along this line?` },
  { kr: 'opp', ur: 'adj', unit: 'm', k: [15, 60], ang: [20, 60], make: (k, a) => `A vertical tower is ${k} m tall. The sun is at an angle of elevation of ${a}°. How long is the tower's shadow on the flat ground?` },
  { kr: 'hyp', ur: 'opp', unit: 'm', k: [12, 30], ang: [25, 35], make: (k, a) => `An escalator is ${k} m long and slopes at ${a}° to the horizontal. How high does it lift people?` },
  { kr: 'hyp', ur: 'adj', unit: 'm', k: [2.5, 6], dp: 1, ang: [25, 50], make: (k, a) => `A straight playground slide is ${k} m long and makes an angle of ${a}° with the ground. How far is it horizontally from the top of the slide to the bottom?` },
  { kr: 'hyp', ur: 'opp', unit: 'm', k: [15, 40], ang: [35, 70], make: (k, a) => `The jib of a crane is ${k} m long. It is raised to an angle of ${a}° above the horizontal. How high is the end of the jib above the pivot?` },
  { kr: 'opp', ur: 'hyp', unit: 'm', k: [10, 40], ang: [10, 25], make: (k, a) => `A zip wire runs from the top of a tower ${k} m high down to the ground. The wire makes an angle of ${a}° with the ground. How long is the zip wire?` },
  { kr: 'adj', ur: 'hyp', unit: 'm', k: [3, 6], dp: 1, ang: [25, 45], make: (k, a) => `The roof of a shed slopes at ${a}° to the horizontal. The sloping roof covers a horizontal distance of ${k} m. How long is the sloping roof?` },
  { kr: 'opp', ur: 'adj', unit: 'm', k: [30, 120], ang: [15, 50], make: (k, a) => `A drone is hovering ${k} m above the ground. From Leo's position on the ground, the angle of elevation of the drone is ${a}°. How far is Leo horizontally from the point directly below the drone?` },
  { kr: 'adj', ur: 'opp', unit: 'm', k: [50, 200], ang: [10, 30], make: (k, a) => `A boat is ${k} m from the foot of a vertical cliff. The angle of elevation of the top of the cliff from the boat is ${a}°. How high is the cliff?` },
  { kr: 'hyp', ur: 'opp', unit: 'm', k: [100, 800], ang: [3, 10], make: (k, a) => `A straight road up a hill is ${k} m long and slopes at ${a}° to the horizontal. How much height does a cyclist gain by riding up the road?` },
];

// Hard two-stage contexts: each returns { prompt, value, unit, wrong, sol } given (rng, r).
const HARD_SIDE_CONTEXTS = [
  (rng) => {
    const eye = pick(rng, [1.5, 1.6, 1.7]); const dd = int(rng, 12, 40); const th = trigAngle(rng, 25, 55);
    const v = dd * tanD(th) + eye;
    return { prompt: `${pick(rng, ['Maya', 'Priya', 'Isla', 'Zara'])} stands ${dd} m from the foot of a vertical tree on level ground. Her eyes are ${num(eye)} m above the ground. The angle of elevation of the top of the tree from her eyes is ${th}°. How tall is the tree?`, unit: 'm', value: v,
      wrong: [dd * tanD(th), dd * tanD(th) - eye, dd * sinD(th) + eye, dd / tanD(th) + eye],
      sol: [`From her eyes: the height above eye level is opposite the ${th}° angle and the ${dd} m is adjacent, so use tan.`, `Height above eye level $= ${dd} \\times \\tan ${At(th)} = ${approxT(dd * tanD(th))}$ m`, `Add her eye height: $${approxT(dd * tanD(th))} + ${tnum(eye)} = ${approxT(v)}$ m`] };
  },
  (rng) => {
    const h = int(rng, 30, 90); const a1 = trigAngle(rng, 25, 40); const a2 = a1 + int(rng, 8, 20);
    const near = h / tanD(a2); const far = h / tanD(a1); const v = far - near;
    return { prompt: `From the top of a lighthouse ${h} m above sea level, the angles of depression of two boats are ${a1}° and ${a2}°. The boats are in a straight line with the foot of the lighthouse. How far apart are the boats?`, unit: 'm', value: v,
      wrong: [far + near, h * tanD(a2) - h * tanD(a1), far, h / tanD(a2 - a1)],
      sol: [`The angles of depression equal the angles of elevation from the boats (alternate angles). Each boat gives a right-angled triangle with the ${h} m height opposite the angle.`, `Further boat: $\\frac{${h}}{\\tan ${At(a1)}} = ${approxT(far)}$ m. Nearer boat: $\\frac{${h}}{\\tan ${At(a2)}} = ${approxT(near)}$ m.`, `Distance apart $= ${approxT(far)} - ${approxT(near)} = ${approxT(v)}$ m`] };
  },
  (rng) => {
    const L0 = int(rng, 25, 70); const th = trigAngle(rng, 30, 65); const hand = pick(rng, [1.2, 1.4, 1.5]);
    const v = L0 * sinD(th) + hand;
    return { prompt: `A kite is on a straight string ${L0} m long. The string makes an angle of ${th}° with the horizontal and is held ${num(hand)} m above the ground. How high is the kite above the ground?`, unit: 'm', value: v,
      wrong: [L0 * sinD(th), L0 * cosD(th) + hand, L0 * tanD(th) + hand, L0 * sinD(th) - hand],
      sol: [`The string is the hypotenuse; the height above the hand is opposite the ${th}° angle, so use sin.`, `Height above the hand $= ${L0} \\times \\sin ${At(th)} = ${approxT(L0 * sinD(th))}$ m`, `Add the height of the hand: $${approxT(L0 * sinD(th))} + ${tnum(hand)} = ${approxT(v)}$ m`] };
  },
  (rng) => {
    const L0 = roundTo(4 + 4 * rng(), 1); const t1 = trigAngle(rng, 55, 65); const t2 = t1 + int(rng, 8, 15);
    const v = L0 * sinD(t2) - L0 * sinD(t1);
    return { prompt: `A ladder ${num(L0)} m long leans against a vertical wall at ${t1}° to the ground. It is moved so that it makes an angle of ${t2}° with the ground. How much higher up the wall does the top of the ladder now reach?`, unit: 'm', value: v,
      wrong: [L0 * sinD(t2), L0 * cosD(t1) - L0 * cosD(t2), L0 * sinD(t2 - t1), L0 * (tanD(t2) - tanD(t1))],
      sol: [`In each position the ladder is the hypotenuse and the height up the wall is opposite the angle: height $= ${tnum(L0)}\\sin\\theta$.`, `Before: $${tnum(L0)} \\sin ${At(t1)} = ${approxT(L0 * sinD(t1))}$ m. After: $${tnum(L0)} \\sin ${At(t2)} = ${approxT(L0 * sinD(t2))}$ m.`, `Difference $= ${approxT(v)}$ m`] };
  },
];

export const sohSideWord = gen('trig-soh-side-word', 'trig-sohcahtoa-side', (rng, d) => {
  if (d === 'hard' && chance(rng, 0.6)) {
    const hc = pick(rng, HARD_SIDE_CONTEXTS)(rng);
    const r = roundingFor(rng, d);
    const f = (v) => `${r.fmt(v)} ${hc.unit}`;
    return {
      prompt: `${hc.prompt} ${r.text}`,
      answer: f(hc.value),
      distractors: fmtVals(hc.wrong, f),
      typed: r.typed(hc.value),
      calculator: true,
      hint: 'Sketch it. Which right-angled triangle can you solve first?',
      solution: [...hc.sol, `Answer: <b>${f(hc.value)}</b> (${r.short})`],
    };
  }
  const ctx = pick(rng, SIDE_CONTEXTS);
  let th = int(rng, ctx.ang[0], ctx.ang[1]);
  if (th === 45 || th === 30 || th === 60) th += 1;
  const k = ctx.dp || d === 'hard' ? roundTo(ctx.k[0] + rng() * (ctx.k[1] - ctx.k[0]), 1) : int(rng, ctx.k[0], ctx.k[1]);
  const r = roundingFor(rng, d);
  const { x, wrong } = solveSide(th, ctx.kr, k, ctx.ur);
  const f = (v) => `${r.fmt(v)} ${ctx.unit}`;
  return {
    prompt: `${ctx.make(num(k), th)} ${r.text}`,
    answer: f(x),
    distractors: fmtVals(wrong, f),
    typed: r.typed(x),
    calculator: true,
    hint: 'Sketch the right-angled triangle, mark the angle, and label the sides O, A and H.',
    solution: [
      `Sketch a right-angled triangle.${ctx.note ? ` ${ctx.note}$${At(th)}$.` : ''}`,
      ...sideWorking(th, ctx.kr, k, ctx.ur, ctx.unit, r, x).map((s) => s.replace(/\$x\$ is/, 'the unknown $x$ is')),
    ],
  };
}, { title: 'Trigonometry in context: find a length', word: true });

/** Altitude figure: D—B—C on a line, A above B, with optional angle labels at D and C. */
function altitudeFig({ db, bc, h, labels = {}, angles = {} }) {
  const hD = Math.max(h, (db + bc) * 0.32);
  const pts = { D: [-Math.max(db, hD * 0.45), 0], B: [0, 0], C: [Math.max(bc, hD * 0.45), 0], A: [0, hD] };
  return fig({
    pts, width: 380, height: 210,
    draw: (g) => {
      let out = g.poly('ADC') + g.seg('A', 'B') + g.right('B', 'C', 'A', 10);
      if (angles.D) out += g.angle('D', 'B', 'A', angles.D);
      if (angles.C) out += g.angle('C', 'A', 'B', angles.C);
      for (const [k, v] of Object.entries(labels)) if (v) out += g.side(k[0], k[1], v, k === 'AB' ? { inside: 'C', t: 0.55 } : {});
      return out + g.polyNames(['A', 'D', 'C']) + g.name('B', 'B', { dir: [0, 1] });
    },
  });
}

export const sohTwoStep = gen('trig-soh-two-step', 'trig-sohcahtoa-side', (rng, d) => {
  const unit = 'cm';
  const alpha = trigAngle(rng, 35, 65); const beta = trigAngle(rng, 25, 60);
  const ad = d === 'hard' ? int(rng, 60, 180) / 10 : int(rng, 8, 20);
  const ab = ad * sinD(alpha); const db = ad * cosD(alpha);
  const askAC = d !== 'easy' && chance(rng, 0.5);
  const bc = ab / tanD(beta); const ac = ab / sinD(beta);
  const x = askAC ? ac : bc;
  const r = roundingFor(rng, d);
  const f = (v) => `${r.fmt(v)} ${unit}`;
  const vis = altitudeFig({ db, bc, h: ab, labels: { AD: L(ad, unit) }, angles: { D: `${alpha}°`, C: `${beta}°` } });
  const wrong = askAC
    ? [ab / tanD(beta), ad * cosD(alpha) / sinD(beta), ab * sinD(beta), ad / sinD(beta), ab / cosD(beta)]
    : [ab / sinD(beta), ab * tanD(beta), ad * cosD(alpha) / tanD(beta), ad / tanD(beta), ab * cosD(beta)];
  const tgt = askAC ? 'AC' : 'BC';
  return {
    prompt: `$DBC$ is a straight line and $AB$ is perpendicular to $DC$.<br>Work out the length of $${tgt}$. ${r.text}`,
    visual: vis,
    answer: f(x),
    distractors: fmtVals(wrong, f),
    typed: r.typed(x),
    calculator: true,
    solution: [
      `Step 1 – triangle $ABD$: $AB$ is opposite the $${At(alpha)}$ angle and $AD$ is the hypotenuse, so use sin.`,
      `$AB = ${tnum(ad)} \\times \\sin ${At(alpha)} = ${approxT(ab)}$ cm (keep this full value).`,
      askAC ? `Step 2 – triangle $ABC$: $AB$ is opposite the $${At(beta)}$ angle and $AC$ is the hypotenuse: $AC = \\frac{AB}{\\sin ${At(beta)}} = \\frac{${approxT(ab)}}{\\sin ${At(beta)}} = ${approxT(x)}$`
        : `Step 2 – triangle $ABC$: $AB$ is opposite the $${At(beta)}$ angle and $BC$ is adjacent, so use tan: $BC = \\frac{AB}{\\tan ${At(beta)}} = \\frac{${approxT(ab)}}{\\tan ${At(beta)}} = ${approxT(x)}$`,
      `Answer: <b>${f(x)}</b>`,
    ],
  };
}, { title: 'Two-step: two right-angled triangles' });

/* ------------------------------------------------------------------ */
/* trig-sohcahtoa-angle                                                */
/* ------------------------------------------------------------------ */

function angleWrong(fn, ratio, th) {
  return [
    90 - th,
    ...['sin', 'cos'].filter((f) => f !== fn && ratio <= 1).map((f) => INV[f](ratio)),
    fn !== 'tan' ? atanD(ratio) : NaN,
    atanD(1 / ratio),
    INV[fn](Math.min(1, roundTo(ratio, 1))), // rounded the ratio too early
    fn === 'tan' ? NaN : INV[fn](Math.min(1, 1 / ratio)),
  ];
}

function angleWorking(fn, top, bottom, kTop, kBot, th, xName = 'x') {
  return [
    `From angle $${xName}$: you know the <b>${ROLE_NAME[NUM_ROLE[fn]]}</b> and the <b>${ROLE_NAME[DEN_ROLE[fn]]}</b> → ${MNEMONIC[fn]}.`,
    `$\\${fn} ${xName} = \\frac{${top}}{${bottom}}$`,
    `Use the inverse: $${xName} = \\${fn}^{-1}\\left(\\frac{${top}}{${bottom}}\\right) = ${approxT(th)}^\\circ$`,
    `Answer: <b>${A(roundTo(th, 1), 1)}</b> (1 d.p.)`,
  ].map((s) => s.replace('{TOP}', kTop).replace('{BOT}', kBot));
}

export const sohAngle = gen('trig-soh-angle', 'trig-sohcahtoa-angle', (rng, d) => {
  const unit = 'cm';
  const fn = pick(rng, ['sin', 'cos', 'tan']);
  let top; let bottom;
  for (let i = 0; i < 100; i += 1) {
    if (d === 'hard') { top = int(rng, 20, 160) / 10; bottom = int(rng, 20, 160) / 10; } else { top = int(rng, 3, 20); bottom = int(rng, 3, 20); }
    if (fn !== 'tan' && top >= bottom - (d === 'hard' ? 0.5 : 1)) continue;
    if (fn === 'tan' && (top === bottom || Math.max(top, bottom) / Math.min(top, bottom) > 3.5)) continue;
    const t = INV[fn](top / bottom);
    if (t > 18 && t < 72 && Math.abs(t - 45) > 2) break;
  }
  const th = INV[fn](top / bottom);
  const roles = { [NUM_ROLE[fn]]: top, [DEN_ROLE[fn]]: bottom };
  const sides = {};
  for (const [role, v] of Object.entries(roles)) sides[sideKeys[role]] = L(v, unit);
  const vis = rightTriangleFig({ angleA: th, angles: { A: 'x' }, sides, rotate: pickRotation(rng, d), flip: chance(rng) });
  const ans = roundTo(th, 1);
  const f = (v) => A(roundTo(v, 1), 1);
  return {
    prompt: 'Work out the size of angle $x$. Give your answer to 1 decimal place.',
    visual: vis,
    answer: f(ans),
    distractors: fmtVals(angleWrong(fn, top / bottom, th), f),
    typed: DP1.typed(th),
    calculator: true,
    hint: 'Which two sides do you know, relative to angle $x$? Then use the inverse function ($\\sin^{-1}$, $\\cos^{-1}$ or $\\tan^{-1}$).',
    solution: angleWorking(fn, tnum(top), tnum(bottom), '', '', th),
  };
}, { title: 'Find an angle with inverse trig' });

// Angle contexts: fn, which values (top over bottom), and the prompt.
const ANGLE_CONTEXTS = [
  { fn: 'cos', unit: 'm', top: [1, 2.5], bottom: [4, 8], make: (t, b) => `A ladder ${b} m long leans against a vertical wall. The foot of the ladder is ${t} m from the wall. Work out the angle the ladder makes with the ground.` },
  { fn: 'tan', unit: 'm', top: [0.2, 0.8], bottom: [3, 9], make: (t, b) => `A ramp rises ${t} m over a horizontal distance of ${b} m. Work out the angle between the ramp and the horizontal.` },
  { fn: 'sin', unit: 'm', top: [15, 40], bottom: [45, 80], make: (t, b) => `A kite is flying on a straight string ${b} m long. The kite is ${t} m above the hand holding the string. Work out the angle between the string and the horizontal.` },
  { fn: 'tan', unit: 'm', top: [8, 25], bottom: [10, 40], make: (t, b) => `A tree is ${t} m tall. Sam stands on level ground ${b} m from the base of the tree. Work out the angle of elevation of the top of the tree from Sam's feet.` },
  { fn: 'tan', unit: 'm', top: [25, 60], bottom: [80, 300], make: (t, b) => `The top of a cliff is ${t} m above sea level. A boat is ${b} m from the foot of the cliff. Work out the angle of depression of the boat from the top of the cliff.`, note: 'The angle of depression from the top equals the angle of elevation from the boat (alternate angles).' },
  { fn: 'sin', unit: 'km', top: [0.5, 1.8], bottom: [4, 9], make: (t, b) => `After flying ${b} km along a straight climbing path, a plane is ${t} km above the runway. Work out the angle at which the plane is climbing.` },
  { fn: 'sin', unit: 'm', top: [4, 9], bottom: [12, 25], make: (t, b) => `An escalator is ${b} m long and rises a vertical height of ${t} m. Work out the angle between the escalator and the horizontal.` },
  { fn: 'tan', unit: 'm', top: [1], bottom: [3, 8], make: (t, b) => `A road sign says that a hill has a gradient of 1 in ${b} (the road rises 1 m for every ${b} m horizontally). Work out the angle the road makes with the horizontal.`, intB: true },
  { fn: 'tan', unit: 'm', top: [4, 15], bottom: [3, 25], make: (t, b) => `A vertical flagpole ${t} m tall casts a shadow ${b} m long on flat ground. Work out the angle of elevation of the sun.` },
  { fn: 'sin', unit: 'm', top: [1.2, 2.5], bottom: [3, 5], make: (t, b) => `A straight slide is ${b} m long. The top of the slide is ${t} m above the ground. Work out the angle between the slide and the ground.` },
  { fn: 'sin', unit: 'm', top: [3, 8], bottom: [6, 12], make: (t, b) => `A rope ${b} m long is tied to the top of a vertical pole ${t} m tall and pegged tight to the flat ground. Work out the angle between the rope and the ground.` },
  { fn: 'cos', unit: 'm', top: [2, 4], bottom: [3, 6], make: (t, b) => `A roof rafter is ${b} m long and covers a horizontal distance of ${t} m. Work out the angle between the rafter and the horizontal.` },
  { fn: 'sin', unit: 'm', top: [0.3, 0.8], bottom: [5, 10], make: (t, b) => `A wheelchair ramp is ${b} m long and rises ${t} m. Work out the angle between the ramp and the ground.` },
  { fn: 'tan', unit: 'm', top: [40, 120], bottom: [50, 300], make: (t, b) => `A drone hovers ${t} m above the ground. Priya is standing ${b} m horizontally from the point directly below it. Work out the angle of elevation of the drone from Priya.` },
  { fn: 'tan', unit: 'km', top: [3, 20], bottom: [3, 20], bearing: true, make: (t, b) => `A ship sails ${b} km due north and then ${t} km due east. Work out the bearing of the ship from its starting point, to the nearest degree.` },
];

export const sohAngleWord = gen('trig-soh-angle-word', 'trig-sohcahtoa-angle', (rng, d) => {
  const ctx = pick(rng, ANGLE_CONTEXTS);
  const rv = (range, isInt) => (range.length === 1 ? range[0] : isInt || (d !== 'hard' && range[1] - range[0] >= 6) ? int(rng, Math.ceil(range[0]), Math.floor(range[1])) : roundTo(range[0] + rng() * (range[1] - range[0]), range[1] >= 100 ? 0 : 1));
  if (d === 'hard') rng();
  let t; let b;
  for (let i = 0; i < 50; i += 1) {
    t = rv(ctx.top); b = rv(ctx.bottom, ctx.intB);
    if (ctx.fn !== 'tan' && t >= b) continue;
    if (t !== b) break;
  }
  const th = INV[ctx.fn](t / b);
  if (ctx.bearing) {
    const brg = Math.round(th);
    const fb = (v) => `${String(Math.round(v)).padStart(3, '0')}°`;
    return {
      prompt: ctx.make(num(t), num(b)),
      answer: fb(brg),
      distractors: [fb(90 - th), fb(180 - th), fb(360 - th), fb(90 + th), fb(270 + th)].filter((s) => s !== fb(brg)),
      typed: { kind: 'number', value: brg, tolerance: 0.5 },
      calculator: true,
      solution: [
        'Bearings are measured clockwise from north. Sketch: north ' + `${num(b)} km, then east ${num(t)} km; the bearing is the angle at the start between north and the line to the ship.`,
        `The east distance is opposite this angle and the north distance is adjacent: $\\tan\\theta = \\frac{${tnum(t)}}{${tnum(b)}}$`,
        `$\\theta = \\tan^{-1}\\left(\\frac{${tnum(t)}}{${tnum(b)}}\\right) = ${approxT(th)}^\\circ$`,
        `Write bearings with three figures. Answer: <b>${fb(brg)}</b>`,
      ],
    };
  }
  const f = (v) => A(roundTo(v, 1), 1);
  return {
    prompt: `${ctx.make(num(t), num(b))} Give your answer to 1 decimal place.`,
    answer: f(th),
    distractors: fmtVals(angleWrong(ctx.fn, t / b, th), f),
    typed: DP1.typed(th),
    calculator: true,
    solution: [
      `Sketch the right-angled triangle and mark the angle you want.${ctx.note ? ` ${ctx.note}` : ''}`,
      `You know the ${ROLE_NAME[NUM_ROLE[ctx.fn]]} (${num(t)} ${ctx.unit}) and the ${ROLE_NAME[DEN_ROLE[ctx.fn]]} (${num(b)} ${ctx.unit}) → ${MNEMONIC[ctx.fn]}.`,
      `$\\theta = \\${ctx.fn}^{-1}\\left(\\frac{${tnum(t)}}{${tnum(b)}}\\right) = ${approxT(th)}^\\circ$`,
      `Answer: <b>${f(th)}</b>`,
    ],
  };
}, { title: 'Trigonometry in context: find an angle', word: true });

export const sohAngleTwoStep = gen('trig-soh-angle-two-step', 'trig-sohcahtoa-angle', (rng, d) => {
  const unit = 'cm';
  const mode = d === 'easy' ? 'altitude' : pick(rng, ['trapezium', 'altitude']);
  const f = (v) => A(roundTo(v, 1), 1);
  if (mode === 'trapezium') {
    // Left triangle: base p, angle alpha at bottom-left -> height h = p tan alpha. Right triangle: hypotenuse q, angle x at bottom-right.
    const alpha = trigAngle(rng, 50, 70);
    const p = int(rng, 3, 8); const h = p * tanD(alpha);
    const q = Math.ceil(h * (1.25 + rng() * 0.8));
    const x = asinD(h / q);
    const mid = int(rng, 6, 12);
    const run = Math.sqrt(q * q - h * h);
    const pts = { P: [0, 0], Q: [p, 0], R: [p + mid, 0], S: [p + mid + run, 0], T: [p, h], U: [p + mid, h] };
    const vis = fig({
      pts, width: 400, height: 200,
      draw: (g) => g.poly(['P', 'S', 'U', 'T']) + g.seg('T', 'Q', { dash: '5 4', width: 1.4 }) + g.seg('U', 'R', { dash: '5 4', width: 1.4 })
        + g.right('Q', 'R', 'T', 9) + g.right('R', 'S', 'U', 9)
        + g.angle('P', 'Q', 'T', `${alpha}°`) + g.angle('S', 'U', 'R', 'x') + g.side('P', 'Q', L(p, unit)) + g.side('U', 'S', L(q, unit)),
    });
    return {
      prompt: 'This shape is made from two right-angled triangles and a rectangle.<br>Work out the size of angle $x$. Give your answer to 1 decimal place.',
      visual: vis,
      answer: f(x),
      distractors: fmtVals([90 - x, acosD(h / q > 1 ? 1 : h / q), atanD(h / q), asinD(Math.min(1, p / q)), asinD(Math.min(1, roundTo(h / q, 1))), asinD(Math.min(1, p * sinD(alpha) / q))], f),
      typed: DP1.typed(x),
      calculator: true,
      solution: [
        `Step 1 – the left triangle: the height is opposite the $${At(alpha)}$ angle and ${p} cm is adjacent, so $h = ${p} \\times \\tan ${At(alpha)} = ${approxT(h)}$ cm.`,
        'The rectangle means the right triangle has the same height.',
        `Step 2 – the right triangle: $h$ is opposite $x$ and ${q} cm is the hypotenuse: $\\sin x = \\frac{${approxT(h)}}{${q}}$`,
        `$x = \\sin^{-1}\\left(\\frac{${approxT(h)}}{${q}}\\right) = ${approxT(x)}^\\circ$. Answer: <b>${f(x)}</b>`,
      ],
    };
  }
  // altitude: AD and DB known -> AB by Pythagoras, then angle ACB from AB and BC (tan)
  const [db, ab, ad] = pick(rng, [[5, 12, 13], [8, 15, 17], [6, 8, 10], [9, 12, 15], [7, 24, 25], [12, 16, 20], [15, 8, 17], [12, 9, 15]]);
  const bc = int(rng, Math.max(4, Math.round(ab * 0.5)), Math.round(ab * 1.8));
  const x = atanD(ab / bc);
  const vis = altitudeFig({ db, bc, h: ab, labels: { AD: L(ad, unit), DB: L(db, unit), BC: L(bc, unit) }, angles: { C: 'x' } });
  return {
    prompt: '$DBC$ is a straight line and $AB$ is perpendicular to $DC$.<br>Work out the size of angle $x$. Give your answer to 1 decimal place.',
    visual: vis,
    answer: f(x),
    distractors: fmtVals([90 - x, atanD(ad / bc), asinD(Math.min(1, ab / ad)), atanD(db / bc), atanD(roundTo(ab / bc, 1)), acosD(Math.min(1, bc / ad))], f),
    typed: DP1.typed(x),
    calculator: true,
    solution: [
      `Step 1 – [[trig-pythagoras|Pythagoras]] in triangle $ABD$: $AB = \\sqrt{${ad}^2 - ${db}^2} = \\sqrt{${ad * ad - db * db}} = ${ab}$ cm.`,
      `Step 2 – in triangle $ABC$, $AB$ is opposite $x$ and $BC = ${bc}$ cm is adjacent: $\\tan x = \\frac{${ab}}{${bc}}$`,
      `$x = \\tan^{-1}\\left(\\frac{${ab}}{${bc}}\\right) = ${approxT(x)}^\\circ$`,
      `Answer: <b>${f(x)}</b>`,
    ],
  };
}, { title: 'Two-step: find an angle via a shared side', learn: ['trig-sohcahtoa-angle', 'trig-pythagoras'] });

/* ------------------------------------------------------------------ */
/* trig-exact-values                                                   */
/* ------------------------------------------------------------------ */

// Exact values as q·√r with q a Frac and r in {1, 2, 3}.
const EV = (n, dd, r = 1) => ({ q: frac(n, dd), r });
const TABLE = {
  sin: { 0: EV(0, 1), 30: EV(1, 2), 45: EV(1, 2, 2), 60: EV(1, 2, 3), 90: EV(1, 1) },
  cos: { 0: EV(1, 1), 30: EV(1, 2, 3), 45: EV(1, 2, 2), 60: EV(1, 2), 90: EV(0, 1) },
  tan: { 0: EV(0, 1), 30: EV(1, 3, 3), 45: EV(1, 1), 60: EV(1, 1, 3) },
};
const evNum = (e) => e.q.value() * Math.sqrt(e.r);
function evMul(a, b) {
  if (a.q.n === 0 || b.q.n === 0) return EV(0, 1);
  if (a.r === b.r) return { q: a.q.mul(b.q).mul(a.r), r: 1 };
  if (a.r === 1) return { q: a.q.mul(b.q), r: b.r };
  if (b.r === 1) return { q: a.q.mul(b.q), r: a.r };
  return null;
}
function evAdd(a, b, sgn = 1) {
  if (b.q.n === 0) return a;
  if (a.q.n === 0) return { q: b.q.mul(sgn), r: b.r };
  if (a.r !== b.r) return null;
  return { q: a.q.add(b.q.mul(sgn)), r: a.r };
}
/** TeX of q√r: \frac{\sqrt{3}}{2}, 2\sqrt{3}, \frac{1}{2}. For tan 30 we write \frac{1}{\sqrt{3}}. */
function evTex(e, { tan30 = false } = {}) {
  const { q, r } = e;
  if (r === 1 || q.n === 0) return q.tex();
  if (tan30 && r === 3 && q.n === 1 && q.d === 3) return '\\frac{1}{\\sqrt{3}}';
  const neg = q.n < 0 ? '-' : ''; const n = Math.abs(q.n);
  const top = n === 1 ? `\\sqrt{${r}}` : `${n}\\sqrt{${r}}`;
  return q.d === 1 ? `${neg}${top}` : `${neg}\\frac{${top}}{${q.d}}`;
}
const evKey = (e) => evNum(e).toFixed(9);
const ALL_EXACT = [EV(0, 1), EV(1, 2), EV(1, 2, 2), EV(1, 2, 3), EV(1, 1), EV(1, 1, 3), EV(1, 3, 3), EV(1, 1, 2), EV(3, 2), EV(2, 1)];

export const exactRecall = gen('trig-exact-recall', 'trig-exact-values', (rng, d) => {
  const mode = d === 'easy' ? pick(rng, ['value', 'value', 'same']) : d === 'medium' ? pick(rng, ['value', 'value', 'angle', 'same']) : pick(rng, ['angle', 'same', 'value']);
  const angles = d === 'easy' ? [30, 60, 45] : d === 'medium' ? [0, 30, 45, 60, 90] : [0, 90, 30, 60];
  if (mode === 'same') {
    // Which expression has the same value as fn(ang)?
    const all = [];
    for (const fn of ['sin', 'cos', 'tan']) for (const a of [0, 30, 45, 60, 90]) if (TABLE[fn][a]) all.push({ fn, a, v: TABLE[fn][a] });
    let target; let matches;
    for (let i = 0; i < 50; i += 1) {
      target = pick(rng, all.filter((t) => angles.includes(t.a)));
      matches = all.filter((t) => evKey(t.v) === evKey(target.v) && !(t.fn === target.fn && t.a === target.a));
      if (matches.length) break;
    }
    const m = pick(rng, matches);
    const others = shuffle(rng, all.filter((t) => evKey(t.v) !== evKey(target.v)));
    // tempting: same function at the complementary angle, other function at the same angle
    others.sort((p, q) => ((q.a === target.a) + (q.fn === target.fn && q.a === 90 - target.a)) - ((p.a === target.a) + (p.fn === target.fn && p.a === 90 - target.a)));
    const tx = (t) => `$\\${t.fn} ${At(t.a)}$`;
    return {
      prompt: `Which of these has the same value as $\\${target.fn} ${At(target.a)}$?`,
      answer: tx(m),
      distractors: others.map(tx),
      solution: [
        `$\\${target.fn} ${At(target.a)} = ${evTex(target.v, { tan30: true })}$.`,
        `$\\${m.fn} ${At(m.a)} = ${evTex(m.v, { tan30: true })}$ as well${(target.fn === 'sin' && m.fn === 'cos') || (target.fn === 'cos' && m.fn === 'sin') ? ` – in general $\\sin\\theta = \\cos(90^\\circ - \\theta)$` : ''}.`,
        `Answer: ${tx(m)}`,
      ],
    };
  }
  if (mode === 'value') {
    const fn = pick(rng, ['sin', 'cos', 'tan']);
    const ang = pick(rng, angles.filter((a) => TABLE[fn][a] !== undefined));
    const val = TABLE[fn][ang];
    const tex = (e) => `$${evTex(e, { tan30: true })}$`;
    const other = fn === 'sin' ? 'cos' : fn === 'cos' ? 'sin' : 'tan';
    const swapAng = ang === 30 ? 60 : ang === 60 ? 30 : ang;
    const tempting = [TABLE[other][ang], TABLE[fn][swapAng], ...(fn === 'tan' ? [TABLE.tan[swapAng]] : [TABLE.tan[ang]])].filter(Boolean);
    const ds = [...tempting, ...shuffle(rng, ALL_EXACT)].filter((e) => evKey(e) !== evKey(val) && (fn === 'tan' || evNum(e) <= 1 + 1e-9));
    const uniq = []; const seen = new Set([evKey(val)]);
    for (const e of ds) if (!seen.has(evKey(e))) { seen.add(evKey(e)); uniq.push(tex(e)); }
    return {
      prompt: pick(rng, [`Write down the exact value of $\\${fn} ${At(ang)}$.`, `What is the exact value of $\\${fn} ${At(ang)}$?`, `Without a calculator, write down the value of $\\${fn} ${At(ang)}$.`]),
      answer: tex(val),
      distractors: uniq,
      hint: 'Sketch half an equilateral triangle (sides 1, 2, √3) or an isosceles right-angled triangle (sides 1, 1, √2).',
      solution: [
        ang === 45 ? 'Use an isosceles right-angled triangle with shorter sides 1 and hypotenuse $\\sqrt{2}$ (angles $45^\\circ$, $45^\\circ$, $90^\\circ$).'
          : ang === 30 || ang === 60 ? 'Use half of an equilateral triangle of side 2: hypotenuse 2, shorter sides 1 (opposite $30^\\circ$) and $\\sqrt{3}$ (opposite $60^\\circ$).'
            : `At $${At(ang)}$ the triangle has flattened out: think of the graph of $y = \\${fn} x$.`,
        ang === 0 || ang === 90 ? `From the graph, $\\${fn} ${At(ang)} = ${evTex(val)}$.` : `${MNEMONIC[fn]}, so $\\${fn} ${At(ang)} = ${evTex(val, { tan30: true })}$.`,
        `Answer: ${tex(val)}`,
      ],
    };
  }
  // find the acute angle from a value
  const fn = pick(rng, ['sin', 'cos', 'tan']);
  const ang = pick(rng, [30, 45, 60].filter((a) => TABLE[fn][a]));
  const val = TABLE[fn][ang];
  const fa = (a) => `${a}°`;
  const swapAng = ang === 30 ? 60 : ang === 60 ? 30 : 90;
  return {
    prompt: `$x$ is an acute angle and $\\${fn} x = ${evTex(val, { tan30: true })}$.<br>Work out the value of $x$.`,
    answer: fa(ang),
    distractors: [fa(swapAng), ...[0, 30, 45, 60, 90].map(fa)].filter((s) => s !== fa(ang)),
    typed: { kind: 'number', value: ang },
    solution: [
      `Recall the exact values of $\\${fn}$: ${[0, 30, 45, 60].filter((a) => TABLE[fn][a]).map((a) => `$\\${fn} ${At(a)} = ${evTex(TABLE[fn][a], { tan30: true })}$`).join(', ')}.`,
      `So $\\${fn} x = ${evTex(val, { tan30: true })}$ when $x = ${At(ang)}$.`,
      `Answer: <b>${fa(ang)}</b>`,
    ],
  };
}, { title: 'Recall exact trig values' });

/** Random expression from exact values. Returns {tex, value, wrong[]} or null. */
function exactExpression(rng, d) {
  const term = () => { const fn = pick(rng, ['sin', 'cos', 'tan']); const ang = pick(rng, [30, 45, 60, ...(d === 'hard' ? [0, 90] : [])].filter((a) => TABLE[fn][a])); return { fn, ang, v: TABLE[fn][ang] }; };
  const swapped = (t) => {
    const other = t.fn === 'sin' ? 'cos' : t.fn === 'cos' ? 'sin' : null;
    return other ? TABLE[other][t.ang] : TABLE.tan[t.ang === 30 ? 60 : t.ang === 60 ? 30 : t.ang];
  };
  const kind = pick(rng, d === 'easy' ? ['k', 'sum'] : d === 'medium' ? ['sum', 'prod', 'k', 'diff'] : ['prod', 'sq', 'ksum', 'diff']);
  const a = term(); const b = term();
  const k = pick(rng, [2, 3, 4, 6]);
  const tt = (t) => `\\${t.fn} ${At(t.ang)}`;
  let tex; let value; let wrong = [];
  if (kind === 'k') {
    tex = `${k}${tt(a)}`; value = evMul(EV(k, 1), a.v); wrong = [evMul(EV(k, 1), swapped(a)), a.v, evAdd(EV(k, 1), a.v)];
  } else if (kind === 'sum' || kind === 'diff') {
    const s = kind === 'sum' ? 1 : -1;
    tex = `${tt(a)} ${s > 0 ? '+' : '-'} ${tt(b)}`; value = evAdd(a.v, b.v, s); wrong = [evAdd(swapped(a), b.v, s), evAdd(a.v, swapped(b), s), evAdd(a.v, b.v, -s), evMul(a.v, b.v)];
  } else if (kind === 'prod') {
    tex = `${tt(a)} \\times ${tt(b)}`; value = evMul(a.v, b.v); wrong = [evMul(swapped(a), b.v), evMul(a.v, swapped(b)), evAdd(a.v, b.v), evMul(swapped(a), swapped(b))];
  } else if (kind === 'sq') {
    tex = `${k}\\${a.fn}^2 ${At(a.ang)}`; value = evMul(EV(k, 1), evMul(a.v, a.v)); wrong = [evMul(EV(k, 1), a.v), evMul(EV(k * k, 1), evMul(a.v, a.v)), evMul(EV(2 * k, 1), a.v), evMul(EV(k, 1), evMul(swapped(a), swapped(a)))];
  } else {
    tex = `${k}${tt(a)} + ${tt(b)}`; value = evAdd(evMul(EV(k, 1), a.v), b.v); wrong = [evAdd(evMul(EV(k, 1), swapped(a)), b.v), evMul(EV(k, 1), evAdd(a.v, b.v) || EV(0, 1)), evAdd(a.v, b.v)];
  }
  if (!value || value.q.n <= 0) return null;
  if (a.fn === b.fn && a.ang === b.ang && kind !== 'k' && kind !== 'sq') return null;
  return { tex, value, wrong: wrong.filter((w) => w && w.q.n > 0), a, b, kind, k };
}

export const exactExpr = gen('trig-exact-expression', 'trig-exact-values', (rng, d) => {
  const solveForAngle = d === 'hard' && chance(rng, 0.5);
  let e = null; let options = [];
  for (let i = 0; i < 400; i += 1) {
    e = exactExpression(rng, d);
    if (!e) continue;
    if (!solveForAngle) break;
    // Need fn, angle with TABLE[fn][angle] == value for an acute angle
    options = [];
    for (const fn of ['sin', 'cos', 'tan']) for (const ang of [30, 45, 60]) if (TABLE[fn][ang] && evKey(TABLE[fn][ang]) === evKey(e.value)) options.push({ fn, ang });
    if (options.length) break;
    e = null;
  }
  if (!e) throw new Error('no expression');
  if (solveForAngle) {
    const { fn, ang } = pick(rng, options);
    const fa = (a) => `${a}°`;
    return {
      prompt: `$x$ is an acute angle and $\\${fn} x = ${e.tex}$.<br>Work out the value of $x$. Do not use a calculator.`,
      answer: fa(ang),
      distractors: [ang === 30 ? 60 : ang === 60 ? 30 : 90, 30, 45, 60, 90, 0].map(fa).filter((s) => s !== fa(ang)),
      typed: { kind: 'number', value: ang },
      solution: [
        `Work out the right-hand side using exact values: $${e.tex} = ${evTex(e.value)}$.`,
        `So $\\${fn} x = ${evTex(e.value, { tan30: true })}$, and $\\${fn} ${At(ang)} = ${evTex(TABLE[fn][ang], { tan30: true })}$.`,
        `Answer: <b>${fa(ang)}</b>`,
      ],
    };
  }
  const tex = (v) => `$${evTex(v)}$`;
  const seen = new Set([evKey(e.value)]);
  const ds = [];
  for (const w of [...e.wrong, ...shuffle(rng, ALL_EXACT.map((v) => evMul(v, EV(e.value.r === 1 ? 1 : 1, 1))))]) {
    if (!w || seen.has(evKey(w)) || w.q.n <= 0) continue;
    seen.add(evKey(w)); ds.push(tex(w));
  }
  const parts = [e.a, e.b].filter((t, i) => i === 0 || !['k', 'sq'].includes(e.kind));
  return {
    prompt: `Work out the exact value of $${e.tex}$.<br>Do not use a calculator. Give your answer in its simplest form.`,
    answer: tex(e.value),
    distractors: ds,
    solution: [
      `Replace each trig value by its exact value: ${parts.map((t) => `$\\${t.fn} ${At(t.ang)} = ${evTex(t.v, { tan30: true })}$`).join(', ')}.`,
      `Then do the arithmetic${e.kind === 'prod' ? (e.a.v.r > 1 && e.a.v.r === e.b.v.r ? ` (multiply tops and bottoms; $\\sqrt{${e.a.v.r}} \\times \\sqrt{${e.a.v.r}} = ${e.a.v.r}$)` : ' (multiply tops and bottoms)') : e.kind === 'sq' ? ' (square first, then multiply)' : ''}: $${e.tex} = ${evTex(e.value)}$`,
      `Answer: ${tex(e.value)}`,
    ],
  };
}, { title: 'Evaluate expressions with exact trig values' });

export const exactTriangle = gen('trig-exact-triangle', 'trig-exact-values', (rng, d) => {
  // Cases (known role -> unknown role)
  const cases = d === 'easy' ? [['hyp', 'opp'], ['hyp', 'adj']] : d === 'medium' ? [['hyp', 'opp'], ['hyp', 'adj'], ['adj', 'opp'], ['opp', 'hyp']] : [['opp', 'hyp'], ['adj', 'hyp'], ['opp', 'adj'], ['adj', 'opp']];
  const [kr, ur] = pick(rng, cases);
  const fn = RATIO[`${kr},${ur}`];
  // hard: only angles whose exact value involves a root, so the answer is a surd
  const ang = pick(rng, d === 'easy' ? [30, 60] : d === 'medium' ? [30, 45, 60] : [30, 45, 60].filter((t) => TABLE[fn][t].r > 1));
  const numerator = ur === NUM_ROLE[fn];
  const tv = TABLE[fn][ang];
  // Choose known k so the answer is q√r with integer q.
  const mult = tv.q.d * (tv.r === 3 && !numerator ? 3 : tv.r === 2 && !numerator ? 2 : 1);
  const kBase = int(rng, 2, Math.max(3, Math.floor(30 / mult)));
  let k = kBase * (tv.q.d) * (tv.r === 3 && !numerator ? 3 : tv.r === 2 && !numerator ? 2 : 1);
  if (d === 'easy') k = kBase * 2;
  const ans = numerator ? evMul(EV(k, 1), tv) : (() => {
    // k / (q√r) = k/(q r) √r
    if (tv.r === 1) return { q: frac(k, 1).div(tv.q), r: 1 };
    return { q: frac(k, 1).div(tv.q).div(tv.r), r: tv.r };
  })();
  if (!ans.q.isInt) throw new Error('non-integer coefficient');
  const unit = 'cm';
  const tex = (v) => `$${evTex(v)}$ cm`;
  const wrongs = [];
  for (const f of ['sin', 'cos', 'tan']) {
    const v = TABLE[f][ang];
    if (!v) continue;
    wrongs.push(evMul(EV(k, 1), v));
    if (v.r === 1) wrongs.push({ q: frac(k, 1).div(v.q), r: 1 }); else wrongs.push({ q: frac(k, 1).div(v.q).div(v.r), r: v.r });
  }
  wrongs.push({ q: frac(k, 1), r: tv.r === 1 ? 3 : tv.r }, { q: ans.q.mul(2), r: ans.r }, { q: ans.q, r: ans.r === 3 ? 2 : 3 }, { q: frac(k, 1), r: 1 }, { q: frac(k * 2, 1), r: 1 }, { q: ans.q.div(2), r: ans.r });
  const seen = new Set([evKey(ans)]); const ds = [];
  for (const w of wrongs) if (w && w.q.n > 0 && w.q.d <= 3 && !seen.has(evKey(w))) { seen.add(evKey(w)); ds.push(tex(w)); }
  const vis = rightTriangleFig({ angleA: ang, angles: { A: `${ang}°` }, sides: { [sideKeys[kr]]: L(k, unit), [sideKeys[ur]]: 'x' }, rotate: pickRotation(rng, d), flip: chance(rng) });
  return {
    prompt: 'Work out the <b>exact</b> value of $x$. Do not use a calculator.',
    visual: vis,
    answer: tex(ans),
    distractors: ds,
    solution: [
      `From the $${At(ang)}$ angle, $x$ is the ${ROLE_NAME[ur]} and ${k} cm is the ${ROLE_NAME[kr]} → ${MNEMONIC[fn]}.`,
      `Exact value: $\\${fn} ${At(ang)} = ${evTex(tv, { tan30: true })}$.`,
      numerator ? `$x = ${k} \\times \\${fn} ${At(ang)} = ${k} \\times ${evTex(tv, { tan30: true })} = ${evTex(ans)}$`
        : (tv.r > 1 && !(fn === 'tan' && ang === 30)
          ? `$x = \\frac{${k}}{\\${fn} ${At(ang)}} = ${k} \\div ${evTex(tv)} = \\frac{${k * tv.q.d}}{${tv.q.n === 1 ? '' : tv.q.n}\\sqrt{${tv.r}}}$. Rationalise (multiply top and bottom by $\\sqrt{${tv.r}}$): $\\frac{${k * tv.q.d}\\sqrt{${tv.r}}}{${tv.q.n * tv.r}} = ${evTex(ans)}$`
          : `$x = \\frac{${k}}{\\${fn} ${At(ang)}} = ${k} \\div ${evTex(tv, { tan30: true })} = ${evTex(ans)}$`),
      `Answer: ${tex(ans)}`,
    ],
  };
}, { title: 'Exact sides with 30°, 45° and 60°', learn: ['trig-exact-values', 'trig-sohcahtoa-side'] });

export const sohcahtoaSideGenerators = [sohSide, sohWhich, sohSideWord, sohTwoStep];
export const sohcahtoaAngleGenerators = [sohAngle, sohAngleWord, sohAngleTwoStep];
export const exactValueGenerators = [exactRecall, exactExpr, exactTriangle];

void [names, tidy, Frac, FILL, rounding, LETTER];
