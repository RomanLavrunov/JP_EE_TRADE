import { axisTickFormatters, buildBreakAnnotations, createChart, tooltipLabelFactories } from "../../utils/helpers";

export function buildBilateralChart(canvasId, bilateralRows, datasets, extraOptions = {}) {
  const labels = bilateralRows.map(row => String(row.year));
  return createChart(canvasId, 'line', { labels, datasets }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: { callbacks: { label: tooltipLabelFactories.millionEuro(1) } },
    },
    scales: { y: { ticks: { callback: axisTickFormatters.millionEuro } } },
    ...extraOptions,
  });
}


