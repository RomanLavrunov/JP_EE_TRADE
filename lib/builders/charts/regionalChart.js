import { cnPalette } from "../../constants/constants.js";
import { createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted } from "../../utils/utils.js";
import { barDataset } from "../dataSets.js";

export function buildRegionalChart(canvasId, regionalData, cnCode) {
  const rows = regionalData.filter(row => row.cn_code === cnCode);
  if (!rows.length) return;

  const years = uniqueSorted(rows, 'year');
  const labels = years.map(String);
  const regions = uniqueSorted(rows, 'region');
  const byRegion = groupBy(rows, row => row.region);

  const datasets = regions.map((region, i) =>
    barDataset(
      region,
      years.map(y => byRegion.get(region)?.find(r => r.year === y)?.value ?? 0),
      cnPalette[i % cnPalette.length]
    )
  );

  return createChart(canvasId, 'bar', { labels, datasets }, {
    scales: {
      x: { stacked: true },
      y: { stacked: true, ticks: { callback: value => `${value} M€` } },
    },
  });
}
