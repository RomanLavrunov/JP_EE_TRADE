import { cnPalette } from "../../constants/constants.js";
import { groupBy } from "../../utils/utils.js";

// Build SVG slope chart across key years.

export function renderSlopeChart(exportsTimeSeries, containerId) {
  const containerElement = document.getElementById(containerId);
  if (!containerElement) return;

  const KEY_YEARS = [2015, 2018, 2019, 2022, 2024];
  const rowsByCommodityCode = groupBy(exportsTimeSeries, row => row.cn_code);
  const commodityCodes = [...rowsByCommodityCode.keys()];

  const W = Math.max(containerElement.clientWidth || 600, 400);
  const H = 300;
  const PAD = { top: 30, right: 60, bottom: 20, left: 50 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // Compute all values for y-scale
  // @ts-ignore
  const allValues = commodityCodes.flatMap(code =>
    KEY_YEARS.map(year => rowsByCommodityCode.get(code)?.find(row => row.year === year)?.value || 0)
  );
  const maxValue = Math.max(...allValues) * 1.1;

  const xScale = index => PAD.left + (index / (KEY_YEARS.length - 1)) * innerW;
  const yScale = value => PAD.top + innerH - (value / maxValue) * innerH;

  const lines = commodityCodes.map((code, codeIndex) => {
    const color = cnPalette[codeIndex % cnPalette.length];
    const points = KEY_YEARS.map((year, index) => {
      const value = rowsByCommodityCode.get(code)?.find(row => row.year === year)?.value || 0;
      return [xScale(index), yScale(value)];
    });
    const pathDefinition = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point[0].toFixed(1)},${point[1].toFixed(1)}`)
      .join(' ');
    const lastPoint = points[points.length - 1];
    return `
      <path d="${pathDefinition}" stroke="${color}" stroke-width="1.5" fill="none" opacity="0.8"/>
      <text x="${lastPoint[0] + 5}" y="${lastPoint[1] + 4}" font-size="9"
            fill="${color}" font-family="DM Mono, monospace">${code}</text>`;
  }).join('');

  const xLabels = KEY_YEARS.map((year, index) =>
    `<text x="${xScale(index)}" y="${H - 4}" text-anchor="middle" font-size="10"
           fill="#8a8478" font-family="DM Mono, monospace">${year}</text>
     <line x1="${xScale(index)}" y1="${PAD.top}" x2="${xScale(index)}" y2="${H - PAD.bottom}"
           stroke="#d4cfc4" stroke-width="0.5"/>`
  ).join('');

  containerElement.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:360px">
      ${xLabels}
      ${lines}
    </svg>`;
}
