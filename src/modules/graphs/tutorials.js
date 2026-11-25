// Tutorials ("Learn" pages) for the graphs module. See docs/TUTORIAL_GUIDELINES.md.
// The pages live in topic files; this file collects them in taxonomy order.
import { sequenceTutorials } from './tut-sequences.js';
import { lineTutorials } from './tut-lines.js';
import { curveTutorials } from './tut-curves.js';
import { reallifeTutorials } from './tut-reallife.js';
import { functionTutorials } from './tut-functions.js';

export const tutorials = [
  ...sequenceTutorials,
  ...lineTutorials,
  ...curveTutorials,
  ...reallifeTutorials,
  ...functionTutorials,
];
