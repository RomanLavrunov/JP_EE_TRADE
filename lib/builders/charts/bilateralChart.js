import { colors } from "../../constants/constants.js";
import { buildSummaryBreakAnnotations, createChart } from "../../utils/helpers.js";

/**
 * Chart 1: Bilateral exports & imports over time
 * @param {any[]} bilateral
 */

export function buildBilateralChart(bilateral) {
  const labels = bilateral.map(r => String(r.year));

  return createChart('chartBilateral', 'line', {
    labels,
    datasets: [
      {
        label: 'Exports',
        data: bilateral.map(r => r.exports),
        borderColor: colors.exports,
        backgroundColor: 'rgba(29,53,87,.08)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 3,
      },
      {
        label: 'Imports',
        data: bilateral.map(r => r.imports),
        borderColor: colors.imports,
        backgroundColor: 'rgba(192,57,43,.06)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 3,
      },
    ],
  }, {
    plugins: {
      annotation: { annotations: buildSummaryBreakAnnotations(labels) },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} M€`,
        },
      },
    },
    scales: {
      y: { ticks: { callback: v => v + ' M€' } },
    },
  });
}