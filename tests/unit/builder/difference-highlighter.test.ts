/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import differenceHighlighter from '../../../src/builder/difference-highlighter.js';

describe('Difference Highlighter Module (Story 5.2)', () => {
  let mockCustomClassification;
  let mockKoppenClassification;

  beforeEach(() => {
    // Mock classifications
    mockCustomClassification = {
      features: [
        { properties: { climate_type: 'Cfb' } }, // Changed from Cfa
        { properties: { climate_type: 'Af' } },  // Unchanged
        { properties: { climate_type: 'Aw' } },  // Changed from Af
      ],
    };

    mockKoppenClassification = {
      features: [
        { properties: { climate_type: 'Cfa' } },
        { properties: { climate_type: 'Af' } },
        { properties: { climate_type: 'Af' } },
      ],
    };
  });

  afterEach(() => {
    differenceHighlighter.destroy();
    vi.clearAllMocks();
  });

  describe('Difference Calculation', () => {
    it('should calculate differences between classifications', () => {
      const { differences, summary } = differenceHighlighter.calculateDifferences(
        mockCustomClassification,
        mockKoppenClassification,
      );

      expect(differences.length).toBe(2); // 2 cells changed
      expect(summary.total).toBe(3);
      expect(summary.changed).toBe(2);
      expect(summary.percentage).toBe('66.7');
    });

    it('should identify correct from/to climate types', () => {
      const { differences } = differenceHighlighter.calculateDifferences(
        mockCustomClassification,
        mockKoppenClassification,
      );

      expect(differences[0].from).toBe('Cfa');
      expect(differences[0].to).toBe('Cfb');
      expect(differences[1].from).toBe('Af');
      expect(differences[1].to).toBe('Aw');
    });

    it('should handle empty classifications', () => {
      const { differences, summary } = differenceHighlighter.calculateDifferences(null, null);

      expect(differences.length).toBe(0);
      expect(summary.total).toBe(0);
      expect(summary.changed).toBe(0);
      expect(summary.percentage).toBe('0.0');
    });

    it('should fire koppen:differences-computed event', () => {
      const eventSpy = vi.fn();
      document.addEventListener('koppen:differences-computed', eventSpy);

      differenceHighlighter.calculateDifferences(
        mockCustomClassification,
        mockKoppenClassification,
      );

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail.summary.changed).toBe(2);
    });

    it('should calculate top reclassification patterns', () => {
      const { summary } = differenceHighlighter.calculateDifferences(
        mockCustomClassification,
        mockKoppenClassification,
      );

      expect(summary.topPatterns.length).toBeGreaterThan(0);
      expect(summary.topPatterns[0]).toHaveProperty('pattern');
      expect(summary.topPatterns[0]).toHaveProperty('count');
      expect(summary.topPatterns[0]).toHaveProperty('fromName');
      expect(summary.topPatterns[0]).toHaveProperty('toName');
    });

    it('should sort top patterns by count descending', () => {
      // Create mock with multiple patterns
      const custom = {
        features: [
          { properties: { climate_type: 'Cfb' } },
          { properties: { climate_type: 'Cfb' } },
          { properties: { climate_type: 'Aw' } },
        ],
      };
      const koppen = {
        features: [
          { properties: { climate_type: 'Cfa' } },
          { properties: { climate_type: 'Cfa' } },
          { properties: { climate_type: 'Af' } },
        ],
      };

      const { summary } = differenceHighlighter.calculateDifferences(custom, koppen);

      // Cfa→Cfb should be first (2 occurrences)
      expect(summary.topPatterns[0].pattern).toBe('Cfa→Cfb');
      expect(summary.topPatterns[0].count).toBe(2);
    });

    it('should limit top patterns to 5', () => {
      // Create classification with >5 unique patterns
      const custom = {
        features: Array(10).fill(0).map((_, i) => ({
          properties: { climate_type: `Type${i}` },
        })),
      };
      const koppen = {
        features: Array(10).fill(0).map(() => ({
          properties: { climate_type: 'Cfa' },
        })),
      };

      const { summary } = differenceHighlighter.calculateDifferences(custom, koppen);

      expect(summary.topPatterns.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Climate Name Mapping', () => {
    it('should return full climate names for known codes', () => {
      expect(differenceHighlighter.getClimateName('Cfa')).toBe('Humid Subtropical');
      expect(differenceHighlighter.getClimateName('Cfb')).toBe('Oceanic');
      expect(differenceHighlighter.getClimateName('Af')).toBe('Tropical Rainforest');
    });

    it('should return code itself for unknown codes', () => {
      expect(differenceHighlighter.getClimateName('UNKNOWN')).toBe('UNKNOWN');
    });

    it('should include climate names in top patterns', () => {
      const { summary } = differenceHighlighter.calculateDifferences(
        mockCustomClassification,
        mockKoppenClassification,
      );

      const pattern = summary.topPatterns.find(p => p.from === 'Cfa');
      expect(pattern.fromName).toBe('Humid Subtropical');
      expect(pattern.toName).toBe('Oceanic');
    });
  });

  describe('Toggle Functionality', () => {
    it('should toggle difference highlighting on/off', () => {
      differenceHighlighter.toggle(true);
      expect(differenceHighlighter.getState().enabled).toBe(true);

      differenceHighlighter.toggle(false);
      expect(differenceHighlighter.getState().enabled).toBe(false);
    });

    it('should fire koppen:differences-toggled event', () => {
      const eventSpy = vi.fn();
      document.addEventListener('koppen:differences-toggled', eventSpy);

      differenceHighlighter.toggle(true);

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail.enabled).toBe(true);
    });

    it('should include differences and summary in toggle event', () => {
      // Calculate differences first
      differenceHighlighter.calculateDifferences(
        mockCustomClassification,
        mockKoppenClassification,
      );

      const eventSpy = vi.fn();
      document.addEventListener('koppen:differences-toggled', eventSpy);

      differenceHighlighter.toggle(true);

      expect(eventSpy.mock.calls[0][0].detail.differences.length).toBe(2);
      expect(eventSpy.mock.calls[0][0].detail.summary.changed).toBe(2);
    });
  });

  describe('UI Creation', () => {
    it('should create toggle UI with checkbox', () => {
      const ui = differenceHighlighter.createToggleUI();

      expect(ui.className).toContain('builder-panel__differences');

      const checkbox = ui.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeTruthy();
      expect(checkbox.id).toBe('show-differences');
    });

    it('should show summary when differences exist', () => {
      differenceHighlighter.calculateDifferences(
        mockCustomClassification,
        mockKoppenClassification,
      );

      const ui = differenceHighlighter.createToggleUI();
      const summary = ui.querySelector('.builder-panel__differences-summary');

      expect(summary).toBeTruthy();
      expect(summary.textContent).toContain('2 cells');
      expect(summary.textContent).toContain('66.7%');
    });

    it('should show top patterns in UI', () => {
      differenceHighlighter.calculateDifferences(
        mockCustomClassification,
        mockKoppenClassification,
      );

      const ui = differenceHighlighter.createToggleUI();
      const patterns = ui.querySelector('.builder-panel__differences-patterns');

      expect(patterns).toBeTruthy();

      const patternItems = ui.querySelectorAll('.builder-panel__differences-pattern-item');
      expect(patternItems.length).toBeGreaterThan(0);
    });

    it('should wire up checkbox change handler', () => {
      const ui = differenceHighlighter.createToggleUI();
      document.body.appendChild(ui);

      const eventSpy = vi.fn();
      document.addEventListener('koppen:differences-toggled', eventSpy);

      const checkbox = ui.querySelector('input[type="checkbox"]');
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));

      expect(eventSpy).toHaveBeenCalled();
      expect(differenceHighlighter.getState().enabled).toBe(true);

      document.body.removeChild(ui);
    });
  });

  describe('State Management', () => {
    it('should return current state', () => {
      differenceHighlighter.calculateDifferences(
        mockCustomClassification,
        mockKoppenClassification,
      );
      differenceHighlighter.toggle(true);

      const state = differenceHighlighter.getState();

      expect(state.enabled).toBe(true);
      expect(state.differences.length).toBe(2);
      expect(state.summary.changed).toBe(2);
    });

    it('should reset state on destroy', () => {
      differenceHighlighter.calculateDifferences(
        mockCustomClassification,
        mockKoppenClassification,
      );
      differenceHighlighter.toggle(true);

      differenceHighlighter.destroy();

      const state = differenceHighlighter.getState();
      expect(state.enabled).toBe(false);
      expect(state.differences.length).toBe(0);
      expect(state.summary).toBe(null);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently - 99th percentile < 200ms over 100 iterations', () => {
      const largeCustom = {
        features: Array(10000).fill(0).map((_, i) => ({
          properties: { climate_type: i % 2 === 0 ? 'Cfa' : 'Cfb' },
        })),
      };

      const largeKoppen = {
        features: Array(10000).fill(0).map(() => ({
          properties: { climate_type: 'Cfa' },
        })),
      };

      const durations = [];

      // Run 100 iterations
      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        differenceHighlighter.calculateDifferences(largeCustom, largeKoppen);
        const duration = performance.now() - startTime;
        durations.push(duration);
      }

      // Sort and get 99th percentile
      durations.sort((a, b) => a - b);
      const p99Index = Math.floor(durations.length * 0.99);
      const p99Duration = durations[p99Index];

      // 99% of calculations should complete in <200ms
      expect(p99Duration).toBeLessThan(200);
    });
  });
});
