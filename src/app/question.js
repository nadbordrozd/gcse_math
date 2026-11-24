// Renders one generated question and handles answering, hints and the worked solution.
import { checkTyped } from '../core.js';
import { math, esc, typedHelp } from './ui.js';

/** Should this question be answered by typing? */
export const useTyped = (q, mode) => Boolean(q.typed) && mode === 'typed';

export function solutionHTML(q, { open = true } = {}) {
  const steps = q.solution.map((s) => `<li>${math(s)}</li>`).join('');
  return `<details class="solution" ${open ? 'open' : ''}><summary>How to solve it</summary><ol>${steps}</ol></details>`;
}

export function questionBodyHTML(q, { number = null, marks = null } = {}) {
  const calc = q.calculator
    ? '<span class="calc yes" title="You may use a calculator">🖩 Calculator</span>'
    : '<span class="calc no" title="Try it without a calculator">✎ Non-calculator</span>';
  return `
    <div class="q-meta">${number !== null ? `<span class="q-num">Question ${number}</span>` : ''}${calc}${marks ? `<span class="marks">[${marks} mark${marks > 1 ? 's' : ''}]</span>` : ''}</div>
    <div class="prompt">${math(q.prompt)}</div>
    ${q.visual ? `<div class="visual">${math(q.visual)}</div>` : ''}`;
}

/**
 * Interactive question with immediate feedback (practice and quick checks).
 * opts: { mode, onAnswer({outcome, response}), hint: bool, dontKnow: bool, dontKnowLabel }
 * outcome: 'correct' | 'hint' | 'wrong' | 'skip'
 */
export function mountQuestion(root, q, opts = {}) {
  const typed = useTyped(q, opts.mode);
  let usedHint = false;
  let done = false;
  const hintText = q.hint || q.solution[0];
  root.innerHTML = `
    <article class="question" data-archetype="${esc(q.archetype_id)}">
      ${questionBodyHTML(q)}
      ${typed ? `
        <form class="typed" autocomplete="off">
          <input type="text" inputmode="text" class="typed-input" aria-label="Your answer" placeholder="Your answer" spellcheck="false">
          <button type="submit" class="btn primary">Check</button>
          <p class="typed-help">${esc(typedHelp(q.typed))}</p>
        </form>`
    : `<div class="options" role="group" aria-label="Answer options">${q.options.map((o, i) => `
          <button type="button" class="option" data-id="${o.id}"><span class="opt-key">${o.id}</span><span class="opt-text">${math(o.text)}</span><kbd>${i + 1}</kbd></button>`).join('')}
        </div>`}
      <div class="q-actions">
        ${opts.hint !== false ? '<button type="button" class="btn ghost hint-btn" title="Shortcut: H">💡 Hint</button>' : ''}
        ${opts.dontKnow ? `<button type="button" class="btn ghost dk-btn">${esc(opts.dontKnowLabel || "I don't know")}</button>` : ''}
        ${typed || !q.typed ? '' : ''}
      </div>
      <div class="hint-box" hidden></div>
      <div class="feedback" hidden></div>
    </article>`;
  const article = root.querySelector('.question');
  const feedback = article.querySelector('.feedback');

  const finish = (outcome, response) => {
    if (done) return;
    done = true;
    article.classList.add('answered');
    article.querySelectorAll('.option').forEach((b) => {
      b.disabled = true;
      if (b.dataset.id === q.answer) b.classList.add('correct');
      else if (b.dataset.id === response) b.classList.add('wrong');
    });
    const input = article.querySelector('.typed-input');
    if (input) { input.disabled = true; input.classList.add(outcome === 'correct' || outcome === 'hint' ? 'ok' : 'bad'); article.querySelector('.typed button').disabled = true; }
    article.querySelectorAll('.hint-btn,.dk-btn').forEach((b) => b.remove());
    const good = outcome === 'correct' || outcome === 'hint';
    const msg = good
      ? `<strong>${pickPraise()}</strong>`
      : outcome === 'skip'
        ? '<strong>No problem – here is how to do it.</strong>'
        : '<strong>Not quite.</strong>';
    const answerLine = good && !typed ? '' : `<div class="right-answer">Answer: ${math(q.answerText)}</div>`;
    feedback.hidden = false;
    feedback.className = `feedback ${good ? 'good' : 'bad'}`;
    feedback.innerHTML = `${msg}${answerLine}${opts.solution === false ? '' : solutionHTML(q, { open: !good })}`;
    opts.onAnswer?.({ outcome, response });
  };

  article.querySelectorAll('.option').forEach((btn) => btn.addEventListener('click', () => {
    const correct = btn.dataset.id === q.answer;
    finish(correct ? (usedHint ? 'hint' : 'correct') : 'wrong', btn.dataset.id);
  }));
  const form = article.querySelector('form.typed');
  if (form) {
    const input = form.querySelector('input');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!input.value.trim()) { input.focus(); return; }
      const ok = checkTyped(q.typed, input.value);
      finish(ok ? (usedHint ? 'hint' : 'correct') : 'wrong', input.value);
    });
    setTimeout(() => input.focus({ preventScroll: true }), 30);
  }
  article.querySelector('.hint-btn')?.addEventListener('click', (e) => {
    usedHint = true;
    const box = article.querySelector('.hint-box');
    box.hidden = false;
    box.innerHTML = `💡 ${math(hintText)}`;
    e.currentTarget.remove();
  });
  article.querySelector('.dk-btn')?.addEventListener('click', () => finish('skip', null));

  return {
    get done() { return done; },
    key(e) {
      if (done) return false;
      if (form && document.activeElement === form.querySelector('input')) return false;
      const k = e.key.toUpperCase();
      const idx = ['1', '2', '3', '4', '5'].indexOf(k) >= 0 ? Number(k) - 1 : ['A', 'B', 'C', 'D', 'E'].indexOf(k);
      if (!form && idx >= 0 && idx < q.options.length) { article.querySelectorAll('.option')[idx].click(); return true; }
      if (k === 'H') { article.querySelector('.hint-btn')?.click(); return true; }
      return false;
    },
  };
}

const PRAISE = ['Correct!', 'Nice one!', 'Spot on!', 'Well done!', 'Exactly right!', 'Great work!', 'Yes!'];
const pickPraise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];
