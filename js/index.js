/**
 * index.js — Estonia × Japan Trade Dashboard
 * Architecture: data layer → chart factories → page orchestrator
 * Each function has one responsibility; shared config lives in constants.
 */

'use strict';

// ─────────────────────────────────────────────
// 1. CONSTANTS
// ─────────────────────────────────────────────

const COLORS = {
  accent:   '#c0392b',
  accent2:  '#1d3557',
  accent3:  '#2d6a4f',
  ink:      '#1a1814',
  ink3:     '#8a8478',
  border:   '#d4cfc4',
  surface:  '#edeae0',
  up:       '#2d6a4f',
  down:     '#c0392b',
  exports:  '#1d3557',
  imports:  '#c0392b',
  balance:  '#2d6a4f',
};

const BREAKS = [
  { x: '2019', label: 'EPA', color: COLORS.accent3 },
  { x: '2020', label: 'COVID', color: '#d35400' },
  { x: '2022', label: 'War', color: COLORS.ink3 },
];

const BASE_FONT = { family: "'DM Mono', monospace", size: 11 };

/** Palette for multi-series commodity charts */
const CN_PALETTE = [
  '#1d3557','#c0392b','#2d6a4f','#d35400','#457b9d',
  '#6b4f3a','#8a2be2','#2e8b57','#b8860b','#4682b4','#708090',
];

const DATA_PATH = 'data/';

// ─────────────────────────────────────────────
// 2. DATA LAYER
// ─────────────────────────────────────────────

/**
 * Fetch a JSON file from the data directory.
 * Returns parsed object or throws on error.
 */
async function fetchData(filename) {
  const res = await fetch(DATA_PATH + filename);
  if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
  return res.json();
}

/**
 * Group an array of records by a key, returning Map<key, record[]>
 */
function groupBy(arr, keyFn) {
  return arr.reduce((map, item) => {
    const k = keyFn(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
    return map;
  }, new Map());
}

/**
 * Extract unique sorted values of a field from an array
 */
function uniqueSorted(arr, field) {
  return [...new Set(arr.map(r => r[field]))].sort();
}

// ─────────────────────────────────────────────
// 3. CHART BASE FACTORY
// ─────────────────────────────────────────────

/**
 * Returns the shared Chart.js default options object.
 * Plugins / scales can be merged on top.
 */
function baseOptions(overrides = {}) {
  return Chart.helpers.merge({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600 },
    plugins: {
      legend: {
        labels: { font: BASE_FONT, color: COLORS.ink3, boxWidth: 12, padding: 16 },
      },
      tooltip: {
        backgroundColor: COLORS.ink,
        titleFont: BASE_FONT,
        bodyFont: BASE_FONT,
        padding: 10,
        callbacks: {},
      },
    },
    scales: {
      x: {
        grid: { color: COLORS.border, lineWidth: 0.5 },
        ticks: { font: BASE_FONT, color: COLORS.ink3 },
      },
      y: {
        grid: { color: COLORS.border, lineWidth: 0.5 },
        ticks: { font: BASE_FONT, color: COLORS.ink3 },
        beginAtZero: true,
      },
    },
  }, overrides);
}

/**
 * Create a Chart.js instance and return it.
 * @param {string}  canvasId  - DOM id of the canvas
 * @param {string}  type      - 'line' | 'bar' | 'scatter' …
 * @param {object}  data      - Chart.js data object
 * @param {object}  options   - merged on top of baseOptions
 */
function createChart(canvasId, type, data, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  return new Chart(ctx, { type, data, options: baseOptions(options) });
}

// ─────────────────────────────────────────────
// 4. ANNOTATION HELPERS
// ─────────────────────────────────────────────

/**
 * Build Chart.js annotation plugin config for the three structural breaks.
 * Only include years that exist in the provided labels array.
 */
function buildBreakAnnotations(labels) {
  const annotations = {};
  BREAKS.forEach(({ x, label, color }) => {
    if (!labels.includes(x)) return;
    annotations[`line_${x}`] = {
      type: 'line',
      scaleID: 'x',
      value: x,
      borderColor: color,
      borderWidth: 1.5,
      borderDash: [4, 3],
      label: {
        content: label,
        display: true,
        position: 'start',
        backgroundColor: color,
        font: { ...BASE_FONT, size: 10 },
        padding: { x: 5, y: 3 },
      },
    };
  });
  return annotations;
}

// ─────────────────────────────────────────────
// 5. CHART BUILDERS — each builds one specific chart
// ─────────────────────────────────────────────

/**
 * Chart 1: Bilateral exports & imports over time
 */
