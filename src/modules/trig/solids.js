// Pythagoras and trigonometry in 3D: cuboids, pyramids, prisms.
import { gen, pick, int, num, tnum, roundTo, chance, shuffle } from '../../core.js';
import { fig, cuboid, pyramid, triPrism, edges, ACCENT } from './diagrams.js';
import {
  DP1, roundingFor, L, A, At, fmtVals, sinD, tanD, asinD, atanD, approxT, nice,
} from './helpers.js';

const clampDims = (dims) => {
  const m = Math.max(...dims);
  return dims.map((v) => Math.max(v, m * 0.45));
};

/** Cuboid figure: labels { AB, BC, CG } (edge -> label), lines: extra segments, angle at A between AC and AG. */
export function cuboidFig({ w, d, h, labels = {}, diag = true, base = false, angle = null, width = 360, height = 250 }) {
  let [dw, dd, dh] = clampDims([w, d * 1.15, h]);
  // In this projection AG runs through F when width : height = 0.5 : 0.36; keep clear of that
  if (Math.abs(dw / dh - 0.5 / 0.36) < 0.3) dw = dw / dh > 0.5 / 0.36 ? dh * 1.75 : dh * 1.05;
  const cb = cuboid(dw, dd, dh);
  return fig({
    pts: cb.pts, width, height, pad: 36,
    draw: (g) => {
      let out = g.poly('ABFE', { fill: 'var(--d-fill, #e8eefc)', fillOpacity: 0.55, width: 0 }) + g.poly('BCGF', { fill: 'var(--d-fill, #e8eefc)', fillOpacity: 0.35, width: 0 }) + g.poly('EFGH', { fill: 'var(--d-fill, #e8eefc)', fillOpacity: 0.25, width: 0 });
      out += edges(g, cb.visible) + edges(g, cb.hidden, { dash: '5 4', width: 1.4 });
      if (base) out += g.seg('A', 'C', { dash: '5 4', width: 1.6, color: ACCENT });
      if (diag) out += g.seg('A', 'G', { width: 2.2, color: ACCENT });
      if (angle) out += g.angle('A', 'C', 'G', angle, { r: 30 });
      for (const [e, lab] of Object.entries(labels)) if (lab) out += g.side(e[0], e[1], lab, { inside: e === 'AB' ? 'E' : e === 'BC' ? 'A' : 'B' });
      const dirs = { A: [-0.8, 0.6], B: [0.4, 1], C: [1, 0.25], E: [-1, -0.3], F: [-0.3, -1], G: [0.7, -0.7], H: [-0.2, -1] };
      out += Object.entries(dirs).map(([v, dir]) => g.name(v, v, { dir, size: 14, offset: 4 })).join('');
      out += g.freeName('D', 'D', { size: 14, offset: 3 });
      return out;
    },
  });
}

/** Integer cuboid diagonals a² + b² + c² = d². */
const QUADS = [[2, 3, 6, 7], [1, 4, 8, 9], [4, 4, 7, 9], [2, 6, 9, 11], [6, 6, 7, 11], [3, 4, 12, 13], [2, 10, 11, 15], [2, 5, 14, 15], [8, 9, 12, 17], [6, 10, 15, 19], [4, 5, 20, 21], [12, 16, 21, 29], [4, 6, 12, 14], [6, 9, 18, 21], [3, 6, 6, 9], [4, 8, 8, 12]];

