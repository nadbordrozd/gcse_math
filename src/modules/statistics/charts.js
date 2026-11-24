// Accurate statistical charts for the statistics module. Every chart is built on `frame()`, which maps data
// values to pixels exactly, so students can read values from gridlines. All functions return SVG strings
// (stem-and-leaf diagrams return an HTML table).
import {
  svg, line, rect, text, polyline, path, cross, dot, circle, FILL, FILL2, ACCENT, ACCENT2, MUTED, GRID,
} from '../../svg.js';
import { num } from '../../core.js';

const r2 = (x) => Math.round(x * 100) / 100;
const EPS = 1e-9;
/** Fills that stay readable in light and dark mode (text on top uses currentColor). */
export const FILLS = [
  { fill: FILL, opacity: 1 },
  { fill: FILL2, opacity: 1 },
  { fill: ACCENT, opacity: 0.28 },
  { fill: 'none', opacity: 1 },
  { fill: ACCENT2, opacity: 0.3 },
  { fill: MUTED, opacity: 0.35 },
];
const fillAttr = (f) => `fill="${f.fill}"${f.opacity !== 1 ? ` fill-opacity="${f.opacity}"` : ''}`;
const box = (x, y, w, h, f, extra = '') => `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" ${fillAttr(f)} stroke="currentColor" stroke-width="1.4"${extra}/>`;
const steps = (min, max, step) => {
  const out = [];
  const n = Math.round((max - min) / step);
  for (let i = 0; i <= n; i += 1) out.push(Math.round((min + i * step) * 1e6) / 1e6);
  return out;
};
/** Rough rendered width of a string at a font size (for layout only). */
export const textWidth = (s, size = 13) => String(s).length * size * 0.56;

/* ------------------------------------------------------------------ */
/* Frame: axes, gridlines, scales                                       */
/* ------------------------------------------------------------------ */

/**
 * x: { min, max, step, minor, title, fmt, breakAxis, labelEvery } or { categories: [...], title, grid }
 * y: { min, max, step, minor, title, fmt, breakAxis, hideLabels }
 * minor = number of small squares per major step (0 = none).
 */
