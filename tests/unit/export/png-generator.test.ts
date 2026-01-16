/**
 * Unit Tests: PNG Generator - Story 6.1
 * Tests for png-generator.js module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock html2canvas at module level (hoisted)
const mockCanvasInstance = {
  width: 800,
  height: 600,
  getContext: vi.fn(),
  toBlob: vi.fn(),
};

vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve(mockCanvasInstance)),
}));

describe('PNG Generator', () => {
  let dom: JSDOM;
  let document: Document;
  let mockContext: any;

  beforeEach(() => {
    // Set up DOM
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div class="map-container" style="width: 800px; height: 600px;">
            <div class="legend"></div>
          </div>
        </body>
      </html>
    `);
    document = dom.window.document;
    global.document = document as unknown as Document;
    global.window = dom.window as unknown as Window & typeof globalThis;

    // Mock canvas context
    mockContext = {
      save: vi.fn(),
      restore: vi.fn(),
      fillText: vi.fn(),
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: '',
    };

    // Reset and configure mockCanvas for this test
    mockCanvasInstance.width = 800;
    mockCanvasInstance.height = 600;
    mockCanvasInstance.getContext = vi.fn(() => mockContext);
    mockCanvasInstance.toBlob = vi.fn((callback) => {
      // Simulate async blob creation
      setTimeout(() => callback(new Blob(['fake-png-data'], { type: 'image/png' })), 10);
    });

    // Mock performance.now
    global.performance = {
      now: vi.fn(() => Date.now()),
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DOM Setup', () => {
    it('should have map container in DOM', () => {
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeTruthy();
    });

    it('should have legend in DOM', () => {
      const legend = document.querySelector('.legend');
      expect(legend).toBeTruthy();
    });
  });

  describe('PNG Generation', () => {
    it('should generate PNG blob with correct properties', async () => {
      const html2canvas = (await import('html2canvas')).default;
      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      const result = await pngGenerator.generatePNG();

      expect(result).toBeTruthy();
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.type).toBe('image/png');
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should throw error if map container not found', async () => {
      // Remove map container
      document.querySelector('.map-container')?.remove();

      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      await expect(pngGenerator.generatePNG()).rejects.toThrow('Map container not found');
    });

    it('should prevent concurrent exports', async () => {
      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      const export1 = pngGenerator.generatePNG();

      // Try to start second export while first is running
      await expect(pngGenerator.generatePNG()).rejects.toThrow('Export already in progress');

      // Wait for first export to complete
      await export1;
    });

    it('should track export duration', async () => {
      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      const result = await pngGenerator.generatePNG();

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.duration).toBe('number');
    });
  });

  describe('Legend Toggle', () => {
    it('should hide legend when includeLegend is false', async () => {
      const html2canvas = (await import('html2canvas')).default;
      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      const legend = document.querySelector('.legend') as HTMLElement;
      expect(legend).toBeTruthy();

      await pngGenerator.generatePNG({ includeLegend: false });

      // Legend should be restored after capture
      expect(legend.style.display).not.toBe('none');
    });

    it('should include legend when includeLegend is true', async () => {
      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      const legend = document.querySelector('.legend') as HTMLElement;
      const originalDisplay = legend.style.display;

      await pngGenerator.generatePNG({ includeLegend: true });

      // Legend visibility should be unchanged
      expect(legend.style.display).toBe(originalDisplay);
    });
  });

  describe('Watermark', () => {
    it('should add watermark when includeWatermark is true', async () => {
      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      await pngGenerator.generatePNG({ includeWatermark: true });

      // Verify canvas context methods were called for watermark
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should skip watermark when includeWatermark is false', async () => {
      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      mockContext.fillText.mockClear();

      await pngGenerator.generatePNG({ includeWatermark: false });

      expect(mockContext.fillText).not.toHaveBeenCalled();
    });

  });

  describe('Export State', () => {
    it('should return false for isExporting when not exporting', async () => {
      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;
      expect(pngGenerator.isExporting()).toBe(false);
    });

    it('should return true for isExporting during export', async () => {
      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      const exportPromise = pngGenerator.generatePNG();

      // Should be true while export is in progress
      expect(pngGenerator.isExporting()).toBe(true);

      await exportPromise;

      // Should be false after export completes
      expect(pngGenerator.isExporting()).toBe(false);
    });
  });

  describe('Canvas Options', () => {
    it('should use custom scale when provided', async () => {
      const html2canvas = (await import('html2canvas')).default;
      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      await pngGenerator.generatePNG({ scale: 2 });

      // Verify html2canvas was called with scale option
      expect(html2canvas).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ scale: 2 }),
      );
    });

    it('should use device pixel ratio by default', async () => {
      const html2canvas = (await import('html2canvas')).default;
      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      global.window.devicePixelRatio = 2;

      await pngGenerator.generatePNG();

      expect(html2canvas).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ scale: 2 }),
      );
    });

    it('should use custom quality when provided', async () => {
      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      await pngGenerator.generatePNG({ quality: 0.8 });

      // Verify toBlob was called with quality parameter
      expect(mockCanvasInstance.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/png',
        0.8,
      );
    });
  });

  describe('Performance', () => {
    it('should complete export in reasonable time', async () => {
      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      const start = Date.now();
      await pngGenerator.generatePNG();
      const duration = Date.now() - start;

      // Should complete in < 1 second in test environment (mocked)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle canvas toBlob failure gracefully', async () => {
      // Mock toBlob to call callback with null
      mockCanvasInstance.toBlob = vi.fn((callback) => {
        setTimeout(() => callback(null), 10);
      });

      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      const result = await pngGenerator.generatePNG();

      // Should still return result even if blob is null
      expect(result.blob).toBeNull();
    });

    it('should reset exporting flag on error', async () => {
      // Remove map container to trigger error
      document.querySelector('.map-container')?.remove();

      const pngGenerator = (await import('../../../src/export/png-generator.js')).default;

      await expect(pngGenerator.generatePNG()).rejects.toThrow();

      // Exporting flag should be reset
      expect(pngGenerator.isExporting()).toBe(false);
    });
  });
});
