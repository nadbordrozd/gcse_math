// Diagram helpers for the geometry module. Everything returns SVG markup strings.
// Conventions: points are [x, y] in SVG screen coordinates (y down) unless a helper says "maths coords".
import {
  svg, line, polygon, polyline, path, text, circle, dot, rightAngleMark, equalTicks, parallelArrows,
  notDrawnAccurately, FILL, FILL2, ACCENT, ACCENT2, MUTED, GRID, sub, add, scale, len, unit, mid, centroid,
  polar, rad, fit, arrow, cross,
} from '../../svg.js';
import { tnum, gen, buildOptions } from '../../core.js';

export {
  svg, line, polygon, polyline, path, text, circle, dot, rightAngleMark, equalTicks, parallelArrows,
  notDrawnAccurately, FILL, FILL2, ACCENT, ACCENT2, MUTED, GRID, sub, add, scale, len, unit, mid, centroid,
  polar, rad, fit, arrow, cross,
};

const r2 = (x) => Math.round(x * 100) / 100;
export const SURFACE = 'var(--surface, #fff)';
export const SHADE = 'var(--d-fill2, #fde9d9)';

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

/** TeX degrees: degT(65) -> "$65^\circ$". */
export const degT = (x) => `$${tnum(x)}^\\circ$`;
/** Plain degrees for SVG labels. */
export const degS = (x) => `${String(x).replace('-', '−')}°`;
/** Three-figure bearing in TeX: bearingT(45) -> "$045^\circ$". */
export const bearingT = (b) => `$${String(((b % 360) + 360) % 360).padStart(3, '0')}^\\circ$`;
export const bearingS = (b) => `${String(((b % 360) + 360) % 360).padStart(3, '0')}°`;
/** "$12$ cm" style. */
export const withUnit = (x, u, dp = null) => `$${tnum(x, dp)}$${u ? ` ${u}` : ''}`;

/** Approximate rendered width of a label (system sans-serif). */
export function textWidth(label, size = 14) {
  let w = 0;
  for (const ch of String(label)) {
    if (/[0-9]/.test(ch)) w += 0.58;
    else if (ch === '°' || ch === '.' || ch === ',') w += 0.32;
    else if (ch === ' ') w += 0.28;
    else if (/[A-Z]/.test(ch)) w += 0.66;
    else if (/[a-z]/.test(ch)) w += 0.52;
    else w += 0.56;
  }
  return w * size;
}

/* ------------------------------------------------------------------ */
/* Angle marks                                                         */
/* ------------------------------------------------------------------ */

const normPi = (d) => {
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  return d;
};

/**
 * Arc + label for the angle at V between rays V->P and V->Q.
 * By default the smaller angle; reflex: true draws the larger one.
 * The label distance grows for small angles so the text never sits on the rays.
 * Returns '' arc when label is null and arc is false.
 */
export function arcLabel(V, P, Q, label, { r = null, size = 14, color = 'currentColor', reflex = false, arc = true, italic = null, double = false, dist = null } = {}) {
  const a1 = Math.atan2(P[1] - V[1], P[0] - V[0]);
  let d = normPi(Math.atan2(Q[1] - V[1], Q[0] - V[0]) - a1);
  if (reflex) d -= Math.sign(d || 1) * 2 * Math.PI;
  const th = Math.abs(d);
  const rr = r ?? (th < 0.55 ? 34 : th < 0.9 ? 28 : th > 3.5 ? 18 : 22);
  let out = '';
  const arcAt = (R) => {
    const p1 = [V[0] + R * Math.cos(a1), V[1] + R * Math.sin(a1)];
    const p2 = [V[0] + R * Math.cos(a1 + d), V[1] + R * Math.sin(a1 + d)];
    return path(`M ${r2(p1[0])} ${r2(p1[1])} A ${R} ${R} 0 ${th > Math.PI ? 1 : 0} ${d > 0 ? 1 : 0} ${r2(p2[0])} ${r2(p2[1])}`, { width: 1.5, color });
  };
  if (arc) out += arcAt(rr) + (double ? arcAt(rr + 4.5) : '');
  if (label !== null && label !== undefined && label !== '') {
    const hw = textWidth(label, size) / 2 + 2; const hh = size * 0.5 + 1;
    const m = a1 + d / 2;
    // clear of the arc along the bisector, and clear of both rays (box projected on each ray's normal)
    let D = rr + Math.abs(Math.cos(m)) * hw + Math.abs(Math.sin(m)) * hh + 4;
    const phi = th / 2;
    if (phi < Math.PI / 2) {
      for (const a of [a1, a1 + d]) {
        const ne = Math.abs(Math.sin(a)) * hw + Math.abs(Math.cos(a)) * hh;
        D = Math.max(D, (ne + 4) / Math.sin(phi));
      }
    }
    if (dist !== null) D = dist;
    const isItalic = italic ?? /^[a-z]$/.test(String(label));
    out += text(V[0] + D * Math.cos(m), V[1] + D * Math.sin(m), label, { size, color, italic: isItalic });
  }
  return out;
}

