// Entry point: hash router and global keyboard handling.
import { LOAD_ERRORS } from '../registry.js';
import { renderHome } from './home.js';
import { renderPractice, practiceKey, resumePractice } from './practice.js';
import { renderCheck, renderCheckPicker, checkKey } from './check.js';
import { renderMockSetup, examActive } from './mock.js';
import { renderPlan, renderSettings, renderAbout, applyTheme } from './pages.js';
import { renderLearnIndex, renderTutorial, learnKey } from './learn.js';
import { renderAchievements, syncAchievements, updateAchievementCount } from './awards.js';
import { backfillCompletions } from './state.js';
import { renderSync } from './transfer.js';
import { updateTodoCount, onMarkChange } from './marks.js';
import { travel, isSideTrip, backButtonHTML } from './trail.js';
import { soundEnabled, setSoundEnabled, preloadSounds } from './sounds.js';

const root = document.getElementById('app');
let current = '';
let here = { view: '', arg: '', hash: '' };

function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [view, arg, arg2] = hash.split('/');
  if (examActive() && current === 'mock' && view !== 'mock' && !confirm('Leave the mock exam? Your answers will be lost.')) {
    history.replaceState(null, '', '#/mock');
    return;
  }
  current = view || 'home';
  const to = { view: current, arg, hash: location.hash || '#/' };
  const from = here;
  here = to;
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.view === (['skill', 'mixed', 'topic'].includes(current) ? 'home' : current === 'check-pick' ? 'check' : current === 'plan' ? 'todo' : current)));
  onMarkChange(null);
  if (travel(root, from, to)) { // back from a side trip: the page is put back as it was
    if (view === 'skill' || view === 'mixed') resumePractice(root);
    updateAchievementCount();
    updateTodoCount();
    return;
  }
  window.scrollTo({ top: 0 });
  switch (view) {
    case 'skill': renderPractice(root, arg); break;
    case 'mixed': renderPractice(root, null, { todo: arg === 'todo' }); break;
    case 'check-pick': renderCheckPicker(root); break;
    case 'check': renderCheck(root, arg); break;
    case 'mock': renderMockSetup(root); break;
    case 'learn': if (arg) renderTutorial(root, arg); else renderLearnIndex(root); break;
    case 'plan': case 'todo': renderPlan(root); break;
    case 'settings': renderSettings(root); break;
    case 'about': renderAbout(root); break;
    case 'achievements': renderAchievements(root); break;
    case 'sync': renderSync(root, arg); break;
    case 'topic': renderHome(root, { unit: arg, skill: arg2 }); break;
    default: renderHome(root);
  }
  if (isSideTrip(current) && backButtonHTML()) root.insertAdjacentHTML('afterbegin', `<div class="back-bar">${backButtonHTML()}</div>`);
  if (Object.keys(LOAD_ERRORS).length) {
    root.insertAdjacentHTML('afterbegin', `<p class="warning">Some question modules failed to load: ${Object.keys(LOAD_ERRORS).join(', ')}</p>`);
  }
  updateAchievementCount();
  updateTodoCount();
}

function setupSound() {
  const btn = document.querySelector('.sound-toggle');
  const show = () => {
    const on = soundEnabled();
    btn.textContent = on ? '🔊' : '🔇';
    btn.setAttribute('aria-pressed', String(on));
    btn.title = on ? 'Sound on – click to turn off' : 'Sound off – click to turn on';
  };
  btn.addEventListener('click', () => { setSoundEnabled(!soundEnabled()); show(); });
  show();
  preloadSounds();
}

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (['TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  if (document.activeElement?.tagName === 'INPUT' && document.activeElement.type !== 'radio' && document.activeElement.type !== 'checkbox' && !document.activeElement.classList.contains('typed-input')) return;
  const handled = (current === 'skill' || current === 'mixed') ? practiceKey(e) : current === 'check' ? checkKey(e) : current === 'learn' ? learnKey(e) : false;
  if (handled) e.preventDefault();
});

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
window.addEventListener('hashchange', route);
applyTheme();
backfillCompletions();
syncAchievements({ announce: false }); // anything earned before achievements existed
setupSound();
route();
