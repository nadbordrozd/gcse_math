// Print a Learn page as plain text and optionally render its diagrams to PNG.
// Usage: node tests/tutorial-preview.mjs <page-id|module> [--png=DIR]
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { TUTORIALS, resolveTutorial } from '../src/registry.js';

const args = process.argv.slice(2);
const pngDir = (args.find((a) => a.startsWith('--png=')) || '').slice(6);
const targets = args.filter((a) => !a.startsWith('--'));
const pages = TUTORIALS.filter((t) => !targets.length || targets.includes(t.id) || targets.includes(t.module));
if (pngDir) mkdirSync(pngDir, { recursive: true });

const plain = (html) => String(html)
  .replace(/<svg[\s\S]*?<\/svg>/g, '\n[DIAGRAM]\n')
  .replace(/<h2>/g, '\n\n## ').replace(/<h3>/g, '\n\n### ').replace(/<\/h[23]>/g, '\n')
  .replace(/<li>/g, '\n  • ').replace(/<\/p>|<\/div>|<br\s*\/?>/g, '\n')
  .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2 [→$1]').replace(/\[\[([^\]]+)\]\]/g, '[→$1]')
  .replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n');

for (const t of pages) {
  console.log(`\n==================== ${t.id}: ${t.title} ====================`);
  console.log(`skills: ${t.skills.join(', ')}\nprereqs: ${(t.prereqs || []).map((p) => `${p}${resolveTutorial(p) ? '' : ' (no page yet)'}`).join(', ')}\n${t.summary}`);
  console.log(plain(t.body));
  if (pngDir) {
    [...t.body.matchAll(/<svg[\s\S]*?<\/svg>/g)].forEach((m, i) => {
      const base = `${pngDir}/${t.id}-${i + 1}`;
      writeFileSync(`${base}.svg`, `<?xml version="1.0"?>${m[0].replace(/var\(--[a-z0-9-]+,\s*([^)]+)\)/g, '$1').replace(/<svg /, '<svg width="560" ')}`);
      try { execFileSync('rsvg-convert', ['-b', 'white', '-o', `${base}.png`, `${base}.svg`]); console.log(`  -> ${base}.png`); } catch (e) { console.log(`  !! rsvg failed: ${e.message}`); }
    });
  }
}