/** Right-angle square at V between rays to P and Q. */
export const rightMark = (V, P, Q, s = 12) => rightAngleMark(V, P, Q, s);

/** Label near a point, pushed in direction (angle in screen degrees, 0 = right, 90 = down) by dist px. */
export function labelAt(P, label, dirDeg, dist = 14, opts = {}) {
  const a = rad(dirDeg);
  const w = textWidth(label, opts.size || 15);
  const extra = Math.abs(Math.cos(a)) * (w / 2 - 4);
  return text(P[0] + Math.cos(a) * (dist + Math.max(0, extra)), P[1] + Math.sin(a) * dist, label, { size: 15, ...opts });
}

/** Point label (capital letter, italic like papers) pushed away from `from`. */
export function pointLabel(P, label, from, dist = 15, opts = {}) {
  const u = unit(sub(P, from));
  return text(P[0] + u[0] * dist, P[1] + u[1] * dist, label, { size: 15, italic: true, ...opts });
}

/** Extend segment PQ by a (fraction of |PQ|) before P and b after Q. */
export function extend(P, Q, a = 0.2, b = 0.2) {
  const v = sub(Q, P);
  return [add(P, scale(v, -a)), add(Q, scale(v, b))];
}
/** Point at fraction t along a ray from P towards Q, extended. */
export const along = (P, Q, dist) => add(P, scale(unit(sub(Q, P)), dist));

/** Intersection of lines P1P2 and Q1Q2. */
export function intersect(P1, P2, Q1, Q2) {
  const d1 = sub(P2, P1); const d2 = sub(Q2, Q1);
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  if (Math.abs(den) < 1e-9) return null;
  const t = ((Q1[0] - P1[0]) * d2[1] - (Q1[1] - P1[1]) * d2[0]) / den;
  return add(P1, scale(d1, t));
}

/** Side-length label on segment PQ, away from `inside`, with optional extra offset. */
export function dimLabel(P, Q, label, inside, { offset = 14, size = 14, color = 'currentColor', italic = null, halo = false } = {}) {
  const m = mid(P, Q); const u = unit(sub(Q, P));
  let n = [-u[1], u[0]];
  if (inside && (n[0] * (inside[0] - m[0]) + n[1] * (inside[1] - m[1])) > 0) n = scale(n, -1);
  const w = textWidth(label, size);
  const push = offset + Math.abs(n[0]) * (w / 2) + Math.abs(n[1]) * (size * 0.1);
  const it = italic ?? /^[a-z]$/.test(String(label));
  return (halo ? htext : text)(m[0] + n[0] * push, m[1] + n[1] * push, label, { size, color, italic: it });
}

/** Wrap a figure: adds "Not drawn accurately" in the top-right corner when nda. */
export function figure(w, h, body, { nda = false, label = 'Diagram', maxWidth = null } = {}) {
  return svg(w, h, body + (nda ? notDrawnAccurately(w - 6, 12) : ''), { maxWidth: maxWidth ?? Math.min(w, 460), label });
}

