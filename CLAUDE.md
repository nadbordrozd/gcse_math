# Project Instructions for AI Agents

This file provides instructions and context for AI coding agents working on this project.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:1105d646 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/core-concepts/sync-concepts.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->


## Build & Test

No build step: plain ES modules served statically (GitHub Pages from `main` /).

```bash
npm install                              # only needed for tests (KaTeX)
python3 -m http.server 8077              # then open http://localhost:8077 (dev mode on localhost)
node tests/validate.mjs [module|skill|archetype]   # must pass before committing generators
node tests/sample.mjs <archetype|skill|module> --n=3 [--png=/tmp/dir]  # eyeball questions/diagrams
node tests/validate-sync.mjs              # progress links: round trip and merge rules
node tests/validate-achievements.mjs      # achievements: creatures per topic, badge recipes, evaluation
node tools/badges/badges.mjs generate all-missing --takes 2   # PixelLab badges (needs PIXELLAB_API_KEY; costs ~1p each)
node tools/badges/badges.mjs sheet        # contact sheet of takes; then: accept <id> <seed> (updates src/badges-available.js)
```

## Architecture Overview

- `src/core.js` – generator helpers (seeded RNG, Frac, number/TeX formatting, options, typed answers).
- `src/svg.js` – SVG diagram primitives. Diagrams are strings so generators stay pure and testable in Node.
- `src/modules/<module>/skills.js` – taxonomy: units → skills (grade 1–9, prereqs, higher flag).
- `src/modules/<module>/generators.js` – question archetypes (`gen(id, skillId, build, meta)`).
- `src/registry.js` – loads all modules (each independently), builds SKILLS/UNITS/GENERATORS and the prereq graph.
- `src/app/` – the UI: `main.js` (router), `home.js`, `practice.js`, `check.js` (adaptive quick checks),
  `mock.js` (mock exams), `pages.js` (study plan, settings, about), `state.js` (localStorage), `plan.js`.
- `src/sync.js` – progress links (`#/sync/<code>`, deflated state in the URL fragment) and the idempotent merge; UI in `src/app/transfer.js`.
- `src/achievements.js` – achievement definitions (pure; trophies + one creature per unit). `src/app/awards.js` – earning,
  toasts, the #/achievements page and the mastery celebration (fanfare, confetti, back to topic on first mastery).
- `assets/sfx/` – sound effects (shared with the 11+ site); `assets/badges/` – accepted PixelLab badges (emoji until then).
- `reference_papers/` – git-ignored real AQA papers used as private reference for question types.

## Conventions & Patterns

- Read `docs/GENERATOR_GUIDELINES.md` before writing or changing generators.
- Maths in question text is `$TeX$` rendered by KaTeX; never use `$` for money.
- Skill ids are referenced across modules as prerequisites: never rename or delete one without updating references.
