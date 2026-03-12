// EPA comparison table for index.html dashboard
// Simpler version: Group | Pre | Post | Japan % change | World %
// Control groups styled in grey

const CONTROL = new Set(['CN03', 'CN04', 'CN95']);

export function renderEpaTable(epaData) {
  const tbody = document.getElementById('epaTableBody');
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
    const sign   = row.pct_change > 0 ? '+' : '';

    const jpPct = row.cn_code === 'CN71'
      ? `<td class="up">★ New segment</td>`
      : `<td class="${dir}">${arrow} ${sign}${row.pct_change}%</td>`;

    const wPct = row.world_pct_change;
    const wDir = wPct == null ? '' : (wPct >= 0 ? 'up' : 'down');
    const wCell = wPct != null ? `<td class="${wDir}">${wPct > 0 ? '+' : ''}${wPct}%</td>` : `<td>—</td>`;

    return `<tr${isCtrl ? ' style="color:var(--ink3);font-style:italic"' : ''}>
      <td>${row.cn_code} · ${row.cn_name || ''}</td>
      <td>${row.pre != null ? row.pre.toFixed(2) : '—'}</td>
      <td>${row.post != null ? row.post.toFixed(2) : '—'}</td>
      ${jpPct}
      ${wCell}
    </tr>`;
  }).join('');
}
