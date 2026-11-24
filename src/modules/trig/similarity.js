// Similar shapes (lengths, areas, volumes) and congruent triangles.
import { gen, pick, int, shuffle, num, tnum, roundTo, tidy, chance, frac, gcd, names } from '../../core.js';
import { fig, triangleSSS, angleAt, placeBeside, FILL, FILL2, ACCENT } from './diagrams.js';
import { svg, polygon, line, text, path as svgPath, rect as svgRect } from '../../svg.js';
import { L, A, fmtVals, nice, roundingFor, approxT, ratioTex } from './helpers.js';

const centroidOf = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

/** Integer-sided triangle with all angles at least minAng. */
function niceTriangle(rng, lo = 4, hi = 12, minAng = 28) {
  for (;;) {
    const a = int(rng, lo, hi); const b = int(rng, lo, hi); const c = int(rng, lo, hi);
    if (a === b || b === c || a === c) continue;
    if (a + b <= c + 1 || a + c <= b + 1 || b + c <= a + 1) continue;
    const t = triangleSSS(a, b, c);
    const angs = [angleAt(t.A, t.B, t.C), angleAt(t.B, t.A, t.C), angleAt(t.C, t.A, t.B)];
    if (Math.min(...angs) < minAng || Math.max(...angs) > 115) continue;
    return { a, b, c, t, angs };
  }
}

/* ------------------------------------------------------------------ */
/* trig-similar-lengths                                                */
/* ------------------------------------------------------------------ */

const K_BY_D = { easy: [2, 3, 2, 3, 4], medium: [1.5, 2.5, 3, 0.5, 2], hard: [1.5, 2.5, 1.25, 0.75, 0.6, 1.2, 0.4] };

export const simPair = gen('trig-sim-pair', 'trig-similar-lengths', (rng, d) => {
  const unit = 'cm';
  let a; let b; let c; let t; let k;
  for (let i = 0; i < 200; i += 1) {
    ({ a, b, c, t } = niceTriangle(rng, 3, 10));
    k = pick(rng, K_BY_D[d]);
    if ([a, b, c].every((v) => nice(v * k, 1))) break;
  }
  // sides: BC = a, CA = b, AB = c. Big triangle DEF corresponds A->D, B->E, C->F.
  const sides1 = { BC: a, CA: b, AB: c };
  const sides2 = { EF: tidy(a * k), FD: tidy(b * k), DE: tidy(c * k) };
  // which pair is the 'known corresponding' and which is unknown
  const pairs = shuffle(rng, [['BC', 'EF'], ['CA', 'FD'], ['AB', 'DE']]);
  const [known, unknown] = pairs;
  const xInFirst = d !== 'easy' && chance(rng, 0.4);
  const T1 = [t.A, t.B, t.C];
  const kd = Math.max(0.65, Math.min(1.6, k));
  const T2 = placeBeside(T1, T1, { k: kd, rotate: d === 'hard' ? pick(rng, [180, 90, -90, 150]) : 0, flip: d === 'hard' && chance(rng), gap: 0.5 });
  const pts = { A: T1[0], B: T1[1], C: T1[2], D: T2[0], E: T2[1], F: T2[2], G1: centroidOf(T1), G2: centroidOf(T2) };
  const lab1 = { [known[0]]: L(sides1[known[0]], unit), [unknown[0]]: xInFirst ? 'x' : L(sides1[unknown[0]], unit) };
  const lab2 = { [known[1]]: L(sides2[known[1]], unit), [unknown[1]]: xInFirst ? L(sides2[unknown[1]], unit) : 'x' };
  const vis = fig({
    pts, width: 440, height: 220, pad: 30,
    draw: (g) => {
      let out = g.poly('ABC') + g.poly('DEF');
      // equal angles marked so the correspondence is clear
      out += g.angle('A', 'B', 'C', null, { r: 16 }) + g.angle('D', 'E', 'F', null, { r: 16 });
      out += g.angle('B', 'A', 'C', null, { r: 14, double: true }) + g.angle('E', 'D', 'F', null, { r: 14, double: true });
      for (const [s, v] of Object.entries(lab1)) out += g.side(s[0], s[1], v, { inside: 'G1' });
      for (const [s, v] of Object.entries(lab2)) out += g.side(s[0], s[1], v, { inside: 'G2' });
      out += g.polyNames('ABC', { size: 15 }) + g.polyNames('DEF', { size: 15 });
      return out;
    },
  });
  const kn1 = sides1[known[0]]; const kn2 = sides2[known[1]];
  const ans = xInFirst ? sides1[unknown[0]] : sides2[unknown[1]];
  const given = xInFirst ? sides2[unknown[1]] : sides1[unknown[0]];
  const kk = xInFirst ? kn1 / kn2 : kn2 / kn1;
  const wrong = [given + (xInFirst ? kn1 - kn2 : kn2 - kn1), given / kk, xInFirst ? kn1 * kk : kn2 * kk, given * kk * kk, (xInFirst ? sides1 : sides2)[known[xInFirst ? 0 : 1]] + 1, given * (kk + 1)];
  const f = (v) => L(roundTo(v, 6), unit);
  const nameMap = { BC: 'EF', CA: 'FD', AB: 'DE' };
  const sx = xInFirst ? unknown[0] : unknown[1];
  return {
    prompt: `Triangles $ABC$ and $DEF$ are similar. Equal angles are marked.<br>Work out the length marked $x$ (side $${sx}$).`,
    visual: vis,
    answer: f(ans),
    distractors: fmtVals(wrong.filter((v) => nice(v, 2) && Math.abs(v - ans) > 1e-9), f),
    typed: { kind: 'number', value: tidy(ans) },
    hint: 'Find the scale factor from a pair of corresponding sides.',
    solution: [
      `Corresponding sides: $${known[0]}$ and $${nameMap[known[0]]}$ are ${num(kn1)} cm and ${num(kn2)} cm.`,
      xInFirst ? `Scale factor from $DEF$ to $ABC$: $${tnum(kn1)} \\div ${tnum(kn2)} = ${ratioTex(kn1, kn2)}$` : `Scale factor from $ABC$ to $DEF$: $${tnum(kn2)} \\div ${tnum(kn1)} = ${ratioTex(kn2, kn1)}$`,
      `$x$ corresponds to the side of ${num(given)} cm, so $x = ${tnum(given)} \\times ${xInFirst ? ratioTex(kn1, kn2) : ratioTex(kn2, kn1)} = ${tnum(roundTo(ans, 6))}$`,
      `Answer: <b>${f(ans)}</b>. (Similar shapes are multiplied, not added to – adding ${num(Math.abs(kn2 - kn1))} to each side is a common mistake.)`,
    ],
  };
}, { title: 'Similar triangles side by side: find a length' });

/** A-shape: triangle ABC with DE parallel to BC (D on AB, E on AC). */
function nestedFig({ k, labels, apexAngle = 50, baseTilt = 0, names3 = ['A', 'B', 'C', 'D', 'E'], apexX = 0.15 }) {
  const [A0, B0, C0, D0, E0] = names3;
  const Lb = 1; const ang1 = 180 + 90 - apexAngle / 2 + baseTilt; const ang2 = 270 + apexAngle / 2 + baseTilt;
  void ang1; void ang2;
  const Ap = [apexX, 1]; const Bp = [-0.55, 0]; const Cp = [0.9, 0];
  const t = 1 / k;
  const Dp = [Ap[0] + (Bp[0] - Ap[0]) * t, Ap[1] + (Bp[1] - Ap[1]) * t];
  const Ep = [Ap[0] + (Cp[0] - Ap[0]) * t, Ap[1] + (Cp[1] - Ap[1]) * t];
  void Lb;
  const pts = { [A0]: Ap, [B0]: Bp, [C0]: Cp, [D0]: Dp, [E0]: Ep };
  return fig({
    pts, width: 360, height: 230, pad: 34,
    draw: (g) => {
      let out = g.poly([A0, B0, C0]) + g.seg(D0, E0) + g.arrows(D0, E0) + g.arrows(B0, C0);
      for (const [s, v] of Object.entries(labels)) {
        if (!v) continue;
        const [p, q] = s.split('-');
        const par = (p === D0 && q === E0) || (p === B0 && q === C0);
        out += g.side(p, q, v, { inside: p === D0 && q === E0 ? A0 : null, offset: par ? 4 : 5, t: par ? 0.72 : 0.5 });
      }
      out += g.polyNames([A0, B0, C0]) + g.name(D0, D0, { dir: [-1, -0.2] }) + g.name(E0, E0, { dir: [1, -0.2] });
      return out;
    },
  });
}

