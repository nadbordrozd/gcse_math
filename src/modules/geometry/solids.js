// 3D drawing helpers: oblique prisms (cuboids, triangular/L/trapezium prisms), cylinders, cones, spheres,
// hemispheres, pyramids, and isometric cube stacks. All return SVG markup strings.
import {
  line, polygon, path, text, dot, figure, place, add, sub, scale, mid, centroid, dimLabel, htext, textWidth, rightMark,
  FILL, MUTED,
} from './diagrams.js';

const SIDE = 'var(--d-fill, #e8eefc)';
const OBL = [Math.cos((35 * Math.PI) / 180) * 0.5, Math.sin((35 * Math.PI) / 180) * 0.5];
const r2 = (x) => Math.round(x * 100) / 100;

/** Oblique projection of (x, y, z) into maths 2D. */
export const proj = ([x, y, z], k = 1) => [x + z * OBL[0] * k, y + z * OBL[1] * k];

/**
 * Prism with cross-section `cs` (maths coords, any orientation) extruded by depth D (z direction, drawn up-right).
 * labels: [{ a: [x,y,z], b: [x,y,z], text, away?: [x,y,z] }] dimension labels on edges.
 * Options: depthScale shrinks the drawn depth (not to scale), hidden: draw hidden edges dashed (convex only).
 */
