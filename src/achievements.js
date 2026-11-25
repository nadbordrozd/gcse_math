// Achievements: milestones for mastering skills and using the site. Pure functions over a plain input
// object, so tests can run them in Node. Badges are PixelLab pixel art in assets/badges/<id>.png
// (made with tools/badges/badges.mjs); until a badge is accepted the emoji `icon` stands in.
//
// A completion is recorded the first time a skill reaches 100 points:
//   completions[skillId] = { at: ms timestamp, wrong: wrong answers and skips at that moment }
import { BADGES } from './badges-available.js';

// One creature per topic (unit): [unit id, name, emoji, flavour].
const BEASTS = [
  ['num-calc', 'BIDMAS Basilisk', '🦎', 'Brackets first, then indices, then it turns you to stone. Get the order wrong and it gets the last laugh.'],
  ['num-factors', 'Factor-Tree Ent', '🌳', 'Every branch splits until only primes are left at the tips. It is 2 × 2 × 3 × 7 metres tall and very proud of it.'],
  ['num-fractions', 'Pizza Mimic', '🍕', 'Already ate 1/8 of itself. Asks you to share the rest between 3 people and watches you carefully.'],
  ['num-fdp', 'Three-Band Chameleon', '🦎', '1/2, 0.5 or 50%? Same lizard, different colours. Spot it in all three and it can’t hide from you.'],
  ['num-powers', 'Exponent Bunnies', '🐇', 'One rabbit, then 2, 4, 8… After 30 doublings there are about 1.07 × 10⁹ of them. Standard form exists for a reason.'],
  ['num-rounding', 'Estimation Yeti', '❄️', 'About 3 metres tall, to 1 significant figure. Exactly? It just shrugs. The bounds are 2.5 m and 3.5 m.'],
  ['num-surds', 'Square-Root Mandrake', '🌱', 'Pull it out of the ground and it screams √2 forever: the decimals never end and never repeat.'],
  ['alg-expressions', 'Bracket Crab', '🦀', 'Two claws, one job: grab everything inside and multiply it out. Factorising is just putting it back.'],
  ['alg-equations', 'Balance Golem', '⚖️', 'Whatever you do to one side, it does to the other. Very fair. Slightly annoying. Always finds x.'],
  ['alg-inequalities', 'Greater-Than Crocodile', '🐊', 'Still eats the bigger number, like in Year 2. Now it also flips round when you multiply by a negative.'],
  ['alg-quadratics', 'Two-Root Serpent', '🐍', 'One head at each end: two roots. Sometimes the heads meet and there’s only one. Occasionally none, and then it sulks.'],
  ['alg-simultaneous', 'Twin Wolves', '🐺', 'Two unknowns, two clues. Catch one and the other gives itself up.'],
  ['alg-formulae', 'Alchemist Toad', '🐸', 'Rearranges any recipe to make a different ingredient the subject. Once rearranged itself into a prince. Briefly.'],
  ['alg-proof', 'Counterexample Unicorn', '🦄', 'Claimed every prime number is odd. You found 2. It has never been so embarrassed.'],
  ['gr-sequences', 'nth-Term Centipede', '🐛', 'Each segment is a little bigger than the last. You can tell it how many legs segment 100 has without counting.'],
  ['gr-linear', 'Gradient Goat', '🐐', 'Lives on y = mx + c and cares mostly about m. The steeper the better.'],
  ['gr-nonlinear', 'Curve Leviathan', '🌊', 'Rises, dips, rises again. A cubic with scales. Its reciprocal cousin never quite touches the axes.'],
  ['gr-reallife', 'Rate Cheetah', '🐆', 'Steepest line on any distance–time graph. The flat bits are naps.'],
  ['gr-functions', 'Function Golem', '🤖', 'Put x in the top and f(x) comes out of the chute. Ask nicely and it runs backwards: f⁻¹.'],
  ['rat-ratio', 'Two-Headed Ogre', '👹', 'Shares every meal 3 : 2. The left head still thinks it was robbed.'],
  ['rat-percent', 'Compound-Interest Dragon', '🐉', 'Its hoard grows 5% a year and it has been asleep for 300 years. That’s ×1.05³⁰⁰. Do not wake it.'],
  ['rat-proportion', 'Ant Queen', '🐜', 'Twice the ants, half the time. Inversely proportional, and very organised about it.'],
  ['rat-measures', 'Speed Pegasus', '🐎', 'Flies 120 km in 1.5 hours: 80 km/h. Never forgets the units, unlike some people.'],
  ['geo-angles', 'Protractor Bat', '🦇', 'Hangs upside down, which makes no difference: vertically opposite angles are still equal.'],
  ['geo-shapes', 'Hexagon Beetle', '🪲', 'Six equal sides, interior angles of 120°, and a shell that tessellates. Bees are jealous.'],
  ['geo-area', 'Tiled Tortoise', '🐢', 'Its shell is exactly 48 squares. It counts them every night, just to be sure.'],
  ['geo-volume', 'Cuboid Slime', '🟩', 'Length × width × height = exactly how much lunch it can hold. Currently: one sword.'],
  ['geo-transform', 'Mirror Ghost', '👻', 'Reflect it in y = x and it comes back looking surprised. Rotate it 90° and it gets dizzy.'],
  ['trig-pythagoras', 'Triangle Scarab', '🪲', 'Has had a² + b² = c² scratched on its shell for 2500 years. The longest side is always opposite the right angle.'],
  ['trig-trig', 'SOH-CAH-TOA Wyvern', '🐲', 'Opposite, adjacent, hypotenuse. Name the sides first and it can’t bite.'],
  ['trig-similarity', 'Scale-Factor Copycats', '🐈', 'Same angles, every side × 3. Area × 9. The kitten is not happy about the maths.'],
  ['trig-circles', 'Circle Serpent', '⭕', 'The angle at the centre is twice the angle at the edge. It worked that out while chasing its tail.'],
  ['trig-vectors', 'Vector Falcon', '🦅', 'Magnitude and direction. Mostly direction: straight at your sandwich.'],
  ['prob-basics', 'Coin Goblin', '🪙', 'Heads it wins, tails you lose. Write out the sample space and it stops trying that trick.'],
  ['prob-combined', 'Card Shark', '🦈', 'P(A and B) = P(A) × P(B), if the shark isn’t cheating. Check the tree diagram: it usually is.'],
  ['stat-averages', 'Average Hound', '🐕', 'Three heads: Mean, Median and Mode. Mean is the grumpy one; one outlier ruins his whole day.'],
  ['stat-charts', 'Bar Chart Golem', '📊', 'Built from blocks of different heights. Ask it which is tallest and it points with great pride.'],
  ['stat-higher', 'Box-and-Whisker Cat', '🐱', 'Sits in a box, whiskers out to the minimum and maximum. The box is the middle 50%, obviously.'],
];

