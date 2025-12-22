/**
 * Köppen-Geiger Classification Rules
 * Based on Beck et al. 2018
 */

export const CLIMATE_TYPES = {
  // Tropical (A)
  Af: {
    name: 'Tropical Rainforest',
    group: 'A',
    description: 'Hot and wet year-round with no dry season. Found near the equator where warm, moist air rises constantly, creating frequent rainfall. Dense rainforests thrive in this climate.',
    rules: [
      { param: 'Tcold', operator: '≥', value: 18, unit: '°C', term: 'Tcold' },
      { param: 'Pdry', operator: '≥', value: 60, unit: 'mm', term: 'Pdry' },
    ],
    path: ['Not E', 'Not B', 'A', 'f'],
  },
  Am: {
    name: 'Tropical Monsoon',
    group: 'A',
    description: 'Hot year-round with a short dry season offset by heavy monsoon rains. The annual rainfall is high enough to support tropical vegetation despite seasonal drought.',
    rules: [
      { param: 'Tcold', operator: '≥', value: 18, unit: '°C', term: 'Tcold' },
      { param: 'Pdry', operator: '<', value: 60, unit: 'mm', term: 'Pdry' },
      { param: 'Pdry', operator: '≥', value: '100 - MAP/25', unit: 'mm', term: 'monsoon' },
    ],
    path: ['Not E', 'Not B', 'A', 'm'],
  },
  Aw: {
    name: 'Tropical Savanna',
    group: 'A',
    description: 'Hot year-round with a pronounced dry season in winter. Characterized by grasslands with scattered trees, this climate supports the great savannas of Africa and South America.',
    rules: [
      { param: 'Tcold', operator: '≥', value: 18, unit: '°C', term: 'Tcold' },
      { param: 'Pdry', operator: '<', value: 60, unit: 'mm', term: 'Pdry' },
      { param: 'Dry season', operator: 'in', value: 'winter', unit: '', term: 'dry_season' },
    ],
    path: ['Not E', 'Not B', 'A', 'w'],
  },
  As: {
    name: 'Tropical Savanna (Dry Summer)',
    group: 'A',
    description: 'Hot year-round with a pronounced dry season in summer. Less common than Aw, found in areas where monsoon patterns reverse the typical seasonal rainfall pattern.',
    rules: [
      { param: 'Tcold', operator: '≥', value: 18, unit: '°C', term: 'Tcold' },
      { param: 'Pdry', operator: '<', value: 60, unit: 'mm', term: 'Pdry' },
      { param: 'Dry season', operator: 'in', value: 'summer', unit: '', term: 'dry_season' },
    ],
    path: ['Not E', 'Not B', 'A', 's'],
  },

  // Arid (B)
  BWh: {
    name: 'Hot Desert',
    group: 'B',
    description: 'Extremely dry and hot with very little precipitation. Daytime temperatures can exceed 50°C, while nights may be cool. Found in subtropical high-pressure zones like the Sahara.',
    rules: [
      { param: 'MAP', operator: '<', value: '0.5 × Pthreshold', unit: '', term: 'Pthreshold' },
      { param: 'MAT', operator: '≥', value: 18, unit: '°C', term: 'MAT' },
    ],
    path: ['Not E', 'B', 'W', 'h'],
  },
  BWk: {
    name: 'Cold Desert',
    group: 'B',
    description: 'Extremely dry with cold winters. Found at higher latitudes or elevations where aridity combines with continental temperature extremes. The Gobi Desert is a classic example.',
    rules: [
      { param: 'MAP', operator: '<', value: '0.5 × Pthreshold', unit: '', term: 'Pthreshold' },
      { param: 'MAT', operator: '<', value: 18, unit: '°C', term: 'MAT' },
    ],
    path: ['Not E', 'B', 'W', 'k'],
  },
  BSh: {
    name: 'Hot Steppe',
    group: 'B',
    description: 'Semi-arid and hot with limited but regular rainfall. Grasslands dominate, supporting grazing animals. Often found on the margins of hot deserts.',
    rules: [
      { param: 'MAP', operator: '≥', value: '0.5 × Pthreshold', unit: '', term: 'Pthreshold' },
      { param: 'MAP', operator: '<', value: 'Pthreshold', unit: '', term: 'Pthreshold' },
      { param: 'MAT', operator: '≥', value: 18, unit: '°C', term: 'MAT' },
    ],
    path: ['Not E', 'B', 'S', 'h'],
  },
  BSk: {
    name: 'Cold Steppe',
    group: 'B',
    description: 'Semi-arid with cold winters. The great grasslands of Central Asia and the American Great Plains have this climate, with hot summers and cold, dry winters.',
    rules: [
      { param: 'MAP', operator: '≥', value: '0.5 × Pthreshold', unit: '', term: 'Pthreshold' },
      { param: 'MAP', operator: '<', value: 'Pthreshold', unit: '', term: 'Pthreshold' },
      { param: 'MAT', operator: '<', value: 18, unit: '°C', term: 'MAT' },
    ],
    path: ['Not E', 'B', 'S', 'k'],
  },

  // Temperate (C)
  Csa: {
    name: 'Mediterranean (Hot Summer)',
    group: 'C',
    description: 'Dry, hot summers and mild, wet winters. The classic Mediterranean climate found around the Mediterranean Sea, California, and central Chile. Ideal for wine production.',
    rules: [
      { param: 'Tcold', operator: '>', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Tcold', operator: '<', value: 18, unit: '°C', term: 'Tcold' },
      { param: 'Thot', operator: '≥', value: 22, unit: '°C', term: 'Thot' },
      { param: 'Psdry', operator: '<', value: 40, unit: 'mm', term: 'Psdry' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'C', 's', 'a'],
  },
  Csb: {
    name: 'Mediterranean (Warm Summer)',
    group: 'C',
    description: 'Dry, warm summers and mild, wet winters. Cooler than Csa, found in coastal areas like San Francisco and coastal Portugal. Morning fog is common in summer.',
    rules: [
      { param: 'Tcold', operator: '>', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Tcold', operator: '<', value: 18, unit: '°C', term: 'Tcold' },
      { param: 'Thot', operator: '<', value: 22, unit: '°C', term: 'Thot' },
      { param: 'Tmon10', operator: '≥', value: 4, unit: 'months', term: 'Tmon10' },
      { param: 'Psdry', operator: '<', value: 40, unit: 'mm', term: 'Psdry' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'C', 's', 'b'],
  },
  Csc: {
    name: 'Mediterranean (Cold Summer)',
    group: 'C',
    description: 'Rare climate with dry, cool summers and cold, wet winters. Found only in small highland areas within Mediterranean climate zones.',
    rules: [
      { param: 'Tcold', operator: '>', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Tcold', operator: '<', value: 18, unit: '°C', term: 'Tcold' },
      { param: 'Tmon10', operator: '<', value: 4, unit: 'months', term: 'Tmon10' },
      { param: 'Psdry', operator: '<', value: 40, unit: 'mm', term: 'Psdry' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'C', 's', 'c'],
  },
  Cwa: {
    name: 'Humid Subtropical (Dry Winter)',
    group: 'C',
    description: 'Hot, humid summers with dry winters. Found in monsoon-influenced regions like Hong Kong and parts of Brazil. Heavy summer rains support lush vegetation.',
    rules: [
      { param: 'Tcold', operator: '>', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Tcold', operator: '<', value: 18, unit: '°C', term: 'Tcold' },
      { param: 'Thot', operator: '≥', value: 22, unit: '°C', term: 'Thot' },
      { param: 'Pwdry', operator: '<', value: 'Pswet/10', unit: '', term: 'Pwdry' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'C', 'w', 'a'],
  },
  Cwb: {
    name: 'Subtropical Highland (Dry Winter)',
    group: 'C',
    description: 'Mild year-round with dry winters. Found at high elevations in the tropics like Mexico City and Nairobi. Often called "eternal spring" climate.',
    rules: [
      { param: 'Tcold', operator: '>', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Tcold', operator: '<', value: 18, unit: '°C', term: 'Tcold' },
      { param: 'Thot', operator: '<', value: 22, unit: '°C', term: 'Thot' },
      { param: 'Tmon10', operator: '≥', value: 4, unit: 'months', term: 'Tmon10' },
      { param: 'Pwdry', operator: '<', value: 'Pswet/10', unit: '', term: 'Pwdry' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'C', 'w', 'b'],
  },
  Cwc: {
    name: 'Subpolar Oceanic (Dry Winter)',
    group: 'C',
    description: 'Cool year-round with dry winters. Very rare, found only in small highland areas. Short growing season with moderate precipitation.',
    rules: [
      { param: 'Tcold', operator: '>', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Tcold', operator: '<', value: 18, unit: '°C', term: 'Tcold' },
      { param: 'Tmon10', operator: '<', value: 4, unit: 'months', term: 'Tmon10' },
      { param: 'Pwdry', operator: '<', value: 'Pswet/10', unit: '', term: 'Pwdry' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'C', 'w', 'c'],
  },
  Cfa: {
    name: 'Humid Subtropical',
    group: 'C',
    description: 'Hot, humid summers and mild winters with year-round precipitation. One of the most common climates, found in southeastern United States, eastern China, and eastern Australia.',
    rules: [
      { param: 'Tcold', operator: '>', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Tcold', operator: '<', value: 18, unit: '°C', term: 'Tcold' },
      { param: 'Thot', operator: '≥', value: 22, unit: '°C', term: 'Thot' },
      { param: 'Precipitation', operator: '=', value: 'No dry season', unit: '', term: 'dry_season' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'C', 'f', 'a'],
  },
  Cfb: {
    name: 'Oceanic',
    group: 'C',
    description: 'Mild temperatures year-round with no dry season. Marine influence keeps summers cool and winters mild. Found in Western Europe, New Zealand, and the Pacific Northwest.',
    rules: [
      { param: 'Tcold', operator: '>', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Tcold', operator: '<', value: 18, unit: '°C', term: 'Tcold' },
      { param: 'Thot', operator: '<', value: 22, unit: '°C', term: 'Thot' },
      { param: 'Tmon10', operator: '≥', value: 4, unit: 'months', term: 'Tmon10' },
      { param: 'Precipitation', operator: '=', value: 'No dry season', unit: '', term: 'dry_season' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'C', 'f', 'b'],
  },
  Cfc: {
    name: 'Subpolar Oceanic',
    group: 'C',
    description: 'Cool year-round with no dry season. Found in coastal areas at high latitudes like southern Chile and Iceland\'s coast. Short, cool summers and long, mild winters.',
    rules: [
      { param: 'Tcold', operator: '>', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Tcold', operator: '<', value: 18, unit: '°C', term: 'Tcold' },
      { param: 'Tmon10', operator: '<', value: 4, unit: 'months', term: 'Tmon10' },
      { param: 'Tmon10', operator: '≥', value: 1, unit: 'months', term: 'Tmon10' },
      { param: 'Precipitation', operator: '=', value: 'No dry season', unit: '', term: 'dry_season' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'C', 'f', 'c'],
  },

  // Continental (D)
  Dsa: {
    name: 'Mediterranean Continental (Hot Summer)',
    group: 'D',
    description: 'Hot, dry summers and cold winters. Rare climate found in mountainous areas of Iran, Turkey, and Central Asia. Extreme temperature ranges.',
    rules: [
      { param: 'Tcold', operator: '≤', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Thot', operator: '≥', value: 22, unit: '°C', term: 'Thot' },
      { param: 'Psdry', operator: '<', value: 40, unit: 'mm', term: 'Psdry' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'D', 's', 'a'],
  },
  Dsb: {
    name: 'Mediterranean Continental (Warm Summer)',
    group: 'D',
    description: 'Warm, dry summers and very cold winters. Found at high elevations in continental interiors. Snow-covered winters with Mediterranean-like summers.',
    rules: [
      { param: 'Tcold', operator: '≤', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Thot', operator: '<', value: 22, unit: '°C', term: 'Thot' },
      { param: 'Tmon10', operator: '≥', value: 4, unit: 'months', term: 'Tmon10' },
      { param: 'Psdry', operator: '<', value: 40, unit: 'mm', term: 'Psdry' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'D', 's', 'b'],
  },
  Dsc: {
    name: 'Mediterranean Continental (Cold Summer)',
    group: 'D',
    description: 'Cool, dry summers and very cold winters. Extremely rare, found only in small areas of high mountains in Central Asia.',
    rules: [
      { param: 'Tcold', operator: '≤', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Tmon10', operator: '<', value: 4, unit: 'months', term: 'Tmon10' },
      { param: 'Psdry', operator: '<', value: 40, unit: 'mm', term: 'Psdry' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'D', 's', 'c'],
  },
  Dsd: {
    name: 'Mediterranean Continental (Very Cold)',
    group: 'D',
    description: 'Dry summers with extremely cold winters below -38°C. Theoretical climate type, rarely if ever observed in the real world.',
    rules: [
      { param: 'Tcold', operator: '≤', value: -38, unit: '°C', term: 'Tcold' },
      { param: 'Psdry', operator: '<', value: 40, unit: 'mm', term: 'Psdry' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'D', 's', 'd'],
  },
  Dwa: {
    name: 'Monsoon Continental (Hot Summer)',
    group: 'D',
    description: 'Dry winters and hot, humid summers influenced by monsoon. Found in northeastern China and Korea. Sharp seasonal contrast.',
    rules: [
      { param: 'Tcold', operator: '≤', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Thot', operator: '≥', value: 22, unit: '°C', term: 'Thot' },
      { param: 'Pwdry', operator: '<', value: 'Pswet/10', unit: '', term: 'Pwdry' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'D', 'w', 'a'],
  },
  Dwb: {
    name: 'Monsoon Continental (Warm Summer)',
    group: 'D',
    description: 'Dry winters and warm summers. Found across northeastern Asia. Four distinct seasons with monsoon-influenced precipitation pattern.',
    rules: [
      { param: 'Tcold', operator: '≤', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Thot', operator: '<', value: 22, unit: '°C', term: 'Thot' },
      { param: 'Tmon10', operator: '≥', value: 4, unit: 'months', term: 'Tmon10' },
      { param: 'Pwdry', operator: '<', value: 'Pswet/10', unit: '', term: 'Pwdry' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'D', 'w', 'b'],
  },
  Dwc: {
    name: 'Monsoon Continental (Cold Summer)',
    group: 'D',
    description: 'Dry winters and cool, short summers. Found in Siberia and northern Manchuria. Long, harsh winters dominate the year.',
    rules: [
      { param: 'Tcold', operator: '≤', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Tmon10', operator: '<', value: 4, unit: 'months', term: 'Tmon10' },
      { param: 'Tcold', operator: '>', value: -38, unit: '°C', term: 'Tcold' },
      { param: 'Pwdry', operator: '<', value: 'Pswet/10', unit: '', term: 'Pwdry' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'D', 'w', 'c'],
  },
  Dwd: {
    name: 'Monsoon Continental (Very Cold)',
    group: 'D',
    description: 'Dry winters with extremely severe cold below -38°C. Found in northeastern Siberia, home to the coldest inhabited places on Earth.',
    rules: [
      { param: 'Tcold', operator: '≤', value: -38, unit: '°C', term: 'Tcold' },
      { param: 'Pwdry', operator: '<', value: 'Pswet/10', unit: '', term: 'Pwdry' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'D', 'w', 'd'],
  },
  Dfa: {
    name: 'Humid Continental (Hot Summer)',
    group: 'D',
    description: 'No dry season with hot summers and cold winters. The classic four-season climate of the American Midwest and eastern Europe. Fertile agricultural regions.',
    rules: [
      { param: 'Tcold', operator: '≤', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Thot', operator: '≥', value: 22, unit: '°C', term: 'Thot' },
      { param: 'Precipitation', operator: '=', value: 'No dry season', unit: '', term: 'dry_season' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'D', 'f', 'a'],
  },
  Dfb: {
    name: 'Humid Continental (Warm Summer)',
    group: 'D',
    description: 'No dry season with warm summers and cold winters. Widespread across Russia, Scandinavia, and Canada. Coniferous and mixed forests dominate.',
    rules: [
      { param: 'Tcold', operator: '≤', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Thot', operator: '<', value: 22, unit: '°C', term: 'Thot' },
      { param: 'Tmon10', operator: '≥', value: 4, unit: 'months', term: 'Tmon10' },
      { param: 'Precipitation', operator: '=', value: 'No dry season', unit: '', term: 'dry_season' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'D', 'f', 'b'],
  },
  Dfc: {
    name: 'Subarctic',
    group: 'D',
    description: 'No dry season with cool, short summers and very cold winters. The vast taiga forests of Russia, Canada, and Alaska. Permafrost is common.',
    rules: [
      { param: 'Tcold', operator: '≤', value: 0, unit: '°C', term: 'Tcold' },
      { param: 'Tmon10', operator: '<', value: 4, unit: 'months', term: 'Tmon10' },
      { param: 'Tmon10', operator: '≥', value: 1, unit: 'months', term: 'Tmon10' },
      { param: 'Tcold', operator: '>', value: -38, unit: '°C', term: 'Tcold' },
      { param: 'Precipitation', operator: '=', value: 'No dry season', unit: '', term: 'dry_season' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'D', 'f', 'c'],
  },
  Dfd: {
    name: 'Subarctic (Severe Winter)',
    group: 'D',
    description: 'No dry season with extremely severe winters below -38°C. Found in Siberia and northern Canada. Winter temperatures can drop below -50°C.',
    rules: [
      { param: 'Tcold', operator: '≤', value: -38, unit: '°C', term: 'Tcold' },
      { param: 'Precipitation', operator: '=', value: 'No dry season', unit: '', term: 'dry_season' },
    ],
    path: ['Not E', 'Not B', 'Not A', 'D', 'f', 'd'],
  },

  // Polar (E)
  ET: {
    name: 'Tundra',
    group: 'E',
    description: 'Very cold with warmest month between 0°C and 10°C. Found in Arctic coastal regions and high mountains. Only hardy mosses, lichens, and low shrubs survive.',
    rules: [
      { param: 'Thot', operator: '<', value: 10, unit: '°C', term: 'Thot' },
      { param: 'Thot', operator: '≥', value: 0, unit: '°C', term: 'Thot' },
    ],
    path: ['E', 'T'],
  },
  EF: {
    name: 'Ice Cap',
    group: 'E',
    description: 'Perpetual ice and snow with all months below 0°C. Found in interior Antarctica and Greenland. No vegetation can survive; only scientific stations exist here.',
    rules: [
      { param: 'Thot', operator: '<', value: 0, unit: '°C', term: 'Thot' },
    ],
    path: ['E', 'F'],
  },
};

export const KOPPEN_RULES = {
  /**
   * Classify climate based on temperature and precipitation data
   * @param {Object} data - { temp: number[12], precip: number[12], lat: number }
   * @param {Object} thresholds - Classification thresholds
   * @returns {string} Köppen climate code
   */
  classify(data, thresholds) {
    const { temp, precip, lat } = data;

    // Calculate derived metrics
    const MAT = temp.reduce((a, b) => a + b, 0) / 12;
    const Tmax = Math.max(...temp);
    const Tmin = Math.min(...temp);
    const MAP = precip.reduce((a, b) => a + b, 0);
    const Pdry = Math.min(...precip);

    // Determine summer/winter months based on hemisphere
    const isNorthern = lat >= 0;
    const summerMonths = isNorthern ? [3, 4, 5, 6, 7, 8] : [9, 10, 11, 0, 1, 2];
    const winterMonths = isNorthern ? [9, 10, 11, 0, 1, 2] : [3, 4, 5, 6, 7, 8];

    const Psdry = Math.min(...summerMonths.map(i => precip[i]));
    const Pwdry = Math.min(...winterMonths.map(i => precip[i]));
    const Pswet = Math.max(...summerMonths.map(i => precip[i]));
    const Pwwet = Math.max(...winterMonths.map(i => precip[i]));

    const Psummer = summerMonths.reduce((sum, i) => sum + precip[i], 0);

    // Calculate Pthreshold for B climates (Köppen-Geiger formula)
    // Pthreshold in mm, MAT in °C
    let Pthreshold;
    if (Psummer / MAP >= 0.7) {
      Pthreshold = 20 * MAT + 280;  // Summer rainfall dominant
    } else if (Psummer / MAP <= 0.3) {
      Pthreshold = 20 * MAT;         // Winter rainfall dominant
    } else {
      Pthreshold = 20 * MAT + 140;   // Evenly distributed
    }

    // Count warm months (T > 10°C)
    const warmMonths = temp.filter(t => t > 10).length;

    // Classification decision tree (per Beck et al. 2018)
    // Order: E (polar) → B (arid) → A (tropical) → C/D (temperate/continental)
    // E is checked first because it's independent of precipitation (purely temperature-based)

    // E - Polar (check temperature extremes FIRST - independent of precipitation)
    if (Tmax < thresholds.polar_tmax) {
      return Tmax < thresholds.icecap_tmax ? 'EF' : 'ET';
    }

    // B - Arid (check precipitation threshold)
    if (MAP < Pthreshold) {
      const isDesert = MAP < Pthreshold * 0.5;
      const isHot = MAT >= thresholds.arid_hot;
      if (isDesert) {
        return isHot ? 'BWh' : 'BWk';
      }
        return isHot ? 'BSh' : 'BSk';

    }

    // A - Tropical (warm all year)
    if (Tmin >= thresholds.tropical_min) {
      if (Pdry >= thresholds.tropical_dry) {
        return 'Af';
      } else if (Pdry >= 100 - MAP / 25) {
        return 'Am';
      }
        return Psdry < Pwdry ? 'As' : 'Aw';

    }

    // C or D - Temperate or Continental
    // Beck et al. 2018: C if T_cold > 0°C (0°C exactly is boundary, use >= to include it in C)
    const isC = Tmin >= thresholds.temperate_cold_min;
    const prefix = isC ? 'C' : 'D';

    // Second letter - precipitation pattern
    let secondLetter;
    if (Psdry < thresholds.dry_summer_threshold && Psdry < Pwwet / 3) {
      secondLetter = 's';
    } else if (Pwdry < Pswet / 10) {
      secondLetter = 'w';
    } else {
      secondLetter = 'f';
    }

    // Third letter - temperature
    let thirdLetter;
    if (Tmax >= thresholds.hot_summer) {
      thirdLetter = 'a';
    } else if (warmMonths >= thresholds.warm_months) {
      thirdLetter = 'b';
    } else if (Tmin > thresholds.very_cold_winter) {
      thirdLetter = 'c';
    } else {
      thirdLetter = 'd';
    }

    // D climates can have 'd', C climates cannot
    if (prefix === 'C' && thirdLetter === 'd') {
      thirdLetter = 'c';
    }

    return prefix + secondLetter + thirdLetter;
  },

  /**
   * Get information about a climate type
   * @param {string} code - Köppen code
   * @returns {Object} Climate type info
   */
  getClimateInfo(code) {
    return CLIMATE_TYPES[code] || { name: 'Unknown', group: '?', description: 'Unknown climate type' };
  },

  /**
   * Get all climate types
   * @returns {Object} All climate types
   */
  getAllTypes() {
    return CLIMATE_TYPES;
  },
};