export function frame({ width = 440, height = 300, left = null, right = 18, top = 16, bottom = null, x, y, grid = true, yTitleHorizontal = false }) {
  const yfmt = y.fmt || ((v) => num(v));
  const xfmt = x.fmt || ((v) => num(v));
  const yLabels = y.hideLabels ? [] : steps(y.min, y.max, y.step).map(yfmt);
  const maxLab = Math.max(1, ...yLabels.map((s) => textWidth(s, 13)));
  if (left === null) left = 14 + maxLab + (y.title ? 24 : 4) + (y.breakAxis ? 4 : 0);
  if (bottom === null) bottom = x.title ? 50 : 30;
  const x0 = left; const x1 = width - right; const y0 = height - bottom; const y1 = top;
  const xgap = x.breakAxis ? 24 : 0; const ygap = y.breakAxis ? 24 : 0;
  let X;
  if (x.categories) {
    const slot = (x1 - x0) / x.categories.length;
    X = (i) => x0 + slot * (i + 0.5);
    X.slot = slot;
  } else X = (v) => x0 + xgap + ((v - x.min) / (x.max - x.min)) * (x1 - x0 - xgap);
  const Y = (v) => y0 - ygap - ((v - y.min) / (y.max - y.min)) * (y0 - y1 - ygap);
  let g = '';
  const gx0 = x.categories ? x0 : X(x.min); const gy0 = Y(y.min);
  if (grid) {
    if (!x.categories && x.minor) for (const v of steps(x.min, x.max, x.step / x.minor)) g += line(X(v), gy0, X(v), y1, { color: GRID, width: 0.6 });
    if (y.minor) for (const v of steps(y.min, y.max, y.step / y.minor)) g += line(gx0, Y(v), x1, Y(v), { color: GRID, width: 0.6 });
    if (!x.categories) for (const v of steps(x.min, x.max, x.step)) g += line(X(v), gy0, X(v), y1, { color: GRID, width: 1.3 });
    else if (x.grid) x.categories.forEach((_, i) => { g += line(X(i), gy0, X(i), y1, { color: GRID, width: 1.3 }); });
    for (const v of steps(y.min, y.max, y.step)) g += line(gx0, Y(v), x1, Y(v), { color: GRID, width: 1.3 });
  }
  let a = '';
  // x-axis
  if (xgap) {
    a += line(x0, y0, x0 + 5, y0, { width: 1.5 });
    a += polyline([[x0 + 5, y0], [x0 + 9, y0 - 5], [x0 + 14, y0 + 5], [x0 + 18, y0], [x0 + xgap, y0]], { width: 1.5 });
    a += line(x0 + xgap, y0, x1, y0, { width: 1.5 });
    a += text(x0, y0 + 15, '0', { size: 13 });
  } else a += line(x0, y0, x1, y0, { width: 1.5 });
  // y-axis
  if (ygap) {
    a += line(x0, y0, x0, y0 - 5, { width: 1.5 });
    a += polyline([[x0, y0 - 5], [x0 - 5, y0 - 9], [x0 + 5, y0 - 14], [x0, y0 - 18], [x0, y0 - ygap]], { width: 1.5 });
    a += line(x0, y0 - ygap, x0, y1, { width: 1.5 });
    if (!y.hideLabels) a += text(x0 - 7, y0, '0', { size: 13, anchor: 'end' });
  } else a += line(x0, y0, x0, y1, { width: 1.5 });
  // x labels
  if (x.categories) {
    x.categories.forEach((c, i) => {
      const parts = String(c).split('\n');
      parts.forEach((p, k) => { a += text(X(i), y0 + 15 + k * 15, p, { size: 13 }); });
    });
  } else {
    const every = x.labelEvery || 1;
    steps(x.min, x.max, x.step).forEach((v, i) => {
      a += line(X(v), y0, X(v), y0 + 4, { width: 1.2 });
      if (i % every === 0 && !x.hideLabels) a += text(X(v), y0 + 15, xfmt(v), { size: 13 });
    });
  }
  if (!y.hideLabels) {
    const every = y.labelEvery || 1;
    steps(y.min, y.max, y.step).forEach((v, i) => {
      a += line(x0 - 4, Y(v), x0, Y(v), { width: 1.2 });
      if (i % every === 0) a += text(x0 - 7, Y(v), yfmt(v), { size: 13, anchor: 'end' });
    });
  }
  if (x.title) a += text((x0 + x1) / 2, y0 + (x.categories && x.categories.some((c) => String(c).includes('\n')) ? 46 : 36), x.title, { size: 14 });
  if (y.title) {
    a += yTitleHorizontal ? text(4, y1 - 4, y.title, { size: 14, anchor: 'start' })
      : text(13, (y0 + y1) / 2, y.title, { size: 14, rotate: -90 });
  }
  const clipId = `c${Math.round(x0 * 7 + x1 * 3 + y0 * 11 + y1 * 13 + (x.max || 0) * 17 + (y.max || 0) * 19)}`;
  const clip = (inner) => `<defs><clipPath id="${clipId}"><rect x="${r2(x0)}" y="${r2(y1)}" width="${r2(x1 - x0)}" height="${r2(y0 - y1)}"/></clipPath></defs><g clip-path="url(#${clipId})">${inner}</g>`;
  const wrap = (content = '', extra = '') => svg(width, height, g + content + a + extra, { maxWidth: Math.min(width, 520), label: 'Chart' });
  return { X, Y, x0, x1, y0, y1, grid: g, axes: a, wrap, clip, width, height };
}

