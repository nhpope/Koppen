/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import builderModule from '../../../src/builder/index.js';

describe('Builder Module', () => {
  let builderPanel: HTMLElement;

  beforeEach(() => {
    // Setup DOM with safe methods
    const app = document.createElement('div');
    app.id = 'app';

    const header = document.createElement('header');
    const createBtn = document.createElement('button');
    createBtn.id = 'create-btn';
    createBtn.setAttribute('aria-pressed', 'false');
    createBtn.textContent = 'Create';
    header.appendChild(createBtn);

    const panel = document.createElement('div');
    panel.id = 'builder-panel';
    panel.setAttribute('aria-hidden', 'true');

    app.appendChild(header);
    app.appendChild(panel);
    document.body.appendChild(app);

    builderPanel = panel;

    // Initialize builder
    builderModule.init();
  });

  afterEach(() => {
    builderModule.destroy();
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  describe('Initialization', () => {
    it('should initialize with builder panel', () => {
      expect(builderPanel).toBeDefined();
      expect(builderPanel.getAttribute('aria-hidden')).toBe('true');
    });

    it('should render header with title and close button', () => {
      const header = builderPanel.querySelector('.builder-panel__header');
      expect(header).toBeDefined();

      const title = builderPanel.querySelector('.builder-panel__title');
      expect(title?.textContent).toBe('Create Classification');

      const closeBtn = builderPanel.querySelector('.builder-panel__close');
      expect(closeBtn).toBeDefined();
    });

    it('should render loading state when data not loaded', () => {
      const loading = builderPanel.querySelector('.builder-panel__loading');
      expect(loading).toBeDefined();

      const spinner = builderPanel.querySelector('.spinner');
      expect(spinner).toBeDefined();
    });
  });

  describe('Opening and Closing', () => {
    it('should open panel when toggle event fired', () => {
      expect(builderModule.isOpen()).toBe(false);

      document.dispatchEvent(new CustomEvent('koppen:toggle-builder'));

      expect(builderModule.isOpen()).toBe(true);
      expect(builderPanel.classList.contains('builder-panel--active')).toBe(true);
      expect(builderPanel.getAttribute('aria-hidden')).toBe('false');
    });

    it('should update Create button text when opened', () => {
      const createBtn = document.getElementById('create-btn')!;

      document.dispatchEvent(new CustomEvent('koppen:toggle-builder'));

      expect(createBtn.textContent).toBe('Editing...');
      expect(createBtn.getAttribute('aria-pressed')).toBe('true');
    });

    it('should close panel when toggle event fired again', () => {
      // Open
      document.dispatchEvent(new CustomEvent('koppen:toggle-builder'));
      expect(builderModule.isOpen()).toBe(true);

      // Close
      document.dispatchEvent(new CustomEvent('koppen:toggle-builder'));
      expect(builderModule.isOpen()).toBe(false);
      expect(builderPanel.classList.contains('builder-panel--active')).toBe(false);
      expect(builderPanel.getAttribute('aria-hidden')).toBe('true');
    });

    it('should reset Create button text when closed', () => {
      const createBtn = document.getElementById('create-btn')!;

      // Open
      document.dispatchEvent(new CustomEvent('koppen:toggle-builder'));

      // Close
      document.dispatchEvent(new CustomEvent('koppen:toggle-builder'));

      expect(createBtn.textContent).toBe('Create');
      expect(createBtn.getAttribute('aria-pressed')).toBe('false');
    });

    it('should close panel with Escape key', () => {
      // Open
      builderModule.open();
      expect(builderModule.isOpen()).toBe(true);

      // Press Escape
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(builderModule.isOpen()).toBe(false);
    });

    it('should close panel when close button clicked', () => {
      builderModule.open();

      const closeBtn = builderPanel.querySelector('.builder-panel__close') as HTMLButtonElement;
      closeBtn.click();

      expect(builderModule.isOpen()).toBe(false);
    });

    it('should prevent double-open on rapid clicks', () => {
      builderModule.open();
      const firstState = builderModule.isOpen();

      builderModule.open(); // Try to open again
      const secondState = builderModule.isOpen();

      expect(firstState).toBe(true);
      expect(secondState).toBe(true);
      expect(builderPanel.classList.contains('builder-panel--active')).toBe(true);
    });
  });

  describe('Event Handling', () => {
    it('should fire koppen:builder-opened event when opened', () => {
      const listener = vi.fn();
      document.addEventListener('koppen:builder-opened', listener);

      builderModule.open();

      expect(listener).toHaveBeenCalledOnce();
    });

    it('should fire koppen:builder-closed event when closed', () => {
      const listener = vi.fn();
      document.addEventListener('koppen:builder-closed', listener);

      builderModule.open();
      builderModule.close();

      expect(listener).toHaveBeenCalledOnce();
    });

    it('should close when koppen:close-panels event fired without exception', () => {
      builderModule.open();

      document.dispatchEvent(new CustomEvent('koppen:close-panels'));

      expect(builderModule.isOpen()).toBe(false);
    });

    it('should NOT close when koppen:close-panels event has builder exception', () => {
      builderModule.open();

      document.dispatchEvent(
        new CustomEvent('koppen:close-panels', {
          detail: { except: 'builder' },
        }),
      );

      expect(builderModule.isOpen()).toBe(true);
    });
  });

  describe('Data Loading', () => {
    it('should show loading state initially', () => {
      const loading = builderPanel.querySelector('.builder-panel__loading');
      const options = builderPanel.querySelector('.builder-panel__options');

      expect(loading).toBeDefined();
      expect(options).toBeNull();
    });

    it('should render start options when data loaded', () => {
      // Simulate data loaded
      document.dispatchEvent(new CustomEvent('koppen:data-loaded'));

      const loading = builderPanel.querySelector('.builder-panel__loading');
      const options = builderPanel.querySelector('.builder-panel__options');

      expect(loading).toBeNull();
      expect(options).toBeDefined();
    });

    it('should render Köppen and Scratch options', () => {
      document.dispatchEvent(new CustomEvent('koppen:data-loaded'));

      const koppenBtn = builderPanel.querySelector('#start-from-koppen');
      const scratchBtn = builderPanel.querySelector('#start-from-scratch');

      expect(koppenBtn).toBeDefined();
      expect(scratchBtn).toBeDefined();
    });

    it('should mark Köppen option as primary', () => {
      document.dispatchEvent(new CustomEvent('koppen:data-loaded'));

      const koppenBtn = builderPanel.querySelector('#start-from-koppen');
      expect(koppenBtn?.classList.contains('builder-panel__option--primary')).toBe(true);
    });
  });

  describe('Focus Management', () => {
    it('should trap focus when opened', () => {
      builderModule.open();

      const focusable = builderPanel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      expect(focusable.length).toBeGreaterThan(0);
      // First focusable element should receive focus
      expect(document.activeElement).toBe(focusable[0]);
    });

    it('should return focus to Create button when closed', () => {
      const createBtn = document.getElementById('create-btn')!;

      builderModule.open();
      builderModule.close();

      expect(document.activeElement).toBe(createBtn);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      expect(builderPanel.getAttribute('aria-hidden')).toBe('true');

      builderModule.open();
      expect(builderPanel.getAttribute('aria-hidden')).toBe('false');

      builderModule.close();
      expect(builderPanel.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have close button with aria-label', () => {
      const closeBtn = builderPanel.querySelector('.builder-panel__close');
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close builder');
    });

    it('should have spinner with role and aria-label', () => {
      const spinner = builderPanel.querySelector('.spinner');
      expect(spinner?.getAttribute('role')).toBe('status');
      expect(spinner?.getAttribute('aria-label')).toBe('Loading climate data...');
    });

    it('should have option icons marked as aria-hidden', () => {
      document.dispatchEvent(new CustomEvent('koppen:data-loaded'));

      const icons = builderPanel.querySelectorAll('.builder-panel__option-icon');
      icons.forEach((icon) => {
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });
    });
  });

  describe('Name Input', () => {
    beforeEach(() => {
      document.dispatchEvent(new CustomEvent('koppen:data-loaded'));
    });

    it('should have name input field', () => {
      const nameInput = builderPanel.querySelector('#classification-name');
      expect(nameInput).toBeDefined();
      expect(nameInput?.getAttribute('placeholder')).toBe('My Classification');
      expect(nameInput?.getAttribute('maxLength')).toBe('50');
    });

    it('should dispatch koppen:classification-named event on input', () => {
      const nameInput = builderPanel.querySelector('#classification-name') as HTMLInputElement;
      const listener = vi.fn();
      document.addEventListener('koppen:classification-named', listener);

      nameInput.value = 'Test Classification';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].detail.name).toBe('Test Classification');

      document.removeEventListener('koppen:classification-named', listener);
    });
  });

  describe('Share Button', () => {
    beforeEach(() => {
      document.dispatchEvent(new CustomEvent('koppen:data-loaded'));
    });

    it('should have share button with correct attributes', () => {
      const shareBtn = builderPanel.querySelector('.builder-panel__share-btn');
      expect(shareBtn).toBeDefined();
      expect(shareBtn?.getAttribute('data-share-classification')).toBe('');
      expect(shareBtn?.getAttribute('aria-label')).toBe('Share classification via URL');
    });
  });

  describe('Layer Ready Event', () => {
    it('should render options when koppen:layer-ready event fires', () => {
      // Initially should show loading
      const loadingBefore = builderPanel.querySelector('.builder-panel__loading');
      expect(loadingBefore).toBeDefined();

      // Fire layer ready event (hybrid loading system)
      document.dispatchEvent(new CustomEvent('koppen:layer-ready'));

      // Should now show options
      const options = builderPanel.querySelector('.builder-panel__options');
      expect(options).toBeDefined();
    });
  });

  describe('Fork Classification Event', () => {
    beforeEach(() => {
      document.dispatchEvent(new CustomEvent('koppen:data-loaded'));
    });

    it('should handle koppen:fork-requested event', () => {
      builderModule.open();

      const mockClassification = {
        name: 'Forked Classification',
        thresholds: {
          temperature: { tropical_min: { value: 20 } },
        },
      };

      document.dispatchEvent(new CustomEvent('koppen:fork-requested', {
        detail: {
          classification: mockClassification,
          sourceURL: 'https://example.com/share/123',
        },
      }));

      // Should open the builder if closed and start editing the forked classification
      expect(builderModule.isOpen()).toBe(true);
    });

    it('should ignore fork event with no classification', () => {
      document.dispatchEvent(new CustomEvent('koppen:fork-requested', {
        detail: {},
      }));

      // Should not throw and not change state
      expect(builderModule.isOpen()).toBe(false);
    });

    it('should handle fork event when builder is closed', () => {
      const mockClassification = {
        name: 'Forked',
        thresholds: {
          temperature: { tropical_min: { value: 20 } },
        },
      };

      expect(builderModule.isOpen()).toBe(false);

      document.dispatchEvent(new CustomEvent('koppen:fork-requested', {
        detail: {
          classification: mockClassification,
        },
      }));

      // Should open the builder
      expect(builderModule.isOpen()).toBe(true);
    });
  });

  describe('Escape Key Handling', () => {
    it('should not close when Escape pressed and builder is closed', () => {
      expect(builderModule.isOpen()).toBe(false);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(builderModule.isOpen()).toBe(false);
    });

    it('should not react to non-Escape keys', () => {
      builderModule.open();

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(enterEvent);

      expect(builderModule.isOpen()).toBe(true);
    });
  });

  describe('Close Panels Edge Cases', () => {
    it('should handle close-panels event with null detail', () => {
      builderModule.open();

      document.dispatchEvent(new CustomEvent('koppen:close-panels', {
        detail: null,
      }));

      expect(builderModule.isOpen()).toBe(false);
    });

    it('should handle close-panels event with other exception', () => {
      builderModule.open();

      document.dispatchEvent(new CustomEvent('koppen:close-panels', {
        detail: { except: 'legend' },
      }));

      // Should close because exception is not 'builder'
      expect(builderModule.isOpen()).toBe(false);
    });
  });

  describe('Köppen Preset Integration (Story 4.2)', () => {
    beforeEach(() => {
      // Ensure data is loaded
      document.dispatchEvent(new CustomEvent('koppen:data-loaded'));
    });

    it('should load preset and show attribution when Köppen button clicked', async () => {
      builderModule.open();

      const koppenBtn = document.getElementById('start-from-koppen') as HTMLButtonElement;
      expect(koppenBtn).toBeTruthy();

      const eventListener = vi.fn();
      document.addEventListener('koppen:preset-loaded', eventListener);

      koppenBtn.click();

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should fire event
      expect(eventListener).toHaveBeenCalled();

      // Should show attribution
      const attribution = builderPanel.querySelector('.builder-panel__attribution');
      expect(attribution).toBeTruthy();
      expect(attribution?.textContent).toContain('Köppen-Geiger');
      expect(attribution?.textContent).toContain('Beck et al. 2018');

      document.removeEventListener('koppen:preset-loaded', eventListener);
    });

    it('should show threshold sliders after preset loads (Story 4.3)', async () => {
      builderModule.open();

      const koppenBtn = document.getElementById('start-from-koppen') as HTMLButtonElement;
      koppenBtn.click();

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 50));

      const sliders = builderPanel.querySelector('.threshold-sliders');
      expect(sliders).toBeTruthy();

      // Should have temperature and precipitation groups
      const tempGroup = builderPanel.querySelector('.threshold-group');
      expect(tempGroup).toBeTruthy();

      // Should have individual sliders
      const slider = builderPanel.querySelector('.threshold-slider');
      expect(slider).toBeTruthy();
    });

    it('should show help message when Scratch button clicked', async () => {
      builderModule.open();

      const scratchBtn = document.getElementById('start-from-scratch') as HTMLButtonElement;
      expect(scratchBtn).toBeTruthy();

      scratchBtn.click();

      // Wait for async dynamic import to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should show help message for scratch mode (Story 4.6)
      const helpMessage = builderPanel.querySelector('.builder-panel__help');
      expect(helpMessage).toBeTruthy();
      expect(helpMessage?.textContent).toContain('Create categories and define rules');
    });
  });
});