export const simNested = gen('trig-sim-nested', 'trig-similar-lengths', (rng, d) => {
  const unit = 'cm';
  const [A0, B0, C0, D0, E0] = pick(rng, [['A', 'B', 'C', 'D', 'E'], ['P', 'Q', 'R', 'S', 'T'], ['A', 'B', 'C', 'P', 'Q']]);
  const ad = int(rng, 3, 9); const k = pick(rng, d === 'easy' ? [2, 3] : [1.5, 2, 2.5, 3, 4]);
  const ab = tidy(ad * k); const db = tidy(ab - ad);
  const de = int(rng, 3, 10); const bc = tidy(de * k);
  if (!nice(bc, 1) || !nice(ab, 1)) throw new Error('awkward');
  const mode = d === 'easy' ? 'BC-whole' : d === 'medium' ? pick(rng, ['BC-parts', 'BC-whole']) : pick(rng, ['DB', 'BC-parts']);
  const f = (v) => L(roundTo(v, 6), unit);
  let labels; let prompt; let ans; let wrong; let sol;
  const sAD = `${A0}${D0}`; const sAB = `${A0}${B0}`; const sDB = `${D0}${B0}`; const sDE = `${D0}${E0}`; const sBC = `${B0}${C0}`;
  if (mode === 'BC-whole') {
    labels = { [`${A0}-${D0}`]: L(ad, unit), [`${D0}-${E0}`]: L(de, unit), [`${B0}-${C0}`]: 'x' };
    prompt = `$${sDE}$ is parallel to $${sBC}$. $${sAB} = ${tnum(ab)}$ cm.<br>Work out the length $x$.`;
    ans = bc; wrong = [de * db / ad, de + (ab - ad), de / k, de * (ab / ad) ** 2, de * ab / db];
    sol = [`Triangles $${A0}${D0}${E0}$ and $${A0}${B0}${C0}$ are similar (corresponding angles are equal because $${sDE}$ is parallel to $${sBC}$).`, `Scale factor $= \\frac{${sAB}}{${sAD}} = \\frac{${tnum(ab)}}{${ad}} = ${tnum(k)}$`, `$x = ${de} \\times ${tnum(k)} = ${tnum(bc)}$`, `Answer: <b>${f(bc)}</b>`];
  } else if (mode === 'BC-parts') {
    labels = { [`${A0}-${D0}`]: L(ad, unit), [`${D0}-${B0}`]: L(db, unit), [`${D0}-${E0}`]: L(de, unit), [`${B0}-${C0}`]: 'x' };
    prompt = `$${sDE}$ is parallel to $${sBC}$.<br>Work out the length $x$.`;
    ans = bc; wrong = [de * db / ad, de + db, de * k * k, de * (ad + db) / db, de + (ab - ad) / 2];
    sol = [`Triangles $${A0}${D0}${E0}$ and $${A0}${B0}${C0}$ are similar (corresponding angles, as $${sDE} \\parallel ${sBC}$).`, `Use the <b>whole</b> side: $${sAB} = ${ad} + ${tnum(db)} = ${tnum(ab)}$ cm. Scale factor $= \\frac{${tnum(ab)}}{${ad}} = ${tnum(k)}$`, `$x = ${de} \\times ${tnum(k)} = ${tnum(bc)}$ (using $${sDB}$ instead of $${sAB}$ is the classic mistake)`, `Answer: <b>${f(bc)}</b>`];
  } else {
    labels = { [`${A0}-${D0}`]: L(ad, unit), [`${D0}-${B0}`]: 'x', [`${D0}-${E0}`]: L(de, unit), [`${B0}-${C0}`]: L(bc, unit) };
    prompt = `$${sDE}$ is parallel to $${sBC}$.<br>Work out the length $x$.`;
    ans = db; wrong = [ab, ad * k * k - ad, bc - de, ad / k, db + ad / 2];
    sol = [`Triangles $${A0}${D0}${E0}$ and $${A0}${B0}${C0}$ are similar. Scale factor $= \\frac{${sBC}}{${sDE}} = \\frac{${tnum(bc)}}{${de}} = ${tnum(k)}$`, `$${sAB} = ${ad} \\times ${tnum(k)} = ${tnum(ab)}$ cm`, `$x = ${sDB} = ${sAB} - ${sAD} = ${tnum(ab)} - ${ad} = ${tnum(db)}$`, `Answer: <b>${f(db)}</b>`];
  }
  const vis = nestedFig({ k: Math.max(1.4, Math.min(3, k)), labels, names3: [A0, B0, C0, D0, E0], apexX: pick(rng, [-0.25, 0, 0.15, 0.4, 0.6]) });
  return {
    prompt,
    visual: vis,
    answer: f(ans),
    distractors: fmtVals(wrong.filter((v) => nice(v, 2) && Math.abs(v - ans) > 1e-9), f),
    typed: { kind: 'number', value: tidy(ans) },
    solution: sol,
  };
}, { title: 'Triangle with a parallel line (A-shape)' });

