// Entry point: hash router and global keyboard handling.
import { LOAD_ERRORS } from '../registry.js';
import { renderHome } from './home.js';
import { renderPractice, practiceKey } from './practice.js';
import { renderCheck, renderCheckPicker, checkKey } from './check.js';
import { renderMockSetup, examActive } from './mock.js';
import { renderPlan, renderSettings, renderAbout, applyTheme } from './pages.js';

const root = document.getElementById('app');
let current = '';

function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [view, arg] = hash.split('/');
  if (examActive() && current === 'mock' && view !== 'mock' && !confirm('Leave the mock exam? Your answers will be lost.')) {
    history.replaceState(null, '', '#/mock');
    return;
  }
  current = view || 'home';
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.view === (['skill', 'mixed'].includes(current) ? 'home' : current === 'check-pick' ? 'check' : current)));
  window.scrollTo({ top: 0 });
  switch (view) {
    case 'skill': renderPractice(root, arg); break;
    case 'mixed': renderPractice(root, null); break;
    case 'check-pick': renderCheckPicker(root); break;
    case 'check': renderCheck(root, arg); break;
    case 'mock': renderMockSetup(root); break;
    case 'plan': renderPlan(root); break;
    case 'settings': renderSettings(root); break;
    case 'about': renderAbout(root); break;
    default: renderHome(root);
  }
  if (Object.keys(LOAD_ERRORS).length) {
    root.insertAdjacentHTML('afterbegin', `<p class="warning">Some question modules failed to load: ${Object.keys(LOAD_ERRORS).join(', ')}</p>`);
  }
}

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (['TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  if (document.activeElement?.tagName === 'INPUT' && document.activeElement.type !== 'radio' && document.activeElement.type !== 'checkbox' && !document.activeElement.classList.contains('typed-input')) return;
  const handled = (current === 'skill' || current === 'mixed') ? practiceKey(e) : current === 'check' ? checkKey(e) : false;
  if (handled) e.preventDefault();
});

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
window.addEventListener('hashchange', route);
applyTheme();
route();
