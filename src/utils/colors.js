/**
 * Köppen Climate Colors
 * Based on Beck et al. color conventions
 */

/* eslint-disable security/detect-object-injection --
 * This file provides color lookup using Köppen climate type codes (Af, Am, Aw, etc.).
 * Keys are not user-controlled; they are standard Köppen classification identifiers.
 * See docs/orchestration/checkpoints/security-review.md for full analysis.
 */

export const CLIMATE_COLORS = {
  // Tropical (A) - Blues
  Af: '#0000FF',   // Tropical Rainforest
  Am: '#0078FF',   // Tropical Monsoon
  Aw: '#46AAFA',   // Tropical Savanna
  As: '#46AAFA',   // Tropical Savanna (Dry Summer)

  // Arid (B) - Reds/Oranges
  BWh: '#FF0000',  // Hot Desert
  BWk: '#FF9696',  // Cold Desert
  BSh: '#F5A500',  // Hot Steppe
  BSk: '#FFDC64',  // Cold Steppe

  // Temperate (C) - Greens/Yellows
  Csa: '#FFFF00',  // Mediterranean Hot Summer
  Csb: '#C8C800',  // Mediterranean Warm Summer
  Csc: '#969600',  // Mediterranean Cold Summer
  Cwa: '#96FF96',  // Humid Subtropical Dry Winter
  Cwb: '#63C764',  // Subtropical Highland Dry Winter
  Cwc: '#329633',  // Subpolar Oceanic Dry Winter
  Cfa: '#C8FF50',  // Humid Subtropical
  Cfb: '#64FF50',  // Oceanic
  Cfc: '#32C800',  // Subpolar Oceanic

  // Continental (D) - Purples/Cyans
  Dsa: '#FF00FF',  // Mediterranean Continental Hot
  Dsb: '#C800C8',  // Mediterranean Continental Warm
  Dsc: '#963296',  // Mediterranean Continental Cold
  Dsd: '#966496',  // Mediterranean Continental Very Cold
  Dwa: '#ABB1FF',  // Monsoon Continental Hot
  Dwb: '#5A77DB',  // Monsoon Continental Warm
  Dwc: '#4C51B5',  // Monsoon Continental Cold
  Dwd: '#320087',  // Monsoon Continental Very Cold
  Dfa: '#00FFFF',  // Humid Continental Hot
  Dfb: '#38C7FF',  // Humid Continental Warm
  Dfc: '#007E7D',  // Subarctic
  Dfd: '#00455E',  // Subarctic Severe Winter

  // Polar (E) - Grays
  ET: '#B2B2B2',   // Tundra
  EF: '#686868',    // Ice Cap
};

/**
 * Get color for a climate type
 * @param {string} type - Köppen code
 * @returns {string} Hex color
 */
export function getClimateColor(type) {
  return CLIMATE_COLORS[type] || '#CCCCCC';
}

/**
 * Get color with opacity for styling
 * @param {string} type - Köppen code
 * @param {number} opacity - Opacity (0-1)
 * @returns {string} RGBA color
 */
export function getClimateColorRGBA(type, opacity = 0.7) {
  const hex = CLIMATE_COLORS[type] || '#CCCCCC';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