export const cuboidDiagonal = gen('trig-3d-cuboid-diagonal', 'trig-3d', (rng, d) => {
  const unit = 'cm';
  let w; let dp; let h;
  if (d === 'easy') { const q = pick(rng, QUADS); [w, dp, h] = shuffle(rng, q.slice(0, 3)); } else { w = int(rng, 4, 20); dp = int(rng, 3, 15); h = int(rng, 3, 15); }
  const diagL = Math.sqrt(w * w + dp * dp + h * h);
  const findSide = d === 'hard' && chance(rng, 0.5);
  const r = d === 'easy' ? null : roundingFor(rng, d);
  if (findSide) {
    // AG and two edges known; find the height
    const ag = Math.ceil(diagL) + int(rng, 0, 3);
    const hh = Math.sqrt(ag * ag - w * w - dp * dp);
    const f = (v) => `${r.fmt(v)} ${unit}`;
    const vis = cuboidFig({ w, d: dp, h: hh, labels: { AB: L(w, unit), BC: L(dp, unit), CG: 'h' } });
    return {
      prompt: `The diagram shows a cuboid $ABCDEFGH$. The diagonal $AG$ is ${ag} cm long.<br>Work out the height $h$ of the cuboid. ${r.text}`,
      visual: vis,
      answer: f(hh),
      distractors: fmtVals([Math.sqrt(ag * ag + w * w + dp * dp), ag - w - dp, Math.sqrt(Math.abs(ag * ag - w * w)), Math.sqrt(Math.abs(ag * ag - dp * dp)), Math.sqrt(ag * ag - w * w - dp * dp) * 2], f),
      typed: r.typed(hh),
      calculator: true,
      solution: [
        'In 3D, the diagonal of a cuboid satisfies $AG^2 = \\text{length}^2 + \\text{width}^2 + \\text{height}^2$.',
        `$${ag}^2 = ${w}^2 + ${dp}^2 + h^2$, so $h^2 = ${ag * ag} - ${w * w} - ${dp * dp} = ${ag * ag - w * w - dp * dp}$`,
        `$h = \\sqrt{${ag * ag - w * w - dp * dp}} = ${approxT(hh)}$`,
        `Answer: <b>${f(hh)}</b>`,
      ],
    };
  }
  const f = (v) => (r ? `${r.fmt(v)} ${unit}` : `${num(roundTo(v, 6))} ${unit}`);
  const vis = cuboidFig({ w, d: dp, h, labels: { AB: L(w, unit), BC: L(dp, unit), CG: L(h, unit) }, base: true });
  const ac = Math.hypot(w, dp);
  const wrong = [ac, w + dp + h, Math.hypot(w, h), ac + h, (w * w + dp * dp + h * h) < 1500 ? w * w + dp * dp + h * h : NaN, Math.hypot(dp, h)];
  return {
    prompt: `The diagram shows a cuboid $ABCDEFGH$.<br>Work out the length of the diagonal $AG$.${r ? ` ${r.text}` : ''}`,
    visual: vis,
    answer: f(diagL),
    distractors: fmtVals(r ? wrong : wrong.filter((v) => nice(v)), f),
    typed: r ? r.typed(diagL) : { kind: 'number', value: diagL },
    calculator: Boolean(r),
    hint: 'First find the diagonal of the base, $AC$. Then use triangle $ACG$.',
    solution: [
      `Step 1 – the base $ABCD$: $AC^2 = ${w}^2 + ${dp}^2 = ${w * w + dp * dp}$.`,
      `Step 2 – triangle $ACG$ has a right angle at $C$ (the edge $CG$ is vertical): $AG^2 = AC^2 + CG^2 = ${w * w + dp * dp} + ${h}^2 = ${w * w + dp * dp + h * h}$.`,
      `$AG = \\sqrt{${w * w + dp * dp + h * h}} = ${r ? approxT(diagL) : tnum(diagL)}$ (in one go: $\\sqrt{${w}^2 + ${dp}^2 + ${h}^2}$).`,
      `Answer: <b>${f(diagL)}</b>`,
    ],
  };
}, { title: 'Length of a cuboid diagonal', learn: ['trig-3d', 'trig-pythagoras'] });

