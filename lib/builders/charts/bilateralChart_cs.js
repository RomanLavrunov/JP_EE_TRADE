import { colors } from "../../constants/constants.js";
import { buildCaseStudyBreakAnnotations, createChart } from "../../utils/helpers.js";
import { lineDataset } from "../dataSets.js";


export function buildBilateralChartCaseStudy(bilateral) {
  const labels = bilateral.map(r => String(r.year));
  return createChart('csChartBilateral', 'line', {
    labels,
    datasets: [
      lineDataset('Exports', bilateral.map(row => row.exports), colors.exports, { fill: true, backgroundColor: colors.exportsFillLight }),
      lineDataset('Imports', bilateral.map(row => row.imports), colors.imports, { fill: true, backgroundColor: colors.importsFillLight }),
    ],
  }, {
    plugins: {
      annotation: { 
        annotations: buildCaseStudyBreakAnnotations(labels) 
      },
      tooltip: { 
        callbacks: { 
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} M€` 
        } 
      },
    },
    scales: { 
      y: { 
        ticks: {
          callback: v => v + ' M€' 
        } 
      } 
    },
  });
}