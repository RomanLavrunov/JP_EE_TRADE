export const colors = {
  accent:   '#c0392b',
  accent2:  '#1d3557',
  accent3:  '#2d6a4f',
  ink:      '#1a1814',
  ink3:     '#8a8478',
  border:   '#d4cfc4',
  surface:  '#edeae0',
  up:       '#2d6a4f',
  down:     '#c0392b',
  exports:  '#1d3557',
  imports:  '#c0392b',
  balance:  '#2d6a4f',
  exportsFillLight: 'rgba(29,53,87,.08)',
  importsFillLight: 'rgba(192,57,43,.06)',
  exportShareBar:   'rgba(29,53,87,.75)',
  importShareBar:   'rgba(192,57,43,.65)',
  balanceBar:       'rgba(45,106,79,.7)',
  pctUpBar:         'rgba(45,106,79,.75)',
  pctDownBar:       'rgba(192,57,43,.75)',
  covid:            '#d35400',
};

export const breaks = [
  { x: '2019', label: 'EPA', color: colors.accent3 },
  { x: '2020', label: 'COVID', color: colors.covid },
  { x: '2022', label: 'War', color: colors.ink3 },
];

export const POST_EPA_YEARS = ['2019', '2020', '2021', '2022', '2023', '2024'];

export const SERIES_NAMES = {
  JAPAN_EXPORTS: 'Japan · Exports',
  GLOBAL_EXPORTS: 'Global · Exports',
};

export const SPECIAL_COUNTRY_NAMES = {
  JAPAN: 'JP Japan',
  SOUTH_KOREA_LABEL_PART: 'Korea',
};

export const baseFont = { family: "'DM Mono', monospace", size: 11 };

export const cnPalette= [
  '#1d3557','#c0392b','#2d6a4f','#d35400','#457b9d',
  '#6b4f3a','#8a2be2','#2e8b57','#b8860b','#4682b4','#708090',
];

export const DATA_PATH = 'data/';
