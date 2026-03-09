import { cnPalette, colors } from "../../constants/constants.js";
import { axisTickFormatters, tooltipLabelFactories, buildCaseStudyBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted, valuesByYear } from "../../utils/utils.js";
import { lineDataset } from "../dataSets.js";

export function buildPartnersAbsChart(partnerData) {
  const years = uniqueSorted(partnerData.abs_exports, 'year');
  const labels = years.map(String);
  const absoluteExportsByCountry = groupBy(partnerData.abs_exports, row => row.country);

  const datasets = [...absoluteExportsByCountry.entries()].map(([country, rows], index) =>
    lineDataset(
      country,
      valuesByYear(years, rows, row => row.year, row => row.value_mln),
      country.includes('Japan') ? colors.accent : cnPalette[(index + 2) % cnPalette.length],
      { borderWidth: country.includes('Japan') ? 3 : 1.5 }
    )
  );

  return createChart('csChartPartnersAbs', 'line', { labels, datasets }, {
    plugins: {
      annotation: { 
        annotations: buildCaseStudyBreakAnnotations(labels) 
      },
      tooltip: { 
        callbacks: { 
          label: tooltipLabelFactories.millionEuro(1) 
        } 
      },
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