function buildBilateralChart(bilateral) {
  const labels = bilateral.map(r => String(r.year));

  return createChart('chartBilateral', 'line', {
    labels,
    datasets: [
      {
        label: 'Exports',
        data: bilateral.map(r => r.exports),
        borderColor: COLORS.exports,
        backgroundColor: 'rgba(29,53,87,.08)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 3,
      },
      {
        label: 'Imports',
        data: bilateral.map(r => r.imports),
        borderColor: COLORS.imports,
        backgroundColor: 'rgba(192,57,43,.06)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 3,
      },
    ],
  }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} M€`,
        },
      },
    },
    scales: {
      y: { ticks: { callback: v => v + ' M€' } },
    },
  });
}

/**
 * Chart 2: Japan's share in Estonia's total trade
 */
function buildShareChart(bilateral) {
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
      annotation: { annotations: buildBreakAnnotations(labels) },
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

/**
 * Chart 3: Export growth index — Japan vs global
 */
function buildIndexChart(indexData, partnerData) {
  const years = uniqueSorted(indexData, 'year');
  const labels = years.map(String);

  // Japan & Global from japan_trade.json index
  const bySeriesJp = groupBy(indexData, r => r.series);
  const jpExports  = years.map(y => bySeriesJp.get('Japan · Exports')?.find(r => r.year === y)?.index ?? null);
  const glExports  = years.map(y => bySeriesJp.get('Global · Exports')?.find(r => r.year === y)?.index ?? null);

  // Partner countries from partner_countries.json
  const byCountry = groupBy(partnerData.index_exports, r => r.country);
  const partnerDatasets = [];
  const partnerNames = [...byCountry.keys()].filter(c => c !== 'JP Japan');

  partnerNames.forEach((country, i) => {
    const rows = byCountry.get(country);
    const data = years.map(y => rows.find(r => r.year === y)?.index ?? null);
    const isKorea = country.includes('Korea');
    partnerDatasets.push({
      label: country,
      data,
      borderColor: CN_PALETTE[(i + 2) % CN_PALETTE.length],
      borderWidth: isKorea ? 2 : 1,
      tension: 0.3,
      pointRadius: isKorea ? 3 : 1.5,
      borderDash: isKorea ? [] : [3, 3],
      fill: false,
    });
  });

  return createChart('chartIndex', 'line', {
    labels,
    datasets: [
      {
        label: 'Japan exports',
        data: jpExports,
        borderColor: COLORS.accent,
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 4,
        fill: false,
      },
      {
        label: 'Global exports',
        data: glExports,
        borderColor: COLORS.ink3,
        borderWidth: 1.5,
        borderDash: [6, 3],
        tension: 0.3,
        pointRadius: 2,
        fill: false,
      },
      ...partnerDatasets,
    ],
  }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1) ?? '—'}`,
        },
      },
    },
    scales: {
      y: { ticks: { callback: v => v } },
    },
  });
}

/**
 * Chart 4: Commodity export time series
 */
