/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import {
  CLIMATE_COLORS,
  getClimateColor,
  getClimateColorRGBA,
} from '../../../src/utils/colors.js';

describe('Colors Module', () => {
  describe('CLIMATE_COLORS constant', () => {
    it('should have all tropical (A) climate types', () => {
      expect(CLIMATE_COLORS).toHaveProperty('Af');
      expect(CLIMATE_COLORS).toHaveProperty('Am');
      expect(CLIMATE_COLORS).toHaveProperty('Aw');
      expect(CLIMATE_COLORS).toHaveProperty('As');
    });

    it('should have all arid (B) climate types', () => {
      expect(CLIMATE_COLORS).toHaveProperty('BWh');
      expect(CLIMATE_COLORS).toHaveProperty('BWk');
      expect(CLIMATE_COLORS).toHaveProperty('BSh');
      expect(CLIMATE_COLORS).toHaveProperty('BSk');
    });

    it('should have all temperate (C) climate types', () => {
      expect(CLIMATE_COLORS).toHaveProperty('Csa');
      expect(CLIMATE_COLORS).toHaveProperty('Csb');
      expect(CLIMATE_COLORS).toHaveProperty('Csc');
      expect(CLIMATE_COLORS).toHaveProperty('Cwa');
      expect(CLIMATE_COLORS).toHaveProperty('Cwb');
      expect(CLIMATE_COLORS).toHaveProperty('Cwc');
      expect(CLIMATE_COLORS).toHaveProperty('Cfa');
      expect(CLIMATE_COLORS).toHaveProperty('Cfb');
      expect(CLIMATE_COLORS).toHaveProperty('Cfc');
    });

    it('should have all continental (D) climate types', () => {
      expect(CLIMATE_COLORS).toHaveProperty('Dsa');
      expect(CLIMATE_COLORS).toHaveProperty('Dsb');
      expect(CLIMATE_COLORS).toHaveProperty('Dsc');
      expect(CLIMATE_COLORS).toHaveProperty('Dsd');
      expect(CLIMATE_COLORS).toHaveProperty('Dwa');
      expect(CLIMATE_COLORS).toHaveProperty('Dwb');
      expect(CLIMATE_COLORS).toHaveProperty('Dwc');
      expect(CLIMATE_COLORS).toHaveProperty('Dwd');
      expect(CLIMATE_COLORS).toHaveProperty('Dfa');
      expect(CLIMATE_COLORS).toHaveProperty('Dfb');
      expect(CLIMATE_COLORS).toHaveProperty('Dfc');
      expect(CLIMATE_COLORS).toHaveProperty('Dfd');
    });

    it('should have all polar (E) climate types', () => {
      expect(CLIMATE_COLORS).toHaveProperty('ET');
      expect(CLIMATE_COLORS).toHaveProperty('EF');
    });

    it('should have 31 climate types total', () => {
      expect(Object.keys(CLIMATE_COLORS).length).toBe(31);
    });

    it('should use valid hex color format for all colors', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      for (const [type, color] of Object.entries(CLIMATE_COLORS)) {
        expect(color, `Color for ${type} should be valid hex`).toMatch(hexRegex);
      }
    });
  });

  describe('getClimateColor', () => {
    it('should return correct color for tropical rainforest (Af)', () => {
      expect(getClimateColor('Af')).toBe('#0000FF');
    });

    it('should return correct color for hot desert (BWh)', () => {
      expect(getClimateColor('BWh')).toBe('#FF0000');
    });

    it('should return correct color for Mediterranean (Csa)', () => {
      expect(getClimateColor('Csa')).toBe('#FFFF00');
    });

    it('should return correct color for humid continental (Dfa)', () => {
      expect(getClimateColor('Dfa')).toBe('#00FFFF');
    });

    it('should return correct color for tundra (ET)', () => {
      expect(getClimateColor('ET')).toBe('#B2B2B2');
    });

    it('should return fallback gray for unknown types', () => {
      expect(getClimateColor('XX')).toBe('#CCCCCC');
      expect(getClimateColor('unknown')).toBe('#CCCCCC');
      expect(getClimateColor('')).toBe('#CCCCCC');
    });

    it('should handle undefined type', () => {
      expect(getClimateColor(undefined as unknown as string)).toBe('#CCCCCC');
    });

    it('should handle null type', () => {
      expect(getClimateColor(null as unknown as string)).toBe('#CCCCCC');
    });
  });

  describe('getClimateColorRGBA', () => {
    it('should return correct RGBA for tropical rainforest (Af)', () => {
      expect(getClimateColorRGBA('Af')).toBe('rgba(0, 0, 255, 0.7)');
    });

    it('should return correct RGBA for hot desert (BWh)', () => {
      expect(getClimateColorRGBA('BWh')).toBe('rgba(255, 0, 0, 0.7)');
    });

    it('should use default opacity of 0.7', () => {
      const result = getClimateColorRGBA('Af');
      expect(result).toContain('0.7');
    });

    it('should respect custom opacity', () => {
      expect(getClimateColorRGBA('Af', 1)).toBe('rgba(0, 0, 255, 1)');
      expect(getClimateColorRGBA('Af', 0.5)).toBe('rgba(0, 0, 255, 0.5)');
      expect(getClimateColorRGBA('Af', 0)).toBe('rgba(0, 0, 255, 0)');
    });

    it('should handle unknown types with fallback color', () => {
      expect(getClimateColorRGBA('XX')).toBe('rgba(204, 204, 204, 0.7)');
    });

    it('should correctly parse hex colors to RGB', () => {
      // Test Csa (FFFF00 = yellow)
      expect(getClimateColorRGBA('Csa')).toBe('rgba(255, 255, 0, 0.7)');

      // Test EF (686868 = dark gray)
      expect(getClimateColorRGBA('EF')).toBe('rgba(104, 104, 104, 0.7)');
    });

    it('should handle edge opacity values', () => {
      expect(getClimateColorRGBA('Af', 0.001)).toBe('rgba(0, 0, 255, 0.001)');
      expect(getClimateColorRGBA('Af', 0.999)).toBe('rgba(0, 0, 255, 0.999)');
    });
  });

  describe('Color consistency', () => {
    it('should use blue spectrum for tropical (A) climates', () => {
      const tropicalColors = [
        CLIMATE_COLORS.Af,
        CLIMATE_COLORS.Am,
        CLIMATE_COLORS.Aw,
        CLIMATE_COLORS.As,
      ];

      tropicalColors.forEach(color => {
        const b = parseInt(color.slice(5, 7), 16);
        expect(b, 'Blue component should be high for tropical').toBeGreaterThan(200);
      });
    });

    it('should use red/orange spectrum for arid (B) climates', () => {
      const aridHot = [CLIMATE_COLORS.BWh, CLIMATE_COLORS.BSh];

      aridHot.forEach(color => {
        const r = parseInt(color.slice(1, 3), 16);
        expect(r, 'Red component should be high for hot arid').toBeGreaterThan(200);
      });
    });

    it('should use gray spectrum for polar (E) climates', () => {
      const polarColors = [CLIMATE_COLORS.ET, CLIMATE_COLORS.EF];

      polarColors.forEach(color => {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        // Gray colors have similar R, G, B values
        expect(Math.abs(r - g), 'R and G should be similar').toBeLessThan(10);
        expect(Math.abs(g - b), 'G and B should be similar').toBeLessThan(10);
      });
    });
  });
});
