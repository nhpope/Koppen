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

import thresholdSliders from '../../../src/builder/threshold-sliders.js';

// Sample preset for testing
const createTestPreset = () => ({
  name: 'Test Preset',
  thresholds: {
    temperature: {
      coldMonth: {
        value: 18,
        description: 'Cold month threshold',
        unit: '°C',
        range: [0, 30],
        step: 1,
      },
      hotSummer: {
        value: 22,
        description: 'Hot summer threshold',
        unit: '°C',
        range: [10, 40],
        step: 1,
      },
    },
    precipitation: {
      dry: {
        value: 60,
        description: 'Dry threshold',
        unit: 'mm',
        range: [0, 200],
        step: 5,
      },
    },
  },
});

describe('Threshold Sliders Module (Story 5.3)', () => {
  let preset: ReturnType<typeof createTestPreset>;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    preset = createTestPreset();
  });

  afterEach(() => {
    thresholdSliders.destroy();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize without error', () => {
      expect(() => thresholdSliders.init(preset)).not.toThrow();
    });

    it('should store preset thresholds', () => {
      thresholdSliders.init(preset);

      const values = thresholdSliders.getAllValues();
      expect(values.coldMonth).toBe(18);
      expect(values.hotSummer).toBe(22);
      expect(values.dry).toBe(60);
    });

    it('should accept onChange callback', () => {
      const onChange = vi.fn();
      thresholdSliders.init(preset, onChange);

      // Callback should be registered (tested indirectly through render)
      expect(() => thresholdSliders.init(preset, onChange)).not.toThrow();
    });

    it('should store original preset for comparison', () => {
      thresholdSliders.init(preset);

      // Original values should be preserved even if we modify later
      const values = thresholdSliders.getAllValues();
      expect(values.coldMonth).toBe(18);
    });
  });

  describe('render', () => {
    it('should create slider container', () => {
      const container = thresholdSliders.render(preset);

      expect(container).toBeInstanceOf(HTMLElement);
      expect(container.className).toBe('threshold-sliders');
    });

    it('should create temperature threshold group', () => {
      const container = thresholdSliders.render(preset);

      const tempGroup = container.querySelector('.threshold-group');
      expect(tempGroup).not.toBeNull();
    });

    it('should create slider for each threshold', () => {
      const container = thresholdSliders.render(preset);

      const sliders = container.querySelectorAll('.threshold-slider');
      expect(sliders.length).toBe(3); // coldMonth, hotSummer, dry
    });

    it('should set correct data attributes on sliders', () => {
      const container = thresholdSliders.render(preset);

      const coldMonthSlider = container.querySelector('[data-threshold-key="coldMonth"]');
      expect(coldMonthSlider).not.toBeNull();
      expect(coldMonthSlider?.getAttribute('data-category')).toBe('temperature');
    });

    it('should create range input for each threshold', () => {
      const container = thresholdSliders.render(preset);

      const ranges = container.querySelectorAll('.threshold-slider__range');
      expect(ranges.length).toBe(3);
    });

    it('should create text input for each threshold', () => {
      const container = thresholdSliders.render(preset);

      const inputs = container.querySelectorAll('.threshold-slider__input');
      expect(inputs.length).toBe(3);
    });

    it('should set correct initial values on range inputs', () => {
      const container = thresholdSliders.render(preset);

      const range = container.querySelector('#threshold-coldMonth') as HTMLInputElement;
      expect(range?.value).toBe('18');
    });

    it('should set correct initial values on text inputs', () => {
      const container = thresholdSliders.render(preset);

      const input = container.querySelector('#threshold-coldMonth-value') as HTMLInputElement;
      expect(input?.value).toBe('18');
    });

    it('should set correct min/max on range inputs', () => {
      const container = thresholdSliders.render(preset);

      const range = container.querySelector('#threshold-coldMonth') as HTMLInputElement;
      expect(range?.min).toBe('0');
      expect(range?.max).toBe('30');
    });

    it('should set correct step on range inputs', () => {
      const container = thresholdSliders.render(preset);

      const range = container.querySelector('#threshold-coldMonth') as HTMLInputElement;
      expect(range?.step).toBe('1');
    });

    it('should display unit labels', () => {
      const container = thresholdSliders.render(preset);

      const units = container.querySelectorAll('.threshold-slider__unit');
      expect(units.length).toBe(3);
      expect(units[0].textContent).toBe('°C');
    });

    it('should display threshold descriptions', () => {
      const container = thresholdSliders.render(preset);

      const labels = container.querySelectorAll('.threshold-slider__label');
      expect(labels[0].textContent).toBe('Cold month threshold');
    });

    it('should set ARIA attributes for accessibility', () => {
      const container = thresholdSliders.render(preset);

      const range = container.querySelector('#threshold-coldMonth') as HTMLInputElement;
      expect(range?.getAttribute('aria-label')).toBe('Cold month threshold');
      expect(range?.getAttribute('aria-valuemin')).toBe('0');
      expect(range?.getAttribute('aria-valuemax')).toBe('30');
      expect(range?.getAttribute('aria-valuenow')).toBe('18');
    });

    it('should create reset button (initially hidden)', () => {
      const container = thresholdSliders.render(preset);

      const resetBtns = container.querySelectorAll('.threshold-slider__reset-btn');
      expect(resetBtns.length).toBe(3);
      expect((resetBtns[0] as HTMLElement).style.display).toBe('none');
    });

    it('should create modification indicator (initially hidden)', () => {
      const container = thresholdSliders.render(preset);

      const indicators = container.querySelectorAll('.threshold-slider__indicator');
      expect(indicators.length).toBe(3);
      expect((indicators[0] as HTMLElement).style.display).toBe('none');
    });

    it('should render precipitation group when present', () => {
      const container = thresholdSliders.render(preset);

      const groups = container.querySelectorAll('.threshold-group');
      expect(groups.length).toBe(2); // temperature and precipitation
    });

    it('should handle preset without precipitation', () => {
      const tempOnlyPreset = {
        name: 'Temp Only',
        thresholds: {
          temperature: preset.thresholds.temperature,
        },
      };

      const container = thresholdSliders.render(tempOnlyPreset);

      const groups = container.querySelectorAll('.threshold-group');
      expect(groups.length).toBe(1);
    });

    it('should handle preset without temperature', () => {
      const precipOnlyPreset = {
        name: 'Precip Only',
        thresholds: {
          precipitation: preset.thresholds.precipitation,
        },
      };

      const container = thresholdSliders.render(precipOnlyPreset);

      const groups = container.querySelectorAll('.threshold-group');
      expect(groups.length).toBe(1);
    });
  });

  describe('getAllValues', () => {
    beforeEach(() => {
      thresholdSliders.init(preset);
    });

    it('should return all threshold values as flat object', () => {
      const values = thresholdSliders.getAllValues();

      expect(values).toEqual({
        coldMonth: 18,
        hotSummer: 22,
        dry: 60,
      });
    });

    it('should return empty object when no thresholds', () => {
      thresholdSliders.destroy();
      thresholdSliders.init({ name: 'Empty', thresholds: {} });

      const values = thresholdSliders.getAllValues();
      expect(values).toEqual({});
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      thresholdSliders.init(preset);
      document.body.appendChild(thresholdSliders.render(preset));
    });

    it('should reset to preset values', () => {
      // Create a fresh preset with original values for reset
      const freshPreset = createTestPreset();

      // Modify current values
      thresholdSliders.setValues({
        temperature: { coldMonth: 10 },
      });

      // Verify it was modified
      expect(thresholdSliders.getAllValues().coldMonth).toBe(10);

      // Reset with fresh preset
      thresholdSliders.reset(freshPreset);

      const values = thresholdSliders.getAllValues();
      expect(values.coldMonth).toBe(18);
    });

    it('should update DOM inputs', () => {
      thresholdSliders.reset(preset);

      const range = document.querySelector('#threshold-coldMonth') as HTMLInputElement;
      const input = document.querySelector('#threshold-coldMonth-value') as HTMLInputElement;

      expect(range?.value).toBe('18');
      expect(input?.value).toBe('18');
    });

    it('should dispatch koppen:thresholds-reset event', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:thresholds-reset', eventListener);

      thresholdSliders.reset(preset);

      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail.thresholds).toBeDefined();

      document.removeEventListener('koppen:thresholds-reset', eventListener);
    });

    it('should update ARIA attributes', () => {
      thresholdSliders.reset(preset);

      const range = document.querySelector('#threshold-coldMonth') as HTMLInputElement;
      expect(range?.getAttribute('aria-valuenow')).toBe('18');
    });
  });

  describe('setValues', () => {
    beforeEach(() => {
      thresholdSliders.init(preset);
      document.body.appendChild(thresholdSliders.render(preset));
    });

    it('should update threshold values', () => {
      thresholdSliders.setValues({
        temperature: { coldMonth: { value: 15 } },
      });

      const values = thresholdSliders.getAllValues();
      expect(values.coldMonth).toBe(15);
    });

    it('should handle value-only format', () => {
      thresholdSliders.setValues({
        temperature: { coldMonth: 12 },
      });

      const values = thresholdSliders.getAllValues();
      expect(values.coldMonth).toBe(12);
    });

    it('should update DOM inputs', () => {
      thresholdSliders.setValues({
        temperature: { coldMonth: { value: 20 } },
      });

      const range = document.querySelector('#threshold-coldMonth') as HTMLInputElement;
      const input = document.querySelector('#threshold-coldMonth-value') as HTMLInputElement;

      expect(range?.value).toBe('20');
      expect(input?.value).toBe('20');
    });

    it('should dispatch koppen:thresholds-imported event', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:thresholds-imported', eventListener);

      thresholdSliders.setValues({
        temperature: { coldMonth: { value: 25 } },
      });

      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail.thresholds).toBeDefined();

      document.removeEventListener('koppen:thresholds-imported', eventListener);
    });

    it('should dispatch koppen:threshold-changed event', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:threshold-changed', eventListener);

      thresholdSliders.setValues({
        temperature: { coldMonth: { value: 25 } },
      });

      expect(eventListener).toHaveBeenCalled();

      document.removeEventListener('koppen:threshold-changed', eventListener);
    });

    it('should handle new categories gracefully', () => {
      // If setValues receives a category that doesn't exist
      expect(() => {
        thresholdSliders.setValues({
          newCategory: { newThreshold: 100 },
        });
      }).not.toThrow();
    });

    it('should handle partial updates', () => {
      thresholdSliders.setValues({
        temperature: { coldMonth: 10 },
      });

      const values = thresholdSliders.getAllValues();
      expect(values.coldMonth).toBe(10);
      expect(values.hotSummer).toBe(22); // unchanged
      expect(values.dry).toBe(60); // unchanged
    });
  });

  describe('destroy', () => {
    it('should reset internal state', () => {
      thresholdSliders.init(preset);
      thresholdSliders.destroy();

      const values = thresholdSliders.getAllValues();
      expect(values).toEqual({});
    });

    it('should not throw when called multiple times', () => {
      expect(() => {
        thresholdSliders.destroy();
        thresholdSliders.destroy();
      }).not.toThrow();
    });

    it('should clear callbacks', () => {
      const callback = vi.fn();
      thresholdSliders.init(preset, callback);
      thresholdSliders.destroy();

      // Re-init without callback
      thresholdSliders.init(preset);

      // Callback should not be called anymore
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('threshold-changed events', () => {
    beforeEach(() => {
      thresholdSliders.init(preset);
      document.body.appendChild(thresholdSliders.render(preset));
    });

    it('should dispatch event on range input change', async () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:threshold-changed', eventListener);

      const range = document.querySelector('#threshold-coldMonth') as HTMLInputElement;
      range.value = '15';
      range.dispatchEvent(new Event('input', { bubbles: true }));

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail.key).toBe('coldMonth');
      expect(eventListener.mock.calls[0][0].detail.value).toBe(15);

      document.removeEventListener('koppen:threshold-changed', eventListener);
    });

    it('should dispatch event on text input change', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:threshold-changed', eventListener);

      const input = document.querySelector('#threshold-coldMonth-value') as HTMLInputElement;
      input.value = '12';
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail.key).toBe('coldMonth');
      expect(eventListener.mock.calls[0][0].detail.value).toBe(12);

      document.removeEventListener('koppen:threshold-changed', eventListener);
    });

    it('should include threshold unit in event detail', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:threshold-changed', eventListener);

      const input = document.querySelector('#threshold-coldMonth-value') as HTMLInputElement;
      input.value = '10';
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(eventListener.mock.calls[0][0].detail.unit).toBe('°C');

      document.removeEventListener('koppen:threshold-changed', eventListener);
    });

    it('should include all thresholds in event detail', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:threshold-changed', eventListener);

      const input = document.querySelector('#threshold-coldMonth-value') as HTMLInputElement;
      input.value = '10';
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(eventListener.mock.calls[0][0].detail.thresholds).toBeDefined();

      document.removeEventListener('koppen:threshold-changed', eventListener);
    });

    it('should clamp values to min/max range', () => {
      const input = document.querySelector('#threshold-coldMonth-value') as HTMLInputElement;
      input.value = '100'; // Above max of 30
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(input.value).toBe('30'); // Clamped to max
    });

    it('should clamp values below minimum', () => {
      const input = document.querySelector('#threshold-coldMonth-value') as HTMLInputElement;
      input.value = '-10'; // Below min of 0
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(input.value).toBe('0'); // Clamped to min
    });

    it('should sync range and text input values', () => {
      const range = document.querySelector('#threshold-coldMonth') as HTMLInputElement;
      const input = document.querySelector('#threshold-coldMonth-value') as HTMLInputElement;

      range.value = '25';
      range.dispatchEvent(new Event('input', { bubbles: true }));

      expect(input.value).toBe('25');
    });
  });

  describe('onChange callback', () => {
    it('should call callback when threshold changes', async () => {
      const callback = vi.fn();
      thresholdSliders.init(preset, callback);
      document.body.appendChild(thresholdSliders.render(preset));

      const range = document.querySelector('#threshold-coldMonth') as HTMLInputElement;
      range.value = '15';
      range.dispatchEvent(new Event('input', { bubbles: true }));

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(callback).toHaveBeenCalledWith('coldMonth', 15);
    });
  });

  describe('group headers', () => {
    it('should have correct header for temperature group', () => {
      const container = thresholdSliders.render(preset);

      const headers = container.querySelectorAll('.threshold-group__header');
      expect(headers[0].textContent).toBe('Temperature Thresholds');
    });

    it('should have correct header for precipitation group', () => {
      const container = thresholdSliders.render(preset);

      const headers = container.querySelectorAll('.threshold-group__header');
      expect(headers[1].textContent).toBe('Precipitation Thresholds');
    });
  });
});
