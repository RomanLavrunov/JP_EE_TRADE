import { cnPalette } from "../../constants/constants.js";
import { buildBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted } from "../../utils/utils.js";
import { lineDataset } from "../dataSets.js";

export function buildHeatIndexChart(indexRowsRelativeTo2018) {
  const years = uniqueSorted(indexRowsRelativeTo2018, 'year');
  const labels = years.map(String);
  const rowsByCommodityCode = groupBy(indexRowsRelativeTo2018, row => row.cn_code);

  const datasets = [...rowsByCommodityCode.entries()].map(([commodityCode, rows], index) =>
    lineDataset(
      commodityCode,
      years.map(
        year => rows.find(
          row => row.year === year)?.index_vs_2018 ?? null),
      cnPalette[index % cnPalette.length]
    )
  );

  return createChart('csChartHeatIndex', 'line', { labels, datasets }, {
    plugins: {
      annotation: {
        annotations: buildBreakAnnotations(labels)
      }
    },
    scales: {
      y: {
        ticks: {
          callback: value => value
        }
      }
    },
  });
}

