import { axisTickFormatters, buildBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted, valuesByYear } from "../../utils/utils.js";
import { lineDataset } from "../dataSets.js";

// Spike chart — shows CN03 (fish) and CN81 (base metals) separately.
// These groups reacted strongly to EPA in 2019 (YoY ≥ 2×) but did not achieve
// sustained growth (k < 1, FTA-period average below pre-EPA baseline).
// Visualises the "announcement / front-loading" effect.

const SPIKE_CFG = {
  CN03: { label: 'CN03 Fish & seafood',         color: '#c0392b' },
  CN81: { label: 'CN81 Other base metals',      color: '#457b9d' },
};

export function buildSpikeChart(spikeTimeSeries, canvasId = 'csChartSpike') {
  if (!spikeTimeSeries || !spikeTimeSeries.length) return;

  const years = uniqueSorted(spikeTimeSeries, 'year');
  const labels = years.map(String);
  const byCN = groupBy(spikeTimeSeries, r => r.cn_code);

  const datasets = Object.entries(SPIKE_CFG)
    .filter(([code]) => byCN.has(code))
    .map(([code, cfg]) =>
      lineDataset(
        cfg.label,
        valuesByYear(years, byCN.get(code), r => r.year, r => r.value),
        cfg.color
      )
    );

  return createChart(canvasId, 'line', { labels, datasets }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: { ticks: { callback: axisTickFormatters.millionEuro } }
    },
  });
}
