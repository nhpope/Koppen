/**
 * Köppen Classification Accuracy Test Suite
 *
 * Validates that classification calculations match Beck et al. (2018) reference implementation
 * ASR-3 (HIGH PRIORITY): 100% accuracy required for scientific credibility
 *
 * Reference: Beck, H. E., et al. (2018). Present and future Köppen-Geiger climate classification
 * maps at 1-km resolution. Scientific Data, 5(1), 1-12.
 */

import { describe, it, expect } from 'vitest';
import { KOPPEN_RULES } from '../../src/climate/koppen-rules.js';
import { KOPPEN_PRESETS } from '../../src/climate/presets.js';

// Use real Köppen classification engine
function calculateKoppen(data: {
  lat: number;
  lng: number;
  temp: number[]; // Monthly temperatures (°C)
  precip: number[]; // Monthly precipitation (mm)
}): string {
  return KOPPEN_RULES.classify(data, KOPPEN_PRESETS.koppen);
}

describe('Köppen Classification Accuracy', () => {
  describe('Group A: Tropical Climates (T_min ≥ 18°C)', () => {
    it('should classify Af (Tropical Rainforest) - all months wet', () => {
      const result = calculateKoppen({
        lat: 0,
        lng: 0,
        temp: [26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26],
        precip: [250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250],
      });
      expect(result).toBe('Af');
    });

    it('should classify Am (Tropical Monsoon) - short dry season but heavy rain', () => {
      const result = calculateKoppen({
        lat: 10,
        lng: 100,
        temp: [27, 28, 29, 29, 28, 27, 27, 27, 27, 27, 27, 27],
        precip: [25, 21, 30, 120, 280, 300, 320, 310, 280, 200, 80, 25], // Pdry=21mm meets Am threshold (100-1991/25=20.36)
      });
      expect(result).toBe('Am');
    });

    it('should classify Aw (Tropical Savanna) - pronounced dry season', () => {
      const result = calculateKoppen({
        lat: -15,
        lng: 45,
        temp: [24, 24, 24, 24, 23, 22, 21, 22, 24, 25, 25, 24],
        precip: [280, 250, 180, 40, 8, 2, 1, 2, 10, 60, 150, 240],
      });
      expect(result).toBe('Aw');
    });

    it('should classify As (Tropical Savanna - dry summer) - rare variant', () => {
      const result = calculateKoppen({
        lat: -10,
        lng: -35,
        temp: [26, 26, 26, 25, 24, 23, 23, 24, 25, 26, 26, 26],
        precip: [15, 20, 45, 120, 180, 200, 190, 140, 80, 40, 25, 18],
      });
      expect(result).toBe('As');
    });
  });

  describe('Group B: Dry Climates (P < P_threshold)', () => {
    it('should classify BWh (Hot Desert) - very low precipitation, hot', () => {
      const result = calculateKoppen({
        lat: 25,
        lng: 45,
        temp: [15, 17, 21, 26, 31, 34, 35, 35, 32, 27, 21, 16],
        precip: [2, 1, 3, 2, 1, 0, 0, 0, 0, 1, 2, 3],
      });
      expect(result).toBe('BWh');
    });

    it('should classify BWk (Cold Desert) - very low precipitation, cold', () => {
      const result = calculateKoppen({
        lat: 40,
        lng: 90,
        temp: [-8, -5, 3, 12, 18, 22, 24, 22, 16, 8, -1, -6],
        precip: [3, 5, 8, 10, 12, 15, 18, 15, 10, 7, 5, 4],
      });
      expect(result).toBe('BWk');
    });

    it('should classify BSh (Hot Steppe) - semi-arid, hot', () => {
      const result = calculateKoppen({
        lat: 20,
        lng: 75,
        temp: [20, 23, 28, 32, 35, 33, 29, 28, 29, 28, 24, 21],
        precip: [8, 5, 10, 12, 20, 85, 180, 170, 100, 30, 10, 8],
      });
      expect(result).toBe('BSh');
    });

    it('should classify BSk (Cold Steppe) - semi-arid, cold', () => {
      const result = calculateKoppen({
        lat: 40,
        lng: -105,
        temp: [-3, -1, 4, 10, 15, 20, 24, 23, 17, 10, 3, -2],
        precip: [12, 12, 20, 32, 50, 42, 40, 35, 28, 22, 18, 14],
      });
      expect(result).toBe('BSk');
    });
  });

  describe('Group C: Temperate Climates (T_hot > 10°C, 0°C < T_cold < 18°C)', () => {
    it('should classify Csa (Mediterranean - Hot Summer) - dry summer, hot', () => {
      const result = calculateKoppen({
        lat: 35,
        lng: -120,
        temp: [10, 12, 14, 16, 19, 23, 26, 26, 24, 19, 14, 10],
        precip: [75, 65, 55, 25, 8, 2, 0, 1, 5, 25, 50, 70],
      });
      expect(result).toBe('Csa');
    });

    it('should classify Csb (Mediterranean - Cool Summer) - dry summer, warm', () => {
      const result = calculateKoppen({
        lat: 37,
        lng: -122,
        temp: [10, 11, 12, 13, 15, 17, 18, 18, 17, 15, 13, 10],
        precip: [110, 95, 75, 35, 15, 3, 1, 1, 5, 30, 75, 100],
      });
      expect(result).toBe('Csb');
    });

    it('should classify Cfa (Humid Subtropical) - no dry season, hot summer', () => {
      const result = calculateKoppen({
        lat: 40,
        lng: -75,
        temp: [0, 1, 6, 12, 18, 23, 26, 25, 21, 14, 8, 3],
        precip: [85, 75, 95, 90, 95, 100, 110, 100, 95, 80, 90, 90],
      });
      expect(result).toBe('Cfa');
    });

    it('should classify Cfb (Oceanic) - no dry season, warm summer', () => {
      const result = calculateKoppen({
        lat: 52,
        lng: 13,
        temp: [1, 2, 4, 9, 14, 17, 19, 19, 15, 10, 5, 2], // Fixed: Tmin now 1°C (was -1°C)
        precip: [42, 34, 41, 38, 54, 70, 56, 59, 46, 36, 48, 49],
      });
      expect(result).toBe('Cfb');
    });

    it('should classify Cwa (Humid Subtropical - Dry Winter)', () => {
      const result = calculateKoppen({
        lat: 30,
        lng: 105,
        temp: [8, 10, 15, 21, 25, 26, 27, 26, 23, 18, 13, 9],
        precip: [8, 10, 18, 55, 100, 155, 180, 160, 100, 50, 20, 10],
      });
      expect(result).toBe('Cwa');
    });

    it('should classify Cwb (Subtropical Highland - Dry Winter)', () => {
      const result = calculateKoppen({
        lat: -20,
        lng: -43,
        temp: [18, 19, 18, 17, 15, 14, 13, 15, 16, 17, 17, 18],
        precip: [280, 200, 150, 60, 25, 15, 12, 15, 35, 100, 180, 260],
      });
      expect(result).toBe('Cwb');
    });
  });

  describe('Group D: Continental Climates (T_hot > 10°C, T_cold ≤ 0°C)', () => {
    it('should classify Dfa (Humid Continental - Hot Summer, no dry)', () => {
      const result = calculateKoppen({
        lat: 42,
        lng: -88,
        temp: [-5, -3, 3, 10, 16, 22, 25, 24, 19, 12, 4, -2],
        precip: [45, 42, 58, 85, 95, 100, 95, 105, 85, 70, 65, 55],
      });
      expect(result).toBe('Dfa');
    });

    it('should classify Dfb (Humid Continental - Warm Summer, no dry)', () => {
      const result = calculateKoppen({
        lat: 60,
        lng: 30,
        temp: [-8, -7, -2, 4, 11, 16, 18, 17, 11, 5, -1, -6],
        precip: [35, 30, 30, 32, 42, 62, 72, 70, 52, 45, 42, 40],
      });
      expect(result).toBe('Dfb');
    });

    it('should classify Dfc (Subarctic - Cool Summer)', () => {
      const result = calculateKoppen({
        lat: 65,
        lng: -150,
        temp: [-22, -20, -12, -3, 6, 13, 16, 14, 7, -3, -13, -19],
        precip: [18, 15, 12, 10, 18, 35, 50, 55, 35, 22, 20, 20],
      });
      expect(result).toBe('Dfc');
    });

    it('should classify Dfd (Subarctic - Severe Winter)', () => {
      const result = calculateKoppen({
        lat: 63,
        lng: 130,
        temp: [-38, -34, -18, -3, 8, 16, 19, 16, 8, -6, -23, -33],
        precip: [12, 10, 9, 10, 15, 28, 42, 38, 22, 15, 13, 12], // Pwdry=9 >= Pswet/10=4.2 → 'f'
      });
      expect(result).toBe('Dfd');
    });

    it('should classify Dwa (Humid Continental - Hot Summer, dry winter)', () => {
      const result = calculateKoppen({
        lat: 40,
        lng: 116,
        temp: [-4, -1, 6, 14, 20, 25, 27, 26, 20, 13, 4, -2],
        precip: [3, 5, 8, 20, 35, 75, 180, 160, 50, 20, 10, 4],
      });
      expect(result).toBe('Dwa');
    });

    it('should classify Dwb (Humid Continental - Warm Summer, dry winter)', () => {
      const result = calculateKoppen({
        lat: 48,
        lng: 106,
        temp: [-21, -15, -4, 5, 13, 18, 20, 18, 11, 2, -9, -18],
        precip: [3, 5, 6, 12, 26, 58, 86, 72, 29, 12, 8, 5], // Scaled to 322mm > Pthreshold (313mm)
      });
      expect(result).toBe('Dwb');
    });

    it('should classify Dwc (Subarctic - dry winter)', () => {
      const result = calculateKoppen({
        lat: 62,
        lng: 130,
        temp: [-33, -28, -14, -2, 8, 15, 18, 15, 8, -4, -20, -29],
        precip: [5, 4, 5, 7, 15, 35, 55, 50, 25, 12, 8, 6],
      });
      expect(result).toBe('Dwc');
    });

    it('should classify Dwd (Subarctic - severe winter, dry winter)', () => {
      const result = calculateKoppen({
        lat: 63,
        lng: 143,
        temp: [-39, -35, -20, -5, 7, 15, 18, 15, 7, -7, -25, -36],
        precip: [5, 3, 2, 3, 12, 25, 40, 38, 20, 8, 6, 4], // Pwdry=2 < Pswet/10=4.0 → 'w'
      });
      expect(result).toBe('Dwd');
    });
  });

  describe('Group E: Polar Climates (T_hot < 10°C)', () => {
    it('should classify ET (Tundra) - warmest month 0-10°C', () => {
      const result = calculateKoppen({
        lat: -65,
        lng: -50,
        temp: [-10, -11, -9, -5, -1, 2, 4, 3, 0, -4, -7, -9],
        precip: [25, 30, 28, 22, 18, 15, 12, 15, 20, 25, 28, 30],
      });
      expect(result).toBe('ET');
    });

    it('should classify EF (Ice Cap) - all months below 0°C', () => {
      const result = calculateKoppen({
        lat: -80,
        lng: 0,
        temp: [-28, -38, -52, -57, -60, -62, -64, -63, -60, -51, -38, -29],
        precip: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      });
      expect(result).toBe('EF');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle exactly 18°C tropical boundary', () => {
      const result = calculateKoppen({
        lat: 20,
        lng: 100,
        temp: [18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18],
        precip: [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200],
      });
      // Should be tropical (A) since T_min >= 18°C
      expect(result.startsWith('A')).toBe(true);
    });

    it('should handle exactly 0°C C/D boundary', () => {
      const result = calculateKoppen({
        lat: 45,
        lng: 0,
        temp: [0, 2, 8, 14, 18, 21, 23, 22, 18, 12, 6, 2],
        precip: [50, 45, 50, 55, 60, 65, 60, 60, 55, 50, 50, 48],
      });
      // Should be C since T_cold = 0°C (0 < 18)
      expect(result.startsWith('C')).toBe(true);
    });

    it('should handle exactly 22°C hot summer boundary', () => {
      const result = calculateKoppen({
        lat: 42,
        lng: -75,
        temp: [0, 2, 7, 13, 18, 22, 22, 21, 18, 12, 6, 2],
        precip: [70, 65, 75, 80, 90, 95, 100, 95, 85, 75, 75, 72],
      });
      // T_hot = 22°C is exactly the boundary for 'a' vs 'b'
      // Beck et al. uses T_hot >= 22°C for 'a'
      expect(result.endsWith('a')).toBe(true);
    });

    it('should handle exactly 10°C polar boundary', () => {
      const result = calculateKoppen({
        lat: 70,
        lng: 20,
        temp: [-15, -14, -8, 0, 5, 10, 10, 8, 4, -2, -8, -12],
        precip: [20, 18, 15, 12, 15, 25, 30, 28, 22, 18, 20, 22],
      });
      // T_hot = 10°C is exactly the boundary
      // Beck et al. uses T_hot >= 10°C for non-polar
      expect(result.startsWith('E')).toBe(false);
    });
  });

  describe('Performance Requirements (NFR4: < 100ms)', () => {
    it('should calculate classification in < 1ms per cell', () => {
      const start = performance.now();

      // Calculate 1000 cells (simulating bulk processing)
      for (let i = 0; i < 1000; i++) {
        calculateKoppen({
          lat: i * 0.25,
          lng: i * 0.25,
          temp: [26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26],
          precip: [250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250],
        });
      }

      const end = performance.now();
      const avgTimePerCell = (end - start) / 1000;

      // Should average < 1ms per cell (1000 cells in < 1s)
      expect(avgTimePerCell).toBeLessThan(1);
    });
  });
});
