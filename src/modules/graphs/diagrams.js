// Diagram helpers for the graphs module: accurate charts with independent x/y scales (real-life graphs),
// sketch panels (A–D graph choices) and pattern sequences. All clipping is done numerically (no clipPath ids),
// so several charts can share one SVG.
import { svg, line, text, dot, path, polygon, arrow, rect, GRID, ACCENT, FILL, MUTED } from '../../svg.js';

const r2 = (x) => Math.round(x * 100) / 100;
export const fmtNum = (v) => String(Math.round(v * 1000) / 1000).replace('-', '−');

/** Text with a background-coloured outline so it stays readable on top of grid lines and curves. */
export function halo(x, y, str, opts = {}) {
  const t = text(x, y, str, opts);
  return t.replace('<text ', '<text stroke="var(--surface, #fff)" stroke-width="4" stroke-linejoin="round" paint-order="stroke" ');
}

/**
 * Label for the straight line y = m x + k (or x = k when m is null), placed near the right-hand end of the visible
 * part of the line and pushed off the line to one side.
 */
export function lineLabel(c, m, k, str, { color = 'currentColor', at = 0.85, side = 1, size = 14 } = {}) {
  const { xmin, xmax, ymin, ymax } = c.box;
  let p; let q;
  if (m === null) { p = [k, ymin]; q = [k, ymax]; } else {
    const s = clipSeg([xmin - 1, m * (xmin - 1) + k], [xmax + 1, m * (xmax + 1) + k], c.box);
    if (!s) return '';
    [p, q] = s;
  }
  const A = [c.X(p[0]), c.Y(p[1])]; const B = [c.X(q[0]), c.Y(q[1])];
  const len = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
  let n0 = [-(B[1] - A[1]) / len, (B[0] - A[0]) / len];
  if (n0[1] < 0) n0 = [-n0[0], -n0[1]];
  const w = String(str).length * size * 0.55; const h = size;
  const cands = [];
  const ats = [at, 1 - at, 0.7, 0.3, 0.5, 0.9, 0.1];
  for (const t of ats) for (const sd of [side, -side]) {
    const P0 = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
    const n = [n0[0] * sd, n0[1] * sd];
    const dd = (w / 2) * Math.abs(n[0]) + (h / 2) * Math.abs(n[1]) + 6;
    cands.push([P0[0] + n[0] * dd, P0[1] + n[1] * dd]);
  }
  const best = c.place(cands, w, h);
  return halo(best[0], best[1], str, { size, color });
}

/** Clip segment p-q (data coords) to the box. Returns [p', q'] or null. (Liang–Barsky) */
export function clipSeg(p, q, box) {
  const [x1, y1] = p; const dx = q[0] - x1; const dy = q[1] - y1;
  let t0 = 0; let t1 = 1;
  const checks = [[-dx, x1 - box.xmin], [dx, box.xmax - x1], [-dy, y1 - box.ymin], [dy, box.ymax - y1]];
  for (const [pp, qq] of checks) {
    if (pp === 0) { if (qq < 0) return null; continue; }
    const t = qq / pp;
    if (pp < 0) { if (t > t1) return null; if (t > t0) t0 = t; } else { if (t < t0) return null; if (t < t1) t1 = t; }
  }
  return [[x1 + t0 * dx, y1 + t0 * dy], [x1 + t1 * dx, y1 + t1 * dy]];
}

/**
 * Accurate graph with its own x and y scales.
 * Options: xmin,xmax,ymin,ymax; xstep/ystep = labelled major gridline spacing; xminor/yminor = minor subdivisions
 * per major square; xlabelEvery/ylabelEvery; w,h = plot size in px; xtitle/ytitle; zeroAxes: axes through the origin
 * with arrows and x/y names (coordinate-grid style) instead of axes along the bottom/left edges; ox, oy offsets.
 */
