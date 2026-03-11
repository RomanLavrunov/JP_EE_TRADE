import { POST_EPA_YEARS } from "../../constants/constants.js";
import { heatmapCellColor } from "../../utils/helpers.js";
import { shortenName, uniqueSorted } from "../../utils/utils.js";
import { colors } from "../../constants/constants.js";

export function renderHeatmap(indexRowsRelativeTo2018, containerId) {
    const containerElement = document.getElementById(containerId);
    if (!containerElement) return;

    const years = uniqueSorted(indexRowsRelativeTo2018, 'year');
    const commodityCodes = uniqueSorted(indexRowsRelativeTo2018, 'cn_code');


    // Map CN code to human-readable group name (if available)
    const groupNameByCode = {};
    indexRowsRelativeTo2018.forEach(row => {
        if (!groupNameByCode[row.cn_code] && row.cn_name) {
            groupNameByCode[row.cn_code] = shortenName(row.cn_name);
        }
    });

    // @ts-ignore
    const indexValuesByCodeAndYear = new Map(
        indexRowsRelativeTo2018.map(row => [`${row.cn_code}_${row.year}`, row.index_vs_2018])
    );

    const headerCells = years.map(year =>
        `<th style="${POST_EPA_YEARS.indexOf(String(year)) !== -1 ? `font-weight:700;color:${colors.ink}` : ''}">${year}</th>`
    ).join('');

    const bodyRows = commodityCodes.map(commodityCode => {
        const groupName = groupNameByCode[commodityCode];

        const cells = years.map(year => {
            const heatIndexValue = indexValuesByCodeAndYear.get(`${commodityCode}_${year}`);
            const backgroundColor = heatmapCellColor(heatIndexValue);
            const cellText = heatIndexValue != null ? heatIndexValue.toFixed(0) : '—';
            return `<td style="background:${backgroundColor}">${cellText}</td>`;
        }).join('');

        const groupLabelCell = groupName
            ? `<div class="hm-code" style="white-space: nowrap; 
  overflow: hidden;
  text-overflow: ellipsis;">${commodityCode} ${groupName}</div><div class="hm-name"></div>`
            : `<div class="hm-code">${commodityCode}</div>`;

        return `<tr><td class="rl">${groupLabelCell}</td>${cells}</tr>`;
    }).join('');


    containerElement.innerHTML = `
    <div class="hm-scroll">
      <table class="hm">
        <thead><tr><th class="rl">Group</th>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
}