const count = (id, title, icon, target, requirement, flavour) => ({
  id, group: 'trophies', title, icon, requirement, flavour,
  measure: (ctx) => ({ value: ctx.completedCount, target: typeof target === 'function' ? target(ctx) : target }),
});
const flag = (fn) => (ctx) => ({ value: fn(ctx) ? 1 : 0, target: 1 });

export const ACHIEVEMENTS = [
  count('skills_1', 'First Star', '⭐', 1, 'Master your first skill.',
    (ctx) => `One down, ${Math.max(ctx.totalSkills - 1, 0)} to go. Who’s counting? (We are. It’s a maths website.)`),
  count('skills_5', 'Found Your Bearings', '🧭', 5, 'Master 5 skills.', 'Five skills in. Three-figure bearings, measured clockwise from north, obviously.'),
  count('skills_10', 'Double Digits', '🎲', 10, 'Master 10 skills.', 'Your skill count now needs two digits. Only one more digit to go after this.'),
  count('skills_25', 'Iron Grip', '🧤', 25, 'Master 25 skills.', '25 skills: that’s 5². Squares are everywhere once you start looking.'),
  count('skills_50', 'Half-Century', '🏆', 50, 'Master 50 skills.', 'In cricket you’d raise your bat. Here you can raise your eyebrows at the next one.'),
  count('skills_100', 'Laurels', '🌿', (ctx) => Math.min(100, ctx.totalSkills), (ctx) => `Master ${Math.min(100, ctx.totalSkills)} skills.`,
    'The Romans wrote 100 as C. We’d write it as 1 × 10².'),
  count('skills_all', 'Grand Crown', '👑', (ctx) => ctx.totalSkills, 'Master every single skill.',
    'There is nothing left to learn. (There is. It’s called A-level.)'),
  {
    id: 'foundations', group: 'trophies', title: 'Cornerstone', icon: '🧱', requirement: (ctx) => `Master every grade 1–3 skill (${ctx.gradeTotal(1, 3)}).`,
    flavour: 'Everything else in the course gets built on top of these. Solid.',
    measure: (ctx) => ({ value: ctx.gradeDone(1, 3), target: ctx.gradeTotal(1, 3) }),
  },
  {
    id: 'all_grades', group: 'trophies', title: 'Full Spectrum', icon: '🌈', requirement: (ctx) => `Master a skill at every grade from 1 to ${ctx.topGrade}.`,
    flavour: (ctx) => `Every colour of the rainbow, from grade 1 at the red end to grade ${ctx.topGrade} out in the ultraviolet.`,
    measure: (ctx) => ({ value: ctx.gradesTouched, target: ctx.topGrade }),
  },
  {
    id: 'top_grade', group: 'trophies', title: 'Summit', icon: '🏔️', requirement: (ctx) => `Master a grade ${ctx.topGrade} skill.`,
    flavour: 'The hardest skills on the site. The air is thin up here, but the view is great.',
    measure: flag((ctx) => ctx.masteredGrades.has(ctx.topGrade)),
  },
  {
    id: 'higher_1', group: 'trophies', title: 'Winged Boots', icon: '🪽', requirement: 'Master a Higher-tier skill.',
    flavour: 'Foundation covers grades 1–5. You just stepped above it.',
    measure: (ctx) => ({ value: ctx.higherDone > 0 ? 1 : 0, target: ctx.hasHigher ? 1 : 0 }),
  },
  {
    id: 'every_area', group: 'trophies', title: 'Six-Gem Amulet', icon: '📿', requirement: (ctx) => `Master a skill in each of the ${ctx.areaCount} areas of the course.`,
    flavour: 'Number, algebra, ratio, geometry, probability and statistics: one gem each.',
    measure: (ctx) => ({ value: ctx.areasTouched, target: ctx.areaCount }),
  },
  {
    id: 'flawless', group: 'trophies', title: 'Flawless Pearl', icon: '🦪', requirement: 'Master a skill without a single wrong answer.',
    flavour: 'Not one mistake from 0 to 100. Suspiciously perfect. We’re keeping an eye on you.',
    measure: flag((ctx) => ctx.completions.some((c) => c.wrong === 0)),
  },
  {
    id: 'comeback', group: 'trophies', title: 'Golden Repair', icon: '🏺', requirement: 'Master a skill after getting 5 or more of its questions wrong.',
    flavour: 'In Japan, broken bowls are mended with gold, and they end up worth more. Mistakes work the same way.',
    measure: flag((ctx) => ctx.completions.some((c) => c.wrong >= 5)),
  },
  {
    id: 'hat_trick', group: 'trophies', title: 'Hat-Trick', icon: '🏹', requirement: 'Master 3 skills in one day.',
    flavour: 'Three arrows, three targets, one day. Showing off a bit now.',
    measure: (ctx) => ({ value: ctx.bestDay, target: 3 }),
  },
  {
    id: 'weekend', group: 'trophies', title: 'Weekend Warrior', icon: '☕', requirement: 'Master a skill on a Saturday or Sunday.',
    flavour: 'Everyone else was still in bed. You were solving simultaneous equations. Have a hot chocolate.',
    measure: flag((ctx) => ctx.completions.some((c) => [0, 6].includes(new Date(c.at).getDay()))),
  },
  {
    id: 'streak_7', group: 'trophies', title: 'Week-Long Lantern', icon: '🏮', requirement: 'Practise on 7 days in a row.',
    flavour: 'A little every day beats a lot once a week. Keep the flame lit.',
    measure: (ctx) => ({ value: ctx.bestStreak, target: 7 }),
  },
  {
    id: 'streak_30', group: 'trophies', title: 'Eternal Flame', icon: '🔥', requirement: 'Practise on 30 days in a row.',
    flavour: 'Thirty days. This is officially a habit now. A good one.',
    measure: (ctx) => ({ value: ctx.bestStreak, target: 30 }),
  },
  {
    id: 'questions_100', group: 'trophies', title: 'Scroll of a Hundred', icon: '📜', requirement: 'Answer 100 questions.',
    flavour: 'A hundred questions, and every one of them made up fresh just for you.',
    measure: (ctx) => ({ value: ctx.attempted, target: 100 }),
  },
  {
    id: 'questions_1000', group: 'trophies', title: 'Thousand-Page Tome', icon: '📗', requirement: 'Answer 1,000 questions.',
    flavour: '1000 = 10³. That’s a lot of reps. Your brain now has visible muscles.',
    measure: (ctx) => ({ value: ctx.attempted, target: 1000 }),
  },
  {
    id: 'check_1', group: 'trophies', title: 'Spyglass', icon: '🔭', requirement: 'Take your first quick check.',
    flavour: 'Scout the land before you march. Now you know where to start.',
    measure: (ctx) => ({ value: ctx.checksTaken, target: 1 }),
  },
  {
    id: 'check_all', group: 'trophies', title: 'Cartographer', icon: '🗺️', requirement: (ctx) => `Take a quick check in every topic (${ctx.unitCount}).`,
    flavour: 'The whole map, coloured in. No more “here be dragons”. Well, a few dragons. See the Bestiary.',
    measure: (ctx) => ({ value: ctx.checksTaken, target: ctx.unitCount }),
  },
  {
    id: 'learn_10', group: 'trophies', title: 'Midnight Oil', icon: '🕯️', requirement: 'Open 10 Learn pages.',
    flavour: 'Reading the instructions first. Rare, and very wise.',
    measure: (ctx) => ({ value: ctx.pagesRead, target: 10 }),
  },
  {
    id: 'learn_50', group: 'trophies', title: 'Library Key', icon: '🗝️', requirement: 'Open 50 Learn pages.',
    flavour: 'You’ve read more of this website than the person who made it. (Not true. But close.)',
    measure: (ctx) => ({ value: ctx.pagesRead, target: 50 }),
  },
  {
    id: 'mock_1', group: 'trophies', title: 'Hourglass', icon: '⏳', requirement: 'Finish a mock exam.',
    flavour: 'Real exam conditions, but with snacks. The real one will feel more familiar now.',
    measure: (ctx) => ({ value: ctx.mocksTaken, target: 1 }),
  },
  {
    id: 'mock_4', group: 'trophies', title: 'Silver Medal', icon: '🥈', requirement: 'Get grade 4 or above on a mock exam.',
    flavour: 'Grade 4 is a standard pass. You’re on the board.',
    measure: flag((ctx) => ctx.bestMockGrade >= 4),
  },
  {
    id: 'mock_7', group: 'trophies', title: 'Gold Medal', icon: '🥇', requirement: 'Get grade 7 or above on a mock exam (Higher paper).',
    flavour: 'Grade 7 used to be called an A. Whatever it’s called, it’s brilliant.',
    measure: (ctx) => ({ value: ctx.bestMockGrade >= 7 ? 1 : 0, target: ctx.hasHigher ? 1 : 0 }),
  },
  ...BEASTS.map(([unitId, title, icon, flavour]) => ({
    id: `unit_${unitId}`, group: 'bestiary', title, icon, flavour, unitId,
    requirement: (ctx) => `Master all ${ctx.unitTotal(unitId)} ${ctx.unitTitle(unitId)} skills.`,
    measure: (ctx) => ({ value: ctx.unitDone(unitId), target: ctx.unitTotal(unitId) }),
  })),
];

