
import { cnPalette, colors } from "../../constants/constants.js";
import { buildSummaryBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted } from "../../utils/utils.js";

/**
 * Chart 3: Export growth index — Japan vs global
 */

export function buildIndexChart(indexData, partnerData) {
  const years = uniqueSorted(indexData, 'year');
  const labels = years.map(String);

  // Japan & Global from japan_trade.json index
  const bySeriesJp = groupBy(indexData, r => r.series);
  const jpExports = years.map(y => bySeriesJp.get('Japan · Exports')?.find(r => r.year === y)?.index ?? null);
  const glExports = years.map(y => bySeriesJp.get('Global · Exports')?.find(r => r.year === y)?.index ?? null);

  // Partner countries from partner_countries.json
  const byCountry = groupBy(partnerData.index_exports, r => r.country);
  const partnerDatasets = [];
  const partnerNames = [...byCountry.keys()].filter(c => c !== 'JP Japan');

  partnerNames.forEach((country, i) => {
    const rows = byCountry.get(country);
    const data = years.map(y => rows.find(r => r.year === y)?.index ?? null);
    const isKorea = country.includes('Korea');
    partnerDatasets.push({
      label: country,
      data,
      borderColor: cnPalette[(i + 2) % cnPalette.length],
      borderWidth: isKorea ? 2 : 1,
      tension: 0.3,
      pointRadius: isKorea ? 3 : 1.5,
      borderDash: isKorea ? [] : [3, 3],
      fill: false,
    });
  });

  return createChart('chartIndex', 'line', {
    labels,
    datasets: [
      {
        label: 'Japan exports',
        data: jpExports,
        borderColor: colors.accent,
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 4,
        fill: false,
      },
      {
        label: 'Global exports',
        data: glExports,
        borderColor: colors.ink3,
        borderWidth: 1.5,
        borderDash: [6, 3],
        tension: 0.3,
        pointRadius: 2,
        fill: false,
      },
      ...partnerDatasets,
    ],
  }, {
    plugins: {
      annotation: { annotations: buildSummaryBreakAnnotations(labels) },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1) ?? '—'}`,
        },
      },
    },
    scales: {
      y: { ticks: { callback: v => v } },
    },
  });
}