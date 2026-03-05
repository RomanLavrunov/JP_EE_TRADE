// Create a line dataset with sensible defaults
export function lineDataset(label, data, color, overrides = {}) {
  return {
    label, data,
    borderColor: color,
    backgroundColor: color + '18',
    borderWidth: 2,
    tension: 0.3,
    pointRadius: 3,
    fill: false,
    ...overrides,
  };
}

// Create a bar dataset
export function barDataset(label, data, color, overrides = {}) {
  return { label, data, backgroundColor: color, borderRadius: 2, ...overrides };
}