export function chart(o = {}) {
  const {
    xmin = 0, xmax = 10, ymin = 0, ymax = 10, xstep = 1, ystep = 1, xminor = 1, yminor = 1,
    xlabelEvery = 1, ylabelEvery = 1, w = 340, h = 240, xtitle = '', ytitle = '', fmtX = fmtNum, fmtY = fmtNum,
    zeroAxes = false, ox = 0, oy = 0, labels = true, grid = true, fontSize = 13, axisNames = ['x', 'y'], xlabelIf = null, ylabelIf = null,
    padL: padLIn = null, padB: padBIn = null, padT: padTIn = null, padR: padRIn = null,
  } = o;
  const eps = 1e-9;
  const nMajX = Math.round((xmax - xmin) / xstep);
  const nMajY = Math.round((ymax - ymin) / ystep);
  const yLabels = [];
  for (let j = 0; j <= nMajY; j += 1) if (j % ylabelEvery === 0) yLabels.push(fmtY(ymin + j * ystep));
  const ylabW = labels ? Math.max(...yLabels.map((s) => s.length), 1) * fontSize * 0.6 + 10 : 6;
  const padL = padLIn ?? (zeroAxes ? Math.max(18, (xmin < 0 ? 10 : ylabW + 4)) : ylabW + 6);
  const padT = padTIn ?? (ytitle && !zeroAxes ? 30 : zeroAxes ? 26 : 14);
  const padB = padBIn ?? (zeroAxes ? (ymin < 0 ? 16 : 30) : xtitle ? 50 : 30);
  const padR = padRIn ?? (zeroAxes ? 26 : 18);
  const width = padL + w + padR;
  const height = padT + h + padB;
  const X = (x) => ox + padL + ((x - xmin) / (xmax - xmin)) * w;
  const Y = (y) => oy + padT + h - ((y - ymin) / (ymax - ymin)) * h;
  const box = { xmin, xmax, ymin, ymax };
  // Pixel points occupied by axes, tick labels, curves and labels: used to place labels where they fit.
  const drawn = [];
  const markSeg = (a, b, step = 5) => {
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let i = 0; i <= n; i += 1) drawn.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
  };
  const markBox = (cx, cy, bw, bh) => { for (let i = 0; i <= 4; i += 1) for (let j = 0; j <= 2; j += 1) drawn.push([cx - bw / 2 + (bw * i) / 4, cy - bh / 2 + (bh * j) / 2]); };
  let body = '';
  if (grid) {
    const nx = nMajX * xminor; const ny = nMajY * yminor;
    let minor = ''; let major = '';
    for (let i = 0; i <= nx; i += 1) {
      const x = xmin + (i * xstep) / xminor;
      const l = line(X(x), Y(ymin), X(x), Y(ymax), { color: GRID, width: i % xminor === 0 ? 1.1 : 0.5 });
      if (i % xminor === 0) major += l; else minor += l;
    }
    for (let i = 0; i <= ny; i += 1) {
      const y = ymin + (i * ystep) / yminor;
      const l = line(X(xmin), Y(y), X(xmax), Y(y), { color: GRID, width: i % yminor === 0 ? 1.1 : 0.5 });
      if (i % yminor === 0) major += l; else minor += l;
    }
    body += minor + major;
  }
  const ax = zeroAxes ? Math.min(Math.max(0, ymin), ymax) : ymin; // y where the x-axis sits
  const ay = zeroAxes ? Math.min(Math.max(0, xmin), xmax) : xmin; // x where the y-axis sits
  markSeg([X(xmin), Y(ax)], [X(xmax), Y(ax)]);
  markSeg([X(ay), Y(ymin)], [X(ay), Y(ymax)]);
  if (zeroAxes) {
    body += arrow(X(xmin), Y(ax), X(xmax) + 14, Y(ax), { width: 1.6, head: 7 });
    body += arrow(X(ay), Y(ymin), X(ay), Y(ymax) - 14, { width: 1.6, head: 7 });
    if (axisNames) {
      body += text(X(xmax) + 18, Y(ax) - 11, axisNames[0], { italic: true, size: 15 });
      body += text(X(ay) + 12, Y(ymax) - 16, axisNames[1], { italic: true, size: 15 });
    }
  } else {
    body += line(X(xmin), Y(ymin), X(xmax), Y(ymin), { width: 1.6 });
    body += line(X(xmin), Y(ymin), X(xmin), Y(ymax), { width: 1.6 });
  }
  if (labels) {
    for (let j = 0; j <= nMajX; j += 1) {
      const x = xmin + j * xstep;
      if (xlabelIf ? !xlabelIf(x) : j % xlabelEvery) continue;
      if (zeroAxes && Math.abs(x - ay) < eps) continue;
      body += line(X(x), Y(ax), X(x), Y(ax) + 4, { width: 1.2 });
      body += text(X(x), Y(ax) + 14, fmtX(x), { size: fontSize });
      markBox(X(x), Y(ax) + 14, fmtX(x).length * fontSize * 0.6, fontSize);
    }
    for (let j = 0; j <= nMajY; j += 1) {
      const y = ymin + j * ystep;
      if (ylabelIf ? !ylabelIf(y) : j % ylabelEvery) continue;
      if (zeroAxes && Math.abs(y - ax) < eps) continue;
      if (!zeroAxes && Math.abs(y - ymin) < eps && Math.abs(xmin) < eps && Math.abs(ymin) < eps) {
        body += text(X(xmin) - 7, Y(y) - 1, fmtY(y), { size: fontSize, anchor: 'end' });
        continue;
      }
      body += line(X(ay) - 4, Y(y), X(ay), Y(y), { width: 1.2 });
      body += text(X(ay) - 7, Y(y), fmtY(y), { size: fontSize, anchor: 'end' });
      markBox(X(ay) - 7 - fmtY(y).length * fontSize * 0.3, Y(y), fmtY(y).length * fontSize * 0.6, fontSize);
    }
    if (zeroAxes && xmin < 0 && ymin < 0) body += text(X(0) - 6, Y(0) + 12, '0', { size: fontSize, anchor: 'end' });
  }
  if (xtitle) body += text(X((xmin + xmax) / 2), Y(ymin) + 36, xtitle, { size: 14 });
  if (ytitle) body += text(ox + 4, oy + 12, ytitle, { size: 14, anchor: 'start' });

  const toPath = (segs) => {
    let d = ''; let last = null;
    for (const [p, q] of segs) {
      const a = [X(p[0]), Y(p[1])]; const b = [X(q[0]), Y(q[1])];
      markSeg(a, b);
      if (!last || Math.hypot(last[0] - a[0], last[1] - a[1]) > 0.5) d += `M ${r2(a[0])} ${r2(a[1])} `;
      d += `L ${r2(b[0])} ${r2(b[1])} `;
      last = b;
    }
    return d;
  };
  /** Polyline through data points, clipped to the window. */
  const poly = (pts, opts = {}) => {
    const segs = [];
    for (let i = 1; i < pts.length; i += 1) {
      const s = clipSeg(pts[i - 1], pts[i], box);
      if (s) segs.push(s);
    }
    const d = toPath(segs);
    return d ? path(d, { color: ACCENT, width: 2.4, ...opts }) : '';
  };
  /** Graph of y = f(x), sampled, clipped; breaks at asymptotes (non-finite or huge jumps). */
  const curve = (f, { from = xmin, to = xmax, samples = 300, ...opts } = {}) => {
    const runs = []; let cur = [];
    const span = ymax - ymin;
    for (let i = 0; i <= samples; i += 1) {
      const x = from + ((to - from) * i) / samples;
      const y = f(x);
      if (!Number.isFinite(y) || Math.abs(y) > 1e6) { if (cur.length) runs.push(cur); cur = []; continue; }
      if (cur.length && Math.abs(y - cur[cur.length - 1][1]) > span * 3) { runs.push(cur); cur = []; }
      cur.push([x, y]);
    }
    if (cur.length) runs.push(cur);
    return runs.map((r) => poly(r, opts)).join('');
  };
  /** Straight segment (clipped). */
  const seg = (p, q, opts = {}) => poly([p, q], opts);
  /** Infinite straight line y = m x + c, or vertical x = k when m is null. */
  const lineEq = (m, c, opts = {}) => (m === null ? poly([[c, ymin - 1], [c, ymax + 1]], opts)
    : poly([[xmin - 1, m * (xmin - 1) + c], [xmax + 1, m * (xmax + 1) + c]], opts));
  /** Point (dot or cross) with an optional label; without dx/dy the label goes wherever it overlaps least. */
  const pointAt = (x, y, label = null, { color = 'currentColor', dx = null, dy = null, r = 4, cross: isCross = false, size = 15 } = {}) => {
    let out = isCross
      ? line(X(x) - 5, Y(y) - 5, X(x) + 5, Y(y) + 5, { color, width: 2 }) + line(X(x) - 5, Y(y) + 5, X(x) + 5, Y(y) - 5, { color, width: 2 })
      : dot(X(x), Y(y), r, color);
    markBox(X(x), Y(y), 10, 10);
    if (label && dx === null && dy === null) out += smartLabel(x, y, label, { size, color });
    else if (label) out += halo(X(x) + (dx ?? 10), Y(y) + (dy ?? -12), label, { size, color });
    return out;
  };
  const label = (x, y, str, opts = {}) => { markBox(X(x), Y(y), String(str).length * (opts.size || 15) * 0.6, opts.size || 15); return halo(X(x), Y(y), str, { size: 15, ...opts }); };
  /**
   * Choose the candidate centre (pixel coords) for a w×h label that overlaps the fewest drawn things and stays
   * inside the chart; earlier candidates win ties. Marks the chosen box as occupied.
   */
  const place = (cands, bw, bh) => {
    let best = cands[0]; let bestScore = Infinity;
    const L = ox + 2; const R = ox + width - 2; const T = oy + 2; const B = oy + height - 2;
    cands.forEach((cnd, i) => {
      const [cx, cy] = cnd;
      let score = i * 0.01;
      if (cx - bw / 2 < L || cx + bw / 2 > R || cy - bh / 2 < T || cy + bh / 2 > B) score += 1000;
      for (const [px, py] of drawn) if (Math.abs(px - cx) <= bw / 2 + 3 && Math.abs(py - cy) <= bh / 2 + 3) score += 1;
      if (score < bestScore) { bestScore = score; best = cnd; }
    });
    markBox(best[0], best[1], bw, bh);
    return best;
  };
  /** Label at a data point, placed in the free-est of several directions around it. */
  const smartLabel = (x, y, str, { size = 15, dist = 13, color = 'currentColor', bold = false } = {}) => {
    const bw = String(str).length * size * 0.6; const bh = size;
    const dirs = [[1, -1], [-1, -1], [1, 1], [-1, 1], [0, -1.3], [0, 1.3], [1.4, 0], [-1.4, 0]];
    const cands = dirs.map(([u, v]) => [X(x) + u * (dist + bw / 2 - 4), Y(y) + v * dist]);
    const [cx, cy] = place(cands, bw, bh);
    return halo(cx, cy, str, { size, color, bold });
  };
  /** Filled polygon in data coords (caller keeps it inside the window). */
  const shade = (pts, { fill = FILL, opacity = 0.75, ...opts } = {}) => polygon(pts.map(([x, y]) => [X(x), Y(y)]), { fill, fillOpacity: opacity, width: 0, color: 'none', ...opts });
  const wrap = (extra = '', opts = {}) => svg(width, height, body + extra, { maxWidth: Math.min(width, 500), ...opts });
  return { X, Y, body, width, height, poly, curve, seg, lineEq, point: pointAt, label, shade, wrap, box, place, smartLabel, drawn, markBox };
}

