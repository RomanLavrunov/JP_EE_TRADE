import { colors } from "../../constants/constants";
import { buildCaseStudyBreakAnnotations, createChart } from "../../utils/helpers";
import { groupBy, uniqueSorted } from "../../utils/utils";
import { lineDataset } from "../dataSets";

export function buildIndexGlobalChart(indexData) {
  const years = uniqueSorted(indexData, 'year');
  const labels = years.map(String);
  const bySeries = groupBy(indexData, r => r.series);

  const get = (series, y) => bySeries.get(series)?.find(r => r.year === y)?.index ?? null;

  return createChart('csChartIndexGlobal', 'line', {
    labels,
    datasets: [
      lineDataset('Japan exports', years.map(y => get('Japan · Exports', y)), colors.exports, { borderWidth: 3 }),
      lineDataset('Japan imports', years.map(y => get('Japan · Imports', y)), colors.imports),
      lineDataset('Global exports', years.map(y => get('Global · Exports', y)), colors.ink3, { borderDash: [6, 3], borderWidth: 1.5 }),
      lineDataset('Global imports', years.map(y => get('Global · Imports', y)), '#d35400', { borderDash: [6, 3], borderWidth: 1.5 }),
    ],
  }, {
    plugins: { annotation: { annotations: buildCaseStudyBreakAnnotations(labels) } },
    scales: { y: { ticks: { callback: v => v } } },
  });
}