export const ACHIEVEMENT = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
export const badgeUrl = (id) => (BADGES.has(id) ? `./assets/badges/${id}.png` : null);

const localDay = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Longest run of consecutive days in a {'YYYY-MM-DD': n} map. */
export function longestStreak(days) {
  const keys = Object.keys(days || {}).filter((k) => days[k] > 0).sort();
  let best = 0, run = 0, prev = null;
  for (const k of keys) {
    const t = Date.parse(`${k}T12:00:00Z`);
    run = prev !== null && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

/**
 * input: { skills: [{id, unit, area, grade, higher}] (the skills that count, e.g. the learner's tier),
 *          units: [{id, title}], areas: [{id}], completions, days, attempted, checks: {unitId: …},
 *          mocks: [{grade}], read: {pageId: …} }
 */
export function achievementContext(input) {
  const { skills, units, areas } = input;
  const ids = new Set(skills.map((s) => s.id));
  const done = Object.entries(input.completions || {}).filter(([id]) => ids.has(id));
  const doneIds = new Set(done.map(([id]) => id));
  const byId = Object.fromEntries(skills.map((s) => [s.id, s]));
  const doneSkills = [...doneIds].map((id) => byId[id]);
  const liveUnits = units.filter((u) => skills.some((s) => s.unit === u.id));
  const perDay = {};
  done.forEach(([, c]) => { const d = localDay(c.at); perDay[d] = (perDay[d] || 0) + 1; });
  const inGrades = (lo, hi) => skills.filter((s) => s.grade >= lo && s.grade <= hi);
  return {
    totalSkills: skills.length,
    completedCount: doneIds.size,
    completions: done.map(([, c]) => c),
    masteredGrades: new Set(doneSkills.map((s) => s.grade)),
    gradesTouched: new Set(doneSkills.map((s) => s.grade)).size,
    topGrade: Math.max(0, ...skills.map((s) => s.grade)),
    gradeTotal: (lo, hi) => inGrades(lo, hi).length,
    gradeDone: (lo, hi) => inGrades(lo, hi).filter((s) => doneIds.has(s.id)).length,
    hasHigher: skills.some((s) => s.higher),
    higherDone: doneSkills.filter((s) => s.higher).length,
    areaCount: areas.filter((a) => skills.some((s) => s.area === a.id)).length,
    areasTouched: new Set(doneSkills.map((s) => s.area)).size,
    bestDay: Math.max(0, ...Object.values(perDay)),
    bestStreak: longestStreak(input.days),
    attempted: input.attempted || 0,
    unitCount: liveUnits.length,
    checksTaken: Object.keys(input.checks || {}).filter((id) => liveUnits.some((u) => u.id === id)).length,
    pagesRead: Object.keys(input.read || {}).length,
    mocksTaken: (input.mocks || []).length,
    bestMockGrade: Math.max(0, ...(input.mocks || []).map((m) => m.grade || 0)),
    unitTitle: (id) => units.find((u) => u.id === id)?.title ?? id,
    unitTotal: (id) => skills.filter((s) => s.unit === id).length,
    unitDone: (id) => skills.filter((s) => s.unit === id && doneIds.has(s.id)).length,
  };
}

/** Every achievement that applies, with its text resolved and whether its condition holds now. */
export function evaluateAchievements(input) {
  const ctx = achievementContext(input);
  const text = (v) => (typeof v === 'function' ? v(ctx) : v);
  return ACHIEVEMENTS.map((a) => {
    const { value, target } = a.measure(ctx);
    return {
      id: a.id, group: a.group, title: a.title, icon: a.icon, unitId: a.unitId,
      requirement: text(a.requirement), flavour: text(a.flavour),
      value: Math.min(value, target), target, met: target > 0 && value >= target, badge: badgeUrl(a.id),
    };
  }).filter((a) => a.target > 0); // e.g. a Higher-only topic for a Foundation learner
}
