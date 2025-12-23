/**
 * State Manager Tests - Story 6.6
 * Tests deep cloning, forking, and state comparison utilities
 */

import { describe, it, expect } from 'vitest';
import {
  deepClone,
  forkClassification,
  generateForkName,
  validateStructure,
  isModified,
  getModifiedThresholds,
} from '../../../src/utils/state-manager.js';

describe('state-manager', () => {
  // Sample classification for tests
  const sampleClassification = {
    name: 'Köppen Standard',
    thresholds: {
      temperature: {
        coldest: { value: 0, label: 'Coldest Month (°C)' },
        warmest: { value: 10, label: 'Warmest Month (°C)' },
      },
      precipitation: {
        annual: { value: 1000, label: 'Annual Precipitation (mm)' },
        driest: { value: 40, label: 'Driest Month (mm)' },
      },
    },
    metadata: {
      version: '1.0',
      author: 'Original Author',
    },
  };

  describe('deepClone', () => {
    it('creates independent copy without reference sharing', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const cloned = deepClone(original);

      // Modify cloned object
      cloned.name = 'Modified Name';
      cloned.thresholds.temperature.coldest.value = 999;

      // Original should be unchanged
      expect(original.name).toBe('Köppen Standard');
      expect(original.thresholds.temperature.coldest.value).toBe(0);
    });

    it('creates deep copy of nested objects', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const cloned = deepClone(original);

      // Modify deeply nested property
      cloned.thresholds.precipitation.annual.value = 5000;

      // Original should be unchanged
      expect(original.thresholds.precipitation.annual.value).toBe(1000);
    });

    it('creates deep copy of metadata', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const cloned = deepClone(original);

      // Modify metadata
      cloned.metadata.version = '2.0';

      // Original should be unchanged
      expect(original.metadata.version).toBe('1.0');
    });

    it('throws error for invalid structure', () => {
      const invalid = {
        // Missing name and thresholds
        metadata: {},
      };

      expect(() => deepClone(invalid as any)).toThrow('Failed to clone classification');
    });

    it('throws error for non-serializable data', () => {
      const withFunction = {
        ...sampleClassification,
        // @ts-ignore - testing invalid input
        callback: () => console.log('test'),
      };

      // JSON.stringify will drop the function, resulting in valid structure
      // But if we pass something truly non-serializable...
      const circular: any = { ...sampleClassification };
      circular.self = circular;

      expect(() => deepClone(circular)).toThrow('Failed to clone classification');
    });
  });

  describe('forkClassification', () => {
    it('creates fork with "(Modified)" suffix', () => {
      const forked = forkClassification(sampleClassification);

      expect(forked.name).toBe('Köppen Standard (Modified)');
    });

    it('creates independent copy', () => {
      const forked = forkClassification(sampleClassification);

      // Modify forked classification
      forked.thresholds.temperature.coldest.value = 999;

      // Original should be unchanged
      expect(sampleClassification.thresholds.temperature.coldest.value).toBe(0);
    });

    it('adds fork metadata with sourceURL', () => {
      const sourceURL = 'https://example.com/share/abc123';
      const forked = forkClassification(sampleClassification, sourceURL);

      expect(forked.metadata.forkedFrom).toBe(sourceURL);
      expect(forked.metadata.originalName).toBe('Köppen Standard');
      expect(forked.metadata.forkedAt).toBeDefined();
      expect(forked.metadata.forkGeneration).toBe(1);
    });

    it('adds fork metadata without sourceURL', () => {
      const forked = forkClassification(sampleClassification);

      expect(forked.metadata.forkedFrom).toBeNull();
      expect(forked.metadata.originalName).toBe('Köppen Standard');
      expect(forked.metadata.forkedAt).toBeDefined();
      expect(forked.metadata.forkGeneration).toBe(1);
    });

    it('preserves original metadata fields', () => {
      const forked = forkClassification(sampleClassification);

      expect(forked.metadata.version).toBe('1.0');
      expect(forked.metadata.author).toBe('Original Author');
    });

    it('increments fork generation for re-forked classifications', () => {
      const firstFork = forkClassification(sampleClassification);
      expect(firstFork.metadata.forkGeneration).toBe(1);

      const secondFork = forkClassification(firstFork);
      expect(secondFork.metadata.forkGeneration).toBe(2);

      const thirdFork = forkClassification(secondFork);
      expect(thirdFork.metadata.forkGeneration).toBe(3);
    });

    it('preserves all threshold values', () => {
      const forked = forkClassification(sampleClassification);

      expect(forked.thresholds.temperature.coldest.value).toBe(0);
      expect(forked.thresholds.temperature.warmest.value).toBe(10);
      expect(forked.thresholds.precipitation.annual.value).toBe(1000);
      expect(forked.thresholds.precipitation.driest.value).toBe(40);
    });
  });

  describe('generateForkName', () => {
    it('adds "(Modified)" suffix to name', () => {
      const name = generateForkName('Köppen Standard');
      expect(name).toBe('Köppen Standard (Modified)');
    });

    it('removes existing "(Modified)" suffix before adding new one', () => {
      const name = generateForkName('Köppen Standard (Modified)');
      expect(name).toBe('Köppen Standard (Modified)');

      // Avoid cumulative suffixes
      const doubleFork = generateForkName('Köppen Standard (Modified) (Modified)');
      expect(doubleFork).toBe('Köppen Standard (Modified)');
    });

    it('handles names with multiple "(Modified)" suffixes', () => {
      const name = generateForkName('My Classification (Modified) (Modified) (Modified)');
      expect(name).toBe('My Classification (Modified)');
    });

    it('truncates long names to fit within max length', () => {
      const longName = 'A'.repeat(100);
      const forked = generateForkName(longName, 50);

      expect(forked.length).toBeLessThanOrEqual(50);
      expect(forked).toContain('(Modified)');
      expect(forked).toContain('...');
    });

    it('does not truncate names that fit within limit', () => {
      const name = generateForkName('Short Name');
      expect(name).toBe('Short Name (Modified)');
      expect(name).not.toContain('...');
    });

    it('handles empty or whitespace-only names', () => {
      const emptyName = generateForkName('   ');
      expect(emptyName).toBe('(Modified)');
    });

    it('trims whitespace from name', () => {
      const name = generateForkName('  Köppen Standard  ');
      expect(name).toBe('Köppen Standard (Modified)');
    });
  });

  describe('validateStructure', () => {
    it('validates correct classification structure', () => {
      const valid = validateStructure(sampleClassification);
      expect(valid).toBe(true);
    });

    it('rejects null or undefined', () => {
      expect(validateStructure(null as any)).toBe(false);
      expect(validateStructure(undefined as any)).toBe(false);
    });

    it('rejects non-object values', () => {
      expect(validateStructure('string' as any)).toBe(false);
      expect(validateStructure(123 as any)).toBe(false);
      expect(validateStructure([] as any)).toBe(false);
    });

    it('rejects classification without name', () => {
      const noName = {
        thresholds: sampleClassification.thresholds,
      };
      expect(validateStructure(noName as any)).toBe(false);
    });

    it('rejects classification with non-string name', () => {
      const invalidName = {
        name: 123,
        thresholds: sampleClassification.thresholds,
      };
      expect(validateStructure(invalidName as any)).toBe(false);
    });

    it('rejects classification without thresholds', () => {
      const noThresholds = {
        name: 'Köppen Standard',
      };
      expect(validateStructure(noThresholds as any)).toBe(false);
    });

    it('rejects classification with non-object thresholds', () => {
      const invalidThresholds = {
        name: 'Köppen Standard',
        thresholds: 'invalid',
      };
      expect(validateStructure(invalidThresholds as any)).toBe(false);
    });

    it('accepts classification with minimal valid structure', () => {
      const minimal = {
        name: 'Minimal',
        thresholds: {},
      };
      expect(validateStructure(minimal)).toBe(true);
    });
  });

  describe('isModified', () => {
    it('returns false for identical classifications', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const current = deepClone(original);

      expect(isModified(current, original)).toBe(false);
    });

    it('returns true when threshold value changed', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const current = deepClone(original);

      current.thresholds.temperature.coldest.value = 5;

      expect(isModified(current, original)).toBe(true);
    });

    it('ignores metadata changes', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const current = deepClone(original);

      current.metadata.version = '2.0';
      current.metadata.author = 'Different Author';

      expect(isModified(current, original)).toBe(false);
    });

    it('ignores name changes', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const current = deepClone(original);

      current.name = 'Different Name';

      expect(isModified(current, original)).toBe(false);
    });

    it('returns true for multiple threshold changes', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const current = deepClone(original);

      current.thresholds.temperature.coldest.value = 5;
      current.thresholds.precipitation.annual.value = 2000;

      expect(isModified(current, original)).toBe(true);
    });

    it('returns false for null inputs', () => {
      expect(isModified(null, sampleClassification)).toBe(false);
      expect(isModified(sampleClassification, null)).toBe(false);
      expect(isModified(null, null)).toBe(false);
    });

    it('handles comparison with undefined thresholds', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const invalid = { thresholds: undefined };

      // undefined thresholds stringify to "undefined" which differs from valid thresholds
      // This should detect the difference and return true
      expect(isModified(invalid as any, original)).toBe(true);
    });
  });

  describe('getModifiedThresholds', () => {
    it('returns empty array for identical classifications', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const current = deepClone(original);

      const modified = getModifiedThresholds(current, original);
      expect(modified).toEqual([]);
    });

    it('returns list of modified threshold keys', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const current = deepClone(original);

      current.thresholds.temperature.coldest.value = 5;
      current.thresholds.precipitation.annual.value = 2000;

      const modified = getModifiedThresholds(current, original);
      expect(modified).toContain('temperature.coldest');
      expect(modified).toContain('precipitation.annual');
      expect(modified.length).toBe(2);
    });

    it('uses category.key format', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const current = deepClone(original);

      current.thresholds.temperature.warmest.value = 20;

      const modified = getModifiedThresholds(current, original);
      expect(modified).toEqual(['temperature.warmest']);
    });

    it('handles missing current thresholds', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const current = { thresholds: null };

      const modified = getModifiedThresholds(current as any, original);
      expect(modified).toEqual([]);
    });

    it('handles missing original thresholds', () => {
      const original = { thresholds: null };
      const current = JSON.parse(JSON.stringify(sampleClassification));

      const modified = getModifiedThresholds(current, original as any);
      expect(modified).toEqual([]);
    });

    it('handles missing category in current', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const current = deepClone(original);

      delete current.thresholds.temperature;

      const modified = getModifiedThresholds(current, original);
      expect(modified).toEqual([]);
    });

    it('handles missing category in original', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const current = deepClone(original);

      delete original.thresholds.precipitation;

      const modified = getModifiedThresholds(current, original);
      expect(modified).toEqual([]);
    });

    it('detects all changed thresholds in a category', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const current = deepClone(original);

      current.thresholds.temperature.coldest.value = 1;
      current.thresholds.temperature.warmest.value = 11;

      const modified = getModifiedThresholds(current, original);
      expect(modified).toContain('temperature.coldest');
      expect(modified).toContain('temperature.warmest');
    });
  });

  describe('Reference Isolation (Critical Security Test)', () => {
    it('ensures deep clone does not share threshold references', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const cloned = deepClone(original);

      // Get reference to nested object in clone
      const clonedThreshold = cloned.thresholds.temperature.coldest;
      clonedThreshold.value = 999;

      // Original's nested object should be unaffected
      expect(original.thresholds.temperature.coldest.value).toBe(0);
    });

    it('ensures fork does not share threshold references', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const forked = forkClassification(original);

      // Get reference to nested object in fork
      const forkedThreshold = forked.thresholds.precipitation.annual;
      forkedThreshold.value = 5000;

      // Original's nested object should be unaffected
      expect(original.thresholds.precipitation.annual.value).toBe(1000);
    });

    it('ensures fork metadata does not share references with original', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const forked = forkClassification(original);

      // Modify forked metadata
      forked.metadata.version = '3.0';

      // Original metadata should be unchanged
      expect(original.metadata.version).toBe('1.0');
    });

    it('ensures multiple forks are independent', () => {
      const original = JSON.parse(JSON.stringify(sampleClassification));
      const fork1 = forkClassification(original);
      const fork2 = forkClassification(original);

      // Modify fork1
      fork1.thresholds.temperature.coldest.value = 111;
      fork1.name = 'Fork 1';

      // Modify fork2
      fork2.thresholds.temperature.coldest.value = 222;
      fork2.name = 'Fork 2';

      // Both forks should have different values
      expect(fork1.thresholds.temperature.coldest.value).toBe(111);
      expect(fork2.thresholds.temperature.coldest.value).toBe(222);

      // Original should be unchanged
      expect(original.thresholds.temperature.coldest.value).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles classification with no metadata', () => {
      const noMetadata = {
        name: 'No Metadata',
        thresholds: {
          temperature: {
            coldest: { value: 0 },
          },
        },
      };

      const forked = forkClassification(noMetadata);
      expect(forked.metadata.forkedAt).toBeDefined();
      expect(forked.metadata.forkGeneration).toBe(1);
    });

    it('handles classification with empty thresholds', () => {
      const emptyThresholds = {
        name: 'Empty Thresholds',
        thresholds: {},
      };

      const forked = forkClassification(emptyThresholds);
      expect(forked.name).toBe('Empty Thresholds (Modified)');
      expect(forked.thresholds).toEqual({});
    });

    it('handles very long classification names', () => {
      const longName = {
        name: 'A'.repeat(200),
        thresholds: {},
      };

      const forked = forkClassification(longName);
      expect(forked.name.length).toBeLessThanOrEqual(100 + ' (Modified)'.length);
    });

    it('handles Unicode characters in classification name', () => {
      const unicodeName = {
        name: 'Köppen 🌍 Климат',
        thresholds: {},
      };

      const forked = forkClassification(unicodeName);
      expect(forked.name).toBe('Köppen 🌍 Климат (Modified)');
    });

    it('handles special characters in threshold keys', () => {
      const specialKeys = {
        name: 'Special',
        thresholds: {
          'temp-range': {
            'min-max': { value: 10 },
          },
        },
      };

      const forked = forkClassification(specialKeys);
      expect(forked.thresholds['temp-range']['min-max'].value).toBe(10);
    });
  });
});