export const simHourglass = gen('trig-sim-hourglass', 'trig-similar-lengths', (rng, d) => {
  const unit = 'cm';
  const ab = int(rng, 4, 12); const k = pick(rng, d === 'easy' ? [2, 3, 0.5] : [1.5, 2.5, 0.5, 0.4, 1.2, 3]);
  const de = tidy(ab * k);
  const ac = int(rng, 3, 10); const ce = tidy(ac * k);
  const bc = int(rng, 3, 10); const cd = tidy(bc * k);
  if (![de, ce, cd].every((v) => nice(v, 1))) throw new Error('awkward');
  // C at origin; A, B on one side, D, E on the other: A ↔ E? Lines AE and BD cross at C, AB ∥ DE.
  const u = [-0.9, 0.55]; const v = [0.55, 0.75];
  const kd = Math.max(0.6, Math.min(1.7, k));
  const pts = { C: [0, 0], A: [u[0], u[1]], B: [v[0], v[1]], E: [-u[0] * kd, -u[1] * kd], D: [-v[0] * kd, -v[1] * kd] };
  const ask = d === 'hard' ? pick(rng, ['CE', 'AE']) : pick(rng, ['DE', 'CE']);
  const labels = { 'A-B': L(ab, unit) };
  let ans; let wrong; let sol; let prompt;
  if (ask === 'DE') {
    labels['A-C'] = L(ac, unit); labels['C-E'] = L(ce, unit); labels['D-E'] = 'x';
    ans = de; wrong = [ab + (ce - ac), ab / k, ab * ce / (ac + ce), ac * k, ab * k * k];
    prompt = '$AB$ is parallel to $DE$. $AE$ and $BD$ are straight lines that cross at $C$.<br>Work out the length $x$.';
    sol = [`Triangles $ABC$ and $EDC$ are similar: the angles at $C$ are vertically opposite, and alternate angles are equal because $AB \\parallel DE$.`, `$CE$ corresponds to $AC$: scale factor $= \\frac{${tnum(ce)}}{${ac}} = ${tnum(k)}$`, `$DE$ corresponds to $AB$: $x = ${ab} \\times ${tnum(k)} = ${tnum(de)}$`, `Answer: <b>${L(de, unit)}</b>`];
  } else if (ask === 'CE') {
    labels['A-C'] = L(ac, unit); labels['D-E'] = L(de, unit); labels['C-E'] = 'x';
    ans = ce; wrong = [ac + (de - ab), ac / k, ab * k, ac * k * k, de - ac];
    prompt = '$AB$ is parallel to $DE$. $AE$ and $BD$ are straight lines that cross at $C$.<br>Work out the length $x$.';
    sol = [`Triangles $ABC$ and $EDC$ are similar (vertically opposite angles at $C$, alternate angles from the parallel lines).`, `$DE$ corresponds to $AB$: scale factor $= \\frac{${tnum(de)}}{${ab}} = ${tnum(k)}$`, `$CE$ corresponds to $AC$: $x = ${ac} \\times ${tnum(k)} = ${tnum(ce)}$`, `Answer: <b>${L(ce, unit)}</b>`];
  } else {
    const ae = tidy(ac + ce);
    labels['D-E'] = L(de, unit); labels['C-E'] = 'x';
    ans = ce; wrong = [ae / 2, ae * ab / de, ae - ab, ae / k, ae * k / (1 + k) + 1];
    prompt = `$AB$ is parallel to $DE$. $AE$ and $BD$ are straight lines that cross at $C$. $AE = ${tnum(ae)}$ cm.<br>Work out the length $x$.`;
    sol = [`Triangles $ABC$ and $EDC$ are similar, with scale factor $\\frac{DE}{AB} = \\frac{${tnum(de)}}{${ab}} = ${tnum(k)}$.`, `So $CE = ${tnum(k)} \\times AC$, and $AC + CE = ${tnum(ae)}$: $AE$ is split in the ratio $AC : CE = 1 : ${tnum(k)}$.`, `$x = CE = ${tnum(ae)} \\times \\frac{${tnum(k)}}{1 + ${tnum(k)}} = ${tnum(ce)}$`, `Answer: <b>${L(ce, unit)}</b>`];
  }
  const vis = fig({
    pts, rotate: pick(rng, [0, 0, 15, -12]), width: 360, height: 240, pad: 34,
    draw: (g) => {
      let out = g.poly('ABC', { fillOpacity: 0.7 }) + g.poly('CDE', { fillOpacity: 0.7 }) + g.arrows('A', 'B') + g.arrows('E', 'D');
      for (const [s, v] of Object.entries(labels)) { const [p, q] = s.split('-'); out += g.side(p, q, v, { inside: ['A', 'B'].includes(p) || ['A', 'B'].includes(q) ? (p === 'C' || q === 'C' ? 'B' : 'C') : (p === 'C' || q === 'C' ? 'D' : 'C') }); }
      out += ['A', 'B', 'D', 'E'].map((n) => g.name(n, n, { away: 'C' })).join('') + g.name('C', 'C', { dir: [1, 0] });
      return out;
    },
  });
  const f = (vv) => L(roundTo(vv, 6), unit);
  return {
    prompt,
    visual: vis,
    answer: f(ans),
    distractors: fmtVals(wrong.filter((w) => nice(w, 2) && Math.abs(w - ans) > 1e-9), f),
    typed: { kind: 'number', value: tidy(ans) },
    solution: sol,
  };
}, { title: 'Crossing lines with parallel sides (hourglass)' });

export const simScale = gen('trig-sim-scale', 'trig-similar-lengths', (rng, d) => {
  const w = int(rng, 2, 8); let h = int(rng, 3, 12); if (h === w) h += 1;
  const k = pick(rng, d === 'easy' ? [2, 3, 4] : d === 'medium' ? [1.5, 2.5, 3, 5] : [1.5, 2.5, 1.2, 0.5, 3.5]);
  const mode = d === 'hard' ? pick(rng, ['which', 'missing']) : pick(rng, ['which', 'which', 'factor']);
  const dims = (a, b) => `${num(tidy(a))} cm by ${num(tidy(b))} cm`;
  if (mode === 'factor') {
    const W2 = tidy(w * k); const H2 = tidy(h * k);
    const vis = svg(420, 170, rectPair(w, h, W2, H2, ['A', 'B']), { label: 'Two rectangles' });
    return {
      prompt: `Rectangle A is ${dims(w, h)}. Rectangle B is ${dims(W2, H2)}. The rectangles are similar.<br>What is the scale factor of the enlargement from A to B?`,
      visual: vis,
      answer: num(k),
      distractors: fmtVals([W2 - w, 1 / k, k * k, H2 - h, k + 1, k / 2].map((v) => roundTo(v, 6)).filter((v) => nice(v, 2)), num).filter((s) => s !== num(k)),
      typed: { kind: 'number', value: k },
      solution: [`Scale factor $= \\frac{\\text{new length}}{\\text{old length}}$.`, `$\\frac{${tnum(W2)}}{${w}} = ${tnum(k)}$ and $\\frac{${tnum(H2)}}{${h}} = ${tnum(k)}$ – the same, as it must be for similar shapes.`, `Answer: <b>${num(k)}</b>`],
    };
  }
  if (mode === 'missing') {
    const W2 = tidy(w * k); const H2 = tidy(h * k);
    return {
      prompt: `Rectangle A is ${dims(w, h)}. Rectangle B is similar to A. The shorter side of B is ${num(Math.min(W2, H2))} cm.<br>Work out the longer side of B.`,
      answer: `${num(Math.max(W2, H2))} cm`,
      distractors: fmtVals([Math.max(w, h) + Math.min(W2, H2) - Math.min(w, h), Math.max(w, h) * Math.min(W2, H2) / Math.max(w, h) + 1, Math.min(W2, H2) * Math.min(w, h) / Math.max(w, h), Math.max(w, h) * k * k, Math.max(W2, H2) + 1].filter((v) => nice(v, 2)), (v) => `${num(roundTo(v, 4))} cm`),
      typed: { kind: 'number', value: Math.max(W2, H2) },
      solution: [`Scale factor $= \\frac{${tnum(Math.min(W2, H2))}}{${Math.min(w, h)}} = ${tnum(k)}$`, `Longer side of B $= ${Math.max(w, h)} \\times ${tnum(k)} = ${tnum(Math.max(W2, H2))}$ cm`, `Answer: <b>${num(Math.max(W2, H2))} cm</b>`],
    };
  }
  // which rectangle is similar
  const add = int(rng, 2, 6);
  const ans = dims(w * k, h * k);
  const ds = [dims(w + add, h + add), dims(w * k, h + add), dims(w * k, h * (k + 1)), dims(h * k, w * k + 1), dims(w + k, h + k), dims(w * k + 1, h * k), dims(w * (k + 1), h * k)];
  return {
    prompt: `Rectangle A is ${dims(w, h)}. Which of these rectangles is <b>similar</b> to rectangle A?`,
    answer: ans,
    distractors: [...new Set(ds)].filter((s) => s !== ans && !sameRatio(s, w, h)),
    solution: [`Similar shapes are enlargements: <b>every</b> length is multiplied by the same scale factor.`, `${ans}: $${tnum(tidy(w * k))} \\div ${w} = ${tnum(k)}$ and $${tnum(tidy(h * k))} \\div ${h} = ${tnum(k)}$ ✓`, `Adding the same amount to each side (e.g. ${dims(w + add, h + add)}) does <b>not</b> give a similar shape.`, `Answer: <b>${ans}</b>`],
  };
}, { title: 'Similar rectangles and scale factors' });

function sameRatio(s, w, h) {
  const m = s.match(/([\d.]+) cm by ([\d.]+) cm/);
  if (!m) return false;
  const a = Number(m[1]); const b = Number(m[2]);
  return Math.abs(a / b - w / h) < 1e-9 || Math.abs(a / b - h / w) < 1e-9;
}

