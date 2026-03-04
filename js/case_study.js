/**
 * case_study.js — Estonia × Japan Full Case Study
 * Architecture mirrors index.js: constants → data → factories → builders → orchestrator
 */

'use strict';

// 1. CONSTANTS (shared with index.js conceptually; kept local for independence)

const COLORS = {
  accent:  '#c0392b',
  accent2: '#1d3557',
  accent3: '#2d6a4f',
  ink:     '#1a1814',
  ink3:    '#8a8478',
  border:  '#d4cfc4',
  exports: '#1d3557',
  imports: '#c0392b',
};

const BREAKS = [
  { x: '2019', label: 'EPA',   color: COLORS.accent3 },
  { x: '2020', label: 'COVID', color: '#d35400'      },
  { x: '2022', label: 'War',   color: COLORS.ink3    },
];

const BASE_FONT = { family: "'DM Mono', monospace", size: 11 };

const CN_PALETTE = [
  '#1d3557','#c0392b','#2d6a4f','#d35400','#457b9d',
  '#6b4f3a','#8a2be2','#2e8b57','#b8860b','#4682b4','#708090',
];

const DATA_PATH = 'data/';

// Short readable names for CN commodity groups (used in tooltips and heatmap)
const CN_NAMES = {
  CN03: 'Fish & crustaceans',
  CN04: 'Dairy produce & eggs',
  CN08: 'Edible fruit & nuts',
  CN27: 'Mineral fuels & oils',
  CN28: 'Inorganic chemicals',
  CN44: 'Wood & wood articles',
  CN84: 'Machinery & boilers',
  CN85: 'Electrical machinery',
  CN90: 'Optical & precision instruments',
  CN94: 'Furniture & lighting',
  CN95: 'Toys & sports goods',
};

// 2. DATA LAYER

async function fetchData(filename) {
  const res = await fetch(DATA_PATH + filename);
  if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
  return res.json();
}

function groupBy(arr, keyFn) {
  return arr.reduce((map, item) => {
    const k = keyFn(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
    return map;
  }, new Map());
}

function uniqueSorted(arr, field) {
  return [...new Set(arr.map(r => r[field]))].sort();
}

// 3. CHART BASE FACTORY

function baseOptions(overrides = {}) {
  return Chart.helpers.merge({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600 },
    plugins: {
      legend: {
        labels: { font: BASE_FONT, color: COLORS.ink3, boxWidth: 12, padding: 14 },
      },
      tooltip: {
        backgroundColor: COLORS.ink,
        titleFont: BASE_FONT,
        bodyFont: BASE_FONT,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid:  { color: COLORS.border, lineWidth: 0.5 },
        ticks: { font: BASE_FONT, color: COLORS.ink3 },
      },
      y: {
        grid:       { color: COLORS.border, lineWidth: 0.5 },
        ticks:      { font: BASE_FONT, color: COLORS.ink3 },
        beginAtZero: true,
      },
    },
  }, overrides);
}

function createChart(canvasId, type, data, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  return new Chart(canvas.getContext('2d'), { type, data, options: baseOptions(options) });
}

// 4. ANNOTATION HELPER

function buildBreakAnnotations(labels) {
  return BREAKS
    .filter(({ x }) => labels.includes(x))
    .reduce((acc, { x, label, color }) => {
      acc[`line_${x}`] = {
        type: 'line', scaleID: 'x', value: x,
        borderColor: color, borderWidth: 1.5, borderDash: [4, 3],
        label: {
          content: label, display: true, position: 'start',
          backgroundColor: color,
          font: { ...BASE_FONT, size: 10 }, padding: { x: 5, y: 3 },
        },
      };
      return acc;
    }, {});
}

// 5. REUSABLE DATASET FACTORIES

//Create a line dataset with sensible defaults
function lineDataset(label, data, color, overrides = {}) {
  return {
    label, data,
    borderColor: color,
    backgroundColor: color + '18',
    borderWidth: 2,
    tension: 0.3,
    pointRadius: 3,
    fill: false,
    ...overrides,
  };
}

