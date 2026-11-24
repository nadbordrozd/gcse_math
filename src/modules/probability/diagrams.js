// Diagram helpers for the probability module: tree diagrams, frequency trees, Venn diagrams,
// spinners, probability scales, discs/cards and sample-space grids.
// Everything returns SVG/HTML strings (pure, no randomness).
import { Frac, num, table } from '../../core.js';
import {
  svg, line, text, rect, circle, path, arrow, FILL, FILL2, ACCENT, MUTED, polar,
} from '../../svg.js';

const r2 = (x) => Math.round(x * 100) / 100;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Small stable hash so clip/mask ids differ between diagrams on one page. */
const hash = (s) => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 1000003; return h.toString(36); };

/* ------------------------------------------------------------------ */
/* Labels: fractions, decimals, blanks                                 */
/* ------------------------------------------------------------------ */

/** Display a probability value for a diagram: Frac -> stacked fraction, number -> decimal, string -> text. */
function labelSize(v, size = 15) {
  if (v === null || v === undefined) return { w: 30, h: 24 };
  if (v instanceof Frac && v.d !== 1) {
    const chars = Math.max(String(Math.abs(v.n)).length, String(v.d).length);
    return { w: chars * size * 0.6 + 6, h: size * 2.3 };
  }
  const s = typeof v === 'number' ? num(v) : String(v);
  return { w: s.length * size * 0.58 + 4, h: size * 1.2 };
}

/** Draw a probability label centred at (x, y). null draws an empty answer box. */
export function probLabel(x, y, v, { size = 15, color = 'currentColor', bold = false } = {}) {
  if (v === null || v === undefined) {
    return rect(x - 15, y - 12, 30, 24, { fill: 'none', width: 1.4, dash: '4 3', color: MUTED });
  }
  if (v instanceof Frac && v.d !== 1) {
    const { w } = labelSize(v, size);
    const neg = v.n < 0 ? '−' : '';
    return text(x, y - size * 0.62, `${neg}${Math.abs(v.n)}`, { size, color, bold })
      + line(x - w / 2 + 2, y, x + w / 2 - 2, y, { width: 1.3, color })
      + text(x, y + size * 0.68, String(v.d), { size, color, bold });
  }
  const s = typeof v === 'number' ? num(v) : v instanceof Frac ? String(v.n) : String(v);
  const italic = /^[a-z]$/.test(s);
  return text(x, y, s, { size, color, italic, bold });
}

/** Multi-line text (lines split on \n). */
function multiText(x, y, str, opts = {}) {
  const lines = String(str).split('\n');
  const size = opts.size ?? 15;
  const gap = size * 1.15;
  return lines.map((l, i) => text(x, y + (i - (lines.length - 1) / 2) * gap, l, opts)).join('');
}
const textWidth = (str, size = 15) => Math.max(...String(str).split('\n').map((l) => l.length)) * size * 0.56;

/* ------------------------------------------------------------------ */
/* Probability tree diagram                                            */
/* ------------------------------------------------------------------ */

/**
 * Two- (or one-) stage probability tree.
 * first:  [{ label: 'Red', p: Frac|number|string|null }, ...]
 * second: [{label, p}, ...] (same for every first branch) or an array with one list per first branch
 *         (a list may be empty / null when that branch stops).
 * headings: ['First counter', 'Second counter'] (optional)
 * outcomes: optional function (i, j) => string shown at the right of each leaf (e.g. 'RR').
 */
