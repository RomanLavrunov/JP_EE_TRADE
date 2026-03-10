import { colors } from "../../constants/constants.js";
import { axisTickFormatters, tooltipLabelFactories, buildBreakAnnotations, createChart } from "../../utils/helpers.js";

// Japan's share in Estonia's total trade

export function buildShareChart(bilateralRows) {
  const labels = bilateralRows.map(row => String(row.year));

  return createChart('chartShare', 'bar', {
    labels,
    datasets: [
      {
        label: 'Export share',
        data: bilateralRows.map(row => +(row.shareExp * 100).toFixed(2)),
        backgroundColor: colors.exportShareBar,
        borderRadius: 2,
      },
      {
        label: 'Import share',
        data: bilateralRows.map(row => +(row.shareImp * 100).toFixed(2)),
        backgroundColor: colors.importShareBar,
        borderRadius: 2,
      },
    ],
  }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: {
        callbacks: {
          label: tooltipLabelFactories.percent(2),
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: axisTickFormatters.percent
        }
      },
    },
  });
}