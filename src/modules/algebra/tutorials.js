// Learn pages for the Algebra module. See docs/TUTORIAL_GUIDELINES.md.
// The pages live in topic files in this folder; this file collects them in taxonomy order.
import { tutorials as expressions } from './tutorials-expressions.js';
import { tutorials as equations } from './tutorials-equations.js';
import { tutorials as formulae } from './tutorials-formulae.js';

export const tutorials = [...expressions, ...equations, ...formulae];
