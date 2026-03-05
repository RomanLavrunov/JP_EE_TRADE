import { cnPalette, colors } from "../../constants/constants.js";
import { buildCaseStudyBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted } from "../../utils/utils.js";
import { lineDataset } from "../dataSets.js";

export function buildPartnersIndexChart(partnerData) {
  const years = uniqueSorted(partnerData.index_exports, 'year');
  const labels = years.map(String);
  const byCN = groupBy(partnerData.index_exports, r => r.country);

  const datasets = [...byCN.entries()].map(([country, rows], i) => {
    const isJapan = country.includes('Japan');
    const isKorea = country.includes('Korea');
    return lineDataset(
      country,
      years.map(y => rows.find(r => r.year === y)?.index ?? null),
      isJapan ? colors.accent : cnPalette[(i + 2) % cnPalette.length],
      {
        borderWidth: isJapan ? 3 : isKorea ? 2 : 1,
        pointRadius: isJapan ? 4 : isKorea ? 3 : 1.5,
        borderDash: isJapan || isKorea ? [] : [3, 3],
      }
    );
  });

  return createChart('csChartPartners', 'line', { labels, datasets }, {
    plugins: {
      annotation: { annotations: buildCaseStudyBreakAnnotations(labels) },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1) ?? '—'}` } },
    },
  });
}