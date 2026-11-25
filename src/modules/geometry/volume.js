// Volume and surface area unit: cuboids, prisms, cylinders, cones, spheres, pyramids.
import { pick, int, chance, tnum, num, roundTo, frac } from '../../core.js';
import { ggen, wrongs, htext, textWidth } from './diagrams.js';
import { prismFig, cuboidFig, cylinderFig, coneFig, sphereFig, hemisphereFig, pyramidFig, compositeFig } from './solids.js';

const L = (v, u = 'cm') => `$${tnum(v)}$ ${u}`;
const A2 = (v, u = 'cm') => `$${tnum(v)}$ ${u}²`;
const V3 = (v, u = 'cm') => `$${tnum(v)}$ ${u}³`;
const lab = (v, u = 'cm') => `${num(v)} ${u}`;
const r1 = (x) => roundTo(x, 1);
const dp1 = (x, u) => `$${tnum(r1(x), 1)}$${u ? ` ${u}` : ''}`;
const typed1 = (x) => ({ kind: 'number', value: r1(x), tolerance: 0.05 });
const piT = (k) => (k === 1 ? '\\pi' : `${k instanceof Object ? k.tex() : tnum(k)}\\pi`);
const piAns = (k, u) => `$${piT(k)}$${u ? ` ${u}` : ''}`;
const typedPi = (k) => ({ kind: 'text', accept: [`${k}π`, `${k}pi`, `${k}*π`, `π${k}`] });
const dec3 = (x) => roundTo(x, 3);

/* ================================================================== */
/* geo-volume-cuboid                                                   */
/* ================================================================== */

export const volCuboid = ggen('geo-vol-cuboid', 'geo-volume-cuboid', (rng, d) => {
  const u = pick(rng, ['cm', 'cm', 'm', 'mm']);
  let l; let w; let h;
  if (d === 'easy') { l = int(rng, 2, 10); w = int(rng, 2, 6); h = int(rng, 2, 8); } else if (d === 'medium') { l = int(rng, 4, 20); w = int(rng, 3, 12); h = int(rng, 3, 15); } else { l = roundTo(int(rng, 5, 30) / 2, 1); w = int(rng, 2, 12); h = roundTo(int(rng, 3, 24) / 2, 1); }
  const cube = d === 'easy' && chance(rng, 0.25);
  if (cube) { w = l; h = l; }
  const V = dec3(l * w * h); const SA = 2 * (l * w + w * h + l * h);
  return {
    prompt: cube ? `The diagram shows a cube.<br>Work out its volume.` : 'Work out the volume of the cuboid.',
    visual: cuboidFig(l, w, h, { labels: [lab(l, u), cube ? null : lab(w, u), cube ? null : lab(h, u)] }),
    answer: V3(V, u),
    distractors: wrongs(V, [dec3(SA), dec3(l + w + h), dec3(l * w), dec3(l * h), dec3(V / 2), dec3(SA / 2), dec3(V + l * w)]).map((v) => V3(v, u)),
    typed: { kind: 'number', value: V },
    solution: [
      'Volume of a cuboid = length × width × height',
      `$${tnum(l)} \\times ${tnum(w)} \\times ${tnum(h)} = ${tnum(V)}$`,
      `Volume is measured in cubic units (${u}³).`,
      `Answer: ${V3(V, u)}`,
    ],
  };
}, { title: 'Volume of a cuboid' });

export const volCuboidMissing = ggen('geo-vol-cuboid-missing', 'geo-volume-cuboid', (rng, d) => {
  const u = pick(rng, ['cm', 'cm', 'm']);
  if (d !== 'easy' && chance(rng, 0.35)) {
    const s = int(rng, 2, d === 'hard' ? 12 : 6);
    const askSA = d === 'hard' && chance(rng, 0.5);
    const ans = askSA ? 6 * s * s : s;
    return {
      prompt: `A cube has a volume of ${V3(s ** 3, u)}.<br>Work out ${askSA ? 'the total surface area of the cube' : 'the length of one edge'}.`,
      answer: askSA ? A2(ans, u) : L(ans, u),
      distractors: wrongs(ans, askSA ? [s * s, 4 * s * s, 6 * s, s ** 3, 6 * s ** 3 / s / 2] : [s ** 3 / 3, s ** 3 / 6, Math.round(Math.sqrt(s ** 3)), s * s, s + 1]).filter((v) => Number.isInteger(v)).map((v) => (askSA ? A2(v, u) : L(v, u))),
      typed: { kind: 'number', value: ans },
      solution: [`For a cube, volume $= s^3$, so $s = \\sqrt[3]{${s ** 3}} = ${s}$ ${u}.`, ...(askSA ? [`A cube has 6 square faces, each $${s} \\times ${s} = ${s * s}$, so surface area $= 6 \\times ${s * s} = ${6 * s * s}$ ${u}²`] : [`(Check: $${s} \\times ${s} \\times ${s} = ${s ** 3}$)`]), `Answer: ${askSA ? A2(ans, u) : L(ans, u)}`],
    };
  }
  const l = int(rng, 3, 15); const w = int(rng, 2, 10); const h = int(rng, 2, 12);
  const V = l * w * h;
  const which = int(rng, 0, 2);
  const lbl = [lab(l, u), lab(w, u), lab(h, u)];
  lbl[which] = which === 2 ? 'h' : which === 1 ? 'w' : 'l';
  const ans = [l, w, h][which];
  const others = [l, w, h].filter((_, i) => i !== which);
  return {
    prompt: `The volume of the cuboid is ${V3(V, u)}.<br>Work out the length marked $${lbl[which]}$.`,
    visual: cuboidFig(l, w, h, { labels: lbl }),
    answer: L(ans, u),
    distractors: wrongs(ans, [V / others[0], V / others[1], V - others[0] * others[1], V / (others[0] + others[1]), V / 2 / others[0], ans * 2, ans + 1].filter((v) => Number.isInteger(v)), { min: 0 }).map((v) => L(v, u)),
    typed: { kind: 'number', value: ans },
    solution: [`Volume = length × width × height, so $${others[0]} \\times ${others[1]} \\times ${lbl[which]} = ${V}$.`, `$${others[0] * others[1]} \\times ${lbl[which]} = ${V}$`, `$${lbl[which]} = ${V} \\div ${others[0] * others[1]} = ${ans}$`, `Answer: ${L(ans, u)}`],
  };
}, { title: 'Missing length of a cuboid' });

