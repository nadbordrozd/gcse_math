// SVG diagram primitives. Everything returns markup strings so generators stay pure and testable in Node.
// Colours: strokes use currentColor so diagrams follow the page theme; fills use the CSS variables
// --d-fill / --d-accent (with light fallbacks) so shapes stay readable in light and dark mode.

const r2 = (x) => Math.round(x * 100) / 100;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const FILL = 'var(--d-fill, #e8eefc)';
export const FILL2 = 'var(--d-fill2, #fde9d9)';
export const ACCENT = 'var(--d-accent, #2f5bd3)';
export const ACCENT2 = 'var(--d-accent2, #c2410c)';
export const MUTED = 'var(--d-muted, #9aa3b2)';
export const GRID = 'var(--d-grid, #d6dbe4)';

/** Wrap a diagram. width/height are the viewBox size; it scales responsively up to maxWidth px. */
export function svg(width, height, body, { maxWidth = width, label = 'Diagram' } = {}) {
  return `<svg class="diagram" viewBox="0 0 ${r2(width)} ${r2(height)}" style="max-width:${maxWidth}px" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg" font-family="inherit">${body}</svg>`;
}

const strokeAttrs = ({ color = 'currentColor', width = 2, dash = null, opacity = null } = {}) =>
  `stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash === true ? '6 5' : dash}"` : ''}${opacity !== null ? ` stroke-opacity="${opacity}"` : ''}`;

export function line(x1, y1, x2, y2, opts = {}) {
  return `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" ${strokeAttrs(opts)} stroke-linecap="round"/>`;
}
export function polyline(points, opts = {}) {
  return `<polyline points="${points.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ')}" fill="none" ${strokeAttrs(opts)} stroke-linejoin="round" stroke-linecap="round"/>`;
}
export function polygon(points, { fill = FILL, fillOpacity = 1, ...opts } = {}) {
  return `<polygon points="${points.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ')}" fill="${fill}" fill-opacity="${fillOpacity}" ${strokeAttrs(opts)} stroke-linejoin="round"/>`;
}
export function rect(x, y, w, h, { fill = FILL, ...opts } = {}) {
  return `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="${fill}" ${strokeAttrs(opts)}/>`;
}
export function circle(cx, cy, r, { fill = 'none', ...opts } = {}) {
  return `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${fill}" ${strokeAttrs(opts)}/>`;
}
export function dot(x, y, r = 3.5, color = 'currentColor') {
  return `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r}" fill="${color}"/>`;
}
export function cross(x, y, s = 5, opts = {}) {
  return line(x - s, y - s, x + s, y + s, { width: 2, ...opts }) + line(x - s, y + s, x + s, y - s, { width: 2, ...opts });
}
export function path(d, { fill = 'none', ...opts } = {}) {
  return `<path d="${d}" fill="${fill}" ${strokeAttrs(opts)} stroke-linejoin="round" stroke-linecap="round"/>`;
}
/**
 * Text label. Supports simple markup: x^2 style superscripts via sup option is not parsed — pass
 * unicode (x², cm²) or use tspan via `rich`. italic: true for variable names.
 */
export function text(x, y, str, { anchor = 'middle', size = 15, italic = false, bold = false, color = 'currentColor', baseline = 'central', rotate = 0 } = {}) {
  const tr = rotate ? ` transform="rotate(${rotate} ${r2(x)} ${r2(y)})"` : '';
  return `<text x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" dominant-baseline="${baseline}" font-size="${size}"${italic ? ' font-style="italic"' : ''}${bold ? ' font-weight="700"' : ''} fill="${color}"${tr}>${esc(str)}</text>`;
}
/** Text that may contain one superscript, e.g. rich(…,'x', '2') or 'cm', '²'. Prefer unicode ² ³ where possible. */
export function richText(x, y, parts, opts = {}) {
  const { anchor = 'middle', size = 15, color = 'currentColor' } = opts;
  const spans = parts.map((p) => (typeof p === 'string' ? `<tspan>${esc(p)}</tspan>`
    : `<tspan${p.italic ? ' font-style="italic"' : ''}${p.sup ? ` baseline-shift="super" font-size="${Math.round(size * 0.7)}"` : ''}${p.sub ? ` baseline-shift="sub" font-size="${Math.round(size * 0.7)}"` : ''}>${esc(p.t)}</tspan>`)).join('');
  return `<text x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" dominant-baseline="central" font-size="${size}" fill="${color}">${spans}</text>`;
}

export function notDrawnAccurately(x, y, opts = {}) {
  return text(x, y, 'Not drawn accurately', { size: 12, italic: true, anchor: 'end', color: MUTED, ...opts });
}

/* ------------------------------------------------------------------ */
/* Vector helpers                                                      */
/* ------------------------------------------------------------------ */

