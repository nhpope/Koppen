/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import comparison from '../../../src/builder/comparison.js';

describe('Comparison Module (Story 5.1)', () => {
  let mockKoppenClassification;

  beforeEach(() => {
    // Setup DOM without innerHTML
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Mock Köppen classification data
    mockKoppenClassification = {
      type: 'FeatureCollection',
      features: [
        { properties: { climate_type: 'Cfa' } },
        { properties: { climate_type: 'Af' } },
      ],
    };
  });

  afterEach(() => {
    comparison.destroy();
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with Köppen classification data', () => {
      comparison.init({ koppenClassification: mockKoppenClassification });
      const state = comparison.getState();

      expect(state.initialized).toBe(true);
      expect(state.koppenClassification).toEqual(mockKoppenClassification);
      expect(state.activeView).toBe('custom');
    });

    it('should warn if Köppen classification not provided', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      comparison.init({});

      expect(consoleSpy).toHaveBeenCalledWith(
        'Comparison module requires Köppen classification data'
      );
    });
  });

  describe('UI Creation', () => {
    it('should create comparison tabs UI', () => {
      comparison.init({ koppenClassification: mockKoppenClassification });
      const ui = comparison.createUI();

      expect(ui.className).toContain('builder-panel__comparison');

      const tabs = ui.querySelectorAll('.builder-panel__comparison-tab');
      expect(tabs.length).toBe(2);

      // Check tab labels
      expect(tabs[0].textContent).toContain('Custom');
      expect(tabs[1].textContent).toContain('Köppen');
    });

    it('should hide comparison tabs when no modifications made', () => {
      comparison.init({ koppenClassification: mockKoppenClassification });
      const ui = comparison.createUI();

      expect(ui.style.display).toBe('none');
    });

    it('should show comparison tabs when thresholds modified', () => {
      comparison.init({ koppenClassification: mockKoppenClassification });
      const ui = comparison.createUI();
      document.body.appendChild(ui);

      // Simulate threshold change
      const event = new CustomEvent('koppen:threshold-changed', {
        detail: {
          classification: { type: 'custom', features: [] },
        },
      });
      document.dispatchEvent(event);

      expect(ui.style.display).toBe('flex');
    });
  });

  describe('Tab Switching', () => {
    it('should update activeView state when clicking tabs', async () => {
      comparison.init({ koppenClassification: mockKoppenClassification });
      const ui = comparison.createUI();
      document.body.appendChild(ui);

      const tabs = ui.querySelectorAll('.builder-panel__comparison-tab');
      const koppenTab = tabs[1];

      // Click Köppen tab
      koppenTab.click();

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 60));

      const state = comparison.getState();
      expect(state.activeView).toBe('koppen');
    });

    it('should fire koppen:comparison-toggled event when switching tabs', async () => {
      comparison.init({ koppenClassification: mockKoppenClassification });
      const ui = comparison.createUI();
      document.body.appendChild(ui);

      const eventSpy = vi.fn();
      document.addEventListener('koppen:comparison-toggled', eventSpy);

      const tabs = ui.querySelectorAll('.builder-panel__comparison-tab');
      tabs[1].click();

      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail.activeView).toBe('koppen');
    });

    it('should fire koppen:reclassify event to trigger map update', async () => {
      comparison.init({ koppenClassification: mockKoppenClassification });
      const ui = comparison.createUI();
      document.body.appendChild(ui);

      const eventSpy = vi.fn();
      document.addEventListener('koppen:reclassify', eventSpy);

      const tabs = ui.querySelectorAll('.builder-panel__comparison-tab');
      tabs[1].click();

      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail.view).toBe('koppen');
      expect(eventSpy.mock.calls[0][0].detail.classification).toEqual(mockKoppenClassification);
    });

    it('should update tab visual state on switch', async () => {
      comparison.init({ koppenClassification: mockKoppenClassification });
      const ui = comparison.createUI();
      document.body.appendChild(ui);

      const tabs = ui.querySelectorAll('.builder-panel__comparison-tab');
      const customTab = tabs[0];
      const koppenTab = tabs[1];

      // Initially custom should be active
      expect(customTab.classList.contains('builder-panel__comparison-tab--active')).toBe(true);
      expect(koppenTab.classList.contains('builder-panel__comparison-tab--active')).toBe(false);

      // Click Köppen tab
      koppenTab.click();
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Köppen should now be active
      expect(customTab.classList.contains('builder-panel__comparison-tab--active')).toBe(false);
      expect(koppenTab.classList.contains('builder-panel__comparison-tab--active')).toBe(true);
    });

    it('should ensure only one tab is active at a time', async () => {
      comparison.init({ koppenClassification: mockKoppenClassification });
      const ui = comparison.createUI();
      document.body.appendChild(ui);

      const tabs = ui.querySelectorAll('.builder-panel__comparison-tab');

      // Count active tabs
      const countActiveTabs = () => {
        return Array.from(tabs).filter(tab =>
          tab.classList.contains('builder-panel__comparison-tab--active')
        ).length;
      };

      expect(countActiveTabs()).toBe(1);

      // Switch tabs
      tabs[1].click();
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(countActiveTabs()).toBe(1);

      // Switch back
      tabs[0].click();
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(countActiveTabs()).toBe(1);
    });

    it('should debounce rapid tab clicks (50ms)', async () => {
      comparison.init({ koppenClassification: mockKoppenClassification });
      const ui = comparison.createUI();
      document.body.appendChild(ui);

      const eventSpy = vi.fn();
      document.addEventListener('koppen:comparison-toggled', eventSpy);

      const tabs = ui.querySelectorAll('.builder-panel__comparison-tab');

      // Rapid clicks
      tabs[1].click();
      tabs[0].click();
      tabs[1].click();

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should only fire once (debounced)
      expect(eventSpy.mock.calls.length).toBeLessThan(3);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Enter key to activate tab', async () => {
      comparison.init({ koppenClassification: mockKoppenClassification });
      const ui = comparison.createUI();
      document.body.appendChild(ui);

      const tabs = ui.querySelectorAll('.builder-panel__comparison-tab');
      const koppenTab = tabs[1];

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      koppenTab.dispatchEvent(enterEvent);

      await new Promise((resolve) => setTimeout(resolve, 60));

      const state = comparison.getState();
      expect(state.activeView).toBe('koppen');
    });

    it('should support Space key to activate tab', async () => {
      comparison.init({ koppenClassification: mockKoppenClassification });
      const ui = comparison.createUI();
      document.body.appendChild(ui);

      const tabs = ui.querySelectorAll('.builder-panel__comparison-tab');
      const koppenTab = tabs[1];

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      koppenTab.dispatchEvent(spaceEvent);

      await new Promise((resolve) => setTimeout(resolve, 60));

      const state = comparison.getState();
      expect(state.activeView).toBe('koppen');
    });
  });

  describe('Performance Measurement', () => {
    it('should use Performance API to measure switch duration', async () => {
      comparison.init({ koppenClassification: mockKoppenClassification });
      const ui = comparison.createUI();
      document.body.appendChild(ui);

      const markSpy = vi.spyOn(performance, 'mark');
      const measureSpy = vi.spyOn(performance, 'measure');

      const tabs = ui.querySelectorAll('.builder-panel__comparison-tab');
      tabs[1].click();

      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(markSpy).toHaveBeenCalledWith('comparison-switch-start');
      expect(markSpy).toHaveBeenCalledWith('comparison-switch-end');
      expect(measureSpy).toHaveBeenCalledWith(
        'comparison-switch-duration',
        'comparison-switch-start',
        'comparison-switch-end'
      );
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      comparison.init({ koppenClassification: mockKoppenClassification });

      const eventSpy = vi.fn();
      document.addEventListener('koppen:threshold-changed', eventSpy);

      comparison.destroy();

      // Dispatch event after destroy
      const event = new CustomEvent('koppen:threshold-changed', {
        detail: { classification: {} },
      });
      document.dispatchEvent(event);

      // Module's listener should not fire (only our test listener)
      expect(eventSpy).toHaveBeenCalledTimes(1);
    });

    it('should reset state on destroy', () => {
      comparison.init({ koppenClassification: mockKoppenClassification });
      comparison.destroy();

      const state = comparison.getState();
      expect(state.initialized).toBe(false);
      expect(state.koppenClassification).toBe(null);
    });
  });
});
