/**
 * Fetch JSON data from a relative data path.
 */
export async function fetchData(filename, dataPath) {
  const response = await fetch(dataPath + filename);
  if (!response.ok) throw new Error(`Failed to load ${filename}: ${response.status}`);
  return response.json();
}

/**
 * Group array items into a Map keyed by the result of getKey.
 */
export function groupBy(items, getKey) {
  return items.reduce((itemsByKey, item) => {
    const key = getKey(item);
    if (!itemsByKey.has(key)) itemsByKey.set(key, []);
    itemsByKey.get(key).push(item);
    return itemsByKey;
    // @ts-ignore
  }, new Map());
}

/**
 * Return sorted unique values of the given field from a row array.
 */
export function uniqueSorted(rows, field) {
  // @ts-ignore
  return [...new Set(rows.map(row => row[field]))].sort();
}

/**
 * Given an ordered list of years and an array of rows, return
 * values aligned by year. If a row for some year is missing,
 * defaultValue is used (null by default).
 */
export function valuesByYear(years, rows, getYear, getValue, defaultValue = null) {
  return years.map(year => {
    const matchingRow = rows.find(row => getYear(row) === year);
    if (!matchingRow) return defaultValue;
    return getValue(matchingRow);
  });
}

export function shortenName(text) {
  const cutText = cutBeforeAnd(text);
  const index = cutText.search(/[;,]/);
  return index !== -1 ? text.slice(0, index) : cutText;
}

export function cutBeforeAnd(text) {
  const parts = text.split(' AND ');
  if (parts.length > 2) {
    return parts.slice(0, 1).join(' AND ');
  }
  return text;
}

/**
 * Naming conventions used in this project (informal guide):
 * - Arrays of domain rows: plural nouns, e.g. bilateralRows, indexRows.
 * - Maps/dictionaries: XByY, e.g. rowsByCountry, indexRowsBySeries.
 * - Chart builders: build*Chart / render* for DOM-manipulating functions.
 */
