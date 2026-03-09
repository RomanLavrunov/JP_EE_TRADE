import { POST_EPA_YEARS } from "../../constants/constants.js";
import { uniqueSorted } from "../../utils/utils.js";

export function renderHeatmap(indexRowsRelativeTo2018, containerId) {
    const containerElement = document.getElementById(containerId);
    if (!containerElement) return;

    const years = uniqueSorted(indexRowsRelativeTo2018, 'year');
    const commodityCodes = uniqueSorted(indexRowsRelativeTo2018, 'cn_code');

    // Map CN code to human-readable group name (if available)
    const groupNameByCode = {};
    indexRowsRelativeTo2018.forEach(row => {
        if (!groupNameByCode[row.cn_code] && row.cn_name) {
            groupNameByCode[row.cn_code] = row.cn_name;
        }
    });

    // Map index value to background colour
    function heatmapCellColor(heatIndexValue) {
        if (heatIndexValue === null || heatIndexValue === undefined) return '#edeae0';
        const deviationFromBaseline = heatIndexValue - 100;

        if (deviationFromBaseline > 0) {

            const intensity = Math.min(deviationFromBaseline / 200, 1);
            const greenChannel = Math.round(106 + intensity * 50);

            return `rgba(45,${greenChannel},79,${0.15 + intensity * 0.55})`;
        } else {

            const intensity = Math.min(Math.abs(deviationFromBaseline) / 100, 1);

            return `rgba(192,57,43,${0.12 + intensity * 0.55})`;
        }
    }

    // @ts-ignore
    const indexValuesByCodeAndYear = new Map(
        indexRowsRelativeTo2018.map(row => [`${row.cn_code}_${row.year}`, row.index_vs_2018])
    );

    const headerCells = years.map(year =>
        `<th style="${POST_EPA_YEARS.indexOf(String(year)) !== -1 ? 'font-weight:700;color:#1a1814' : ''}">${year}</th>`
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
            ? `<div class="hm-code">${commodityCode}</div><div class="hm-name">${groupName}</div>`
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