/** Horizontal legend. items: [{label, fill?: FILLS entry, kind: 'box'|'line'|'dash'|'cross'}] */
export function legend(items, x, y, { size = 13 } = {}) {
  let out = text(x, y, 'Key:', { size, anchor: 'start', bold: true });
  let cx = x + 38;
  for (const it of items) {
    if (it.kind === 'line' || it.kind === 'dash') out += line(cx, y, cx + 24, y, { color: it.color || 'currentColor', width: 2.2, dash: it.kind === 'dash' ? '5 4' : null });
    else if (it.kind === 'cross') out += cross(cx + 12, y, 4.5, { color: it.color || 'currentColor' });
    else out += box(cx + 2, y - 8, 18, 16, it.fill || FILLS[0]);
    out += text(cx + 30, y, it.label, { size, anchor: 'start' });
    cx += 42 + textWidth(it.label, size);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Bar charts (single, dual, composite) and vertical line charts        */
/* ------------------------------------------------------------------ */

/**
 * categories: labels; series: [{name, values}]; stacked: composite bars; style: 'bar' | 'line' (vertical line chart).
 * y: {max, step, minor, title}.
 */
export function barChart({ categories, series, stacked = false, style = 'bar', y, xTitle = '', width = 440, height = 300, gap = 0.45 }) {
  const multi = series.length > 1;
  const f = frame({ width, height, top: multi ? 44 : 16, x: { categories, title: xTitle }, y: { min: 0, ...y } });
  let body = '';
  const slot = f.X.slot;
  categories.forEach((_, i) => {
    if (style === 'line') {
      body += line(f.X(i), f.Y(0), f.X(i), f.Y(series[0].values[i]), { width: 3.5, color: ACCENT });
      return;
    }
    if (stacked) {
      const bw = slot * (1 - gap);
      let base = 0;
      series.forEach((s, k) => {
        const v = s.values[i];
        if (v > 0) body += box(f.X(i) - bw / 2, f.Y(base + v), bw, f.Y(base) - f.Y(base + v), FILLS[k % FILLS.length]);
        base += v;
      });
    } else {
      const total = slot * (1 - gap) * (multi ? 1.5 : 1);
      const bw = total / series.length;
      series.forEach((s, k) => {
        const v = s.values[i];
        const bx = f.X(i) - total / 2 + k * bw;
        if (v > 0) body += box(bx, f.Y(v), bw, f.Y(0) - f.Y(v), FILLS[k % FILLS.length]);
      });
    }
  });
  const key = multi ? legend(series.map((s, k) => ({ label: s.name, fill: FILLS[k % FILLS.length] })), f.x0, 18) : '';
  return f.wrap(body, key);
}

/* ------------------------------------------------------------------ */
/* Pictograms                                                           */
/* ------------------------------------------------------------------ */

function symbolAt(x, y, s, frac, kind) {
  // x,y = top-left of a symbol of size s; frac in (0,1] of the symbol shown.
  if (kind === 'square') {
    const h = s / 2;
    const quarters = Math.round(frac * 4);
    // order: top-left, bottom-left, top-right, bottom-right (a half is the left half)
    const cells = [[0, 0], [0, 1], [1, 0], [1, 1]].slice(0, quarters);
    let out = '';
    for (const [cx, cy] of cells) out += rect(x + cx * h, y + cy * h, h, h, { fill: FILL, width: 1.4 });
    return out;
  }
  const c = [x + s / 2, y + s / 2]; const r = s / 2;
  if (frac >= 1 - EPS) return circle(c[0], c[1], r, { fill: FILL, width: 1.4 });
  const a1 = frac * 2 * Math.PI;
  const p = (a) => [c[0] + r * Math.sin(a), c[1] - r * Math.cos(a)];
  const [ex, ey] = p(a1);
  return path(`M ${r2(c[0])} ${r2(c[1])} L ${r2(c[0])} ${r2(c[1] - r)} A ${r2(r)} ${r2(r)} 0 ${frac > 0.5 ? 1 : 0} 1 ${r2(ex)} ${r2(ey)} Z`, { fill: FILL, width: 1.4 });
}

/**
 * rows: [{label, value}] ; per: value of one whole symbol ; symbol: 'circle' | 'square'.
 * Partial symbols must be whole quarters of `per`. A row may have value null (left blank).
 */
export function pictogram({ rows, per, symbol = 'circle', unit = '', keyText = null }) {
  const s = 28; const gapS = 8; const rowH = 42;
  const lw = Math.max(70, ...rows.map((r) => textWidth(r.label, 14) + 24));
  const maxSym = Math.max(4, ...rows.map((r) => (r.value == null ? 0 : Math.ceil(r.value / per - EPS))));
  const width = Math.max(300, lw + maxSym * (s + gapS) + 24);
  const top = 46;
  const height = top + rows.length * rowH + 8;
  let out = text(8, 20, 'Key:', { size: 14, anchor: 'start', bold: true });
  out += symbolAt(48, 6, s, 1, symbol);
  out += text(48 + s + 10, 20, keyText ?? `represents ${num(per)}${unit ? ` ${unit}` : ''}`, { size: 14, anchor: 'start' });
  out += rect(4, top, width - 8, rows.length * rowH, { fill: 'none', width: 1.4 });
  out += line(4 + lw, top, 4 + lw, top + rows.length * rowH, { width: 1.4 });
  rows.forEach((r, i) => {
    const yy = top + i * rowH;
    if (i) out += line(4, yy, width - 4, yy, { width: 1.2 });
    out += text(14, yy + rowH / 2, r.label, { size: 14, anchor: 'start' });
    if (r.value == null) return;
    let left = r.value / per;
    let k = 0;
    while (left > EPS) {
      const fr = Math.min(1, left);
      out += symbolAt(4 + lw + 12 + k * (s + gapS), yy + (rowH - s) / 2, s, fr, symbol);
      left -= fr; k += 1;
    }
  });
  return svg(width, height, out, { maxWidth: Math.min(width, 480), label: 'Pictogram' });
}

/* ------------------------------------------------------------------ */
/* Tally chart                                                          */
/* ------------------------------------------------------------------ */

export function tallyChart({ rows, headers = ['Item', 'Tally', 'Frequency'], showFreq = false }) {
  const lw = Math.max(90, ...rows.map((r) => textWidth(r.label, 14) + 24), textWidth(headers[0], 14) + 24);
  const maxCount = Math.max(...rows.map((r) => r.count));
  const tw = Math.max(110, Math.ceil(maxCount / 5) * 34 + 20);
  const fw = 96; const rowH = 34; const top = 4;
  const width = lw + tw + fw + 8; const height = top + (rows.length + 1) * rowH + 4;
  let out = rect(4, top, width - 8, (rows.length + 1) * rowH, { fill: 'none', width: 1.4 });
  out += line(4 + lw, top, 4 + lw, top + (rows.length + 1) * rowH, { width: 1.4 });
  out += line(4 + lw + tw, top, 4 + lw + tw, top + (rows.length + 1) * rowH, { width: 1.4 });
  out += text(4 + lw / 2, top + rowH / 2, headers[0], { size: 14, bold: true });
  out += text(4 + lw + tw / 2, top + rowH / 2, headers[1], { size: 14, bold: true });
  out += text(4 + lw + tw + fw / 2, top + rowH / 2, headers[2], { size: 14, bold: true });
  rows.forEach((r, i) => {
    const yy = top + (i + 1) * rowH;
    out += line(4, yy, width - 4, yy, { width: 1.2 });
    out += text(14, yy + rowH / 2, r.label, { size: 14, anchor: 'start' });
    let x = 4 + lw + 14;
    for (let g = 0; g < r.count; g += 5) {
      const inGroup = Math.min(5, r.count - g);
      const strokes = Math.min(4, inGroup);
      for (let k = 0; k < strokes; k += 1) out += line(x + k * 6, yy + 8, x + k * 6, yy + rowH - 8, { width: 1.8 });
      if (inGroup === 5) out += line(x - 4, yy + rowH - 10, x + 22, yy + 10, { width: 1.8 });
      x += 34;
    }
    if (showFreq || r.showFreq) out += text(4 + lw + tw + fw / 2, yy + rowH / 2, num(r.count), { size: 14 });
  });
  return svg(width, height, out, { maxWidth: Math.min(width, 460), label: 'Tally chart' });
}

/* ------------------------------------------------------------------ */
/* Pie chart                                                            */
/* ------------------------------------------------------------------ */

/**
 * sectors: [{label, angle, angleLabel?}] drawn clockwise from 12 o'clock. angleLabel: text shown in the angle
 * arc at the centre (e.g. '72°' or 'x'). Angles must sum to 360.
 */
export function pieChart({ sectors, r = 104, title = null, notAccurate = false }) {
  const width = 400; const top = title ? 34 : 18;
  const cx = width / 2; const cy = top + r + 22; const height = cy + r + 26;
  const P = (deg, rr) => [cx + rr * Math.sin((deg * Math.PI) / 180), cy - rr * Math.cos((deg * Math.PI) / 180)];
  let out = title ? text(cx, 16, title, { size: 15, bold: true }) : '';
  let a0 = 0;
  let marks = '';
  sectors.forEach((s, i) => {
    const a1 = a0 + s.angle;
    const [sx, sy] = P(a0, r); const [ex, ey] = P(a1, r);
    const f = FILLS[i % FILLS.length];
    if (s.angle >= 360 - EPS) out += `<circle cx="${cx}" cy="${cy}" r="${r}" ${fillAttr(f)} stroke="currentColor" stroke-width="1.6"/>`;
    else out += `<path d="M ${r2(cx)} ${r2(cy)} L ${r2(sx)} ${r2(sy)} A ${r} ${r} 0 ${s.angle > 180 ? 1 : 0} 1 ${r2(ex)} ${r2(ey)} Z" ${fillAttr(f)} stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`;
    const mid = a0 + s.angle / 2;
    if (s.angleLabel) {
      const ar = s.angle < 40 ? 34 : 24;
      const [px, py] = P(a0, ar); const [qx, qy] = P(a1, ar);
      marks += path(`M ${r2(px)} ${r2(py)} A ${ar} ${ar} 0 ${s.angle > 180 ? 1 : 0} 1 ${r2(qx)} ${r2(qy)}`, { width: 1.4 });
      const lr = s.angle < 40 ? 52 : s.angle < 70 ? 44 : 40;
      const [lx, ly] = P(mid, lr);
      marks += text(lx, ly, s.angleLabel, { size: 13 });
    }
    if (s.label) {
      if (s.angle >= 50 || (s.angle >= 34 && !s.angleLabel)) {
        // Near-horizontal bisectors: wide names would hit the angle label or the circle, so keep them at a
        // moderate radius and move them vertically off the bisector instead.
        const side = Math.abs(Math.sin((mid * Math.PI) / 180));
        const half = textWidth(s.label, 14) / 2;
        let [lx, ly] = P(mid, s.angleLabel ? Math.min(r * 0.7, r - side * half - 8) : r * 0.6);
        if (s.angleLabel && side > 0.5) {
          const down = Math.cos((mid * Math.PI) / 180) < 0.35;
          [lx, ly] = P(mid, Math.min(r * 0.62, r - half - 10));
          ly += (down ? 1 : -1) * 18 * side;
        }
        marks += text(lx, ly, s.label, { size: 14 });
      } else {
        const [lx, ly] = P(mid, r + 14);
        const sn = Math.sin((mid * Math.PI) / 180);
        marks += text(lx + (sn > 0.2 ? 2 : sn < -0.2 ? -2 : 0), ly, s.label, { size: 14, anchor: sn > 0.2 ? 'start' : sn < -0.2 ? 'end' : 'middle' });
      }
    }
    a0 = a1;
  });
  if (notAccurate) marks += text(width - 6, height - 10, 'Not drawn accurately', { size: 12, italic: true, anchor: 'end', color: MUTED });
  return svg(width, height, out + marks, { maxWidth: 380, label: 'Pie chart' });
}

/* ------------------------------------------------------------------ */
/* Line graphs / time series                                            */
/* ------------------------------------------------------------------ */

/** labels: x categories; series: [{name, values, dash?}]. */
export function lineGraph({ labels, series, y, xTitle = '', width = 460, height = 300 }) {
  const multi = series.length > 1;
  const f = frame({ width, height, top: multi ? 44 : 16, x: { categories: labels, title: xTitle, grid: true }, y });
  let body = '';
  const colors = [ACCENT, ACCENT2];
  series.forEach((s, k) => {
    const pts = s.values.map((v, i) => [f.X(i), f.Y(v)]);
    body += polyline(pts, { color: colors[k], width: 2.2, dash: k ? '6 4' : null });
    body += pts.map(([px, py]) => (k ? dot(px, py, 3.6, colors[k]) : cross(px, py, 4.5, { color: colors[k] }))).join('');
  });
  const key = multi ? legend(series.map((s, k) => ({ label: s.name, kind: k ? 'dash' : 'line', color: colors[k] })), f.x0, 18) : '';
  return f.wrap(body, key);
}

/* ------------------------------------------------------------------ */
/* Scatter graphs                                                       */
/* ------------------------------------------------------------------ */

/** points: [[x,y]]; line: [[x1,y1],[x2,y2]] optional line of best fit; highlight: index of a point to circle. */
export function scatterGraph({ points, x, y, line: lobf = null, width = 440, height = 320 }) {
  const f = frame({ width, height, x, y });
  let body = '';
  if (lobf) body += f.clip(line(f.X(lobf[0][0]), f.Y(lobf[0][1]), f.X(lobf[1][0]), f.Y(lobf[1][1]), { color: ACCENT, width: 2 }));
  for (const [px, py] of points) body += cross(f.X(px), f.Y(py), 4.2, { width: 1.8 });
  return f.wrap(body);
}

/** Four small unlabelled scatter graphs A–D in a 2×2 grid. graphs: arrays of [x,y] in 0..10. */
export function scatterQuartet(graphs, names = ['A', 'B', 'C', 'D']) {
  const w = 200; const h = 160; let out = '';
  graphs.forEach((pts, i) => {
    const ox = (i % 2) * (w + 20); const oy = Math.floor(i / 2) * (h + 16);
    const X = (v) => ox + 30 + (v / 10) * (w - 44); const Y = (v) => oy + h - 22 - (v / 10) * (h - 44);
    out += text(ox + 10, oy + 14, names[i], { size: 16, bold: true, anchor: 'start' });
    out += line(X(0), Y(0), X(10.4), Y(0), { width: 1.5 }) + line(X(0), Y(0), X(0), Y(10.4), { width: 1.5 });
    out += text(X(5), Y(0) + 13, 'x', { size: 13, italic: true }) + text(X(0) - 10, Y(5), 'y', { size: 13, italic: true });
    for (const [px, py] of pts) out += cross(X(px), Y(py), 3.4, { width: 1.6 });
  });
  return svg(2 * w + 20, 2 * h + 16, out, { maxWidth: 440, label: 'Four scatter graphs' });
}

/* ------------------------------------------------------------------ */
/* Frequency polygons                                                   */
/* ------------------------------------------------------------------ */

/** series: [{name, points: [[midpoint, freq]]}] */
export function frequencyPolygon({ series, x, y, width = 440, height = 300 }) {
  const multi = series.length > 1;
  const f = frame({ width, height, top: multi ? 44 : 16, x, y: { min: 0, ...y } });
  let body = '';
  const colors = [ACCENT, ACCENT2];
  series.forEach((s, k) => {
    const pts = s.points.map(([px, py]) => [f.X(px), f.Y(py)]);
    body += polyline(pts, { color: colors[k], width: 2.2, dash: k ? '6 4' : null });
    body += pts.map(([px, py]) => dot(px, py, 3.4, colors[k])).join('');
  });
  const key = multi ? legend(series.map((s, k) => ({ label: s.name, kind: k ? 'dash' : 'line', color: colors[k] })), f.x0, 18) : '';
  return f.wrap(body, key);
}

/* ------------------------------------------------------------------ */
/* Cumulative frequency                                                 */
/* ------------------------------------------------------------------ */

/** Monotone cubic interpolation (Fritsch–Carlson) through sorted points. Returns {at(x), inverse(y)}. */
export function monotoneSpline(pts) {
  const n = pts.length;
  const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
  const dx = []; const m = [];
  for (let k = 0; k < n - 1; k += 1) { dx.push(xs[k + 1] - xs[k]); m.push((ys[k + 1] - ys[k]) / dx[k]); }
  const t = new Array(n);
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let k = 1; k < n - 1; k += 1) t[k] = m[k - 1] * m[k] <= 0 ? 0 : (m[k - 1] + m[k]) / 2;
  for (let k = 0; k < n - 1; k += 1) {
    if (Math.abs(m[k]) < EPS) { t[k] = 0; t[k + 1] = 0; continue; }
    const a = t[k] / m[k]; const b = t[k + 1] / m[k]; const s = a * a + b * b;
    if (s > 9) { const tau = 3 / Math.sqrt(s); t[k] = tau * a * m[k]; t[k + 1] = tau * b * m[k]; }
  }
  const at = (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let k = 0; while (x > xs[k + 1]) k += 1;
    const h = dx[k]; const u = (x - xs[k]) / h;
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1; const h10 = u ** 3 - 2 * u ** 2 + u; const h01 = -2 * u ** 3 + 3 * u ** 2; const h11 = u ** 3 - u ** 2;
    return h00 * ys[k] + h10 * h * t[k] + h01 * ys[k + 1] + h11 * h * t[k + 1];
  };
  const inverse = (yv) => {
    let lo = xs[0]; let hi = xs[n - 1];
    for (let i = 0; i < 60; i += 1) { const md = (lo + hi) / 2; if (at(md) < yv) lo = md; else hi = md; }
    return (lo + hi) / 2;
  };
  return { at, inverse };
}

/** points: [[upperBound, cf]] including the starting [lowestBound, 0]. guides: [{y}|{x}] dashed reading lines. */
export function cumulativeFrequencyGraph({ points, x, y, width = 440, height = 330, showPoints = true }) {
  const f = frame({ width, height, x, y: { min: 0, ...y } });
  const sp = monotoneSpline(points);
  const a = points[0][0]; const b = points[points.length - 1][0];
  let d = '';
  const N = 120;
  for (let i = 0; i <= N; i += 1) {
    const xv = a + ((b - a) * i) / N;
    d += `${i ? 'L' : 'M'} ${r2(f.X(xv))} ${r2(f.Y(sp.at(xv)))} `;
  }
  let body = path(d, { color: ACCENT, width: 2.2 });
  if (showPoints) body += points.map(([px, py]) => cross(f.X(px), f.Y(py), 3.8, { width: 1.6 })).join('');
  return { svg: f.wrap(body), spline: sp };
}

/* ------------------------------------------------------------------ */
/* Box plots                                                            */
/* ------------------------------------------------------------------ */

/** plots: [{label, min, q1, med, q3, max}]; axis: {min, max, step, minor, title}. */
export function boxPlot({ plots, axis, width = 460 }) {
  const lw = Math.max(16, ...plots.map((p) => (p.label ? textWidth(p.label, 14) + 16 : 16)));
  const rowH = 62; const top = 10;
  const x0 = lw + 6; const x1 = width - 18;
  const plotH = plots.length * rowH;
  const yAxis = top + plotH + 6;
  const height = yAxis + (axis.title ? 50 : 30);
  const X = (v) => x0 + ((v - axis.min) / (axis.max - axis.min)) * (x1 - x0);
  let g = '';
  if (axis.minor) for (const v of steps(axis.min, axis.max, axis.step / axis.minor)) g += line(X(v), top, X(v), yAxis, { color: GRID, width: 0.6 });
  for (const v of steps(axis.min, axis.max, axis.step)) g += line(X(v), top, X(v), yAxis, { color: GRID, width: 1.3 });
  for (let k = 0; k <= plots.length * 4; k += 1) g += line(x0, top + (k * plotH) / (plots.length * 4), x1, top + (k * plotH) / (plots.length * 4), { color: GRID, width: 0.6 });
  let b = '';
  plots.forEach((p, i) => {
    const cy = top + i * rowH + rowH / 2; const hh = 15;
    b += line(X(p.min), cy, X(p.q1), cy, { width: 2 }) + line(X(p.q3), cy, X(p.max), cy, { width: 2 });
    b += line(X(p.min), cy - 9, X(p.min), cy + 9, { width: 2 }) + line(X(p.max), cy - 9, X(p.max), cy + 9, { width: 2 });
    b += rect(X(p.q1), cy - hh, X(p.q3) - X(p.q1), 2 * hh, { fill: FILL, width: 2 });
    b += line(X(p.med), cy - hh, X(p.med), cy + hh, { width: 2.6 });
    if (p.label) b += text(6, cy, p.label, { size: 14, anchor: 'start' });
  });
  let a = line(x0, yAxis, x1, yAxis, { width: 1.5 });
  for (const v of steps(axis.min, axis.max, axis.step)) a += line(X(v), yAxis, X(v), yAxis + 5, { width: 1.2 }) + text(X(v), yAxis + 16, (axis.fmt || num)(v), { size: 13 });
  if (axis.title) a += text((x0 + x1) / 2, yAxis + 37, axis.title, { size: 14 });
  return svg(width, height, g + b + a, { maxWidth: Math.min(width, 520), label: 'Box plot' });
}

/* ------------------------------------------------------------------ */
/* Histograms                                                           */
/* ------------------------------------------------------------------ */

/** classes: [{a, b, f, hidden?}] bars of height f/(b−a). x, y as frame(). */
export function histogram({ classes, x, y, width = 440, height = 320 }) {
  const f = frame({ width, height, x, y: { min: 0, title: 'Frequency density', ...y } });
  let body = '';
  for (const c of classes) {
    if (c.hidden) continue;
    const fd = c.f / (c.b - c.a);
    body += box(f.X(c.a), f.Y(fd), f.X(c.b) - f.X(c.a), f.Y(0) - f.Y(fd), FILLS[0]);
  }
  return f.wrap(body);
}

/* ------------------------------------------------------------------ */
/* Stem-and-leaf (HTML)                                                 */
/* ------------------------------------------------------------------ */

const leafCell = (leaves) => leaves.map((l) => `<span class="leaf">${l}</span>`).join('&ensp;');
/** rows: [{stem, leaves}] (leaves ascending). keyText e.g. '3 | 4 represents 34 kg'. */
export function stemLeaf({ rows, keyText }) {
  const body = rows.map((r) => `<tr><td style="text-align:right;padding-right:10px;border-right:2px solid currentColor">${r.stem}</td><td style="text-align:left;padding-left:10px;min-width:140px">${leafCell(r.leaves)}</td></tr>`).join('');
  return `<div class="stemleaf"><table class="qtable stem-leaf">${body}</table><div style="margin-top:6px"><b>Key:</b> ${keyText}</div></div>`;
}
/** Back-to-back: rows [{stem, left: leaves (ascending, shown reversed), right}]. */
export function stemLeafBack({ rows, leftName, rightName, keyText }) {
  const head = `<tr><th style="text-align:right">${leftName}</th><th></th><th style="text-align:left">${rightName}</th></tr>`;
  const body = rows.map((r) => `<tr><td style="text-align:right;padding-right:10px;min-width:110px">${leafCell([...r.left].reverse())}</td><td style="text-align:center;border-left:2px solid currentColor;border-right:2px solid currentColor;padding:0 10px">${r.stem}</td><td style="text-align:left;padding-left:10px;min-width:110px">${leafCell(r.right)}</td></tr>`).join('');
  return `<div class="stemleaf"><table class="qtable stem-leaf">${head}${body}</table><div style="margin-top:6px"><b>Key:</b> ${keyText}</div></div>`;
}