export const cuboidAngle = gen('trig-3d-cuboid-angle', 'trig-3d', (rng, d) => {
  const unit = 'cm';
  const fa = (v) => A(roundTo(v, 1), 1);
  if (d === 'hard' && chance(rng, 0.5)) {
    // Diagonal length + angle with base + base area -> volume
    const ag = int(rng, 12, 30); const th = int(rng, 18, 50); const baseArea = int(rng, 6, 30) * 10;
    const hh = ag * sinD(th); const vol = baseArea * hh;
    const r = roundingFor(rng, d);
    const f = (v) => `${r.fmt(v)} cm³`;
    const ac = ag * Math.cos((th * Math.PI) / 180);
    const w = Math.sqrt(baseArea * 1.4); const dp = baseArea / w;
    const vis = cuboidFig({ w, d: dp, h: hh, labels: {}, base: true, angle: `${th}°` });
    return {
      prompt: `The diagram shows a cuboid. The diagonal $AG$ is ${ag} cm long and makes an angle of $${At(th)}$ with the base $ABCD$. The area of the base is ${baseArea} cm².<br>Work out the volume of the cuboid. ${r.text}`,
      visual: vis,
      answer: f(vol),
      distractors: fmtVals([baseArea * ac, baseArea * ag * tanD(th), baseArea * ag, baseArea * hh / 2, baseArea * hh / 3, baseArea * ag * Math.abs(Math.sin(th))], f),
      typed: r.typed(vol),
      calculator: true,
      solution: [
        `Triangle $ACG$ has a right angle at $C$. The height $CG$ is opposite the ${'$' + At(th) + '$'} angle and $AG$ is the hypotenuse.`,
        `$CG = ${ag} \\times \\sin ${At(th)} = ${approxT(hh)}$ cm`,
        `Volume $=$ base area $\\times$ height $= ${baseArea} \\times ${approxT(hh)} = ${approxT(vol)}$`,
        `Answer: <b>${f(vol)}</b>`,
      ],
    };
  }
  let w; let dp; let h;
  w = int(rng, 4, 15); dp = int(rng, 3, 12); h = int(rng, 3, 12);
  const giveAC = d === 'easy';
  const ac = Math.hypot(w, dp);
  if (giveAC) { const acR = int(rng, 6, 20); w = acR * 0.8; dp = acR * 0.6; }
  const acUse = giveAC ? Math.hypot(w, dp) : ac;
  const th = atanD(h / acUse);
  const labels = giveAC ? { CG: L(h, unit) } : { AB: L(w, unit), BC: L(dp, unit), CG: L(h, unit) };
  const vis = cuboidFig({ w, d: dp, h, labels, base: true, angle: 'x' });
  const acText = giveAC ? num(roundTo(acUse, 6)) : null;
  return {
    prompt: giveAC
      ? `The diagram shows a cuboid. The diagonal of the base, $AC$, is ${acText} cm and the height $CG$ is ${h} cm.<br>Work out the angle $x$ between the diagonal $AG$ and the base $ABCD$. Give your answer to 1 decimal place.`
      : 'The diagram shows a cuboid.<br>Work out the angle $x$ between the diagonal $AG$ and the base $ABCD$. Give your answer to 1 decimal place.',
    visual: vis,
    answer: fa(th),
    distractors: fmtVals([90 - th, atanD(h / w), atanD(h / dp), h < acUse ? asinD(h / acUse) : NaN, (th * Math.PI) / 180, atanD(h / (w + dp))], fa),
    typed: DP1.typed(th),
    calculator: true,
    hint: 'The angle is in triangle $ACG$, which has a right angle at $C$.',
    solution: [
      ...(giveAC ? [] : [`Step 1 – base diagonal: $AC = \\sqrt{${w}^2 + ${dp}^2} = \\sqrt{${w * w + dp * dp}} = ${approxT(ac)}$ cm.`]),
      `In triangle $ACG$ (right angle at $C$): $CG = ${h}$ is opposite $x$ and $AC$ is adjacent.`,
      `$\\tan x = \\frac{${h}}{${giveAC ? acText : approxT(ac)}}$, so $x = \\tan^{-1}\\left(\\frac{${h}}{${giveAC ? acText : approxT(ac)}}\\right) = ${approxT(th)}^\\circ$`,
      `Answer: <b>${fa(th)}</b>`,
    ],
  };
}, { title: 'Angle between a cuboid diagonal and the base', learn: ['trig-3d', 'trig-sohcahtoa-angle'] });

export function pyramidFig({ s, h, labels = {}, angle = null, showHeight = true }) {
  const dh = Math.min(Math.max(h, s * 0.8), s * 1.15);
  const py = pyramid(s, s * 1.1, dh);
  return fig({
    pts: py.pts, width: 340, height: 250, pad: 34,
    draw: (g) => {
      let out = g.poly('ABE', { fillOpacity: 0.5, width: 0 }) + g.poly('BCE', { fillOpacity: 0.3, width: 0 });
      out += edges(g, py.visible) + edges(g, py.hidden, { dash: '5 4', width: 1.4 });
      if (showHeight) out += g.seg('E', 'M', { dash: '5 4', width: 1.6, color: ACCENT }) + g.seg('A', 'M', { dash: '5 4', width: 1.6, color: ACCENT }) + g.dot('M', 2.6);
      if (angle) out += g.angle('A', 'M', 'E', angle, { r: 26 });
      for (const [e, lab] of Object.entries(labels)) if (lab) out += g.side(e[0], e[1], lab, { inside: e === 'EM' ? 'C' : e === 'AB' ? 'E' : 'M' });
      out += ['A', 'B', 'C', 'D', 'E'].map((v) => g.name(v, v, { away: 'M', size: 14, offset: 6 })).join('');
      if (showHeight) out += g.name('M', 'M', { dir: [0.6, 1], size: 13, offset: 4 });
      return out;
    },
  });
}

