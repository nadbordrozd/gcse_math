// Achievements in the app: earning them, toasts, the achievements page and the mastery celebration.
import { UNITS, AREAS, UNIT } from '../registry.js';
import { evaluateAchievements } from '../achievements.js';
import { state, save } from './state.js';
import { esc, gradeBadge, areaStyle, AREA, progressBar } from './ui.js';
import { visibleSkills, hasQuestions } from './plan.js';
import { playSound } from './sounds.js';

const FANFARE_MS = 1700; // let the skill fanfare finish before an achievement jingle starts

export function achievementList() {
  return evaluateAchievements({
    skills: visibleSkills().filter((s) => hasQuestions(s.id)),
    units: UNITS, areas: AREAS,
    completions: state.completions, days: state.days, attempted: state.tally.attempted,
    checks: state.checks, mocks: state.mocks, read: state.read,
  });
}

/** Mark newly met achievements as earned (for good). Returns them; announces with toasts if asked. */
export function syncAchievements({ announce = true, delay = 0 } = {}) {
  const fresh = achievementList().filter((a) => a.met && !state.achievements[a.id]);
  if (!fresh.length) return [];
  const now = Date.now();
  fresh.forEach((a) => { state.achievements[a.id] = now; });
  save();
  updateAchievementCount();
  if (announce) {
    setTimeout(() => playSound('achievement'), delay);
    fresh.forEach((a, i) => setTimeout(() => achievementToast(a), delay + i * 900));
  }
  return fresh;
}

export function updateAchievementCount() {
  const el = document.querySelector('.ach-count');
  if (!el) return;
  const list = achievementList();
  el.textContent = `${list.filter((a) => state.achievements[a.id]).length}/${list.length}`;
}

/** The pixel-art badge, or its emoji until the badge has been made. */
export function badgeHTML(a, size = 96) {
  return a.badge
    ? `<img class="badge-img" src="${a.badge}" alt="" width="${size}" height="${size}" loading="lazy">`
    : `<span class="badge-emoji" style="font-size:${Math.round(size * 0.55)}px" aria-hidden="true">${a.icon}</span>`;
}

function toastStack() {
  let el = document.querySelector('.ach-toasts');
  if (!el) { el = document.createElement('div'); el.className = 'ach-toasts'; document.body.append(el); }
  return el;
}

function achievementToast(a) {
  const t = document.createElement('a');
  t.className = 'ach-toast';
  t.href = '#/achievements';
  t.innerHTML = `<span class="plinth small">${badgeHTML(a, 56)}</span><span><small>Achievement unlocked!</small><b>${esc(a.title)}</b></span>`;
  t.addEventListener('click', () => t.remove());
  toastStack().append(t);
  setTimeout(() => t.classList.add('leaving'), 6000);
  setTimeout(() => t.remove(), 6600);
}

// ---------- achievements page ----------

