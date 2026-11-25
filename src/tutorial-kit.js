// Building blocks for tutorial ("Learn") pages. Every helper returns an HTML string; maths is $TeX$.
// Cross-links: write [[id]] or [[id|link text]] anywhere in a body. id may be a tutorial id or a skill
// id (resolved to the tutorial that teaches that skill). See docs/TUTORIAL_GUIDELINES.md.

/** Section heading. */
export const h = (title) => `<h2>${title}</h2>`;
/** Smaller sub-heading. */
export const h3 = (title) => `<h3>${title}</h3>`;
/** Paragraph(s): pass one string per paragraph. */
export const p = (...paras) => paras.map((x) => `<p>${x}</p>`).join('');
/** Bulleted list. */
export const list = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
/** Numbered method steps. */
export const steps = (items) => `<ol class="t-steps">${items.map((x) => `<li>${x}</li>`).join('')}</ol>`;
/** The key fact / formula / rule of the page, in a highlighted box. */
export const key = (title, html) => `<div class="t-key"><div class="t-key-title">${title}</div>${html}</div>`;
/** Display maths on its own line (TeX without the dollars). */
export const display = (tex) => `<div class="t-display">$\\displaystyle ${tex}$</div>`;
/** A tip or aside. */
export const note = (html) => `<div class="t-note">💡 ${html}</div>`;
/** A classic mistake to avoid. */
export const mistake = (html) => `<div class="t-mistake">⚠️ <b>Common mistake:</b> ${html}</div>`;
/** A diagram (SVG string from src/svg.js) with an optional caption. */
export const figure = (svgHtml, caption = '') => `<figure class="t-figure">${svgHtml}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
/** Side-by-side columns (e.g. two diagrams). */
export const columns = (...cols) => `<div class="t-cols">${cols.map((c) => `<div>${c}</div>`).join('')}</div>`;
/**
 * A worked example: a question, the steps of the solution, and the answer.
 * opts.visual: SVG shown with the question.
 */
export function example(title, question, workSteps, answer, { visual = '' } = {}) {
  return `<div class="t-example">
    <div class="t-example-title">${title}</div>
    <div class="t-example-q">${question}</div>${visual ? `<div class="t-example-visual">${visual}</div>` : ''}
    <ol class="t-example-steps">${workSteps.map((s) => `<li>${s}</li>`).join('')}</ol>
    <div class="t-example-a">Answer: ${answer}</div>
  </div>`;
}
/** A small table. rows: arrays of cell HTML; the first row is the header. */
export function tbl(rows) {
  return `<table class="qtable">${rows.map((r, i) => `<tr>${r.map((c) => (i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`)).join('')}</tr>`).join('')}</table>`;
}
