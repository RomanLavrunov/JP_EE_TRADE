// EPA comparison table for case_study.html
// Groups: A (core), B (secondary), Spike — Pareto methodology v21
// Sorted by: Group A first, then B, then Spikes; within group by post-EPA volume desc.

function fmtPct(v) {
  if (v == null) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v}%`;
}

function groupBadge(row) {
  const g = row.pareto_group;
  if (g === 'A')     return `<span class="badge group-a">Group A</span>`;
  if (g === 'B')     return `<span class="badge group-b">Group B</span>`;
  if (g === 'Spike') return `<span class="badge spike">⚡ Spike</span>`;
  return '';
}

function signalBadge(row) {
  const g = row.pareto_group;
  if (g === 'Spike') {
    return `<span class="badge neutral">2019 peak → no structural growth</span>`;
  }
  const jpRaw  = row.pct_change;
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

export function renderEpaTableCaseStudy(epaData, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  // Sort order already baked into JSON (A→B→Spike, desc by post within group)
  // but re-sort here defensively
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

    // CN71 pct_change is extreme — show special cell
    const jpPctCell = row.pct_change != null && Math.abs(row.pct_change) > 5000
      ? `<td class="val pos">+${(row.pct_change/100).toFixed(0)}× <small>(0→${postVal?.toFixed(1)}M)</small></td>`
      : `<td class="val ${isSpike ? 'neutral' : dir}">${arrow} ${fmtPct(row.pct_change)}</td>`;

    const wldPct = row.world_pct_change;
    const wldDir = wldPct == null ? '' : (wldPct >= 0 ? 'pos' : 'neg');
    const wldCell = `<td class="val ${wldDir}">${fmtPct(wldPct)}</td>`;

    const rowClass = isSpike ? ' class="spike-row"' : '';

    return `<tr${rowClass}>
      <td>${groupBadge(row)} <strong>${row.cn_code}</strong> <span class="cn-name">${row.cn_name || ''}</span></td>
      <td class="val">${row.pre != null ? row.pre.toFixed(2) : '—'}</td>
      <td class="val">${postVal != null ? postVal.toFixed(2) : '—'}</td>
      ${jpPctCell}
      ${wldCell}
      <td>${signalBadge(row)}</td>
    </tr>`;
  }).join('');
}