export const volCubesFit = ggen('geo-vol-cubes-fit', 'geo-volume-cuboid', (rng, d) => {
  if (d === 'easy') {
    const l = int(rng, 2, 6); const w = int(rng, 2, 4); const h = int(rng, 2, 4);
    return {
      prompt: `A cuboid is made from centimetre cubes. It is ${l} cubes long, ${w} cubes wide and ${h} cubes high.<br>How many centimetre cubes are used?`,
      visual: cuboidFig(l, w, h, { labels: [lab(l), lab(w), lab(h)] }),
      answer: `$${l * w * h}$`,
      distractors: wrongs(l * w * h, [l * w, l + w + h, 2 * (l * w + w * h + l * h), l * w * h - h, l * h + w * h, 4 * (l + w + h)]).map((v) => `$${v}$`),
      typed: { kind: 'number', value: l * w * h },
      solution: [`Each layer has $${l} \\times ${w} = ${l * w}$ cubes.`, `There are ${h} layers: $${l * w} \\times ${h} = ${l * w * h}$`, `Answer: $${l * w * h}$`],
    };
  }
  // Items packed in a container, all the same way round. Every orientation is checked, so the key is the true maximum.
  const CTX = [
    { item: 'box', items: 'boxes', cont: 'crate', iu: 'cm', cu: 'cm', dims: [[10, 30, 5]], n: [2, 5] },
    { item: 'packet', items: 'packets', cont: 'carton', iu: 'cm', cu: 'cm', dims: [[4, 12, 1]], n: [2, 6] },
    { item: 'sugar cube', items: 'sugar cubes', cont: 'tin', iu: 'cm', cu: 'cm', cube: [1, 2], n: [3, 8] },
    { item: 'tile pack', items: 'tile packs', cont: 'storage box', iu: 'cm', cu: 'cm', dims: [[5, 20, 5]], n: [2, 5] },
    ...(d === 'hard' ? [{ item: 'parcel', items: 'parcels', cont: 'van', iu: 'cm', cu: 'm', dims: [[20, 60, 10]], n: [3, 8] }] : []),
  ];
  const ctx = pick(rng, CTX);
  const [lo, hi, st] = ctx.dims ? ctx.dims[0] : [1, 2, 1];
  const side = ctx.cube ? pick(rng, ctx.cube) : 0;
  const it = ctx.cube ? [side, side, side] : [0, 0, 0].map(() => st * int(rng, Math.ceil(lo / st), Math.floor(hi / st)));
  if (!ctx.cube && new Set(it).size < 2) throw new Error('want a non-cube item');
  const cnt = [0, 0, 0].map(() => int(rng, ctx.n[0], ctx.n[1]));
  const waste = d === 'hard' && !ctx.cube ? [0, 1, 2].map((i) => (i === 1 ? 0 : st * int(rng, 0, Math.max(0, Math.floor((it[i] - 1) / st))))) : [0, 0, 0];
  if (d === 'hard' && !ctx.cube && waste[0] + waste[2] === 0) throw new Error('need waste');
  const box = it.map((x, i) => x * cnt[i] + waste[i]); // container in cm
  if (ctx.cu === 'm' && box.some((x) => x % 10)) throw new Error('van needs tidy metres');
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  let best = null;
  for (const pm of perms) {
    const fit = [0, 1, 2].map((i) => Math.floor(box[i] / it[pm[i]]));
    const n = fit[0] * fit[1] * fit[2];
    if (!best || n > best.n) best = { pm, fit, n };
  }
  const ans = best.n;
  const naive = Math.floor((box[0] * box[1] * box[2]) / (it[0] * it[1] * it[2]));
  const fmtC = (x) => (ctx.cu === 'm' ? lab(x / 100, 'm') : lab(x));
  const conv = ctx.cu === 'm' ? `First change the van's measurements to centimetres: ${box.map((x) => `${num(x / 100)} m = ${x} cm`).join(', ')}.` : null;
  const wrongFit = [0, 1, 2].map((i) => Math.floor(box[i] / it[i])).reduce((p, q) => p * q, 1);
  return {
    prompt: ctx.cube
      ? `A tin is a cuboid measuring ${fmtC(box[0])} by ${fmtC(box[1])} by ${fmtC(box[2])}.<br>Sugar cubes have edges of ${lab(side)}.<br>How many sugar cubes fill the tin exactly?`
      : `A ${ctx.cont} is a cuboid measuring ${fmtC(box[0])} by ${fmtC(box[1])} by ${fmtC(box[2])}.<br>Each ${ctx.item} is a cuboid measuring ${lab(it[0])} by ${lab(it[1])} by ${lab(it[2])}.<br>What is the greatest number of ${ctx.items} that fit in the ${ctx.cont}, all the same way round?`,
    visual: cuboidFig(box[0], box[1], box[2], { labels: [fmtC(box[0]), fmtC(box[1]), fmtC(box[2])] }),
    answer: `$${tnum(ans)}$`,
    distractors: wrongs(ans, [naive, wrongFit, box[0] * box[1] * box[2], ans * 2, best.fit[0] * best.fit[1], (best.fit[0] + 1) * best.fit[1] * best.fit[2], best.fit[0] * best.fit[1] * (best.fit[2] + 1)]).map((v) => `$${tnum(v)}$`),
    typed: { kind: 'number', value: ans },
    solution: [
      ...(conv ? [conv] : []),
      `Line the ${ctx.items} up along each edge (whole ${ctx.items} only): $${box[0]} \\div ${it[best.pm[0]]}$ → ${best.fit[0]}, $${box[1]} \\div ${it[best.pm[1]]}$ → ${best.fit[1]}, $${box[2]} \\div ${it[best.pm[2]]}$ → ${best.fit[2]}.`,
      `Number $= ${best.fit[0]} \\times ${best.fit[1]} \\times ${best.fit[2]} = ${tnum(ans)}$${!ctx.cube && wrongFit !== ans ? `. (Matching the lengths in the order they are listed only fits ${wrongFit} — try every way round.)` : '.'}`,
      naive !== ans ? `Dividing the volumes ($${tnum(box[0] * box[1] * box[2])} \\div ${tnum(it[0] * it[1] * it[2])}$) gives too many, because there are gaps that can't hold a whole ${ctx.item}.` : `(Here the volumes also divide exactly: $${tnum(box[0] * box[1] * box[2])} \\div ${tnum(it[0] * it[1] * it[2])} = ${tnum(ans)}$.)`,
      `Answer: $${tnum(ans)}$`,
    ],
  };
}, { title: 'How many fit in a box' });

export const volCapacity = ggen('geo-vol-capacity', 'geo-volume-cuboid', (rng, d) => {
  const l = 10 * int(rng, 3, 12); const w = 10 * int(rng, 2, 8); const h = 10 * int(rng, 2, 8);
  const mode = d === 'easy' ? 'litres' : d === 'medium' ? pick(rng, ['litres', 'depth']) : pick(rng, ['depth', 'time']);
  const V = l * w * h; const litres = V / 1000;
  if (mode === 'litres') {
    return {
      prompt: `A fish tank is a cuboid ${lab(l)} long, ${lab(w)} wide and ${lab(h)} tall.<br>How many litres of water does it hold when full? (1 litre = 1000 cm³)`,
      visual: cuboidFig(l, w, h, { labels: [lab(l), lab(w), lab(h)] }),
      answer: `$${tnum(litres)}$ litres`,
      distractors: wrongs(litres, [V, V / 100, V / 10, litres * 10, (l * w) / 1000 + h, litres / 10]).map((v) => `$${tnum(v)}$ litres`),
      typed: { kind: 'number', value: litres },
      solution: [`Volume $= ${l} \\times ${w} \\times ${h} = ${tnum(V)}$ cm³`, `1 litre $= 1000$ cm³, so $${tnum(V)} \\div 1000 = ${tnum(litres)}$ litres`, `Answer: $${tnum(litres)}$ litres`],
    };
  }
  if (mode === 'depth') {
    const depth = int(rng, 2, h / 10 - 1) * 5;
    const water = l * w * depth / 1000;
    return {
      prompt: `A tank is a cuboid ${lab(l)} long, ${lab(w)} wide and ${lab(h)} tall.<br>It contains $${tnum(water)}$ litres of water.<br>How deep is the water? (1 litre = 1000 cm³)`,
      visual: cuboidFig(l, w, h, { labels: [lab(l), lab(w), lab(h)] }),
      answer: L(depth),
      distractors: wrongs(depth, [water * 1000 / (l * h), depth * 10, depth / 10, h - depth, water / (l * w) * 100, depth + 5].map((v) => roundTo(v, 2)), { min: 0 }).map((v) => L(v)),
      typed: { kind: 'number', value: depth },
      solution: [`$${tnum(water)}$ litres $= ${tnum(water * 1000)}$ cm³`, `Base area $= ${l} \\times ${w} = ${l * w}$ cm²`, `Depth $= ${tnum(water * 1000)} \\div ${l * w} = ${depth}$ cm`, `Answer: ${L(depth)}`],
    };
  }
  const rate = pick(rng, [2, 4, 5, 8, 10, 12, 15, 20]);
  const mins = litres / rate;
  if (!Number.isInteger(mins) || mins < 2) throw new Error('messy');
  return {
    prompt: `A water tank is a cuboid ${lab(l)} by ${lab(w)} by ${lab(h)}.<br>It is filled from empty at a rate of ${rate} litres per minute.<br>How many minutes does it take to fill?`,
    visual: cuboidFig(l, w, h, { labels: [lab(l), lab(w), lab(h)] }),
    answer: `$${mins}$ minutes`,
    distractors: wrongs(mins, [V / rate, litres * rate, mins * 10, mins / 10, mins * 60, mins + rate]).map((v) => `$${tnum(roundTo(v, 2))}$ minutes`),
    typed: { kind: 'number', value: mins },
    solution: [`Volume $= ${l} \\times ${w} \\times ${h} = ${tnum(V)}$ cm³ $= ${tnum(litres)}$ litres`, `Time $= ${tnum(litres)} \\div ${rate} = ${mins}$ minutes`, `Answer: $${mins}$ minutes`],
  };
}, { title: 'Capacity of a cuboid tank' });

