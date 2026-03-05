// Render EPA comparison table

export function renderEpaTable(epaData) {
  const tbody = document.getElementById('epaTableBody');
  if (!tbody) return;

  // Summarise CN name to first 5 words
  const shortName = name => name.split(' ').slice(0, 5).join(' ') + '…';

  tbody.innerHTML = epaData
    .sort((a, b) => b.post - a.post)
    .map(row => {
      const dir = row.direction === 'up' ? 'up' : 'down';
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

function renderEpaTable(epaData, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  // Summarise CN name to first 5 words
  const shortName = name => name.split(' ').slice(0, 5).join(' ') + '…';

  tbody.innerHTML = [...epaData]
    .sort((a, b) => b.post - a.post)
    .map(row => {
      const dir = row.direction === 'up' ? 'up' : 'down';
      const arrow = row.direction === 'up' ? '▲' : '▼';
      const sign = row.pct_change > 0 ? '+' : '';
      return `<tr>
        <td>${row.cn_code} · ${shortName(row.cn_name)}</td>
        <td>${row.pre.toFixed(2)}</td>
        <td>${row.post.toFixed(2)}</td>
        <td class="${dir}">${arrow} ${sign}${row.pct_change}%</td>
      </tr>`;
    }).join('');
}
