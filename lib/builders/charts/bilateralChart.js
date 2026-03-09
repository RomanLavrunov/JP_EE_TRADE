import { colors } from "../../constants/constants.js";
import { axisTickFormatters, tooltipLabelFactories, buildSummaryBreakAnnotations, createChart } from "../../utils/helpers.js";

/**
 * Chart 1: Bilateral exports & imports over time
 * @param {any[]} bilateralRows
 */

export function buildBilateralChart(bilateralRows) {
  const labels = bilateralRows.map(row => String(row.year));

  return createChart('chartBilateral', 'line', {
    labels,
    datasets: [
      {
        label: 'Exports',
        data: bilateralRows.map(row => row.exports),
        borderColor: colors.exports,
        backgroundColor: colors.exportsFillLight,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 3,
      },
      {
        label: 'Imports',
        data: bilateralRows.map(row => row.imports),
        borderColor: colors.imports,
        backgroundColor: colors.importsFillLight,
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
          label: tooltipLabelFactories.millionEuro(1),
        },
      },
    },
    scales: {
      y: { 
        ticks: { 
          callback: axisTickFormatters.millionEuro,
        } 
      },
    },
  });
}