/* ================================================================== */
/* geo-volume-prism                                                    */
/* ================================================================== */

export const volPrismTri = ggen('geo-vol-prism-tri', 'geo-volume-prism', (rng, d) => {
  const u = pick(rng, ['cm', 'cm', 'm']);
  const right = d === 'easy' || chance(rng, 0.5);
  const b = 2 * int(rng, 2, 8); const h = int(rng, 3, 12); const len = int(rng, 4, 20);
  const A = (b * h) / 2; const V = A * len;
  let cs; let labels; let slant = null;
  if (right) {
    cs = [[0, 0], [b, 0], [0, h]];
    labels = [{ a: [0, 0, 0], b: [b, 0, 0], text: lab(b, u) }, { a: [0, 0, 0], b: [0, h, 0], text: lab(h, u) }, { a: [b, 0, 0], b: [b, 0, len], text: lab(len, u), away: [0, h, 0] }];
  } else {
    cs = [[0, 0], [b, 0], [b / 2, h]];
    slant = Math.ceil(Math.hypot(b / 2, h));
    labels = [{ a: [0, 0, 0], b: [b, 0, 0], text: lab(b, u) }, { a: [0, 0, 0], b: [b / 2, h, 0], text: lab(slant, u) }, { a: [b, 0, 0], b: [b, 0, len], text: lab(len, u), away: [0, h, 0] }];
  }
  const visual = prismFig(cs, len, {
    labels, depthScale: Math.min(1.4, Math.max(0.5, (b * 1.2) / len)), rightAngles: right ? [[0, 1, 2]] : [],
    extra: right ? null : (P) => { const T = P([b / 2, h, 0]); const F = P([b / 2, 0, 0]); return `<line x1="${T[0]}" y1="${T[1]}" x2="${F[0]}" y2="${F[1]}" stroke="currentColor" stroke-width="1.4" stroke-dasharray="5 4"/>${htext(F[0] + 8 + textWidth(lab(h, u), 13) / 2, (T[1] + F[1]) / 2, lab(h, u), { size: 13 })}`; },
  });
  return {
    prompt: `The diagram shows a triangular prism.${right ? '' : ' The dashed line is the perpendicular height of the triangle.'}<br>Work out the volume of the prism.`,
    visual,
    answer: V3(V, u),
    distractors: wrongs(V, [b * h * len, slant ? (b * slant * len) / 2 : b + h + len, A + len, b * h * len / 3, V + A, 2 * A + (b + h) * len]).map((v) => V3(v, u)),
    typed: { kind: 'number', value: V },
    solution: [
      'Volume of a prism = area of cross-section × length',
      `Cross-section (triangle): $\\frac{1}{2} \\times ${b} \\times ${h} = ${tnum(A)}$ ${u}²`,
      `Volume $= ${tnum(A)} \\times ${len} = ${tnum(V)}$`,
      `Answer: ${V3(V, u)}`,
    ],
  };
}, { title: 'Volume of a triangular prism' });

export const volPrismCross = ggen('geo-vol-prism-cross', 'geo-volume-prism', (rng, d) => {
  const kind = d === 'easy' ? 'given' : pick(rng, d === 'medium' ? ['L', 'trap', 'given'] : ['L', 'trap']);
  const u = pick(rng, ['cm', 'm']);
  const len = int(rng, 4, 20);
  if (kind === 'given') {
    const A = int(rng, 6, 60);
    const cs = [[0, 0], [5, 0], [5, 2], [2, 2], [2, 5], [0, 5]];
    const visual = prismFig(cs, len, { labels: [{ a: [5, 0, 0], b: [5, 0, len], text: lab(len, u), away: [0, 5, 0] }], depthScale: Math.min(1.2, 6 / len * 1.2), extra: (P) => htext(...P([1.6, 1.6, 0]), `${A} ${u}²`, { size: 14 }) });
    return {
      prompt: `The area of the cross-section of this prism is ${A2(A, u)}.<br>The prism is ${lab(len, u)} long. Work out its volume.`,
      visual,
      answer: V3(A * len, u),
      distractors: wrongs(A * len, [A + len, (A * len) / 2, A * len * 2, A * 6 + len, A * len - A]).map((v) => V3(v, u)),
      typed: { kind: 'number', value: A * len },
      solution: ['Volume of a prism = area of cross-section × length', `$${A} \\times ${len} = ${A * len}$`, `Answer: ${V3(A * len, u)}`],
    };
  }
  if (kind === 'L') {
    const W = int(rng, 5, 12); const H = int(rng, 5, 12); const a = int(rng, 2, W - 2); const bb = int(rng, 2, H - 2);
    const cs = [[0, 0], [W, 0], [W, H - bb], [W - a, H - bb], [W - a, H], [0, H]];
    const A = W * H - a * bb; const V = A * len;
    const visual = prismFig(cs, len, {
      hidden: false, depthScale: Math.min(1.1, (W * 1.1) / len),
      labels: [{ a: [0, 0, 0], b: [W, 0, 0], text: lab(W, u) }, { a: [0, 0, 0], b: [0, H, 0], text: lab(H, u) }, { a: [0, H, 0], b: [W - a, H, 0], text: lab(W - a, u), away: [(W - a) / 2, H + 5, 0] }, { a: [W, 0, 0], b: [W, H - bb, 0], text: lab(H - bb, u), away: [W + 5, (H - bb) / 2, 0] }, { a: [W, 0, 0], b: [W, 0, len], text: lab(len, u), away: [0, H, 0] }],
    });
    return {
      prompt: 'The prism has an L-shaped cross-section. All corners are right angles.<br>Work out the volume of the prism.',
      visual,
      answer: V3(V, u),
      distractors: wrongs(V, [W * H * len, A + len, W * H * len - a * bb, 2 * (W + H) * len, (W - a) * (H - bb) * len, V + a * bb * len / 2]).map((v) => V3(v, u)),
      typed: { kind: 'number', value: V },
      solution: [
        'Volume of a prism = area of cross-section × length',
        `Cross-section: $${W} \\times ${H} - ${a} \\times ${bb} = ${W * H} - ${a * bb} = ${A}$ ${u}² (a rectangle with a corner removed)`,
        `Volume $= ${A} \\times ${len} = ${V}$`,
        `Answer: ${V3(V, u)}`,
      ],
    };
  }
  // trapezium prism (e.g. a trough / ramp)
  const a = int(rng, 3, 10); const bb = a + 2 * int(rng, 1, 4); const h = int(rng, 2, 9);
  const off = (bb - a) / 2;
  const cs = [[0, 0], [bb, 0], [bb - off, h], [off, h]];
  const A = ((a + bb) * h) / 2; const V = A * len;
  const visual = prismFig(cs, len, {
    depthScale: Math.min(1.2, (bb * 1.1) / len),
    labels: [{ a: [0, 0, 0], b: [bb, 0, 0], text: lab(bb, u) }, { a: [off, h, 0], b: [bb - off, h, 0], text: lab(a, u), away: [bb / 2, 0, 0] }, { a: [bb, 0, 0], b: [bb, 0, len], text: lab(len, u), away: [0, h, 0] }],
    extra: (P) => { const T = P([bb / 2, h, 0]); const F = P([bb / 2, 0, 0]); return `<line x1="${T[0]}" y1="${T[1]}" x2="${F[0]}" y2="${F[1]}" stroke="currentColor" stroke-width="1.4" stroke-dasharray="5 4"/>${htext(F[0] + 8 + textWidth(lab(h, u), 13) / 2, (T[1] + F[1]) / 2, lab(h, u), { size: 13 })}`; },
  });
  return {
    prompt: 'The cross-section of this prism is a trapezium.<br>Work out the volume of the prism.',
    visual,
    answer: V3(V, u),
    distractors: wrongs(V, [(a + bb) * h * len, a * bb * h, A + len, bb * h * len, a * h * len, V / 2]).map((v) => V3(v, u)),
    typed: { kind: 'number', value: V },
    solution: [
      'Volume of a prism = area of cross-section × length',
      `Trapezium: $\\frac{1}{2}(${a} + ${bb}) \\times ${h} = ${tnum(A)}$ ${u}²`,
      `Volume $= ${tnum(A)} \\times ${len} = ${tnum(V)}$`,
      `Answer: ${V3(V, u)}`,
    ],
  };
}, { title: 'Volume of prisms with compound cross-sections' });

