// Question generators for the Number module. See docs/GENERATOR_GUIDELINES.md.
// The archetypes live in one file per unit; this file just collects them in taxonomy order.
import { generators as calcGens } from './calc.js';
import { generators as factorGens } from './factors.js';
import { generators as fractionGens } from './fractions.js';
import { generators as fdpGens } from './fdp.js';
import { generators as powerGens } from './powers.js';
import { generators as roundingGens } from './rounding.js';
import { generators as surdGens } from './surds.js';

export const generators = [
  ...calcGens,
  ...factorGens,
  ...fractionGens,
  ...fdpGens,
  ...powerGens,
  ...roundingGens,
  ...surdGens,
];