//Create a bar dataset
function barDataset(label, data, color, overrides = {}) {
  return { label, data, backgroundColor: color, borderRadius: 2, ...overrides };
}

// 6. CHART BUILDERS

function buildBilateralChart(bilateral) {
  const labels = bilateral.map(r => String(r.year));
  return createChart('csChartBilateral', 'line', {
    labels,
    datasets: [
      lineDataset('Exports', bilateral.map(r => r.exports), COLORS.exports, { fill: true, backgroundColor: 'rgba(29,53,87,.08)' }),
      lineDataset('Imports', bilateral.map(r => r.imports), COLORS.imports, { fill: true, backgroundColor: 'rgba(192,57,43,.06)' }),
    ],
  }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} M€` } },
    },
    scales: { y: { ticks: { callback: v => v + ' M€' } } },
  });
}

function buildBalanceChart(bilateral) {
  const labels = bilateral.map(r => String(r.year));
  return createChart('csChartBalance', 'bar', {
    labels,
    datasets: [barDataset('Balance', bilateral.map(r => r.balance), 'rgba(45,106,79,.7)')],
  }, {
    plugins: {
      legend: { display: false },
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: { callbacks: { label: ctx => ` Balance: ${ctx.parsed.y.toFixed(1)} M€` } },
    },
    scales: { y: { ticks: { callback: v => v + ' M€' } } },
  });
}

function buildShareBarChart(bilateral) {
  const labels = bilateral.map(r => String(r.year));
  return createChart('csChartShareBar', 'bar', {
    labels,
    datasets: [
      barDataset('Export share', bilateral.map(r => +(r.shareExp).toFixed(2)), 'rgba(29,53,87,.75)'),
      barDataset('Import share', bilateral.map(r => +(r.shareImp).toFixed(2)), 'rgba(192,57,43,.65)'),
    ],
  }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%` } },
    },
    scales: { y: { ticks: { callback: v => v + '%' } } },
  });
}

function buildIndexGlobalChart(indexData) {
  const years  = uniqueSorted(indexData, 'year');
  const labels = years.map(String);
  const bySeries = groupBy(indexData, r => r.series);

  const get = (series, y) => bySeries.get(series)?.find(r => r.year === y)?.index ?? null;

  return createChart('csChartIndexGlobal', 'line', {
    labels,
    datasets: [
      lineDataset('Japan exports',  years.map(y => get('Japan · Exports', y)),  COLORS.exports,  { borderWidth: 3 }),
      lineDataset('Japan imports',  years.map(y => get('Japan · Imports', y)),  COLORS.imports),
      lineDataset('Global exports', years.map(y => get('Global · Exports', y)), COLORS.ink3, { borderDash: [6,3], borderWidth: 1.5 }),
      lineDataset('Global imports', years.map(y => get('Global · Imports', y)), '#d35400', { borderDash: [6,3], borderWidth: 1.5 }),
    ],
  }, {
    plugins: { annotation: { annotations: buildBreakAnnotations(labels) } },
    scales:  { y: { ticks: { callback: v => v } } },
  });
}

