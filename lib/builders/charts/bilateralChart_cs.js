import { colors } from "../../constants/constants.js";
import { buildCaseStudyBreakAnnotations, createChart } from "../../utils/helpers.js";
import { lineDataset } from "../dataSets.js";


export function buildBilateralChartCaseStudy(bilateral) {
  const labels = bilateral.map(r => String(r.year));
  return createChart('csChartBilateral', 'line', {
    labels,
    datasets: [
      lineDataset('Exports', bilateral.map(r => r.exports), colors.exports, { fill: true, backgroundColor: 'rgba(29,53,87,.08)' }),
      lineDataset('Imports', bilateral.map(r => r.imports), colors.imports, { fill: true, backgroundColor: 'rgba(192,57,43,.06)' }),
    ],
  }, {
    plugins: {
      annotation: { annotations: buildCaseStudyBreakAnnotations(labels) },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} M€` } },
    },
    scales: { y: { ticks: { callback: v => v + ' M€' } } },
  });
}