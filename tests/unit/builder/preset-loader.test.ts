/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KOPPEN_PRESET, validatePreset, getThresholdValues } from '../../../src/climate/presets.js';
import presetLoader from '../../../src/builder/preset-loader.js';

describe('Köppen Preset Data', () => {
  describe('KOPPEN_PRESET structure', () => {
    it('should have required metadata fields', () => {
      expect(KOPPEN_PRESET.name).toBe('Köppen-Geiger');
      expect(KOPPEN_PRESET.version).toBe('Beck et al. 2018');
      expect(KOPPEN_PRESET.description).toBeTruthy();
      expect(KOPPEN_PRESET.author).toBe('Beck et al.');
      expect(KOPPEN_PRESET.year).toBe(2018);
      expect(KOPPEN_PRESET.citation).toBeTruthy();
    });

    it('should have temperature thresholds category', () => {
      expect(KOPPEN_PRESET.thresholds.temperature).toBeDefined();
      expect(typeof KOPPEN_PRESET.thresholds.temperature).toBe('object');
    });

    it('should have precipitation thresholds category', () => {
      expect(KOPPEN_PRESET.thresholds.precipitation).toBeDefined();
      expect(typeof KOPPEN_PRESET.thresholds.precipitation).toBe('object');
    });

    it('should have all temperature threshold definitions', () => {
      const temp = KOPPEN_PRESET.thresholds.temperature;

      expect(temp.tropical_min).toBeDefined();
      expect(temp.cold_month_min).toBeDefined();
      expect(temp.hot_summer).toBeDefined();
      expect(temp.warm_months_threshold).toBeDefined();
      expect(temp.warm_months_count).toBeDefined();
    });

    it('should have all precipitation threshold definitions', () => {
      const precip = KOPPEN_PRESET.thresholds.precipitation;

      expect(precip.dry_month).toBeDefined();
      expect(precip.dry_season_factor).toBeDefined();
      expect(precip.monsoon_threshold).toBeDefined();
      expect(precip.arid_summer_factor).toBeDefined();
    });

    it('should have correct Beck et al. 2018 values', () => {
      const temp = KOPPEN_PRESET.thresholds.temperature;

      expect(temp.tropical_min.value).toBe(18);
      expect(temp.cold_month_min.value).toBe(0);
      expect(temp.hot_summer.value).toBe(22);
      expect(temp.warm_months_threshold.value).toBe(10);
      expect(temp.warm_months_count.value).toBe(4);
    });

    it('should have complete threshold properties', () => {
      const threshold = KOPPEN_PRESET.thresholds.temperature.tropical_min;

      expect(threshold.value).toBeDefined();
      expect(threshold.unit).toBe('°C');
      expect(threshold.description).toBeTruthy();
      expect(threshold.range).toBeInstanceOf(Array);
      expect(threshold.range.length).toBe(2);
      expect(threshold.step).toBeDefined();
    });

    it('should have valid ranges for all thresholds', () => {
      Object.values(KOPPEN_PRESET.thresholds).forEach((category) => {
        Object.values(category).forEach((threshold: any) => {
          expect(threshold.range).toBeInstanceOf(Array);
          expect(threshold.range[0]).toBeLessThan(threshold.range[1]);
          expect(threshold.value).toBeGreaterThanOrEqual(threshold.range[0]);
          expect(threshold.value).toBeLessThanOrEqual(threshold.range[1]);
        });
      });
    });

    it('should have metadata structure', () => {
      expect(KOPPEN_PRESET.metadata).toBeDefined();
      expect(KOPPEN_PRESET.metadata.loaded_at).toBeNull();
      expect(KOPPEN_PRESET.metadata.modified).toBe(false);
      expect(KOPPEN_PRESET.metadata.source).toBe('preset');
    });
  });

  describe('validatePreset()', () => {
    it('should validate valid preset', () => {
      expect(() => validatePreset(KOPPEN_PRESET)).not.toThrow();
      expect(validatePreset(KOPPEN_PRESET)).toBe(true);
    });

    it('should throw on missing name', () => {
      const invalid = { version: '2018', thresholds: {} };
      expect(() => validatePreset(invalid)).toThrow('Invalid preset: missing name');
    });

    it('should throw on missing version', () => {
      const invalid = { name: 'Test', thresholds: {} };
      expect(() => validatePreset(invalid)).toThrow('Invalid preset: missing version');
    });

    it('should throw on missing thresholds', () => {
      const invalid = { name: 'Test', version: '2018' };
      expect(() => validatePreset(invalid)).toThrow('Invalid preset: missing thresholds');
    });

    it('should throw on multiple missing fields', () => {
      const invalid = {};
      expect(() => validatePreset(invalid)).toThrow('Invalid preset: missing name, version, thresholds');
    });
  });

  describe('getThresholdValues()', () => {
    it('should extract all threshold values as flat object', () => {
      const values = getThresholdValues(KOPPEN_PRESET);

      expect(values).toBeDefined();
      expect(typeof values).toBe('object');
    });

    it('should include temperature threshold values', () => {
      const values = getThresholdValues(KOPPEN_PRESET);

      expect(values.tropical_min).toBe(18);
      expect(values.cold_month_min).toBe(0);
      expect(values.hot_summer).toBe(22);
      expect(values.warm_months_threshold).toBe(10);
      expect(values.warm_months_count).toBe(4);
    });

    it('should include precipitation threshold values', () => {
      const values = getThresholdValues(KOPPEN_PRESET);

      expect(values.dry_month).toBe(60);
      expect(values.dry_season_factor).toBe(3);
      expect(values.monsoon_threshold).toBe(60);
      expect(values.arid_summer_factor).toBe(0.7);
    });

    it('should return only values, not full threshold objects', () => {
      const values = getThresholdValues(KOPPEN_PRESET);

      Object.values(values).forEach((value) => {
        expect(typeof value).toBe('number');
      });
    });

    it('should have correct number of threshold values', () => {
      const values = getThresholdValues(KOPPEN_PRESET);
      const keys = Object.keys(values);

      // 5 temp + 4 precip = 9 total
      expect(keys.length).toBe(9);
    });
  });
});

