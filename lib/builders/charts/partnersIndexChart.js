import { cnPalette, colors } from "../../constants/constants.js";
import { tooltipLabelFactories, buildCaseStudyBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted, valuesByYear } from "../../utils/utils.js";
import { lineDataset } from "../dataSets.js";

export function buildPartnersIndexChart(partnerData) {
  const years = uniqueSorted(partnerData.index_exports, 'year');
  const labels = years.map(String);
  const indexRowsByCountry = groupBy(partnerData.index_exports, row => row.country);

  const datasets = [...indexRowsByCountry.entries()].map(([country, rows], index) => {
    const isJapan = country.includes('Japan');
    const isKorea = country.includes('Korea');
    return lineDataset(
      country,
      valuesByYear(years, rows, row => row.year, row => row.index),
      isJapan ? colors.accent : cnPalette[(index + 2) % cnPalette.length],
      {
        borderWidth: isJapan ? 3 : isKorea ? 2 : 1,
        pointRadius: isJapan ? 4 : isKorea ? 3 : 1.5,
        borderDash: isJapan || isKorea ? [] : [3, 3],
      }
    );
  });

  return createChart('csChartPartners', 'line', { labels, datasets }, {
    plugins: {
      annotation: { 
        annotations: 
        buildCaseStudyBreakAnnotations(labels) },
      tooltip: { callbacks: { label: tooltipLabelFactories.plainNumber(1) } },
    },
  });
}