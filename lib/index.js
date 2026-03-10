/**
 * index.js — Estonia × Japan Trade Dashboard
 * Architecture: data layer → chart factories → page orchestrator
 * Each function has one responsibility; shared config lives in constants.
 */

'use strict';

import { DATA_PATH } from './constants/constants.js'
import { fetchData } from './utils/utils.js';
import { renderHeatmap } from './builders/maps/heatMap.js';
import { buildCommoditiesChart } from './builders/charts/commoditiesChart.js';
import { renderTreemap } from './builders/maps/treeMap.js'
import { buildIndexChart } from './builders/charts/indexChart.js';
import { buildShareChart } from './builders/charts/shareChart.js';
import { renderEpaTable } from './builders/tables/epaTable.js';
import { renderSlopeChart } from './builders/charts/slopeChart.js';
import { renderStatRow } from './builders/statRow.js';
import { buildBilateralChart } from './builders/charts/bilateralChart.js';


// @ts-ignore
async function initDashboard() {
  try {
    // @ts-ignore
    const [tradeData, commoditiesData, partnerData] = await Promise.all([
      fetchData('japan_trade.json', DATA_PATH),
      fetchData('commodities.json', DATA_PATH),
      fetchData('partner_countries.json', DATA_PATH),
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

function initNavHighlight() {
  const sections = document.querySelectorAll('main section[id]');
  const links = document.querySelectorAll('.page-nav a[href^="#"]');
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
}


document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  initNavHighlight();
});