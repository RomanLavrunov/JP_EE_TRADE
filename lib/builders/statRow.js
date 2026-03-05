// Render the summary stat row from bilateral data

export function renderStatRow(bilateral) {
  const pre = bilateral.filter(r => r.year >= 2014 && r.year <= 2018);
  const post = bilateral.filter(r => r.year >= 2019 && r.year <= 2023);

  const avg = arr => arr.reduce((s, r) => s + r.exports, 0) / arr.length;
  const preAvg = avg(pre);
  const postAvg = avg(post);
  const pctChange = ((postAvg - preAvg) / preAvg * 100).toFixed(0);

  const peak = bilateral.reduce((a, b) => a.exports > b.exports ? a : b);
  const latest = bilateral[bilateral.length - 1];

  const stats = [
    { v: `${postAvg.toFixed(0)} M€`, cls: 'up', l: 'Avg exports post-EPA\n(2019–2023)' },
    { v: `+${pctChange}%`, cls: 'up', l: 'vs pre-EPA avg\n(2014–2018)' },
    { v: `${peak.exports} M€`, cls: 'neu', l: `Peak exports\n(${peak.year})` },
    { v: `${latest.balance.toFixed(1)} M€`, cls: 'up', l: `Trade balance\n(${latest.year})` },
  ];

  const el = document.getElementById('statRow');
  if (!el) return;
  el.innerHTML = stats.map(s => `
    <div class="stat-cell">
      <div class="stat-v ${s.cls}">${s.v}</div>
      <div class="stat-l">${s.l.replace('\n', '<br>')}</div>
    </div>`).join('');
}
