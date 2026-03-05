import { cnPalette, colors } from "../../constants/constants.js";
import { buildCaseStudyBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted } from "../../utils/utils";
import { lineDataset } from "../dataSets.js";

export function buildPartnersAbsChart(partnerData) {
  const years = uniqueSorted(partnerData.abs_exports, 'year');
  const labels = years.map(String);
  const byCN = groupBy(partnerData.abs_exports, r => r.country);


  const datasets = [...byCN.entries()].map(([country, rows], i) =>
    lineDataset(
      country,
      years.map(y => rows.find(r => r.year === y)?.value_mln ?? null),
      country.includes('Japan') ? colors.accent : cnPalette[(i + 2) % cnPalette.length],
      { borderWidth: country.includes('Japan') ? 3 : 1.5 }
    )
  );

  return createChart('csChartPartnersAbs', 'line', { labels, datasets }, {
    plugins: {
      annotation: { annotations: buildCaseStudyBreakAnnotations(labels) },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1) ?? '—'} M€` } },
    },
    scales: { y: { ticks: { callback: v => v + ' M€' } } },
  });
}
