export async function fetchData(filename, dataPath) {
  const res = await fetch(dataPath + filename);
  if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
  return res.json();
}

export function groupBy(arr, keyFn) {
  return arr.reduce((map, item) => {
    const k = keyFn(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
    return map;
  }, new Map());
}

export function uniqueSorted(arr, field) {
  // @ts-ignore
  return [...new Set(arr.map(r => r[field]))].sort();
}
