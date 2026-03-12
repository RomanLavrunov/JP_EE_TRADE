import { baseFont, colors } from "../../constants/constants.js";
import { axisTickFormatters, createChart } from "../../utils/helpers.js";
import { barDataset } from "../dataSets.js";

// Grouped bar chart: Japan % change vs World % change for the same CN group.
// Control groups rendered in grey to distinguish from treatment groups.
// CN71 excluded from axis (28586% would destroy scale) — noted in tooltip.

const CONTROL = ['CN03', 'CN04', 'CN95'];

export function buildPctBarChart(epaData) {
  const rows = epaData
    .filter(r => r.pre >= 0.5 && r.cn_code !== 'CN71')
    .sort((a, b) => b.pct_change - a.pct_change);

  const labels = rows.map(r => r.cn_code);

  const japanColors = rows.map(r =>
    CONTROL.includes(r.cn_code)
      ? 'rgba(150,150,150,0.5)'
      : (r.direction === 'up' ? colors.pctUpBar : colors.pctDownBar)
  );

  return createChart('csChartPctBar', 'bar', {
    labels,
    datasets: [
      barDataset('Japan % change (post vs pre EPA)', rows.map(r => r.pct_change), japanColors),
      {
        ...barDataset('World % change (same period)', rows.map(r => r.world_pct_change ?? 0),
          rows.map(() => 'rgba(180,160,120,0.45)')),
        borderColor: 'rgba(140,120,80,0.6)',
        borderWidth: 1,
      },
    ],
  }, {
    plugins: {
      legend: { display: true, position: 'top' },
    },
    scales: {
      y: { ticks: { callback: axisTickFormatters.percent } },
      x: { ticks: { font: baseFont } },
    },
  });
}