export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const scale = (a, k) => [a[0] * k, a[1] * k];
export const len = (a) => Math.hypot(a[0], a[1]);
export const unit = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
export const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const centroid = (pts) => scale(pts.reduce(add, [0, 0]), 1 / pts.length);
export const deg = (rad) => (rad * 180) / Math.PI;
export const rad = (d) => (d * Math.PI) / 180;
/** Point at distance r from c in direction angle (degrees, measured anticlockwise from +x in maths orientation; SVG y is flipped). */
export const polar = (c, r, angleDeg) => [c[0] + r * Math.cos(rad(angleDeg)), c[1] - r * Math.sin(rad(angleDeg))];

/* ------------------------------------------------------------------ */
/* Geometry annotations                                                */
/* ------------------------------------------------------------------ */

/**
 * Arc marking the angle at vertex V between rays V→A and V→B (the smaller angle).
 * label is placed on the bisector at labelR.
 */
export function angleMark(V, A, B, { r = 22, label = null, labelR = null, size = 14, color = 'currentColor', double = false } = {}) {
  const a1 = Math.atan2(A[1] - V[1], A[0] - V[0]);
  const a2 = Math.atan2(B[1] - V[1], B[0] - V[0]);
  let d = a2 - a1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const arcAt = (rr) => {
    const p1 = [V[0] + rr * Math.cos(a1), V[1] + rr * Math.sin(a1)];
    const p2 = [V[0] + rr * Math.cos(a1 + d), V[1] + rr * Math.sin(a1 + d)];
    return path(`M ${r2(p1[0])} ${r2(p1[1])} A ${rr} ${rr} 0 0 ${d > 0 ? 1 : 0} ${r2(p2[0])} ${r2(p2[1])}`, { width: 1.6, color });
  };
  let out = arcAt(r);
  if (double) out += arcAt(r + 5);
  if (label !== null && label !== undefined) {
    const mAng = a1 + d / 2;
    const lr = labelR ?? r + 14 + String(label).length * 2.5;
    out += text(V[0] + lr * Math.cos(mAng), V[1] + lr * Math.sin(mAng), label, { size, color });
  }
  return out;
}
/** Reflex-capable arc: draws the angle going anticlockwise (screen) from ray VA to ray VB. */
export function angleMarkDirected(V, A, B, { r = 22, label = null, labelR = null, size = 14 } = {}) {
  const a1 = Math.atan2(A[1] - V[1], A[0] - V[0]);
  let a2 = Math.atan2(B[1] - V[1], B[0] - V[0]);
  while (a2 < a1) a2 += 2 * Math.PI;
  const d = a2 - a1;
  const p1 = [V[0] + r * Math.cos(a1), V[1] + r * Math.sin(a1)];
  const p2 = [V[0] + r * Math.cos(a2), V[1] + r * Math.sin(a2)];
  let out = path(`M ${r2(p1[0])} ${r2(p1[1])} A ${r} ${r} 0 ${d > Math.PI ? 1 : 0} 1 ${r2(p2[0])} ${r2(p2[1])}`, { width: 1.6 });
  if (label !== null) {
    const m = a1 + d / 2; const lr = labelR ?? r + 16;
    out += text(V[0] + lr * Math.cos(m), V[1] + lr * Math.sin(m), label, { size });
  }
  return out;
}
export function rightAngleMark(V, A, B, s = 11) {
  const u = scale(unit(sub(A, V)), s);
  const w = scale(unit(sub(B, V)), s);
  return polyline([add(V, u), add(add(V, u), w), add(V, w)], { width: 1.6 });
}
/** n small ticks across the middle of segment PQ (equal sides). */
export function equalTicks(P, Q, n = 1, s = 7) {
  const m = mid(P, Q); const u = unit(sub(Q, P)); const nrm = [-u[1], u[0]];
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const c = add(m, scale(u, (i - (n - 1) / 2) * 5));
    out += line(...add(c, scale(nrm, s)), ...add(c, scale(nrm, -s)), { width: 1.6 });
  }
  return out;
}
/** n arrowheads in the middle of PQ pointing from P to Q (parallel lines). */
export function parallelArrows(P, Q, n = 1, s = 7) {
  const m = mid(P, Q); const u = unit(sub(Q, P)); const nrm = [-u[1], u[0]];
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const tip = add(m, scale(u, (i - (n - 1) / 2) * 7 + 4));
    out += polyline([add(add(tip, scale(u, -s)), scale(nrm, s * 0.7)), tip, add(add(tip, scale(u, -s)), scale(nrm, -s * 0.7))], { width: 1.8 });
  }
  return out;
}
/** Arrow from (x1,y1) to (x2,y2). */
export function arrow(x1, y1, x2, y2, { head = 9, ...opts } = {}) {
  const u = unit([x2 - x1, y2 - y1]); const n = [-u[1], u[0]];
  const b = [x2 - u[0] * head, y2 - u[1] * head];
  return line(x1, y1, b[0], b[1], opts) + polygon([[x2, y2], add(b, scale(n, head * 0.45)), add(b, scale(n, -head * 0.45))], { fill: opts.color || 'currentColor', width: 1, color: opts.color || 'currentColor' });
}
/**
 * Label the side PQ, pushed away from `inside` (usually the polygon centroid) by offset px.
 */
