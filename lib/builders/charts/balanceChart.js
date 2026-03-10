import { colors } from "../../constants/constants.js";
import { axisTickFormatters, tooltipLabelFactories, buildBreakAnnotations, createChart } from "../../utils/helpers.js";
import { barDataset } from "../dataSets.js";

export function buildBalanceChart(bilateralRows) {
  const labels = bilateralRows.map(row => String(row.year));
  return createChart('csChartBalance', 'bar', {
    labels,
    datasets: [
      barDataset(
        'Balance',
        bilateralRows.map(row => row.balance),
        colors.balanceBar
      )
    ],
  }, {
    plugins: {
      legend: { display: false },
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: {
        callbacks: {
          label: tooltipLabelFactories.millionEuro(1)
        }
      },
    },
    scales: {
      y: {
        ticks: {
          callback: axisTickFormatters.millionEuro
        }
      }
    },
  });
}