// Progress links: encoding round trip and the merge rules (idempotent, order-free, nothing lost).
import assert from 'node:assert/strict';
import { encodeProgress, decodeProgress, mergeStates, summarize, upgradeState } from '../src/sync.js';

const base = () => ({
  schema: 1, settings: { tier: 'higher', answerMode: 'choice', theme: 'auto', name: '' },
  skills: {}, marks: {}, checks: {}, mocks: [], flagged: [], tally: { attempted: 0, correct: 0 },
  days: {}, last: null, completions: {}, achievements: {}, read: {},
});

const phone = base();
phone.settings = { tier: 'foundation', answerMode: 'typed', theme: 'dark', name: 'Zo' };
phone.skills = {
  a: { points: 100, attempts: 20, correct: 18, lastSeen: 1000, archetypes: { x: { a: 20, c: 18 } } },
  b: { points: 40, attempts: 8, correct: 6, lastSeen: 3000, archetypes: {} },
};
phone.completions = { a: { at: 900, wrong: 2 } };
phone.achievements = { skills_1: 900 };
phone.days = { '2026-11-20': 10, '2026-11-21': 5 };
phone.tally = { attempted: 28, correct: 24 };
phone.mocks = [{ at: 500, score: 10 }];
phone.last = 'b';

const laptop = base();
laptop.settings.theme = 'light';
laptop.skills = {
  a: { points: 60, attempts: 25, correct: 15, lastSeen: 2000, archetypes: { x: { a: 5, c: 3 } } }, // later but lower
  b: { points: 20, attempts: 3, correct: 2, lastSeen: 2500, archetypes: {} },
  c: { points: 14, attempts: 2, correct: 2, lastSeen: 4000, archetypes: {} },
};
laptop.achievements = { skills_1: 1500, streak_7: 1600 };
laptop.days = { '2026-11-21': 7, '2026-11-22': 3 };
laptop.tally = { attempted: 30, correct: 19 };
laptop.mocks = [{ at: 500, score: 10 }, { at: 700, score: 12 }];
laptop.last = 'c';

// Round trip (archetype counts and the theme stay behind).
const code = await encodeProgress(phone);
assert.match(code, /^[zj][A-Za-z0-9_-]+$/, 'link code is URL-safe');
const back = await decodeProgress(code);
assert.equal(back.skills.a.points, 100);
assert.equal(back.skills.a.archetypes, undefined);
assert.equal(back.settings.theme, undefined);
await assert.rejects(decodeProgress('zAAAA'), 'damaged code is rejected');
await assert.rejects(decodeProgress(`j${Buffer.from('{"x":1}').toString('base64url')}`), 'non-progress JSON is rejected');

const m = mergeStates(laptop, back);
assert.equal(m.skills.a.points, 100, 'mastered on either side stays mastered');
assert.equal(m.skills.b.points, 40, 'most recently practised record wins');
assert.equal(m.skills.c.points, 14, 'skills only on this device are kept');
assert.deepEqual(m.skills.a.archetypes, { x: { a: 5, c: 3 } }, 'local archetype counts are kept');
for (const r of Object.values(m.skills)) assert.ok(r.archetypes, 'every skill has archetypes');
assert.deepEqual(m.completions, { a: { at: 900, wrong: 2 } });
assert.deepEqual(m.achievements, { skills_1: 900, streak_7: 1600 }, 'earliest earning time kept');
assert.deepEqual(m.days, { '2026-11-20': 10, '2026-11-21': 7, '2026-11-22': 3 });
assert.equal(m.mocks.length, 2, 'mocks deduplicated');
assert.equal(m.tally.attempted, 30);
assert.equal(m.last, 'c', 'last skill from the device used most recently');
assert.equal(m.settings.theme, 'light', 'theme stays with the device');
assert.equal(m.settings.tier, 'foundation', 'tier follows the learner');

// Idempotent and order-free (apart from device settings).
const strip = (s) => ({ ...s, settings: null, skills: Object.fromEntries(Object.entries(s.skills).map(([k, v]) => [k, { ...v, archetypes: null }])) });
assert.deepEqual(mergeStates(m, back), m, 'opening the same link twice changes nothing');
assert.deepEqual(strip(mergeStates(back, laptop)), strip(m), 'merge order does not matter');

// A fresh device loads everything.
const f = mergeStates(base(), back);
assert.deepEqual(summarize(f), summarize(phone));

// Old quick-check results (assess) become marks; mastery copies are dropped.
const old = { ...base(), assess: { a: { status: 'secure', source: 'tested', at: 5 }, b: { status: 'practice', source: 'inferred', at: 6 }, c: { status: 'new', source: 'tested', at: 7 }, d: { status: 'secure', source: 'mastered', at: 8 } } };
delete old.marks;
const up = upgradeState(old);
assert.deepEqual(up.marks, { a: { mark: 'know', by: 'check', at: 5 }, b: { mark: 'todo', by: 'inferred', at: 6 }, c: { mark: 'todo', by: 'check', at: 7 } });
assert.equal(up.assess, undefined);

// Marks: the most recent one wins, from either side; an old-format link still merges.
const p2 = { ...base(), marks: { a: { mark: 'todo', by: 'me', at: 10 }, b: { mark: 'know', by: 'check', at: 3 } } };
const l2 = { ...base(), marks: { a: { mark: 'know', by: 'check', at: 4 }, c: { mark: 'todo', by: 'me', at: 9 } } };
assert.deepEqual(mergeStates(l2, p2).marks, { a: { mark: 'todo', by: 'me', at: 10 }, b: { mark: 'know', by: 'check', at: 3 }, c: { mark: 'todo', by: 'me', at: 9 } });
const cleared = { ...base(), marks: { c: { mark: null, by: 'me', at: 12 } } };
assert.equal(mergeStates(l2, cleared).marks.c.mark, null, 'a later clear wins over an older mark');
const legacy = { ...base(), assess: { z: { status: 'practice', source: 'tested', at: 1 } } };
delete legacy.marks;
assert.equal(mergeStates(l2, legacy).marks.z.mark, 'todo');

console.log('sync: all checks passed; link length for this sample', code.length);
