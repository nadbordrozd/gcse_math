// The "I know this" / "To do" toggle shown on skill rows, the practice page and the to-do page.
import { markOf, setMark, state } from './state.js';
import { MARK, esc } from './ui.js';
import { todoSkills } from './plan.js';

const when = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
function origin(id) {
  const m = state.marks[id];
  if (!m) return '';
  return { me: `Marked by you on ${when(m.at)}`, check: `Quick check on ${when(m.at)}`, inferred: `Quick check on ${when(m.at)} (from your other answers)` }[m.by] || '';
}

const titleFor = (id, k) => (markOf(id) === k ? `${MARK[k].label} – ${origin(id)}. Click to clear.` : `Mark as “${MARK[k].label}”`);

/** Two small toggle buttons. Clicking the active one clears the mark. */
export function markToggleHTML(id, { labels = true } = {}) {
  const cur = markOf(id);
  const btn = (k) => `<button type="button" class="mark-btn ${MARK[k].cls} ${cur === k ? 'on' : ''}" data-mark="${k}" aria-pressed="${cur === k}" title="${esc(titleFor(id, k))}"><span aria-hidden="true">${MARK[k].icon}</span>${labels ? `<span class="mark-label">${MARK[k].short}</span>` : ''}</button>`;
  return `<span class="mark-toggle" data-skill="${id}" role="group" aria-label="Your mark">${btn('know')}${btn('todo')}</span>`;
}

let onChange = null;
/** The current page's hook for refreshing summaries after a mark changes. */
export function onMarkChange(fn) { onChange = fn; }

export function updateTodoCount() {
  const el = document.querySelector('.todo-count');
  if (!el) return;
  const n = todoSkills().length;
  el.textContent = n || '';
  el.hidden = !n;
}

document.addEventListener('click', (e) => {
  const b = e.target.closest?.('.mark-btn');
  if (!b) return;
  e.preventDefault();
  e.stopPropagation();
  const wrap = b.closest('.mark-toggle');
  const id = wrap.dataset.skill;
  const next = markOf(id) === b.dataset.mark ? null : b.dataset.mark;
  setMark(id, next, 'me');
  // Update in place so keyboard focus stays on the button.
  document.querySelectorAll(`.mark-toggle[data-skill="${id}"] .mark-btn`).forEach((x) => {
    const on = x.dataset.mark === next;
    x.classList.toggle('on', on);
    x.setAttribute('aria-pressed', String(on));
    x.title = titleFor(id, x.dataset.mark);
  });
  updateTodoCount();
  onChange?.(id, next);
});
