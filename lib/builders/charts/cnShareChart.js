import { cnPalette } from "../../constants/constants.js";
import { buildCaseStudyBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted } from "../../utils/utils.js";
import { lineDataset } from "../dataSets.js";

export function buildCNShareChart(shareData) {
  const years = uniqueSorted(shareData, 'year');
  const labels = years.map(String);
  const byCN = groupBy(shareData, r => r.cn_code);

  const datasets = [...byCN.entries()].map(([code, rows], i) =>
    lineDataset(code, years.map(y => rows.find(r => r.year === y)?.jp_share_pct ?? null), cnPalette[i % cnPalette.length])
  );

  return createChart('csChartCNShare', 'line', { labels, datasets }, {
    plugins: { annotation: { annotations: buildCaseStudyBreakAnnotations(labels) } },
    scales: { y: { ticks: { callback: v => v + '%' } } },
  });
}
