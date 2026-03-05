import { cnPalette } from "../../constants/constants.js";
import { buildSummaryBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted } from "../../utils/utils.js";

// Commodity export time series

export function buildCommoditiesChart(exportsTs) {
    const years = uniqueSorted(exportsTs, 'year');
    const labels = years.map(String);
    const byCN = groupBy(exportsTs, r => r.cn_code);

    const datasets = [...byCN.entries()].map(([code, rows], i) => ({
        label: `${code} ${rows[0].cn_name.split(' ').slice(0, 3).join(' ')}…`,
        data: years.map(y => rows.find(r => r.year === y)?.value ?? null),
        borderColor: cnPalette[i % cnPalette.length],
        backgroundColor: cnPalette[i % cnPalette.length] + '20',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 2,
        fill: false,
    }));

    return createChart('chartCommodities', 'line', { labels, datasets }, {
        plugins: {
            annotation: { annotations: buildSummaryBreakAnnotations(labels) },
            tooltip: {
                callbacks: {
                    label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(2) ?? '—'} M€`,
                },
            },
        },
        scales: {
            y: { ticks: { callback: v => v + ' M€' } },
        },
    });
}