export function treeDiagram({ first, second = null, headings = null, outcomes = null, leafGap = null, size = 15 } = {}) {
  let per;
  if (!second) per = first.map(() => null);
  else if (second.every((s) => Array.isArray(s) || s === null)) per = second;
  else per = first.map(() => second);
  const leaves = per.map((s) => Math.max(1, s ? s.length : 1));
  const all = [...first, ...per.filter(Boolean).flat()];
  const hasFrac = all.some((b) => b.p instanceof Frac && b.p.d !== 1);
  if (!leafGap) leafGap = hasFrac ? 70 : 56;
  const groupGap = second ? 12 : 0;
  const firstLabelW = Math.max(...first.map((b) => textWidth(b.label, size))) + 10;
  const secondLabelW = second ? Math.max(...per.filter(Boolean).flat().map((b) => textWidth(b.label, size))) + 10 : 0;
  const top = headings ? 40 : 14;
  const total = leaves.reduce((a, b) => a + b, 0);
  const height = top + total * leafGap + (first.length - 1) * groupGap + 8;
  const x0 = 22;
  const x1 = 175; // end of first-stage branches
  const n1x = x1 + 8 + firstLabelW / 2; // centre of first-stage labels
  const x2s = x1 + 16 + firstLabelW; // start of second-stage branches
  const x2 = x2s + 150;
  const n2x = x2 + 8 + secondLabelW / 2;
  const outX = x2 + 16 + secondLabelW;
  const width = (second ? (outcomes ? outX + 70 : outX + 4) : n1x + firstLabelW / 2 + 8);
  let body = '';
  let leaf = 0;
  const yFirst = [];
  per.forEach((s, i) => {
    const k = leaves[i];
    const ys = Array.from({ length: k }, (_, j) => top + (leaf + j + 0.5) * leafGap + i * groupGap);
    leaf += k;
    yFirst.push({ y: ys.reduce((a, b) => a + b, 0) / k, ys });
  });
  const rootY = yFirst.reduce((a, b) => a + b.y, 0) / yFirst.length;
  const branchLabel = (xa, ya, xb, yb, p, idx, n) => {
    const dx = xb - xa; const dy = yb - ya; const L = Math.hypot(dx, dy);
    const ux = dx / L; const uy = dy / L;
    // Normal pointing "above" for upward or flat branches, "below" for downward ones.
    let nx; let ny;
    const middle = n % 2 === 1 && idx === (n - 1) / 2;
    if (uy < -0.05 || middle) { nx = uy; ny = -ux; } else { nx = -uy; ny = ux; }
    if (ny > 0 && (uy < -0.05 || middle)) { nx = -nx; ny = -ny; }
    const { w, h } = labelSize(p, size);
    const off = (w / 2) * Math.abs(nx) + (h / 2) * Math.abs(ny) + 5;
    const t = middle ? 0.72 : 0.5;
    return probLabel(xa + dx * t + nx * off, ya + dy * t + ny * off, p, { size });
  };
  first.forEach((b, i) => {
    const yb = yFirst[i].y;
    body += line(x0, rootY, x1, yb, { width: 1.6 });
    body += branchLabel(x0, rootY, x1, yb, b.p, i, first.length);
    body += multiText(n1x, yb, b.label, { size });
    const s = per[i];
    if (s) {
      s.forEach((c, j) => {
        const yc = yFirst[i].ys[j];
        body += line(x2s, yb, x2, yc, { width: 1.6 });
        body += branchLabel(x2s, yb, x2, yc, c.p, j, s.length);
        body += multiText(n2x, yc, c.label, { size });
        if (outcomes) body += text(outX, yc, outcomes(i, j), { size: size - 1, anchor: 'start', color: MUTED });
      });
    }
  });
  if (headings) {
    body += text((x0 + x1) / 2 + 30, 16, headings[0], { size, bold: true });
    if (headings[1] && second) body += text((x2s + x2) / 2 + 40, 16, headings[1], { size, bold: true });
  }
  return svg(width, height, body, { maxWidth: Math.min(520, width), label: 'Probability tree diagram' });
}

/* ------------------------------------------------------------------ */
/* Frequency tree                                                      */
/* ------------------------------------------------------------------ */

/**
 * Frequency tree with ellipses holding numbers.
 * root: value (number|string|null for blank)
 * branches: [{ label: 'Yes', value, children: [{ label, value }] | null }, ...]
 * headings: optional three column headings.
 */