/** North arrow at P of length L (screen px). */
export function northLine(P, L = 70, { label = true, dashBelow = 0 } = {}) {
  let out = arrow(P[0], P[1], P[0], P[1] - L, { width: 1.6, head: 8 });
  if (dashBelow) out += line(P[0], P[1], P[0], P[1] + dashBelow, { width: 1.2, dash: '4 4', color: MUTED });
  if (label) out += text(P[0], P[1] - L - 11, 'N', { size: 14, bold: true });
  return out;
}

/* ------------------------------------------------------------------ */
/* Shapes from angles (maths coords, y up)                             */
/* ------------------------------------------------------------------ */

/** Triangle with angle a at A=(0,0), angle b at B=(1,0); returns [A, B, C] in maths coords. */
export function triFromAngles(a, b) {
  const c = 180 - a - b;
  const side = Math.sin(rad(b)) / Math.sin(rad(c));
  return [[0, 0], [1, 0], [side * Math.cos(rad(a)), side * Math.sin(rad(a))]];
}

/**
 * Convex polygon (maths coords, anticlockwise) with the given interior angles (degrees, summing to (n-2)·180).
 * Side lengths are chosen with rng so that the polygon closes with reasonably balanced sides.
 */
export function polyFromAngles(angles, rng, { spread = 0.35 } = {}) {
  const n = angles.length;
  const dirs = [0];
  for (let i = 1; i < n; i += 1) dirs.push(dirs[i - 1] + 180 - angles[i]);
  const u = dirs.map((d) => [Math.cos(rad(d)), Math.sin(rad(d))]);
  let best = null;
  for (let tries = 0; tries < 60; tries += 1) {
    const L = Array.from({ length: n - 2 }, () => 1 + spread * (2 * rng() - 1));
    const S = L.reduce((acc, l, i) => add(acc, scale(u[i], l)), [0, 0]);
    // Solve a*u[n-2] + b*u[n-1] = -S
    const p = u[n - 2]; const q = u[n - 1];
    const den = p[0] * q[1] - p[1] * q[0];
    if (Math.abs(den) < 1e-9) continue;
    const a = (-S[0] * q[1] + S[1] * q[0]) / den;
    const b = (p[0] * -S[1] - p[1] * -S[0]) / den;
    const all = [...L, a, b];
    const bal = Math.min(...all) / Math.max(...all);
    if (a > 0 && b > 0 && (!best || bal > best.bal)) best = { bal, all };
    if (best && best.bal > 0.55) break;
  }
  if (!best || best.bal < 0.25) throw new Error('polyFromAngles: no balanced polygon');
  const pts = [[0, 0]];
  for (let i = 0; i < n - 1; i += 1) pts.push(add(pts[i], scale(u[i], best.all[i])));
  return pts;
}

/** Map maths-coord points into a box. Returns { P: mapped points, map, k }. */
export function place(points, { width = 380, height = 250, pad = 40, padTop = null } = {}) {
  const f = fit(points, { width, height: height - (padTop ? padTop - pad : 0), pad });
  const dy = padTop ? padTop - pad : 0;
  const map = (p) => { const q = f.map(p); return [q[0], q[1] + dy]; };
  return { P: points.map(map), map, k: f.k };
}

/** Regular polygon vertices (screen coords) centred at c, radius R, first vertex at angle start (maths degrees). */
export function regularPoly(n, c, R, start = 90) {
  return Array.from({ length: n }, (_, i) => polar(c, R, start + (360 * i) / n));
}

/* ------------------------------------------------------------------ */
/* Option panels: several small diagrams labelled A–D in one SVG        */
/* ------------------------------------------------------------------ */

export const LABEL_SETS = [['A', 'B', 'C', 'D'], ['P', 'Q', 'R', 'S'], ['E', 'F', 'G', 'H'], ['W', 'X', 'Y', 'Z'], ['J', 'K', 'L', 'M']];

/**
 * panels: array of functions (x0, y0, w, h) => markup, drawn in a grid with a bold label above each.
 * Returns the SVG.
 */
