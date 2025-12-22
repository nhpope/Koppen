/**
 * Köppen Climate Classification Glossary
 * Terminology definitions for educational display
 */

export const GLOSSARY = {
  MAT: {
    term: 'MAT',
    fullName: 'Mean Annual Temperature',
    definition: 'The average temperature over a full year, calculated as the mean of all 12 monthly average temperatures.',
    formula: null,
  },
  MAP: {
    term: 'MAP',
    fullName: 'Mean Annual Precipitation',
    definition: 'The total precipitation (rain + snow) accumulated over a full year, typically measured in millimeters.',
    formula: null,
  },
  Tcold: {
    term: 'Tcold',
    fullName: 'Coldest Month Temperature',
    definition: 'The average temperature of the coldest month of the year. Used to distinguish tropical (≥18°C) from temperate and continental climates.',
    formula: null,
  },
  Thot: {
    term: 'Thot',
    fullName: 'Warmest Month Temperature',
    definition: 'The average temperature of the warmest month. Used to determine summer intensity (hot ≥22°C, warm <22°C) and polar climates (<10°C).',
    formula: null,
  },
  Pthreshold: {
    term: 'Pthreshold',
    fullName: 'Aridity Threshold',
    definition: 'The precipitation threshold that determines if a climate is arid (B). It accounts for temperature and seasonal precipitation distribution.',
    formula: 'If ≥70% rain in summer: Pth = 2×MAT + 28\nIf ≥70% rain in winter: Pth = 2×MAT\nOtherwise: Pth = 2×MAT + 14',
  },
  Pdry: {
    term: 'Pdry',
    fullName: 'Driest Month Precipitation',
    definition: 'The precipitation of the driest month. Used to determine seasonal precipitation patterns and tropical subtypes.',
    formula: null,
  },
  Pwdry: {
    term: 'Pwdry',
    fullName: 'Driest Winter Month',
    definition: 'The precipitation of the driest month during winter (Oct-Mar in Northern Hemisphere). Used to identify dry winter (w) climates.',
    formula: null,
  },
  Psdry: {
    term: 'Psdry',
    fullName: 'Driest Summer Month',
    definition: 'The precipitation of the driest month during summer (Apr-Sep in Northern Hemisphere). Used to identify Mediterranean (s) climates.',
    formula: null,
  },
  Pswet: {
    term: 'Pswet',
    fullName: 'Wettest Summer Month',
    definition: 'The precipitation of the wettest month during summer. Used with Pwdry to determine monsoon (m) classification.',
    formula: null,
  },
  Pwwet: {
    term: 'Pwwet',
    fullName: 'Wettest Winter Month',
    definition: 'The precipitation of the wettest month during winter. Used with Psdry to determine if summer is truly dry.',
    formula: null,
  },
  Tmon10: {
    term: 'Tmon10',
    fullName: 'Months Above 10°C',
    definition: 'The number of months with average temperature ≥10°C. Used to distinguish warm summer (b: ≥4 months) from cold summer (c: 1-3 months) climates.',
    formula: null,
  },
  dry_season: {
    term: 'Dry Season',
    fullName: 'Dry Season',
    definition: 'A period of significantly reduced precipitation. In Köppen classification, determined by comparing driest month to wettest month ratios.',
    formula: null,
  },
  monsoon: {
    term: 'Monsoon',
    fullName: 'Monsoon Pattern',
    definition: 'A seasonal wind pattern that brings heavy rainfall. In tropical climates (Am), defined when driest month < 60mm but annual rainfall compensates.',
    formula: 'Pdry ≥ 100 - MAP/25',
  },
};

/**
 * Get glossary entry by term key
 * @param {string} key - Term key
 * @returns {Object|null} Glossary entry or null
 */
export function getGlossaryEntry(key) {
  return GLOSSARY[key] || null;
}

/**
 * Get all glossary terms
 * @returns {Object} All glossary entries
 */
export function getAllTerms() {
  return GLOSSARY;
}

export default {
  GLOSSARY,
  getGlossaryEntry,
  getAllTerms,
};
