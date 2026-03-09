/**
 * case_study.js — Estonia × Japan Full Case Study
 * Architecture mirrors index.js: constants → data → factories → builders → orchestrator
 */

'use strict';
import { DATA_PATH } from './constants/constants.js';
import { fetchData } from './utils/utils.js';
import { renderHeatmap } from './builders/maps/heatMap.js'
import { renderSlopeChart } from './builders/charts/slopeChart.js'
import { renderTreemap } from './builders/maps/treeMap.js';
import { buildShareBarChart } from './builders/charts/shareBarChart.js';
import { buildBalanceChart } from './builders/charts/balanceChart.js';
import { buildPartnersIndexChart } from './builders/charts/partnersIndexChart.js';
import { buildHeatIndexChart } from './builders/charts/heatIndexChart.js';
import { buildIndexGlobalChart } from './builders/charts/indexGlobalChart.js';
import { renderEpaTableCaseStudy } from './builders/tables/epaTable_cs.js';
import { buildRegionalChart } from './builders/charts/regionalChart.js';
import { buildPctBarChart } from './builders/charts/pctBarChart.js';
import { buildCNShareChart } from './builders/charts/cnShareChart.js';
import { buildPartnersAbsChart } from './builders/charts/partnersAbsChart.js';
import { buildImportCNChart } from './builders/charts/importCnChart.js';
import { buildTopCNChart } from './builders/charts/topCnChart.js';
import { buildBilateralChartCaseStudy } from './builders/charts/bilateralChart_cs.js';


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

// @ts-ignore - async/Promise available in runtime but not in TS lib config
async function initCaseStudy() {
  try {
    // @ts-ignore - Promise available in runtime but not in TS lib config
    const [tradeData, commoditiesData, partnerData] = await Promise.all([
      fetchData('japan_trade.json', DATA_PATH),
      fetchData('commodities.json', DATA_PATH),
      fetchData('partner_countries.json', DATA_PATH),
    ]);

    console.log("CD CASE STUDY",commoditiesData);

    const { bilateral, index: indexData } = tradeData;
    const { exports_timeseries, imports_timeseries, share, epa_comparison, index_vs_2018, regional } = commoditiesData;
  
    // 04a Japan dynamics
    buildBilateralChartCaseStudy(bilateral);
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
    renderEpaTableCaseStudy(epa_comparison, 'csEpaTableBody');
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

document.addEventListener('DOMContentLoaded', () => {
  initCaseStudy();
  initTocHighlight();
  initNavHighlight();
});