function rectPair(w, h, W2, H2, labs) {
  const sc = Math.min(110 / Math.max(w, h), 260 / (w + W2 + 2), 120 / Math.max(h, H2));
  const x1 = 20; const y0 = 150;
  const x2 = x1 + w * sc + 40;
  const W2d = Math.min(W2 * sc, 420 - x2 - 20); const H2d = Math.min(H2 * sc, 140);
  return svgRect(x1, y0 - h * sc, w * sc, h * sc, { fill: FILL }) + svgRect(x2, y0 - H2d, W2d, H2d, { fill: FILL2 })
    + text(x1 + (w * sc) / 2, y0 - (h * sc) / 2, labs[0], { size: 16 }) + text(x2 + W2d / 2, y0 - H2d / 2, labs[1], { size: 16 });
}

export const simRatio = gen('trig-sim-ratio', 'trig-similar-lengths', (rng, d) => {
  const [R, Q, P, S, T] = pick(rng, [['R', 'Q', 'P', 'S', 'T'], ['A', 'D', 'B', 'E', 'C'], ['O', 'X', 'P', 'Y', 'Q'], ['V', 'K', 'L', 'M', 'N']]);
  // R apex; Q on RP; S on RT; QS ∥ PT.
  const pts = { [R]: [0, 0], [P]: [1.6, 1.1], [T]: [1.9, 0], [Q]: [0.85, 0.585], [S]: [1.01, 0] };
  const vis = fig({
    pts, width: 360, height: 200, pad: 30, rotate: pick(rng, [0, 0, 180]), flip: chance(rng),
    draw: (g) => g.poly([R, P, T]) + g.seg(Q, S) + g.arrows(S, Q) + g.arrows(T, P) + g.polyNames([R, P, T]) + g.name(Q, Q, { away: T }) + g.name(S, S, { away: P }),
  });
  const fr = (a, b) => `$\\frac{${a}}{${b}}$`;
  // target ratio: QR/PR; equal ratios: RS/RT and QS/PT
  const target = pick(rng, [[`${Q}${R}`, `${P}${R}`], [`${R}${S}`, `${R}${T}`], [`${Q}${S}`, `${P}${T}`]]);
  const equals = [[`${Q}${R}`, `${P}${R}`], [`${R}${S}`, `${R}${T}`], [`${Q}${S}`, `${P}${T}`]].filter((x) => x[0] !== target[0]);
  const ans = pick(rng, equals);
  const wrongs = [[`${R}${S}`, `${S}${T}`], [`${Q}${S}`, `${S}${T}`], [`${P}${T}`, `${Q}${S}`], [`${R}${T}`, `${R}${S}`], [`${R}${Q}`, `${Q}${P}`], [`${Q}${P}`, `${P}${R}`], [`${S}${T}`, `${R}${T}`]];
  return {
    prompt: `$${P}${R}${T}$ and $${Q}${R}${S}$ are similar triangles, with $${Q}${S}$ parallel to $${P}${T}$.<br>Which of these is equal to ${fr(target[0], target[1])}?`,
    visual: vis,
    answer: fr(ans[0], ans[1]),
    distractors: shuffle(rng, wrongs).map((x) => fr(x[0], x[1])),
    count: d === 'easy' ? 4 : 5,
    solution: [
      `Match corresponding sides of the small triangle $${Q}${R}${S}$ and the large triangle $${P}${R}${T}$: $${Q}${R} \\leftrightarrow ${P}${R}$, $${R}${S} \\leftrightarrow ${R}${T}$, $${Q}${S} \\leftrightarrow ${P}${T}$.`,
      `Each fraction small ÷ large equals the same scale factor: $\\frac{${Q}${R}}{${P}${R}} = \\frac{${R}${S}}{${R}${T}} = \\frac{${Q}${S}}{${P}${T}}$.`,
      `Careful: $${S}${T}$ is only part of a side, so fractions using it are wrong.`,
      `Answer: ${fr(ans[0], ans[1])}`,
    ],
  };
}, { title: 'Which ratio of sides is equal?' });

/* ------------------------------------------------------------------ */
/* trig-similar-area-volume                                            */
/* ------------------------------------------------------------------ */

const SCALE_PAIRS = { easy: [[1, 2], [1, 3], [2, 1], [3, 1], [1, 4]], medium: [[2, 3], [3, 2], [2, 5], [3, 4], [4, 3], [5, 2]], hard: [[3, 5], [5, 3], [4, 5], [2, 7], [5, 4], [3, 7]] };

/** Two similar solids sketch: kind 'cylinder' | 'cuboid' | 'cone', with height labels. */
function solidPair(kind, h1, h2, lab1, lab2, inner1 = '', inner2 = '') {
  const maxH = Math.max(h1, h2);
  const sc = 130 / maxH;
  const H1 = h1 * sc; const H2 = h2 * sc;
  const base = 175; let out = '';
  const draw = (x, H, lab, inner, name) => {
    const w = H * 0.62; const e = w * 0.18;
    let s = '';
    if (kind === 'cylinder') {
      s += svgPath(`M ${x} ${base - H} L ${x} ${base} A ${w / 2} ${e} 0 0 0 ${x + w} ${base} L ${x + w} ${base - H}`, { fill: FILL, width: 2 });
      s += `<ellipse cx="${x + w / 2}" cy="${base - H}" rx="${w / 2}" ry="${e}" fill="${FILL2}" stroke="currentColor" stroke-width="2"/>`;
    } else if (kind === 'cone') {
      s += svgPath(`M ${x} ${base} L ${x + w / 2} ${base - H} L ${x + w} ${base} A ${w / 2} ${e} 0 0 1 ${x} ${base}`, { fill: FILL, width: 2 });
    } else {
      const dx = w * 0.35; const dy = w * 0.25;
      s += polygon([[x, base], [x + w, base], [x + w, base - H], [x, base - H]], { fill: FILL }) + polygon([[x + w, base], [x + w + dx, base - dy], [x + w + dx, base - H - dy], [x + w, base - H]], { fill: FILL2 }) + polygon([[x, base - H], [x + w, base - H], [x + w + dx, base - H - dy], [x + dx, base - H - dy]], { fill: FILL2 });
    }
    // height dimension line
    s += line(x - 10, base, x - 10, base - H, { width: 1.2 }) + line(x - 14, base, x - 6, base, { width: 1.2 }) + line(x - 14, base - H, x - 6, base - H, { width: 1.2 });
    s += text(x - 16, base - H / 2, lab, { anchor: 'end', size: 14 });
    s += text(x + w / 2, base + e + 16, name, { size: 15, bold: true });
    if (inner) s += text(x + w / 2, base - H / 2 + (kind === 'cone' ? H * 0.2 : 0), inner, { size: 12.5 });
    return { s, w };
  };
  const p1 = draw(80, H1, lab1, inner1, 'A');
  const x2 = 80 + p1.w + 120;
  const p2 = draw(x2, H2, lab2, inner2, 'B');
  out = p1.s + p2.s;
  return svg(Math.max(380, x2 + p2.w + 60), 210, out, { label: 'Two similar solids' });
}

