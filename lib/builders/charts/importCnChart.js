import { cnPalette } from "../../constants/constants.js";
import { buildCaseStudyBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted } from "../../utils/utils.js";
import { lineDataset } from "../dataSets.js";

export function buildImportCNChart(importsTs) {
  const years = uniqueSorted(importsTs, 'year');
  const labels = years.map(String);
  const byCN = groupBy(importsTs, r => r.cn_code);

  const datasets = [...byCN.entries()].map(([code, rows], i) =>
    lineDataset(code, years.map(y => rows.find(r => r.year === y)?.value ?? null), cnPalette[i % cnPalette.length])
  );

  return createChart('csChartImportCN', 'line', { labels, datasets }, {
    plugins: { annotation: { annotations: buildCaseStudyBreakAnnotations(labels) } },
    scales: { y: { ticks: { callback: v => v + ' M€' } } },
  });
}
