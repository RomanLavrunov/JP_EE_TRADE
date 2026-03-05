export function renderEpaTableCaseStudy(epaData, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

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
