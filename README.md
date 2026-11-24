# GCSE Maths practice

A dependency-free practice site for GCSE Mathematics (9–1), Foundation and Higher tier, from grade 1 to grade 9.
Live at <https://nadbordrozd.github.io/gcse_math/>.

- **Topics → skills.** The course is split into six areas, ~38 topics and ~180 skills. Each skill shows the typical
  GCSE grade it belongs to and whether it is Higher-only. Every skill is open from the start.
- **Generated questions.** Each skill has several question types modelled on real GCSE papers. Questions are
  generated fresh (new numbers, contexts and diagrams) every time, with misconception-based wrong options and a
  worked solution.
- **Points and levels.** +7 for a correct answer (+3 with a hint), −10 for a wrong one; 100 points masters a skill.
  Questions get harder as points rise (warm-up → standard → challenge).
- **Quick checks.** A 3–6 question adaptive test per topic (about 5 minutes) that maps out which skills are secure
  and where to start. It feeds the study plan but never locks anything.
- **Study plan.** Needs practice / in progress / ready to learn (all prerequisites secure).
- **Mock exams.** Optional timed papers (Foundation or Higher, calculator or not), easiest first, with typed answers
  where possible, marks, a rough grade estimate and a full review.
- **Mixed practice** across skills already started, weighted towards ones not seen for a while.
- Choice or typed answers, dark mode, progress export/import, and a "Report" button for bad questions.

Progress is stored in the browser (`localStorage`, key `gcse_maths_state_v1`).

## Development

```sh
npm install                       # KaTeX for the test suite
python3 -m http.server 8077       # open http://localhost:8077 (developer mode is on for localhost or ?dev)
node tests/validate.mjs           # validate every generator (200 seeds × 3 difficulties)
node tests/sample.mjs <archetype|skill|module> --n=3 --png=/tmp/png   # read sample questions / render diagrams
```

Generator rules are in [`docs/GENERATOR_GUIDELINES.md`](docs/GENERATOR_GUIDELINES.md). Real AQA papers used as
reference for question types live in `reference_papers/` and are not committed.

Work is tracked with [beads](https://github.com/gastownhall/beads) (`bd ready`, `bd list`).
