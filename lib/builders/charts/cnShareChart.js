import { axisTickFormatters, buildBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted, valuesByYear } from "../../utils/utils.js";
import { lineDataset } from "../dataSets.js";

// Japan's share of Estonia's total exports per CN group.
// Treatment groups solid, control groups dashed — same visual language as other charts.

const TREATMENT_SHARE = {
  CN44: { label: 'CN44 Wood',             color: '#1d3557' },
  CN85: { label: 'CN85 Electronics',      color: '#c0392b' },
  CN28: { label: 'CN28 Inorg. chemistry', color: '#2d6a4f' },
  CN71: { label: 'CN71 Precious metals',  color: '#8a2be2' },
  CN90: { label: 'CN90 Optical',          color: '#d35400' },
  CN94: { label: 'CN94 Furniture',        color: '#457b9d' },
};
const CONTROL_SHARE = {
  CN03: { label: 'CN03 Fish (ctrl)',  color: '#aaa' },
  CN04: { label: 'CN04 Dairy (ctrl)', color: '#bbb' },
  CN95: { label: 'CN95 Toys (ctrl)',  color: '#ccc' },
};

export function buildCNShareChart(shareRows) {
  const years = uniqueSorted(shareRows, 'year');
  const labels = years.map(String);
  const byCN = groupBy(shareRows, r => r.cn_code);

  const datasets = [];

  Object.entries(TREATMENT_SHARE).forEach(([code, cfg]) => {
    if (!byCN.has(code)) return;
    datasets.push({
      ...lineDataset(cfg.label, valuesByYear(years, byCN.get(code), r => r.year, r => r.jp_share_pct), cfg.color),
      borderWidth: 2,
    });
  });

  Object.entries(CONTROL_SHARE).forEach(([code, cfg]) => {
    if (!byCN.has(code)) return;
    datasets.push({
      ...lineDataset(cfg.label, valuesByYear(years, byCN.get(code), r => r.year, r => r.jp_share_pct), cfg.color),
      borderDash: [5, 4],
      borderWidth: 1.5,
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
