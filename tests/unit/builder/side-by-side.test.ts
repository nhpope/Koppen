/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Leaflet
const mockLeaflet = {
  map: vi.fn((id, options) => ({
    id,
    options,
    setView: vi.fn(),
    setZoom: vi.fn(),
    getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
    getZoom: vi.fn(() => 2),
    remove: vi.fn(),
    removeLayer: vi.fn(),
    on: vi.fn(),
  })),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn(),
  })),
  geoJSON: vi.fn(() => ({
    addTo: vi.fn(),
  })),
  control: {
    zoom: vi.fn(() => ({
      addTo: vi.fn(),
    })),
  },
};

vi.mock('leaflet', () => ({
  default: mockLeaflet,
}));

// Mock side-by-side module for testing
const sideBySide = {
  state: {
    isActive: false,
    customMap: null,
    koppenMap: null,
    customClassification: null,
    koppenClassification: null,
  },

  init(customClassification, koppenClassification) {
    this.state.customClassification = customClassification;
    this.state.koppenClassification = koppenClassification;
  },

  createUI() {
    const container = document.createElement('div');
    container.className = 'builder-panel__side-by-side';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'builder-panel__side-by-side-toggle';
    toggleBtn.textContent = 'Side by Side';
    toggleBtn.setAttribute('aria-pressed', 'false');

    // Hide on mobile
    if (window.innerWidth < 768) {
      toggleBtn.style.display = 'none';
    }

    toggleBtn.addEventListener('click', () => {
      if (this.state.isActive) {
        this.exitSideBySide();
      } else {
        this.enterSideBySide();
      }
    });

    container.appendChild(toggleBtn);

    return container;
  },

  enterSideBySide() {
    if (this.state.isActive) return;
    if (!this.state.customClassification || !this.state.koppenClassification) {
      console.warn('[Side-by-Side] Missing classification data');
      return;
    }

    this.state.isActive = true;

    document.dispatchEvent(
      new CustomEvent('koppen:side-by-side-entered', {
        detail: {
          customClassification: this.state.customClassification,
          koppenClassification: this.state.koppenClassification,
        },
      })
    );

    this.createSplitView();
    this.initializeMaps();

    const toggleBtn = document.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', 'true');
      toggleBtn.textContent = 'Exit Split View';
    }
  },

  exitSideBySide() {
    if (!this.state.isActive) return;

    this.state.isActive = false;

    if (this.state.customMap) {
      this.state.customMap = null;
    }
    if (this.state.koppenMap) {
      this.state.koppenMap = null;
    }

    const splitContainer = document.querySelector('.side-by-side-container');
    if (splitContainer) {
      splitContainer.remove();
    }

    const originalMapContainer = document.getElementById('map');
    if (originalMapContainer) {
      originalMapContainer.style.display = 'block';
    }

    document.dispatchEvent(new CustomEvent('koppen:side-by-side-exited'));

    const toggleBtn = document.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', 'false');
      toggleBtn.textContent = 'Side by Side';
    }
  },

  createSplitView() {
    const originalMapContainer = document.getElementById('map');
    if (originalMapContainer) {
      originalMapContainer.style.display = 'none';
    }

    const splitContainer = document.createElement('div');
    splitContainer.className = 'side-by-side-container';

    const leftPanel = document.createElement('div');
    leftPanel.className = 'side-by-side-container__panel side-by-side-container__panel--left';

    const leftLabel = document.createElement('div');
    leftLabel.className = 'side-by-side-container__label';
    leftLabel.textContent = 'Custom Classification';

    const leftMap = document.createElement('div');
    leftMap.id = 'map-custom';
    leftMap.className = 'side-by-side-container__map';

    leftPanel.appendChild(leftLabel);
    leftPanel.appendChild(leftMap);

    const rightPanel = document.createElement('div');
    rightPanel.className = 'side-by-side-container__panel side-by-side-container__panel--right';

    const rightLabel = document.createElement('div');
    rightLabel.className = 'side-by-side-container__label';
    rightLabel.textContent = 'Köppen Classification';

    const rightMap = document.createElement('div');
    rightMap.id = 'map-koppen';
    rightMap.className = 'side-by-side-container__map';

    rightPanel.appendChild(rightLabel);
    rightPanel.appendChild(rightMap);

    splitContainer.appendChild(leftPanel);
    splitContainer.appendChild(rightPanel);

    document.body.appendChild(splitContainer);
  },

  initializeMaps() {
    this.state.customMap = mockLeaflet.map('map-custom', {});
    this.state.koppenMap = mockLeaflet.map('map-koppen', {});

    document.dispatchEvent(
      new CustomEvent('koppen:side-by-side-maps-ready', {
        detail: {
          customMap: this.state.customMap,
          koppenMap: this.state.koppenMap,
        },
      })
    );
  },

  updateClassifications(customClassification, koppenClassification) {
    this.state.customClassification = customClassification;
    this.state.koppenClassification = koppenClassification;

    if (!this.state.isActive) return;

    document.dispatchEvent(new CustomEvent('koppen:side-by-side-updated'));
  },

  destroy() {
    if (this.state.isActive) {
      this.exitSideBySide();
    }

    this.state = {
      isActive: false,
      customMap: null,
      koppenMap: null,
      customClassification: null,
      koppenClassification: null,
    };
  },

  getState() {
    return this.state;
  },
};

