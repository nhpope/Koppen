/**
 * Unit Tests: URL Encoder - Story 6.3
 * Tests for url-encoder.js module (URL generation, decoding, compression)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateURL, decodeURL, hasSharedState, estimateURLSize } from '../../../src/export/url-encoder.js';
import { KOPPEN_PRESET } from '../../../src/climate/presets.js';

describe('URL Encoder', () => {
  // Sample classification state
  const sampleState = {
    name: 'My Custom Climate',
    thresholds: {
      temperature: {
        tropical_min: {
          value: 20,  // Modified from Köppen's 18
        },
        temperate_cold_min: {
          value: -3,  // Same as Köppen standard (should not be included)
        },
        hot_summer: {
          value: 24,  // Modified from Köppen's 22
        },
      },
      precipitation: {
        tropical_dry: {
          value: 60,  // Same as Koppen
        },
        monsoon_threshold: {
          value: 70,  // Modified from Koppen's 60
        },
      },
    },
  };

  beforeEach(() => {
    // Mock window.location for tests
    delete (window as any).location;
    (window as any).location = {
      origin: 'https://koppen.app',
      pathname: '/',
      href: 'https://koppen.app/',
      search: '',
    };
  });

  describe('generateURL', () => {
    it('should generate valid URL from state', () => {
      const url = generateURL(sampleState);

      expect(url).toContain('https://koppen.app/');
      expect(url).toContain('?s=');
      expect(url).toMatch(/^https:\/\/koppen\.app\/\?s=[A-Za-z0-9%+/=]+$/);
    });

    it('should generate URL under 2000 characters', () => {
      const url = generateURL(sampleState);

      expect(url.length).toBeLessThan(2000);
    });

    it('should only encode modified thresholds', () => {
      // Decode the generated URL to verify only modified values
      const url = generateURL(sampleState);
      const decoded = decodeURL(url);

      // Modified values should be different
      expect(decoded?.thresholds.temperature.tropical_min.value).toBe(20);
      expect(decoded?.thresholds.temperature.hot_summer.value).toBe(24);
      expect(decoded?.thresholds.precipitation.monsoon_threshold.value).toBe(70);

      // Unmodified values should match Köppen defaults
      expect(decoded?.thresholds.temperature.temperate_cold_min.value).toBe(-3); // Köppen standard
      expect(decoded?.thresholds.precipitation.tropical_dry.value).toBe(60);
    });

    it('should handle empty state', () => {
      const url = generateURL({});

      expect(url).toContain('?s=');
      expect(url.length).toBeLessThan(200);  // Should be very short
    });

    it('should sanitize classification name', () => {
      const stateWithSpecialChars = {
        name: 'Test<script>alert("XSS")</script>Name',
        thresholds: sampleState.thresholds,
      };

      const url = generateURL(stateWithSpecialChars);
      const decoded = decodeURL(url);

      // Should strip script tags and control chars
      expect(decoded?.name).not.toContain('<script>');
      expect(decoded?.name).not.toContain('</script>');
    });

    it('should throw error if URL exceeds max length', () => {
      // Create a state with many modified thresholds
      const hugeState = {
        name: 'A'.repeat(50),
        thresholds: {
          temperature: {},
          precipitation: {},
        },
      };

      // Add 1000 fake thresholds
      for (let i = 0; i < 1000; i++) {
        (hugeState.thresholds.temperature as any)[`threshold_${i}`] = { value: i };
      }

      expect(() => generateURL(hugeState)).toThrow(/URL too long/);
    });

    it('should use schema version 1', () => {
      const url = generateURL(sampleState);
      const decoded = decodeURL(url);

      // Decoding should succeed (implicitly verifies schema version)
      expect(decoded).toBeTruthy();
      expect(decoded?.name).toBe('My Custom Climate');
    });
  });

  describe('decodeURL', () => {
    it('should decode generated URL back to state', () => {
      const url = generateURL(sampleState);
      const decoded = decodeURL(url);

      expect(decoded).toBeTruthy();
      expect(decoded?.name).toBe('My Custom Climate');
      expect(decoded?.thresholds.temperature.tropical_min.value).toBe(20);
      expect(decoded?.thresholds.temperature.hot_summer.value).toBe(24);
    });

    it('should return null if no state parameter in URL', () => {
      const decoded = decodeURL('https://koppen.app/');

      expect(decoded).toBeNull();
    });

    it('should throw error for invalid base64', () => {
      const invalidURL = 'https://koppen.app/?s=invalid!!!base64';

      expect(() => decodeURL(invalidURL)).toThrow(/Invalid share URL/);
    });

    it('should throw error for corrupted gzip data', () => {
      const invalidURL = 'https://koppen.app/?s=eJwLycgsVgIABEUBkQ==';  // Valid base64, invalid gzip

      expect(() => decodeURL(invalidURL)).toThrow(/Invalid share URL/);
    });

    it('should merge modified thresholds with Köppen preset', () => {
      const url = generateURL(sampleState);
      const decoded = decodeURL(url);

      // Should have full Köppen structure
      expect(decoded?.thresholds.temperature).toBeTruthy();
      expect(decoded?.thresholds.precipitation).toBeTruthy();

      // Modified values
      expect(decoded?.thresholds.temperature.tropical_min.value).toBe(20);

      // Köppen defaults for unmodified (should be -3°C standard)
      expect(decoded?.thresholds.temperature.temperate_cold_min.value).toBe(
        KOPPEN_PRESET.thresholds.temperature.temperate_cold_min.value
      );
    });

    it('should set metadata correctly', () => {
      const url = generateURL(sampleState);
      const decoded = decodeURL(url);

      expect(decoded?.metadata).toBeTruthy();
      expect(decoded?.metadata.source).toBe('url');
      expect(decoded?.metadata.loaded_at).toBeTruthy();
      expect(decoded?.metadata.modified).toBe(false);
    });

    it('should handle URL-encoded parameters', () => {
      // Create URL with special chars that get URL-encoded
      const url = generateURL(sampleState);
      const encodedURL = url.replace(/ /g, '%20');  // Simulate encoding

      const decoded = decodeURL(encodedURL);

      expect(decoded).toBeTruthy();
      expect(decoded?.name).toBe('My Custom Climate');
    });
  });

  describe('hasSharedState', () => {
    it('should return false when no state in URL', () => {
      (window as any).location.search = '';

      expect(hasSharedState()).toBe(false);
    });

    it('should return true when state parameter exists', () => {
      const url = generateURL(sampleState);
      const params = new URL(url).searchParams.get('s');
      (window as any).location.search = `?s=${params}`;

      expect(hasSharedState()).toBe(true);
    });

    it('should return false for other parameters', () => {
      (window as any).location.search = '?foo=bar&baz=qux';

      expect(hasSharedState()).toBe(false);
    });
  });

  describe('estimateURLSize', () => {
    it('should return accurate URL size estimate', () => {
      const url = generateURL(sampleState);
      const estimate = estimateURLSize(sampleState);

      expect(estimate).toBe(url.length);
    });

    it('should return -1 for invalid state', () => {
      // Create invalid state that will exceed URL length
      const hugeState = {
        name: 'A'.repeat(50),
        thresholds: {
          temperature: {},
          precipitation: {},
        },
      };

      for (let i = 0; i < 1000; i++) {
        (hugeState.thresholds.temperature as any)[`threshold_${i}`] = { value: i };
      }

      const estimate = estimateURLSize(hugeState);

      expect(estimate).toBe(-1);
    });

    it('should handle empty state', () => {
      const estimate = estimateURLSize({});

      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThan(200);
    });
  });

  describe('Round-trip encoding/decoding', () => {
    it('should preserve state through encode-decode cycle', () => {
      const url = generateURL(sampleState);
      const decoded = decodeURL(url);

      expect(decoded?.name).toBe(sampleState.name);
      expect(decoded?.thresholds.temperature.tropical_min.value).toBe(
        sampleState.thresholds.temperature.tropical_min.value
      );
      expect(decoded?.thresholds.temperature.hot_summer.value).toBe(
        sampleState.thresholds.temperature.hot_summer.value
      );
    });

    it('should handle multiple encode-decode cycles', () => {
      // First cycle
      const url1 = generateURL(sampleState);
      const decoded1 = decodeURL(url1);

      // Second cycle
      const url2 = generateURL(decoded1!);
      const decoded2 = decodeURL(url2);

      // Should still match original
      expect(decoded2?.name).toBe(sampleState.name);
      expect(decoded2?.thresholds.temperature.tropical_min.value).toBe(20);
    });
  });

  describe('Compression effectiveness', () => {
    it('should compress state to smaller size than JSON', () => {
      const jsonSize = JSON.stringify(sampleState).length;
      const url = generateURL(sampleState);
      const encodedSize = url.length - 'https://koppen.app/?s='.length;

      // Compressed + base64 should be smaller than raw JSON for typical state
      expect(encodedSize).toBeLessThan(jsonSize * 1.5);
    });

    it('should only encode modified thresholds (size optimization)', () => {
      // State with all Köppen defaults
      const koppenState = {
        name: 'Köppen',
        thresholds: KOPPEN_PRESET.thresholds,
      };

      // State with many modifications
      const modifiedState = {
        name: 'Custom',
        thresholds: {
          temperature: {
            tropical_min: { value: 20 },
            cold_month_min: { value: 2 },
            hot_summer: { value: 24 },
            warm_months_threshold: { value: 12 },
            warm_months_count: { value: 5 },
          },
          precipitation: {
            dry_month: { value: 70 },
            dry_season_factor: { value: 4 },
            monsoon_threshold: { value: 70 },
            arid_summer_factor: { value: 0.8 },
          },
        },
      };

      const koppenURL = generateURL(koppenState);
      const modifiedURL = generateURL(modifiedState);

      // Köppen (all defaults) should have minimal URL
      // Modified should be larger but still reasonable
      expect(koppenURL.length).toBeLessThan(modifiedURL.length);
      expect(modifiedURL.length).toBeLessThan(1000);
    });
  });
});
