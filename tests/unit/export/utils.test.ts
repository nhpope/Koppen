/**
 * Unit Tests: Export Utils - Story 6.1
 * Tests for utils.js module (filename generation, blob download)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateFilename, downloadBlob } from '../../../src/export/utils.js';
import { JSDOM } from 'jsdom';

describe('Export Utils', () => {
  describe('generateFilename', () => {
    it('should generate filename with default name', () => {
      const filename = generateFilename();
      expect(filename).toMatch(/^koppen-koppen-\d{4}-\d{2}-\d{2}\.png$/);
    });

    it('should generate filename with custom name', () => {
      const filename = generateFilename('My Custom Classification');
      expect(filename).toMatch(/^koppen-my-custom-classification-\d{4}-\d{2}-\d{2}\.png$/);
    });

    it('should sanitize special characters', () => {
      const filename = generateFilename('Test@#$%Name!!!');
      expect(filename).toMatch(/^koppen-test-name-\d{4}-\d{2}-\d{2}\.png$/);
    });

    it('should handle spaces and hyphens', () => {
      const filename = generateFilename('Test - Name With Spaces');
      expect(filename).toMatch(/^koppen-test-name-with-spaces-\d{4}-\d{2}-\d{2}\.png$/);
    });

    it('should trim leading/trailing hyphens', () => {
      const filename = generateFilename('---Test---');
      expect(filename).toMatch(/^koppen-test-\d{4}-\d{2}-\d{2}\.png$/);
    });

    it('should include current date in YYYY-MM-DD format', () => {
      const filename = generateFilename('test');
      const today = new Date().toISOString().split('T')[0];
      expect(filename).toBe(`koppen-test-${today}.png`);
    });

  });

  describe('downloadBlob', () => {
    let dom: JSDOM;
    let document: Document;

    beforeEach(() => {
      // Set up DOM
      dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
      document = dom.window.document;
      global.document = document as unknown as Document;
      global.window = dom.window as unknown as Window & typeof globalThis;

      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create anchor element and trigger download', () => {
      const blob = new Blob(['test'], { type: 'image/png' });
      const filename = 'test.png';

      // Spy on appendChild to verify anchor was created
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');

      downloadBlob(blob, filename);

      // Verify anchor was appended (even if immediately removed)
      expect(appendChildSpy).toHaveBeenCalled();
      const anchor = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
      expect(anchor.tagName).toBe('A');
    });

    it('should set correct download attributes', () => {
      const blob = new Blob(['test'], { type: 'image/png' });
      const filename = 'test-file.png';

      // Spy on appendChild to capture the anchor
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');

      downloadBlob(blob, filename);

      // Get the anchor element that was appended
      const anchor = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;

      expect(anchor.download).toBe(filename);
      expect(anchor.href).toBe('blob:mock-url');
      expect(anchor.style.display).toBe('none');
    });

    it('should clean up anchor after download', () => {
      const blob = new Blob(['test'], { type: 'image/png' });
      const filename = 'test.png';

      downloadBlob(blob, filename);

      // Anchor should be removed from DOM
      const anchors = document.getElementsByTagName('a');
      expect(anchors.length).toBe(0);
    });
  });
});
