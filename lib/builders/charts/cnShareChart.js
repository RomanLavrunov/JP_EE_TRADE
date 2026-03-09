import { cnPalette } from "../../constants/constants.js";
import { axisTickFormatters, buildCaseStudyBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted, valuesByYear } from "../../utils/utils.js";
import { lineDataset } from "../dataSets.js";

export function buildCNShareChart(shareRows) {
  const years = uniqueSorted(shareRows, 'year');
  const labels = years.map(String);
  const rowsByCommodityCode = groupBy(shareRows, row => row.cn_code);

  const datasets = [...rowsByCommodityCode.entries()].map(([code, rows], index) =>
    lineDataset(
      code,
      valuesByYear(years, rows, row => row.year, row => row.jp_share_pct),
      cnPalette[index % cnPalette.length])
  );

  return createChart('csChartCNShare', 'line', { labels, datasets }, {
    plugins: { 
      annotation: { 
        annotations: buildCaseStudyBreakAnnotations(labels) 
      } 
    },
    scales: { 
      y: { 
        ticks: { 
          callback: axisTickFormatters.percent 
        } 
      } 
    },
  });
}
