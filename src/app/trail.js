// Side trips and the way back. Learn pages and the achievements page are "side trips": opening one from
// a question, a quick check, a topic or the to-do list shows a "← Back to …" button that returns there.
// A question or quick check is kept exactly as it was (the page is set aside, not rebuilt), so going
// back after reading a Learn page shows the same question, half-typed answer and all.
import { UNIT } from '../registry.js';
import { esc } from './ui.js';

const SIDE_TRIPS = new Set(['learn', 'achievements']);
const KEPT = new Set(['skill', 'mixed', 'check']); // pages set aside rather than rebuilt

let origin = null; // { hash, label }: where the back button goes
let pending = null; // a back target chosen by the page itself (e.g. the topic after mastering a skill)
let kept = null; // { hash, nodes, y }: the page set aside
let labels = {}; // view -> () => label, for pages whose label depends on their state

export const isSideTrip = (view) => SIDE_TRIPS.has(view);

/** Pages can say how their back button should read (e.g. "Back to the question"). */
export function backLabel(view, fn) { labels[view] = fn; }

/** Use this back target for the next side trip instead of the page the learner is on. */
export function returnTo(hash, label) { pending = { hash, label }; }

function labelFor(view, arg) {
  if (labels[view]) return labels[view](arg);
  if (view === 'topic') return `Back to ${UNIT[arg]?.title || 'the topic'}`;
  if (view === 'todo' || view === 'plan') return 'Back to your to-do list';
  return null; // other pages have the top bar
}

/**
 * Called by the router before it draws a new page. Returns true when the page was put back as it was,
 * so there is nothing to draw.
 */
export function travel(root, from, to) {
  if (isSideTrip(to.view)) {
    if (!isSideTrip(from.view)) {
      const label = labelFor(from.view, from.arg);
      origin = pending || (label ? { hash: from.hash, label } : null);
      kept = origin && origin.hash === from.hash && KEPT.has(from.view)
        ? { hash: from.hash, nodes: [...root.childNodes], y: window.scrollY } : null;
    }
    pending = null;
    return false;
  }
  pending = null;
  const back = kept && kept.hash === to.hash && isSideTrip(from.view) ? kept : null;
  kept = null;
  origin = null;
  if (!back) return false;
  root.replaceChildren(...back.nodes);
  requestAnimationFrame(() => window.scrollTo({ top: back.y }));
  return true;
}

/** "← Back to …" for a side-trip page, or nothing when there is nowhere particular to go back to. */
export function backButtonHTML(cls = '') {
  return origin ? `<a class="btn back-btn ${cls}" href="${esc(origin.hash)}">← ${esc(origin.label)}</a>` : '';
}
