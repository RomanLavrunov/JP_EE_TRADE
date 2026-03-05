import { buildCaseStudyBreakAnnotations, createChart } from "../../utils/helpers.js";
import { barDataset } from "../dataSets.js";

export function buildShareBarChart(bilateral) {
  const labels = bilateral.map(r => String(r.year));
  return createChart('csChartShareBar', 'bar', {
    labels,
    datasets: [
      barDataset('Export share', bilateral.map(r => +(r.shareExp * 100).toFixed(2)), 'rgba(29,53,87,.75)'),
      barDataset('Import share', bilateral.map(r => +(r.shareImp * 100).toFixed(2)), 'rgba(192,57,43,.65)'),
    ],
  }, {
    plugins: {
      annotation: { annotations: buildCaseStudyBreakAnnotations(labels) },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%` } },
    },
    scales: { y: { ticks: { callback: v => v + '%' } } },
  });
}