export const pyramid3d = gen('trig-3d-pyramid', 'trig-3d', (rng, d) => {
  const unit = 'cm';
  const mode = d === 'easy' ? 'height' : d === 'medium' ? pick(rng, ['height', 'angle']) : pick(rng, ['angle', 'edgeAngle', 'height']);
  const s = 2 * int(rng, 3, 10);
  const am = (s * Math.SQRT2) / 2;
  const intro = `$ABCDE$ is a square-based pyramid. The base $ABCD$ is a square of side ${s} cm. The apex $E$ is vertically above $M$, the centre of the base.`;
  if (mode === 'height') {
    const ea = Math.ceil(am + 2) + int(rng, 0, 8);
    const hh = Math.sqrt(ea * ea - am * am);
    const r = roundingFor(rng, d);
    const f = (v) => `${r.fmt(v)} ${unit}`;
    const vis = pyramidFig({ s, h: hh, labels: { AB: L(s, unit), EA: L(ea, unit) } });
    return {
      prompt: `${intro} $EA = ${ea}$ cm.<br>Work out the height $EM$ of the pyramid. ${r.text}`,
      visual: vis,
      answer: f(hh),
      distractors: fmtVals([Math.sqrt(ea * ea - (s / 2) ** 2), Math.sqrt(ea * ea - s * s), Math.hypot(ea, am), Math.sqrt(Math.max(0, ea * ea - 2 * s * s)) || NaN, ea - am], f),
      typed: r.typed(hh),
      calculator: true,
      hint: '$M$ is the midpoint of the diagonal $AC$, so $AM$ is half the diagonal (not half the side).',
      solution: [
        `$AC$ is the diagonal of the square: $AC = \\sqrt{${s}^2 + ${s}^2} = \\sqrt{${2 * s * s}}$, so $AM = \\frac{1}{2}AC = ${approxT(am)}$ cm.`,
        `Triangle $AME$ has a right angle at $M$, with hypotenuse $EA = ${ea}$.`,
        `$EM^2 = ${ea}^2 - AM^2 = ${ea * ea} - ${2 * s * s / 4} = ${ea * ea - (s * s) / 2}$, so $EM = ${approxT(hh)}$`,
        `Answer: <b>${f(hh)}</b>`,
      ],
    };
  }
  const hh = int(rng, Math.ceil(am * 0.6), Math.round(am * 2.2));
  const th = atanD(hh / am);
  const fa = (v) => A(roundTo(v, 1), 1);
  if (mode === 'edgeAngle') {
    // angle between EA and base given slant EA instead of height
    const ea = Math.ceil(Math.hypot(am, hh));
    const t2 = Math.acos(am / ea) * 180 / Math.PI;
    const vis = pyramidFig({ s, h: Math.sqrt(ea * ea - am * am), labels: { AB: L(s, unit), EA: L(ea, unit) }, angle: 'x' });
    return {
      prompt: `${intro} $EA = ${ea}$ cm.<br>Work out the angle $x$ between the edge $EA$ and the base. Give your answer to 1 decimal place.`,
      visual: vis,
      answer: fa(t2),
      distractors: fmtVals([90 - t2, Math.acos(Math.min(1, s / 2 / ea)) * 180 / Math.PI, Math.acos(Math.min(1, s / ea)) * 180 / Math.PI, asinD(Math.min(1, am / ea)), (t2 * Math.PI) / 180], fa),
      typed: DP1.typed(t2),
      calculator: true,
      solution: [
        `$AM$ is half of the diagonal $AC$: $AM = \\frac{1}{2}\\sqrt{${s}^2 + ${s}^2} = ${approxT(am)}$ cm.`,
        `In triangle $AME$ (right angle at $M$), $AM$ is adjacent to $x$ and $EA$ is the hypotenuse: $\\cos x = \\frac{${approxT(am)}}{${ea}}$`,
        `$x = \\cos^{-1}\\left(\\frac{${approxT(am)}}{${ea}}\\right) = ${approxT(t2)}^\\circ$`,
        `Answer: <b>${fa(t2)}</b>`,
      ],
    };
  }
  const vis = pyramidFig({ s, h: hh, labels: { AB: L(s, unit) }, angle: 'x' });
  return {
    prompt: `${intro} The height $EM$ is ${hh} cm.<br>Work out the angle $x$ between the edge $EA$ and the base. Give your answer to 1 decimal place.`,
    visual: vis,
    answer: fa(th),
    distractors: fmtVals([90 - th, atanD(hh / (s / 2)), atanD(hh / s), atanD(hh / (s * Math.SQRT2)), (th * Math.PI) / 180, asinD(Math.min(1, am / hh))], fa),
    typed: DP1.typed(th),
    calculator: true,
    hint: 'Use the right-angled triangle $AME$. $AM$ is half the diagonal of the base.',
    solution: [
      `$AM$ is half the diagonal of the square base: $AM = \\frac{1}{2}\\sqrt{${s}^2 + ${s}^2} = ${approxT(am)}$ cm (not half the side, ${s / 2} cm).`,
      `In triangle $AME$ (right angle at $M$): $EM$ is opposite $x$, $AM$ is adjacent: $\\tan x = \\frac{${hh}}{${approxT(am)}}$`,
      `$x = \\tan^{-1}\\left(\\frac{${hh}}{${approxT(am)}}\\right) = ${approxT(th)}^\\circ$`,
      `Answer: <b>${fa(th)}</b>`,
    ],
  };
}, { title: 'Square-based pyramid: height and angles', learn: ['trig-3d', 'trig-sohcahtoa-angle'] });

