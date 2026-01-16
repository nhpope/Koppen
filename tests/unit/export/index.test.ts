/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock logger
vi.mock('../../../src/utils/logger.js', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock png-generator
vi.mock('../../../src/export/png-generator.js', () => ({
  default: {
    isExporting: vi.fn().mockReturnValue(false),
    generatePNG: vi.fn().mockResolvedValue({
      blob: new Blob(['test'], { type: 'image/png' }),
      duration: 100,
    }),
  },
}));

// Mock utils
vi.mock('../../../src/export/utils.js', () => ({
  generateFilename: vi.fn((name) => `${name}_2024-01-01.png`),
  downloadBlob: vi.fn(),
}));

// Mock json-export
vi.mock('../../../src/export/json-export.js', () => ({
  exportJSON: vi.fn((classification) => ({
    json: JSON.stringify(classification),
    filename: `${classification.name}.json`,
    size: 100,
  })),
  importJSON: vi.fn((json) => JSON.parse(json)),
}));

import exportModule from '../../../src/export/index.js';
import pngGenerator from '../../../src/export/png-generator.js';
import { generateFilename, downloadBlob } from '../../../src/export/utils.js';
import { exportJSON, importJSON } from '../../../src/export/json-export.js';
import logger from '../../../src/utils/logger.js';

describe('Export Module (Story 6.1)', () => {
  let exportButton: HTMLButtonElement;
  let legendCheckbox: HTMLInputElement;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup DOM
    document.body.innerHTML = '';

    exportButton = document.createElement('button');
    exportButton.setAttribute('data-export-png', '');
    exportButton.textContent = 'Export';
    document.body.appendChild(exportButton);

    legendCheckbox = document.createElement('input');
    legendCheckbox.type = 'checkbox';
    legendCheckbox.setAttribute('data-export-legend', '');
    legendCheckbox.checked = true;
    document.body.appendChild(legendCheckbox);
  });

  afterEach(() => {
    exportModule.destroy();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize without error', () => {
      expect(() => exportModule.init()).not.toThrow();
    });

    it('should log initialization message', () => {
      exportModule.init();
      expect(logger.log).toHaveBeenCalledWith('[Koppen] Export module initialized');
    });

    it('should attach click listener to export button', () => {
      const addEventListenerSpy = vi.spyOn(exportButton, 'addEventListener');

      exportModule.init();

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should warn when export button not found', () => {
      document.body.innerHTML = ''; // Remove button
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      exportModule.init();

      expect(consoleWarnSpy).toHaveBeenCalledWith('[Koppen] Export button not found');
      consoleWarnSpy.mockRestore();
    });

    it('should enable button on map ready event', () => {
      exportModule.init();
      exportButton.disabled = true;

      document.dispatchEvent(new CustomEvent('koppen:map-ready'));

      expect(exportButton.disabled).toBe(false);
    });
  });

  describe('generateURL', () => {
    it('should generate URL with encoded state', () => {
      const state = { name: 'Test', rules: [] };
      const result = exportModule.generateURL(state);

      expect(result).toContain('?rules=');
      expect(result).toContain(window.location.origin);
    });

    it('should use base64 encoding for state', () => {
      const state = { name: 'Test Classification' };
      const result = exportModule.generateURL(state);

      // Extract encoded part
      const encoded = new URL(result).searchParams.get('rules');
      expect(encoded).toBeDefined();

      // Decode and verify
      const decoded = JSON.parse(atob(encoded!));
      expect(decoded.name).toBe('Test Classification');
    });

    it('should handle complex state objects', () => {
      const state = {
        name: 'Custom Köppen',
        thresholds: {
          temperature: { coldMonth: { value: 18 } },
          precipitation: { dry: { value: 60 } },
        },
        categories: [{ id: '1', name: 'Tropical' }],
      };

      const result = exportModule.generateURL(state);
      const encoded = new URL(result).searchParams.get('rules');
      const decoded = JSON.parse(atob(encoded!));

      expect(decoded.name).toBe('Custom Köppen');
      expect(decoded.thresholds.temperature.coldMonth.value).toBe(18);
    });
  });

  describe('parseURL', () => {
    it('should parse URL with rules parameter', () => {
      const state = { name: 'Test', value: 123 };
      const encoded = btoa(JSON.stringify(state));
      const url = `https://example.com?rules=${encoded}`;

      const result = exportModule.parseURL(url);

      expect(result).toEqual(state);
    });

    it('should return null for URL without rules parameter', () => {
      const url = 'https://example.com';

      const result = exportModule.parseURL(url);

      expect(result).toBeNull();
    });

    it('should return null for invalid base64', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const url = 'https://example.com?rules=invalid!!!base64';

      const result = exportModule.parseURL(url);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should return null for invalid JSON', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const encoded = btoa('not valid json {');
      const url = `https://example.com?rules=${encoded}`;

      const result = exportModule.parseURL(url);

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });

    it('should use window.location.href by default', () => {
      // This tests the default parameter
      const result = exportModule.parseURL();

      // No rules in default URL
      expect(result).toBeNull();
    });
  });

  describe('exportPNG', () => {
    it('should call pngGenerator.generatePNG', async () => {
      await exportModule.exportPNG({});

      expect(pngGenerator.generatePNG).toHaveBeenCalled();
    });

    it('should pass options to pngGenerator', async () => {
      const options = { includeLegend: false, includeWatermark: true };

      await exportModule.exportPNG(options);

      expect(pngGenerator.generatePNG).toHaveBeenCalledWith(options);
    });

    it('should return result from pngGenerator', async () => {
      const result = await exportModule.exportPNG({});

      expect(result).toHaveProperty('blob');
      expect(result).toHaveProperty('duration');
    });
  });

  describe('exportJSONFile', () => {
    it('should dispatch koppen:json-export-requested event', async () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:json-export-requested', eventListener);

      await exportModule.exportJSONFile({ name: 'Test' });

      expect(eventListener).toHaveBeenCalled();
      document.removeEventListener('koppen:json-export-requested', eventListener);
    });

    it('should call exportJSON from json-export module', async () => {
      await exportModule.exportJSONFile({ name: 'Test Classification' });

      expect(exportJSON).toHaveBeenCalledWith({ name: 'Test Classification' });
    });

    it('should call downloadBlob with generated JSON', async () => {
      await exportModule.exportJSONFile({ name: 'Test' });

      expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'Test.json');
    });

    it('should log export message', async () => {
      await exportModule.exportJSONFile({ name: 'Test' });

      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('[Koppen] Exported JSON'));
    });

    it('should dispatch koppen:json-export-completed event', async () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:json-export-completed', eventListener);

      await exportModule.exportJSONFile({ name: 'Test' });

      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail).toHaveProperty('filename');
      expect(eventListener.mock.calls[0][0].detail).toHaveProperty('size');

      document.removeEventListener('koppen:json-export-completed', eventListener);
    });

    it('should return json, filename, and size', async () => {
      const result = await exportModule.exportJSONFile({ name: 'Test' });

      expect(result).toHaveProperty('json');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('size');
    });

    it('should dispatch koppen:json-export-failed event on error', async () => {
      vi.mocked(exportJSON).mockImplementationOnce(() => {
        throw new Error('Export failed');
      });

      const eventListener = vi.fn();
      document.addEventListener('koppen:json-export-failed', eventListener);

      await expect(exportModule.exportJSONFile({ name: 'Test' })).rejects.toThrow('Export failed');

      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail.error).toBe('Export failed');

      document.removeEventListener('koppen:json-export-failed', eventListener);
    });
  });

  describe('importJSONFile', () => {
    function createMockFile(content: string): File {
      return new File([content], 'test.json', { type: 'application/json' });
    }

    it('should dispatch koppen:json-import-requested event', async () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:json-import-requested', eventListener);

      const file = createMockFile(JSON.stringify({ name: 'Test' }));

      // Start the import (don't await yet)
      const importPromise = exportModule.importJSONFile(file);

      expect(eventListener).toHaveBeenCalled();
      document.removeEventListener('koppen:json-import-requested', eventListener);

      // Wait for completion
      await importPromise;
    });

    it('should parse JSON file content', async () => {
      const data = { name: 'Imported Classification', version: '1.0' };
      const file = createMockFile(JSON.stringify(data));

      const result = await exportModule.importJSONFile(file);

      expect(importJSON).toHaveBeenCalled();
      expect(result).toEqual(data);
    });

    it('should log import message', async () => {
      const file = createMockFile(JSON.stringify({ name: 'Test Import' }));

      await exportModule.importJSONFile(file);

      expect(logger.log).toHaveBeenCalledWith('[Koppen] Imported classification:', 'Test Import');
    });

    it('should dispatch koppen:json-import-completed event', async () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:json-import-completed', eventListener);

      const file = createMockFile(JSON.stringify({ name: 'Test', version: '2.0' }));

      await exportModule.importJSONFile(file);

      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail).toHaveProperty('name', 'Test');
      expect(eventListener.mock.calls[0][0].detail).toHaveProperty('version', '2.0');

      document.removeEventListener('koppen:json-import-completed', eventListener);
    });

    it('should dispatch koppen:json-import-failed event on parse error', async () => {
      vi.mocked(importJSON).mockImplementationOnce(() => {
        throw new Error('Invalid JSON format');
      });

      const eventListener = vi.fn();
      document.addEventListener('koppen:json-import-failed', eventListener);

      const file = createMockFile(JSON.stringify({ name: 'Test' }));

      await expect(exportModule.importJSONFile(file)).rejects.toThrow('Invalid JSON format');

      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail.error).toBe('Invalid JSON format');

      document.removeEventListener('koppen:json-import-failed', eventListener);
    });
  });

  describe('destroy', () => {
    it('should log destroy message', () => {
      exportModule.destroy();

      expect(logger.log).toHaveBeenCalledWith('[Koppen] Export module destroyed');
    });

    it('should not throw when called multiple times', () => {
      expect(() => {
        exportModule.destroy();
        exportModule.destroy();
      }).not.toThrow();
    });

    it('should remove click listener from export button', () => {
      exportModule.init();
      const removeEventListenerSpy = vi.spyOn(exportButton, 'removeEventListener');

      exportModule.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('handleExport flow', () => {
    beforeEach(() => {
      exportModule.init();
    });

    it('should dispatch koppen:export-requested event on button click', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:export-requested', eventListener);

      exportButton.click();

      expect(eventListener).toHaveBeenCalled();
      document.removeEventListener('koppen:export-requested', eventListener);
    });

    it('should disable button during export', async () => {
      // Click and immediately check button state
      exportButton.click();

      // Button should be disabled during export
      expect(exportButton.disabled).toBe(true);
    });

    it('should add active class during export', async () => {
      exportButton.click();

      expect(exportButton.classList.contains('export-button--active')).toBe(true);
    });

    it('should not export if already exporting', () => {
      vi.mocked(pngGenerator.isExporting).mockReturnValueOnce(true);

      const eventListener = vi.fn();
      document.addEventListener('koppen:export-started', eventListener);

      exportButton.click();

      expect(eventListener).not.toHaveBeenCalled();
      document.removeEventListener('koppen:export-started', eventListener);
    });

    it('should dispatch koppen:export-started event', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:export-started', eventListener);

      exportButton.click();

      expect(eventListener).toHaveBeenCalled();
      document.removeEventListener('koppen:export-started', eventListener);
    });

    it('should use classification name from DOM for filename', async () => {
      const nameInput = document.createElement('input');
      nameInput.setAttribute('data-classification-name', '');
      nameInput.value = 'MyClassification';
      document.body.appendChild(nameInput);

      exportButton.click();

      // Wait for async export to complete
      await vi.waitFor(() => {
        expect(generateFilename).toHaveBeenCalledWith('MyClassification');
      });
    });

    it('should default to "koppen" for filename', async () => {
      exportButton.click();

      await vi.waitFor(() => {
        expect(generateFilename).toHaveBeenCalledWith('koppen');
      });
    });

    it('should use legend checkbox value for includeLegend option', async () => {
      legendCheckbox.checked = false;

      exportButton.click();

      await vi.waitFor(() => {
        expect(pngGenerator.generatePNG).toHaveBeenCalledWith(
          expect.objectContaining({ includeLegend: false }),
        );
      });
    });

    it('should dispatch koppen:export-completed event on success', async () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:export-completed', eventListener);

      exportButton.click();

      await vi.waitFor(() => {
        expect(eventListener).toHaveBeenCalled();
      });

      expect(eventListener.mock.calls[0][0].detail).toHaveProperty('filename');
      expect(eventListener.mock.calls[0][0].detail).toHaveProperty('duration');
      expect(eventListener.mock.calls[0][0].detail).toHaveProperty('size');

      document.removeEventListener('koppen:export-completed', eventListener);
    });

    it('should dispatch koppen:export-failed event on error', async () => {
      vi.mocked(pngGenerator.generatePNG).mockRejectedValueOnce(new Error('PNG generation failed'));

      const eventListener = vi.fn();
      document.addEventListener('koppen:export-failed', eventListener);

      exportButton.click();

      await vi.waitFor(() => {
        expect(eventListener).toHaveBeenCalled();
      });

      expect(eventListener.mock.calls[0][0].detail.error).toBe('PNG generation failed');

      document.removeEventListener('koppen:export-failed', eventListener);
    });

    it('should re-enable button after export completes', async () => {
      exportButton.click();

      await vi.waitFor(() => {
        expect(exportButton.disabled).toBe(false);
      });
    });

    it('should remove active class after export completes', async () => {
      exportButton.click();

      await vi.waitFor(() => {
        expect(exportButton.classList.contains('export-button--active')).toBe(false);
      });
    });
  });
});