function buildPartnersIndexChart(partnerData) {
  const years  = uniqueSorted(partnerData.index_exports, 'year');
  const labels = years.map(String);
  const byCN   = groupBy(partnerData.index_exports, r => r.country);

  const datasets = [...byCN.entries()].map(([country, rows], i) => {
    const isJapan = country.includes('Japan');
    const isKorea = country.includes('Korea');
    return lineDataset(
      country,
      years.map(y => rows.find(r => r.year === y)?.index ?? null),
      isJapan ? COLORS.accent : CN_PALETTE[(i + 2) % CN_PALETTE.length],
      {
        borderWidth: isJapan ? 3 : isKorea ? 2 : 1,
        pointRadius: isJapan ? 4 : isKorea ? 3 : 1.5,
        borderDash:  isJapan || isKorea ? [] : [3, 3],
      }
    );
  });

  return createChart('csChartPartners', 'line', { labels, datasets }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1) ?? '—'}` } },
    },
  });
}

function buildPartnersAbsChart(partnerData) {
  const years  = uniqueSorted(partnerData.abs_exports, 'year');
  const labels = years.map(String);
  const byCN   = groupBy(partnerData.abs_exports, r => r.country);


  const datasets = [...byCN.entries()].map(([country, rows], i) =>
    lineDataset(
      country,
      years.map(y => rows.find(r => r.year === y)?.value_mln ?? null),
      country.includes('Japan') ? COLORS.accent : CN_PALETTE[(i + 2) % CN_PALETTE.length],
      { borderWidth: country.includes('Japan') ? 3 : 1.5 }
    )
  );

  console.log(byCN)

  return createChart('csChartPartnersAbs', 'line', { labels, datasets }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1) ?? '—'} M€` } },
    },
    scales: { y: { ticks: { callback: v => v + ' M€' } } },
  });
}

function buildTopCNChart(exportsTs) {
  const years  = uniqueSorted(exportsTs, 'year');
  const labels = years.map(String);
  const byCN   = groupBy(exportsTs, r => r.cn_code);

  const datasets = [...byCN.entries()].map(([code, rows], i) =>
    lineDataset(
      `${code}`,
      years.map(y => rows.find(r => r.year === y)?.value ?? null),
      CN_PALETTE[i % CN_PALETTE.length]
    )
  );

  return createChart('csChartTopCN', 'line', { labels, datasets }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: {
        callbacks: {
          label: ctx => {
            const code = ctx.dataset.label;
            const name = CN_NAMES[code] ? ` — ${CN_NAMES[code]}` : '';
            return ` ${code}${name}: ${ctx.parsed.y?.toFixed(2) ?? '—'} M€`;
          },
        },
      },
    },
    scales:  { y: { ticks: { callback: v => v + ' M€' } } },
  });
}

function buildImportCNChart(importsTs) {
  const years  = uniqueSorted(importsTs, 'year');
  const labels = years.map(String);
  const byCN   = groupBy(importsTs, r => r.cn_code);

  const datasets = [...byCN.entries()].map(([code, rows], i) =>
    lineDataset(code, years.map(y => rows.find(r => r.year === y)?.value ?? null), CN_PALETTE[i % CN_PALETTE.length])
  );

  return createChart('csChartImportCN', 'line', { labels, datasets }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: {
        callbacks: {
          label: ctx => {
            const code = ctx.dataset.label;
            const name = CN_NAMES[code] ? ` — ${CN_NAMES[code]}` : '';
            return ` ${code}${name}: ${ctx.parsed.y?.toFixed(2) ?? '—'} M€`;
          },
        },
      },
    },
    scales:  { y: { ticks: { callback: v => v + ' M€' } } },
  });
}

function buildCNShareChart(shareData) {
  const years  = uniqueSorted(shareData, 'year');
  const labels = years.map(String);
  const byCN   = groupBy(shareData, r => r.cn_code);

  const datasets = [...byCN.entries()].map(([code, rows], i) =>
    lineDataset(code, years.map(y => rows.find(r => r.year === y)?.jp_share_pct ?? null), CN_PALETTE[i % CN_PALETTE.length])
  );

  return createChart('csChartCNShare', 'line', { labels, datasets }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: {
        callbacks: {
          label: ctx => {
            const code = ctx.dataset.label;
            const name = CN_NAMES[code] ? ` — ${CN_NAMES[code]}` : '';
            return ` ${code}${name}: ${ctx.parsed.y?.toFixed(2) ?? '—'}%`;
          },
        },
      },
    },
    scales:  { y: { ticks: { callback: v => v + '%' } } },
  });
}