/** Square coordinate grid with axes through the origin. step = units per grid square. */
export function coordGrid({ xmin = -6, xmax = 6, ymin = -6, ymax = 6, unit = 26, step = 1, labelEvery = 1, xlabelEvery = labelEvery, ylabelEvery = labelEvery, ...rest } = {}) {
  return chart({
    xmin, xmax, ymin, ymax, xstep: step, ystep: step, xlabelEvery, ylabelEvery,
    w: ((xmax - xmin) / step) * unit, h: ((ymax - ymin) / step) * unit, zeroAxes: true, fontSize: 12.5, ...rest,
  });
}

/**
 * Several sketch graphs side by side in one SVG, each labelled (A, B, C, D) underneath.
 * panels: [{ draw: (c) => markup, label, window: {xmin,xmax,ymin,ymax}, grid?, labels?, ...chart options }]
 */
export function panels(list, { cols = 2, pw = 150, ph = 120, gap = 14, labelSize = 16, chartOpts = {} } = {}) {
  const rows = Math.ceil(list.length / cols);
  let body = '';
  let cellW = 0; let cellH = 0;
  list.forEach((p, i) => {
    const c = chart({
      xmin: -5, xmax: 5, ymin: -5, ymax: 5, w: pw, h: ph, zeroAxes: true, labels: false, grid: false,
      padL: 12, padR: 24, padT: 22, padB: 8, axisNames: ['x', 'y'], ...chartOpts, ...p.window,
      ox: (i % cols) * 0, oy: 0,
    });
    cellW = c.width + gap; cellH = c.height + 26;
  });
  list.forEach((p, i) => {
    const ox = (i % cols) * cellW; const oy = Math.floor(i / cols) * cellH;
    const c = chart({
      xmin: -5, xmax: 5, ymin: -5, ymax: 5, w: pw, h: ph, zeroAxes: true, labels: false, grid: false,
      padL: 12, padR: 24, padT: 22, padB: 8, axisNames: ['x', 'y'], ...chartOpts, ...p.window, ox, oy,
    });
    body += c.body + p.draw(c);
    body += text(ox + c.width / 2 - 6, oy + c.height + 12, p.label, { size: labelSize, bold: true });
  });
  return svg(cols * cellW - gap, rows * cellH, body, { maxWidth: Math.min(cols * cellW, 520) });
}

