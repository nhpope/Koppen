/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Leaflet before importing the module
const mockMap = {
  setView: vi.fn().mockReturnThis(),
  setZoom: vi.fn().mockReturnThis(),
  getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
  getZoom: vi.fn(() => 2),
  remove: vi.fn(),
  removeLayer: vi.fn(),
  on: vi.fn(),
};

const mockGeoJSONLayer = {
  addTo: vi.fn().mockReturnThis(),
};

const mockTileLayer = {
  addTo: vi.fn().mockReturnThis(),
};

const mockZoomControl = {
  addTo: vi.fn().mockReturnThis(),
};

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => mockTileLayer),
    geoJSON: vi.fn(() => mockGeoJSONLayer),
    control: {
      zoom: vi.fn(() => mockZoomControl),
    },
  },
}));

// Mock constants
vi.mock('../../../src/utils/constants.js', () => ({
  CONSTANTS: {
    DEFAULT_CENTER: [0, 0],
    DEFAULT_ZOOM: 2,
    MIN_ZOOM: 1,
    MAX_ZOOM: 10,
  },
}));

// Import after mocks
import sideBySide from '../../../src/builder/side-by-side.js';
import L from 'leaflet';

describe('Side-by-Side View (Story 5.4)', () => {
  let testContainer: HTMLElement;
  let mockCustomClassification: any;
  let mockKoppenClassification: any;
  let originalInnerWidth: number;

  beforeEach(() => {
    vi.clearAllMocks();

    // Store original innerWidth
    originalInnerWidth = window.innerWidth;

    // Setup DOM
    document.body.innerHTML = '';
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    testContainer.className = 'koppen-app';
    document.body.appendChild(testContainer);

    const mapContainer = document.createElement('div');
    mapContainer.id = 'map';
    testContainer.appendChild(mapContainer);

    // Mock classifications
    mockCustomClassification = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { climate_type: 'Cfb' }, geometry: {} },
      ],
    };

    mockKoppenClassification = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { climate_type: 'Cfa' }, geometry: {} },
      ],
    };

    // Reset window width to desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    sideBySide.destroy();
    document.body.innerHTML = '';
    vi.clearAllMocks();

    // Restore original innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  describe('init()', () => {
    it('should initialize with classification data', () => {
      sideBySide.init(mockCustomClassification, mockKoppenClassification);

      const state = sideBySide.getState();
      expect(state.initialized).toBe(true);
      expect(state.customClassification).toEqual(mockCustomClassification);
      expect(state.koppenClassification).toEqual(mockKoppenClassification);
    });

    it('should warn on duplicate initialization', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      sideBySide.init(mockCustomClassification, mockKoppenClassification);
      sideBySide.init(mockCustomClassification, mockKoppenClassification);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Side-by-side module already initialized');
      consoleWarnSpy.mockRestore();
    });
  });

  describe('createUI()', () => {
    beforeEach(() => {
      sideBySide.init(mockCustomClassification, mockKoppenClassification);
    });

    it('should create toggle button', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle');
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn?.textContent).toBe('Side by Side');
      expect(toggleBtn?.getAttribute('aria-pressed')).toBe('false');
      expect(toggleBtn?.getAttribute('aria-label')).toBe('Toggle side-by-side comparison view');
    });

    it('should hide toggle button on mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLElement;
      expect(toggleBtn?.style.display).toBe('none');
    });

    it('should show toggle button on desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLElement;
      expect(toggleBtn?.style.display).not.toBe('none');
    });

    it('should return fallback container on error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Force an error by making document.createElement throw
      const originalCreateElement = document.createElement.bind(document);
      let callCount = 0;
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        callCount++;
        if (callCount === 2) {
          // Throw on second createElement (button)
          throw new Error('Test error');
        }
        return originalCreateElement(tagName);
      });

      const ui = sideBySide.createUI();

      expect(ui).toBeTruthy();
      expect(ui.className).toBe('builder-panel__side-by-side');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create side-by-side UI:', expect.any(Error));

      consoleErrorSpy.mockRestore();
      vi.mocked(document.createElement).mockRestore();
    });

    it('should toggle side-by-side on button click', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;

      // Click to enter
      toggleBtn.click();
      expect(sideBySide.getState().isActive).toBe(true);

      // Click to exit
      toggleBtn.click();
      expect(sideBySide.getState().isActive).toBe(false);
    });

    it('should handle window resize to mobile', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLElement;

      // Enter side-by-side first
      toggleBtn.click();
      expect(sideBySide.getState().isActive).toBe(true);

      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      window.dispatchEvent(new Event('resize'));

      expect(toggleBtn.style.display).toBe('none');
      expect(sideBySide.getState().isActive).toBe(false);
    });

    it('should handle window resize to desktop', () => {
      // Start on mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLElement;
      expect(toggleBtn.style.display).toBe('none');

      // Simulate resize to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      window.dispatchEvent(new Event('resize'));

      expect(toggleBtn.style.display).toBe('inline-block');
    });
  });

  describe('enterSideBySide()', () => {
    beforeEach(() => {
      sideBySide.init(mockCustomClassification, mockKoppenClassification);
    });

    it('should enter side-by-side mode', () => {
      sideBySide.enterSideBySide();

      expect(sideBySide.getState().isActive).toBe(true);
    });

    it('should fire koppen:side-by-side-entered event', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:side-by-side-entered', eventListener);

      sideBySide.enterSideBySide();

      expect(eventListener).toHaveBeenCalledTimes(1);
      expect(eventListener.mock.calls[0][0].detail).toEqual({
        customClassification: mockCustomClassification,
        koppenClassification: mockKoppenClassification,
      });

      document.removeEventListener('koppen:side-by-side-entered', eventListener);
    });

    it('should create split view container with two panels', () => {
      sideBySide.enterSideBySide();

      const splitContainer = document.querySelector('.side-by-side-container');
      expect(splitContainer).toBeTruthy();

      const panels = splitContainer?.querySelectorAll('.side-by-side-container__panel');
      expect(panels?.length).toBe(2);

      const leftPanel = splitContainer?.querySelector('.side-by-side-container__panel--left');
      const rightPanel = splitContainer?.querySelector('.side-by-side-container__panel--right');
      expect(leftPanel).toBeTruthy();
      expect(rightPanel).toBeTruthy();
    });

    it('should create map containers with correct labels', () => {
      sideBySide.enterSideBySide();

      const labels = document.querySelectorAll('.side-by-side-container__label');
      expect(labels.length).toBe(2);
      expect(labels[0].textContent).toBe('Custom Classification');
      expect(labels[1].textContent).toBe('Köppen Classification');

      const customMap = document.getElementById('map-custom');
      const koppenMap = document.getElementById('map-koppen');
      expect(customMap).toBeTruthy();
      expect(koppenMap).toBeTruthy();
    });

    it('should hide original map container', () => {
      const originalMap = document.getElementById('map') as HTMLElement;
      expect(originalMap.style.display).not.toBe('none');

      sideBySide.enterSideBySide();

      expect(originalMap.style.display).toBe('none');
    });

    it('should initialize both Leaflet map instances', () => {
      sideBySide.enterSideBySide();

      expect(L.map).toHaveBeenCalledWith('map-custom', expect.any(Object));
      expect(L.map).toHaveBeenCalledWith('map-koppen', expect.any(Object));
      expect(L.tileLayer).toHaveBeenCalledTimes(2);
      expect(L.geoJSON).toHaveBeenCalledTimes(2);
      expect(L.control.zoom).toHaveBeenCalledTimes(1);
    });

    it('should fire koppen:side-by-side-maps-ready event', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:side-by-side-maps-ready', eventListener);

      sideBySide.enterSideBySide();

      expect(eventListener).toHaveBeenCalledTimes(1);
      expect(eventListener.mock.calls[0][0].detail.customMap).toBeTruthy();
      expect(eventListener.mock.calls[0][0].detail.koppenMap).toBeTruthy();

      document.removeEventListener('koppen:side-by-side-maps-ready', eventListener);
    });

    it('should not enter if already active', () => {
      sideBySide.enterSideBySide();
      vi.clearAllMocks();

      sideBySide.enterSideBySide();

      expect(L.map).not.toHaveBeenCalled();
    });

    it('should not enter if missing classification data', () => {
      sideBySide.destroy();
      sideBySide.init(null, null);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      sideBySide.enterSideBySide();

      expect(consoleWarnSpy).toHaveBeenCalledWith('[Side-by-Side] Missing classification data');
      expect(sideBySide.getState().isActive).toBe(false);

      consoleWarnSpy.mockRestore();
    });

    it('should update toggle button state', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      sideBySide.enterSideBySide();

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('true');
      expect(toggleBtn.textContent).toBe('Exit Split View');
    });

    it('should handle missing toggle button gracefully', () => {
      // Don't append UI - no toggle button
      expect(() => sideBySide.enterSideBySide()).not.toThrow();
      expect(sideBySide.getState().isActive).toBe(true);
    });

    it('should add split container to koppen-app if present', () => {
      sideBySide.enterSideBySide();

      const appContainer = document.querySelector('.koppen-app');
      const splitContainer = appContainer?.querySelector('.side-by-side-container');
      expect(splitContainer).toBeTruthy();
    });

    it('should fall back to body if koppen-app not present', () => {
      // Remove koppen-app class
      testContainer.className = '';

      sideBySide.enterSideBySide();

      const splitContainer = document.querySelector('.side-by-side-container');
      expect(splitContainer).toBeTruthy();
    });
  });

  describe('exitSideBySide()', () => {
    beforeEach(() => {
      sideBySide.init(mockCustomClassification, mockKoppenClassification);
      sideBySide.enterSideBySide();
    });

    it('should exit side-by-side mode', () => {
      expect(sideBySide.getState().isActive).toBe(true);

      sideBySide.exitSideBySide();

      expect(sideBySide.getState().isActive).toBe(false);
    });

    it('should remove split view container', () => {
      expect(document.querySelector('.side-by-side-container')).toBeTruthy();

      sideBySide.exitSideBySide();

      expect(document.querySelector('.side-by-side-container')).toBeFalsy();
    });

    it('should fire koppen:side-by-side-exited event', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:side-by-side-exited', eventListener);

      sideBySide.exitSideBySide();

      expect(eventListener).toHaveBeenCalledTimes(1);

      document.removeEventListener('koppen:side-by-side-exited', eventListener);
    });

    it('should destroy map instances', () => {
      sideBySide.exitSideBySide();

      expect(mockMap.remove).toHaveBeenCalledTimes(2);
      expect(sideBySide.getState().customMap).toBe(null);
      expect(sideBySide.getState().koppenMap).toBe(null);
    });

    it('should not exit if not active', () => {
      sideBySide.exitSideBySide();
      vi.clearAllMocks();

      sideBySide.exitSideBySide();

      expect(mockMap.remove).not.toHaveBeenCalled();
    });

    it('should update toggle button state', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      // Re-enter to get button state correct
      sideBySide.exitSideBySide();
      sideBySide.enterSideBySide();

      sideBySide.exitSideBySide();

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('false');
      expect(toggleBtn.textContent).toBe('Side by Side');
    });

    it('should handle missing toggle button gracefully', () => {
      // Don't append UI - no toggle button
      expect(() => sideBySide.exitSideBySide()).not.toThrow();
      expect(sideBySide.getState().isActive).toBe(false);
    });

    it('should clear layer references', () => {
      sideBySide.exitSideBySide();

      expect(sideBySide.getState().customLayer).toBe(null);
      expect(sideBySide.getState().koppenLayer).toBe(null);
    });
  });

  describe('Map Synchronization', () => {
    beforeEach(() => {
      sideBySide.init(mockCustomClassification, mockKoppenClassification);
      sideBySide.enterSideBySide();
    });

    it('should register move/zoom listeners on both maps', () => {
      // mockMap.on should have been called for move, zoom, click events
      expect(mockMap.on).toHaveBeenCalled();

      const onCalls = mockMap.on.mock.calls;
      const eventTypes = onCalls.map((call: any[]) => call[0]);

      expect(eventTypes).toContain('move');
      expect(eventTypes).toContain('zoom');
      expect(eventTypes).toContain('click');
    });

    it('should sync custom map move to koppen map', () => {
      // Get the move handler for customMap
      const onCalls = mockMap.on.mock.calls;
      const moveHandler = onCalls.find((call: any[]) => call[0] === 'move')?.[1];

      if (moveHandler) {
        // Call the handler
        moveHandler();
        // The setView should be called (though we're using the same mock for both maps)
        expect(mockMap.setView).toHaveBeenCalled();
      }
    });

    it('should sync custom map zoom to koppen map', () => {
      const onCalls = mockMap.on.mock.calls;
      const zoomHandler = onCalls.find((call: any[]) => call[0] === 'zoom')?.[1];

      if (zoomHandler) {
        zoomHandler();
        expect(mockMap.setZoom).toHaveBeenCalled();
      }
    });

    it('should dispatch cell-clicked event on map click', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:cell-clicked', eventListener);

      const onCalls = mockMap.on.mock.calls;
      const clickHandler = onCalls.find((call: any[]) => call[0] === 'click')?.[1];

      if (clickHandler) {
        clickHandler({ latlng: { lat: 10, lng: 20 } });
        expect(eventListener).toHaveBeenCalled();
        expect(eventListener.mock.calls[0][0].detail.latlng).toEqual({ lat: 10, lng: 20 });
      }

      document.removeEventListener('koppen:cell-clicked', eventListener);
    });
  });

  describe('Feature Styling', () => {
    beforeEach(() => {
      sideBySide.init(mockCustomClassification, mockKoppenClassification);
    });

    it('should apply correct style to GeoJSON features', () => {
      sideBySide.enterSideBySide();

      // Get the style function passed to L.geoJSON
      const geoJSONCalls = vi.mocked(L.geoJSON).mock.calls;
      expect(geoJSONCalls.length).toBeGreaterThan(0);

      const styleOption = geoJSONCalls[0][1]?.style;
      expect(styleOption).toBeDefined();

      if (typeof styleOption === 'function') {
        const feature = { properties: { climate_type: 'Af' } };
        const style = styleOption(feature);

        expect(style.fillColor).toBe('#0000FF');
        expect(style.fillOpacity).toBe(0.7);
        expect(style.color).toBe('#ffffff');
        expect(style.weight).toBe(0.5);
      }
    });

    it('should use fallback color for unknown climate types', () => {
      sideBySide.enterSideBySide();

      const geoJSONCalls = vi.mocked(L.geoJSON).mock.calls;
      const styleOption = geoJSONCalls[0][1]?.style;

      if (typeof styleOption === 'function') {
        const feature = { properties: { climate_type: 'UNKNOWN' } };
        const style = styleOption(feature);

        expect(style.fillColor).toBe('#CCCCCC');
      }
    });

    it('should handle missing climate_type property', () => {
      sideBySide.enterSideBySide();

      const geoJSONCalls = vi.mocked(L.geoJSON).mock.calls;
      const styleOption = geoJSONCalls[0][1]?.style;

      if (typeof styleOption === 'function') {
        const feature = { properties: {} };
        const style = styleOption(feature);

        expect(style.fillColor).toBe('#CCCCCC');
      }
    });

    it('should handle missing properties object', () => {
      sideBySide.enterSideBySide();

      const geoJSONCalls = vi.mocked(L.geoJSON).mock.calls;
      const styleOption = geoJSONCalls[0][1]?.style;

      if (typeof styleOption === 'function') {
        const feature = {};
        const style = styleOption(feature);

        expect(style.fillColor).toBe('#CCCCCC');
      }
    });
  });

  describe('updateClassifications()', () => {
    beforeEach(() => {
      sideBySide.init(mockCustomClassification, mockKoppenClassification);
    });

    it('should update classifications in state', () => {
      const newCustom = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: { climate_type: 'Dfc' }, geometry: {} }],
      };

      sideBySide.updateClassifications(newCustom, mockKoppenClassification);

      expect(sideBySide.getState().customClassification).toEqual(newCustom);
    });

    it('should not update layers when not active', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:side-by-side-updated', eventListener);

      const newCustom = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: { climate_type: 'Dfc' }, geometry: {} }],
      };

      sideBySide.updateClassifications(newCustom, mockKoppenClassification);

      expect(eventListener).not.toHaveBeenCalled();

      document.removeEventListener('koppen:side-by-side-updated', eventListener);
    });

    it('should update layers when active', () => {
      sideBySide.enterSideBySide();
      vi.clearAllMocks();

      const eventListener = vi.fn();
      document.addEventListener('koppen:side-by-side-updated', eventListener);

      const newCustom = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: { climate_type: 'Dfc' }, geometry: {} }],
      };

      sideBySide.updateClassifications(newCustom, mockKoppenClassification);

      expect(eventListener).toHaveBeenCalledTimes(1);
      expect(mockMap.removeLayer).toHaveBeenCalled();
      expect(L.geoJSON).toHaveBeenCalled();

      document.removeEventListener('koppen:side-by-side-updated', eventListener);
    });
  });

  describe('destroy()', () => {
    beforeEach(() => {
      sideBySide.init(mockCustomClassification, mockKoppenClassification);
    });

    it('should exit side-by-side mode if active', () => {
      sideBySide.enterSideBySide();
      expect(sideBySide.getState().isActive).toBe(true);

      sideBySide.destroy();

      expect(sideBySide.getState().isActive).toBe(false);
    });

    it('should reset all state', () => {
      sideBySide.enterSideBySide();

      sideBySide.destroy();

      const state = sideBySide.getState();
      expect(state.isActive).toBe(false);
      expect(state.customMap).toBe(null);
      expect(state.koppenMap).toBe(null);
      expect(state.customLayer).toBe(null);
      expect(state.koppenLayer).toBe(null);
      expect(state.customClassification).toBe(null);
      expect(state.koppenClassification).toBe(null);
      expect(state.syncingPosition).toBe(false);
      expect(state.initialized).toBe(false);
    });

    it('should not throw if not active', () => {
      expect(() => sideBySide.destroy()).not.toThrow();
    });

    it('should clear split container from DOM', () => {
      sideBySide.enterSideBySide();
      expect(document.querySelector('.side-by-side-container')).toBeTruthy();

      sideBySide.destroy();

      expect(document.querySelector('.side-by-side-container')).toBeFalsy();
    });
  });

  describe('getState()', () => {
    it('should return current state', () => {
      const state = sideBySide.getState();

      expect(state).toHaveProperty('isActive');
      expect(state).toHaveProperty('customMap');
      expect(state).toHaveProperty('koppenMap');
      expect(state).toHaveProperty('customClassification');
      expect(state).toHaveProperty('koppenClassification');
    });
  });
});
