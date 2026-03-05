// Build treemap using flexbox proportional layout.
// Items are laid out in rows; each row is filled until ~50% of total weight.

export function renderTreemap(exportsTs, containerId) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  const YEAR = 2023;
  const rows = exportsTs.filter(r => r.year === YEAR);
  const total = rows.reduce((s, r) => s + (r.value || 0), 0);
  if (!total) return;

  // Sort descending by value
  const sorted = [...rows].sort((a, b) => (b.value || 0) - (a.value || 0));

  const PALETTE = [
    '#a8c4d8', '#c8dce8', '#d4c5a9', '#b5c9b5', '#dbc6b5',
    '#c5b8d4', '#b8d4c5', '#d4b8b8', '#c8c8b8', '#b8c8d4', '#d4d4c8',
  ];

  // Pack into rows: greedy, target row weight ≈ 0.45 of total
  const TARGET = 0.45;
  const tmRows = [];
  let current = [];
  let currentW = 0;

  sorted.forEach(item => {
    const w = (item.value || 0) / total;
    current.push(item);
    currentW += w;
    if (currentW >= TARGET) {
      tmRows.push(current);
      current = [];
      currentW = 0;
    }
  });
  if (current.length) tmRows.push(current);

  const outerEl = document.createElement('div');
  outerEl.className = 'tm-outer';

  tmRows.forEach(rowItems => {
    const rowEl = document.createElement('div');
    rowEl.className = 'tm-row';

    rowItems.forEach((item, i) => {
      const pct = ((item.value || 0) / total * 100).toFixed(1);
      const cell = document.createElement('div');
      cell.className = 'tm-cell';
      cell.style.flexGrow = String(item.value || 1);
      cell.style.background = PALETTE[i % PALETTE.length];
      cell.title = `${item.cn_code}: ${item.value?.toFixed(2)} M€ (${pct}%)`;
      cell.innerHTML = `
        <span class="tm-code">${item.cn_code}</span>
        <span class="tm-name">${item.cn_name.split(' ').slice(0, 3).join(' ')}</span>
        <span class="tm-val">${item.value?.toFixed(1)}M€</span>`;
      rowEl.appendChild(cell);
    });

    outerEl.appendChild(rowEl);
  });

  cont.innerHTML = '';
  cont.appendChild(outerEl);
}