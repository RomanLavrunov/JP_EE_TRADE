
import { cnPalette, colors, SERIES_NAMES, SPECIAL_COUNTRY_NAMES } from "../../constants/constants.js";
import { tooltipLabelFactories, buildSummaryBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted, valuesByYear } from "../../utils/utils.js";

/**
 * Chart 3: Export growth index — Japan vs global
 */

export function buildIndexChart(indexRows, partnerData) {
  const years = uniqueSorted(indexRows, 'year');
  const labels = years.map(String);

  // Japan & Global from japan_trade.json index
  const indexRowsBySeries = groupBy(indexRows, row => row.series);
  const japanExportsIndex = valuesByYear(
    years,
    indexRowsBySeries.get(SERIES_NAMES.JAPAN_EXPORTS) ?? [],
    row => row.year,
    row => row.index
  );
  const globalExportsIndex = valuesByYear(
    years,
    indexRowsBySeries.get(SERIES_NAMES.GLOBAL_EXPORTS) ?? [],
    row => row.year,
    row => row.index
  );

  // Partner countries from partner_countries.json
  const indexRowsByCountry = groupBy(partnerData.index_exports, row => row.country);
  const partnerDatasets = [];
  const partnerNames = [...indexRowsByCountry.keys()].filter(
    countryName => countryName !== SPECIAL_COUNTRY_NAMES.JAPAN
  );

  partnerNames.forEach((country, index) => {
    const rows = indexRowsByCountry.get(country);
    const indexValues = valuesByYear(
      years,
      rows,
      row => row.year,
      row => row.index
    );
    const isKorea = country.includes(SPECIAL_COUNTRY_NAMES.SOUTH_KOREA_LABEL_PART);
    partnerDatasets.push({
      label: country,
      data: indexValues,
      borderColor: cnPalette[(index + 2) % cnPalette.length],
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
        data: japanExportsIndex,
        borderColor: colors.accent,
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 4,
        fill: false,
      },
      {
        label: 'Global exports',
        data: globalExportsIndex,
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
          label: tooltipLabelFactories.plainNumber(1),
        },
      },
    },
    scales: {
      y: {
         ticks: {
          callback: value => value
        }
      },
    },
  });
}