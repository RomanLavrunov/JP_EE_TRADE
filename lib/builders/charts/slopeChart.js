import { cnPalette } from "../../constants/constants.js";
import { groupBy } from "../../utils/utils.js";

// Build SVG slope chart across key years.
// Uses log scale so small commodity groups (Fish, Dairy) are visible
// alongside dominant ones (Wood). Labels are collision-resolved on the
// right edge so codes don't overlap.

const FONT_SIZE = 9;
const LABEL_LINE_HEIGHT = FONT_SIZE + 3;
const MIN_VALUE = 0.05; // floor for log scale — avoids log(0)

export function renderSlopeChart(exportsTimeSeries, containerId) {
  const containerElement = document.getElementById(containerId);
  if (!containerElement) return;

  const KEY_YEARS = [2015, 2018, 2019, 2022, 2024];
  const rowsByCommodityCode = groupBy(exportsTimeSeries, row => row.cn_code);
  const commodityCodes = [...rowsByCommodityCode.keys()];

  const W = Math.max(containerElement.clientWidth || 600, 400);
  const H = 360;
  const PAD = { top: 30, right: 80, bottom: 30, left: 50 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // --- Log scale helpers ---
  // @ts-ignore
  const allValues = commodityCodes.flatMap(code =>
    KEY_YEARS.map(year => rowsByCommodityCode.get(code)?.find(row => row.year === year)?.value || 0)
  );
  const maxValue = Math.max(...allValues) * 1.3;
  const logMax = Math.log(maxValue);
  const logMin = Math.log(MIN_VALUE);

  const xScale = index => PAD.left + (index / (KEY_YEARS.length - 1)) * innerW;
  // Log scale: higher values → top of chart
  const yScale = value => {
    const v = Math.max(value, MIN_VALUE);
    return PAD.top + innerH - ((Math.log(v) - logMin) / (logMax - logMin)) * innerH;
  };

  // --- Build paths and collect right-edge label positions ---
  const labelCandidates = []; // { y, code, color }

  const lines = commodityCodes.map((code, codeIndex) => {
    const color = cnPalette[codeIndex % cnPalette.length];
    const points = KEY_YEARS.map((year, index) => {
      const value = rowsByCommodityCode.get(code)?.find(row => row.year === year)?.value || 0;
      return [xScale(index), yScale(value)];
    });
    const pathDefinition = points
      .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`)
      .join(' ');

    const lastPoint = points[points.length - 1];
    labelCandidates.push({ y: lastPoint[1], code, color });

    return `<path d="${pathDefinition}" stroke="${color}" stroke-width="1.5" fill="none" opacity="0.85"/>`;
  }).join('');

  // --- Collision resolution: sort by natural y, then push overlapping labels apart ---
  labelCandidates.sort((a, b) => a.y - b.y);

  // Push labels down if they overlap the one above
  for (let i = 1; i < labelCandidates.length; i++) {
    const prev = labelCandidates[i - 1];
    const curr = labelCandidates[i];
    if (curr.y < prev.y + LABEL_LINE_HEIGHT) {
      curr.y = prev.y + LABEL_LINE_HEIGHT;
    }
  }
  // Push labels up if they overflow the bottom
  for (let i = labelCandidates.length - 2; i >= 0; i--) {
    const next = labelCandidates[i + 1];
    const curr = labelCandidates[i];
    if (curr.y + LABEL_LINE_HEIGHT > next.y) {
      curr.y = next.y - LABEL_LINE_HEIGHT;
    }
  }

  const labelX = xScale(KEY_YEARS.length - 1) + 6;
  const labels = labelCandidates.map(({ y, code, color }) =>
    `<text x="${labelX}" y="${y + FONT_SIZE / 2}" font-size="${FONT_SIZE}"
           fill="${color}" font-family="DM Mono, monospace" dominant-baseline="middle">${code}</text>`
  ).join('');

  // --- Log scale Y-axis tick marks ---
  const yTickValues = [0.1, 0.5, 1, 5, 10, 50, 100];
  const yTicks = yTickValues
    .filter(v => v >= MIN_VALUE && v <= maxValue)
    .map(v => {
      const ty = yScale(v);
      return `<line x1="${PAD.left - 4}" y1="${ty}" x2="${PAD.left}" y2="${ty}" stroke="#8a8478" stroke-width="0.8"/>
              <text x="${PAD.left - 6}" y="${ty}" text-anchor="end" dominant-baseline="middle"
                    font-size="9" fill="#8a8478" font-family="DM Mono, monospace">${v}</text>`;
    }).join('');

  // --- X-axis year labels and vertical grid lines ---
  const xLabels = KEY_YEARS.map((year, index) =>
    `<text x="${xScale(index)}" y="${H - 8}" text-anchor="middle" font-size="10"
           fill="#8a8478" font-family="DM Mono, monospace">${year}</text>
     <line x1="${xScale(index)}" y1="${PAD.top}" x2="${xScale(index)}" y2="${H - PAD.bottom}"
           stroke="#d4cfc4" stroke-width="0.5"/>`
  ).join('');

  // --- Y-axis label ---
  const yAxisLabel = `<text transform="rotate(-90)" x="${-(PAD.top + innerH / 2)}" y="12"
    text-anchor="middle" font-size="9" fill="#8a8478" font-family="DM Mono, monospace">M€ (log scale)</text>`;

  containerElement.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:360px">
      ${yAxisLabel}
      ${yTicks}
      ${xLabels}
      ${lines}
      ${labels}
    </svg>`;
}