function card(a) {
  const at = state.achievements[a.id];
  const unit = a.unitId ? UNIT[a.unitId] : null;
  return `<article class="ach-card ${at ? 'earned' : 'locked'}" ${unit ? `style="${areaStyle(unit.area)}"` : ''}>
    <div class="plinth">${badgeHTML(a, 96)}</div>
    <div class="ach-copy">
      <h3>${esc(a.title)}</h3>
      <p class="ach-req">${esc(a.requirement)}</p>
      <p class="ach-flavour">${esc(a.flavour)}</p>
      <div class="ach-status">${at
    ? `✓ Earned ${new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : `${progressBar(a.value, a.target)}<span>${a.value} / ${a.target}</span>`}</div>
    </div>
  </article>`;
}

export function renderAchievements(root) {
  syncAchievements({ announce: false });
  const list = achievementList();
  const earned = list.filter((a) => state.achievements[a.id]).length;
  const trophies = list.filter((a) => a.group === 'trophies');
  const beasts = list.filter((a) => a.group === 'bestiary');
  const beastsDone = beasts.filter((a) => state.achievements[a.id]).length;
  root.innerHTML = `
    <section class="panel achievements">
      <h1>🏆 Achievements</h1>
      <p class="lead">Master skills (100 points each), keep a streak going and explore the site to collect trophies and fill the bestiary. Once earned, they are yours for good – even if you reset your progress.</p>
      <div class="ach-total"><b>${earned}<small> / ${list.length}</small></b>${progressBar(earned, list.length, 'big')}</div>
      <h2>Trophies <span class="count">${trophies.filter((a) => state.achievements[a.id]).length}/${trophies.length}</span></h2>
      <div class="ach-grid">${trophies.map(card).join('')}</div>
      <h2>Bestiary <span class="count">${beastsDone}/${beasts.length}</span></h2>
      <p class="muted">Every topic has a creature guarding it. Master every skill in the topic to tame it.</p>
      ${AREAS.map((area) => {
    const inArea = beasts.filter((a) => UNIT[a.unitId]?.area === area.id);
    return inArea.length ? `<h3 class="area-mini" style="${areaStyle(area.id)}">${esc(area.icon)} ${esc(AREA[area.id].title)}</h3><div class="ach-grid">${inArea.map(card).join('')}</div>` : '';
  }).join('')}
    </section>`;
}

// ---------- mastery celebration ----------

/** Falling confetti on a full-screen canvas. */
export function confetti({ pieces = 170, ms = 3200 } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  document.body.append(c);
  const dpr = window.devicePixelRatio || 1;
  const W = (c.width = innerWidth * dpr), H = (c.height = innerHeight * dpr);
  const ctx = c.getContext('2d');
  const colours = ['#f2c14e', '#2f5bd3', '#e4572e', '#17a398', '#a855f7', '#ff8fab', '#22c55e'];
  const ps = Array.from({ length: pieces }, (_, i) => {
    const left = i % 2 === 0; // two cannons from the bottom corners
    return {
      x: left ? W * 0.08 : W * 0.92, y: H * 0.95,
      vx: (left ? 1 : -1) * (4 + Math.random() * 10) * dpr, vy: -(14 + Math.random() * 12) * dpr,
      w: (6 + Math.random() * 6) * dpr, h: (8 + Math.random() * 8) * dpr,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35, colour: colours[i % colours.length],
    };
  });
  const start = performance.now();
  const frame = (t) => {
    const age = t - start;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = Math.max(0, Math.min(1, (ms - age) / 600));
    for (const p of ps) {
      p.vy += 0.38 * dpr; p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.colour; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
      ctx.restore();
    }
    if (age < ms) requestAnimationFrame(frame); else c.remove();
  };
  requestAnimationFrame(frame);
}

const STAR = `<svg class="burst" viewBox="-60 -60 120 120" aria-hidden="true">
  <g class="rays">${Array.from({ length: 12 }, (_, i) => `<path d="M0,-58 L5,-30 L-5,-30 Z" transform="rotate(${i * 30})"/>`).join('')}</g>
  <path class="star" d="M0,-34 L9.9,-13.6 L32.3,-10.5 L16,5.2 L20,27.5 L0,17 L-20,27.5 L-16,5.2 L-32.3,-10.5 L-9.9,-13.6 Z"/>
</svg>`;

/**
 * Fanfare, confetti and a card for a skill that just reached 100 points.
 * opts.first: first time ever → the main button takes the learner back to the topic.
 * opts.mixed: in mixed practice the main button just carries on.
 * Returns a promise that resolves to 'topic' or 'stay'.
 */
export function celebrateMastery(skill, { first = true, mixed = false } = {}) {
  playSound('skill_complete');
  confetti();
  const fresh = syncAchievements({ announce: false });
  if (fresh.length) setTimeout(() => playSound('achievement'), FANFARE_MS);
  const r = state.skills[skill.id] || { attempts: 0, correct: 0 };
  const unit = UNIT[skill.unit];
  const toTopic = first && !mixed;
  const overlay = document.createElement('div');
  overlay.className = 'celebrate';
  overlay.innerHTML = `
    <div class="celebrate-card" role="dialog" aria-modal="true" aria-labelledby="celebrate-title" style="${areaStyle(skill.area)}">
      ${STAR}
      <p class="celebrate-kicker">Skill mastered!</p>
      <h2 id="celebrate-title">${gradeBadge(skill.grade)} ${esc(skill.title)}</h2>
      <p class="muted">100 points in ${r.attempts} question${r.attempts === 1 ? '' : 's'} · ${r.attempts ? Math.round((100 * r.correct) / r.attempts) : 0}% correct</p>
      ${fresh.length ? `<div class="celebrate-unlocks"><p class="small-title">Also unlocked</p>${fresh.map((a) => `<a class="unlock" href="#/achievements"><span class="plinth small">${badgeHTML(a, 56)}</span><span><b>${esc(a.title)}</b><small>${esc(a.requirement)}</small></span></a>`).join('')}</div>` : ''}
      <div class="btn-row center">
        ${toTopic
    ? `<button type="button" class="btn primary big go">Back to ${esc(unit.title)} →</button><button type="button" class="btn ghost stay">Stay and read the solution</button>`
    : `<button type="button" class="btn primary big stay">${mixed ? 'Keep going →' : 'Carry on'}</button><a class="btn ghost" href="#/topic/${unit.id}/${skill.id}">See the topic</a>`}
      </div>
    </div>`;
  document.body.append(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  overlay.querySelector('.btn.primary').focus();
  return new Promise((resolve) => {
    const close = (result) => {
      overlay.classList.remove('show');
      document.removeEventListener('keydown', onKey, true);
      setTimeout(() => overlay.remove(), 250);
      resolve(result);
    };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close('stay'); } };
    document.addEventListener('keydown', onKey, true);
    overlay.querySelector('.go')?.addEventListener('click', () => close('topic'));
    overlay.querySelector('.stay').addEventListener('click', () => close('stay'));
    overlay.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => close('link')));
  });
}

export const celebrating = () => Boolean(document.querySelector('.celebrate'));
