// EPA comparison table for case_study.html
// Columns: Group | Pre-EPA avg | Post-EPA avg (clean) | Japan % | World % | Signal
// Treatment groups normal rows; control groups styled with .ctrl class

const CONTROL = new Set(['CN03', 'CN04', 'CN95']);

function fmtPct(v) {
  if (v == null) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v}%`;
}

function signalBadge(row) {
  if (CONTROL.has(row.cn_code)) return `<span class="badge neutral">Control</span>`;
  if (row.cn_code === 'CN71') return `<span class="badge up">New segment</span>`;
  const jpRaw  = row.pct_change;
  const wldRaw = row.world_pct_change;
  if (jpRaw == null) return '—';
  if (wldRaw == null) return jpRaw > 0 ? `<span class="badge up">↑ Japan</span>` : `<span class="badge down">↓</span>`;
  const gap = jpRaw - wldRaw;
  if (gap >= 20) return `<span class="badge up">Japan-specific ↑</span>`;
  if (gap > 0)   return `<span class="badge up">Mixed ↑</span>`;
  if (gap > -20) return `<span class="badge neutral">Global trend</span>`;
  return `<span class="badge down">Japan lagging</span>`;
}

export function renderEpaTableCaseStudy(epaData, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const ORDER = ['CN44','CN85','CN28','CN71','CN90','CN94','CN03','CN04','CN95'];
  const rows = [...epaData].sort((a, b) => {
    const ia = ORDER.indexOf(a.cn_code);
    const ib = ORDER.indexOf(b.cn_code);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  tbody.innerHTML = rows.map(row => {
    const isCtrl = CONTROL.has(row.cn_code);
    const dir    = row.direction === 'up' ? 'up' : 'down';
    const arrow  = row.direction === 'up' ? '▲' : '▼';

    // Use clean window avg if available, else post
    const postVal = row.avg_post_clean_mln ?? row.post;

    // CN71: format pct specially (not 28586%)
    const jpPctCell = row.cn_code === 'CN71'
      ? `<td class="val pos">+28,586% <small>(0 → 10.6)</small></td>`
      : `<td class="val ${dir}">${arrow} ${fmtPct(row.pct_change)}</td>`;

    const wldPct = row.world_pct_change;
    const wldDir = wldPct == null ? '' : (wldPct >= 0 ? 'pos' : 'neg');
    const wldCell = `<td class="val ${wldDir}">${fmtPct(wldPct)}</td>`;

    return `<tr${isCtrl ? ' class="ctrl"' : ''}>
      <td><strong>${row.cn_code}</strong> <span class="cn-name">${row.cn_name || ''}</span></td>
      <td class="val">${row.pre != null ? row.pre.toFixed(2) : '—'}</td>
      <td class="val">${postVal != null ? postVal.toFixed(2) : '—'}</td>
      ${jpPctCell}
      ${wldCell}
      <td>${signalBadge(row)}</td>
    </tr>`;
  }).join('');
}