export const volCylinder = ggen('geo-vol-cylinder', 'geo-volume-prism', (rng, d) => {
  const u = pick(rng, ['cm', 'cm', 'm']);
  const r = int(rng, 2, d === 'easy' ? 6 : 12); const h = int(rng, 3, 20);
  const useD = d !== 'easy' && chance(rng, 0.5);
  const exact = d === 'easy' || chance(rng, 0.4);
  const visual = cylinderFig({ rLabel: useD ? null : lab(r, u), dLabel: useD ? lab(2 * r, u) : null, hLabel: lab(h, u), ratio: h / (2 * r) });
  const given = useD ? `diameter ${L(2 * r, u)}` : `radius ${L(r, u)}`;
  if (exact) {
    const k = r * r * h;
    return {
      prompt: `A cylinder has ${given} and height ${L(h, u)}.<br>Work out the volume. Give your answer in terms of $\\pi$.`,
      visual,
      answer: piAns(k, u + '³'),
      distractors: [piAns(4 * k, u + '³'), piAns(2 * r * h, u + '³'), piAns(r * h, u + '³'), piAns(r * r * h * 2, u + '³'), piAns(2 * r * r + 2 * r * h, u + '³'), piAns(k / r * (r + 1), u + '³')],
      typed: typedPi(k),
      solution: ['Volume of a cylinder $= \\pi r^2 h$ (area of the circle × height)', useD ? `Radius $= ${2 * r} \\div 2 = ${r}$` : `$r = ${r}$`, `$\\pi \\times ${r}^2 \\times ${h} = ${k}\\pi$`, `Answer: ${piAns(k, u + '³')}`],
    };
  }
  const V = Math.PI * r * r * h;
  return {
    prompt: `A cylinder has ${given} and height ${L(h, u)}.<br>Work out the volume. Give your answer to 1 decimal place.`,
    visual,
    answer: dp1(V, u + '³'),
    distractors: [4 * V, 2 * Math.PI * r * h, Math.PI * r * h, V / 2, Math.PI * r * r + h].map((v) => dp1(v, u + '³')),
    typed: typed1(V), calculator: true,
    solution: ['Volume of a cylinder $= \\pi r^2 h$', useD ? `Radius $= ${2 * r} \\div 2 = ${r}$ (using the diameter would make it 4 times too big)` : `$r = ${r}$`, `$\\pi \\times ${r}^2 \\times ${h} = ${tnum(dec3(V))}\\ldots$`, `Answer: ${dp1(V, u + '³')}`],
  };
}, { title: 'Volume of a cylinder' });

export const volPrismReverse = ggen('geo-vol-prism-reverse', 'geo-volume-prism', (rng, d) => {
  const mode = d === 'easy' ? 'prism' : pick(rng, ['prism', 'cylinder', d === 'hard' ? 'cylinderCalc' : 'cylinder']);
  const u = 'cm';
  if (mode === 'prism') {
    const b = 2 * int(rng, 2, 7); const h = int(rng, 3, 10); const len = int(rng, 3, 20);
    const A = (b * h) / 2; const V = A * len;
    const cs = [[0, 0], [b, 0], [0, h]];
    const visual = prismFig(cs, len, { rightAngles: [[0, 1, 2]], depthScale: Math.min(1.4, (b * 1.2) / len), labels: [{ a: [0, 0, 0], b: [b, 0, 0], text: lab(b) }, { a: [0, 0, 0], b: [0, h, 0], text: lab(h) }, { a: [b, 0, 0], b: [b, 0, len], text: 'l', away: [0, h, 0], italic: true }] });
    return {
      prompt: `The volume of this triangular prism is ${V3(V)}.<br>Work out the length $l$.`,
      visual,
      answer: L(len),
      distractors: wrongs(len, [V / (b * h), V / b, V / h, V - A, len * 2, V / (b + h)].filter((v) => Number.isInteger(v)), { min: 0 }).map((v) => L(v)),
      typed: { kind: 'number', value: len },
      solution: [`Area of the triangle $= \\frac{1}{2} \\times ${b} \\times ${h} = ${A}$ cm²`, `Volume $=$ area × length, so $l = ${V} \\div ${A} = ${len}$`, `Answer: ${L(len)}`],
    };
  }
  const r = int(rng, 2, 10); const h = int(rng, 2, 25);
  if (mode === 'cylinder') {
    const k = r * r * h;
    return {
      prompt: `A cylinder has radius ${L(r)} and volume $${k}\\pi$ cm³.<br>Work out the height of the cylinder.`,
      visual: cylinderFig({ rLabel: lab(r), hLabel: 'h', ratio: h / (2 * r) }),
      answer: L(h),
      distractors: wrongs(h, [k / r, k / (2 * r), k / (4 * r * r), h * 2, k / (r * r * 2), h + r].filter((v) => Number.isInteger(v)), { min: 0 }).map((v) => L(v)),
      typed: { kind: 'number', value: h },
      solution: [`$\\pi r^2 h = ${k}\\pi$, so $${r * r}h = ${k}$`, `$h = ${k} \\div ${r * r} = ${h}$`, `Answer: ${L(h)}`],
    };
  }
  const V = roundTo(Math.PI * r * r * h + rng() * 4 - 2, 0);
  const hh = V / (Math.PI * r * r);
  return {
    prompt: `A cylinder has radius ${L(r)} and volume ${V3(V)}.<br>Work out its height. Give your answer to 1 decimal place.`,
    visual: cylinderFig({ rLabel: lab(r), hLabel: 'h', ratio: h / (2 * r) }),
    answer: dp1(hh, 'cm'),
    distractors: [V / (Math.PI * 4 * r * r), V / (2 * Math.PI * r), V / (r * r), V / (Math.PI * r), hh * 2].map((v) => dp1(v, 'cm')),
    typed: typed1(hh), calculator: true,
    solution: [`$\\pi r^2 h = ${V}$`, `$h = ${V} \\div (\\pi \\times ${r}^2) = ${V} \\div ${tnum(dec3(Math.PI * r * r))}\\ldots$`, `$h = ${tnum(dec3(hh))}\\ldots$`, `Answer: ${dp1(hh, 'cm')}`],
  };
}, { title: 'Length of a prism or cylinder from its volume' });

/* ================================================================== */
/* geo-surface-area                                                    */
/* ================================================================== */

