import { baseFont, colors } from "../../constants/constants.js";
import { axisTickFormatters, createChart } from "../../utils/helpers.js";
import { barDataset } from "../dataSets.js";

export function buildPctBarChart(epaData) {
  // Exclude groups where pre-EPA is near zero (avoids 2000%+ outliers)
  const filtered = epaData.filter(row => row.pre >= 0.5).sort((a, b) => b.pct_change - a.pct_change);

  return createChart('csChartPctBar', 'bar', {
    labels: filtered.map(row => row.cn_code),
    datasets: [barDataset(
      '% change post-EPA vs pre-EPA',
      filtered.map(row => row.pct_change),
      filtered.map(row => row.direction === 'up' ? colors.pctUpBar : colors.pctDownBar)
    )],
  }, {
    plugins: { 
      legend: { 
        display: false 
      } 
    },
    scales: {
      y: { 
        ticks: { 
          callback: axisTickFormatters.percent 
        } 
      },
      x: { 
        ticks: { 
          font: baseFont 
        } 
      },
    },
  });
}