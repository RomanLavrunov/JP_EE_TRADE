import { uniqueSorted } from "../../utils/utils.js";

export function renderHeatmap(indexVs2018, containerId) {
    const cont = document.getElementById(containerId);
    if (!cont) return;

    const years = uniqueSorted(indexVs2018, 'year');
    const codes = uniqueSorted(indexVs2018, 'cn_code');
    const POST_EPA = new Set(['2019', '2020', '2021', '2022', '2023', '2024']);

    // Map index value to background colour
    function cellColor(idx) {
        if (idx === null || idx === undefined) return '#edeae0';
        const v = idx - 100; // deviation from baseline
        if (v > 0) {
            const intensity = Math.min(v / 200, 1);
            const g = Math.round(106 + intensity * 50);
            return `rgba(45,${g},79,${0.15 + intensity * 0.55})`;
        } else {
            const intensity = Math.min(Math.abs(v) / 100, 1);
            return `rgba(192,57,43,${0.12 + intensity * 0.55})`;
        }
    }

    const byKey = new Map(
        indexVs2018.map(r => [`${r.cn_code}_${r.year}`, r.index_vs_2018])
    );

    const headerCells = years.map(y =>
        `<th style="${POST_EPA.has(String(y)) ? 'font-weight:700;color:#1a1814' : ''}">${y}</th>`
    ).join('');

    const bodyRows = codes.map(code => {
        const cells = years.map(y => {
            const val = byKey.get(`${code}_${y}`);
            const bg = cellColor(val);
            const txt = val != null ? val.toFixed(0) : '—';
            return `<td style="background:${bg}">${txt}</td>`;
        }).join('');
        return `<tr><td class="rl">${code}</td>${cells}</tr>`;
    }).join('');

    cont.innerHTML = `
    <div class="hm-scroll">
      <table class="hm">
        <thead><tr><th class="rl">Group</th>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
}