export const saCuboid = ggen('geo-sa-cuboid', 'geo-surface-area', (rng, d) => {
  const u = pick(rng, ['cm', 'cm', 'm']);
  const cube = d === 'easy' && chance(rng, 0.4);
  const l = int(rng, 2, d === 'easy' ? 8 : 15); const w = cube ? l : int(rng, 2, 10); const h = cube ? l : int(rng, 2, 12);
  const SA = 2 * (l * w + w * h + l * h);
  const openTop = d === 'hard' && chance(rng, 0.5);
  const ans = openTop ? SA - l * w : SA;
  return {
    prompt: openTop ? `A box is a cuboid with <b>no lid</b>.<br>Work out the total area of the outside of the box (five faces).` : cube ? 'Work out the total surface area of the cube.' : 'Work out the total surface area of the cuboid.',
    visual: cuboidFig(l, w, h, { labels: [lab(l, u), cube ? null : lab(w, u), cube ? null : lab(h, u)] }),
    answer: A2(ans, u),
    distractors: wrongs(ans, [l * w * h, l * w + w * h + l * h, SA, SA - 2 * l * w, 4 * l * h, SA + l * w, 6 * l * w]).map((v) => A2(v, u)),
    typed: { kind: 'number', value: ans },
    solution: [
      'A cuboid has 6 rectangular faces in 3 matching pairs.',
      `Areas: $${l} \\times ${w} = ${l * w}$, $${w} \\times ${h} = ${w * h}$, $${l} \\times ${h} = ${l * h}$`,
      openTop ? `Total of all six: $2 \\times (${l * w} + ${w * h} + ${l * h}) = ${SA}$; take off the missing lid ($${l * w}$): $${ans}$` : `Total $= 2 \\times (${l * w} + ${w * h} + ${l * h}) = ${SA}$`,
      `Answer: ${A2(ans, u)}`,
    ],
  };
}, { title: 'Surface area of a cuboid' });

const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20]];

export const saTriPrism = ggen('geo-sa-tri-prism', 'geo-surface-area', (rng, d) => {
  const [a, b, c] = pick(rng, d === 'easy' ? TRIPLES.slice(0, 3) : TRIPLES);
  const len = int(rng, 4, 20); const u = 'cm';
  const showHyp = d !== 'hard';
  const cs = [[0, 0], [a, 0], [0, b]];
  const labels = [{ a: [0, 0, 0], b: [a, 0, 0], text: lab(a) }, { a: [0, 0, 0], b: [0, b, 0], text: lab(b) }, { a: [a, 0, 0], b: [a, 0, len], text: lab(len), away: [0, b, 0] }];
  if (showHyp) labels.push({ a: [a, 0, 0], b: [0, b, 0], text: lab(c), away: [a, b, 0] });
  const SA = a * b + (a + b + c) * len;
  return {
    prompt: `The diagram shows a triangular prism. The cross-section is a right-angled triangle.${showHyp ? '' : '<br>Use Pythagoras to find the missing side first.'}<br>Work out the total surface area of the prism.`,
    visual: prismFig(cs, len, { labels, rightAngles: [[0, 1, 2]], depthScale: Math.min(1.4, (a * 1.3) / len) }),
    answer: A2(SA),
    distractors: wrongs(SA, [(a * b * len) / 2, a * b / 2 + (a + b + c) * len, 2 * a * b + (a + b + c) * len, a * b + (a + b) * len, (a + b + c) * len, SA + c * len]).map((v) => A2(v)),
    typed: { kind: 'number', value: SA },
    solution: [
      ...(showHyp ? [] : [`Hypotenuse: $\\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}} = ${c}$ cm`]),
      `Two triangles: $2 \\times \\frac{1}{2} \\times ${a} \\times ${b} = ${a * b}$`,
      `Three rectangles: $(${a} + ${b} + ${c}) \\times ${len} = ${(a + b + c) * len}$`,
      `Total $= ${a * b} + ${(a + b + c) * len} = ${SA}$`,
      `Answer: ${A2(SA)}`,
    ],
  };
}, { title: 'Surface area of a triangular prism' });

export const saCylinder = ggen('geo-sa-cylinder', 'geo-surface-area', (rng, d) => {
  const r = int(rng, 2, 10); const h = int(rng, 3, 20); const u = 'cm';
  const kind = d === 'easy' ? 'curved' : pick(rng, d === 'medium' ? ['total', 'curved'] : ['total', 'open']);
  const exact = d !== 'hard' && chance(rng, 0.5);
  const kCurve = 2 * r * h; const kEnds = (kind === 'total' ? 2 : kind === 'open' ? 1 : 0) * r * r;
  const k = kCurve + kEnds;
  const what = kind === 'curved' ? 'the <b>curved</b> surface area' : kind === 'total' ? 'the <b>total</b> surface area' : 'the total outside surface area (it has a base but <b>no lid</b>)';
  const visual = cylinderFig({ rLabel: lab(r), hLabel: lab(h), ratio: h / (2 * r), open: kind === 'open' });
  const steps = [`Curved surface: $2\\pi r h = 2 \\times \\pi \\times ${r} \\times ${h} = ${kCurve}\\pi$`, ...(kEnds ? [`${kind === 'total' ? 'Two circular ends' : 'One circular base'}: $${kind === 'total' ? '2 \\times ' : ''}\\pi \\times ${r}^2 = ${kEnds}\\pi$`] : [])];
  if (exact) {
    return {
      prompt: `A cylinder has radius ${L(r)} and height ${L(h)}.<br>Work out ${what}. Give your answer in terms of $\\pi$.`,
      visual,
      answer: piAns(k, 'cm²'),
      distractors: [piAns(r * r * h, 'cm²'), piAns(r * h + kEnds, 'cm²'), piAns(kCurve + 2 * r * r === k ? kCurve + r * r : kCurve + 2 * r * r, 'cm²'), piAns(kCurve, 'cm²'), piAns(4 * r * h + kEnds, 'cm²'), piAns(2 * r * r, 'cm²')].filter((t) => t !== piAns(k, 'cm²')),
      typed: typedPi(k),
      solution: [...steps, `Total $= ${k}\\pi$`, `Answer: ${piAns(k, 'cm²')}`],
    };
  }
  const val = Math.PI * k;
  return {
    prompt: `A cylinder has radius ${L(r)} and height ${L(h)}.<br>Work out ${what}. Give your answer to 1 decimal place.`,
    visual,
    answer: dp1(val, 'cm²'),
    distractors: [...new Set([r * r * h, r * h + kEnds, kCurve, kCurve + r * r, kCurve + 2 * r * r, 4 * r * h + kEnds, kCurve + 4 * r * r, kCurve + 8 * r * r].filter((k2) => k2 !== k).map((k2) => r1(Math.PI * k2)))].map((v) => dp1(v, 'cm²')),
    typed: typed1(val), calculator: true,
    solution: [...steps, `Total $= ${k}\\pi = ${tnum(dec3(val))}\\ldots$`, `Answer: ${dp1(val, 'cm²')}`],
  };
}, { title: 'Surface area of a cylinder' });