function prismFig({ base, height, l, labels = {}, line = null, angle = null, mid = false }) {
  const [db, dh, dl] = clampDims([base, height, l * 1.1]);
  const pr = triPrism(db, dh, dl);
  const pts = { ...pr.pts };
  if (mid) pts.M = [(pts.C[0] + pts.F[0]) / 2, (pts.C[1] + pts.F[1]) / 2];
  return fig({
    pts, width: 360, height: 240, pad: 34,
    draw: (g) => {
      let out = g.poly('ABC', { fillOpacity: 0.55, width: 0 }) + g.poly('ACFD', { fillOpacity: 0.3, width: 0 });
      out += edges(g, pr.visible) + edges(g, pr.hidden, { dash: '5 4', width: 1.4 });
      out += g.right('B', 'A', 'C', 9);
      if (line) out += g.seg(line[0], line[1], { width: 2.2, color: ACCENT }) + g.seg('B', line[1], { dash: '5 4', width: 1.6, color: ACCENT });
      if (angle) out += g.angle(line[1], 'B', line[0], angle, { r: 30 });
      for (const [e, lab] of Object.entries(labels)) if (lab) out += g.side(e[0], e[1], lab, { inside: e === 'AB' ? 'C' : e === 'BC' ? 'A' : 'A' });
      const dirs = { A: [-1, -0.2], B: [-0.7, 0.7], C: [0.3, 1], D: [0, -1], F: [1, 0] };
      out += Object.entries(dirs).map(([v, dir]) => g.name(v, v, { dir, size: 14, offset: 4 })).join('');
      out += g.freeName('E', 'E', { size: 14, offset: 3 });
      if (mid) out += g.dot('M', 2.6) + g.name('M', 'M', { dir: [1, 0.4], size: 14, offset: 5 });
      return out;
    },
  });
}

