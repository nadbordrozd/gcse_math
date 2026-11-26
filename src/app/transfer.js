// Moving progress between devices with a link (see src/sync.js): sending it, and opening it.
import { encodeProgress, decodeProgress, mergeStates, summarize } from '../sync.js';
import { state, replaceState, backfillCompletions } from './state.js';
import { syncAchievements } from './awards.js';
import { esc, toast } from './ui.js';

const canShare = () => typeof navigator.share === 'function';

/** The "send progress" buttons; wire them up with wireSend. */
export const sendButtonsHTML = (label = 'Send progress to another device') => `
  <div class="btn-row send-progress">
    ${canShare() ? `<button type="button" class="btn primary share-link">📲 ${esc(label)}</button>` : ''}
    <button type="button" class="btn ${canShare() ? '' : 'primary'} copy-link">🔗 Copy progress link</button>
  </div>
  <p class="send-status muted small" hidden></p>`;

export function wireSend(root) {
  const status = root.querySelector('.send-status');
  const say = (html) => { status.innerHTML = html; status.hidden = false; };
  const link = async () => `${location.origin}${location.pathname}#/sync/${await encodeProgress(state)}`;
  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      say('✓ Link copied. Paste it into a message or email to yourself, then open it on the other device.');
      toast('Link copied');
    } catch {
      // No clipboard access: show the link to copy by hand.
      say('Copy this link and open it on the other device:<textarea class="link-box" readonly rows="3"></textarea>');
      const box = status.querySelector('.link-box');
      box.value = url; box.focus(); box.select();
    }
  };
  root.querySelector('.share-link')?.addEventListener('click', async () => {
    const url = await link();
    try {
      await navigator.share({ title: 'GCSE Maths progress', text: 'My GCSE Maths progress – open this link on the other device.', url });
      say('✓ Sent. Open the link on the other device to bring your progress over.');
    } catch (err) {
      if (err?.name !== 'AbortError') copy(url);
    }
  });
  root.querySelector('.copy-link').addEventListener('click', async () => copy(await link()));
}

const when = (t) => (t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '–');
const column = (title, s) => `<div class="sync-col"><h3>${esc(title)}</h3><ul>
  <li><b>${s.mastered}</b> skills mastered</li>
  <li><b>${s.started}</b> skills started</li>
  <li><b>${s.answered}</b> questions answered</li>
  <li><b>${s.achievements}</b> achievements</li>
  <li>Last practised: <b>${when(s.lastActive)}</b></li></ul></div>`;

/** #/sync/<code>: show what the link holds and combine it with this device's progress. */
export async function renderSync(root, code) {
  root.innerHTML = '<section class="panel narrow sync"><p class="muted">Reading the link…</p></section>';
  let theirs;
  try {
    theirs = await decodeProgress(code || '');
  } catch {
    root.innerHTML = `<section class="panel narrow sync">
      <h1>📲 Progress link</h1>
      <p class="warning">This link looks damaged or incomplete. Some apps cut long links short – try sending it another way (email, AirDrop or a notes app), and make sure you copy the whole thing.</p>
      <a class="btn" href="#/">Back to topics</a></section>`;
    return;
  }
  const mine = summarize(state);
  const fresh = !mine.answered && !mine.achievements;
  root.innerHTML = `<section class="panel narrow sync">
    <h1>📲 Progress from another device</h1>
    <p class="lead">${fresh
    ? 'This device has no progress yet. Load the progress from the link to carry on where you left off.'
    : 'The progress in the link will be combined with what is already on this device. Nothing is lost: every mastered skill, achievement and quick check from either side is kept.'}</p>
    <div class="sync-cols">${column('In the link', summarize(theirs))}${fresh ? '' : column('On this device', mine)}</div>
    <div class="btn-row"><button type="button" class="btn primary big merge">${fresh ? 'Load this progress' : 'Combine with this device'}</button><a class="btn ghost" href="#/">Cancel</a></div>
  </section>`;
  root.querySelector('.merge').addEventListener('click', () => {
    replaceState(mergeStates(state, theirs));
    backfillCompletions();
    syncAchievements({ announce: false });
    history.replaceState(null, '', '#/sync-done'); // keep the link out of the address bar and history
    const now = summarize(state);
    root.innerHTML = `<section class="panel narrow sync">
      <h1>✓ Progress ${fresh ? 'loaded' : 'combined'}</h1>
      <p class="lead">This device now has <b>${now.mastered}</b> mastered skills and <b>${now.achievements}</b> achievements${now.name ? `, ${esc(now.name)}` : ''}.</p>
      <a class="btn primary big" href="#/">Carry on practising →</a>
      <h2>Switching back later?</h2>
      <p>Send a link from this device the same way (it's also in ⚙︎ Settings). ${fresh ? '' : 'You can send one now so the other device gets the combined progress too.'}</p>
      ${sendButtonsHTML('Send progress back')}
    </section>`;
    wireSend(root);
    toast(fresh ? 'Progress loaded' : 'Progress combined');
  });
}
