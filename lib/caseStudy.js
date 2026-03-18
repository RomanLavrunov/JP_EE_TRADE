/**
 * case_study.js — Estonia × Japan Full Case Study
 * Pareto methodology v21: Group A / Group B / Spike classification
 * Removed: heatIndexChart, slopeChart, z-score, control_vs_treatment
 * Added: spikeChart, pareto summary box
 */

'use strict';
import { DATA_PATH } from './constants/constants.js';
import { fetchData } from './utils/utils.js';
import { renderHeatmap } from './builders/maps/heatMap.js';
import { renderTreemap } from './builders/maps/treeMap.js';
import { buildShareBarChart } from './builders/charts/shareBarChart.js';
import { buildBalanceChart } from './builders/charts/balanceChart.js';
import { buildPartnersIndexChart } from './builders/charts/partnersIndexChart.js';
import { buildIndexGlobalChart } from './builders/charts/indexGlobalChart.js';
import { renderEpaTableCaseStudy } from './builders/tables/epaTable_cs.js';
import { buildRegionalChart } from './builders/charts/regionalChart.js';
import { buildPctBarChart } from './builders/charts/pctBarChart.js';
import { buildCNShareChart } from './builders/charts/cnShareChart.js';
import { buildPartnersAbsChart } from './builders/charts/partnersAbsChart.js';
import { buildImportCNChart } from './builders/charts/importCnChart.js';
import { buildTopCNChart } from './builders/charts/topCnChart.js';
import { buildBilateralChart } from './builders/charts/bilateralChart.js';
import { buildSpikeChart } from './builders/charts/spikeChart.js';
import { buildCountryCompareChart } from './builders/charts/countryCompareChart.js';


function initTocHighlight() {
  const sections = document.querySelectorAll('.content section[id]');
  const links = document.querySelectorAll('.toc a[href^="#"]');
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
  const sections = document.querySelectorAll('.content section[id]');
  const links = document.querySelectorAll('.page-nav a[href^="#"]');
  if (!sections.length || !links.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
  sections.forEach(s => observer.observe(s));
}

function renderParetoSummaryBox(paretoSummary, constants) {
  const el = document.getElementById('csParetoSummary');
  if (!el || !paretoSummary) return;

  const fmtM = v => v != null ? v.toFixed(2) + ' M€' : '—';
  const fmtPct = v => v != null ? (v > 0 ? '+' : '') + v + '%' : '—';

  const rows = paretoSummary.map(g => `
    <tr>
      <td><span class="badge badge-${g.pareto_group.toLowerCase()}">${g.pareto_group === 'Spike' ? '⚡ Spike' : 'Group ' + g.pareto_group}</span></td>
      <td class="val">${g.n_groups}</td>
      <td class="val">${fmtM(g.avg_pre)}</td>
      <td class="val">${fmtM(g.avg_post)}</td>
      <td class="val">${fmtPct(g.avg_pct_change)}</td>
    </tr>`).join('');

  el.innerHTML = `
    <h4>Pareto classification summary — Export (Estonia→Japan)</h4>
    <p class="pareto-note">Composite score = avg(share_FTA, share_Δ). 
      C3 = ${(constants.C3_exp/1e6).toFixed(1)} M€ total FTA volume · 
      D4 = ${(constants.D4_exp/1e6).toFixed(1)} M€ total absolute growth (growing groups only).</p>
    <table class="pareto-table">
      <thead><tr>
        <th>Group</th><th>Groups</th>
        <th>Avg pre-EPA (M€)</th><th>Avg post-EPA (M€)</th><th>Avg % change</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// @ts-ignore
async function initCaseStudy() {
  try {
    // @ts-ignore
    const [tradeData, commoditiesData, partnerData] = await Promise.all([
      fetchData('japan_trade.json', DATA_PATH),
      fetchData('commodities.json', DATA_PATH),
      fetchData('partner_countries.json', DATA_PATH),
    ]);

    const { bilateral, index: indexData } = tradeData;
    const {
      exports_timeseries,
      imports_timeseries,
      spike_timeseries,
      share,
      epa_comparison,
      pareto_summary,
      pareto_constants,
      regional,
      world_exports_timeseries,
      country_cn_index,
    } = commoditiesData;

    // 04a — Japan bilateral dynamics
    buildBilateralChart(bilateral);
    buildBalanceChart(bilateral);
    buildShareBarChart(bilateral);
    buildIndexGlobalChart(indexData);

    // 04b — Partner countries
    buildPartnersIndexChart(partnerData);
    buildPartnersAbsChart(partnerData);

    // 04c — Commodities: Pareto Group A + B export lines (solid/dashed)
    buildTopCNChart(exports_timeseries);

    // Import lines (Group A solid, Group B dashed)
    buildImportCNChart(imports_timeseries);

    // Japan's share of Estonia total exports per CN group
    buildCNShareChart(share);

    // EPA comparison table (sorted A→B→Spike with group badges)
    renderEpaTableCaseStudy(epa_comparison, 'csEpaTableBody');

    // Grouped bar: Japan % vs World % change (Group A+B, no spikes)
    buildPctBarChart(epa_comparison);

    // Pareto summary box
    renderParetoSummaryBox(pareto_summary, pareto_constants);

    // Treemap — export structure 2023
    renderTreemap(exports_timeseries, 'csTmCont');

    // Heatmap — index vs 2018 (uses world_exports_timeseries as proxy if index_vs_2018 absent)
    // Only render if the old index_vs_2018 field is present (backward compat)
    if (commoditiesData.index_vs_2018) {
      renderHeatmap(commoditiesData.index_vs_2018, 'csHmCont');
    }

    // Spike chart — CN03 Fish + CN81 Base metals: 2019 reaction without sustained growth
    buildSpikeChart(spike_timeseries, 'csChartSpike');

    // Regional charts
    buildRegionalChart('csChartRegWood', regional, 'CN44');
    buildRegionalChart('csChartRegFish', regional, 'CN03');

    // Country comparison charts — Japan vs partner countries, index 2018=100
    if (country_cn_index) {
      buildCountryCompareChart(country_cn_index, 'CN44', 'csChartCountryCN44');
      buildCountryCompareChart(country_cn_index, 'CN85', 'csChartCountryCN85');
      buildCountryCompareChart(country_cn_index, 'CN84', 'csChartCountryCN84');
      buildCountryCompareChart(country_cn_index, 'CN71', 'csChartCountryCN71');
    }

  } catch (err) {
    console.error('Case study init failed:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initCaseStudy();
  initTocHighlight();
  initNavHighlight();
});
