import { cnPalette } from "../../constants/constants.js";
import { axisTickFormatters, tooltipLabelFactories, buildBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted, valuesByYear } from "../../utils/utils.js";

// Commodity export time series

export function buildCommoditiesChart(exportsTimeSeries) {
    const years = uniqueSorted(exportsTimeSeries, 'year');
    const labels = years.map(String);
    const rowsByCommodityCode = groupBy(exportsTimeSeries, row => row.cn_code);

    const datasets = [...rowsByCommodityCode.entries()].map(([code, rows], index) => ({
        label: `${code} ${rows[0].cn_name.split(' ').slice(0, 3).join(' ')}…`,
        data: valuesByYear(years, rows, row => row.year, row => row.value),
        borderColor: cnPalette[index % cnPalette.length],
        backgroundColor: cnPalette[index % cnPalette.length] + '20',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 2,
        fill: false,
    }));

    return createChart('chartCommodities', 'line', { labels, datasets }, {
        plugins: {
            annotation: { annotations: buildBreakAnnotations(labels) },
            tooltip: {
                callbacks: {
                    label: tooltipLabelFactories.millionEuro(2),
                },
            },
        },
        scales: {
            y: { 
                ticks: { 
                    callback: axisTickFormatters.millionEuro 
                } 
            },
        },
    });
}
