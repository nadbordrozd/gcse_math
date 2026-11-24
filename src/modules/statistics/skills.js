export const units = [
  {
    id: 'stat-averages', area: 'statistics', title: 'Averages and spread',
    blurb: 'Mean, median, mode and range, from lists and frequency tables.',
    skills: [
      { id: 'stat-averages-list', title: 'Mean, median, mode and range', grade: 2, prereqs: ['num-written-methods'], summary: 'Find averages and range from a list of data.' },
      { id: 'stat-averages-problems', title: 'Problems with averages', grade: 4, prereqs: ['stat-averages-list'], summary: 'Find a missing value from the mean, combine means and work backwards.' },
      { id: 'stat-frequency-table', title: 'Averages from frequency tables', grade: 4, prereqs: ['stat-averages-list'], summary: 'Mean, median and mode from an ungrouped frequency table.' },
      { id: 'stat-grouped-estimate', title: 'Grouped data', grade: 5, prereqs: ['stat-frequency-table'], summary: 'Estimate the mean, and find the modal class and the class containing the median.' },
      { id: 'stat-compare', title: 'Comparing distributions', grade: 4, prereqs: ['stat-averages-list'], summary: 'Compare two sets of data using an average and a measure of spread.' },
    ],
  },
  {
    id: 'stat-charts', area: 'statistics', title: 'Charts and diagrams',
    blurb: 'Collecting data, bar charts, pie charts, stem-and-leaf, scatter graphs and frequency polygons.',
    skills: [
      { id: 'stat-bar-pictograms', title: 'Tables, bar charts and pictograms', grade: 1, prereqs: [], summary: 'Read and interpret tally charts, bar charts (including dual and composite) and pictograms.' },
      { id: 'stat-line-graphs', title: 'Line graphs and time series', grade: 2, prereqs: ['stat-bar-pictograms'], summary: 'Read time series graphs, describe trends and compare two series.' },
      { id: 'stat-sampling', title: 'Data and sampling', grade: 3, prereqs: [], summary: 'Types of data, bias in samples and questionnaires, and estimating from a sample.' },
      { id: 'stat-stem-leaf', title: 'Stem-and-leaf diagrams', grade: 3, prereqs: ['stat-averages-list'], summary: 'Read stem-and-leaf diagrams (including back-to-back) and find averages from them.' },
      { id: 'stat-pie-charts', title: 'Pie charts', grade: 4, prereqs: ['stat-bar-pictograms', 'geo-angle-basics', 'num-fraction-of-amount'], summary: 'Calculate pie chart angles, read values and totals, and compare pie charts.' },
      { id: 'stat-scatter', title: 'Scatter graphs', grade: 4, prereqs: ['gr-coordinates'], summary: 'Correlation, lines of best fit, outliers and estimating values.' },
      { id: 'stat-frequency-polygon', title: 'Frequency polygons', grade: 5, prereqs: ['stat-grouped-estimate'], summary: 'Plot and read frequency polygons drawn at class midpoints, and compare two.' },
      { id: 'stat-capture-recapture', title: 'Capture–recapture', grade: 6, prereqs: ['stat-sampling', 'rat-direct-proportion'], summary: 'Estimate a population size by capture–recapture, and know its assumptions.' },
    ],
  },
  {
    id: 'stat-higher', area: 'statistics', title: 'Cumulative frequency, box plots and histograms',
    blurb: 'Quartiles, cumulative frequency, box plots and histograms (Higher).',
    skills: [
      { id: 'stat-cumulative-frequency', title: 'Cumulative frequency', grade: 6, prereqs: ['stat-grouped-estimate'], summary: 'Read medians, quartiles and estimates from cumulative frequency graphs.' },
      { id: 'stat-box-plots', title: 'Quartiles and box plots', grade: 6, prereqs: ['stat-averages-list'], summary: 'Find quartiles and the interquartile range; draw and compare box plots.' },
      { id: 'stat-histograms', title: 'Histograms', grade: 8, prereqs: ['stat-grouped-estimate'], summary: 'Use frequency density in histograms with unequal class widths, including missing scales and part-bars.' },
    ],
  },
];
