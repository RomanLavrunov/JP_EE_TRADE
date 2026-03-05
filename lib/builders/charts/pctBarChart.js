import { baseFont } from "../../constants/constants.js";
import { createChart } from "../../utils/helpers.js";
import { barDataset } from "../dataSets.js";

export function buildPctBarChart(epaData) {
  // Exclude groups where pre-EPA is near zero (avoids 2000%+ outliers)
  const filtered = epaData.filter(r => r.pre >= 0.5).sort((a, b) => b.pct_change - a.pct_change);

  return createChart('csChartPctBar', 'bar', {
    labels: filtered.map(r => r.cn_code),
    datasets: [barDataset(
      '% change post-EPA vs pre-EPA',
      filtered.map(r => r.pct_change),
      filtered.map(r => r.direction === 'up' ? 'rgba(45,106,79,.75)' : 'rgba(192,57,43,.75)')
    )],
  }, {
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { callback: v => v + '%' } },
      x: { ticks: { font: baseFont } },
    },
  });
}