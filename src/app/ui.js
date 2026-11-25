// Small DOM and rendering helpers shared by the views.
import { AREAS, resolveTutorial } from '../registry.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const texCache = new Map();
/** Turn [[id]] / [[id|text]] cross-links into links to Learn pages (outside maths only). */
export function links(html) {
  return String(html).replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (m, id, label) => {
    const t = resolveTutorial(id);
    if (!t) return label || id;
    return `<a class="learn-link" href="#/learn/${t.id}">${label || t.title}</a>`;
  });
}
/** Render a generator or tutorial string: HTML with $TeX$ segments and [[links]]. */
export function math(html) {
  const parts = String(html ?? '').split('$');
  if (parts.length === 1 || !window.katex) return links(parts.join(''));
  return parts.map((part, i) => {
    if (i % 2 === 0) return links(part);
    if (texCache.has(part)) return texCache.get(part);
    let out;
    try { out = window.katex.renderToString(part, { throwOnError: false, output: 'html' }); } catch { out = esc(part); }
    if (texCache.size > 4000) texCache.clear();
    texCache.set(part, out);
    return out;
  }).join('');
}

export const AREA = Object.fromEntries(AREAS.map((a) => [a.id, a]));
export const areaStyle = (areaId) => {
  const a = AREA[areaId];
  return a ? `--area:${a.color};--area-tint:${a.tint}` : '';
};

const GRADE_COLORS = ['', '#5b8def', '#4f9fe0', '#3fb0c4', '#3bb38f', '#6cb33f', '#d5a021', '#e8822a', '#e05a3b', '#c43b6b'];
export const gradeBadge = (g, extra = '') => `<span class="grade" style="--g:${GRADE_COLORS[g] || '#888'}" title="Typical GCSE grade ${g}">${extra}${g}</span>`;
export const higherBadge = (skill) => (skill.higher ? '<span class="tier-badge" title="Higher tier only">H</span>' : '');

export const STATUS = {
  mastered: { label: 'Mastered', icon: '★', cls: 'st-mastered' },
  secure: { label: 'Looks secure', icon: '✓', cls: 'st-secure' },
  progress: { label: 'In progress', icon: '◐', cls: 'st-progress' },
  practice: { label: 'Needs practice', icon: '!', cls: 'st-practice' },
  new: { label: 'Not learned yet', icon: '○', cls: 'st-new' },
  none: { label: 'Not started', icon: '', cls: 'st-none' },
};

export function progressBar(value, max = 100, cls = '') {
  const pct = Math.max(0, Math.min(100, (100 * value) / max));
  return `<div class="bar ${cls}" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>`;
}

export function toast(message, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 2600);
}

export const isDev = () => ['localhost', '127.0.0.1'].includes(location.hostname) || new URLSearchParams(location.search).has('dev');

export function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
export const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

/** A friendly description of a typed-answer spec, shown under the input box. */
export function typedHelp(spec) {
  if (!spec) return '';
  if (spec.kind === 'coord') return 'Type coordinates, e.g. (2, −3)';
  if (spec.kind === 'list') return 'Type all the answers separated by commas, e.g. 2, −5';
  if (spec.kind === 'text') return 'Type your answer';
  return 'Type a number. Fractions like 3/4 and mixed numbers like 1 1/2 are fine.';
}
