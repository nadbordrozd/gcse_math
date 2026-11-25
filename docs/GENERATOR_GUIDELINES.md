# Question generator guidelines

These rules apply to every question generator in the GCSE maths practice site.

## Who it is for

A student (initially a 13-year-old) preparing for GCSE Mathematics (9–1), both Foundation and Higher tier. She
will often sit down for 15 minutes, so questions should be quick to read, unambiguous, and feel like the
real exam. Coverage is the whole specification, from the very easiest grade-1 questions to grade-9 ones.

## Model

- **Area → Unit → Skill → Archetype.** Areas are the six DfE content areas. Units group 2–7 related skills.
  A **skill** is what the student sees and practises (e.g. "Pythagoras' theorem"). An **archetype** is an
  internal question type within a skill (e.g. "find the hypotenuse from a diagram", "ladder against a wall").
- A practice session for a skill mixes all of its archetypes at random.
- Each archetype supports three difficulties: `easy`, `medium`, `hard`. Skill progress picks the level.
  Easy is the most accessible form of the skill (round numbers, one step, clear cues); hard is the
  top-end exam version of the same skill (awkward numbers, extra step, less scaffolding).
- Split something into a **separate skill** only when the method genuinely changes (finding a side vs finding
  an angle with trigonometry). Harder numbers or one extra step is a difficulty level, not a new skill.

## Where the question types come from

Real AQA papers (2017–2023, Foundation and Higher, with mark schemes) are in `reference_papers/` (git-ignored,
private reference only):

- `reference_papers/text/AQA-8300{1,2,3}{F,H}-QP-<series>.txt` – question papers as text (`-layout`).
- `reference_papers/text/*-MS-*.txt` – mark schemes (accepted answers, common methods).
- `reference_papers/aqa/*.PDF` – originals. To *see* a diagram, render a page:
  `pdftoppm -png -r 70 -f 7 -l 7 reference_papers/aqa/AQA-83001H-QP-JUN19.PDF /tmp/p` then Read `/tmp/p-07.png`.

Before writing generators for a skill, grep the papers for it (e.g. `grep -l -i "bearing" reference_papers/text/*QP*`)
and read several real questions. List the distinct question *types* that appear and implement an archetype for
each one that can be asked with a single answer. Aim for **2–6 archetypes per skill**; skills that appear a lot
in papers deserve more. Never copy wording, numbers or diagrams verbatim – write original questions of the same type.

## Generator contract

```js
import { gen, pick, int, size, frac, num, tnum, money } from '../../core.js';

export const pythagHyp = gen('trig-pyth-hyp-diagram', 'trig-pythagoras', (rng, d) => {
  // ...choose numbers by difficulty with size(d, easy, medium, hard)...
  return {
    prompt: 'HTML text with $TeX$ maths',
    visual: svgString,          // optional diagram/table (SVG or HTML string)
    answer: '$13$ cm',          // display text of the correct option
    distractors: [...],         // plausible wrong answers, misconception-based first
    typed: { kind: 'number', value: 13 },  // optional, see below
    calculator: true,           // optional: question needs a calculator
    solution: ['step 1', 'step 2', 'Answer: ...'],
    hint: 'optional nudge shown before answering',
  };
}, { title: 'Hypotenuse from a diagram', word: false });
```

- `gen(id, skillId, build, meta)`. Archetype ids are unique, kebab-case and start with the skill's prefix
  (`num-`, `alg-`, `seq-`, `gr-`, `rat-`, `geo-`, `trig-`, `prob-`, `stat-`). `meta.title` is a short
  description shown in the developer view. Set `meta.word: true` for word-problem archetypes.
- Export every archetype in the module's `generators` array, grouped by skill in taxonomy order.
- Generators must be pure and deterministic: use only the `rng` passed in (never `Math.random`).
- Retry-on-throw is built in: if a random parameter set is unsuitable you may `throw` and a nearby seed is used,
  but don't rely on it for more than an occasional case.

### Options

- 5 options by default. Use `count: 4` (or fewer) only when 5 would be silly (e.g. "Which statement is true?",
  "Which graph…?", always/sometimes/never with 3 options, true/false with 2).
- Distractors must be **plausible mistakes**: wrong operation, misread diagram, forgot to halve, added instead of
  multiplied, used diameter for radius, sign error, inverted ratio, forgot the constant, 90° vs 180°, etc.
  Only fall back to nearby values when you run out of genuine misconceptions.
- Options are deduplicated by text and by numeric value (`0.5` vs `$\frac{1}{2}$`), so supply more distractors than
  you need. If you can't produce 4 good distinct distractors, `buildOptions` throws – fix the generator.
- All options must be in the same form as the answer (same units, same number of dp, same notation).
- Set `keepOrder: true` when options have a natural order (e.g. "Always / Sometimes / Never").

### Typed answers

Whenever the answer is a single number, a coordinate pair, or a short list of numbers, add `typed`, which lets the
student type the answer instead of choosing (used in "type answers" mode and in mock exams):

