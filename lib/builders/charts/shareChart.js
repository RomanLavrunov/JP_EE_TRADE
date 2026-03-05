import { buildSummaryBreakAnnotations, createChart } from "../../utils/helpers.js";

/**
 * Japan's share in Estonia's total trade
 */

export function buildShareChart(bilateral) {
  const labels = bilateral.map(r => String(r.year));

  return createChart('chartShare', 'bar', {
    labels,
    datasets: [
      {
        label: 'Export share',
        data: bilateral.map(r => +(r.shareExp * 100).toFixed(2)),
        backgroundColor: 'rgba(29,53,87,.75)',
        borderRadius: 2,
      },
      {
        label: 'Import share',
        data: bilateral.map(r => +(r.shareImp * 100).toFixed(2)),
        backgroundColor: 'rgba(192,57,43,.65)',
        borderRadius: 2,
      },
    ],
  }, {
    plugins: {
      annotation: { annotations: buildSummaryBreakAnnotations(labels) },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`,
        },
      },
    },
    scales: {
      y: { ticks: { callback: v => v + '%' } },
    },
  });
}