/* ------------------------------------------------------------------ */
/* Function machines                                                   */
/* ------------------------------------------------------------------ */

/** Input → [op] → [op] → Output. ops are plain strings like "× 3", "+ 5". inp/out are values or '?'. */
export function machine(ops, inp, out) {
  const bw = 66; const bh = 40; const gap = 34; const ew = 58;
  const width = ew * 2 + ops.length * bw + (ops.length + 1) * gap + 8;
  const y = 30;
  let x = 4; let body = '';
  const end = (label, value) => {
    body += text(x + ew / 2, y - 18, label, { size: 13, color: MUTED });
    body += rect(x, y, ew, bh, { fill: 'none', width: 1.6 });
    body += text(x + ew / 2, y + bh / 2, String(value).replace('-', '−'), { size: 16, bold: value === '?' });
    x += ew;
  };
  const arr = () => { body += arrow(x + 4, y + bh / 2, x + gap - 4, y + bh / 2, { width: 1.6, head: 7 }); x += gap; };
  end('Input', inp);
  for (const op of ops) { arr(); body += rect(x, y, bw, bh, { fill: FILL, width: 1.6 }); body += text(x + bw / 2, y + bh / 2, op, { size: 16 }); x += bw; }
  arr();
  end('Output', out);
  return svg(width, y + bh + 8, body, { maxWidth: Math.min(width * 1.1, 480) });
}