function buildCommoditiesChart(exportsTs) {
  const years  = uniqueSorted(exportsTs, 'year');
  const labels = years.map(String);
  const byCN   = groupBy(exportsTs, r => r.cn_code);

  const datasets = [...byCN.entries()].map(([code, rows], i) => ({
    label: `${code} ${rows[0].cn_name.split(' ').slice(0, 3).join(' ')}…`,
    data: years.map(y => rows.find(r => r.year === y)?.value ?? null),
    borderColor: CN_PALETTE[i % CN_PALETTE.length],
    backgroundColor: CN_PALETTE[i % CN_PALETTE.length] + '20',
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
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(2) ?? '—'} M€`,
        },
      },
    },
    scales: {
      y: { ticks: { callback: v => v + ' M€' } },
    },
  });
}

// ─────────────────────────────────────────────
// 6. DOM BUILDERS — stats, table, treemap, slope, heatmap
// ─────────────────────────────────────────────

/**
 * Render the summary stat row from bilateral data
 */
function renderStatRow(bilateral) {
  const pre  = bilateral.filter(r => r.year >= 2014 && r.year <= 2018);
  const post = bilateral.filter(r => r.year >= 2019 && r.year <= 2023);

  const avg = arr => arr.reduce((s, r) => s + r.exports, 0) / arr.length;
  const preAvg  = avg(pre);
  const postAvg = avg(post);
  const pctChange = ((postAvg - preAvg) / preAvg * 100).toFixed(0);

  const peak   = bilateral.reduce((a, b) => a.exports > b.exports ? a : b);
  const latest = bilateral[bilateral.length - 1];

  const stats = [
    { v: `${postAvg.toFixed(0)} M€`, cls: 'up',  l: 'Avg exports post-EPA\n(2019–2023)' },
    { v: `+${pctChange}%`,           cls: 'up',  l: 'vs pre-EPA avg\n(2014–2018)' },
    { v: `${peak.exports} M€`,       cls: 'neu', l: `Peak exports\n(${peak.year})` },
    { v: `${latest.balance.toFixed(1)} M€`, cls: 'up', l: `Trade balance\n(${latest.year})` },
  ];

  const el = document.getElementById('statRow');
  if (!el) return;
  el.innerHTML = stats.map(s => `
    <div class="stat-cell">
      <div class="stat-v ${s.cls}">${s.v}</div>
      <div class="stat-l">${s.l.replace('\n', '<br>')}</div>
    </div>`).join('');
}

/**
 * Render EPA comparison table
 */
function renderEpaTable(epaData) {
  const tbody = document.getElementById('epaTableBody');
  if (!tbody) return;

  // Summarise CN name to first 5 words
  const shortName = name => name.split(' ').slice(0, 5).join(' ') + '…';

  tbody.innerHTML = epaData
    .sort((a, b) => b.post - a.post)
    .map(row => {
      const dir   = row.direction === 'up' ? 'up' : 'down';
      const arrow = row.direction === 'up' ? '▲' : '▼';
      return `
        <tr>
          <td>${row.cn_code} · ${shortName(row.cn_name)}</td>
          <td>${row.pre.toFixed(2)}</td>
          <td>${row.post.toFixed(2)}</td>
          <td class="${dir}">${arrow} ${row.pct_change > 0 ? '+' : ''}${row.pct_change}%</td>
        </tr>`;
    }).join('');
}

/**
 * Build treemap using flexbox proportional layout.
 * Items are laid out in rows; each row is filled until ~50% of total weight.
 */
function renderTreemap(exportsTs, containerId) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  const YEAR = 2023;
  const rows = exportsTs.filter(r => r.year === YEAR);
  const total = rows.reduce((s, r) => s + (r.value || 0), 0);
  if (!total) return;

  // Sort descending by value
  const sorted = [...rows].sort((a, b) => (b.value || 0) - (a.value || 0));

  const PALETTE = [
    '#a8c4d8','#c8dce8','#d4c5a9','#b5c9b5','#dbc6b5',
    '#c5b8d4','#b8d4c5','#d4b8b8','#c8c8b8','#b8c8d4','#d4d4c8',
  ];

  // Pack into rows: greedy, target row weight ≈ 0.45 of total
  const TARGET = 0.45;
  const tmRows = [];
  let current  = [];
  let currentW = 0;

  sorted.forEach(item => {
    const w = (item.value || 0) / total;
    current.push(item);
    currentW += w;
    if (currentW >= TARGET) {
      tmRows.push(current);
      current  = [];
      currentW = 0;
    }
  });
  if (current.length) tmRows.push(current);

  const outerEl = document.createElement('div');
  outerEl.className = 'tm-outer';

  tmRows.forEach(rowItems => {
    const rowEl = document.createElement('div');
    rowEl.className = 'tm-row';

    rowItems.forEach((item, i) => {
      const pct = ((item.value || 0) / total * 100).toFixed(1);
      const cell = document.createElement('div');
      cell.className = 'tm-cell';
      cell.style.flexGrow = String(item.value || 1);
      cell.style.background = PALETTE[i % PALETTE.length];
      cell.title = `${item.cn_code}: ${item.value?.toFixed(2)} M€ (${pct}%)`;
      cell.innerHTML = `
        <span class="tm-code">${item.cn_code}</span>
        <span class="tm-name">${item.cn_name.split(' ').slice(0, 3).join(' ')}</span>
        <span class="tm-val">${item.value?.toFixed(1)}M€</span>`;
      rowEl.appendChild(cell);
    });

    outerEl.appendChild(rowEl);
  });

  cont.innerHTML = '';
  cont.appendChild(outerEl);
}

/**
 * Build SVG slope chart across key years.
 */
function renderSlopeChart(exportsTs, containerId) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  const KEY_YEARS = [2015, 2018, 2019, 2022, 2024];
  const byCN      = groupBy(exportsTs, r => r.cn_code);
  const codes     = [...byCN.keys()];

  const W = Math.max(cont.clientWidth || 600, 400);
  const H = 300;
  const PAD = { top: 30, right: 60, bottom: 20, left: 50 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top  - PAD.bottom;

  // Compute all values for y-scale
  const allVals = codes.flatMap(code =>
    KEY_YEARS.map(y => byCN.get(code)?.find(r => r.year === y)?.value || 0)
  );
  const maxVal = Math.max(...allVals) * 1.1;

  const xScale = i => PAD.left + (i / (KEY_YEARS.length - 1)) * innerW;
  const yScale = v => PAD.top  + innerH - (v / maxVal) * innerH;

  const lines = codes.map((code, ci) => {
    const color = CN_PALETTE[ci % CN_PALETTE.length];
    const pts   = KEY_YEARS.map((y, i) => {
      const val = byCN.get(code)?.find(r => r.year === y)?.value || 0;
      return [xScale(i), yScale(val)];
    });
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const lastPt = pts[pts.length - 1];
    return `
      <path d="${d}" stroke="${color}" stroke-width="1.5" fill="none" opacity="0.8"/>
      <text x="${lastPt[0] + 5}" y="${lastPt[1] + 4}" font-size="9"
            fill="${color}" font-family="DM Mono, monospace">${code}</text>`;
  }).join('');

  const xLabels = KEY_YEARS.map((y, i) =>
    `<text x="${xScale(i)}" y="${H - 4}" text-anchor="middle" font-size="10"
           fill="#8a8478" font-family="DM Mono, monospace">${y}</text>
     <line x1="${xScale(i)}" y1="${PAD.top}" x2="${xScale(i)}" y2="${H - PAD.bottom}"
           stroke="#d4cfc4" stroke-width="0.5"/>`
  ).join('');

  cont.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:360px">
      ${xLabels}
      ${lines}
    </svg>`;
}

/**
 * Build HTML heatmap table (growth index vs 2018)
 */
function renderHeatmap(indexVs2018, containerId) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  const years = uniqueSorted(indexVs2018, 'year');
  const codes = uniqueSorted(indexVs2018, 'cn_code');
  const POST_EPA = new Set(['2019','2020','2021','2022','2023','2024']);

  /** Map index value to background colour */
  function cellColor(idx) {
    if (idx === null || idx === undefined) return '#edeae0';
    const v = idx - 100; // deviation from baseline
    if (v > 0) {
      const intensity = Math.min(v / 200, 1);
      const g = Math.round(106 + intensity * 50);
      return `rgba(45,${g},79,${0.15 + intensity * 0.55})`;
    } else {
      const intensity = Math.min(Math.abs(v) / 100, 1);
      return `rgba(192,57,43,${0.12 + intensity * 0.55})`;
    }
  }

  const byKey = new Map(
    indexVs2018.map(r => [`${r.cn_code}_${r.year}`, r.index_vs_2018])
  );

  const headerCells = years.map(y =>
    `<th style="${POST_EPA.has(String(y)) ? 'font-weight:700;color:#1a1814' : ''}">${y}</th>`
  ).join('');

  const bodyRows = codes.map(code => {
    const cells = years.map(y => {
      const val = byKey.get(`${code}_${y}`);
      const bg  = cellColor(val);
      const txt = val != null ? val.toFixed(0) : '—';
      return `<td style="background:${bg}">${txt}</td>`;
    }).join('');
    return `<tr><td class="rl">${code}</td>${cells}</tr>`;
  }).join('');

  cont.innerHTML = `
    <div class="hm-scroll">
      <table class="hm">
        <thead><tr><th class="rl">Group</th>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
}

// ─────────────────────────────────────────────
// 7. PAGE ORCHESTRATOR
// ─────────────────────────────────────────────

async function initDashboard() {
  try {
    const [tradeData, commoditiesData, partnerData] = await Promise.all([
      fetchData('japan_trade.json'),
      fetchData('commodities.json'),
      fetchData('partner_countries.json'),
    ]);

    const { bilateral, index: indexData } = tradeData;

    // Stats + overview charts
    renderStatRow(bilateral);
    buildBilateralChart(bilateral);
    buildShareChart(bilateral);

    // Partner comparison
    buildIndexChart(indexData, partnerData);

    // Commodities
    buildCommoditiesChart(commoditiesData.exports_timeseries);
    renderEpaTable(commoditiesData.epa_comparison);

    // Structure views
    renderTreemap(commoditiesData.exports_timeseries, 'treemapCont');
    renderSlopeChart(commoditiesData.exports_timeseries, 'slopeCont');
    renderHeatmap(commoditiesData.index_vs_2018, 'heatmapCont');

  } catch (err) {
    console.error('Dashboard init failed:', err);
  }
}

// ─────────────────────────────────────────────
// 8. ACTIVE NAV HIGHLIGHT
// ─────────────────────────────────────────────

function initNavHighlight() {
  const sections = [...document.querySelectorAll('main section[id]')];
  const links    = [...document.querySelectorAll('.page-nav a[href^="#"]')];
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

// ─────────────────────────────────────────────
// 9. BOOT
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  initNavHighlight();
});