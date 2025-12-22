/**
 * Köppen Classification Presets
 * Default thresholds based on Beck et al. 2018
 */

export const KOPPEN_PRESETS = {
  koppen: {
    // Name and metadata
    name: 'Köppen-Geiger (Beck et al. 2018)',
    version: '1.0',

    // Temperature thresholds (°C)
    tropical_min: 18,           // A: Coldest month ≥ 18°C
    temperate_cold_min: 0,      // C vs D boundary: Coldest month > 0°C
    hot_summer: 22,             // a: Warmest month ≥ 22°C
    warm_months: 4,             // b: At least 4 months > 10°C
    very_cold_winter: -38,      // d: Coldest month ≤ -38°C
    polar_tmax: 10,             // E: Warmest month < 10°C
    icecap_tmax: 0,             // EF: Warmest month < 0°C
    arid_hot: 18,               // h vs k: MAT ≥ 18°C

    // Precipitation thresholds (mm)
    tropical_dry: 60,           // Af: Driest month ≥ 60mm
    dry_summer_threshold: 40,    // s: Summer dry month < 40mm
  },

  scratch: {
    name: 'Blank (Unclassified)',
    version: '1.0',

    // Set to extreme values so everything is unclassified initially
    tropical_min: 100,
    temperate_cold_min: -100,
    hot_summer: 100,
    warm_months: 12,
    very_cold_winter: -100,
    polar_tmax: -100,
    icecap_tmax: -100,
    arid_hot: 100,
    tropical_dry: 1000,
    dry_summer_threshold: 0,
  },
};

/**
 * Example locations for each climate type
 * Curated for geographic diversity and recognizability
 */
