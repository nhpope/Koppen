/**
 * Unit Tests: URL State Management - Story 6.4
 * Tests for url-state.js module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('URL State Management - Story 6.4', () => {
  beforeEach(() => {
    // Reset URL before each test
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/');
    }
  });

  describe('encodeState / decodeState (deprecated functions)', () => {
    it('should encode state to base64', async () => {
      const { encodeState } = await import('../../../src/utils/url-state.js');
      const state = { test: 'value', number: 123 };
      const encoded = encodeState(state);

      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
    });

    it('should decode base64 back to state', async () => {
      const { encodeState, decodeState } = await import('../../../src/utils/url-state.js');
      const original = { test: 'value', number: 123 };
      const encoded = encodeState(original);
      const decoded = decodeState(encoded);

      expect(decoded).toEqual(original);
    });

    it('should return empty string on encode error', async () => {
      const { encodeState } = await import('../../../src/utils/url-state.js');
      const circular: any = {};
      circular.self = circular;

      const encoded = encodeState(circular);
      expect(encoded).toBe('');
    });

    it('should return null on decode error', async () => {
      const { decodeState } = await import('../../../src/utils/url-state.js');
      const decoded = decodeState('INVALID_BASE64!!!');
      expect(decoded).toBeNull();
    });
  });

  describe('getStateFromURL', () => {
    it('should return null when no URL parameters present', async () => {
      const { getStateFromURL } = await import('../../../src/utils/url-state.js');
      const state = getStateFromURL();
      expect(state).toBeNull();
    });

    it('should handle legacy URL format with rules parameter', async () => {
      // Simulate legacy URL with base64 encoded rules
      const testState = { tropical: { t_min: { value: 18 } } };
      const { encodeState } = await import('../../../src/utils/url-state.js');
      const encoded = encodeState(testState);

      // Mock window.location.search
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: `?rules=${encoded}&name=TestClassification`,
        },
        writable: true,
      });

      // Re-import to get fresh module
      vi.resetModules();
      const { getStateFromURL } = await import('../../../src/utils/url-state.js');
      const state = getStateFromURL();

      expect(state).toBeTruthy();
      expect(state?.name).toBe('TestClassification');
      expect(state?.thresholds).toEqual(testState);
      expect(state?.metadata?.source).toBe('url-legacy');
    });

    it('should parse view parameter from URL', async () => {
      const { encodeState } = await import('../../../src/utils/url-state.js');
      const testState = { test: 'value' };
      const encoded = encodeState(testState);

      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: `?rules=${encoded}&view=45.5,-122.6,10`,
        },
        writable: true,
      });

      vi.resetModules();
      const { getStateFromURL } = await import('../../../src/utils/url-state.js');
      const state = getStateFromURL();

      expect(state?.view).toBeDefined();
      expect(state?.view?.lat).toBe(45.5);
      expect(state?.view?.lng).toBe(-122.6);
      expect(state?.view?.zoom).toBe(10);
    });

    it('should ignore malformed view parameter', async () => {
      const { encodeState } = await import('../../../src/utils/url-state.js');
      const testState = { test: 'value' };
      const encoded = encodeState(testState);

      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: `?rules=${encoded}&view=invalid`,
        },
        writable: true,
      });

      vi.resetModules();
      const { getStateFromURL } = await import('../../../src/utils/url-state.js');
      const state = getStateFromURL();

      expect(state).toBeTruthy();
      expect(state?.view).toBeUndefined();
    });

    it('should default to "Shared Classification" when name is missing', async () => {
      const { encodeState } = await import('../../../src/utils/url-state.js');
      const testState = { test: 'value' };
      const encoded = encodeState(testState);

      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: `?rules=${encoded}`,
        },
        writable: true,
      });

      vi.resetModules();
      const { getStateFromURL } = await import('../../../src/utils/url-state.js');
      const state = getStateFromURL();

      expect(state?.name).toBe('Shared Classification');
    });
  });

  describe('updateURL', () => {
    it('should update URL with state parameters', async () => {
      const { updateURL } = await import('../../../src/utils/url-state.js');
      const pushSpy = vi.spyOn(window.history, 'pushState');

      const state = {
        name: 'Test Classification',
        thresholds: { tropical: { t_min: { value: 18 } } },
      };

      updateURL(state, false);

      expect(pushSpy).toHaveBeenCalled();
      const callArgs = pushSpy.mock.calls[0];
      expect(callArgs[2]).toContain('rules=');
      expect(callArgs[2]).toContain('name=');
    });

    it('should include view parameter when provided', async () => {
      const { updateURL } = await import('../../../src/utils/url-state.js');
      const pushSpy = vi.spyOn(window.history, 'pushState');

      const state = {
        name: 'Test',
        thresholds: {},
        view: { lat: 45.5, lng: -122.6, zoom: 10 },
      };

      updateURL(state, false);

      expect(pushSpy).toHaveBeenCalled();
      const url = pushSpy.mock.calls[0][2] as string;
      // View parameter might be URL encoded (commas become %2C)
      expect(url).toMatch(/view=45\.5(%2C|,)-122\.6(%2C|,)10/);
    });

    it('should use replaceState when replace=true', async () => {
      const { updateURL } = await import('../../../src/utils/url-state.js');
      const replaceSpy = vi.spyOn(window.history, 'replaceState');

      const state = { name: 'Test', thresholds: {} };
      updateURL(state, true);

      expect(replaceSpy).toHaveBeenCalled();
    });
  });

  describe('clearURLState', () => {
    it('should remove all URL parameters', async () => {
      const { clearURLState } = await import('../../../src/utils/url-state.js');
      const replaceSpy = vi.spyOn(window.history, 'replaceState');

      clearURLState();

      expect(replaceSpy).toHaveBeenCalledWith({}, '', window.location.pathname);
    });
  });
});
