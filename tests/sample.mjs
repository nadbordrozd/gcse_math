// Print sample questions (and optionally render their diagrams to PNG) for eyeballing quality.
// Usage: node tests/sample.mjs <archetype-id|skill-id|module> [--n=4] [--difficulty=all|easy|medium|hard] [--png=DIR] [--seed=1]
// With --png, each visual is written as DIR/<archetype>-<difficulty>-<i>.png (needs rsvg-convert) so you can Read the image.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { GENERATORS, MODULES } from '../src/registry.js';
import { generateSafely } from '../src/core.js';

const args = process.argv.slice(2);
const opt = (k, dflt) => (args.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${dflt}`).split('=')[1];
const n = Number(opt('n', 4));
const diffArg = opt('difficulty', 'all');
const pngDir = opt('png', '');
const seed0 = Number(opt('seed', 1));
const targets = args.filter((a) => !a.startsWith('--'));
const moduleOf = new Map();
for (const [name, m] of Object.entries(MODULES)) for (const g of m.generators) moduleOf.set(g.id, name);
const gens = GENERATORS.filter((g) => !targets.length || targets.some((t) => t === g.id || t === g.skillId || t === moduleOf.get(g.id)));
const diffs = diffArg === 'all' ? ['easy', 'medium', 'hard'] : [diffArg];
const strip = (s) => String(s).replace(/<svg[\s\S]*?<\/svg>/g, '[SVG]').replace(/<br\s*\/?>/g, '\n').replace(/<\/(tr|p|div)>/g, '\n').replace(/<\/t[dh]>/g, ' | ').replace(/<[^>]+>/g, '');
if (pngDir) mkdirSync(pngDir, { recursive: true });

for (const g of gens) {
  console.log(`\n================ ${g.id} (${g.skillId}) ================`);
  for (const d of diffs) {
    for (let i = 0; i < n; i += 1) {
      const seed = (seed0 + i) * 104729 + d.length;
      const q = generateSafely(g, seed, { difficulty: d });
      console.log(`\n[${d} #${i + 1}]${q.calculator ? ' (calculator)' : ''}${q.typed ? ` typed:${JSON.stringify(q.typed)}` : ''}`);
      console.log(strip(q.prompt));
      if (q.visual) {
        console.log(q.visual.startsWith('<svg') ? '  [diagram]' : strip(q.visual));
        if (pngDir && q.visual.includes('<svg')) {
          const svgText = q.visual.match(/<svg[\s\S]*<\/svg>/)[0]
            .replace(/var\(--[a-z0-9-]+,\s*([^)]+)\)/g, '$1')
            .replace(/<svg /, '<svg width="560" ');
          const base = `${pngDir}/${g.id}-${d}-${i + 1}`;
          writeFileSync(`${base}.svg`, `<?xml version="1.0"?>${svgText}`);
          try { execFileSync('rsvg-convert', ['-b', 'white', '-o', `${base}.png`, `${base}.svg`]); console.log(`  -> ${base}.png`); } catch (e) { console.log(`  !! rsvg failed: ${e.message}`); }
        }
      }
      q.options.forEach((o) => console.log(`   ${o.id === q.answer ? '✔' : ' '} ${o.id}. ${strip(o.text)}`));
      console.log('   Solution:');
      q.solution.forEach((s) => console.log(`     • ${strip(s)}`));
    }
  }
}