export const saReverse = ggen('geo-sa-problem', 'geo-surface-area', (rng, d) => {
  const mode = d === 'easy' ? 'cubeSide' : pick(rng, ['cubeSide', 'paint', d === 'hard' ? 'cubeVol' : 'paint']);
  if (mode === 'cubeSide' || mode === 'cubeVol') {
    const s = int(rng, 2, 12);
    const askV = mode === 'cubeVol';
    const ans = askV ? s ** 3 : s;
    return {
      prompt: `The total surface area of a cube is ${A2(6 * s * s)}.<br>Work out ${askV ? 'the volume of the cube' : 'the length of one edge'}.`,
      visual: cuboidFig(s, s, s, { labels: [null, null, null] }),
      answer: askV ? V3(ans) : L(ans),
      distractors: wrongs(ans, askV ? [s * s, 6 * s * s, (6 * s * s) / 6 * 2, (s + 1) ** 3, s ** 2 * 6 / 4] : [6 * s * s / 4, Math.round(Math.sqrt(6 * s * s)), s * s, 6 * s, s + 1]).filter((v) => Number.isInteger(v)).map((v) => (askV ? V3(v) : L(v))),
      typed: { kind: 'number', value: ans },
      solution: [`A cube has 6 equal square faces: one face $= ${6 * s * s} \\div 6 = ${s * s}$ cm²`, `Edge $= \\sqrt{${s * s}} = ${s}$ cm`, ...(askV ? [`Volume $= ${s}^3 = ${s ** 3}$ cm³`] : []), `Answer: ${askV ? V3(ans) : L(ans)}`],
    };
  }
  // paint: cuboid room walls / box, area covered per tin
  const l = int(rng, 3, 8); const w = int(rng, 2, 6); const h = pick(rng, [2, 3]);
  const walls = 2 * (l + w) * h;
  const cover = pick(rng, [5, 8, 10, 12, 15]);
  const tins = Math.ceil(walls / cover);
  if (walls % cover === 0) throw new Error('exact');
  return {
    prompt: `A room is a cuboid ${lab(l, 'm')} long, ${lab(w, 'm')} wide and ${lab(h, 'm')} high.<br>The four walls are to be painted (ignore doors and windows). One tin of paint covers ${cover} m².<br>How many tins are needed?`,
    visual: cuboidFig(l, w, h, { labels: [lab(l, 'm'), lab(w, 'm'), lab(h, 'm')] }),
    answer: `$${tins}$`,
    distractors: wrongs(tins, [Math.floor(walls / cover), Math.ceil((2 * (l * w + w * h + l * h)) / cover), Math.ceil((l * w * h) / cover), Math.ceil(((l + w) * h) / cover), tins + 1]).map((v) => `$${v}$`),
    typed: { kind: 'number', value: tins },
    solution: [l === w ? `The four walls are all $${l} \\times ${h}$: $4 \\times ${l * h} = ${walls}$ m²` : `Walls: two are $${l} \\times ${h}$ and two are $${w} \\times ${h}$: $2 \\times ${l * h} + 2 \\times ${w * h} = ${walls}$ m²`, `$${walls} \\div ${cover} = ${tnum(roundTo(walls / cover, 2))}$`, `You can't buy part of a tin, so round <b>up</b>: ${tins} tins.`, `Answer: $${tins}$`],
  };
}, { title: 'Surface area problems' });

/* ================================================================== */
/* geo-cones-spheres                                                   */
/* ================================================================== */

const SPHERE_F = 'Volume of a sphere $= \\frac{4}{3}\\pi r^3$';
const SPHERE_SA = 'Surface area of a sphere $= 4\\pi r^2$';
const CONE_V = 'Volume of a cone $= \\frac{1}{3}\\pi r^2 h$';
const CONE_SA = 'Curved surface area of a cone $= \\pi r l$';

export const csSphereVol = ggen('geo-cs-sphere-vol', 'geo-cones-spheres', (rng, d) => {
  const hemi = chance(rng, 0.4);
  const r = d === 'easy' ? pick(rng, [3, 6, 9, 12, 15]) : int(rng, 2, 14);
  const reverse = d === 'hard' && !hemi && chance(rng, 0.4);
  const k = frac(4 * r ** 3, hemi ? 6 : 3);
  const exact = d !== 'hard' || reverse || chance(rng, 0.3);
  const shape = hemi ? 'hemisphere' : 'sphere';
  const visual = hemi ? hemisphereFig({ rLabel: lab(r) }) : sphereFig({ rLabel: reverse ? 'r' : lab(r) });
  if (reverse) {
    return {
      prompt: `A sphere has volume $${k.tex()}\\pi$ cm³.<br>${SPHERE_F}<br>Work out the radius of the sphere.`,
      visual,
      answer: L(r),
      distractors: wrongs(r, [Math.round(Math.sqrt(k.value() * 3 / 4)), r * 2, Math.round(Math.cbrt(k.value())), Math.round((k.value() * 3) / 4 / r), r + 1, r - 1]).map((v) => L(v)),
      typed: { kind: 'number', value: r },
      solution: [`$\\frac{4}{3}\\pi r^3 = ${k.tex()}\\pi$`, `$r^3 = ${k.tex()} \\times \\frac{3}{4} = ${r ** 3}$`, `$r = \\sqrt[3]{${r ** 3}} = ${r}$`, `Answer: ${L(r)}`],
    };
  }
  if (exact && k.isInt) {
    return {
      prompt: `A solid ${shape} has radius ${L(r)}.<br>${SPHERE_F}<br>Work out the volume of the ${shape}. Give your answer in terms of $\\pi$.`,
      visual,
      answer: piAns(k.n, 'cm³'),
      distractors: [piAns(frac(4 * r ** 3, 3).n / (frac(4 * r ** 3, 3).d), 'cm³'), piAns(4 * r * r, 'cm³'), piAns(r ** 3, 'cm³'), piAns(frac(4 * r * r, 3).value() % 1 === 0 ? (4 * r * r) / 3 : 2 * r ** 3, 'cm³'), piAns(k.n * 2, 'cm³'), piAns(frac(4 * r ** 3, 12).isInt ? (r ** 3) / 3 : r ** 3 * 2, 'cm³')].filter((t) => !/\./.test(t)),
      typed: typedPi(k.n),
      solution: [SPHERE_F, `$\\frac{4}{3} \\times \\pi \\times ${r}^3 = \\frac{4}{3} \\times ${r ** 3}\\pi = ${tnum(frac(4 * r ** 3, 3).value())}\\pi$`, ...(hemi ? [`A hemisphere is half a sphere: $${tnum(frac(4 * r ** 3, 3).value())}\\pi \\div 2 = ${k.n}\\pi$`] : []), `Answer: ${piAns(k.n, 'cm³')}`],
    };
  }
  const V = k.value() * Math.PI;
  return {
    prompt: `A solid ${shape} has radius ${L(r)}.<br>${SPHERE_F}<br>Work out the volume of the ${shape}. Give your answer to 1 decimal place.`,
    visual,
    answer: dp1(V, 'cm³'),
    distractors: [(4 / 3) * Math.PI * r ** 3 * (hemi ? 1 : 2), 4 * Math.PI * r * r, Math.PI * r ** 3, (4 / 3) * Math.PI * r * r, V * 8].map((v) => dp1(v, 'cm³')),
    typed: typed1(V), calculator: true,
    solution: [SPHERE_F, `$\\frac{4}{3} \\times \\pi \\times ${r}^3 = ${tnum(dec3((4 / 3) * Math.PI * r ** 3))}\\ldots$`, ...(hemi ? [`Halve it for a hemisphere: $${tnum(dec3(V))}\\ldots$`] : []), `Answer: ${dp1(V, 'cm³')}`],
  };
}, { title: 'Volume of spheres and hemispheres' });

