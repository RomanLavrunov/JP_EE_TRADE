import { cnPalette } from "../../constants/constants.js";
import { axisTickFormatters, buildBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted, valuesByYear } from "../../utils/utils.js";
import { lineDataset } from "../dataSets.js";

// Group A import CN codes — solid lines
const IMP_GROUP_A = new Set(['CN87','CN84']);

export function buildImportCNChart(importsTimeSeries) {
  const years = uniqueSorted(importsTimeSeries, 'year');
  const labels = years.map(String);
  const rowsByCommodityCode = groupBy(importsTimeSeries, row => row.cn_code);

  const datasets = [...rowsByCommodityCode.entries()].map(([code, rows], index) => {
    const isGroupA = IMP_GROUP_A.has(code);
    const ds = lineDataset(
      code,
      valuesByYear(years, rows, row => row.year, row => row.value),
      cnPalette[index % cnPalette.length]
    );
    if (!isGroupA) {
      ds.borderDash = [6, 3];
      ds.borderWidth = 1.8;
      ds.pointRadius = 2;
    } else {
      ds.borderWidth = 2.2;
    }
    return ds;
  });

  return createChart('csChartImportCN', 'line', { labels, datasets }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: { ticks: { callback: axisTickFormatters.millionEuro } }
    },
  });
}