export function prismFig(cs, D, { labels = [], W = 420, H = 270, depthScale = 1, hidden = true, extra = null, nda = true, frontFill = FILL, rightAngles = [] } = {}) {
  const n = cs.length;
  const sa = cs.reduce((s, p, i) => { const q = cs[(i + 1) % n]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
  const ccw = sa > 0;
  const Dd = D * depthScale;
  const F3 = cs.map(([x, y]) => [x, y, 0]); const B3 = cs.map(([x, y]) => [x, y, Dd]);
  const all2 = [...F3, ...B3].map((p) => proj(p));
  const pl = place(all2, { width: W, height: H, pad: 58 });
  const P = (p3) => pl.map(proj(p3));
  // label/extra points are given with the TRUE depth; scale them like the drawing
  const PL = (p3) => pl.map(proj([p3[0], p3[1], p3[2] * depthScale]));
  const Fs = F3.map(P); const Bs = B3.map(P);
  // visibility of side faces
  const vis = cs.map((p, i) => {
    const q = cs[(i + 1) % n]; const dx = q[0] - p[0]; const dy = q[1] - p[1];
    const nrm = ccw ? [dy, -dx] : [-dy, dx];
    return nrm[0] * OBL[0] + nrm[1] * OBL[1] > 1e-9;
  });
  let body = '';
  // visible side faces (painter: draw those further back first — sort by depth of their midpoint along OBL)
  const order = cs.map((_, i) => i).filter((i) => vis[i]).sort((i, j) => {
    const mi = mid(cs[i], cs[(i + 1) % n]); const mj = mid(cs[j], cs[(j + 1) % n]);
    return (mj[0] * OBL[0] + mj[1] * OBL[1]) - (mi[0] * OBL[0] + mi[1] * OBL[1]);
  });
  for (const i of order) {
    const j = (i + 1) % n;
    body += polygon([Fs[i], Fs[j], Bs[j], Bs[i]], { fill: SIDE, fillOpacity: 0.55, width: 2 });
  }
  body += polygon(Fs, { fill: frontFill, width: 2 });
  if (hidden) {
    for (let i = 0; i < n; i += 1) {
      const j = (i + 1) % n;
      if (!vis[i]) body += line(...Bs[i], ...Bs[j], { width: 1.3, dash: '5 4', color: MUTED });
      const prev = (i + n - 1) % n;
      if (!vis[i] && !vis[prev]) body += line(...Fs[i], ...Bs[i], { width: 1.3, dash: '5 4', color: MUTED });
    }
  }
  for (const [vi, a, b] of rightAngles) body += rightMark(Fs[vi], Fs[a], Fs[b], 10);
  const C2 = centroid([...Fs, ...Bs]);
  for (const L of labels) {
    const A = PL(L.a); const B = PL(L.b);
    const away = L.away ? PL(L.away) : C2;
    body += dimLabel(A, B, L.text, away, { offset: L.offset ?? 12, size: 14, italic: L.italic ?? null, halo: true });
  }
  if (extra) body += extra(PL);
  return figure(W, H, body, { nda });
}

/** Cuboid l (x) × h (y) × w (z depth) with labels on length, height and depth edges. */
export function cuboidFig(l, w, h, { labels = [null, null, null], W = 400, H = 260, nda = true, depthScale = null } = {}) {
  const ds = depthScale ?? Math.min(1.6, Math.max(0.6, (0.9 * l) / Math.max(w, 1)));
  const L3 = [];
  if (labels[0]) L3.push({ a: [0, 0, 0], b: [l, 0, 0], text: labels[0] });
  if (labels[1]) L3.push({ a: [l, 0, 0], b: [l, 0, w], text: labels[1], away: [0, h, 0] });
  if (labels[2]) L3.push({ a: [0, 0, 0], b: [0, h, 0], text: labels[2] });
  // cuboid drawn with depth scaled by ds (label still shows true value)
  const cs = [[0, 0], [l, 0], [l, h], [0, h]];
  return prismFig(cs, w, { labels: L3.map((x) => ({ ...x, b: x.b.length === 3 && x.b[2] ? [x.b[0], x.b[1], x.b[2]] : x.b })), W, H, depthScale: ds, nda });
}


/**
 * Vertical dimension line at x from (xFrom, y1) to y2 with end ticks, dotted leaders from the measured points,
 * and the label beside it (side = 1 right, -1 left). Used for perpendicular heights so the label can't be read
 * as a slant length.
 */
function vDim(x, y1, y2, label, side = 1, { from1 = null, from2 = null } = {}) {
  const w = textWidth(label, 14);
  let out = line(x, y1, x, y2, { width: 1.2 }) + line(x - 5, y1, x + 5, y1, { width: 1.2 }) + line(x - 5, y2, x + 5, y2, { width: 1.2 });
  if (from1 !== null) out += line(from1, y1, x, y1, { width: 0.8, dash: '2 3', color: MUTED });
  if (from2 !== null) out += line(from2, y2, x, y2, { width: 0.8, dash: '2 3', color: MUTED });
  return out + text(x + side * (7 + w / 2), (y1 + y2) / 2, label, { size: 14, italic: /^[a-z]$/.test(String(label)) });
}
/* ------------------------------------------------------------------ */
/* Round solids (screen coordinates)                                   */
/* ------------------------------------------------------------------ */

const ell = (cx, cy, rx, ry, half = 'full', opts = {}) => {
  if (half === 'full') return `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="${opts.fill || 'none'}" stroke="currentColor" stroke-width="${opts.width || 2}"${opts.dash ? ` stroke-dasharray="${opts.dash}"` : ''}${opts.fillOpacity ? ` fill-opacity="${opts.fillOpacity}"` : ''}/>`;
  const sweep = half === 'front' ? 0 : 1;
  return path(`M ${r2(cx - rx)} ${r2(cy)} A ${r2(rx)} ${r2(ry)} 0 0 ${sweep} ${r2(cx + rx)} ${r2(cy)}`, { width: opts.width || 2, dash: opts.dash || null, color: opts.color || 'currentColor' });
};

/** Upright cylinder. rLabel/dLabel on the top face, hLabel on the right side. */
export function cylinderFig({ rLabel = null, dLabel = null, hLabel = null, ratio = 1, W = 320, H = 280, nda = true, open = false } = {}) {
  const rx = Math.min(95, 70 / Math.sqrt(Math.max(0.35, ratio))); const ry = rx * 0.3;
  const hh = Math.min(170, Math.max(70, rx * 2 * ratio));
  const cx = W / 2 - 10; const top = (H - hh) / 2; const bot = top + hh;
  let body = path(`M ${cx - rx} ${top} L ${cx - rx} ${bot} A ${rx} ${ry} 0 0 0 ${cx + rx} ${bot} L ${cx + rx} ${top} Z`, { fill: FILL, width: 2 });
  body += ell(cx, bot, rx, ry, 'back', { dash: '5 4', width: 1.3, color: MUTED });
  body += ell(cx, top, rx, ry, 'full', { fill: open ? 'var(--surface, #fff)' : 'var(--d-fill, #e8eefc)', width: 2 });
  if (rLabel) {
    body += dot(cx, top, 2.5) + line(cx, top, cx + rx, top, { width: 1.6 });
    body += htext(cx + rx / 2, top - ry - 10, rLabel, { size: 14, italic: /^[a-z]$/.test(rLabel) });
  }
  if (dLabel) {
    body += line(cx - rx, top, cx + rx, top, { width: 1.6 });
    body += htext(cx, top - ry - 10, dLabel, { size: 14 });
  }
  if (hLabel) body += text(cx + rx + 10 + textWidth(hLabel, 14) / 2, (top + bot) / 2, hLabel, { size: 14 });
  return figure(W, H, body, { nda });
}

/** Cone on its base. Labels: r (base radius), h (vertical height, dashed), l (slant height). */
export function coneFig({ rLabel = null, hLabel = null, lLabel = null, ratio = 1.6, W = 320, H = 290, nda = true, water = null } = {}) {
  const rx = Math.min(90, 160 / ratio); const ry = rx * 0.3;
  const hh = Math.min(200, rx * ratio);
  const cx = W / 2; const bot = (H + hh) / 2 + 10; const apex = [cx, bot - hh];
  let body = path(`M ${cx - rx} ${bot} L ${apex[0]} ${apex[1]} L ${cx + rx} ${bot} A ${rx} ${ry} 0 0 1 ${cx - rx} ${bot} Z`, { fill: FILL, width: 2 });
  body += ell(cx, bot, rx, ry, 'back', { dash: '5 4', width: 1.3, color: MUTED });
  if (water) {
    const f = water; const wy = bot - hh * (1 - f) * 0; void wy;
  }
  if (hLabel) {
    body += line(...apex, cx, bot, { width: 1.4, dash: '5 4' }) + rightMark([cx, bot], apex, [cx + rx, bot], 9);
    body += vDim(cx - rx - 18, apex[1], bot, hLabel, -1, { from1: apex[0], from2: cx - rx });
  }
  if (rLabel) {
    body += dot(cx, bot, 2.5) + line(cx, bot, cx + rx, bot, { width: 1.6 });
    body += htext(cx + rx / 2, bot - 11, rLabel, { size: 14, italic: /^[a-z]$/.test(rLabel) });
  }
  if (lLabel) {
    const m = mid(apex, [cx + rx, bot]);
    body += text(m[0] + 12 + textWidth(lLabel, 14) / 2, m[1] - 4, lLabel, { size: 14, italic: /^[a-z]$/.test(lLabel) });
  }
  return figure(W, H, body, { nda });
}

/** Sphere with a radius line. */
export function sphereFig({ rLabel = null, W = 300, H = 250, nda = true } = {}) {
  const c = [W / 2, H / 2]; const R = 95;
  let body = `<circle cx="${c[0]}" cy="${c[1]}" r="${R}" fill="${FILL}" stroke="currentColor" stroke-width="2"/>`;
  body += ell(c[0], c[1], R, R * 0.28, 'back', { dash: '5 4', width: 1.3, color: MUTED }) + ell(c[0], c[1], R, R * 0.28, 'front', { width: 1.5 });
  if (rLabel) body += dot(...c, 3) + line(...c, c[0] + R, c[1], { width: 1.8 }) + htext(c[0] + R / 2, c[1] - 14, rLabel, { size: 14, italic: /^[a-z]$/.test(rLabel) });
  return figure(W, H, body, { nda });
}

/** Hemisphere, flat face down (bowl upside down) or up. */
export function hemisphereFig({ rLabel = null, W = 320, H = 220, nda = true, flatUp = false } = {}) {
  const R = 110; const cx = W / 2; const base = flatUp ? 60 : H - 50;
  let body;
  if (!flatUp) {
    body = path(`M ${cx - R} ${base} A ${R} ${R} 0 0 1 ${cx + R} ${base} A ${R} ${R * 0.28} 0 0 1 ${cx - R} ${base} Z`, { fill: FILL, width: 2 });
    body += ell(cx, base, R, R * 0.28, 'back', { dash: '5 4', width: 1.3, color: MUTED });
  } else {
    body = path(`M ${cx - R} ${base} A ${R} ${R} 0 0 0 ${cx + R} ${base} Z`, { fill: FILL, width: 2 });
    body += ell(cx, base, R, R * 0.28, 'full', { fill: 'var(--d-fill, #e8eefc)', width: 2 });
  }
  if (rLabel) body += dot(cx, base, 2.5) + line(cx, base, cx + R, base, { width: 1.8 }) + htext(cx + R / 2, base + (flatUp ? -14 : 16), rLabel, { size: 14, italic: /^[a-z]$/.test(rLabel) });
  return figure(W, H, body, { nda });
}

/** Square/rectangle-based pyramid: base a (x) × b (depth), height h (dashed from apex to base centre). */
export function pyramidFig({ aLabel = null, bLabel = null, hLabel = null, ratio = 1, W = 360, H = 280, nda = true } = {}) {
  const a = 1; const b = 1; const h = Math.max(0.8, Math.min(1.8, ratio));
  const base3 = [[0, 0, 0], [a, 0, 0], [a, 0, b * 1.4], [0, 0, b * 1.4]];
  const apex3 = [a / 2, h, b * 0.7];
  const centre3 = [a / 2, 0, b * 0.7];
  const pts = [...base3, apex3].map((p) => proj(p));
  const pl = place(pts, { width: W, height: H, pad: 44 });
  const P = (p3) => pl.map(proj(p3));
  const [A, B, C, D] = base3.map(P); const T = P(apex3); const O = P(centre3);
  let body = polygon([A, B, C, T], { fill: SIDE, fillOpacity: 0.55, width: 2 }) + polygon([A, B, T], { fill: FILL, width: 2 });
  body += line(...A, ...D, { width: 1.3, dash: '5 4', color: MUTED }) + line(...D, ...C, { width: 1.3, dash: '5 4', color: MUTED }) + line(...D, ...T, { width: 1.3, dash: '5 4', color: MUTED });
  if (hLabel) body += line(...T, ...O, { width: 1.4, dash: '5 4' }) + dot(...O, 2.5) + vDim(Math.max(A[0], B[0], C[0], D[0]) + 18, T[1], O[1], hLabel, 1, { from1: T[0], from2: O[0] });
  if (aLabel) body += dimLabel(A, B, aLabel, T, { offset: 12 });
  if (bLabel) body += dimLabel(B, C, bLabel, A, { offset: 12 });
  return figure(W, H, body, { nda });
}

/* ------------------------------------------------------------------ */
/* Isometric cube stacks                                               */
/* ------------------------------------------------------------------ */

/**
 * heights[r][c]: number of cubes stacked at row r (r = 0 is the BACK row) and column c (c = 0 is LEFT).
 * Viewed from the front-right-top. Returns { body, width, height }.
 */
export function isoStack(heights, { s = 26, W = 360, H = 260, arrowFront = false, arrowSide = false } = {}) {
  const rows = heights.length; const cols = heights[0].length;
  const cos30 = Math.cos(Math.PI / 6); const sin30 = 0.5;
  // world: x = column (right), y = depth towards viewer (front = larger y), z = up.
  const Y = (r) => rows - 1 - r; // r = 0 back -> y = rows-1 ... we want front rows drawn last
  const pr = ([x, y, z]) => [(x - y) * cos30 * s, (x + y) * sin30 * s - z * s];
  void Y;
  const cubes = [];
  for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) for (let k = 0; k < heights[r][c]; k += 1) cubes.push([c, r, k]);
  // in this projection the viewer looks from +x,+y (front-right) — draw in increasing x+y+z
  cubes.sort((p, q) => (p[0] + p[1] + p[2]) - (q[0] + q[1] + q[2]) || p[2] - q[2]);
  const allPts = [];
  for (const [x, y, z] of cubes) for (const dx of [0, 1]) for (const dy of [0, 1]) for (const dz of [0, 1]) allPts.push(pr([x + dx, y + dy, z + dz]));
  const xs = allPts.map((p) => p[0]); const ys = allPts.map((p) => p[1]);
  const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const ox = (W - (maxX - minX)) / 2 - minX; const oy = (H - (maxY - minY)) / 2 - minY;
  const T = (p) => [p[0] + ox, p[1] + oy];
  let body = '';
  for (const [x, y, z] of cubes) {
    const q = (dx, dy, dz) => T(pr([x + dx, y + dy, z + dz]));
    body += polygon([q(0, 0, 1), q(1, 0, 1), q(1, 1, 1), q(0, 1, 1)], { fill: 'var(--d-fill, #e8eefc)', width: 1.6 }); // top
    body += polygon([q(1, 0, 0), q(1, 1, 0), q(1, 1, 1), q(1, 0, 1)], { fill: 'var(--d-fill2, #fde9d9)', width: 1.6 }); // right (+x)
    body += polygon([q(0, 1, 0), q(1, 1, 0), q(1, 1, 1), q(0, 1, 1)], { fill: 'var(--surface, #fff)', width: 1.6 }); // front (+y)
  }
  if (arrowFront) {
    const p = T(pr([cols / 2, rows + 1.6, 0])); const p2 = T(pr([cols / 2, rows + 0.4, 0]));
    body += `<line x1="${r2(p[0])}" y1="${r2(p[1])}" x2="${r2(p2[0])}" y2="${r2(p2[1])}" stroke="currentColor" stroke-width="2"/>` + text(p[0] - 10, p[1] + 10, 'Front', { size: 13 });
    const u = sub(p2, p); const l = Math.hypot(...u); const v = [u[0] / l, u[1] / l]; const nn = [-v[1], v[0]];
    body += polygon([p2, add(sub(p2, scale(v, 9)), scale(nn, 4)), sub(sub(p2, scale(v, 9)), scale(nn, 4))], { fill: 'currentColor', width: 1 });
  }
  if (arrowSide) {
    const p = T(pr([cols + 1.6, rows / 2, 0])); const p2 = T(pr([cols + 0.4, rows / 2, 0]));
    body += `<line x1="${r2(p[0])}" y1="${r2(p[1])}" x2="${r2(p2[0])}" y2="${r2(p2[1])}" stroke="currentColor" stroke-width="2"/>` + text(p[0] + 14, p[1] + 10, 'Side', { size: 13 });
    const u = sub(p2, p); const l = Math.hypot(...u); const v = [u[0] / l, u[1] / l]; const nn = [-v[1], v[0]];
    body += polygon([p2, add(sub(p2, scale(v, 9)), scale(nn, 4)), sub(sub(p2, scale(v, 9)), scale(nn, 4))], { fill: 'currentColor', width: 1 });
  }
  return { body, width: W, height: H };
}

void [text, dot];

/**
 * Composite round solids drawn upright: 'coneHemi' (ice cream: hemisphere on top of an inverted cone),
 * 'cylHemi' (cylinder with a hemispherical dome) and 'cylCone' (cylinder with a cone on top).
 */
export function compositeFig(mode, { rLabel = null, hLabel = null, h2Label = null, ratio = 1, ratio2 = 1, W = 320, H = 300, nda = true } = {}) {
  const rx = 70; const ry = rx * 0.3;
  const cx = W / 2 - 10;
  let body = '';
  if (mode === 'coneHemi') {
    const hc = Math.min(170, Math.max(80, rx * ratio));
    const join = (H - hc - rx) / 2 + rx; const apexY = join + hc;
    body += path(`M ${cx - rx} ${join} A ${rx} ${rx} 0 0 1 ${cx + rx} ${join} L ${cx} ${apexY} Z`, { fill: FILL, width: 2 });
    body += ell(cx, join, rx, ry, 'back', { dash: '5 4', width: 1.3, color: MUTED }) + ell(cx, join, rx, ry, 'front', { width: 1.5 });
    if (rLabel) body += dot(cx, join, 2.5) + line(cx, join, cx + rx, join, { width: 1.6 }) + htext(cx + rx / 2, join - 12, rLabel, { size: 14, italic: /^[a-z]$/.test(rLabel) });
    if (hLabel) body += line(cx, join, cx, apexY, { width: 1.3, dash: '5 4' }) + vDim(cx + rx + 18, join, apexY, hLabel, 1, { from1: cx + rx, from2: cx });
    return figure(W, H, body, { nda });
  }
  const hc = Math.min(130, Math.max(60, rx * 2 * ratio));
  const capH = mode === 'cylHemi' ? rx : Math.min(100, Math.max(50, rx * ratio2));
  const top = Math.max(18 + capH, (H - hc - capH - ry - 26) / 2 + capH); const bot = top + hc;
  body += path(`M ${cx - rx} ${top} L ${cx - rx} ${bot} A ${rx} ${ry} 0 0 0 ${cx + rx} ${bot} L ${cx + rx} ${top} Z`, { fill: FILL, width: 2 });
  body += ell(cx, bot, rx, ry, 'back', { dash: '5 4', width: 1.3, color: MUTED });
  if (mode === 'cylHemi') body += path(`M ${cx - rx} ${top} A ${rx} ${rx} 0 0 1 ${cx + rx} ${top} Z`, { fill: FILL, width: 2 });
  else body += path(`M ${cx - rx} ${top} L ${cx} ${top - capH} L ${cx + rx} ${top} Z`, { fill: FILL, width: 2 });
  body += ell(cx, top, rx, ry, 'back', { dash: '5 4', width: 1.3, color: MUTED }) + ell(cx, top, rx, ry, 'front', { width: 1.5 });
  if (rLabel) body += dot(cx, bot, 2.5) + line(cx, bot, cx + rx, bot, { width: 1.6 }) + text(cx + rx / 2, bot + ry + 12, rLabel, { size: 14, italic: /^[a-z]$/.test(rLabel) });
  if (hLabel) body += text(cx + rx + 10 + textWidth(hLabel, 14) / 2, (top + bot) / 2, hLabel, { size: 14 });
  if (h2Label) body += line(cx, top, cx, top - capH, { width: 1.3, dash: '5 4' }) + vDim(cx + rx + 18, top - capH, top - 3, h2Label, 1, { from1: cx });
  return figure(W, H, body, { nda });
}

/* ------------------------------------------------------------------ */
/* General convex polyhedra (oblique view)                             */
/* ------------------------------------------------------------------ */

const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const VIEW = [OBL[0], OBL[1], -1]; // direction from the solid towards the viewer

/**
 * Draw a convex polyhedron. verts: [x,y,z] (y up, z away from the viewer); faces: arrays of vertex indices.
 * Visible faces are filled, hidden edges dashed.
 */
export function polyhedronFig(verts, faces, { W = 320, H = 250, nda = false, frontFill = FILL } = {}) {
  const pl = place(verts.map((v) => proj(v)), { width: W, height: H, pad: 34 });
  const P = verts.map((v) => pl.map(proj(v)));
  const cen = verts.reduce((s, v) => [s[0] + v[0] / verts.length, s[1] + v[1] / verts.length, s[2] + v[2] / verts.length], [0, 0, 0]);
  const vis = faces.map((f) => {
    let n = cross3(sub3(verts[f[1]], verts[f[0]]), sub3(verts[f[2]], verts[f[0]]));
    const fc = f.reduce((s, i) => [s[0] + verts[i][0], s[1] + verts[i][1], s[2] + verts[i][2]], [0, 0, 0]).map((x) => x / f.length);
    if (dot3(n, sub3(fc, cen)) < 0) n = n.map((x) => -x);
    return dot3(n, VIEW) > 1e-9;
  });
  const edges = new Map();
  faces.forEach((f, fi) => f.forEach((a, k) => {
    const b = f[(k + 1) % f.length]; const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (!edges.has(key)) edges.set(key, { a, b, vis: false });
    if (vis[fi]) edges.get(key).vis = true;
  }));
  let body = '';
  faces.forEach((f, fi) => { if (vis[fi]) body += polygon(f.map((i) => P[i]), { fill: fi === 0 ? frontFill : SIDE, fillOpacity: fi === 0 ? 1 : 0.6, width: 0.01 }); });
  for (const e of edges.values()) body += e.vis ? line(...P[e.a], ...P[e.b], { width: 2 }) : line(...P[e.a], ...P[e.b], { width: 1.3, dash: '5 4', color: MUTED });
  return figure(W, H, body, { nda });
}

/** Prism over a regular n-gon (n >= 3), cross-section facing the viewer. */
export function regularPrism(n, { depth = 1.6, rot = 0 } = {}) {
  const ring = Array.from({ length: n }, (_, i) => [Math.cos(Math.PI / 2 + rot + (2 * Math.PI * i) / n), Math.sin(Math.PI / 2 + rot + (2 * Math.PI * i) / n)]);
  const verts = [...ring.map(([x, y]) => [x, y, 0]), ...ring.map(([x, y]) => [x, y, depth])];
  const faces = [ring.map((_, i) => i), ring.map((_, i) => n + i), ...ring.map((_, i) => [i, (i + 1) % n, n + (i + 1) % n, n + i])];
  return { verts, faces };
}
/** Pyramid over a regular n-gon base lying flat (y = 0), apex above the centre. */
export function regularPyramid(n, { height = 1.5, rot = 0.3 } = {}) {
  const ring = Array.from({ length: n }, (_, i) => [Math.cos(rot + (2 * Math.PI * i) / n), 0, 1.3 * Math.sin(rot + (2 * Math.PI * i) / n)]);
  const verts = [...ring, [0, height, 0]];
  const faces = [ring.map((_, i) => i), ...ring.map((_, i) => [i, (i + 1) % n, n])];
  return { verts, faces };
}
/** Cuboid a × b × c as a polyhedron (front face first). */
export function boxSolid(a, b, c) {
  const v = [[0, 0, 0], [a, 0, 0], [a, b, 0], [0, b, 0], [0, 0, c], [a, 0, c], [a, b, c], [0, b, c]];
  return { verts: v, faces: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]] };
}
