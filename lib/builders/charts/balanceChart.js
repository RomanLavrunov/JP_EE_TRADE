import { buildCaseStudyBreakAnnotations, createChart } from "../../utils/helpers.js";
import { barDataset } from "../dataSets.js";

export function buildBalanceChart(bilateral) {
  const labels = bilateral.map(r => String(r.year));
  return createChart('csChartBalance', 'bar', {
    labels,
    datasets: [barDataset('Balance', bilateral.map(r => r.balance), 'rgba(45,106,79,.7)')],
  }, {
    plugins: {
      legend: { display: false },
      annotation: { annotations: buildCaseStudyBreakAnnotations(labels) },
      tooltip: { callbacks: { label: ctx => ` Balance: ${ctx.parsed.y.toFixed(1)} M€` } },
    },
    scales: { y: { ticks: { callback: v => v + ' M€' } } },
  });
}