export const csSphereSA = ggen('geo-cs-sphere-sa', 'geo-cones-spheres', (rng, d) => {
  const hemi = d !== 'easy' && chance(rng, 0.5);
  const r = int(rng, 2, 12);
  const k = hemi ? 3 * r * r : 4 * r * r;
  const exact = d !== 'hard' || chance(rng, 0.4);
  const visual = hemi ? hemisphereFig({ rLabel: lab(r) }) : sphereFig({ rLabel: lab(r) });
  const what = hemi ? 'total surface area of the solid hemisphere (curved surface and flat base)' : 'surface area of the sphere';
  const steps = hemi ? [`Curved surface = half of $4\\pi r^2$: $2\\pi \\times ${r}^2 = ${2 * r * r}\\pi$`, `Flat base = a circle: $\\pi \\times ${r}^2 = ${r * r}\\pi$`, `Total $= ${3 * r * r}\\pi$`] : [`$4 \\times \\pi \\times ${r}^2 = ${4 * r * r}\\pi$`];
  if (exact) {
    return {
      prompt: `A solid ${hemi ? 'hemisphere' : 'sphere'} has radius ${L(r)}.<br>${SPHERE_SA}<br>Work out the ${what}. Give your answer in terms of $\\pi$.`,
      visual,
      answer: piAns(k, 'cm²'),
      distractors: [piAns(2 * r * r, 'cm²'), piAns(4 * r * r * (hemi ? 1 : 2), 'cm²'), piAns(16 * r * r, 'cm²'), piAns(4 * r, 'cm²'), piAns(r * r, 'cm²'), piAns(5 * r * r, 'cm²')].filter((t) => t !== piAns(k, 'cm²')),
      typed: typedPi(k),
      solution: [SPHERE_SA, ...steps, `Answer: ${piAns(k, 'cm²')}`],
    };
  }
  const val = Math.PI * k;
  return {
    prompt: `A solid ${hemi ? 'hemisphere' : 'sphere'} has radius ${L(r)}.<br>${SPHERE_SA}<br>Work out the ${what}. Give your answer to 1 decimal place.`,
    visual,
    answer: dp1(val, 'cm²'),
    distractors: [Math.PI * 2 * r * r, Math.PI * 4 * r * r * (hemi ? 1 : 2), Math.PI * 16 * r * r, (4 / 3) * Math.PI * r ** 3, Math.PI * 5 * r * r].map((v) => dp1(v, 'cm²')),
    typed: typed1(val), calculator: true,
    solution: [SPHERE_SA, ...steps, `$= ${tnum(dec3(val))}\\ldots$`, `Answer: ${dp1(val, 'cm²')}`],
  };
}, { title: 'Surface area of spheres and hemispheres' });

const CONE_TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [7, 24, 25], [12, 16, 20]];

export const csConeVol = ggen('geo-cs-cone-vol', 'geo-cones-spheres', (rng, d) => {
  const useSlant = d === 'hard';
  let r; let h; let l = null;
  if (useSlant) { const t = pick(rng, CONE_TRIPLES); const swap = chance(rng, 0.5); r = swap ? t[1] : t[0]; h = swap ? t[0] : t[1]; l = t[2]; } else { r = int(rng, 2, 10); h = 3 * int(rng, 1, 6) * (r % 3 === 0 ? 1 : 1); }
  const k = frac(r * r * h, 3);
  const exact = d === 'easy' || (k.isInt && chance(rng, 0.5));
  const visual = coneFig({ rLabel: lab(r), hLabel: useSlant ? null : lab(h), lLabel: useSlant ? lab(l) : null, ratio: Math.max(1, h / r) });
  const pre = useSlant ? [`The perpendicular height, slant height and radius make a right-angled triangle: $h = \\sqrt{${l}^2 - ${r}^2} = \\sqrt{${l * l - r * r}} = ${h}$`] : [];
  if (exact) {
    const ans = `$${k.isInt ? (k.n === 1 ? '' : k.n) : k.tex()}\\pi$ cm³`;
    return {
      prompt: `A cone has base radius ${L(r)} and ${useSlant ? `slant height ${L(l)}` : `perpendicular height ${L(h)}`}.<br>${CONE_V}<br>Work out the volume. Give your answer in terms of $\\pi$.`,
      visual, answer: ans,
      distractors: [`$${r * r * h}\\pi$ cm³`, `$${frac(r * h, 3).isInt ? (r * h) / 3 : frac(r * h, 3).tex()}\\pi$ cm³`, `$${frac(4 * r * r * h, 3).isInt ? (4 * r * r * h) / 3 : frac(4 * r * r * h, 3).tex()}\\pi$ cm³`, `$${frac(r * r * (l || h + 1), 3).isInt ? (r * r * (l || h + 1)) / 3 : frac(r * r * (l || h + 1), 3).tex()}\\pi$ cm³`, `$${frac(2 * r * r * h, 3).isInt ? (2 * r * r * h) / 3 : frac(2 * r * r * h, 3).tex()}\\pi$ cm³`],
      typed: k.isInt ? typedPi(k.n) : undefined,
      solution: [...pre, CONE_V, `$\\frac{1}{3} \\times \\pi \\times ${r}^2 \\times ${h} = \\frac{${r * r * h}}{3}\\pi$`, `Answer: ${ans}`],
    };
  }
  const V = k.value() * Math.PI;
  return {
    prompt: `A cone has base radius ${L(r)} and ${useSlant ? `slant height ${L(l)}` : `perpendicular height ${L(h)}`}.<br>${CONE_V}<br>Work out the volume. Give your answer to 1 decimal place.`,
    visual,
    answer: dp1(V, 'cm³'),
    distractors: [Math.PI * r * r * h, (Math.PI * r * h) / 3, (Math.PI * r * r * (l || h * 2)) / 3, (Math.PI * 4 * r * r * h) / 3, V / 2].map((v) => dp1(v, 'cm³')),
    typed: typed1(V), calculator: true,
    solution: [...pre, CONE_V, `$\\frac{1}{3} \\times \\pi \\times ${r}^2 \\times ${h} = ${tnum(dec3(V))}\\ldots$`, useSlant ? 'Use the perpendicular height, not the slant height.' : 'Remember the $\\frac{1}{3}$ — a cone is a third of the cylinder with the same base and height.', `Answer: ${dp1(V, 'cm³')}`],
  };
}, { title: 'Volume of a cone' });

export const csConeSA = ggen('geo-cs-cone-sa', 'geo-cones-spheres', (rng, d) => {
  const t = pick(rng, CONE_TRIPLES); const swap = chance(rng, 0.5);
  const r = swap ? t[1] : t[0]; const h = swap ? t[0] : t[1]; const l = t[2];
  const needL = d === 'hard';
  const total = d !== 'easy' && chance(rng, 0.6);
  const k = r * l + (total ? r * r : 0);
  const visual = coneFig({ rLabel: lab(r), hLabel: needL ? lab(h) : null, lLabel: needL ? null : lab(l), ratio: Math.max(1, h / r) });
  const exact = d !== 'hard' || chance(rng, 0.5);
  const steps = [...(needL ? [`Slant height: $l = \\sqrt{${r}^2 + ${h}^2} = \\sqrt{${r * r + h * h}} = ${l}$`] : []), `Curved surface: $\\pi \\times ${r} \\times ${l} = ${r * l}\\pi$`, ...(total ? [`Base: $\\pi \\times ${r}^2 = ${r * r}\\pi$; total $= ${k}\\pi$`] : [])];
  const what = total ? 'total surface area (curved surface and base)' : 'curved surface area';
  if (exact) {
    return {
      prompt: `A solid cone has base radius ${L(r)} and ${needL ? `perpendicular height ${L(h)}` : `slant height ${L(l)}`}.<br>${CONE_SA}<br>Work out the ${what}. Give your answer in terms of $\\pi$.`,
      visual,
      answer: piAns(k, 'cm²'),
      distractors: [piAns(r * h + (total ? r * r : 0), 'cm²'), piAns(r * l + (total ? 0 : r * r), 'cm²'), piAns(2 * r * l + (total ? r * r : 0), 'cm²'), piAns(r * r * l, 'cm²'), piAns(r * l + 2 * r * r, 'cm²')].filter((x) => x !== piAns(k, 'cm²')),
      typed: typedPi(k),
      solution: [CONE_SA, ...steps, `Answer: ${piAns(k, 'cm²')}`],
    };
  }
  const val = Math.PI * k;
  return {
    prompt: `A solid cone has base radius ${L(r)} and perpendicular height ${L(h)}.<br>${CONE_SA}<br>Work out the ${what}. Give your answer to 1 decimal place.`,
    visual,
    answer: dp1(val, 'cm²'),
    distractors: [Math.PI * (r * h + (total ? r * r : 0)), Math.PI * (r * l + (total ? 0 : r * r)), Math.PI * (2 * r * l + r * r), (Math.PI * r * r * h) / 3, Math.PI * (r * l + 2 * r * r)].map((v) => dp1(v, 'cm²')),
    typed: typed1(val), calculator: true,
    solution: [CONE_SA, ...steps, `$= ${tnum(dec3(val))}\\ldots$`, `Answer: ${dp1(val, 'cm²')}`],
  };
}, { title: 'Surface area of a cone' });

