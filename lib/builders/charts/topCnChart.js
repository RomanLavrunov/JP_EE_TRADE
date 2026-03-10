import { cnPalette } from "../../constants/constants.js";
import { axisTickFormatters, buildBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted, valuesByYear } from "../../utils/utils.js";
import { lineDataset } from "../dataSets.js";

export function buildTopCNChart(exportsTimeSeries) {
  const years = uniqueSorted(exportsTimeSeries, 'year');
  const labels = years.map(String);
  const rowsByCommodityCode = groupBy(exportsTimeSeries, row => row.cn_code);

  const datasets = [...rowsByCommodityCode.entries()].map(([code, rows], index) =>
    lineDataset(
      `${code}`,
      valuesByYear(years, rows, row => row.year, row => row.value),
      cnPalette[index % cnPalette.length]
    )
  );

  return createChart('csChartTopCN', 'line', { labels, datasets }, {
    plugins: { 
      annotation: { 
        annotations: buildBreakAnnotations(labels) 
      } 
    },
    scales: { 
      y: { 
        ticks: { 
          callback: axisTickFormatters.millionEuro 
        } 
      } 
    },
  });
}