- `{ kind: 'number', value: 13 }` – accepts `13`, `13 cm`, `13.0`. `value` may be a `Frac`.
  For rounded answers add `tolerance` (e.g. `0.05` for 1 dp) – accept anything that rounds correctly.
  For percentages give the percentage number (`value: 35` for 35%).
- `{ kind: 'coord', x: 2, y: -3 }` – accepts `(2, -3)` and `x = 2, y = -3`; optional `tolerance`.
- `{ kind: 'list', values: [2, -5] }` – e.g. two solutions of a quadratic, any order; optional `tolerance` for rounded values.
- `{ kind: 'text', accept: ['3x(x+2)', '3x(2+x)'] }` – only for short algebraic answers where you can list
  all reasonable forms; omit `typed` otherwise.

## Numbers and formatting

- Design the numbers backwards from a clean answer. Answers must be clean: integers, short terminating decimals,
  simple fractions, money to the penny, or explicitly rounded values ("Give your answer to 1 decimal place").
- If a question needs rounding, **say so in the prompt** and round with `roundTo`/`roundSf`. Never show
  floating-point artefacts. The validator fails anything with 4+ decimal places in visible text unless you set
  `longDecimalsOk: true` (only when long decimals are the point, e.g. calculator display questions).
- Use `num()` for plain-text numbers (adds thousands commas and a true minus sign), `tnum()` inside TeX,
  `money()` for pounds, `stdForm()` for standard form, `Frac`/`frac()` for exact fractions (`.tex()`),
  `poly()`/`terms()` to format algebra (`x^2 - 3x + 2`, never `1x` or `+ -3`).
- Maths goes in TeX between `$…$`: `$3x + 5 = 20$`, `$\frac{3}{4}$`, `$4 \times 7$`, `$\sqrt{48}$`, `$x^{2}$`, `$62^\circ$`.
  Use `\times` and `\div`, not `*` or `/`. Units may sit outside the maths: `$12$ cm` or `12 cm`.
  Never write a literal `$` for money – this is a UK site, use £.
  Write `\lt` / `\gt` (not raw `<` / `>`) inside TeX so the HTML stays valid.
- Plain HTML is fine outside maths: `<b>`, `<br>`, `<i>`, and tables built with `table()` from core.
- Use realistic UK contexts (£, metric units, UK names – `names(rng, k)` gives a diverse list).
- Mark calculator questions with `calculator: true` (decimals needing a calculator, trig, π to 1 dp, compound
  interest …). Non-calculator questions must be doable by hand.

## Diagrams

- Build diagrams with `src/svg.js` (`svg`, `polygon`, `line`, `text`, `angleMark`, `rightAngleMark`,
  `sideLabel`, `vertexLabel`, `equalTicks`, `parallelArrows`, `fit`, `plane`, `numberLine`, …).
  Module-specific diagram helpers go in your own module folder (e.g. `src/modules/geometry/diagrams.js`).
- Diagrams must agree with the question: an obtuse angle looks obtuse, the longer side looks longer, a right angle
  is marked. Add "Not drawn accurately" (`notDrawnAccurately`) when lengths/angles are not to scale, as real papers do.
  Graphs, grids, charts and anything the student must *read values from* must be accurate.
- Keep text legible: viewBox around 320–480 px wide, font size ≥ 13. Use `currentColor` (the default) for lines and
  text so the site's dark mode works; use the `FILL`, `FILL2`, `ACCENT`, `ACCENT2` constants for colour.
- Look at your diagrams: `node tests/sample.mjs <archetype-id> --n=3 --png=/tmp/gcse-png` writes PNGs you can open
  with the Read tool. Check labels don't overlap lines or each other.

## Word problems

- Word-problem archetypes need **at least 12 genuinely different contexts/templates** (`meta.word: true`; the
  validator counts distinct prompt structures). The context must matter to the maths (it decides the
  operation, the unit, the interpretation), not just wrap a calculation.
- Vary phrasing and the unknown (find the total / find a part / find the original …) where it is natural.

## Explanations

- `solution` is a list of 2–6 short steps shown after answering ("How to solve it"). Write for a 13-year-old:
  name the key idea first ("Angles on a straight line add up to $180^\circ$"), then show the working with the actual
  numbers in TeX, then end with `Answer: …`.
- When a distractor reflects a classic mistake, a step may warn about it ("Don't add the denominators!").
- `hint` (optional) is a nudge, not the first line of working.

## Validation

- `node tests/validate.mjs <module>` must pass with no failures and ideally no warnings. It checks, for 200 seeds ×
  3 difficulties per archetype: option count and uniqueness, the answer key, KaTeX rendering of every `$…$`, no
  NaN/undefined, no long decimals, balanced markup, typed answers that agree with the option answer, determinism,
  and variety (distinct questions, distinct answers, answer letter spread, word-problem templates).
- `node tests/sample.mjs <module|skill|archetype> --n=3` prints sample questions with options and solutions.
  Read a good number of them yourself – the validator cannot judge whether a question is realistic.
