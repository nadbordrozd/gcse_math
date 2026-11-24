// Diagram helpers for the trig module: labelled triangles and polygons, circle-theorem figures,
// 3D solids (cuboids, pyramids, prisms) and vector diagrams.
//
// Most figures are built with fig(): give the points in maths coordinates (y up), optionally a
// rotation/reflection, and a draw(g) callback that uses the helper g to draw polygons, labels,
// angle arcs and so on in screen coordinates. Labels are placed with their size taken into account
// so they sit just clear of the lines they label.
import {
  svg, line, polygon, circle as svgCircle, path, text, dot, rightAngleMark, equalTicks, parallelArrows,
  notDrawnAccurately, sub, add, scale, len, unit, mid, lerp, fit, FILL, FILL2, ACCENT, ACCENT2, MUTED, GRID,
} from '../../svg.js';

export { FILL, FILL2, ACCENT, ACCENT2, MUTED, GRID };

const r2 = (x) => Math.round(x * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;

/** Rough rendered width of a label in px. */
export function textWidth(s, size = 15) {
  let w = 0;
  for (const ch of String(s)) {
    if (/[ilj.,'°1|:()]/.test(ch)) w += 0.3;
    else if (/[mwMW]/.test(ch)) w += 0.85;
    else if (ch === ' ') w += 0.28;
    else if (/[A-Z]/.test(ch)) w += 0.66;
    else w += 0.56;
  }
  return w * size;
}

/** Text with automatic italics for algebraic labels like x, y, 2x, θ. */
export function label(x, y, s, { size = 15, bold = false, color = 'currentColor', anchor = 'middle', italic = null } = {}) {
  const str = String(s).replace(/-/g, '−');
  const it = italic ?? (bold ? false : /^(\d*[a-zθ]|[a-zθ]\s*°|\d*[a-z] ?[+−-] ?\d+°?)$/.test(str));
  return text(x, y, str, { size, bold, italic: it, color, anchor });
}

/** Point name helper: 'A' -> point, [x, y] stays. */
const isName = (p) => typeof p === 'string';

/**
 * Build a figure.
 *  pts: { A: [x, y], ... } in maths coordinates (y up)
 *  rotate: degrees anticlockwise, flip: mirror in the y-axis first
 *  circles: [[centre, radius]] in maths units, so the fit leaves room for whole circles
 *  bounds: extra maths points to include in the fit
 *  draw(g): returns markup; see helpers below
 */
export function fig({ pts = {}, rotate = 0, flip = false, width = 380, height = 240, pad = 34, padX = null, bounds = [], circles = [], nda = true, draw, ariaLabel = 'Diagram' }) {
  const c = Math.cos(rad(rotate)); const s = Math.sin(rad(rotate));
  const T = ([x, y]) => { const xx = flip ? -x : x; return [xx * c - y * s, xx * s + y * c]; };
  const tp = {};
  for (const [k, v] of Object.entries(pts)) tp[k] = T(v);
  const all = [...Object.values(tp), ...bounds.map(T)];
  for (const [cen, R] of circles) {
    const q = isName(cen) ? tp[cen] : T(cen);
    all.push([q[0] - R, q[1] - R], [q[0] + R, q[1] + R]);
  }
  const top = nda ? 16 : 0;
  // fit() uses a single pad; allow a different horizontal pad by fitting in a narrower box.
  const px = padX ?? pad;
  const f = fit(all, { width: width - 2 * (px - pad), height, pad });
  const P = (p) => {
    const q = isName(p) ? tp[p] : T(p);
    if (!q) throw new Error(`fig: unknown point ${p}`);
    const m = f.map(q);
    return [m[0] + (px - pad), m[1] + top];
  };
  const names = Object.keys(tp);
  const centre = names.length ? scale(names.map(P).reduce(add, [0, 0]), 1 / names.length) : [width / 2, height / 2];
  const g = makeHelpers(P, f.k, centre, T);
  const body = draw(g);
  return svg(width, height + top, body + (nda ? notDrawnAccurately(width - 4, 10) : ''), { label: ariaLabel });
}

/** Approximate clearance between a label box (centre c, w x h) and segment S1S2 (negative = overlap). */
function boxSegDist(c, w, h, S1, S2) {
  // sample the segment and measure the box distance (Chebyshev-style) to the nearest sample
  let best = Infinity;
  const n = 24;
  for (let i = 0; i <= n; i += 1) {
    const q = lerp(S1, S2, i / n);
    const dx = Math.abs(q[0] - c[0]) - w / 2; const dy = Math.abs(q[1] - c[1]) - h / 2;
    best = Math.min(best, Math.max(dx, dy));
  }
  return best;
}

function makeHelpers(P, k, centre, T) {
  const S = (p) => (Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && p.screen ? p : P(p));
  const obs = { segs: [], boxes: [], circles: [] };
  const box = (x, y, lab, size) => { obs.boxes.push({ x, y, w: textWidth(lab, size), h: size * 0.95 }); };
  const g = {
    P, k, centre, obs,
    /** maths direction vector -> screen direction (unit) */
    dir(v) { const a = P([0, 0]); const b = P(v); return unit(sub(b, a)); },
    poly(list, { fill = FILL, width = 2, color = 'currentColor', fillOpacity = 1, dash = null } = {}) {
      const arr = typeof list === 'string' ? [...list] : list;
      const pp = arr.map(P);
      if (width > 0) pp.forEach((q, i) => obs.segs.push([q, pp[(i + 1) % pp.length]]));
      return polygon(pp, { fill, width, color, fillOpacity, dash });
    },
    seg(a, b, opts = {}) { const A = P(a); const B = P(b); obs.segs.push([A, B]); return line(A[0], A[1], B[0], B[1], opts); },
    /** Polyline through several named points. */
    path(list, opts = {}) {
      const arr = typeof list === 'string' ? [...list] : list;
      let out = '';
      for (let i = 0; i + 1 < arr.length; i += 1) out += g.seg(arr[i], arr[i + 1], opts);
      return out;
    },
    circle(cen, R, { fill = 'none', width = 2, color = 'currentColor' } = {}) {
      const C = P(cen); obs.circles.push([C, R * k]); return svgCircle(C[0], C[1], R * k, { fill, width, color });
    },
    dot(p, r = 3.2, color = 'currentColor') { const A = P(p); return dot(A[0], A[1], r, color); },
    /** Label for side ab, placed outside (away from `inside`, default the figure centre). t = position along ab. */
    side(a, b, lab, { inside = null, offset = 5, t = 0.5, size = 15, color = 'currentColor', bold = false } = {}) {
      const A = P(a); const B = P(b);
      const m = lerp(A, B, t); const u = unit(sub(B, A));
      let n = [-u[1], u[0]];
      const I = inside === null ? centre : P(inside);
      if (n[0] * (I[0] - m[0]) + n[1] * (I[1] - m[1]) > 0) n = scale(n, -1);
      const w = textWidth(lab, size); const h = size * 0.95;
      const d = offset + Math.abs(n[0]) * w / 2 + Math.abs(n[1]) * h / 2;
      box(m[0] + n[0] * d, m[1] + n[1] * d, lab, size);
      return label(m[0] + n[0] * d, m[1] + n[1] * d, lab, { size, color, bold });
    },
    /** Label at the screen position of point p pushed in direction dir (screen unit vector) or away from `away`. */
    name(p, lab = null, { away = null, dir = null, offset = 7, size = 16, color = 'currentColor', bold = false } = {}) {
      const A = P(p);
      const s = lab ?? p;
      let u = dir ? unit(dir) : unit(sub(A, away === null ? centre : P(away)));
      if (!Number.isFinite(u[0]) || (u[0] === 0 && u[1] === 0)) u = [0, -1];
      const w = textWidth(s, size); const h = size * 0.95;
      const d = offset + Math.abs(u[0]) * w / 2 + Math.abs(u[1]) * h / 2;
      box(A[0] + u[0] * d, A[1] + u[1] * d, s, size);
      return label(A[0] + u[0] * d, A[1] + u[1] * d, s, { size, color, bold, italic: false });
    },
    /**
     * Name a point, choosing among 16 directions the label position with the most clearance from every
     * segment, circle and label drawn so far. Call it after drawing the lines.
     */
    freeName(p, lab = null, { offset = 6, size = 16, prefer = null } = {}) {
      const A = P(p); const s = lab ?? p;
      const w = textWidth(s, size); const h = size * 0.95;
      let best = null;
      for (let i = 0; i < 16; i += 1) {
        const ang = (i * Math.PI) / 8; const u = [Math.cos(ang), Math.sin(ang)];
        const d = offset + Math.abs(u[0]) * w / 2 + Math.abs(u[1]) * h / 2;
        const c = [A[0] + u[0] * d, A[1] + u[1] * d];
        let score = Infinity;
        for (const [S1, S2] of obs.segs) score = Math.min(score, boxSegDist(c, w, h, S1, S2));
        for (const b of obs.boxes) score = Math.min(score, Math.max(Math.abs(c[0] - b.x) - (w + b.w) / 2, Math.abs(c[1] - b.y) - (h + b.h) / 2));
        for (const [C, R] of obs.circles) score = Math.min(score, Math.abs(Math.hypot(c[0] - C[0], c[1] - C[1]) - R) - Math.hypot(w, h) / 2);
        if (prefer) score += 0.5 * (u[0] * prefer[0] + u[1] * prefer[1]);
        if (!best || score > best.score) best = { score, c };
      }
      box(best.c[0], best.c[1], s, size);
      return label(best.c[0], best.c[1], s, { size, italic: false });
    },
    /** Name every vertex of a polygon, pushed outwards along the exterior bisector. */
    polyNames(list, { labels = null, size = 16, offset = 7, skip = [] } = {}) {
      const arr = typeof list === 'string' ? [...list] : list;
      let out = '';
      arr.forEach((v, i) => {
        if (skip.includes(v)) return;
        const V = P(v); const A = P(arr[(i + arr.length - 1) % arr.length]); const B = P(arr[(i + 1) % arr.length]);
        let d = scale(add(unit(sub(A, V)), unit(sub(B, V))), -1);
        if (len(d) < 0.15) { const nrm = unit(sub(B, A)); d = [nrm[1], -nrm[0]]; if ((d[0] * (centre[0] - V[0]) + d[1] * (centre[1] - V[1])) > 0) d = scale(d, -1); }
        // Reflex vertex: the bisector points inwards; flip it.
        out += g.name(v, labels ? labels[i] : v, { dir: d, size, offset });
      });
      return out;
    },
    /**
     * Angle arc at v between rays v->a and v->b (the smaller angle unless reflex), with a label placed
     * inside the angle far enough out to fit between the arms.
     */
    angle(v, a, b, lab = null, { r = null, size = 14, double = false, color = 'currentColor', maxDist = 90, reflex = false, labelDist = null, arc = true } = {}) {
      const V = P(v); const A = P(a); const B = P(b);
      const a1 = Math.atan2(A[1] - V[1], A[0] - V[0]);
      const a2 = Math.atan2(B[1] - V[1], B[0] - V[0]);
      let d = a2 - a1;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d <= -Math.PI) d += 2 * Math.PI;
      if (reflex) d = d > 0 ? d - 2 * Math.PI : d + 2 * Math.PI;
      const th = Math.abs(d);
      const rr = r ?? (th < 0.42 ? 36 : th < 0.75 ? 28 : th < 1.3 ? 22 : 19);
      const arcAt = (R) => {
        const p1 = [V[0] + R * Math.cos(a1), V[1] + R * Math.sin(a1)];
        const p2 = [V[0] + R * Math.cos(a1 + d), V[1] + R * Math.sin(a1 + d)];
        for (let i = 0; i < 8; i += 1) {
          const t1 = a1 + (d * i) / 8; const t2 = a1 + (d * (i + 1)) / 8;
          obs.segs.push([[V[0] + R * Math.cos(t1), V[1] + R * Math.sin(t1)], [V[0] + R * Math.cos(t2), V[1] + R * Math.sin(t2)]]);
        }
        return path(`M ${r2(p1[0])} ${r2(p1[1])} A ${R} ${R} 0 ${th > Math.PI ? 1 : 0} ${d > 0 ? 1 : 0} ${r2(p2[0])} ${r2(p2[1])}`, { width: 1.6, color });
      };
      let out = arc ? arcAt(rr) : '';
      if (arc && double) out += arcAt(rr + 4.5);
      if (lab !== null && lab !== undefined && lab !== '') {
        const m = a1 + d / 2; const cx = Math.cos(m); const cy = Math.sin(m);
        const w = textWidth(lab, size); const h = size * 0.95;
        const ext = Math.abs(cx) * w / 2 + Math.abs(cy) * h / 2;
        const rho = Math.hypot(w / 2, h / 2) * 0.78;
        let dist = rr + (double ? 4.5 : 0) + ext + 3;
        if (th < Math.PI) dist = Math.max(dist, (rho + 2) / Math.sin(th / 2));
        dist = labelDist ?? Math.min(dist, maxDist);
        box(V[0] + dist * cx, V[1] + dist * cy, lab, size);
        out += label(V[0] + dist * cx, V[1] + dist * cy, lab, { size, color });
      }
      return out;
    },
    right(v, a, b, s = 11) { return rightAngleMark(P(v), P(a), P(b), s); },
    ticks(a, b, n = 1) { return equalTicks(P(a), P(b), n); },
    arrows(a, b, n = 1) { return parallelArrows(P(a), P(b), n); },
    /** Small arrowhead in the middle of ab pointing a->b (vector direction) */
    vhead(a, b, { t = 0.5, s = 8, color = 'currentColor' } = {}) {
      const A = P(a); const B = P(b); const u = unit(sub(B, A)); const n = [-u[1], u[0]];
      const tip = add(lerp(A, B, t), scale(u, s * 0.5));
      const back = add(tip, scale(u, -s));
      return polygon([tip, add(back, scale(n, s * 0.55)), add(back, scale(n, -s * 0.55))], { fill: color, color, width: 1 });
    },
    text(p, s, opts = {}) { const A = P(p); return label(A[0], A[1], s, opts); },
    /** Raw screen-space text offset from a point. */
    textAt(p, dx, dy, s, opts = {}) { const A = P(p); return label(A[0] + dx, A[1] + dy, s, opts); },
  };
  void S; void T;
  return g;
}

/* ------------------------------------------------------------------ */
/* Geometry utilities (maths coordinates)                              */
/* ------------------------------------------------------------------ */

/** Point on a circle centre c radius R at angle (degrees anticlockwise from +x). */
export const onCircle = (c, R, a) => [c[0] + R * Math.cos(rad(a)), c[1] + R * Math.sin(rad(a))];

/** Triangle from side b = |AC|, c = |AB| and angle A (degrees): A at origin, AB along +x. */
export function triangleSAS(b, c, A) {
  return { A: [0, 0], B: [c, 0], C: [b * Math.cos(rad(A)), b * Math.sin(rad(A))] };
}
/** Triangle from three sides a=|BC|, b=|CA|, c=|AB|. */
export function triangleSSS(a, b, c) {
  const cosA = (b * b + c * c - a * a) / (2 * b * c);
  return triangleSAS(b, c, (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI);
}
/** Angle (degrees) at V in triangle V,A,B (maths coordinates). */
export function angleAt(V, A, B) {
  const u = sub(A, V); const w = sub(B, V);
  return (Math.acos(Math.max(-1, Math.min(1, (u[0] * w[0] + u[1] * w[1]) / (len(u) * len(w))))) * 180) / Math.PI;
}

/**
 * Display shape for a right-angled triangle with legs p (horizontal-ish) and q: keeps which leg is longer but
 * stops very thin triangles so labels fit. Returns display lengths.
 */
export function displayLegs(p, q, { minRatio = 0.42 } = {}) {
  let a = p; let b = q;
  const ratio = Math.min(a, b) / Math.max(a, b);
  if (ratio < minRatio) {
    if (a < b) a = b * minRatio; else b = a * minRatio;
  }
  return [a, b];
}

/* ------------------------------------------------------------------ */
/* 3D solids (oblique projection)                                      */
/* ------------------------------------------------------------------ */

const DEPTH = [0.5, 0.36]; // screen offset per unit of depth (x, y) in maths coordinates

/** Project (x, y, z): x to the right, y up, z into the page. */
export const proj = ([x, y, z], depth = DEPTH) => [x + z * depth[0], y + z * depth[1]];

/**
 * Cuboid with base ABCD (A front-left, B front-right, C back-right, D back-left) and top EFGH above ABCD.
 * w = AB (width), d = BC (depth), h = AE (height). Returns { pts, visible, hidden }.
 */
export function cuboid(w, d, h, depth = DEPTH) {
  const P3 = { A: [0, 0, 0], B: [w, 0, 0], C: [w, 0, d], D: [0, 0, d], E: [0, h, 0], F: [w, h, 0], G: [w, h, d], H: [0, h, d] };
  const pts = Object.fromEntries(Object.entries(P3).map(([k, v]) => [k, proj(v, depth)]));
  return {
    pts,
    visible: ['AB', 'BC', 'AE', 'BF', 'CG', 'EF', 'FG', 'GH', 'HE'],
    hidden: ['AD', 'DC', 'DH'],
  };
}

/** Square/rectangular-based pyramid: base ABCD as for cuboid, apex E above the centre M of the base. */
export function pyramid(w, d, h, depth = DEPTH) {
  const P3 = { A: [0, 0, 0], B: [w, 0, 0], C: [w, 0, d], D: [0, 0, d], E: [w / 2, h, d / 2], M: [w / 2, 0, d / 2] };
  const pts = Object.fromEntries(Object.entries(P3).map(([k, v]) => [k, proj(v, depth)]));
  return { pts, visible: ['AB', 'BC', 'EA', 'EB', 'EC'], hidden: ['AD', 'DC', 'ED'] };
}

/**
 * Triangular prism lying on a rectangular face: cross-section ABC at the front (right angle at B, AB vertical),
 * length l into the page: D, E, F behind A, B, C.
 */
export function triPrism(base, height, l, depth = DEPTH) {
  const P3 = { A: [0, height, 0], B: [0, 0, 0], C: [base, 0, 0], D: [0, height, l], E: [0, 0, l], F: [base, 0, l] };
  const pts = Object.fromEntries(Object.entries(P3).map(([k, v]) => [k, proj(v, depth)]));
  return { pts, visible: ['AB', 'BC', 'CA', 'AD', 'CF', 'DF'], hidden: ['BE', 'EF', 'DE'] };
}

/** Draw edges from a list like ['AB', 'BC'] */
export const edges = (g, list, opts = {}) => list.map((e) => g.seg(e[0], e[1], opts)).join('');

/* ------------------------------------------------------------------ */
/* Vectors on a grid                                                   */
/* ------------------------------------------------------------------ */

/**
 * Squared grid with vector arrows. vectors: [{ from: [x, y], to: [x, y], label, color }] in grid units (y up).
 * cols/rows: grid size. Labels are bold (vector notation) and placed beside the arrow.
 */
export function vectorGrid({ cols = 12, rows = 8, unitPx = 28, vectors = [], points = [] }) {
  const pad = 10;
  const W = cols * unitPx + 2 * pad; const H = rows * unitPx + 2 * pad;
  const X = (x) => pad + x * unitPx; const Y = (y) => H - pad - y * unitPx;
  let body = '';
  for (let i = 0; i <= cols; i += 1) body += line(X(i), Y(0), X(i), Y(rows), { color: GRID, width: 1 });
  for (let j = 0; j <= rows; j += 1) body += line(X(0), Y(j), X(cols), Y(j), { color: GRID, width: 1 });
  for (const v of vectors) {
    const A = [X(v.from[0]), Y(v.from[1])]; const B = [X(v.to[0]), Y(v.to[1])];
    const color = v.color || ACCENT;
    const u = unit(sub(B, A)); const n = [-u[1], u[0]];
    const head = 11; const back = add(B, scale(u, -head));
    body += line(A[0], A[1], back[0], back[1], { color, width: 2.6 });
    body += polygon([B, add(back, scale(n, 5)), add(back, scale(n, -5))], { fill: color, color, width: 1 });
    if (v.label) {
      // label on the side with more room (left of direction by default)
      const side = v.side ?? 1;
      const m = mid(A, B); const nn = scale(n, side);
      const w = textWidth(v.label, 17);
      const d = 8 + Math.abs(nn[0]) * w / 2 + Math.abs(nn[1]) * 8;
      body += text(m[0] + nn[0] * d, m[1] + nn[1] * d, v.label, { size: 17, bold: true, color });
    }
  }
  for (const p of points) {
    body += dot(X(p.at[0]), Y(p.at[1]), 3.5);
    if (p.label) body += text(X(p.at[0]) + (p.dx ?? -10), Y(p.at[1]) + (p.dy ?? -10), p.label, { size: 15 });
  }
  return svg(W, H, body, { maxWidth: Math.min(W, 440), label: 'Vectors on a grid' });
}

export { mid, lerp, add, sub, scale, unit, len };

/* ------------------------------------------------------------------ */
/* Right-angled triangle                                               */
/* ------------------------------------------------------------------ */

/**
 * Right-angled triangle with the right angle at C, vertex A at the end of leg CA and B at the end of leg CB.
 *  angleA: the angle at A in degrees (sets the shape; clamped to 24..66 for display)
 *  sides: { CA, CB, AB } labels (any may be omitted)
 *  angles: { A: label, B: label } (arc drawn when key present; '' gives arc without label)
 *  names: true to show vertex letters (or an object mapping A/B/C to other letters)
 *  rotate/flip: orientation
 */
export function rightTriangleFig({ angleA = 40, sides = {}, angles = {}, names = false, rotate = 0, flip = false, width = 340, height = 220, nda = true, extra = null }) {
  const th = Math.max(24, Math.min(66, angleA));
  const pts = { C: [0, 0], A: [1, 0], B: [0, Math.tan(rad(th))] };
  return fig({
    pts, rotate, flip, width, height, nda, pad: 40,
    draw: (g) => {
      let out = g.poly('ABC');
      out += g.right('C', 'A', 'B', 12);
      for (const [v, lab] of Object.entries(angles)) {
        if (lab === undefined || lab === null) continue;
        const [p, q] = v === 'A' ? ['C', 'B'] : ['A', 'C'];
        out += g.angle(v, p, q, lab);
      }
      if (sides.CA) out += g.side('C', 'A', sides.CA);
      if (sides.CB) out += g.side('C', 'B', sides.CB);
      if (sides.AB) out += g.side('A', 'B', sides.AB);
      if (names) {
        const map = names === true ? { A: 'A', B: 'B', C: 'C' } : names;
        out += g.polyNames('ABC', { labels: ['A', 'B', 'C'].map((k) => map[k]) });
      }
      if (extra) out += extra(g);
      return out;
    },
  });
}

/* ------------------------------------------------------------------ */
/* Pairs of shapes (similar / congruent)                               */
/* ------------------------------------------------------------------ */

/**
 * Transform a copy of a polygon (maths coords): scale k about its centroid, rotate (deg), optional mirror,
 * then place it to the right of `first` with a gap (in units of the first shape's width).
 */
export function placeBeside(first, pts, { k = 1, rotate = 0, flip = false, gap = 0.35, dy = 0 } = {}) {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length; const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const c = Math.cos(rad(rotate)); const s = Math.sin(rad(rotate));
  let out = pts.map(([x, y]) => { let u = (x - cx) * k; const v = (y - cy) * k; if (flip) u = -u; return [u * c - v * s, u * s + v * c]; });
  const fx = first.map((p) => p[0]); const fy = first.map((p) => p[1]);
  const ox = out.map((p) => p[0]); const oy = out.map((p) => p[1]);
  const w1 = Math.max(...fx) - Math.min(...fx);
  const shiftX = Math.max(...fx) + gap * w1 - Math.min(...ox);
  const midY1 = (Math.max(...fy) + Math.min(...fy)) / 2; const midY2 = (Math.max(...oy) + Math.min(...oy)) / 2;
  out = out.map(([x, y]) => [x + shiftX, y + midY1 - midY2 + dy]);
  return out;
}