export function frequencyTree({ root, branches, headings = null, size = 15 } = {}) {
  const leaves = branches.map((b) => Math.max(1, b.children ? b.children.length : 1));
  const total = leaves.reduce((a, b) => a + b, 0);
  const gap = 62;
  const top = headings ? 50 : 16;
  const height = top + total * gap + 6;
  const rx = 38; const ry = 20;
  const c0 = 52; const c1 = 228; const c2 = 404;
  const width = 450;
  let body = '';
  const ell = (cx, cy, v) => `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${rx}" ry="${ry}" fill="none" stroke="currentColor" stroke-width="1.6"/>`
    + (v === null || v === undefined ? '' : text(cx, cy, typeof v === 'number' ? num(v) : v, { size: size + 1, italic: /^[a-z]$/.test(String(v)) }));
  let leaf = 0;
  const ys = branches.map((b, i) => {
    const k = leaves[i];
    const cy = Array.from({ length: k }, (_, j) => top + (leaf + j + 0.5) * gap);
    leaf += k;
    return { y: cy.reduce((a, c) => a + c, 0) / k, cy };
  });
  const rootY = ys.reduce((a, b) => a + b.y, 0) / ys.length;
  const edgeLabel = (xa, ya, xb, yb, label) => {
    const mx = (xa + xb) / 2; const my = (ya + yb) / 2;
    const up = yb <= ya;
    const lines = String(label).split('\n').length;
    // Long labels slide back along the branch so they stay clear of the next ellipse.
    const shift = Math.max(0, textWidth(label, size - 1) / 2 - 34);
    return multiText(mx - 4 - shift, my + (up ? -1 : 1) * (12 + lines * 6), label, { size: size - 1 });
  };
  body += ell(c0, rootY, root);
  branches.forEach((b, i) => {
    const y = ys[i].y;
    body += line(c0 + rx, rootY, c1 - rx, y, { width: 1.3 });
    body += edgeLabel(c0 + rx, rootY, c1 - rx, y, b.label);
    body += ell(c1, y, b.value);
    if (b.children) {
      b.children.forEach((c, j) => {
        const yc = ys[i].cy[j];
        body += line(c1 + rx, y, c2 - rx, yc, { width: 1.3 });
        body += edgeLabel(c1 + rx, y, c2 - rx, yc, c.label);
        body += ell(c2, yc, c.value);
      });
    }
  });
  if (headings) headings.forEach((h, i) => { if (h) body += multiText([c0, c1, c2][i], 20, h, { size: size - 1, bold: true }); });
  return svg(width, height, body, { maxWidth: width, label: 'Frequency tree' });
}

/* ------------------------------------------------------------------ */
/* Venn diagrams                                                       */
/* ------------------------------------------------------------------ */

const regionText = (x, y, v, size) => {
  if (v === null || v === undefined || v === '') return '';
  if (Array.isArray(v)) {
    // A list of elements: arrange in rows of 3.
    const rows = [];
    for (let i = 0; i < v.length; i += 3) rows.push(v.slice(i, i + 3).join('  '));
    return rows.map((r, i) => text(x, y + (i - (rows.length - 1) / 2) * (size + 3), r, { size })).join('');
  }
  const s = typeof v === 'number' ? num(v) : String(v);
  return text(x, y, s, { size, italic: /^[a-z]$/.test(s) });
};

/**
 * Two-set Venn diagram.
 * values: { a, ab, b, out } – counts, strings, arrays of elements, or null for blank.
 * shade: array of basic regions to shade: 'a' (A only), 'ab', 'b' (B only), 'out'.
 */
