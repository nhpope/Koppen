/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock module for testing
const thresholdSliders = {
  thresholds: {},
  originalPreset: null,
  updateCallbacks: [],

  init(preset, onChange) {
    this.thresholds = preset.thresholds;
    this.originalPreset = JSON.parse(JSON.stringify(preset));
    if (onChange) this.updateCallbacks.push(onChange);
  },

  render(preset) {
    const container = document.createElement('div');
    container.className = 'threshold-sliders';

    if (preset.thresholds.temperature) {
      const tempGroup = this.createSliderGroup('temperature', preset.thresholds.temperature);
      container.appendChild(tempGroup);
    }

    return container;
  },

  createSliderGroup(category, categoryThresholds) {
    const container = document.createElement('div');
    container.className = 'threshold-group';

    Object.keys(categoryThresholds).forEach((key) => {
      const config = categoryThresholds[key];
      const slider = this.createSlider(key, config, category);
      container.appendChild(slider);
    });

    return container;
  },

  createSlider(key, config, category) {
    const container = document.createElement('div');
    container.className = 'threshold-slider';
    container.dataset.thresholdKey = key;
    container.dataset.category = category;

    // Label row with indicator
    const labelRow = document.createElement('div');
    labelRow.className = 'threshold-slider__label-row';

    const label = document.createElement('label');
    label.className = 'threshold-slider__label';
    label.textContent = config.description;

    const indicator = document.createElement('span');
    indicator.className = 'threshold-slider__indicator';
    indicator.style.display = 'none';

    const tooltip = document.createElement('div');
    tooltip.className = 'threshold-slider__comparison-tooltip';
    tooltip.style.display = 'none';

    labelRow.appendChild(label);
    labelRow.appendChild(indicator);
    container.appendChild(labelRow);
    container.appendChild(tooltip);

    // Value wrapper with reset button
    const valueWrapper = document.createElement('div');
    valueWrapper.className = 'threshold-slider__value-wrapper';

    const textInput = document.createElement('input');
    textInput.type = 'number';
    textInput.className = 'threshold-slider__input';
    textInput.value = config.value;

    const unit = document.createElement('span');
    unit.className = 'threshold-slider__unit';
    unit.textContent = config.unit;

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'threshold-slider__reset-btn';
    resetBtn.textContent = '↺';
    resetBtn.style.display = 'none';
    resetBtn.addEventListener('click', () => {
      this.resetThreshold(key, category);
    });

    valueWrapper.appendChild(textInput);
    valueWrapper.appendChild(unit);
    valueWrapper.appendChild(resetBtn);
    container.appendChild(valueWrapper);

    // Range input
    const rangeInput = document.createElement('input');
    rangeInput.type = 'range';
    rangeInput.className = 'threshold-slider__range';
    rangeInput.value = config.value;
    container.appendChild(rangeInput);

    // Event listeners
    rangeInput.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      textInput.value = String(value);
      this.updateModificationIndicator(container, key, category, value, config.unit);
    });

    textInput.addEventListener('change', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      rangeInput.value = String(value);
      this.updateModificationIndicator(container, key, category, value, config.unit);
    });

    return container;
  },

  updateModificationIndicator(container, key, category, currentValue, unit) {
    if (!this.originalPreset) return;

    const originalValue = this.originalPreset.thresholds?.[category]?.[key]?.value;
    if (originalValue === undefined) return;

    // Update stored threshold value
    if (this.thresholds[category] && this.thresholds[category][key]) {
      this.thresholds[category][key].value = currentValue;
    }

    const indicator = container.querySelector('.threshold-slider__indicator') as HTMLElement;
    const tooltip = container.querySelector('.threshold-slider__comparison-tooltip') as HTMLElement;
    const resetBtn = container.querySelector('.threshold-slider__reset-btn') as HTMLElement;

    const isModified = currentValue !== originalValue;

    if (isModified) {
      indicator.style.display = 'inline-block';
      indicator.className = 'threshold-slider__indicator';

      if (currentValue < originalValue) {
        indicator.classList.add('threshold-slider__indicator--decreased');
      } else {
        indicator.classList.add('threshold-slider__indicator--increased');
      }

      tooltip.textContent = `Original: ${originalValue}${unit} → Custom: ${currentValue}${unit}`;
      tooltip.style.display = 'block';
      resetBtn.style.display = 'inline-block';
    } else {
      indicator.style.display = 'none';
      tooltip.style.display = 'none';
      resetBtn.style.display = 'none';
    }

    this.updateModificationSummary();
  },

  resetThreshold(key, category) {
    if (!this.originalPreset) return;

    const originalValue = this.originalPreset.thresholds?.[category]?.[key]?.value;
    if (originalValue === undefined) return;

    if (this.thresholds[category] && this.thresholds[category][key]) {
      this.thresholds[category][key].value = originalValue;
    }

    const container = document.querySelector(`[data-threshold-key="${key}"]`) as HTMLElement;
    if (container) {
      const textInput = container.querySelector('.threshold-slider__input') as HTMLInputElement;
      const rangeInput = container.querySelector('.threshold-slider__range') as HTMLInputElement;

      if (textInput) textInput.value = String(originalValue);
      if (rangeInput) rangeInput.value = String(originalValue);

      const unit = this.thresholds[category][key].unit;
      this.updateModificationIndicator(container, key, category, originalValue, unit);
    }

    document.dispatchEvent(
      new CustomEvent('koppen:threshold-reset', {
        detail: { key, category, value: originalValue },
      }),
    );
  },

  getModificationSummary() {
    if (!this.originalPreset) {
      return { modified: 0, total: 0, percentage: 0 };
    }

    let totalThresholds = 0;
    let modifiedCount = 0;

    Object.keys(this.thresholds).forEach((category) => {
      Object.keys(this.thresholds[category]).forEach((key) => {
        totalThresholds++;
        const currentValue = this.thresholds[category][key].value;
        const originalValue = this.originalPreset.thresholds?.[category]?.[key]?.value;

        if (originalValue !== undefined && currentValue !== originalValue) {
          modifiedCount++;
        }
      });
    });

    return {
      modified: modifiedCount,
      total: totalThresholds,
      percentage: totalThresholds > 0 ? ((modifiedCount / totalThresholds) * 100).toFixed(0) : 0,
    };
  },

  updateModificationSummary() {
    const summary = this.getModificationSummary();
    document.dispatchEvent(
      new CustomEvent('koppen:modification-summary-changed', {
        detail: summary,
      }),
    );
  },

  destroy() {
    this.thresholds = {};
    this.originalPreset = null;
    this.updateCallbacks = [];
  },
};