export const savArea = gen('trig-sav-area', 'trig-similar-area-volume', (rng, d) => {
  const [p, q] = pick(rng, SCALE_PAIRS[d]);
  const base = int(rng, 2, 6);
  const l1 = base * p; const l2 = base * q; // corresponding lengths
  const k = q / p;
  const unitArea = int(rng, 1, 5) * (p * p);
  const A1 = unitArea; const A2 = tidy((A1 * q * q) / (p * p));
  if (!nice(A2, 2)) throw new Error('awkward');
  const shape = pick(rng, ['cylinder', 'cuboid', 'cone']);
  const kind = pick(rng, ['surface area', 'area of the base', 'curved surface area'].filter((x) => shape !== 'cuboid' || x !== 'curved surface area'));
  const vis = solidPair(shape, l1, l2, `${l1} cm`, `${l2} cm`);
  const f = (v) => `${num(roundTo(v, 4))} cm²`;
  const wrong = [A1 * k, A1 * k ** 3, A1 + (l2 - l1), A1 / (k * k), A1 * 2 * k, A1 * (k + 1)];
  const nm = { cylinder: 'cylinders', cuboid: 'cuboids', cone: 'cones' }[shape];
  return {
    prompt: `A and B are similar ${nm}. The height of A is ${l1} cm and the height of B is ${l2} cm.<br>The ${kind} of A is ${num(A1)} cm². Work out the ${kind} of B.`,
    visual: vis,
    answer: f(A2),
    distractors: fmtVals(wrong.filter((v) => nice(v, 2)), f),
    typed: { kind: 'number', value: A2 },
    hint: 'Areas scale by the square of the length scale factor.',
    solution: [
      `Length scale factor $k = \\frac{${l2}}{${l1}} = ${frac(l2, l1).tex()}$.`,
      `Areas are multiplied by $k^2 = \\left(${frac(l2, l1).tex()}\\right)^2 = ${frac(l2 * l2, l1 * l1).tex()}$ (not by $k$).`,
      `${kind.charAt(0).toUpperCase() + kind.slice(1)} of B $= ${num(A1)} \\times ${frac(l2 * l2, l1 * l1).tex()} = ${tnum(A2)}$`,
      `Answer: <b>${f(A2)}</b>`,
    ],
  };
}, { title: 'Similar shapes: areas (×k²)' });

export const savVolume = gen('trig-sav-volume', 'trig-similar-area-volume', (rng, d) => {
  const [p, q] = pick(rng, SCALE_PAIRS[d]);
  const base = int(rng, 1, 5);
  const l1 = base * p; const l2 = base * q;
  const k = q / p;
  const V1 = int(rng, 1, 6) * p ** 3 * (d === 'easy' ? 5 : 1);
  const V2 = tidy((V1 * q ** 3) / p ** 3);
  const shape = pick(rng, ['cylinder', 'cuboid', 'cone']);
  const vis = solidPair(shape, l1, l2, `${l1} cm`, `${l2} cm`);
  const f = (v) => `${num(roundTo(v, 4))} cm³`;
  const wrong = [V1 * k, V1 * k * k, V1 + (l2 - l1), V1 / k ** 3, V1 * 3 * k, V1 * k ** 4];
  const nm = { cylinder: 'cylinders', cuboid: 'cuboids', cone: 'cones' }[shape];
  return {
    prompt: `A and B are similar ${nm}. The height of A is ${l1} cm and the height of B is ${l2} cm.<br>The volume of A is ${num(V1)} cm³. Work out the volume of B.`,
    visual: vis,
    answer: f(V2),
    distractors: fmtVals(wrong.filter((v) => nice(v, 2)), f),
    typed: { kind: 'number', value: V2 },
    hint: 'Volumes scale by the cube of the length scale factor.',
    solution: [
      `Length scale factor $k = \\frac{${l2}}{${l1}} = ${frac(l2, l1).tex()}$.`,
      `Volumes are multiplied by $k^3 = \\left(${frac(l2, l1).tex()}\\right)^3 = ${frac(l2 ** 3, l1 ** 3).tex()}$.`,
      `Volume of B $= ${num(V1)} \\times ${frac(l2 ** 3, l1 ** 3).tex()} = ${tnum(V2)}$`,
      `Answer: <b>${f(V2)}</b>`,
    ],
  };
}, { title: 'Similar solids: volumes (×k³)' });

export const savReverse = gen('trig-sav-reverse', 'trig-similar-area-volume', (rng, d) => {
  const [p, q] = pick(rng, SCALE_PAIRS[d === 'easy' ? 'easy' : d === 'medium' ? 'medium' : 'hard']);
  const mode = d === 'easy' ? pick(rng, ['areaToLength', 'volToLength']) : d === 'medium' ? pick(rng, ['areaToLength', 'volToLength', 'volToArea']) : pick(rng, ['volToArea', 'areaToVol', 'volToLength']);
  const shape = pick(rng, ['cylinders', 'cones', 'cuboids', 'prisms', 'pyramids']);
  const m = int(rng, 1, 4);
  const l1 = int(rng, 2, 6) * p; const l2 = (l1 / p) * q;
  const fr2 = frac(q * q, p * p); const fr3 = frac(q ** 3, p ** 3);
  if (mode === 'areaToLength' || mode === 'volToLength') {
    const isA = mode === 'areaToLength';
    const s1 = m * (isA ? p * p : p ** 3) * (isA ? 5 : 2); const s2 = (s1 / (isA ? p * p : p ** 3)) * (isA ? q * q : q ** 3);
    const u = isA ? 'cm²' : 'cm³';
    const wrong = [l1 * (s2 / s1), l1 * (isA ? (s2 / s1) ** (1 / 3) : Math.sqrt(s2 / s1)), l1 + (s2 - s1), l1 / (q / p), l1 * (q / p) ** 2];
    return {
      prompt: `Solids A and B are similar ${shape}. The ${isA ? 'surface area' : 'volume'} of A is ${num(s1)} ${u} and the ${isA ? 'surface area' : 'volume'} of B is ${num(s2)} ${u}.<br>The height of A is ${l1} cm. Work out the height of B.`,
      answer: `${num(l2)} cm`,
      distractors: fmtVals(wrong.filter((v) => nice(v, 2) && Math.abs(v - l2) > 1e-9), (v) => `${num(roundTo(v, 4))} cm`),
      typed: { kind: 'number', value: l2 },
      solution: [
        `${isA ? 'Area' : 'Volume'} scale factor $= \\frac{${num(s2)}}{${num(s1)}} = ${(isA ? fr2 : fr3).tex()}$.`,
        `${isA ? 'Area factor $= k^2$, so square root' : 'Volume factor $= k^3$, so cube root'}: $k = ${frac(q, p).tex()}$.`,
        `Height of B $= ${l1} \\times ${frac(q, p).tex()} = ${tnum(l2)}$ cm`,
        `Answer: <b>${num(l2)} cm</b>`,
      ],
    };
  }
  if (mode === 'volToArea') {
    const V1 = m * p ** 3 * 2; const V2 = (V1 / p ** 3) * q ** 3; const S1 = int(rng, 2, 9) * p * p * 3; const S2 = (S1 / (p * p)) * q * q;
    const wrong = [S1 * (V2 / V1), S1 * (q / p), S1 + (V2 - V1), S1 * (q / p) ** 4, S1 * Math.sqrt(V2 / V1)];
    return {
      prompt: `Solids A and B are similar ${shape}. The volume of A is ${num(V1)} cm³ and the volume of B is ${num(V2)} cm³.<br>The surface area of A is ${num(S1)} cm². Work out the surface area of B.`,
      answer: `${num(S2)} cm²`,
      distractors: fmtVals(wrong.filter((v) => nice(v, 2) && Math.abs(v - S2) > 1e-9), (v) => `${num(roundTo(v, 4))} cm²`),
      typed: { kind: 'number', value: S2 },
      solution: [
        `Volume factor $= \\frac{${num(V2)}}{${num(V1)}} = ${fr3.tex()} = k^3$, so $k = ${frac(q, p).tex()}$ (cube root).`,
        `Area factor $= k^2 = ${fr2.tex()}$.`,
        `Surface area of B $= ${num(S1)} \\times ${fr2.tex()} = ${num(S2)}$`,
        `Answer: <b>${num(S2)} cm²</b>`,
      ],
    };
  }
  const S1 = m * p * p * 4; const S2 = (S1 / (p * p)) * q * q; const V1 = int(rng, 2, 6) * p ** 3 * 5; const V2 = (V1 / p ** 3) * q ** 3;
  const wrong = [V1 * (S2 / S1), V1 * (q / p), V1 + (S2 - S1), V1 * (S2 / S1) ** 2];
  return {
    prompt: `Solids A and B are similar ${shape}. The surface area of A is ${num(S1)} cm² and the surface area of B is ${num(S2)} cm².<br>The volume of A is ${num(V1)} cm³. Work out the volume of B.`,
    answer: `${num(V2)} cm³`,
    distractors: fmtVals(wrong.filter((v) => nice(v, 2) && Math.abs(v - V2) > 1e-9), (v) => `${num(roundTo(v, 4))} cm³`),
    typed: { kind: 'number', value: V2 },
    solution: [
      `Area factor $= \\frac{${num(S2)}}{${num(S1)}} = ${fr2.tex()} = k^2$, so $k = ${frac(q, p).tex()}$ (square root).`,
      `Volume factor $= k^3 = ${fr3.tex()}$.`,
      `Volume of B $= ${num(V1)} \\times ${fr3.tex()} = ${num(V2)}$`,
      `Answer: <b>${num(V2)} cm³</b>`,
    ],
  };
}, { title: 'Similar solids: from areas or volumes back to lengths' });