function buildPctBarChart(epaData) {
  // Exclude groups where pre-EPA is near zero (avoids 2000%+ outliers)
  const filtered = epaData.filter(r => r.pre >= 0.5).sort((a, b) => b.pct_change - a.pct_change);

  return createChart('csChartPctBar', 'bar', {
    labels: filtered.map(r => r.cn_code),
    datasets: [barDataset(
      '% change post-EPA vs pre-EPA',
      filtered.map(r => r.pct_change),
      filtered.map(r => r.direction === 'up' ? 'rgba(45,106,79,.75)' : 'rgba(192,57,43,.75)')
    )],
  }, {
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { callback: v => v + '%' } },
      x: { ticks: { font: BASE_FONT } },
    },
  });
}

function buildHeatIndexChart(indexVs2018) {
  const years  = uniqueSorted(indexVs2018, 'year');
  const labels = years.map(String);
  const byCN   = groupBy(indexVs2018, r => r.cn_code);

  const datasets = [...byCN.entries()].map(([code, rows], i) =>
    lineDataset(code, years.map(y => rows.find(r => r.year === y)?.index_vs_2018 ?? null), CN_PALETTE[i % CN_PALETTE.length])
  );

  return createChart('csChartHeatIndex', 'line', { labels, datasets }, {
    plugins: {
      annotation: { annotations: buildBreakAnnotations(labels) },
      tooltip: {
        callbacks: {
          label: ctx => {
            const code = ctx.dataset.label;
            const name = CN_NAMES[code] ? ` — ${CN_NAMES[code]}` : '';
            return ` ${code}${name}: ${ctx.parsed.y?.toFixed(1) ?? '—'}`;
          },
        },
      },
    },
    scales:  { y: { ticks: { callback: v => v } } },
  });
}

function buildRegionalChart(canvasId, regionalData, cnCode) {
  const rows = regionalData.filter(r => r.cn_code === cnCode);
  if (!rows.length) return;

  const years   = uniqueSorted(rows, 'year');
  const labels  = years.map(String);
  const regions = uniqueSorted(rows, 'region');
  const byRegion = groupBy(rows, r => r.region);

  const REGION_COLORS = ['#1d3557','#c0392b','#2d6a4f','#d35400','#457b9d','#8a8478'];

  const datasets = regions.map((region, i) =>
    barDataset(region, years.map(y => byRegion.get(region)?.find(r => r.year === y)?.value ?? 0), REGION_COLORS[i % REGION_COLORS.length])
  );

  return createChart(canvasId, 'bar', { labels, datasets }, {
    scales: {
      x: { stacked: true },
      y: { stacked: true, ticks: { callback: v => v + ' M€' } },
    },
  });
}

// 7. DOM BUILDERS

function renderEpaTable(epaData, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const shortName = name => name.split(' ').slice(0, 5).join(' ') + '…';

  tbody.innerHTML = [...epaData]
    .sort((a, b) => b.post - a.post)
    .map(row => {
      const dir   = row.direction === 'up' ? 'up' : 'down';
      const arrow = row.direction === 'up' ? '▲' : '▼';
      const sign  = row.pct_change > 0 ? '+' : '';
      return `<tr>
        <td>${row.cn_code} · ${shortName(row.cn_name)}</td>
        <td>${row.pre.toFixed(2)}</td>
        <td>${row.post.toFixed(2)}</td>
        <td class="${dir}">${arrow} ${sign}${row.pct_change}%</td>
      </tr>`;
    }).join('');
}

