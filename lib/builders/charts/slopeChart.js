import { groupBy } from "../../utils/utils.js";

// SVG slope chart: Japan (solid lines) vs World (dashed, rescaled to 2018 level).
// Key years: 2015 · 2018 · 2019 · 2022 · 2024
// Log scale so small CN groups (Fish, Dairy) remain visible alongside dominant ones.

const FONT_SIZE = 9;
const LABEL_LINE_HEIGHT = FONT_SIZE + 3;
const MIN_VALUE = 0.05;

const TREATMENT = ['CN44', 'CN85', 'CN28', 'CN71', 'CN90', 'CN94'];
const CONTROL = ['CN03', 'CN04', 'CN95'];

const CN_COLORS = {
  CN44: '#1d3557', CN85: '#c0392b', CN28: '#2d6a4f',
  CN71: '#8a2be2', CN90: '#d35400', CN94: '#457b9d',
  CN03: '#aaa', CN04: '#bbb', CN95: '#ccc',
};

export function renderSlopeChart(exportsTimeSeries, containerId, worldTimeSeries = null) {
  const containerElement = document.getElementById(containerId);
  if (!containerElement) return;

  const KEY_YEARS = [2015, 2018, 2019, 2022, 2024];
  const jpByCN = groupBy(exportsTimeSeries, r => r.cn_code);
  const wldByCN = worldTimeSeries ? groupBy(worldTimeSeries, r => r.cn_code) : null;
  // @ts-ignore
  const allCNs = [...new Set([...TREATMENT, ...CONTROL])].filter(cn => jpByCN.has(cn));

  const W = Math.max(containerElement.clientWidth || 600, 400);
  const H = 360;
  const PAD = { top: 36, right: 80, bottom: 30, left: 50 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const allValues = allCNs.flatMap(cn =>
    KEY_YEARS.map(y => jpByCN.get(cn)?.find(r => r.year === y)?.value || 0)
  );
  const maxValue = Math.max(...allValues) * 1.3;
  const logMax = Math.log(maxValue);
  const logMin = Math.log(MIN_VALUE);

  const xScale = i => PAD.left + (i / (KEY_YEARS.length - 1)) * innerW;
  const yScale = v => {
    const vv = Math.max(v || MIN_VALUE, MIN_VALUE);
    return PAD.top + innerH - ((Math.log(vv) - logMin) / (logMax - logMin)) * innerH;
  };

  const labelCandidates = [];

  const lines = allCNs.map(cn => {
    const color = CN_COLORS[cn] || '#999';
    const isCtrl = CONTROL.includes(cn);
    const jpRows = jpByCN.get(cn) || [];
    const wldRows = wldByCN ? (wldByCN.get(cn) || []) : [];

    const jpPoints = KEY_YEARS.map((y, i) => {
      const v = jpRows.find(r => r.year === y)?.value || 0;
      return [xScale(i), yScale(v)];
    });

    const jpPath = jpPoints
      .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`)
      .join(' ');

    // World line — rescale to same 2018 base as Japan so slopes compare
    let wldPath = '';
    if (wldRows.length) {
      const wldBase = wldRows.find(r => r.year === 2018)?.value;
      const jpBase = jpRows.find(r => r.year === 2018)?.value;
      if (wldBase && jpBase && wldBase > 0 && jpBase > 0) {
        const wldPts = KEY_YEARS.map((y, i) => {
          const wv = wldRows.find(r => r.year === y)?.value || 0;
          const scaled = jpBase * (wv / wldBase);
          return [xScale(i), yScale(scaled)];
        });
        wldPath = `<path d="${wldPts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ')}"
          stroke="${color}" stroke-width="${isCtrl ? 0.8 : 1.2}" stroke-dasharray="4,3" fill="none" opacity="0.55"/>`;
      }
    }

    const last = jpPoints[jpPoints.length - 1];
    labelCandidates.push({ y: last[1], code: cn, color, isCtrl });

    return `
      <path d="${jpPath}" stroke="${color}" stroke-width="${isCtrl ? 1 : 1.8}" fill="none"
        opacity="${isCtrl ? 0.5 : 0.9}" ${isCtrl ? 'stroke-dasharray="5,4"' : ''}/>
      ${wldPath}`;
  }).join('');

  // Collision resolution
  labelCandidates.sort((a, b) => a.y - b.y);
  for (let i = 1; i < labelCandidates.length; i++) {
    if (labelCandidates[i].y < labelCandidates[i - 1].y + LABEL_LINE_HEIGHT)
      labelCandidates[i].y = labelCandidates[i - 1].y + LABEL_LINE_HEIGHT;
  }
  for (let i = labelCandidates.length - 2; i >= 0; i--) {
    if (labelCandidates[i].y + LABEL_LINE_HEIGHT > labelCandidates[i + 1].y)
      labelCandidates[i].y = labelCandidates[i + 1].y - LABEL_LINE_HEIGHT;
  }

  const labelX = xScale(KEY_YEARS.length - 1) + 6;
  const svgLabels = labelCandidates.map(({ y, code, color }) =>
    `<text x="${labelX}" y="${y + FONT_SIZE / 2}" font-size="${FONT_SIZE}"
       fill="${color}" font-family="DM Mono, monospace" dominant-baseline="middle">${code}</text>`
  ).join('');

  const yTickValues = [0.1, 0.5, 1, 5, 10, 50, 100];
  const yTicks = yTickValues
    .filter(v => v >= MIN_VALUE && v <= maxValue)
    .map(v => {
      const ty = yScale(v);
      return `<line x1="${PAD.left - 4}" y1="${ty}" x2="${PAD.left}" y2="${ty}" stroke="#8a8478" stroke-width="0.8"/>
              <text x="${PAD.left - 6}" y="${ty}" text-anchor="end" dominant-baseline="middle"
                font-size="9" fill="#8a8478" font-family="DM Mono, monospace">${v}</text>`;
    }).join('');

  const xLabels = KEY_YEARS.map((year, i) =>
    `<text x="${xScale(i)}" y="${H - 8}" text-anchor="middle" font-size="10"
       fill="#8a8478" font-family="DM Mono, monospace">${year}</text>
     <line x1="${xScale(i)}" y1="${PAD.top}" x2="${xScale(i)}" y2="${H - PAD.bottom}"
       stroke="#d4cfc4" stroke-width="0.5"/>`
  ).join('');

  const legend = `<text x="${PAD.left}" y="18" font-size="9" fill="#666" font-family="DM Mono, monospace">
    — solid = Estonia → Japan  &nbsp; ╌ dashed = Estonia → World (rescaled to 2018 baseline)</text>`;

  const yAxisLabel = `<text transform="rotate(-90)" x="${-(PAD.top + innerH / 2)}" y="12"
    text-anchor="middle" font-size="9" fill="#8a8478" font-family="DM Mono, monospace">M€ (log scale)</text>`;

  containerElement.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:360px">
      ${yAxisLabel}${yTicks}${xLabels}${lines}${svgLabels}${legend}
    </svg>`;
}