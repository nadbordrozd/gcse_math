# Tutorial ("Learn" page) guidelines

The Learn pages are a graph of short tutorials. A question's solution may assume a method (say, the sine rule)
and link to its page; that page explains the method in terms of earlier ideas and links to *their* pages, and so on
back to the basics. It is not a full textbook: it is for a **good student who has not met the topic yet but has the
prerequisites** – they should be able to read one page in 5–10 minutes and then answer the questions.

Read `src/modules/trig/tutorials.js` first: the three pages there (trig basics → finding an angle → sine rule) are
the reference for tone, depth and structure.

## Data

Each module has `src/modules/<module>/tutorials.js` exporting `tutorials`:

```js
import { h, h3, p, list, steps, key, display, note, mistake, figure, columns, example, tbl } from '../../tutorial-kit.js';

export const tutorials = [
  {
    id: 'trig-sine-rule',                 // = the main skill id it teaches
    title: 'The sine rule',
    skills: ['trig-sine-rule'],           // skills this page teaches (questions in these skills link here)
    prereqs: ['trig-sohcahtoa-side', 'geo-angles-triangles'],  // pages it builds on ("Before you start")
    summary: 'One sentence: what you will be able to do.',
    body: [ h('…'), p('…'), key('…', display('…')), example(…), … ].join(''),
  },
];
```

- **Coverage:** every skill in the module must be taught by at least one page (`skills`). Usually one page per skill.
  Combine two skills on one page when they are really one idea (list both in `skills`), or give a big skill two pages
  when it contains two separate ideas. Aim for pages a student can finish in one sitting.
- **ids:** a page's id is the id of the main skill it teaches. Links and prereqs may use **any skill id** – it
  resolves to the page that teaches that skill – so you can link to other modules' pages before they are written.
- **prereqs:** the pages a reader should know first. Usually the conceptually relevant subset of the skill's
  taxonomy prerequisites (2–4 is typical), possibly from other modules. No cycles. Very basic pages may have none.
- **Links:** `[[skill-or-page-id]]` (uses the page title) or `[[id|link text]]` anywhere outside `$…$`.
  Link the first mention of an earlier idea where the reader might need it, not every mention. Never put `$` in link text.

## Structure of a page

Use the helpers from `src/tutorial-kit.js`. A good page usually has:

1. **The big idea / why** – one or two short paragraphs connecting to what the reader already knows (with links).
2. **Key fact box** (`key`) – the rule, formula or definition, with `display()` for formulas.
3. **Where it comes from** – a short, honest justification when one exists at GCSE level (a diagram helps).
   Skip it when it would be long or beyond GCSE.
4. **Method** (`steps`) – the recipe, in the order you actually do it.
5. **Worked examples** (`example`) – 2–4, from straightforward to exam-style, covering the main variants that
   the module's question types ask (e.g. unknown on top vs bottom; finding a side vs an angle; a word problem).
   Show every step with real numbers.
6. **Common mistakes** (`mistake`) and **sense checks / tips** (`note`).
7. **What next?** – one line linking forward to the natural next pages.

Length: roughly 300–1200 words of text. Clear, friendly UK English for a 13–15-year-old. No "simply" or
"obviously". Define every new word the first time it appears. Original writing only – do not copy textbooks.

## Maths and numbers

- `$…$` for inline TeX, `display('…')` for a formula on its own line. `\lt`/`\gt` inside TeX, never raw `<`/`>`.
  Use `\dfrac` for fractions inside running text when they need to be readable, `\times`, `\div`, `^\circ`.
- **Check every number in every worked example with node** before writing it down. Wrong examples are the worst
  possible bug on a page meant to teach. State rounding ("to 1 decimal place") and round only at the end.
- JS strings: inside single-quoted strings a TeX backslash is written `\\` (e.g. `'$\\frac{a}{b}$'`).

## Diagrams

Use `src/svg.js` (and your module's diagram helpers) via `figure(svgString, caption)` or `example(..., { visual })`.
Diagrams must match the text and numbers. Check them: `node tests/tutorial-preview.mjs <page-id> --png=/tmp/tut`
prints the page as text and writes each SVG as a PNG you can open with the Read tool.

## Linking questions to pages

- By default every question links ("📖 New to this?") to the pages whose `skills` include the question's skill.
- If a question type mainly needs a *different or additional* page (e.g. a bearings word problem solved with the sine
  rule, or a perimeter question that needs Pythagoras), add `learn: ['trig-sine-rule', …]` to that archetype's meta
  (`gen(id, skill, build, { title, learn: [...] })`). It replaces the default list, so include the skill's own page too
  if it is still relevant. Check that your module's `gen` wrapper passes the meta through.
- Solution steps may also contain `[[links]]` at the step where a technique is used ("Use [[trig-sine-rule|the sine rule]]").
  Use judgement: link where a student who is stuck would want to read more, not everywhere.

## Validation

`node tests/validate-tutorials.mjs <module>` must pass (links resolve, no cycles, KaTeX renders, markup balanced).
Links to skills whose page does not exist yet are warnings while pages are being written; the final gate is
`node tests/validate-tutorials.mjs --strict`, which also requires every skill to have a page.
Generators must still pass `node tests/validate.mjs <module>` if you touch them.