function renderTreemap(exportsTs, containerId) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  const YEAR   = 2023;
  const rows   = exportsTs.filter(r => r.year === YEAR);
  const total  = rows.reduce((s, r) => s + (r.value || 0), 0);
  if (!total) return;

  const PALETTE = [
    '#a8c4d8','#c8dce8','#d4c5a9','#b5c9b5','#dbc6b5',
    '#c5b8d4','#b8d4c5','#d4b8b8','#c8c8b8','#b8c8d4','#d4d4c8',
  ];

  const sorted = [...rows].sort((a, b) => (b.value || 0) - (a.value || 0));
  const TARGET = 0.45;
  const tmRows = [];
  let current = [], currentW = 0;

  sorted.forEach(item => {
    const w = (item.value || 0) / total;
    current.push(item);
    currentW += w;
    if (currentW >= TARGET) { tmRows.push(current); current = []; currentW = 0; }
  });
  if (current.length) tmRows.push(current);

  const outer = document.createElement('div');
  outer.className = 'tm-outer';

  tmRows.forEach(rowItems => {
    const rowEl = document.createElement('div');
    rowEl.className = 'tm-row';
    rowItems.forEach((item, i) => {
      const pct  = ((item.value || 0) / total * 100).toFixed(1);
      const cell = document.createElement('div');
      cell.className      = 'tm-cell';
      cell.style.flexGrow = String(item.value || 1);
      cell.style.background = PALETTE[i % PALETTE.length];
      cell.title          = `${item.cn_code}: ${item.value?.toFixed(2)} M€ (${pct}%)`;
      cell.innerHTML = `
        <span class="tm-code">${item.cn_code}</span>
        <span class="tm-name">${item.cn_name.split(' ').slice(0, 3).join(' ')}</span>
        <span class="tm-val">${item.value?.toFixed(1)}M€</span>`;
      rowEl.appendChild(cell);
    });
    outer.appendChild(rowEl);
  });

  cont.innerHTML = '';
  cont.appendChild(outer);
}

function renderSlopeChart(exportsTs, containerId) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  const KEY_YEARS = [2015, 2018, 2019, 2022, 2024];
  const byCN = groupBy(exportsTs, r => r.cn_code);
  const codes = [...byCN.keys()];

  const W = Math.max(cont.clientWidth || 560, 360);
  const H = 280;
  const PAD = { top: 28, right: 56, bottom: 20, left: 44 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top  - PAD.bottom;

  const allVals = codes.flatMap(c => KEY_YEARS.map(y => byCN.get(c)?.find(r => r.year === y)?.value || 0));
  const maxVal  = Math.max(...allVals) * 1.1;

  const xScale = i => PAD.left + (i / (KEY_YEARS.length - 1)) * innerW;
  const yScale = v => PAD.top  + innerH - (v / maxVal) * innerH;

  const paths = codes.map((code, ci) => {
    const color = CN_PALETTE[ci % CN_PALETTE.length];
    const pts   = KEY_YEARS.map((y, i) => [xScale(i), yScale(byCN.get(code)?.find(r => r.year === y)?.value || 0)]);
    const d     = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const last  = pts[pts.length - 1];
    return `<path d="${d}" stroke="${color}" stroke-width="1.5" fill="none" opacity="0.8"/>
            <text x="${last[0] + 4}" y="${last[1] + 4}" font-size="9" fill="${color}"
                  font-family="DM Mono, monospace">${code}</text>`;
  });

  const xAxis = KEY_YEARS.map((y, i) =>
    `<text x="${xScale(i)}" y="${H - 4}" text-anchor="middle" font-size="10"
           fill="#8a8478" font-family="DM Mono, monospace">${y}</text>
     <line x1="${xScale(i)}" y1="${PAD.top}" x2="${xScale(i)}" y2="${H - PAD.bottom}"
           stroke="#d4cfc4" stroke-width="0.5"/>`
  );

  cont.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:340px">
      ${xAxis.join('')}${paths.join('')}
    </svg>`;
}

function renderHeatmap(indexVs2018, containerId) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  const years = uniqueSorted(indexVs2018, 'year');
  const codes = uniqueSorted(indexVs2018, 'cn_code');
  const POST_EPA = new Set(['2019','2020','2021','2022','2023','2024']);

    // Map index value to background colour
  function cellColor(idx) {
    if (idx == null || idx === undefined) return '#f8f7f2';

    const v = (idx - 100) / 100;
    const clamped = Math.max(-1, Math.min(1, v));
    const intensity = Math.abs(clamped);

    if (clamped >= 0) {

      const r = Math.round(220 - intensity * 100);
      const g = Math.round(235 - intensity * 55);
      const b = Math.round(210 - intensity * 130);

      return `rgba(${r},${g},${b},${0.45 + intensity * 0.55})`;
    } else {

      const r = Math.round(245 - intensity * 35);
      const g = Math.round(220 - intensity * 140);
      const b = Math.round(210 - intensity * 140);

      return `rgba(${r},${g},${b},${0.45 + intensity * 0.55})`;
    }
  }
  

  const byKey = new Map(indexVs2018.map(r => [`${r.cn_code}_${r.year}`, r.index_vs_2018]));

  // Filter out rows where ALL values across all years are null
  const filteredCodes = codes.filter(code =>
    years.some(y => byKey.get(`${code}_${y}`) != null)
  );

  const headers = years.map(y =>
    `<th style="${POST_EPA.has(String(y)) ? 'font-weight:700;color:#1a1814' : ''}">${y}</th>`
  ).join('');

  const bodyRows = filteredCodes.map(code => {
    const name = CN_NAMES[code] ? ` · ${CN_NAMES[code]}` : '';
    const cells = years.map(y => {
      const val = byKey.get(`${code}_${y}`);
      return `<td style="background:${cellColor(val)}">${val != null ? val.toFixed(0) : '—'}</td>`;
    }).join('');
    return `<tr><td class="rl" title="${CN_NAMES[code] || code}">${code}<span style="color:#8a8478;font-weight:400">${name}</span></td>${cells}</tr>`;
  }).join('');

  cont.innerHTML = `
    <div class="hm-scroll">
      <table class="hm">
        <thead><tr><th class="rl">Group</th>${headers}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
}