describe('Threshold Sliders - Modification Tracking', () => {
  let testContainer: HTMLElement;
  let mockPreset: any;

  beforeEach(() => {
    // Setup DOM
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // Mock preset
    mockPreset = {
      name: 'Köppen',
      thresholds: {
        temperature: {
          tColdest: {
            value: 18,
            range: [-20, 30],
            step: 1,
            unit: '°C',
            description: 'Coldest month temperature',
          },
          tWarmest: {
            value: 10,
            range: [-10, 30],
            step: 1,
            unit: '°C',
            description: 'Warmest month temperature',
          },
        },
      },
    };

    thresholdSliders.init(mockPreset);
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    thresholdSliders.destroy();
    vi.restoreAllMocks();
  });

  describe('Original Preset Storage', () => {
    it('should deep clone original preset on init', () => {
      expect(thresholdSliders.originalPreset).not.toBe(mockPreset);
      expect(thresholdSliders.originalPreset).toEqual(mockPreset);
    });

    it('should preserve original values when thresholds change', () => {
      thresholdSliders.thresholds.temperature.tColdest.value = 20;

      expect(thresholdSliders.originalPreset.thresholds.temperature.tColdest.value).toBe(18);
    });
  });

  describe('Modification Indicator Display', () => {
    it('should show blue indicator when value decreased', () => {
      const sliderContainer = thresholdSliders.render(mockPreset);
      testContainer.appendChild(sliderContainer);

      const slider = testContainer.querySelector('[data-threshold-key="tColdest"]') as HTMLElement;
      const indicator = slider.querySelector('.threshold-slider__indicator') as HTMLElement;
      const rangeInput = slider.querySelector('.threshold-slider__range') as HTMLInputElement;

      // Decrease value from 18 to 15
      rangeInput.value = '15';
      rangeInput.dispatchEvent(new Event('input'));

      expect(indicator.style.display).toBe('inline-block');
      expect(indicator.classList.contains('threshold-slider__indicator--decreased')).toBe(true);
      expect(indicator.classList.contains('threshold-slider__indicator--increased')).toBe(false);
    });

    it('should show orange indicator when value increased', () => {
      const sliderContainer = thresholdSliders.render(mockPreset);
      testContainer.appendChild(sliderContainer);

      const slider = testContainer.querySelector('[data-threshold-key="tColdest"]') as HTMLElement;
      const indicator = slider.querySelector('.threshold-slider__indicator') as HTMLElement;
      const rangeInput = slider.querySelector('.threshold-slider__range') as HTMLInputElement;

      // Increase value from 18 to 22
      rangeInput.value = '22';
      rangeInput.dispatchEvent(new Event('input'));

      expect(indicator.style.display).toBe('inline-block');
      expect(indicator.classList.contains('threshold-slider__indicator--increased')).toBe(true);
      expect(indicator.classList.contains('threshold-slider__indicator--decreased')).toBe(false);
    });

    it('should hide indicator when value matches original', () => {
      const sliderContainer = thresholdSliders.render(mockPreset);
      testContainer.appendChild(sliderContainer);

      const slider = testContainer.querySelector('[data-threshold-key="tColdest"]') as HTMLElement;
      const indicator = slider.querySelector('.threshold-slider__indicator') as HTMLElement;
      const rangeInput = slider.querySelector('.threshold-slider__range') as HTMLInputElement;

      // Change value
      rangeInput.value = '20';
      rangeInput.dispatchEvent(new Event('input'));
      expect(indicator.style.display).toBe('inline-block');

      // Restore to original
      rangeInput.value = '18';
      rangeInput.dispatchEvent(new Event('input'));
      expect(indicator.style.display).toBe('none');
    });
  });

  describe('Inline Tooltip Display', () => {
    it('should show tooltip with correct format when modified', () => {
      const sliderContainer = thresholdSliders.render(mockPreset);
      testContainer.appendChild(sliderContainer);

      const slider = testContainer.querySelector('[data-threshold-key="tColdest"]') as HTMLElement;
      const tooltip = slider.querySelector('.threshold-slider__comparison-tooltip') as HTMLElement;
      const rangeInput = slider.querySelector('.threshold-slider__range') as HTMLInputElement;

      rangeInput.value = '20';
      rangeInput.dispatchEvent(new Event('input'));

      expect(tooltip.style.display).toBe('block');
      expect(tooltip.textContent).toBe('Original: 18°C → Custom: 20°C');
    });

    it('should hide tooltip when value matches original', () => {
      const sliderContainer = thresholdSliders.render(mockPreset);
      testContainer.appendChild(sliderContainer);

      const slider = testContainer.querySelector('[data-threshold-key="tColdest"]') as HTMLElement;
      const tooltip = slider.querySelector('.threshold-slider__comparison-tooltip') as HTMLElement;
      const rangeInput = slider.querySelector('.threshold-slider__range') as HTMLInputElement;

      rangeInput.value = '20';
      rangeInput.dispatchEvent(new Event('input'));
      expect(tooltip.style.display).toBe('block');

      rangeInput.value = '18';
      rangeInput.dispatchEvent(new Event('input'));
      expect(tooltip.style.display).toBe('none');
    });
  });

  describe('Individual Reset Button', () => {
    it('should show reset button when threshold modified', () => {
      const sliderContainer = thresholdSliders.render(mockPreset);
      testContainer.appendChild(sliderContainer);

      const slider = testContainer.querySelector('[data-threshold-key="tColdest"]') as HTMLElement;
      const resetBtn = slider.querySelector('.threshold-slider__reset-btn') as HTMLElement;
      const rangeInput = slider.querySelector('.threshold-slider__range') as HTMLInputElement;

      expect(resetBtn.style.display).toBe('none');

      rangeInput.value = '20';
      rangeInput.dispatchEvent(new Event('input'));

      expect(resetBtn.style.display).toBe('inline-block');
    });

    it('should reset threshold to original value when clicked', () => {
      const sliderContainer = thresholdSliders.render(mockPreset);
      testContainer.appendChild(sliderContainer);

      const slider = testContainer.querySelector('[data-threshold-key="tColdest"]') as HTMLElement;
      const resetBtn = slider.querySelector('.threshold-slider__reset-btn') as HTMLButtonElement;
      const textInput = slider.querySelector('.threshold-slider__input') as HTMLInputElement;
      const rangeInput = slider.querySelector('.threshold-slider__range') as HTMLInputElement;

      // Modify value
      rangeInput.value = '20';
      rangeInput.dispatchEvent(new Event('input'));
      expect(textInput.value).toBe('20');

      // Reset
      resetBtn.click();

      expect(textInput.value).toBe('18');
      expect(rangeInput.value).toBe('18');
      expect(thresholdSliders.thresholds.temperature.tColdest.value).toBe(18);
    });

    it('should fire koppen:threshold-reset event when clicked', () => {
      const sliderContainer = thresholdSliders.render(mockPreset);
      testContainer.appendChild(sliderContainer);

      const slider = testContainer.querySelector('[data-threshold-key="tColdest"]') as HTMLElement;
      const resetBtn = slider.querySelector('.threshold-slider__reset-btn') as HTMLButtonElement;
      const rangeInput = slider.querySelector('.threshold-slider__range') as HTMLInputElement;

      rangeInput.value = '20';
      rangeInput.dispatchEvent(new Event('input'));

      const eventListener = vi.fn();
      document.addEventListener('koppen:threshold-reset', eventListener);

      resetBtn.click();

      expect(eventListener).toHaveBeenCalledTimes(1);
      expect(eventListener.mock.calls[0][0].detail).toEqual({
        key: 'tColdest',
        category: 'temperature',
        value: 18,
      });
    });

    it('should hide reset button after resetting to original', () => {
      const sliderContainer = thresholdSliders.render(mockPreset);
      testContainer.appendChild(sliderContainer);

      const slider = testContainer.querySelector('[data-threshold-key="tColdest"]') as HTMLElement;
      const resetBtn = slider.querySelector('.threshold-slider__reset-btn') as HTMLElement;
      const rangeInput = slider.querySelector('.threshold-slider__range') as HTMLInputElement;

      rangeInput.value = '20';
      rangeInput.dispatchEvent(new Event('input'));
      expect(resetBtn.style.display).toBe('inline-block');

      (resetBtn as HTMLButtonElement).click();
      expect(resetBtn.style.display).toBe('none');
    });
  });

  describe('Modification Summary', () => {
    it('should calculate summary correctly with no modifications', () => {
      const summary = thresholdSliders.getModificationSummary();

      expect(summary).toEqual({
        modified: 0,
        total: 2,
        percentage: '0',
      });
    });

    it('should calculate summary correctly with one modification', () => {
      thresholdSliders.thresholds.temperature.tColdest.value = 20;

      const summary = thresholdSliders.getModificationSummary();

      expect(summary).toEqual({
        modified: 1,
        total: 2,
        percentage: '50',
      });
    });

    it('should calculate summary correctly with all modifications', () => {
      thresholdSliders.thresholds.temperature.tColdest.value = 20;
      thresholdSliders.thresholds.temperature.tWarmest.value = 15;

      const summary = thresholdSliders.getModificationSummary();

      expect(summary).toEqual({
        modified: 2,
        total: 2,
        percentage: '100',
      });
    });

    it('should fire koppen:modification-summary-changed event on update', () => {
      const sliderContainer = thresholdSliders.render(mockPreset);
      testContainer.appendChild(sliderContainer);

      const eventListener = vi.fn();
      document.addEventListener('koppen:modification-summary-changed', eventListener);

      const slider = testContainer.querySelector('[data-threshold-key="tColdest"]') as HTMLElement;
      const rangeInput = slider.querySelector('.threshold-slider__range') as HTMLInputElement;

      rangeInput.value = '20';
      rangeInput.dispatchEvent(new Event('input'));

      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail).toEqual({
        modified: 1,
        total: 2,
        percentage: '50',
      });
    });
  });

  describe('Text Input Integration', () => {
    it('should update indicator when text input changed', () => {
      const sliderContainer = thresholdSliders.render(mockPreset);
      testContainer.appendChild(sliderContainer);

      const slider = testContainer.querySelector('[data-threshold-key="tColdest"]') as HTMLElement;
      const indicator = slider.querySelector('.threshold-slider__indicator') as HTMLElement;
      const textInput = slider.querySelector('.threshold-slider__input') as HTMLInputElement;

      textInput.value = '15';
      textInput.dispatchEvent(new Event('change'));

      expect(indicator.style.display).toBe('inline-block');
      expect(indicator.classList.contains('threshold-slider__indicator--decreased')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing original preset gracefully', () => {
      thresholdSliders.originalPreset = null;

      const sliderContainer = thresholdSliders.render(mockPreset);
      testContainer.appendChild(sliderContainer);

      const slider = testContainer.querySelector('[data-threshold-key="tColdest"]') as HTMLElement;
      const rangeInput = slider.querySelector('.threshold-slider__range') as HTMLInputElement;

      // Should not throw error
      expect(() => {
        rangeInput.value = '20';
        rangeInput.dispatchEvent(new Event('input'));
      }).not.toThrow();
    });

    it('should return zero summary when no original preset', () => {
      thresholdSliders.originalPreset = null;

      const summary = thresholdSliders.getModificationSummary();

      expect(summary).toEqual({
        modified: 0,
        total: 0,
        percentage: 0,
      });
    });

    it('should handle multiple rapid changes correctly', () => {
      const sliderContainer = thresholdSliders.render(mockPreset);
      testContainer.appendChild(sliderContainer);

      const slider = testContainer.querySelector('[data-threshold-key="tColdest"]') as HTMLElement;
      const indicator = slider.querySelector('.threshold-slider__indicator') as HTMLElement;
      const rangeInput = slider.querySelector('.threshold-slider__range') as HTMLInputElement;

      // Rapid changes
      rangeInput.value = '15';
      rangeInput.dispatchEvent(new Event('input'));
      rangeInput.value = '22';
      rangeInput.dispatchEvent(new Event('input'));
      rangeInput.value = '18';
      rangeInput.dispatchEvent(new Event('input'));

      // Should end up with no indicator (back to original)
      expect(indicator.style.display).toBe('none');
    });
  });
});
