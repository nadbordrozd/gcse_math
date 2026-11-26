// Moving progress between devices without accounts: the whole progress travels inside a link
// (#/sync/<code>, compressed). The fragment never reaches a server. Opening the link merges it into
// the progress already on that device. The merge is idempotent and order-free, so opening an old link
// or the same link twice does no harm, and the learner can go back and forth between devices.
// Pure apart from CompressionStream, so it runs in Node for the tests.

const MASTERY = 100;

const later = (a, b, key = 'at') => ((b?.[key] ?? 0) > (a?.[key] ?? 0) ? b : a);
const keyed = (a = {}, b = {}, pick) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = k in out ? pick(out[k], v) : v;
  return out;
};
const lastActive = (s) => Math.max(0, ...Object.values(s.skills || {}).map((r) => r.lastSeen || 0));

/**
 * Older progress kept quick-check results in `assess`; they now live in `marks` ("I know this" / "To do"),
 * which the learner can also set by hand and which are independent of points.
 * marks: skillId -> { mark: 'know'|'todo', by: 'me'|'check'|'inferred', at }
 */
export function upgradeState(s) {
  if (!s) return s;
  s.marks = { ...(s.marks || {}) };
  for (const [id, a] of Object.entries(s.assess || {})) {
    if (!a || a.source === 'mastered' || s.marks[id]) continue; // 'mastered' was only a copy of the points
    s.marks[id] = { mark: a.status === 'secure' ? 'know' : 'todo', by: a.source === 'inferred' ? 'inferred' : 'check', at: a.at || 0 };
  }
  delete s.assess;
  return s;
}

/** Combine this device's progress (mine) with progress from another device (theirs). */
export function mergeStates(mine, theirs) {
  mine = upgradeState({ ...mine });
  theirs = upgradeState({ ...theirs });
  const skills = keyed(mine.skills, theirs.skills, (a, b) => {
    // The most recently practised record wins; a skill mastered on either device stays mastered.
    const r = { ...later(a, b, 'lastSeen') };
    r.archetypes = keyed(a.archetypes, b.archetypes, (x, y) => (y.a > x.a ? y : x));
    if (Math.max(a.points || 0, b.points || 0) >= MASTERY) r.points = MASTERY;
    return r;
  });
  for (const id of Object.keys(skills)) if (!skills[id].archetypes) skills[id] = { ...skills[id], archetypes: {} };
  const union = (xs = [], ys = [], id) => {
    const seen = new Map(xs.map((x) => [id(x), x]));
    for (const y of ys) if (!seen.has(id(y))) seen.set(id(y), y);
    return [...seen.values()];
  };
  const themIsNewer = lastActive(theirs) > lastActive(mine);
  return {
    ...mine,
    schema: 1,
    // Tier, name and answer style follow the learner; the theme belongs to the device.
    settings: { ...mine.settings, ...pickSettings(theirs.settings), theme: mine.settings?.theme ?? 'auto' },
    skills,
    marks: keyed(mine.marks, theirs.marks, (a, b) => later(a, b)),
    checks: keyed(mine.checks, theirs.checks, (a, b) => later(a, b)),
    mocks: union(mine.mocks, theirs.mocks, (m) => m.at).sort((a, b) => a.at - b.at),
    flagged: union(mine.flagged, theirs.flagged, (f) => `${f.at}|${f.archetype}|${f.seed}`),
    tally: {
      attempted: Math.max(mine.tally?.attempted || 0, theirs.tally?.attempted || 0),
      correct: Math.max(mine.tally?.correct || 0, theirs.tally?.correct || 0),
    },
    days: keyed(mine.days, theirs.days, Math.max),
    last: themIsNewer ? theirs.last ?? mine.last : mine.last ?? theirs.last,
    completions: keyed(mine.completions, theirs.completions, (a, b) => (b.at < a.at ? b : a)),
    achievements: keyed(mine.achievements, theirs.achievements, Math.min),
    read: keyed(mine.read, theirs.read, Math.max),
  };
}

function pickSettings(s = {}) {
  const out = {};
  for (const k of ['tier', 'answerMode', 'name']) if (s[k] !== undefined) out[k] = s[k];
  return out;
}

/** A short description of some progress, for the confirmation screen. */
export function summarize(s) {
  const skills = Object.values(s.skills || {});
  return {
    mastered: skills.filter((r) => r.points >= MASTERY).length,
    started: skills.filter((r) => r.attempts > 0).length,
    answered: s.tally?.attempted || 0,
    achievements: Object.keys(s.achievements || {}).length,
    lastActive: lastActive(s) || null,
    name: s.settings?.name || '',
  };
}

// ---------- encoding ----------

const b64url = (bytes) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

/** What travels: everything except the theme (per device) and per-question-type counts (only used for variety). */
function payload(s) {
  const skills = Object.fromEntries(Object.entries(s.skills || {}).map(([id, r]) => {
    const { archetypes, ...rest } = r;
    void archetypes;
    return [id, rest];
  }));
  const { theme, ...settings } = s.settings || {};
  void theme;
  return { ...s, settings, skills };
}

/** Progress → link code. "z" codes are deflated; "j" codes are plain JSON for browsers without compression. */
export async function encodeProgress(s) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload(s)));
  if (typeof CompressionStream === 'function') {
    try { return `z${b64url(await pipe(bytes, new CompressionStream('deflate-raw')))}`; } catch { /* fall through */ }
  }
  return `j${b64url(bytes)}`;
}

/** Link code → progress, or throws if the code is damaged. */
export async function decodeProgress(code) {
  const kind = code[0];
  let bytes = unb64url(code.slice(1));
  if (kind === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  else if (kind !== 'j') throw new Error('Unknown link format');
  const s = JSON.parse(new TextDecoder().decode(bytes));
  if (s?.schema !== 1 || typeof s.skills !== 'object') throw new Error('Not a progress link');
  return upgradeState(s);
}