export const csPyramid = ggen('geo-cs-pyramid', 'geo-cones-spheres', (rng, d) => {
  const sq = d === 'easy' || chance(rng, 0.6);
  const a = int(rng, 3, 12); const b = sq ? a : int(rng, 3, 12); const h = 3 * int(rng, 1, 6) + (d === 'hard' ? int(rng, 0, 2) : 0);
  const V = (a * b * h) / 3;
  if (!Number.isInteger(V * 3)) throw new Error('x');
  const reverse = d === 'hard' && chance(rng, 0.5) && Number.isInteger(V);
  const visual = pyramidFig({ aLabel: lab(a), bLabel: lab(b), hLabel: reverse ? 'h' : lab(h), ratio: h / Math.max(a, b) * 1.3 });
  const Vt = Number.isInteger(V) ? tnum(V) : frac(a * b * h, 3).tex({ mixed: false });
  if (reverse) {
    return {
      prompt: `A pyramid has a ${sq ? 'square' : 'rectangular'} base ${lab(a)} by ${lab(b)} and volume ${V3(V)}.<br>Volume of a pyramid $= \\frac{1}{3} \\times$ area of base $\\times$ height<br>Work out the perpendicular height $h$.`,
      visual,
      answer: L(h),
      distractors: wrongs(h, [V / (a * b), (2 * V) / (a * b), V / a, h * 2, (3 * V) / (a + b)].filter((v) => Number.isInteger(v)), { min: 0 }).map((v) => L(v)),
      typed: { kind: 'number', value: h },
      solution: [`Base area $= ${a} \\times ${b} = ${a * b}$`, `$\\frac{1}{3} \\times ${a * b} \\times h = ${V}$, so $${a * b}h = ${3 * V}$`, `$h = ${3 * V} \\div ${a * b} = ${h}$`, `Answer: ${L(h)}`],
    };
  }
  if (!Number.isInteger(V)) throw new Error('non-integer');
  return {
    prompt: `A pyramid has a ${sq ? 'square' : 'rectangular'} base ${lab(a)} by ${lab(b)} and perpendicular height ${lab(h)}.<br>Volume of a pyramid $= \\frac{1}{3} \\times$ area of base $\\times$ height<br>Work out the volume.`,
    visual,
    answer: V3(V),
    distractors: wrongs(V, [a * b * h, (a * b * h) / 2, a * b + h, (a + b) * h / 3, 2 * V, V + a * b]).map((v) => V3(v)),
    typed: { kind: 'number', value: V },
    solution: [`Base area $= ${a} \\times ${b} = ${a * b}$ cm²`, `Volume $= \\frac{1}{3} \\times ${a * b} \\times ${h} = ${Vt}$`, `Answer: ${V3(V)}`],
  };
}, { title: 'Volume of a pyramid' });

export const csComposite = ggen('geo-cs-composite', 'geo-cones-spheres', (rng, d) => {
  const mode = pick(rng, ['coneHemi', 'cylHemi', 'cylCone']);
  const r = d === 'easy' ? pick(rng, [3, 6]) : d === 'medium' ? pick(rng, [3, 6, 9, 2, 4, 5]) : int(rng, 2, 11); const h = d === 'hard' ? int(rng, 4, 20) : 3 * int(rng, 1, 5);
  let k; let parts; let label;
  if (mode === 'coneHemi') { k = frac(r * r * h, 3).add(frac(2 * r ** 3, 3)); parts = [`Cone: $\\frac{1}{3}\\pi \\times ${r}^2 \\times ${h} = ${frac(r * r * h, 3).tex()}\\pi$`, `Hemisphere: $\\frac{1}{2} \\times \\frac{4}{3}\\pi \\times ${r}^3 = ${frac(2 * r ** 3, 3).tex()}\\pi$`]; label = `a hemisphere on top of a cone of height ${lab(h)}, both with radius ${lab(r)} (like an ice-cream)`; } else if (mode === 'cylHemi') { k = frac(r * r * h).add(frac(2 * r ** 3, 3)); parts = [`Cylinder: $\\pi \\times ${r}^2 \\times ${h} = ${r * r * h}\\pi$`, `Hemisphere: $\\frac{2}{3}\\pi \\times ${r}^3 = ${frac(2 * r ** 3, 3).tex()}\\pi$`]; label = `a cylinder of height ${lab(h)} with a hemisphere on top, both with radius ${lab(r)}`; } else { k = frac(r * r * h).add(frac(r * r * h, 3)); parts = [`Cylinder: $\\pi \\times ${r}^2 \\times ${h} = ${r * r * h}\\pi$`, `Cone: $\\frac{1}{3}\\pi \\times ${r}^2 \\times ${h} = ${frac(r * r * h, 3).tex()}\\pi$`]; label = `a cylinder and a cone, each of height ${lab(h)} and radius ${lab(r)}`; }
  const exact = d !== 'hard' && k.isInt;
  const formulas = `${SPHERE_F}<br>${CONE_V}`;
  const visual = compositeFig(mode, { rLabel: lab(r), hLabel: lab(h), h2Label: mode === 'cylCone' ? lab(h) : null, ratio: mode === 'coneHemi' ? h / r : h / (2 * r), ratio2: h / r });
  const note = '';
  if (exact) {
    const wrong = [k.add(frac(2 * r ** 3, 3)), k.sub(frac(r * r * h, 3 * 1)).add(frac(r * r * h)), frac(r * r * h).add(frac(4 * r ** 3, 3)), k.mul(2), k.add(1)].filter((q) => q.isInt && !q.eq(k));
    return {
      prompt: `A solid is made from ${label}.${note}<br>${formulas}<br>Work out the total volume. Give your answer in terms of $\\pi$.`,
      visual,
      answer: piAns(k.n, 'cm³'),
      distractors: [...wrong.map((q) => piAns(q.n, 'cm³')), piAns(k.n + r * r, 'cm³'), piAns(k.n * 3, 'cm³'), piAns(k.n + 2 * r, 'cm³')],
      typed: typedPi(k.n),
      solution: [...parts, `Total $= ${k.n}\\pi$`, `Answer: ${piAns(k.n, 'cm³')}`],
    };
  }
  const V = k.value() * Math.PI;
  return {
    prompt: `A solid is made from ${label}.${note}<br>${formulas}<br>Work out the total volume. Give your answer to 1 decimal place.`,
    visual,
    answer: dp1(V, 'cm³'),
    distractors: [V + (2 / 3) * Math.PI * r ** 3, Math.PI * (r * r * h + (4 / 3) * r ** 3), V * 2, V - Math.PI * r * r, Math.PI * r * r * h * 2].map((v) => dp1(v, 'cm³')),
    typed: typed1(V), calculator: true,
    solution: [...parts, `Total $= ${k.tex()}\\pi = ${tnum(dec3(V))}\\ldots$`, `Answer: ${dp1(V, 'cm³')}`],
  };
}, { title: 'Volume of composite solids' });

export const volumeGenerators = [
  volCuboid, volCuboidMissing, volCubesFit, volCapacity,
  volPrismTri, volPrismCross, volCylinder, volPrismReverse,
  saCuboid, saTriPrism, saCylinder, saReverse,
  csSphereVol, csSphereSA, csConeVol, csConeSA, csPyramid, csComposite,
];
