import { baseFont, breaks, colors } from "../constants/constants.js";

/**
 * Create a Chart.js instance and return it.
 * @param {string}  canvasId  - DOM id of the canvas
 * @param {string}  type      - 'line' | 'bar' | 'scatter' …
 * @param {object}  data      - Chart.js data object
 * @param {object}  options   - merged on top of baseOptions
 */

export function createChart(canvasId, type, data, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  // @ts-ignore
  const ctx = canvas.getContext('2d');
  // @ts-ignore
  return new Chart(ctx, { type, data, options: baseOptions(options) });
}

export function baseOptions(overrides = {}) {
  // @ts-ignore
  return Chart.helpers.merge({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600 },
    plugins: {
      legend: {
        labels: { font: baseFont, color: colors.ink3, boxWidth: 12, padding: 16 },
      },
      tooltip: {
        backgroundColor: colors.ink,
        titleFont: baseFont,
        bodyFont: baseFont,
        padding: 10,
        callbacks: {},
      },
    },
    scales: {
      x: {
        grid: { color: colors.border, lineWidth: 0.5 },
        ticks: { font: baseFont, color: colors.ink3 },
      },
      y: {
        grid: { color: colors.border, lineWidth: 0.5 },
        ticks: { font: baseFont, color: colors.ink3 },
        beginAtZero: true,
      },
    },
  }, overrides);
}


export const axisTickFormatters = {
  millionEuro: value => `${value} M€`,
  percent: value => `${value}%`,
  identity: value => value,
};

export const tooltipLabelFactories = {
  millionEuro: fractionDigits => ctx =>
    ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(fractionDigits)} M€`,
  percent: fractionDigits => ctx =>
    ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(fractionDigits)}%`,
  plainNumber: fractionDigits => ctx =>
    ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(fractionDigits) ?? '—'}`,
};


/**
 * Build Chart.js annotation plugin config for the three structural breaks.
 * Only include years that exist in the provided labels array.
 */
export function buildSummaryBreakAnnotations(labels) {
  const annotations = {};
  breaks.forEach(({ x, label, color }) => {
    if (!labels.includes(x)) return;
    annotations[`line_${x}`] = {
      type: 'line',
      scaleID: 'x',
      value: x,
      borderColor: color,
      borderWidth: 1.5,
      borderDash: [4, 3],
      label: {
        content: label,
        display: true,
        position: 'start',
        backgroundColor: color,
        font: { ...baseFont, size: 10 },
        padding: { x: 5, y: 3 },
      },
    };
  });
  return annotations;
}

export function buildCaseStudyBreakAnnotations(labels) {
  return breaks
    .filter(({ x }) => labels.includes(x))
    .reduce((acc, { x, label, color }) => {
      acc[`line_${x}`] = {
        type: 'line', scaleID: 'x', value: x,
        borderColor: color, borderWidth: 1.5, borderDash: [4, 3],
        label: {
          content: label, display: true, position: 'start',
          backgroundColor: color,
          font: { ...baseFont, size: 10 }, padding: { x: 5, y: 3 },
        },
      };
      return acc;
    }, {});
}
