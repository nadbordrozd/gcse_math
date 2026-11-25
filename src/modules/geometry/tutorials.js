// Learn pages (tutorials) for the Geometry module. See docs/TUTORIAL_GUIDELINES.md.
// Pages are written per unit in tut-*.js and reuse the module's diagram helpers.
import { angleTutorials } from './tut-angles.js';
import { shapeTutorials } from './tut-shapes.js';
import { areaTutorials } from './tut-area.js';
import { volumeTutorials } from './tut-volume.js';
import { transformTutorials } from './tut-transform.js';

export const tutorials = [
  ...angleTutorials,
  ...shapeTutorials,
  ...areaTutorials,
  ...volumeTutorials,
  ...transformTutorials,
];