export const savRatio = gen('trig-sav-ratio', 'trig-similar-area-volume', (rng, d) => {
  const [p, q] = (() => { for (;;) { const a = int(rng, 1, d === 'easy' ? 4 : 7); const b = int(rng, 2, d === 'easy' ? 5 : 9); if (a < b && gcd(a, b) === 1) return [a, b]; } })();
  const given = pick(rng, d === 'easy' ? ['length'] : d === 'medium' ? ['length', 'area'] : ['area', 'volume']);
  const want = pick(rng, ['length', 'area', 'volume'].filter((x) => x !== given));
  const pw = { length: 1, area: 2, volume: 3 };
  const r = (n) => `${p ** n} : ${q ** n}`;
  const ans = r(pw[want]);
  const ds = [r(pw[given]), r(1), r(2), r(3), r(4), `${p * pw[want]} : ${q * pw[want]}`, `${p + pw[want]} : ${q + pw[want]}`].filter((s, i, arr) => s !== ans && arr.indexOf(s) === i);
  const word = { length: 'lengths', area: 'surface areas', volume: 'volumes' };
  return {
    prompt: `Two solids are mathematically similar. The ratio of their ${word[given]} is $${r(pw[given])}$.<br>What is the ratio of their ${word[want]}?`,
    answer: `$${ans}$`,
    distractors: ds.map((s) => `$${s}$`),
    solution: [
      `Length ratio $p : q$ → area ratio $p^2 : q^2$ → volume ratio $p^3 : q^3$.`,
      given === 'length' ? `The length ratio is $${r(1)}$.` : `${given === 'area' ? 'Square root' : 'Cube root'} the ${word[given]} ratio to get the length ratio: $${r(1)}$.`,
      `${want === 'length' ? 'So the length ratio is' : want === 'area' ? 'Square it:' : 'Cube it:'} $${ans}$`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Ratios of lengths, areas and volumes' });

// Contexts where the context decides area (k²) vs volume (k³) vs length (k).
const SAV_CONTEXTS = [
  { q: 'area', make: (a, b, x) => `A model of a car is made to a scale where the real car is ${b / a} times as long as the model. The model needs ${x} ml of paint to cover it. How much paint would cover the real car, to the same thickness?`, unit: 'ml', simple: true },
  { q: 'volume', make: (a, b, x) => `Two similar bottles have heights ${a} cm and ${b} cm. The smaller bottle holds ${x} ml. How much does the larger bottle hold?`, unit: 'ml' },
  { q: 'volume', make: (a, b, x) => `Two similar solid gold statues have heights ${a} cm and ${b} cm. The smaller statue has a mass of ${x} g. Work out the mass of the larger statue.`, unit: 'g' },
  { q: 'area', make: (a, b, x) => `Two similar photo frames have widths ${a} cm and ${b} cm. The glass in the smaller frame costs £${x}. The cost of glass is proportional to its area. How much does the glass in the larger frame cost?`, unit: '£' },
  { q: 'area', make: (a, b, x) => `A pizza with a diameter of ${a} inches has ${x} g of cheese on top. A similar pizza has a diameter of ${b} inches. How much cheese does the larger pizza need, to the same thickness?`, unit: 'g' },
  { q: 'volume', make: (a, b, x) => `Two similar candles have heights ${a} cm and ${b} cm. The smaller candle is made from ${x} cm³ of wax. How much wax is in the larger candle?`, unit: 'cm³' },
  { q: 'area', make: (a, b, x) => `A logo is printed in two similar sizes. The small logo is ${a} cm wide and uses ${x} ml of ink. The large logo is ${b} cm wide. How much ink does the large logo use?`, unit: 'ml' },
  { q: 'volume', make: (a, b, x) => `Two similar cereal boxes have heights ${a} cm and ${b} cm. The small box holds ${x} g of cereal. How much cereal does the large box hold?`, unit: 'g' },
  { q: 'area', make: (a, b, x) => `Two similar tents have heights ${a} m and ${b} m. The smaller tent is made from ${x} m² of fabric. How much fabric is needed for the larger tent?`, unit: 'm²' },
  { q: 'volume', make: (a, b, x) => `Two similar fish tanks have lengths ${a} cm and ${b} cm. The smaller tank holds ${x} litres of water. How much water does the larger tank hold?`, unit: 'litres' },
  { q: 'area', make: (a, b, x) => `Two similar rugs have lengths ${a} m and ${b} m. The smaller rug costs £${x} to clean, and cleaning costs are proportional to area. How much does it cost to clean the larger rug?`, unit: '£' },
  { q: 'volume', make: (a, b, x) => `Two similar solid chocolate eggs have heights ${a} cm and ${b} cm. The smaller egg has a mass of ${x} g. Work out the mass of the larger egg.`, unit: 'g' },
  { q: 'length', make: (a, b, x) => `Two similar jugs hold ${a} litres and ${b} litres. The smaller jug is ${x} cm tall. How tall is the larger jug?`, unit: 'cm', fromVolume: true },
  { q: 'length', make: (a, b, x) => `Two similar posters need ${a} m² and ${b} m² of paper. The smaller poster is ${x} cm wide. How wide is the larger poster?`, unit: 'cm', fromArea: true },
];

export const savWord = gen('trig-sav-word', 'trig-similar-area-volume', (rng, d) => {
  const ctx = pick(rng, SAV_CONTEXTS);
  const [p, q] = pick(rng, SCALE_PAIRS[d === 'hard' ? 'medium' : 'easy'].filter(([x, y]) => x < y));
  const base = int(rng, 2, 5);
  const fmtU = (v) => (ctx.unit === '£' ? `£${num(roundTo(v, 2), nice(v) ? 0 : 2)}` : `${num(roundTo(v, 4))} ${ctx.unit}`);
  let a; let b; let x; let ans; let wrong; let sol;
  if (ctx.q === 'length') {
    const n = ctx.fromVolume ? 3 : 2;
    a = int(rng, 1, 3) * p ** n; b = (a / p ** n) * q ** n; x = int(rng, 3, 9) * p; ans = (x / p) * q;
    wrong = [x * (b / a), x * (q / p) ** (n === 3 ? 2 : 3), x + (b - a), x * Math.sqrt(b / a) * (n === 3 ? 1.1 : 1.3)];
    sol = [`The ${ctx.fromVolume ? 'capacities (volumes)' : 'areas'} are in the ratio $${a} : ${b}$, so this is the ${ctx.fromVolume ? 'volume factor $k^3$' : 'area factor $k^2$'} $= ${frac(b, a).tex()}$.`, `${ctx.fromVolume ? 'Cube root' : 'Square root'}: length factor $k = ${frac(q, p).tex()}$.`, `$${x} \\times ${frac(q, p).tex()} = ${tnum(ans)}$`, `Answer: <b>${fmtU(ans)}</b>`];
  } else {
    a = base * p; b = base * q;
    if (ctx.unit === '£') { a = p; b = q; }
    if (ctx.simple) { a = 1; b = q; }
    const n = ctx.q === 'area' ? 2 : 3;
    const kk = b / a;
    x = ctx.unit === '£' ? int(rng, 1, 4) * a ** n : int(rng, 2, 20) * (a === 1 ? 1 : p ** n) * (ctx.unit === 'g' ? 5 : 1);
    ans = x * kk ** n;
    wrong = [x * kk, x * kk ** (n === 2 ? 3 : 2), x + (b - a), x * kk * n];
    sol = [`The context tells you what kind of quantity it is: ${n === 2 ? 'paint/ink/fabric/cheese/cost-per-area cover a <b>surface</b> → area factor $k^2$' : 'capacity/mass/wax fill a <b>space</b> → volume factor $k^3$'}.`, `Length scale factor $k = ${frac(b, a).tex()}$, so the factor is $k^{${n}} = ${frac(b ** n, a ** n).tex()}$.`, `$${ctx.unit === '£' ? `£${x}` : x} \\times ${frac(b ** n, a ** n).tex()} = ${ctx.unit === '£' ? `£${num(roundTo(ans, 2), nice(ans) ? 0 : 2)}` : tnum(roundTo(ans, 4))}$`, `Answer: <b>${fmtU(ans)}</b>`];
  }
  return {
    prompt: ctx.make(a, b, x),
    answer: fmtU(ans),
    distractors: fmtVals(wrong.filter((v) => nice(v, 2) && Math.abs(v - ans) > 1e-9), fmtU),
    typed: { kind: 'number', value: roundTo(ans, 4) },
    solution: sol,
  };
}, { title: 'Similar solids in context (paint, mass, capacity)', word: true });

/* ------------------------------------------------------------------ */
/* trig-congruence                                                     */
/* ------------------------------------------------------------------ */

/** Congruent pair: triangle T and a rotated/reflected copy, with given info marked on both. */
function congruentPair(rng, cond) {
  let t; let sides; let angs;
  if (cond === 'RHS') {
    const [p, qq] = pick(rng, [[3, 4], [5, 12], [6, 8], [8, 15], [9, 12], [7, 24], [12, 16], [10, 24]]);
    t = { A: [0, 0], B: [qq, 0], C: [0, p] }; // right angle at A
    sides = { BC: Math.hypot(p, qq), CA: p, AB: qq };
    angs = [90, Math.atan2(p, qq) * 180 / Math.PI, Math.atan2(qq, p) * 180 / Math.PI];
  } else {
    const n = niceTriangle(rng, 5, 13, 30);
    t = n.t; sides = { BC: n.a, CA: n.b, AB: n.c }; angs = n.angs.map((x) => Math.round(x));
    angs[2] = 180 - angs[0] - angs[1];
  }
  const T1 = [t.A, t.B, t.C];
  const T2 = placeBeside(T1, T1, { rotate: pick(rng, [60, 120, 180, 200, 250, 300]), flip: chance(rng), gap: 0.35 });
  return { T1, T2, sides, angs };
}

const CONDS = ['SSS', 'SAS', 'ASA', 'RHS'];

export const congReason = gen('trig-cong-reason', 'trig-congruence', (rng, d) => {
  const cond = pick(rng, CONDS);
  const { T1, T2, sides, angs } = congruentPair(rng, cond);
  const L1 = (v) => `${num(roundTo(v, 1))} cm`;
  // what to mark: lists of side keys (BC/CA/AB) and angle indices
  let sideKeys = []; let angIdx = []; let right = false;
  if (cond === 'SSS') sideKeys = ['BC', 'CA', 'AB'];
  else if (cond === 'SAS') { const v = pick(rng, [0, 1, 2]); angIdx = [v]; sideKeys = [['AB', 'CA'], ['AB', 'BC'], ['BC', 'CA']][v]; }
  else if (cond === 'ASA') { const s = pick(rng, ['AB', 'BC', 'CA']); sideKeys = [s]; angIdx = { AB: [0, 1], BC: [1, 2], CA: [2, 0] }[s]; if (d === 'hard' && chance(rng)) angIdx = [angIdx[0], 3 - angIdx[0] - angIdx[1]]; }
  else { right = true; sideKeys = ['BC', pick(rng, ['CA', 'AB'])]; }
  if (cond === 'RHS' && d !== 'easy' && chance(rng, 0.3)) { /* keep */ }
  const nm1 = ['A', 'B', 'C']; const nm2 = ['P', 'Q', 'R'];
  const pts = { A: T1[0], B: T1[1], C: T1[2], P: T2[0], Q: T2[1], R: T2[2], G1: centroidOf(T1), G2: centroidOf(T2) };
  const vis = fig({
    pts, width: 440, height: 210, pad: 30,
    draw: (g) => {
      let out = g.poly('ABC') + g.poly('PQR');
      for (const [nm, G] of [[nm1, 'G1'], [nm2, 'G2']]) {
        for (const s of sideKeys) {
          const i = 'ABC'.indexOf(s[0]); const j = 'ABC'.indexOf(s[1]);
          out += g.side(nm[i], nm[j], L1(sides[s]), { inside: G, size: 14 });
        }
        for (const i of angIdx) out += g.angle(nm[i], nm[(i + 1) % 3], nm[(i + 2) % 3], `${Math.round(angs[i])}°`, { size: 13 });
        if (right) out += g.right(nm[0], nm[1], nm[2], 10);
      }
      return out;
    },
  });
  const why = {
    SSS: 'All three pairs of sides are equal: <b>SSS</b>.',
    SAS: 'Two pairs of sides are equal and the angles <b>between</b> them (the included angles) are equal: <b>SAS</b>.',
    ASA: 'Two pairs of angles and a pair of corresponding sides are equal: <b>ASA</b> (if two angles match, the third must match too).',
    RHS: 'Both have a <b>R</b>ight angle, equal <b>H</b>ypotenuses and another equal <b>S</b>ide: <b>RHS</b>.',
  }[cond];
  return {
    prompt: pick(rng, ['These two triangles are congruent. Which condition shows this?', 'Give the reason why these triangles are congruent.', 'Which condition proves that these two triangles are congruent?']),
    visual: vis,
    answer: cond,
    distractors: CONDS.filter((c) => c !== cond),
    count: 4,
    keepOrder: true,
    solution: [
      'Look at what is marked as equal in both triangles.',
      why,
      `Answer: <b>${cond}</b>`,
    ],
  };
}, { title: 'Which congruence condition (SSS, SAS, ASA, RHS)?' });

export const congFind = gen('trig-cong-find', 'trig-congruence', (rng, d) => {
  const { T1, T2, sides, angs } = congruentPair(rng, 'SSS');
  const askAngle = d !== 'easy' && chance(rng, 0.5);
  const nm2 = pick(rng, [['P', 'Q', 'R'], ['X', 'Y', 'Z'], ['D', 'E', 'F']]);
  const pts = { A: T1[0], B: T1[1], C: T1[2], [nm2[0]]: T2[0], [nm2[1]]: T2[1], [nm2[2]]: T2[2], G1: centroidOf(T1), G2: centroidOf(T2) };
  const key = ['BC', 'CA', 'AB'];
  const target = pick(rng, [0, 1, 2]);
  const L1 = (v) => `${num(v)} cm`;
  // Triangle 1 fully labelled with sides; angles: two of them. Triangle 2: one side + one angle to fix the matching, x on target.
  const ang1Shown = [0, 1, 2].filter((i) => !(askAngle && d === 'hard' && i === target));
  const vis = fig({
    pts, width: 440, height: 220, pad: 32,
    draw: (g) => {
      let out = g.poly('ABC') + g.poly(nm2);
      for (const k2 of key) out += g.side(k2[0], k2[1], L1(sides[k2]), { inside: 'G1', size: 14 });
      for (const i of ang1Shown.slice(0, d === 'hard' ? 2 : 3)) out += g.angle('ABC'[i], 'ABC'[(i + 1) % 3], 'ABC'[(i + 2) % 3], `${angs[i]}°`, { size: 13 });
      // triangle 2: show sides that are not the target with values, target with x (side) or angle x
      for (const [idx, k2] of key.entries()) {
        const i = 'ABC'.indexOf(k2[0]); const j = 'ABC'.indexOf(k2[1]);
        if (!askAngle && idx === target) out += g.side(nm2[i], nm2[j], 'x', { inside: 'G2' });
        else if (askAngle || d === 'easy' || idx === (target + 1) % 3) out += g.side(nm2[i], nm2[j], L1(sides[k2]), { inside: 'G2', size: 14 });
      }
      if (askAngle) out += g.angle(nm2[target], nm2[(target + 1) % 3], nm2[(target + 2) % 3], 'x');
      else if (d !== 'easy') out += g.angle(nm2[target], nm2[(target + 1) % 3], nm2[(target + 2) % 3], `${angs[target]}°`, { size: 13 });
      out += g.polyNames('ABC', { size: 15 }) + g.polyNames(nm2, { size: 15 });
      return out;
    },
  });
  if (askAngle) {
    const ans = angs[target];
    const shown = ang1Shown.slice(0, d === 'hard' ? 2 : 3);
    const others = [0, 1, 2].filter((i) => i !== target).map((i) => angs[i]);
    return {
      prompt: `Triangles $ABC$ and $${nm2.join('')}$ are congruent.<br>Work out the size of angle $x$.`,
      visual: vis,
      answer: `${ans}°`,
      distractors: [...others.map((v) => `${v}°`), `${180 - ans}°`, `${90 - ans > 0 ? 90 - ans : ans + 10}°`, `${Math.round((others[0] + others[1]) / 2)}°`].filter((s) => s !== `${ans}°`),
      typed: { kind: 'number', value: ans },
      solution: [
        'Congruent triangles have equal corresponding angles. Match the vertices using the sides: the angle $x$ is between the same pair of sides in both triangles.',
        `Angle $x$ is opposite the side of ${num(sides[key[target]])} cm, so it matches the angle at $${'ABC'[target]}$.`,
        shown.includes(target) ? `That angle is ${angs[target]}°.` : `Angle $${'ABC'[target]} = 180^\\circ - ${others[0]}^\\circ - ${others[1]}^\\circ = ${ans}^\\circ$ (angles in a triangle).`,
        `Answer: <b>${ans}°</b>`,
      ],
    };
  }
  const ans = sides[key[target]];
  const others = key.filter((_, i) => i !== target).map((k2) => sides[k2]);
  return {
    prompt: `Triangles $ABC$ and $${nm2.join('')}$ are congruent.<br>Work out the length $x$.`,
    visual: vis,
    answer: L1(ans),
    distractors: [...others.map(L1), L1(ans + 1), L1(Math.max(1, ans - 1)), L1(others[0] + others[1] - ans), L1(ans * 2)].filter((s) => s !== L1(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      'Congruent triangles are identical: corresponding sides are equal, even if one triangle is turned over or rotated.',
      `Side $x$ is opposite the ${angs[target]}° angle, and in triangle $ABC$ the side opposite ${angs[target]}° is ${num(ans)} cm.`,
      `Answer: <b>${L1(ans)}</b>`,
    ],
  };
}, { title: 'Congruent triangles: find a missing side or angle' });

export const congValid = gen('trig-cong-valid', 'trig-congruence', (rng, d) => {
  // Which set of facts proves two triangles congruent? / which does NOT?
  const [[A0, B0, C0], [P0, Q0, R0]] = pick(rng, [[['A', 'B', 'C'], ['P', 'Q', 'R']], [['A', 'B', 'C'], ['X', 'Y', 'Z']], [['A', 'B', 'C'], ['D', 'E', 'F']], [['J', 'K', 'L'], ['P', 'Q', 'R']], [['D', 'E', 'F'], ['L', 'M', 'N']], [['P', 'Q', 'R'], ['S', 'T', 'U']], [['A', 'B', 'C'], ['L', 'M', 'N']], [['K', 'L', 'M'], ['X', 'Y', 'Z']]]);
  const s = (a, b) => `${a}${b}`;
  const ang = (v) => `\\angle ${v}`;
  const facts = {
    SSS: `$${s(A0, B0)} = ${s(P0, Q0)}$, $${s(B0, C0)} = ${s(Q0, R0)}$, $${s(C0, A0)} = ${s(R0, P0)}$`,
    SAS: `$${s(A0, B0)} = ${s(P0, Q0)}$, $${ang(B0)} = ${ang(Q0)}$, $${s(B0, C0)} = ${s(Q0, R0)}$`,
    ASA: `$${ang(A0)} = ${ang(P0)}$, $${s(A0, B0)} = ${s(P0, Q0)}$, $${ang(B0)} = ${ang(Q0)}$`,
    AAS: `$${ang(A0)} = ${ang(P0)}$, $${ang(B0)} = ${ang(Q0)}$, $${s(B0, C0)} = ${s(Q0, R0)}$`,
    RHS: `$${ang(C0)} = ${ang(R0)} = 90^\\circ$, $${s(A0, B0)} = ${s(P0, Q0)}$, $${s(B0, C0)} = ${s(Q0, R0)}$`,
    AAA: `$${ang(A0)} = ${ang(P0)}$, $${ang(B0)} = ${ang(Q0)}$, $${ang(C0)} = ${ang(R0)}$`,
    SSA: `$${s(A0, B0)} = ${s(P0, Q0)}$, $${s(B0, C0)} = ${s(Q0, R0)}$, $${ang(A0)} = ${ang(P0)}$`,
    SSA2: `$${s(A0, C0)} = ${s(P0, R0)}$, $${s(B0, C0)} = ${s(Q0, R0)}$, $${ang(B0)} = ${ang(Q0)}$`,
  };
  const valid = ['SSS', 'SAS', 'ASA', 'AAS', 'RHS']; const invalid = ['AAA', 'SSA', 'SSA2'];
  const askValid = chance(rng, 0.5);
  const ansKey = askValid ? pick(rng, valid) : pick(rng, invalid);
  const ds = askValid ? shuffle(rng, invalid).concat([]) : shuffle(rng, valid);
  const count = 4;
  return {
    prompt: askValid
      ? `${pick(rng, ['', 'Two triangles are drawn. ', 'Kai wants to prove two triangles are congruent. '])}Which set of facts is enough to prove that triangles $${A0}${B0}${C0}$ and $${P0}${Q0}${R0}$ are congruent?`
      : `${pick(rng, ['', 'Look carefully. ', 'Ana says each set of facts below proves congruence, but she is wrong about one. '])}Three of these sets of facts prove that triangles $${A0}${B0}${C0}$ and $${P0}${Q0}${R0}$ are congruent. Which set does <b>not</b>?`,
    answer: facts[ansKey],
    distractors: ds.filter((k2) => k2 !== ansKey).map((k2) => facts[k2]),
    count,
    solution: [
      'The conditions for congruence are SSS, SAS (the angle must be <b>between</b> the two sides), ASA (or AAS) and RHS.',
      'Three equal angles (AAA) only proves the triangles are <b>similar</b> – one could be an enlargement of the other. Two sides with an angle that is <b>not</b> between them (SSA) is not enough either.',
      `Answer: ${facts[ansKey]} ${askValid ? `(${ansKey === 'AAS' ? 'ASA' : ansKey})` : `(${ansKey === 'AAA' ? 'AAA' : 'SSA – the angle is not between the sides'})`}`,
    ],
  };
}, { title: 'Which facts prove congruence?' });

export const similarLengthGenerators = [simPair, simNested, simHourglass, simScale, simRatio];
export const congruenceGenerators = [congReason, congFind, congValid];
export const similarAreaVolumeGenerators = [savArea, savVolume, savReverse, savRatio, savWord];

void [A, roundingFor, approxT, ACCENT, names];
