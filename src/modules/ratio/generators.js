// Question generators for the Ratio, proportion and rates of change module.
// See docs/GENERATOR_GUIDELINES.md. The archetypes live in one file per unit:
//   gen-ratio.js (Ratio), gen-percent.js (Percentages), gen-proportion.js (Proportion),
//   gen-measures.js (Measures and rates); shared helpers are in helpers.js.
import { ratioGenerators } from './gen-ratio.js';
import { percentGenerators } from './gen-percent.js';
import { proportionGenerators } from './gen-proportion.js';
import { measuresGenerators } from './gen-measures.js';

export const generators = [...ratioGenerators, ...percentGenerators, ...proportionGenerators, ...measuresGenerators];
