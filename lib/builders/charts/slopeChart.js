import { cnPalette } from "../../constants/constants.js";
import { groupBy } from "../../utils/utils.js";

// Build SVG slope chart across key years.

export function renderSlopeChart(exportsTs, containerId) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  const KEY_YEARS = [2015, 2018, 2019, 2022, 2024];
  const byCN = groupBy(exportsTs, r => r.cn_code);
  const codes = [...byCN.keys()];

  const W = Math.max(cont.clientWidth || 600, 400);
  const H = 300;
  const PAD = { top: 30, right: 60, bottom: 20, left: 50 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // Compute all values for y-scale
  const allVals = codes.flatMap(code =>
    KEY_YEARS.map(y => byCN.get(code)?.find(r => r.year === y)?.value || 0)
  );
  const maxVal = Math.max(...allVals) * 1.1;

  const xScale = i => PAD.left + (i / (KEY_YEARS.length - 1)) * innerW;
  const yScale = v => PAD.top + innerH - (v / maxVal) * innerH;

  const lines = codes.map((code, ci) => {
    const color = cnPalette[ci % cnPalette.length];
    const pts = KEY_YEARS.map((y, i) => {
      const val = byCN.get(code)?.find(r => r.year === y)?.value || 0;
      return [xScale(i), yScale(val)];
    });
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const lastPt = pts[pts.length - 1];
    return `
      <path d="${d}" stroke="${color}" stroke-width="1.5" fill="none" opacity="0.8"/>
      <text x="${lastPt[0] + 5}" y="${lastPt[1] + 4}" font-size="9"
            fill="${color}" font-family="DM Mono, monospace">${code}</text>`;
  }).join('');

  const xLabels = KEY_YEARS.map((y, i) =>
    `<text x="${xScale(i)}" y="${H - 4}" text-anchor="middle" font-size="10"
           fill="#8a8478" font-family="DM Mono, monospace">${y}</text>
     <line x1="${xScale(i)}" y1="${PAD.top}" x2="${xScale(i)}" y2="${H - PAD.bottom}"
           stroke="#d4cfc4" stroke-width="0.5"/>`
  ).join('');

  cont.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:360px">
      ${xLabels}
      ${lines}
    </svg>`;
}