export const prism3d = gen('trig-3d-prism', 'trig-3d', (rng, d) => {
  const unit = 'cm';
  const base = int(rng, 4, 12); const height = int(rng, 3, 10); const l = int(rng, 8, 20);
  const mode = d === 'easy' ? 'length' : d === 'medium' ? pick(rng, ['length', 'angle']) : pick(rng, ['angle', 'midpoint']);
  const intro = `The diagram shows a triangular prism. The cross-section $ABC$ has a right angle at $B$.`;
  if (mode === 'midpoint') {
    // AM known (M midpoint of CF), find volume
    const r = roundingFor(rng, d);
    const am = Math.ceil(Math.sqrt(height * height + base * base + (l / 2) ** 2)) + int(rng, 0, 2);
    const half = Math.sqrt(am * am - height * height - base * base);
    const len = 2 * half; const vol = 0.5 * base * height * len;
    const f = (v) => `${r.fmt(v)} cm³`;
    const vis = prismFig({ base, height, l: len, labels: { AB: L(height, unit), BC: L(base, unit) }, mid: true, line: ['A', 'M'] });
    return {
      prompt: `${intro} $AB = ${height}$ cm and $BC = ${base}$ cm. $M$ is the midpoint of $CF$ and $AM = ${am}$ cm.<br>Work out the volume of the prism. ${r.text}`,
      visual: vis,
      answer: f(vol),
      distractors: fmtVals([0.5 * base * height * half, base * height * len, 0.5 * base * height * am, 0.5 * base * height * Math.sqrt(am * am - height * height), base * height * half], f),
      typed: r.typed(vol),
      calculator: true,
      solution: [
        `Triangle $ABM$ has a right angle at $B$: $BM^2 = AM^2 - AB^2 = ${am * am} - ${height * height} = ${am * am - height * height}$.`,
        `Triangle $BCM$ has a right angle at $C$: $CM^2 = BM^2 - BC^2 = ${am * am - height * height} - ${base * base} = ${am * am - height * height - base * base}$, so $CM = ${approxT(half)}$ cm and the length $CF = 2 \\times CM = ${approxT(len)}$ cm.`,
        `Volume $=$ area of cross-section $\\times$ length $= \\frac{1}{2} \\times ${base} \\times ${height} \\times ${approxT(len)} = ${approxT(vol)}$`,
        `Answer: <b>${f(vol)}</b>`,
      ],
    };
  }
  const bf = Math.hypot(base, l); const af = Math.sqrt(base * base + height * height + l * l);
  const labels = { AB: L(height, unit), BC: L(base, unit), CF: L(l, unit) };
  if (mode === 'length') {
    const r = roundingFor(rng, d);
    const f = (v) => `${r.fmt(v)} ${unit}`;
    const vis = prismFig({ base, height, l, labels, line: ['A', 'F'] });
    return {
      prompt: `${intro}<br>Work out the length of $AF$. ${r.text}`,
      visual: vis,
      answer: f(af),
      distractors: fmtVals([bf, Math.hypot(height, l), base + height + l, Math.hypot(base, height), Math.sqrt(Math.abs(l * l + base * base - height * height))], f),
      typed: r.typed(af),
      calculator: true,
      solution: [
        `Step 1 – the base $BCFE$ is a rectangle: $BF^2 = ${base}^2 + ${l}^2 = ${base * base + l * l}$.`,
        `Step 2 – triangle $ABF$ has a right angle at $B$ ($AB$ is vertical): $AF^2 = AB^2 + BF^2 = ${height * height} + ${base * base + l * l} = ${height * height + base * base + l * l}$`,
        `$AF = \\sqrt{${height * height + base * base + l * l}} = ${approxT(af)}$`,
        `Answer: <b>${f(af)}</b>`,
      ],
    };
  }
  const th = atanD(height / bf);
  const fa = (v) => A(roundTo(v, 1), 1);
  const vis = prismFig({ base, height, l, labels, line: ['A', 'F'], angle: 'x' });
  return {
    prompt: `${intro}<br>Work out the angle $x$ between $AF$ and the base $BCFE$. Give your answer to 1 decimal place.`,
    visual: vis,
    answer: fa(th),
    distractors: fmtVals([90 - th, atanD(height / l), atanD(height / base), asinD(Math.min(1, height / bf)), (th * Math.PI) / 180], fa),
    typed: DP1.typed(th),
    calculator: true,
    solution: [
      `The angle is in triangle $ABF$, right-angled at $B$. First find $BF$ across the rectangular base: $BF = \\sqrt{${base}^2 + ${l}^2} = ${approxT(bf)}$ cm.`,
      `$AB = ${height}$ is opposite $x$ and $BF$ is adjacent: $\\tan x = \\frac{${height}}{${approxT(bf)}}$`,
      `$x = \\tan^{-1}\\left(\\frac{${height}}{${approxT(bf)}}\\right) = ${approxT(th)}^\\circ$`,
      `Answer: <b>${fa(th)}</b>`,
    ],
  };
}, { title: 'Triangular prism: lengths and angles in 3D', learn: ['trig-3d', 'trig-sohcahtoa-angle'] });

export const solidsGenerators = [cuboidDiagonal, cuboidAngle, pyramid3d, prism3d];
