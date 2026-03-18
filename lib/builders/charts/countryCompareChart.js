import { axisTickFormatters, buildBreakAnnotations, createChart } from "../../utils/helpers.js";
import { groupBy, uniqueSorted, valuesByYear } from "../../utils/utils.js";

// Country comparison chart: for a given CN group, shows Estonia's exports
// to Japan vs. major partner countries — indexed to 2018 = 100.
// Purpose: isolate the Japan-channel EPA effect from global commodity trends.
// If Japan diverges upward after 2019 while other countries stay flat,
// the acceleration is Japan-specific (EPA-driven), not a sector boom.

const COUNTRY_COLORS = {
  'JP Japan':           { color: '#c0392b', width: 2.5, dash: [] },
  'SE Sweden':          { color: '#8a8478', width: 1.4, dash: [5,3] },
  'FI Finland':         { color: '#aaa49a', width: 1.4, dash: [5,3] },
  'DE Germany':         { color: '#b8afa4', width: 1.4, dash: [5,3] },
  'US United States':   { color: '#9a9490', width: 1.4, dash: [5,3] },
  'KR South Korea':     { color: '#7a8f9f', width: 1.6, dash: [8,3] },
  'CN China':           { color: '#9fa88f', width: 1.4, dash: [5,3] },
  'CH Switzerland':     { color: '#b0a898', width: 1.4, dash: [5,3] },
  'HK Hong Kong (CN)':  { color: '#a8a0a0', width: 1.4, dash: [5,3] },
};

function getCountryCfg(country) {
  return COUNTRY_COLORS[country] ?? { color: '#ccc', width: 1.2, dash: [3,3] };
}

export function buildCountryCompareChart(indexedData, cn_code, canvasId) {
  const filtered = indexedData.filter(r => r.cn_code === cn_code);
  if (!filtered.length) return;

  const years = [...new Set(filtered.map(r => r.year))].sort();
  const labels = years.map(String);

  // Sort: Japan first, then others by name
  const countries = [...new Set(filtered.map(r => r.country))].sort((a, b) => {
    if (a.includes('Japan')) return -1;
    if (b.includes('Japan')) return 1;
    return a.localeCompare(b);
  });

  const byCountry = groupBy(filtered, r => r.country);

  const datasets = countries.map(country => {
    const cfg = getCountryCfg(country);
    const data = valuesByYear(years, byCountry.get(country) || [], r => r.year, r => r.index);
    return {
      label: country.replace(/^[A-Z]{2,3}\s/, ''), // strip country code prefix
      data,
      borderColor: cfg.color,
      backgroundColor: 'transparent',
      borderWidth: cfg.width,
      borderDash: cfg.dash,
      pointRadius: country.includes('Japan') ? 3 : 1.5,
      pointBackgroundColor: cfg.color,
      tension: 0.1,
      spanGaps: true,
    };
  });

  // Reference line at 100
  const annotations = {
    ...buildBreakAnnotations(labels),
    baseline: {
      type: 'line',
      yMin: 100, yMax: 100,
      borderColor: 'rgba(0,0,0,0.15)',
      borderWidth: 1,
      borderDash: [4, 4],
    }
  };

  return createChart(canvasId, 'line', { labels, datasets }, {
    plugins: {
      annotation: { annotations },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1) ?? '—'}`,
        }
      },
    },
    scales: {
      y: {
        ticks: { callback: v => v + '' },
        title: { display: true, text: 'Index (2018 = 100)', font: { size: 10 } },
      }
    },
  });
}