// 8. TOC ACTIVE HIGHLIGHT

function initTocHighlight() {
  const sections = [...document.querySelectorAll('.content section[id]')];
  const links    = [...document.querySelectorAll('.toc a[href^="#"]')];
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

function initNavHighlight() {
  const sections = [...document.querySelectorAll('.content section[id]')];
  const links    = [...document.querySelectorAll('.page-nav a[href^="#"]')];
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

// 9. ORCHESTRATOR

async function initCaseStudy() {
  try {
    const [tradeData, commoditiesData, partnerData] = await Promise.all([
      fetchData('japan_trade.json'),
      fetchData('commodities.json'),
      fetchData('partner_countries.json'),
    ]);

    const { bilateral, index: indexData } = tradeData;
    const { exports_timeseries, imports_timeseries, share, epa_comparison, index_vs_2018, regional } = commoditiesData;

    // 04a Japan dynamics
    buildBilateralChart(bilateral);
    buildBalanceChart(bilateral);
    buildShareBarChart(bilateral);
    buildIndexGlobalChart(indexData);

    // 04b Partners
    buildPartnersIndexChart(partnerData);
    buildPartnersAbsChart(partnerData);

    // 04c Commodities
    buildTopCNChart(exports_timeseries);
    buildImportCNChart(imports_timeseries);
    buildCNShareChart(share);
    renderEpaTable(epa_comparison, 'csEpaTableBody');
    buildPctBarChart(epa_comparison);
    buildHeatIndexChart(index_vs_2018);
    renderTreemap(exports_timeseries, 'csTmCont');
    renderSlopeChart(exports_timeseries, 'csSlopeCont');
    renderHeatmap(index_vs_2018, 'csHmCont');

    // Regional charts (CN44 wood + CN03 fish)
    buildRegionalChart('csChartRegWood', regional, 'CN44');
    buildRegionalChart('csChartRegFish', regional, 'CN03');

  } catch (err) {
    console.error('Case study init failed:', err);
  }
}

// 10. BOOT

document.addEventListener('DOMContentLoaded', () => {
  initCaseStudy();
  initTocHighlight();
  initNavHighlight();
});