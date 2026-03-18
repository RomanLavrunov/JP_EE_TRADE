import { cnPalette } from "../../constants/constants.js";
import { axisTickFormatters, buildBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted, valuesByYear } from "../../utils/utils.js";
import { lineDataset } from "../dataSets.js";

// Japan's share of Estonia's total exports per CN group.
// Group A: solid lines; Group B: dashed lines.
// No treatment/control distinction — Pareto methodology only.

const GROUP_A_CFG = {
  CN44: { label: 'CN44 Wood',             color: '#1d3557' },
  CN85: { label: 'CN85 Electronics',      color: '#c0392b' },
  CN71: { label: 'CN71 Precious metals',  color: '#8a2be2' },
  CN84: { label: 'CN84 Machinery',        color: '#2d6a4f' },
};

const GROUP_B_CFG = {
  CN08: { label: 'CN08 Fruit & nuts',     color: '#d35400' },
  CN90: { label: 'CN90 Optical',          color: '#457b9d' },
  CN72: { label: 'CN72 Iron & steel',     color: '#6b4f3a' },
  CN28: { label: 'CN28 Inorg. chem.',     color: '#2e8b57' },
  CN94: { label: 'CN94 Furniture',        color: '#b8860b' },
};

export function buildCNShareChart(shareRows) {
  const years = uniqueSorted(shareRows, 'year');
  const labels = years.map(String);
  const byCN = groupBy(shareRows, r => r.cn_code);

  const datasets = [];

  Object.entries(GROUP_A_CFG).forEach(([code, cfg]) => {
    if (!byCN.has(code)) return;
    datasets.push({
      ...lineDataset(cfg.label, valuesByYear(years, byCN.get(code), r => r.year, r => r.jp_share_pct), cfg.color),
      borderWidth: 2.2,
    });
  });

  Object.entries(GROUP_B_CFG).forEach(([code, cfg]) => {
    if (!byCN.has(code)) return;
    datasets.push({
      ...lineDataset(cfg.label, valuesByYear(years, byCN.get(code), r => r.year, r => r.jp_share_pct), cfg.color),
      borderDash: [5, 4],
      borderWidth: 1.6,
      pointRadius: 2,
    });
  });

  return createChart('csChartCNShare', 'line', { labels, datasets }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: {
        ticks: { callback: axisTickFormatters.percent },
        title: { display: true, text: 'Japan share of Estonia total exports, %', font: { size: 10 } }
      }
    },
  });
}