export function panelGrid(panels, labels, { cols = 2, w = 200, h = 160, gap = 16, labelH = 24 } = {}) {
  const rows = Math.ceil(panels.length / cols);
  const W = cols * w + (cols - 1) * gap;
  const H = rows * (h + labelH) + (rows - 1) * gap;
  let body = '';
  panels.forEach((draw, i) => {
    const cx = (i % cols) * (w + gap); const cy = Math.floor(i / cols) * (h + labelH + gap);
    body += text(cx + w / 2, cy + 11, labels[i], { size: 16, bold: true });
    body += draw(cx, cy + labelH, w, h);
  });
  return svg(W, H, body, { maxWidth: Math.min(W, 480), label: 'Options diagram' });
}

/* ------------------------------------------------------------------ */
/* Squared grid (no axes) for counting / shapes on a grid              */
/* ------------------------------------------------------------------ */

/** Grid of cols × rows squares of size s at (x0, y0). Returns { body, P([i,j]) } with j counted upward from the bottom. */
export function squareGrid(cols, rows, { s = 26, x0 = 10, y0 = 10, color = GRID, dashed = false } = {}) {
  let body = '';
  for (let i = 0; i <= cols; i += 1) body += line(x0 + i * s, y0, x0 + i * s, y0 + rows * s, { color, width: 1, dash: dashed ? '3 3' : null });
  for (let j = 0; j <= rows; j += 1) body += line(x0, y0 + j * s, x0 + cols * s, y0 + j * s, { color, width: 1, dash: dashed ? '3 3' : null });
  const P = ([i, j]) => [x0 + i * s, y0 + (rows - j) * s];
  return { body, P, width: cols * s + 2 * x0, height: rows * s + 2 * y0, s };
}

/* ------------------------------------------------------------------ */
/* Numeric option helpers                                              */
/* ------------------------------------------------------------------ */

/** Keep plausible wrong values: finite, different from ans, within [min,max], integers if requested, unique. */
export function wrongs(ans, list, { min = 0, max = Infinity, integer = false, exclusiveMin = true, near = [] } = {}) {
  const out = [];
  const ok = (v) => Number.isFinite(v) && Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6 && Math.abs(v - ans) > 1e-9 && (exclusiveMin ? v > min : v >= min) && v <= max
    && (!integer || Number.isInteger(Math.round(v * 1e9) / 1e9)) && !out.some((o) => Math.abs(o - v) < 1e-9);
  for (const v0 of [...list, ...near.flatMap((s) => [ans + s, ans - s])]) {
    const v = Math.round(v0 * 1e9) / 1e9;
    if (ok(v)) out.push(v);
  }
  return out;
}

/** Angle distractors (degrees, TeX) from misconception values then nearby values. */
export function angleWrongs(ans, list, { max = 359 } = {}) {
  return wrongs(ans, list, { min: 0, max, integer: true, near: [10, 20, 5, 30, 1, 2] }).map(degT);
}

/** Pick an index from weights. */
export function weighted(rng, items) {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of items) { r -= w; if (r < 0) return v; }
  return items[items.length - 1][0];
}

export { centroid as centre };
void [FILL2, ACCENT2, len, dot, polyline, circle, polygon, equalTicks, parallelArrows];

/**
 * gen() with built-in retries: the build may throw (unsuitable random parameters) or produce options that cannot
 * be made distinct; it is re-run with the same (advancing) rng, so the result stays deterministic.
 */
export function ggen(id, skill, build, meta = {}) {
  return gen(id, skill, (rng, d) => {
    let last;
    for (let i = 0; i < 80; i += 1) {
      try {
        const q = build(rng, d);
        buildOptions(() => 0.5, q.answer, q.distractors || [], { count: q.count ?? 5, allowEquivalent: q.allowEquivalent, fill: q.fill ?? true });
        return q;
      } catch (e) { last = e; }
    }
    throw last;
  }, meta);
}

/** Text with a halo in the background colour, for labels that sit on top of lines or fills. */
export function htext(x, y, str, opts = {}) {
  return text(x, y, str, opts).replace('<text ', '<text stroke="var(--surface, #fff)" stroke-width="4" stroke-linejoin="round" paint-order="stroke" ');
}
