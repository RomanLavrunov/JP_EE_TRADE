import { colors } from "../../constants/constants.js";
import { buildBreakAnnotations, createChart } from "../../utils/helpers.js";
import { barDataset } from "../dataSets.js";

export function buildShareBarChart(bilateral) {
  const labels = bilateral.map(r => String(r.year));
  return createChart('csChartShareBar', 'bar', {
    labels,
    datasets: [
      barDataset('Export share', bilateral.map(row => +(row.shareExp).toFixed(2)), colors.exportShareBar),
      barDataset('Import share', bilateral.map(row => +(row.shareImp).toFixed(2)), colors.importShareBar),
    ],
  }, {
    plugins: {
      annotation: { 
        annotations: buildBreakAnnotations(labels) 
      },
      tooltip: { 
        callbacks: { 
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%` 
        } 
      },
    },
    scales: { 
      y: { 
        ticks: { 
          callback: v => v + '%' 
        } 
      }
    },
  });
}