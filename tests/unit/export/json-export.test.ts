/**
 * Unit Tests: JSON Export/Import - Story 6.5
 * Tests for json-export.js module (JSON serialization, validation, import)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportJSON, importJSON, generateFilename } from '../../../src/export/json-export.js';

describe('JSON Export/Import', () => {
  // Sample classification state
  const sampleClassification = {
    name: 'My Custom Climate',
    thresholds: {
      temperature: {
        tropical_min: {
          value: 20,
          unit: '°C',
          range: { min: -100, max: 100 },
          description: 'Minimum temperature for tropical climate',
        },
        cold_month_min: {
          value: 0,
          unit: '°C',
          range: { min: -100, max: 100 },
          description: 'Minimum temperature of coldest month',
        },
      },
      precipitation: {
        dry_month: {
          value: 60,
          unit: 'mm',
          range: { min: 0, max: 10000 },
          description: 'Threshold for dry month',
        },
        monsoon_threshold: {
          value: 70,
          unit: 'mm',
          range: { min: 0, max: 10000 },
          description: 'Threshold for monsoon climate',
        },
      },
    },
    view: {
      lat: 40.7128,
      lon: -74.0060,
      zoom: 4,
    },
  };

  describe('exportJSON', () => {
    it('should export classification to JSON format', () => {
      const result = exportJSON(sampleClassification);

      expect(result).toHaveProperty('json');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('size');

      // Check JSON is valid
      const parsed = JSON.parse(result.json);
      expect(parsed.name).toBe('My Custom Climate');
      expect(parsed.version).toBe('1.0');
      expect(parsed).toHaveProperty('created');
      expect(parsed).toHaveProperty('appVersion');
      expect(parsed.thresholds).toEqual(sampleClassification.thresholds);
      expect(parsed.view).toEqual(sampleClassification.view);
    });

    it('should use default name if none provided', () => {
      const result = exportJSON({ thresholds: {} });
      const parsed = JSON.parse(result.json);

      expect(parsed.name).toBe('Custom Classification');
    });

    it('should format JSON with 2-space indentation', () => {
      const result = exportJSON(sampleClassification);

      // Check for indentation
      expect(result.json).toContain('  "name"');
      expect(result.json).toContain('  "version"');
    });

    it('should include ISO 8601 timestamp', () => {
      const result = exportJSON(sampleClassification);
      const parsed = JSON.parse(result.json);

      expect(parsed.created).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should calculate blob size correctly', () => {
      const result = exportJSON(sampleClassification);

      // Size should be positive and match actual JSON length
      expect(result.size).toBeGreaterThan(0);
      expect(result.size).toBe(new Blob([result.json]).size);
    });

    it('should handle missing view parameter', () => {
      const noView = { ...sampleClassification };
      delete noView.view;

      const result = exportJSON(noView);
      const parsed = JSON.parse(result.json);

      expect(parsed.view).toBeNull();
    });

    it('should throw error on invalid input', () => {
      expect(() => exportJSON(null)).toThrow('Failed to export classification as JSON');
    });
  });

  describe('importJSON', () => {
    let validJSON: string;

    beforeEach(() => {
      // Generate valid JSON for import tests
      const result = exportJSON(sampleClassification);
      validJSON = result.json;
    });

    it('should import and validate JSON successfully', () => {
      const classification = importJSON(validJSON);

      expect(classification.name).toBe('My Custom Climate');
      expect(classification.version).toBe('1.0');
      expect(classification.thresholds).toBeDefined();
      expect(classification.view).toEqual(sampleClassification.view);
      expect(classification.metadata).toHaveProperty('created');
      expect(classification.metadata).toHaveProperty('appVersion');
    });

    it('should sanitize threshold values', () => {
      const classification = importJSON(validJSON);

      // All thresholds should be in the full object format
      expect(classification.thresholds.temperature.tropical_min).toHaveProperty('value');
      expect(classification.thresholds.temperature.tropical_min).toHaveProperty('unit');
      expect(classification.thresholds.temperature.tropical_min).toHaveProperty('range');
    });

    it('should handle value-only threshold format', () => {
      const valueOnlyJSON = JSON.stringify({
        name: 'Value Only',
        version: '1.0',
        created: new Date().toISOString(),
        appVersion: '0.1.0',
        thresholds: {
          temperature: {
            tropical_min: 18,  // Value-only format
          },
          precipitation: {
            dry_month: 60,  // Value-only format
          },
        },
      }, null, 2);

      const classification = importJSON(valueOnlyJSON);

      expect(classification.thresholds.temperature.tropical_min.value).toBe(18);
      expect(classification.thresholds.temperature.tropical_min.unit).toBe('°C');
      expect(classification.thresholds.precipitation.dry_month.value).toBe(60);
      expect(classification.thresholds.precipitation.dry_month.unit).toBe('mm');
    });

    it('should clamp out-of-range values', () => {
      const outOfRangeJSON = JSON.stringify({
        name: 'Out of Range',
        version: '1.0',
        created: new Date().toISOString(),
        appVersion: '0.1.0',
        thresholds: {
          temperature: {
            tropical_min: {
              value: 150,  // Exceeds max (100)
              unit: '°C',
              range: { min: -100, max: 100 },
            },
          },
          precipitation: {
            dry_month: {
              value: -50,  // Below min (0)
              unit: 'mm',
              range: { min: 0, max: 10000 },
            },
          },
        },
      }, null, 2);

      const classification = importJSON(outOfRangeJSON);

      expect(classification.thresholds.temperature.tropical_min.value).toBe(100);  // Clamped to max
      expect(classification.thresholds.precipitation.dry_month.value).toBe(0);     // Clamped to min
    });

    it('should throw error for invalid JSON syntax', () => {
      expect(() => importJSON('{ invalid json')).toThrow();
    });

    it('should throw error for missing name field', () => {
      const missingName = JSON.stringify({
        version: '1.0',
        thresholds: {},
      });

      expect(() => importJSON(missingName)).toThrow('Missing or invalid "name" field');
    });

    it('should throw error for missing version field', () => {
      const missingVersion = JSON.stringify({
        name: 'Test',
        thresholds: {},
      });

      expect(() => importJSON(missingVersion)).toThrow('Missing or invalid "version" field');
    });

    it('should throw error for missing thresholds field', () => {
      const missingThresholds = JSON.stringify({
        name: 'Test',
        version: '1.0',
      });

      expect(() => importJSON(missingThresholds)).toThrow('Missing or invalid "thresholds" field');
    });

    it('should throw error for missing temperature category', () => {
      const missingCategory = JSON.stringify({
        name: 'Test',
        version: '1.0',
        thresholds: {
          precipitation: {},
        },
      });

      expect(() => importJSON(missingCategory)).toThrow('Missing or invalid "thresholds.temperature" field');
    });

    it('should throw error for missing precipitation category', () => {
      const missingCategory = JSON.stringify({
        name: 'Test',
        version: '1.0',
        thresholds: {
          temperature: {},
        },
      });

      expect(() => importJSON(missingCategory)).toThrow('Missing or invalid "thresholds.precipitation" field');
    });

    it('should throw error for incompatible major version', () => {
      const futureVersion = JSON.stringify({
        name: 'Future',
        version: '2.0',  // Major version 2
        thresholds: {
          temperature: {},
          precipitation: {},
        },
      });

      expect(() => importJSON(futureVersion)).toThrow('Incompatible version: 2.0');
    });

    it('should warn for newer minor version but allow import', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      const newerMinor = JSON.stringify({
        name: 'Newer Minor',
        version: '1.5',  // Newer minor version
        thresholds: {
          temperature: {},
          precipitation: {},
        },
      });

      const classification = importJSON(newerMinor);

      expect(classification.name).toBe('Newer Minor');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Koppen] JSON from newer minor version:',
        '1.5',
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle older version with compatibility log', () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      const olderVersion = JSON.stringify({
        name: 'Older',
        version: '0.9',  // Older major version
        thresholds: {
          temperature: {},
          precipitation: {},
        },
      });

      const classification = importJSON(olderVersion);

      expect(classification.name).toBe('Older');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Koppen] JSON from older version, will attempt migration:',
        '0.9',
      );

      consoleLogSpy.mockRestore();
    });

    it('should skip invalid threshold formats with warning', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      const invalidThreshold = JSON.stringify({
        name: 'Invalid',
        version: '1.0',
        thresholds: {
          temperature: {
            tropical_min: 'not a number',  // Invalid format
          },
          precipitation: {},
        },
      });

      const classification = importJSON(invalidThreshold);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Koppen] Invalid threshold format:',
        'temperature',
        'tropical_min',
        'not a number',
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle null view parameter', () => {
      const nullView = JSON.stringify({
        name: 'No View',
        version: '1.0',
        thresholds: {
          temperature: {},
          precipitation: {},
        },
        view: null,
      });

      const classification = importJSON(nullView);

      expect(classification.view).toBeNull();
    });
  });

  describe('generateFilename', () => {
    beforeEach(() => {
      // Mock Date to have consistent timestamps
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-03-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate filename from classification name', () => {
      const filename = generateFilename('My Custom Climate');

      expect(filename).toBe('koppen-my-custom-climate-2024-03-15.json');
    });

    it('should sanitize special characters', () => {
      const filename = generateFilename('Test@Climate#2024!');

      expect(filename).toBe('koppen-test-climate-2024-2024-03-15.json');
    });

    it('should convert to lowercase', () => {
      const filename = generateFilename('UPPERCASE');

      expect(filename).toBe('koppen-uppercase-2024-03-15.json');
    });

    it('should replace spaces with hyphens', () => {
      const filename = generateFilename('Multiple Word Name');

      expect(filename).toBe('koppen-multiple-word-name-2024-03-15.json');
    });

    it('should remove leading/trailing hyphens', () => {
      const filename = generateFilename('---test---');

      expect(filename).toBe('koppen-test-2024-03-15.json');
    });

    it('should use default name if empty', () => {
      const filename = generateFilename('');

      expect(filename).toBe('koppen--2024-03-15.json');
    });

    it('should use default name if undefined', () => {
      const filename = generateFilename();

      expect(filename).toBe('koppen-koppen-2024-03-15.json');
    });

    it('should include date in YYYY-MM-DD format', () => {
      const filename = generateFilename('test');

      expect(filename).toMatch(/koppen-test-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('should always have .json extension', () => {
      const filename = generateFilename('test');

      expect(filename).toMatch(/\.json$/);
    });
  });
});
