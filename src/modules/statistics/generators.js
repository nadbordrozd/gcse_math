// Question generators for the statistics module. See docs/GENERATOR_GUIDELINES.md.
// Archetypes live in four gen-*.js files grouped like the taxonomy units; the chart library is charts.js.
import { generators as averages } from './gen-averages.js';
import { generators as charts } from './gen-charts.js';
import { generators as data } from './gen-data.js';
import { generators as higher } from './gen-higher.js';

// Order follows the taxonomy (skills.js).
const ORDER = ['stat-averages-list', 'stat-averages-problems', 'stat-frequency-table', 'stat-grouped-estimate', 'stat-compare',
  'stat-bar-pictograms', 'stat-line-graphs', 'stat-sampling', 'stat-stem-leaf', 'stat-pie-charts', 'stat-scatter',
  'stat-frequency-polygon', 'stat-capture-recapture', 'stat-cumulative-frequency', 'stat-box-plots', 'stat-histograms'];
const all = [...averages, ...charts, ...data, ...higher];
export const generators = [...all].sort((a, b) => ORDER.indexOf(a.skillId) - ORDER.indexOf(b.skillId));