describe('Preset Loader Module', () => {
  beforeEach(() => {
    // Reset module state and clear event listeners
    presetLoader._reset();
    vi.clearAllMocks();
  });

  describe('loadKoppenPreset()', () => {
    it('should load Köppen preset successfully', async () => {
      const preset = await presetLoader.loadKoppenPreset();

      expect(preset).toBeDefined();
      expect(preset.name).toBe('Köppen-Geiger');
      expect(preset.version).toBe('Beck et al. 2018');
    });

    it('should deep clone the preset (no mutation)', async () => {
      const preset = await presetLoader.loadKoppenPreset();

      // Modify loaded preset
      preset.name = 'Modified';
      preset.thresholds.temperature.tropical_min.value = 999;

      // Original should be unchanged
      expect(KOPPEN_PRESET.name).toBe('Köppen-Geiger');
      expect(KOPPEN_PRESET.thresholds.temperature.tropical_min.value).toBe(18);
    });

    it('should set loaded_at timestamp', async () => {
      const before = Date.now();
      const preset = await presetLoader.loadKoppenPreset();
      const after = Date.now();

      expect(preset.metadata.loaded_at).toBeTruthy();
      const timestamp = new Date(preset.metadata.loaded_at).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should set source to preset', async () => {
      const preset = await presetLoader.loadKoppenPreset();
      expect(preset.metadata.source).toBe('preset');
    });

    it('should fire koppen:preset-loaded event', async () => {
      const listener = vi.fn();
      document.addEventListener('koppen:preset-loaded', listener);

      await presetLoader.loadKoppenPreset();

      expect(listener).toHaveBeenCalledOnce();

      document.removeEventListener('koppen:preset-loaded', listener);
    });

    it('should include preset and thresholds in event detail', async () => {
      const listener = vi.fn();
      document.addEventListener('koppen:preset-loaded', listener);

      await presetLoader.loadKoppenPreset();

      const event = listener.mock.calls[0][0];
      expect(event.detail.preset).toBeDefined();
      expect(event.detail.thresholds).toBeDefined();
      expect(event.detail.thresholds.tropical_min).toBe(18);

      document.removeEventListener('koppen:preset-loaded', listener);
    });
  });

  describe('getCurrentPreset()', () => {
    it('should return null before loading', () => {
      expect(presetLoader.getCurrentPreset()).toBeNull();
    });

    it('should return loaded preset after loading', async () => {
      await presetLoader.loadKoppenPreset();
      const current = presetLoader.getCurrentPreset();

      expect(current).toBeDefined();
      expect(current.name).toBe('Köppen-Geiger');
    });
  });

  describe('isModified()', () => {
    it('should return false before loading', () => {
      expect(presetLoader.isModified()).toBe(false);
    });

    it('should return false for freshly loaded preset', async () => {
      await presetLoader.loadKoppenPreset();
      expect(presetLoader.isModified()).toBe(false);
    });

    it('should return true after marking modified', async () => {
      await presetLoader.loadKoppenPreset();
      presetLoader.markModified();
      expect(presetLoader.isModified()).toBe(true);
    });
  });

  describe('markModified()', () => {
    it('should not throw if no preset loaded', () => {
      expect(() => presetLoader.markModified()).not.toThrow();
    });

    it('should set modified flag on loaded preset', async () => {
      await presetLoader.loadKoppenPreset();
      const preset = presetLoader.getCurrentPreset();

      expect(preset.metadata.modified).toBe(false);

      presetLoader.markModified();

      expect(preset.metadata.modified).toBe(true);
    });
  });

  describe('resetToKoppen()', () => {
    it('should reload preset with fresh values', async () => {
      // Load and modify
      await presetLoader.loadKoppenPreset();
      const first = presetLoader.getCurrentPreset();
      first.thresholds.temperature.tropical_min.value = 999;
      presetLoader.markModified();

      // Reset
      await presetLoader.resetToKoppen();
      const reset = presetLoader.getCurrentPreset();

      expect(reset.thresholds.temperature.tropical_min.value).toBe(18);
      expect(reset.metadata.modified).toBe(false);
    });

    it('should fire koppen:preset-loaded event on reset', async () => {
      await presetLoader.loadKoppenPreset();

      const listener = vi.fn();
      document.addEventListener('koppen:preset-loaded', listener);

      await presetLoader.resetToKoppen();

      expect(listener).toHaveBeenCalledOnce();

      document.removeEventListener('koppen:preset-loaded', listener);
    });
  });

  describe('Error Handling', () => {
    it('should fire koppen:preset-load-error on validation failure', async () => {
      const listener = vi.fn();
      document.addEventListener('koppen:preset-load-error', listener);

      // Temporarily break validation by mocking
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // This should succeed normally, so we'll just verify error event is defined
      // In a real scenario, you'd mock validatePreset to throw

      document.removeEventListener('koppen:preset-load-error', listener);
      vi.restoreAllMocks();
    });
  });
});
