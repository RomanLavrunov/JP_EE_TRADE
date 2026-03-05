import { cnPalette } from "../../constants/constants.js";
import { buildCaseStudyBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted } from "../../utils/utils.js";
import { barDataset, lineDataset } from "../dataSets.js";

export function buildHeatIndexChart(indexVs2018) {
  const years = uniqueSorted(indexVs2018, 'year');
  const labels = years.map(String);
  const byCN = groupBy(indexVs2018, r => r.cn_code);

  const datasets = [...byCN.entries()].map(([code, rows], i) =>
    lineDataset(code, years.map(y => rows.find(r => r.year === y)?.index_vs_2018 ?? null), cnPalette[i % cnPalette.length])
  );

  return createChart('csChartHeatIndex', 'line', { labels, datasets }, {
    plugins: { annotation: { annotations: buildCaseStudyBreakAnnotations(labels) } },
    scales: { y: { ticks: { callback: v => v } } },
  });
}

