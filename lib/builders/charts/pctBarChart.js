import { baseFont, colors } from "../../constants/constants.js";
import { axisTickFormatters, createChart } from "../../utils/helpers.js";
import { barDataset } from "../dataSets.js";

// Grouped bar chart: Japan % change vs World % change for the same CN group.
// All A+B groups shown with consistent colour — spikes shown separately (grey).
// CN71 excluded from axis (extreme scale) — noted in chart subtitle.

const SPIKE_CNS = new Set(['CN03','CN81']);

export function buildPctBarChart(epaData) {
  const rows = epaData
    .filter(r => r.pre >= 0.05 && r.cn_code !== 'CN71' && r.pareto_group !== 'Spike')
    .sort((a, b) => {
      // Group A first, then B; within group sort by pct_change desc
      const ga = a.pareto_group === 'A' ? 0 : 1;
      const gb = b.pareto_group === 'A' ? 0 : 1;
      if (ga !== gb) return ga - gb;
      return (b.pct_change ?? 0) - (a.pct_change ?? 0);
    });

  const labels = rows.map(r => r.cn_code);

  const japanColors = rows.map(r =>
    r.pareto_group === 'A'
      ? (r.direction === 'up' ? 'rgba(29,53,87,0.82)' : colors.pctDownBar)
      : (r.direction === 'up' ? 'rgba(69,123,157,0.7)' : 'rgba(192,57,43,0.5)')
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
      tooltip: {
        callbacks: {
          afterTitle: (items) => {
            const idx = items[0]?.dataIndex;
            if (idx == null) return '';
            const r = rows[idx];
            return `Group ${r.pareto_group}`;
          }
        }
      }
    },
    scales: {
      y: { ticks: { callback: axisTickFormatters.percent } },
      x: { ticks: { font: baseFont } },
    },
  });
}
