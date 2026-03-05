import { createChart } from "../../utils/helpers";
import { groupBy, uniqueSorted } from "../../utils/utils";
import { barDataset } from "../dataSets";

export function buildRegionalChart(canvasId, regionalData, cnCode) {
  const rows = regionalData.filter(r => r.cn_code === cnCode);
  if (!rows.length) return;

  const years = uniqueSorted(rows, 'year');
  const labels = years.map(String);
  const regions = uniqueSorted(rows, 'region');
  const byRegion = groupBy(rows, r => r.region);

  const REGION_COLORS = ['#1d3557', '#c0392b', '#2d6a4f', '#d35400', '#457b9d', '#8a8478'];

  const datasets = regions.map((region, i) =>
    barDataset(region, years.map(y => byRegion.get(region)?.find(r => r.year === y)?.value ?? 0), REGION_COLORS[i % REGION_COLORS.length])
  );

  return createChart(canvasId, 'bar', { labels, datasets }, {
    scales: {
      x: { stacked: true },
      y: { stacked: true, ticks: { callback: v => v + ' M€' } },
    },
  });
}