/* ------------------------------------------------------------------ */
/* Pattern sequences (matchsticks and tiles)                            */
/* ------------------------------------------------------------------ */

const STICK = { width: 3.2 };
const tile = (x, y, s) => rect(x, y, s, s, { fill: FILL, width: 1.4 });

/** Each type: count(n) and draw(n, s) -> { body, w, h } in local coords (top-left origin). */
export const PATTERNS = {
  squares: { unit: 'matchsticks', d: 3, c: 1, desc: 'squares made from matchsticks',
    draw(n, s) {
      let b = '';
      for (let i = 0; i <= n; i += 1) b += line(i * s, 0, i * s, s, STICK);
      for (let i = 0; i < n; i += 1) b += line(i * s, 0, (i + 1) * s, 0, STICK) + line(i * s, s, (i + 1) * s, s, STICK);
      return { body: b, w: n * s, h: s };
    } },
  triangles: { unit: 'matchsticks', d: 2, c: 1, desc: 'triangles made from matchsticks',
    draw(n, s) {
      const hh = s * 0.866; let b = '';
      const v = []; // zigzag vertices
      for (let i = 0; i <= n + 1; i += 1) v.push(i % 2 === 0 ? [(i / 2) * s, hh] : [(i / 2) * s, 0]);
      for (let i = 1; i < v.length; i += 1) b += line(...v[i - 1], ...v[i], STICK);
      for (let i = 2; i < v.length; i += 1) b += line(...v[i - 2], ...v[i], STICK);
      return { body: b, w: ((n + 1) / 2) * s, h: hh };
    } },
  double: { unit: 'matchsticks', d: 5, c: 2, desc: 'two rows of squares made from matchsticks',
    draw(n, s) {
      let b = '';
      for (let i = 0; i <= n; i += 1) b += line(i * s, 0, i * s, s, STICK) + line(i * s, s, i * s, 2 * s, STICK);
      for (let i = 0; i < n; i += 1) for (let r = 0; r <= 2; r += 1) b += line(i * s, r * s, (i + 1) * s, r * s, STICK);
      return { body: b, w: n * s, h: 2 * s };
    } },
  houses: { unit: 'matchsticks', d: 4, c: 1, desc: 'pentagons made from matchsticks',
    draw(n, s) {
      let b = ''; const roof = s * 0.6;
      for (let i = 0; i <= n; i += 1) b += line(i * s, roof, i * s, roof + s, STICK);
      for (let i = 0; i < n; i += 1) {
        b += line(i * s, roof + s, (i + 1) * s, roof + s, STICK);
        b += line(i * s, roof, (i + 0.5) * s, 0, STICK) + line((i + 0.5) * s, 0, (i + 1) * s, roof, STICK);
      }
      return { body: b, w: n * s, h: roof + s };
    } },
  hexagons: { unit: 'matchsticks', d: 5, c: 1, desc: 'hexagons made from matchsticks',
    draw(n, s) {
      const w = Math.sqrt(3) * s * 0.8; const r = s * 0.8; let b = '';
      for (let i = 0; i < n; i += 1) {
        const cx = w / 2 + i * w; const cy = r;
        const v = [[cx, cy - r], [cx + w / 2, cy - r / 2], [cx + w / 2, cy + r / 2], [cx, cy + r], [cx - w / 2, cy + r / 2], [cx - w / 2, cy - r / 2]];
        for (let j = 0; j < 6; j += 1) {
          if (i > 0 && j === 4) continue; // shared with the previous hexagon
          const p = v[j]; const q = v[(j + 1) % 6];
          b += line(p[0], p[1], q[0], q[1], STICK);
        }
      }
      return { body: b, w: n * w, h: 2 * r };
    } },
  L: { unit: 'tiles', d: 2, c: 1, desc: 'L-shapes made from square tiles',
    draw(n, s) {
      let b = '';
      for (let i = 0; i <= n; i += 1) b += tile(0, i * s, s);
      for (let i = 1; i <= n; i += 1) b += tile(i * s, n * s, s);
      return { body: b, w: (n + 1) * s, h: (n + 1) * s };
    } },
  cross: { unit: 'tiles', d: 4, c: 1, desc: 'crosses made from square tiles',
    draw(n, s) {
      let b = tile(n * s, n * s, s);
      for (let i = 1; i <= n; i += 1) {
        b += tile((n - i) * s, n * s, s) + tile((n + i) * s, n * s, s) + tile(n * s, (n - i) * s, s) + tile(n * s, (n + i) * s, s);
      }
      return { body: b, w: (2 * n + 1) * s, h: (2 * n + 1) * s };
    } },
  T: { unit: 'tiles', d: 3, c: 1, desc: 'T-shapes made from square tiles',
    draw(n, s) {
      let b = '';
      for (let i = 0; i <= 2 * n; i += 1) b += tile(i * s, 0, s);
      for (let i = 1; i <= n; i += 1) b += tile(n * s, i * s, s);
      return { body: b, w: (2 * n + 1) * s, h: (n + 1) * s };
    } },
  border: { unit: 'grey tiles', d: 2, c: 6, desc: 'white tiles surrounded by grey tiles',
    draw(n, s) {
      let b = '';
      for (let i = 0; i < n + 2; i += 1) for (let r = 0; r < 3; r += 1) {
        const edge = r !== 1 || i === 0 || i === n + 1;
        b += rect(i * s, r * s, s, s, { fill: edge ? MUTED : 'var(--surface, #fff)', width: 1.4 });
      }
      return { body: b, w: (n + 2) * s, h: 3 * s };
    } },
};

/** Draw patterns 1..k of a type side by side with captions. */
export function patternSvg(type, k = 3, off = 0) {
  const pat = PATTERNS[type];
  const s = ['cross', 'T', 'L'].includes(type) ? (off > 0 ? 11 : 14) : off > 1 ? 16 : off > 0 ? 18 : 22;
  const parts = []; let x = 10; let maxH = 0;
  for (let n = 1; n <= k; n += 1) {
    const p = pat.draw(n + off, s);
    parts.push({ ...p, x, n });
    x += Math.max(p.w, 62) + 34;
    maxH = Math.max(maxH, p.h);
  }
  const width = x - 24;
  let body = '';
  for (const p of parts) {
    const cx = p.x + Math.max(p.w, 62) / 2;
    body += `<g transform="translate(${r2(cx - p.w / 2)} ${r2(10 + maxH - p.h)})">${p.body}</g>`;
    body += text(cx, maxH + 32, `Pattern ${p.n}`, { size: 14 });
  }
  return svg(width, maxH + 44, body, { maxWidth: Math.min(width * 1.2, 480) });
}

export { line, text, dot, path, polygon, arrow, rect, ACCENT, MUTED };
