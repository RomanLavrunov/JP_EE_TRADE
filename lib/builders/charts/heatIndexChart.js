import { colors, cnPalette } from "../../constants/constants.js";
import { buildBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted } from "../../utils/utils.js";
import { lineDataset } from "../dataSets.js";

// Treatment groups shown with solid Japan line + dashed World line (same colour)
// Control groups shown in grey
const TREATMENT = ['CN44', 'CN85', 'CN28', 'CN71', 'CN90', 'CN94'];
const CONTROL   = ['CN03', 'CN04', 'CN95'];

const CN_COLORS = {
  CN44: '#1d3557', CN85: '#c0392b', CN28: '#2d6a4f',
  CN71: '#8a2be2', CN90: '#d35400', CN94: '#457b9d',
  CN03: '#aaa',    CN04: '#bbb',    CN95: '#ccc',
};

const CN_LABELS = {
  CN44: 'CN44 Wood', CN85: 'CN85 Electronics', CN28: 'CN28 Inorg.chem',
  CN71: 'CN71 Precious metals', CN90: 'CN90 Optical', CN94: 'CN94 Furniture',
  CN03: 'CN03 Fish (ctrl)', CN04: 'CN04 Dairy (ctrl)', CN95: 'CN95 Toys (ctrl)',
};

export function buildHeatIndexChart(indexRows) {
  const years = uniqueSorted(indexRows, 'year');
  const labels = years.map(String);
  const byCN = groupBy(indexRows, r => r.cn_code);

  const datasets = [];

  const buildPair = (cn, isControl) => {
    const rows = byCN.get(cn);
    if (!rows) return;
    const color = CN_COLORS[cn] || '#999';
    const label = CN_LABELS[cn] || cn;

    // Japan line — solid
    datasets.push({
      ...lineDataset(
        `${label} · Japan`,
        years.map(y => rows.find(r => r.year === y)?.idx_japan ?? null),
        color
      ),
      borderWidth: isControl ? 1 : 2,
      borderDash: isControl ? [5, 4] : [],
      pointRadius: isControl ? 1.5 : 3,
    });

    // World line — same colour, dashed, thinner
    datasets.push({
      ...lineDataset(
        `${label} · World`,
        years.map(y => rows.find(r => r.year === y)?.idx_world ?? null),
        color
      ),
      borderDash: [4, 3],
      borderWidth: isControl ? 1 : 1.5,
      pointRadius: 0,
      pointHoverRadius: 3,
    });
  };

  TREATMENT.forEach(cn => buildPair(cn, false));
  CONTROL.forEach(cn => buildPair(cn, true));

  // Baseline at 100
  datasets.push({
    label: 'Baseline 2018 = 100',
    data: labels.map(() => 100),
    borderColor: colors.border,
    borderDash: [2, 2],
    borderWidth: 1,
    pointRadius: 0,
    pointHoverRadius: 0,
  });

  return createChart('csChartHeatIndex', 'line', { labels, datasets }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y != null ? ctx.parsed.y.toFixed(1) : '—'}`
        }
      },
      legend: {
        labels: {
          filter: item => !item.text.includes('· World') || item.text.includes('CN44'),
          // Show full legend — users can toggle
        }
      }
    },
    scales: {
      y: {
        ticks: { callback: v => v },
        title: { display: true, text: 'Index 2018 = 100', font: { size: 11 } }
      }
    },
  });
}