export function sideLabel(P, Q, label, inside, { offset = 16, size = 15, italic = false, color = 'currentColor' } = {}) {
  const m = mid(P, Q); const u = unit(sub(Q, P));
  let nrm = [-u[1], u[0]];
  if (inside && (nrm[0] * (inside[0] - m[0]) + nrm[1] * (inside[1] - m[1])) > 0) nrm = scale(nrm, -1);
  const extra = Math.abs(nrm[0]) * String(label).length * 3.2;
  return text(m[0] + nrm[0] * (offset + extra), m[1] + nrm[1] * offset, label, { size, italic, color });
}
/** Label a vertex, pushed away from `inside`. */
export function vertexLabel(P, label, inside, { offset = 15, size = 16 } = {}) {
  const u = unit(sub(P, inside));
  return text(P[0] + u[0] * offset, P[1] + u[1] * offset, label, { size, bold: false });
}

/**
 * Map maths coordinates (y up) into an SVG box with padding, preserving aspect ratio.
 * Returns {map: (p) => [x,y], k: pixels per unit, width, height}.
 */
export function fit(points, { width = 360, height = 260, pad = 36 } = {}) {
  const xs = points.map((p) => p[0]); const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const k = Math.min((width - 2 * pad) / ((maxX - minX) || 1), (height - 2 * pad) / ((maxY - minY) || 1));
  const ox = (width - k * (maxX - minX)) / 2; const oy = (height - k * (maxY - minY)) / 2;
  return { k, width, height, map: ([x, y]) => [ox + (x - minX) * k, height - oy - (y - minY) * k] };
}

/* ------------------------------------------------------------------ */
/* Coordinate plane                                                    */
/* ------------------------------------------------------------------ */

/**
 * Coordinate grid with axes. Returns helpers:
 *  X(x), Y(y), P([x,y]) -> svg coords; body (grid + axes markup); wrap(extra) -> full <svg>;
 *  plot(f, opts) -> path for y=f(x) clipped to the window; point(x,y,label)
 */