export const EXAMPLE_LOCATIONS = {
  // Tropical (A)
  Af: [
    { name: 'Singapore', lat: 1.35, lng: 103.82 },
    { name: 'Kuala Lumpur, Malaysia', lat: 3.14, lng: 101.69 },
    { name: 'Manaus, Brazil', lat: -3.12, lng: -60.02 },
    { name: 'Jakarta, Indonesia', lat: -6.21, lng: 106.85 },
  ],
  Am: [
    { name: 'Miami, USA', lat: 25.76, lng: -80.19 },
    { name: 'Mumbai, India', lat: 19.08, lng: 72.88 },
    { name: 'Cairns, Australia', lat: -16.92, lng: 145.77 },
    { name: 'Lagos, Nigeria', lat: 6.52, lng: 3.38 },
  ],
  Aw: [
    { name: 'Darwin, Australia', lat: -12.46, lng: 130.84 },
    { name: 'Brasília, Brazil', lat: -15.79, lng: -47.88 },
    { name: 'Havana, Cuba', lat: 23.11, lng: -82.37 },
    { name: 'Bangkok, Thailand', lat: 13.76, lng: 100.50 },
  ],
  As: [
    { name: 'Honolulu, USA', lat: 21.31, lng: -157.86 },
    { name: 'Mombasa, Kenya', lat: -4.05, lng: 39.67 },
  ],

  // Arid (B)
  BWh: [
    { name: 'Phoenix, USA', lat: 33.45, lng: -112.07 },
    { name: 'Dubai, UAE', lat: 25.20, lng: 55.27 },
    { name: 'Cairo, Egypt', lat: 30.04, lng: 31.24 },
    { name: 'Riyadh, Saudi Arabia', lat: 24.71, lng: 46.68 },
  ],
  BWk: [
    { name: 'Ulaanbaatar, Mongolia', lat: 47.92, lng: 106.92 },
    { name: 'Turpan, China', lat: 42.95, lng: 89.17 },
    { name: 'Astana, Kazakhstan', lat: 51.17, lng: 71.43 },
  ],
  BSh: [
    { name: 'Marrakech, Morocco', lat: 31.63, lng: -8.01 },
    { name: 'Karachi, Pakistan', lat: 24.86, lng: 67.01 },
    { name: 'San Antonio, USA', lat: 29.42, lng: -98.49 },
  ],
  BSk: [
    { name: 'Denver, USA', lat: 39.74, lng: -104.99 },
    { name: 'Madrid, Spain', lat: 40.42, lng: -3.70 },
    { name: 'Almaty, Kazakhstan', lat: 43.24, lng: 76.95 },
    { name: 'Salt Lake City, USA', lat: 40.76, lng: -111.89 },
  ],

  // Temperate (C)
  Csa: [
    { name: 'Los Angeles, USA', lat: 34.05, lng: -118.24 },
    { name: 'Rome, Italy', lat: 41.90, lng: 12.50 },
    { name: 'Athens, Greece', lat: 37.98, lng: 23.73 },
    { name: 'Perth, Australia', lat: -31.95, lng: 115.86 },
  ],
  Csb: [
    { name: 'San Francisco, USA', lat: 37.77, lng: -122.42 },
    { name: 'Porto, Portugal', lat: 41.16, lng: -8.63 },
    { name: 'Cape Town, South Africa', lat: -33.93, lng: 18.42 },
    { name: 'Santiago, Chile', lat: -33.45, lng: -70.67 },
  ],
  Csc: [
    { name: 'Balmaceda, Chile', lat: -45.92, lng: -71.69 },
  ],
  Cwa: [
    { name: 'Hong Kong', lat: 22.32, lng: 114.17 },
    { name: 'Durban, South Africa', lat: -29.86, lng: 31.02 },
    { name: 'Taipei, Taiwan', lat: 25.03, lng: 121.57 },
  ],
  Cwb: [
    { name: 'Mexico City, Mexico', lat: 19.43, lng: -99.13 },
    { name: 'Nairobi, Kenya', lat: -1.29, lng: 36.82 },
    { name: 'Kunming, China', lat: 25.04, lng: 102.71 },
    { name: 'Addis Ababa, Ethiopia', lat: 9.03, lng: 38.75 },
  ],
  Cwc: [
    { name: 'El Alto, Bolivia', lat: -16.50, lng: -68.15 },
  ],
  Cfa: [
    { name: 'Buenos Aires, Argentina', lat: -34.60, lng: -58.38 },
    { name: 'Shanghai, China', lat: 31.23, lng: 121.47 },
    { name: 'Sydney, Australia', lat: -33.87, lng: 151.21 },
    { name: 'Atlanta, USA', lat: 33.75, lng: -84.39 },
  ],
  Cfb: [
    { name: 'London, UK', lat: 51.51, lng: -0.13 },
    { name: 'Paris, France', lat: 48.86, lng: 2.35 },
    { name: 'Melbourne, Australia', lat: -37.81, lng: 144.96 },
    { name: 'Seattle, USA', lat: 47.61, lng: -122.33 },
  ],
  Cfc: [
    { name: 'Punta Arenas, Chile', lat: -53.16, lng: -70.91 },
    { name: 'Tórshavn, Faroe Islands', lat: 62.01, lng: -6.77 },
  ],

  // Continental (D)
  Dsa: [
    { name: 'Cambridge, Idaho, USA', lat: 44.57, lng: -116.68 },
  ],
  Dsb: [
    { name: 'Flagstaff, USA', lat: 35.20, lng: -111.65 },
    { name: 'Sivas, Turkey', lat: 39.75, lng: 37.02 },
  ],
  Dsc: [
    { name: 'Gora Belukha, Russia', lat: 49.81, lng: 86.59 },
  ],
  Dsd: [
    // Extremely rare, theoretical
  ],
  Dwa: [
    { name: 'Seoul, South Korea', lat: 37.57, lng: 126.98 },
    { name: 'Pyongyang, North Korea', lat: 39.04, lng: 125.76 },
  ],
  Dwb: [
    { name: 'Vladivostok, Russia', lat: 43.12, lng: 131.89 },
    { name: 'Sapporo, Japan', lat: 43.06, lng: 141.35 },
  ],
  Dwc: [
    { name: 'Mohe, China', lat: 52.97, lng: 122.37 },
    { name: 'Chita, Russia', lat: 52.03, lng: 113.50 },
  ],
  Dwd: [
    { name: 'Verkhoyansk, Russia', lat: 67.55, lng: 133.39 },
    { name: 'Oymyakon, Russia', lat: 63.46, lng: 142.79 },
  ],
  Dfa: [
    { name: 'Chicago, USA', lat: 41.88, lng: -87.63 },
    { name: 'Beijing, China', lat: 39.90, lng: 116.41 },
    { name: 'Kyiv, Ukraine', lat: 50.45, lng: 30.52 },
  ],
  Dfb: [
    { name: 'Moscow, Russia', lat: 55.76, lng: 37.62 },
    { name: 'Helsinki, Finland', lat: 60.17, lng: 24.94 },
    { name: 'Toronto, Canada', lat: 43.65, lng: -79.38 },
    { name: 'Stockholm, Sweden', lat: 59.33, lng: 18.07 },
  ],
  Dfc: [
    { name: 'Anchorage, USA', lat: 61.22, lng: -149.90 },
    { name: 'Murmansk, Russia', lat: 68.97, lng: 33.09 },
    { name: 'Yellowknife, Canada', lat: 62.45, lng: -114.37 },
    { name: 'Fairbanks, USA', lat: 64.84, lng: -147.72 },
  ],
  Dfd: [
    { name: 'Yakutsk, Russia', lat: 62.03, lng: 129.73 },
    { name: 'Tiksi, Russia', lat: 71.64, lng: 128.87 },
  ],

  // Polar (E)
  ET: [
    { name: 'Reykjavik, Iceland', lat: 64.15, lng: -21.94 },
    { name: 'Ushuaia, Argentina', lat: -54.80, lng: -68.30 },
    { name: 'Nuuk, Greenland', lat: 64.18, lng: -51.72 },
    { name: 'Longyearbyen, Svalbard', lat: 78.22, lng: 15.63 },
  ],
  EF: [
    { name: 'McMurdo Station, Antarctica', lat: -77.85, lng: 166.67 },
    { name: 'Summit Camp, Greenland', lat: 72.58, lng: -38.46 },
    { name: 'Vostok Station, Antarctica', lat: -78.46, lng: 106.84 },
  ],
};