export function venn2({ labels = ['A', 'B'], values = {}, shade = [], universal = 'ξ', size = 16, width = 380, height = 230 } = {}) {
  const cx1 = width * 0.39; const cx2 = width * 0.61; const cy = height * 0.53; const r = height * 0.36;
  const bx = 14; const by = 14; const bw = width - 28; const bh = height - 28;
  const id = `v${hash(JSON.stringify([labels, values, shade]))}`;
  let defs = '';
  let shading = '';
  const shadeAttr = `fill="${ACCENT}" fill-opacity="0.28"`;
  const cA = `<circle cx="${r2(cx1)}" cy="${r2(cy)}" r="${r2(r)}"`;
  const cB = `<circle cx="${r2(cx2)}" cy="${r2(cy)}" r="${r2(r)}"`;
  if (shade.length) {
    defs += `<clipPath id="${id}cb">${cB}/></clipPath>`;
    defs += `<mask id="${id}ma"><rect x="0" y="0" width="${width}" height="${height}" fill="white"/>${cB} fill="black"/></mask>`;
    defs += `<mask id="${id}mb"><rect x="0" y="0" width="${width}" height="${height}" fill="white"/>${cA} fill="black"/></mask>`;
    defs += `<mask id="${id}mo"><rect x="0" y="0" width="${width}" height="${height}" fill="white"/>${cA} fill="black"/>${cB} fill="black"/></mask>`;
    if (shade.includes('a')) shading += `${cA} ${shadeAttr} mask="url(#${id}ma)"/>`;
    if (shade.includes('b')) shading += `${cB} ${shadeAttr} mask="url(#${id}mb)"/>`;
    if (shade.includes('ab')) shading += `${cA} ${shadeAttr} clip-path="url(#${id}cb)"/>`;
    if (shade.includes('out')) shading += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" ${shadeAttr} mask="url(#${id}mo)"/>`;
  }
  let body = (defs ? `<defs>${defs}</defs>` : '') + shading;
  body += rect(bx, by, bw, bh, { fill: 'none', width: 1.6 });
  body += circle(cx1, cy, r, { width: 1.8 }) + circle(cx2, cy, r, { width: 1.8 });
  if (universal) body += text(bx + 14, by + 16, universal, { size: 17, italic: true });
  body += text(cx1 - r * 0.62, cy - r - 2, labels[0], { size: 16, baseline: 'auto' });
  body += text(cx2 + r * 0.62, cy - r - 2, labels[1], { size: 16, baseline: 'auto' });
  const half = (cx2 - cx1) / 2;
  body += regionText(cx1 - r * 0.45 - half * 0.1, cy, values.a, size);
  body += regionText((cx1 + cx2) / 2, cy, values.ab, size);
  body += regionText(cx2 + r * 0.45 + half * 0.1, cy, values.b, size);
  body += regionText(bx + bw - 30, by + bh - 18, values.out, size);
  return svg(width, height, body, { maxWidth: width, label: 'Venn diagram' });
}

/**
 * Three-set Venn diagram. values keys: a, b, c (only), ab, ac, bc (exactly those two), abc, out.
 */
export function venn3({ labels = ['A', 'B', 'C'], values = {}, universal = 'ξ', size = 15 } = {}) {
  const width = 380; const height = 330;
  const r = 82;
  const A = [148, 128]; const B = [232, 128]; const C = [190, 200];
  let body = rect(12, 12, width - 24, height - 24, { fill: 'none', width: 1.6 });
  body += circle(...A, r, { width: 1.8 }) + circle(...B, r, { width: 1.8 }) + circle(...C, r, { width: 1.8 });
  if (universal) body += text(30, 30, universal, { size: 17, italic: true });
  body += text(A[0] - 62, A[1] - 72, labels[0], { size: 16 });
  body += text(B[0] + 62, B[1] - 72, labels[1], { size: 16 });
  body += text(C[0] + 82, C[1] + 62, labels[2], { size: 16 });
  body += regionText(A[0] - 38, A[1] - 18, values.a, size);
  body += regionText(B[0] + 38, B[1] - 18, values.b, size);
  body += regionText(C[0], C[1] + 44, values.c, size);
  body += regionText(190, 96, values.ab, size);
  body += regionText(140, 186, values.ac, size);
  body += regionText(240, 186, values.bc, size);
  body += regionText(190, 152, values.abc, size);
  body += regionText(width - 40, height - 30, values.out, size);
  return svg(width, height, body, { maxWidth: width, label: 'Venn diagram with three sets' });
}

/* ------------------------------------------------------------------ */
/* Spinners                                                            */
/* ------------------------------------------------------------------ */

const SECTOR_FILLS = [FILL, FILL2, 'var(--d-fill3, #e3f4ea)', 'var(--d-fill4, #f6e8f6)'];

/**
 * A spinner. sectors: [{ label, weight = 1 }]. Labels sit at 0.62 r. Returns the inner SVG body
 * centred at (cx, cy) when `bodyOnly` is set, else a full SVG.
 */
export function spinnerBody(cx, cy, r, sectors, { size = 14, caption = null } = {}) {
  const total = sectors.reduce((a, s) => a + (s.weight ?? 1), 0);
  let body = '';
  let ang = 90; // start at the top, go clockwise
  const n = sectors.length;
  sectors.forEach((s, i) => {
    const sweep = (360 * (s.weight ?? 1)) / total;
    const a0 = ang; const a1 = ang - sweep;
    const p0 = polar([cx, cy], r, a0); const p1 = polar([cx, cy], r, a1);
    const large = sweep > 180 ? 1 : 0;
    // Sectors named by a colour are left unfilled, so a "Red" sector is never painted blue.
    const colourWord = /^(red|blue|green|yellow|white|black|pink|orange|purple|grey)$/i.test(String(s.label));
    const fill = s.fill ?? (colourWord ? 'none' : n % 2 === 1 && n > 1 && i === n - 1 ? SECTOR_FILLS[2] : SECTOR_FILLS[i % 2]);
    body += n === 1
      ? circle(cx, cy, r, { fill, width: 1.6 })
      : `<path d="M ${r2(cx)} ${r2(cy)} L ${r2(p0[0])} ${r2(p0[1])} A ${r2(r)} ${r2(r)} 0 ${large} 1 ${r2(p1[0])} ${r2(p1[1])} Z" fill="${fill}" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`;
    const lp = polar([cx, cy], r * (sweep < 50 ? 0.7 : 0.62), (a0 + a1) / 2);
    body += text(lp[0], lp[1], s.label, { size: sweep < 40 ? size - 1 : size });
    ang = a1;
  });
  // Pointer
  const tip = polar([cx, cy], r * 0.3, 62);
  body += arrow(cx, cy, tip[0], tip[1], { width: 2.4, head: 9 });
  body += circle(cx, cy, 4, { fill: 'currentColor', width: 1 });
  if (caption) body += text(cx, cy + r + 18, caption, { size: 14, bold: true });
  return body;
}

export function spinner(sectors, { r = 92, size = 14, caption = null } = {}) {
  const w = 2 * r + 30; const h = 2 * r + (caption ? 44 : 24);
  return svg(w, h, spinnerBody(w / 2, r + 12, r, sectors, { size, caption }), { maxWidth: w, label: 'Spinner' });
}

/** Two spinners side by side. */
export function twoSpinners(a, b, { captions = ['Spinner A', 'Spinner B'], r = 78 } = {}) {
  const w = 4 * r + 90; const h = 2 * r + 46;
  const body = spinnerBody(r + 18, r + 10, r, a, { caption: captions[0] }) + spinnerBody(3 * r + 72, r + 10, r, b, { caption: captions[1] });
  return svg(w, h, body, { maxWidth: w, label: 'Two spinners' });
}

/* ------------------------------------------------------------------ */
/* Probability scale                                                   */
/* ------------------------------------------------------------------ */

/**
 * Probability scale from 0 to 1.
 * divisions: number of equal parts (ticks); endLabels: show 0 and 1 (and ½ when `half`).
 * marks: [{ p, label }] arrows above the line pointing down at p.
 * words: show Impossible / Even chance / Certain under the line.
 */
export function probScale({ divisions = 2, marks = [], words = false, numbers = true, half = false, width = 440 } = {}) {
  const pad = 34; const y = 64;
  const X = (p) => pad + p * (width - 2 * pad);
  let body = line(X(0), y, X(1), y, { width: 2 });
  for (let i = 0; i <= divisions; i += 1) {
    const big = i === 0 || i === divisions || (divisions % 2 === 0 && i === divisions / 2);
    body += line(X(i / divisions), y - (big ? 9 : 6), X(i / divisions), y + (big ? 9 : 6), { width: big ? 2 : 1.4 });
  }
  if (numbers) {
    body += text(X(0), y + 24, '0', { size: 15 });
    body += text(X(1), y + 24, '1', { size: 15 });
    if (half) body += probLabel(X(0.5), y + 32, new Frac(1, 2), { size: 13 });
  }
  if (words) {
    const wy = y + (numbers ? 44 : 26);
    body += text(X(0) - 12, wy, 'Impossible', { size: 13, color: MUTED, anchor: 'start' });
    body += text(X(0.5), wy + (half ? 12 : 0), 'Even chance', { size: 13, color: MUTED });
    body += text(X(1) + 12, wy, 'Certain', { size: 13, color: MUTED, anchor: 'end' });
  }
  marks.forEach((m) => {
    const x = X(m.p);
    body += arrow(x, y - 40, x, y - 4, { width: 2, head: 8, color: ACCENT });
    if (m.label) body += text(x, y - 50, m.label, { size: 15, bold: true });
  });
  const height = y + (words ? (numbers ? 66 : 44) : (half ? 54 : 38));
  return svg(width, height, body, { maxWidth: width, label: 'Probability scale' });
}

/* ------------------------------------------------------------------ */
/* Discs, counters and cards                                           */
/* ------------------------------------------------------------------ */

/** Rows of numbered/lettered discs, e.g. [['11','11'],['22']]. A flat list is wrapped at perRow. */
export function discs(items, { perRow = 8, r = 17, size = 14, labelFill = null } = {}) {
  const rows = Array.isArray(items[0]) ? items : Array.from({ length: Math.ceil(items.length / perRow) }, (_, i) => items.slice(i * perRow, i * perRow + perRow));
  const gap = 2 * r + 10;
  const maxN = Math.max(...rows.map((rw) => rw.length));
  const width = Math.max(200, maxN * gap + 20); const height = rows.length * gap + 14;
  let body = '';
  rows.forEach((rw, i) => rw.forEach((lab, j) => {
    const cx = 10 + r + j * gap + 4; const cy = 10 + r + i * gap;
    body += circle(cx, cy, r, { fill: labelFill ? labelFill(lab) : FILL, width: 1.5 });
    body += text(cx, cy, lab, { size });
  }));
  return svg(width, height, body, { maxWidth: width, label: 'Discs' });
}

/** A row (or rows) of cards with labels. */
export function cards(items, { perRow = 11, w = 38, h = 52, size = 18 } = {}) {
  const rows = Array.from({ length: Math.ceil(items.length / perRow) }, (_, i) => items.slice(i * perRow, i * perRow + perRow));
  const gap = w + 10;
  const width = Math.max(...rows.map((r) => r.length)) * gap + 14; const height = rows.length * (h + 10) + 10;
  let body = '';
  rows.forEach((rw, i) => rw.forEach((lab, j) => {
    const x = 10 + j * gap; const y = 10 + i * (h + 10);
    body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${FILL}" stroke="currentColor" stroke-width="1.5"/>`;
    body += text(x + w / 2, y + h / 2, lab, { size, bold: true });
  }));
  return svg(width, height, body, { maxWidth: Math.max(width, 120), label: 'Cards' });
}

/** A bag holding counters: groups [{ label: 'R', count: 5 }], with a key beneath. */
export function bag(groups, { key = null } = {}) {
  const items = groups.flatMap((g) => Array(g.count).fill(g.label));
  const perRow = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(items.length * 1.8))));
  const rows = Math.ceil(items.length / perRow);
  const r = 13; const gap = 31;
  const innerW = perRow * gap; const innerH = rows * gap;
  const width = Math.max(innerW + 70, 220); const top = 36;
  const height = top + innerH + 30 + (key ? 26 : 0);
  const left = (width - innerW) / 2;
  let body = path(`M ${left - 20} ${top - 6} C ${left - 36} ${top + innerH * 0.4} ${left - 30} ${top + innerH + 16} ${left + 10} ${top + innerH + 20} L ${left + innerW - 10} ${top + innerH + 20} C ${left + innerW + 30} ${top + innerH + 16} ${left + innerW + 36} ${top + innerH * 0.4} ${left + innerW + 20} ${top - 6}`, { width: 1.8 });
  const fills = {}; const palette = [FILL, FILL2, 'var(--d-fill3, #e3f4ea)', 'var(--d-fill4, #f6e8f6)', '#ffffff'];
  groups.forEach((g, i) => { fills[g.label] = palette[i % palette.length]; });
  items.forEach((lab, i) => {
    const cx = left + (i % perRow) * gap + gap / 2; const cy = top + Math.floor(i / perRow) * gap + gap / 2 + 4;
    body += circle(cx, cy, r, { fill: fills[lab], width: 1.4 });
    body += text(cx, cy, lab, { size: 13, bold: true });
  });
  if (key) body += text(width / 2, height - 14, key, { size: 13, color: MUTED });
  return svg(width, height, body, { maxWidth: width, label: 'Bag of counters' });
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

/** Sample-space grid as an HTML table. rowVals/colVals label the outcomes; cell(r, c) gives the entry ('' for blank). */
export function sampleGrid(rowName, colName, rowVals, colVals, cell) {
  const rows = [[`${esc(rowName)} ↓ &nbsp; ${esc(colName)} →`, ...colVals.map(String)]];
  rowVals.forEach((r, i) => rows.push([String(r), ...colVals.map((c, j) => String(cell(i, j)))]));
  return table(rows, { firstColHeader: true, className: 'sample-space' });
}
