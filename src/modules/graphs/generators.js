// Question generators for the graphs module (sequences, straight lines, non-linear graphs, real-life graphs,
// functions). See docs/GENERATOR_GUIDELINES.md. Archetypes live in topic files and are grouped here in
// taxonomy order.
import { sequenceGenerators } from './sequences.js';
import { linearGenerators } from './linear.js';
import { nonlinearGenerators } from './nonlinear.js';
import { reallifeGenerators } from './reallife.js';
import { functionGenerators } from './functions.js';

export const generators = [
  ...sequenceGenerators,
  ...linearGenerators,
  ...nonlinearGenerators,
  ...reallifeGenerators,
  ...functionGenerators,
];
