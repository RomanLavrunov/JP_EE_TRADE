import { colors } from "../../constants/constants.js";
import { axisTickFormatters, tooltipLabelFactories, createChart, buildBreakAnnotations } from "../../utils/helpers.js";
import { lineDataset } from "../dataSets.js";

/**
 * Chart 1: Bilateral exports & imports over time
 * @param {any[]} bilateralRows
 */

export function buildBilateralChart(bilateralRows) {

  const labels = bilateralRows.map(row => String(row.year));

  return createChart('chartBilateral', 'line', {
    labels,
    datasets: [
      lineDataset('Exports', bilateralRows.map(row => row.exports), colors.exports, { fill: true, backgroundColor: colors.exportsFillLight }),
      lineDataset('Imports', bilateralRows.map(row => row.imports), colors.imports, { fill: true, backgroundColor: colors.importsFillLight }),
    ],
  }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
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