export function plane({ xmin = -5, xmax = 5, ymin = -5, ymax = 5, unitPx = 32, xstep = 1, ystep = 1, xlabelEvery = 1, ylabelEvery = 1, grid = true, labels = true, axisNames = ['x', 'y'], pad = 26, minorGrid = false } = {}) {
  const width = (xmax - xmin) * unitPx + 2 * pad;
  const height = (ymax - ymin) * unitPx + 2 * pad;
  const X = (x) => pad + (x - xmin) * unitPx;
  const Y = (y) => height - pad - (y - ymin) * unitPx;
  const P = ([x, y]) => [X(x), Y(y)];
  let body = '';
  const eps = 1e-9;
  if (grid) {
    if (minorGrid) {
      for (let x = xmin; x <= xmax + eps; x += xstep / 5) body += line(X(x), Y(ymin), X(x), Y(ymax), { color: GRID, width: 0.5 });
      for (let y = ymin; y <= ymax + eps; y += ystep / 5) body += line(X(xmin), Y(y), X(xmax), Y(y), { color: GRID, width: 0.5 });
    }
    for (let x = xmin; x <= xmax + eps; x += xstep) body += line(X(x), Y(ymin), X(x), Y(ymax), { color: GRID, width: 1 });
    for (let y = ymin; y <= ymax + eps; y += ystep) body += line(X(xmin), Y(y), X(xmax), Y(y), { color: GRID, width: 1 });
  }
  const ax = Math.min(Math.max(0, ymin), ymax); // y-value where x-axis sits
  const ay = Math.min(Math.max(0, xmin), xmax);
  body += arrow(X(xmin), Y(ax), X(xmax) + 12, Y(ax), { width: 1.6, head: 7 });
  body += arrow(X(ay), Y(ymin), X(ay), Y(ymax) - 12, { width: 1.6, head: 7 });
  if (axisNames) {
    body += text(X(xmax) + 16, Y(ax) - 12, axisNames[0], { italic: true, size: 15 });
    body += text(X(ay) + 12, Y(ymax) - 14, axisNames[1], { italic: true, size: 15 });
  }
  if (labels) {
    const fmt = (v) => String(Math.round(v * 1000) / 1000).replace('-', '−');
    let i = 0;
    for (let x = xmin; x <= xmax + eps; x += xstep, i += 1) {
      if (Math.abs(x - ay) < eps || i % xlabelEvery) continue;
      body += line(X(x), Y(ax) - 3, X(x), Y(ax) + 3, { width: 1.2 });
      body += text(X(x), Y(ax) + 13, fmt(x), { size: 11.5 });
    }
    i = 0;
    for (let y = ymin; y <= ymax + eps; y += ystep, i += 1) {
      if (Math.abs(y - ax) < eps || i % ylabelEvery) continue;
      body += line(X(ay) - 3, Y(y), X(ay) + 3, Y(y), { width: 1.2 });
      body += text(X(ay) - 6, Y(y), fmt(y), { size: 11.5, anchor: 'end' });
    }
    if (xmin <= 0 && xmax >= 0 && ymin <= 0 && ymax >= 0) body += text(X(0) - 6, Y(0) + 12, '0', { size: 11.5, anchor: 'end' });
  }
  const clipId = `clip${Math.round(width * 7 + height * 13 + xmin * 3 + ymax * 5)}`;
  const defs = `<defs><clipPath id="${clipId}"><rect x="${r2(X(xmin))}" y="${r2(Y(ymax))}" width="${r2(X(xmax) - X(xmin))}" height="${r2(Y(ymin) - Y(ymax))}"/></clipPath></defs>`;
  const plot = (f, { from = xmin, to = xmax, samples = 200, ...opts } = {}) => {
    let d = ''; let pen = false;
    for (let i = 0; i <= samples; i += 1) {
      const x = from + ((to - from) * i) / samples;
      const y = f(x);
      if (!Number.isFinite(y) || y > ymax + (ymax - ymin) || y < ymin - (ymax - ymin)) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'} ${r2(X(x))} ${r2(Y(y))} `;
      pen = true;
    }
    return `<g clip-path="url(#${clipId})">${path(d, { color: ACCENT, width: 2.4, ...opts })}</g>`;
  };
  const segment = (p, q, opts = {}) => `<g clip-path="url(#${clipId})">${line(...P(p), ...P(q), { color: ACCENT, width: 2.4, ...opts })}</g>`;
  const point = (x, y, label = null, { color = 'currentColor', dx = 10, dy = -12, marker = 'dot' } = {}) =>
    (marker === 'cross' ? cross(X(x), Y(y), 5, { color }) : dot(X(x), Y(y), 4, color)) + (label ? text(X(x) + dx, Y(y) + dy, label, { size: 14, color }) : '');
  const shape = (pts, opts = {}) => polygon(pts.map(P), { fill: FILL, fillOpacity: 0.85, ...opts });
  const wrap = (extra = '', opts = {}) => svg(width, height, defs + body + extra, { maxWidth: Math.min(width, 520), ...opts });
  return { X, Y, P, body, plot, segment, point, shape, wrap, width, height, clipId };
}

/* ------------------------------------------------------------------ */
/* Number line                                                         */
/* ------------------------------------------------------------------ */

export function numberLine({ min = -5, max = 5, step = 1, labelEvery = 1, width = 440 } = {}, marks = '') {
  const pad = 24; const y = 40;
  const X = (v) => pad + ((v - min) / (max - min)) * (width - 2 * pad);
  let body = line(X(min) - 10, y, X(max) + 10, y, { width: 1.8 });
  let i = 0;
  for (let v = min; v <= max + 1e-9; v += step, i += 1) {
    body += line(X(v), y - 6, X(v), y + 6, { width: 1.4 });
    if (i % labelEvery === 0) body += text(X(v), y + 20, String(Math.round(v * 1000) / 1000).replace('-', '−'), { size: 13 });
  }
  return { X, y, svg: (extra = '') => svg(width, 72, body + (typeof marks === 'string' ? marks : '') + extra, { maxWidth: width }) };
}
/** Inequality marker on a number line: open/closed circle at v, arrow/segment to the side. */
export function inequalityMark(nl, from, to, { closedFrom = true, closedTo = true, arrowLeft = false, arrowRight = false } = {}) {
  const y = nl.y - 16; let out = '';
  const x1 = arrowLeft ? nl.X(from) - 0 : nl.X(from);
  const x2 = arrowRight ? nl.X(to) : nl.X(to);
  if (arrowLeft) out += arrow(x2, y, x1 - 14, y, { color: ACCENT, width: 2.4 });
  else if (arrowRight) out += arrow(x1, y, x2 + 14, y, { color: ACCENT, width: 2.4 });
  else out += line(x1, y, x2, y, { color: ACCENT, width: 2.4 });
  if (!arrowLeft) out += circle(nl.X(from), y, 5, { fill: closedFrom ? ACCENT : 'var(--surface, #fff)', color: ACCENT, width: 2 });
  if (!arrowRight) out += circle(nl.X(to), y, 5, { fill: closedTo ? ACCENT : 'var(--surface, #fff)', color: ACCENT, width: 2 });
  return out;
}