describe('Side-by-Side View (Story 5.4)', () => {
  let testContainer: HTMLElement;
  let mockCustomClassification: any;
  let mockKoppenClassification: any;

  beforeEach(() => {
    // Setup DOM
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
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

    sideBySide.init(mockCustomClassification, mockKoppenClassification);
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    sideBySide.destroy();
    vi.clearAllMocks();
  });

  describe('UI Creation', () => {
    it('should create toggle button', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle');
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn?.textContent).toBe('Side by Side');
      expect(toggleBtn?.getAttribute('aria-pressed')).toBe('false');
    });

    it('should hide toggle button on mobile viewport', () => {
      // Mock innerWidth to simulate mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLElement;
      expect(toggleBtn?.style.display).toBe('none');

      // Restore
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
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
  });

  describe('Enter Side-by-Side Mode', () => {
    it('should enter side-by-side mode when toggle clicked', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;

      toggleBtn.click();

      expect(sideBySide.getState().isActive).toBe(true);
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('true');
      expect(toggleBtn.textContent).toBe('Exit Split View');
    });

    it('should fire koppen:side-by-side-entered event', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const eventListener = vi.fn();
      document.addEventListener('koppen:side-by-side-entered', eventListener);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;
      toggleBtn.click();

      expect(eventListener).toHaveBeenCalledTimes(1);
      expect(eventListener.mock.calls[0][0].detail).toEqual({
        customClassification: mockCustomClassification,
        koppenClassification: mockKoppenClassification,
      });
    });

    it('should create split view container with two panels', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;
      toggleBtn.click();

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
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;
      toggleBtn.click();

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
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const originalMap = document.getElementById('map') as HTMLElement;
      expect(originalMap.style.display).not.toBe('none');

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;
      toggleBtn.click();

      expect(originalMap.style.display).toBe('none');
    });

    it('should initialize both Leaflet map instances', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;
      toggleBtn.click();

      expect(sideBySide.getState().customMap).toBeTruthy();
      expect(sideBySide.getState().koppenMap).toBeTruthy();
      expect(mockLeaflet.map).toHaveBeenCalledWith('map-custom', expect.any(Object));
      expect(mockLeaflet.map).toHaveBeenCalledWith('map-koppen', expect.any(Object));
    });

    it('should fire koppen:side-by-side-maps-ready event', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const eventListener = vi.fn();
      document.addEventListener('koppen:side-by-side-maps-ready', eventListener);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;
      toggleBtn.click();

      expect(eventListener).toHaveBeenCalledTimes(1);
      expect(eventListener.mock.calls[0][0].detail.customMap).toBeTruthy();
      expect(eventListener.mock.calls[0][0].detail.koppenMap).toBeTruthy();
    });

    it('should not enter if missing classification data', () => {
      sideBySide.init(null, null);

      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;
      toggleBtn.click();

      expect(consoleWarnSpy).toHaveBeenCalledWith('[Side-by-Side] Missing classification data');
      expect(sideBySide.getState().isActive).toBe(false);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Exit Side-by-Side Mode', () => {
    it('should exit side-by-side mode when toggle clicked again', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;

      toggleBtn.click(); // Enter
      expect(sideBySide.getState().isActive).toBe(true);

      toggleBtn.click(); // Exit
      expect(sideBySide.getState().isActive).toBe(false);
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('false');
      expect(toggleBtn.textContent).toBe('Side by Side');
    });

    it('should remove split view container', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;

      toggleBtn.click(); // Enter
      expect(document.querySelector('.side-by-side-container')).toBeTruthy();

      toggleBtn.click(); // Exit
      expect(document.querySelector('.side-by-side-container')).toBeFalsy();
    });

    it('should restore original map container', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const originalMap = document.getElementById('map') as HTMLElement;
      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;

      toggleBtn.click(); // Enter
      expect(originalMap.style.display).toBe('none');

      toggleBtn.click(); // Exit
      expect(originalMap.style.display).toBe('block');
    });

    it('should fire koppen:side-by-side-exited event', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;

      const eventListener = vi.fn();
      document.addEventListener('koppen:side-by-side-exited', eventListener);

      toggleBtn.click(); // Enter
      toggleBtn.click(); // Exit

      expect(eventListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Classification Updates', () => {
    it('should update classifications when updateClassifications called', () => {
      const newCustom = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: { climate_type: 'Dfc' }, geometry: {} }],
      };

      sideBySide.updateClassifications(newCustom, mockKoppenClassification);

      expect(sideBySide.getState().customClassification).toEqual(newCustom);
    });

    it('should fire koppen:side-by-side-updated event when active', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;
      toggleBtn.click(); // Enter

      const eventListener = vi.fn();
      document.addEventListener('koppen:side-by-side-updated', eventListener);

      const newCustom = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: { climate_type: 'Dfc' }, geometry: {} }],
      };

      sideBySide.updateClassifications(newCustom, mockKoppenClassification);

      expect(eventListener).toHaveBeenCalledTimes(1);
    });

    it('should not fire event when not active', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:side-by-side-updated', eventListener);

      const newCustom = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: { climate_type: 'Dfc' }, geometry: {} }],
      };

      sideBySide.updateClassifications(newCustom, mockKoppenClassification);

      expect(eventListener).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should exit side-by-side mode on destroy', () => {
      const ui = sideBySide.createUI();
      testContainer.appendChild(ui);

      const toggleBtn = testContainer.querySelector('.builder-panel__side-by-side-toggle') as HTMLButtonElement;
      toggleBtn.click(); // Enter

      expect(sideBySide.getState().isActive).toBe(true);

      sideBySide.destroy();

      expect(sideBySide.getState().isActive).toBe(false);
      expect(document.querySelector('.side-by-side-container')).toBeFalsy();
    });

    it('should clear all state on destroy', () => {
      sideBySide.destroy();

      const state = sideBySide.getState();
      expect(state.isActive).toBe(false);
      expect(state.customMap).toBe(null);
      expect(state.koppenMap).toBe(null);
      expect(state.customClassification).toBe(null);
      expect(state.koppenClassification).toBe(null);
    });
  });
});
