import { colors, SERIES_NAMES } from "../../constants/constants.js";
import { buildBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted } from "../../utils/utils.js";
import { lineDataset } from "../dataSets.js";

export function buildIndexGlobalChart(indexData) {
  const years = uniqueSorted(indexData, 'year');
  const labels = years.map(String);
  const bySeries = groupBy(indexData, r => r.series);

  const get = (series, y) => bySeries.get(series)?.find(r => r.year === y)?.index ?? null;

  return createChart('csChartIndexGlobal', 'line', {
    labels,
    datasets: [
      lineDataset('Japan exports', years.map(y => get(SERIES_NAMES.JAPAN_EXPORTS, y)), colors.exports, { borderWidth: 3 }),
      lineDataset('Japan imports', years.map(y => get('Japan · Imports', y)), colors.imports),
      lineDataset('Global exports', years.map(y => get(SERIES_NAMES.GLOBAL_EXPORTS, y)), colors.ink3, { borderDash: [6, 3], borderWidth: 1.5 }),
      lineDataset('Global imports', years.map(y => get('Global · Imports', y)), '#d35400', { borderDash: [6, 3], borderWidth: 1.5 }),
    ],
  }, {
    plugins: { 
      annotation: 
      { 
        annotations: buildBreakAnnotations(labels) 
      } 
    },
    scales: { 
      y: { 
        ticks: { 
          callback: v => v 
        } 
      } 
    },
  });
}