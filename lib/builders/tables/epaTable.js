// EPA comparison table — generic (used in index.html if applicable)
// Uses same Pareto badge logic as epaTable_cs.js

function fmtPct(v) {
  if (v == null) return '—';
  return `${v > 0 ? '+' : ''}${v}%`;
}

function groupBadge(row) {
  const g = row.pareto_group;
  if (g === 'A')     return `<span class="badge group-a">Group A</span>`;
  if (g === 'B')     return `<span class="badge group-b">Group B</span>`;
  if (g === 'Spike') return `<span class="badge spike">⚡ Spike</span>`;
  return '';
}

function signalBadge(row) {
  if (row.pareto_group === 'Spike') {
    return `<span class="badge neutral">2019 peak — no sustained growth</span>`;
  }
  const jpRaw = row.pct_change;
  const wldRaw = row.world_pct_change;
  if (jpRaw == null) return '—';
  if (wldRaw == null) return jpRaw > 0
    ? `<span class="badge up">↑ Japan</span>`
    : `<span class="badge down">↓</span>`;
  const gap = jpRaw - wldRaw;
  if (gap >= 20)  return `<span class="badge up">Japan-specific ↑</span>`;
  if (gap > 0)    return `<span class="badge up">Mixed ↑</span>`;
  if (gap > -20)  return `<span class="badge neutral">Global trend</span>`;
  return `<span class="badge down">Japan lagging</span>`;
}

export function renderEpaTable(epaData, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const ORDER_G = { A: 0, B: 1, Spike: 2 };
  const rows = [...epaData].sort((a, b) => {
    const ga = ORDER_G[a.pareto_group] ?? 3;
    const gb = ORDER_G[b.pareto_group] ?? 3;
    if (ga !== gb) return ga - gb;
    return (b.post ?? 0) - (a.post ?? 0);
  });

  tbody.innerHTML = rows.map(row => {
    const isSpike = row.pareto_group === 'Spike';
    const dir     = row.direction === 'up' ? 'up' : 'down';
    const arrow   = row.direction === 'up' ? '▲' : '▼';
    const postVal = row.avg_post_clean_mln ?? row.post;

    const jpPctCell = row.pct_change != null && Math.abs(row.pct_change) > 5000
      ? `<td class="val pos">+${(row.pct_change/100).toFixed(0)}× <small>(new)</small></td>`
      : `<td class="val ${isSpike ? 'neutral' : dir}">${arrow} ${fmtPct(row.pct_change)}</td>`;

    const wldPct = row.world_pct_change;
    const wldCell = `<td class="val ${wldPct >= 0 ? 'pos' : 'neg'}">${fmtPct(wldPct)}</td>`;

    return `<tr${isSpike ? ' class="spike-row"' : ''}>
      <td>${groupBadge(row)} <strong>${row.cn_code}</strong> <span class="cn-name">${row.cn_name || ''}</span></td>
      <td class="val">${row.pre != null ? row.pre.toFixed(2) : '—'}</td>
      <td class="val">${postVal != null ? postVal.toFixed(2) : '—'}</td>
      ${jpPctCell}
      ${wldCell}
      <td>${signalBadge(row)}</td>
    </tr>`;
  }).join('');
}
