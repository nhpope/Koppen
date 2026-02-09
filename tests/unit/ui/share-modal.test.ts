/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock url-encoder
vi.mock('../../../src/export/url-encoder.js', () => ({
  generateURL: vi.fn((state) => {
    if (!state) throw new Error('No state provided');
    if (state.error) throw new Error(state.error);
    return `https://example.com/?name=${encodeURIComponent(state.name || 'Test')}&data=encoded`;
  }),
}));

// Mock logger
vi.mock('../../../src/utils/logger.js', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// C.3: Mock confirm-dialog module
const mockShowError = vi.fn();
vi.mock('../../../src/ui/confirm-dialog.js', () => ({
  showError: (...args: unknown[]) => mockShowError(...args),
}));

// Import module after mocks
import {
  init,
  open,
  close,
  destroy,
  isModalOpen,
  getCurrentURL,
} from '../../../src/ui/share-modal.js';
import { generateURL } from '../../../src/export/url-encoder.js';

describe('Share Modal Module (Story 6.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clean up any existing modals
    destroy();

    // Reset clipboard mock
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    destroy();
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize without error', () => {
      expect(() => init()).not.toThrow();
    });

    it('should listen for ESC key to close modal', () => {
      init();
      open({ name: 'Test Classification' });

      expect(isModalOpen()).toBe(true);

      // Simulate ESC key
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(isModalOpen()).toBe(false);
    });

    it('should listen for close-panels event', () => {
      init();
      open({ name: 'Test Classification' });

      expect(isModalOpen()).toBe(true);

      // Dispatch close-panels event (not for share)
      document.dispatchEvent(new CustomEvent('koppen:close-panels', {
        detail: { except: 'legend' },
      }));

      expect(isModalOpen()).toBe(false);
    });

    it('should not close when close-panels event excludes share', () => {
      init();
      open({ name: 'Test Classification' });

      expect(isModalOpen()).toBe(true);

      // Dispatch close-panels event excluding share
      document.dispatchEvent(new CustomEvent('koppen:close-panels', {
        detail: { except: 'share' },
      }));

      expect(isModalOpen()).toBe(true);
    });
  });

  describe('open', () => {
    it('should create and display modal', () => {
      open({ name: 'Test Classification' });

      const modal = document.getElementById('share-modal');
      expect(modal).not.toBeNull();
      expect(modal?.classList.contains('share-modal--active')).toBe(true);
      expect(isModalOpen()).toBe(true);
    });

    it('should call generateURL with state', () => {
      const state = { name: 'My Classification', thresholds: { TMIN: 18 } };
      open(state);

      expect(generateURL).toHaveBeenCalledWith(state);
    });

    it('should set aria-hidden to false when open', () => {
      open({ name: 'Test' });

      const modal = document.getElementById('share-modal');
      expect(modal?.getAttribute('aria-hidden')).toBe('false');
    });

    it('should set aria-modal attribute', () => {
      open({ name: 'Test' });

      const modal = document.getElementById('share-modal');
      expect(modal?.getAttribute('aria-modal')).toBe('true');
    });

    it('should set role to dialog', () => {
      open({ name: 'Test' });

      const modal = document.getElementById('share-modal');
      expect(modal?.getAttribute('role')).toBe('dialog');
    });

    it('should not open again if already open', () => {
      open({ name: 'Test' });
      const firstModal = document.getElementById('share-modal');

      open({ name: 'Another' });

      // Should still only be one modal
      const modals = document.querySelectorAll('#share-modal');
      expect(modals.length).toBe(1);
      expect(firstModal).toBe(modals[0]);
    });

    it('should render title in header', () => {
      open({ name: 'Test' });

      const title = document.getElementById('share-modal-title');
      expect(title).not.toBeNull();
      expect(title?.textContent).toBe('Share Classification');
    });

    it('should render URL input with generated URL', () => {
      open({ name: 'Test Classification' });

      const urlInput = document.querySelector('[data-share-url]') as HTMLInputElement;
      expect(urlInput).not.toBeNull();
      expect(urlInput?.value).toContain('https://example.com/');
      expect(urlInput?.readOnly).toBe(true);
    });

    it('should render copy button', () => {
      open({ name: 'Test' });

      const copyBtn = document.querySelector('[data-share-copy]');
      expect(copyBtn).not.toBeNull();
      expect(copyBtn?.textContent).toContain('Copy');
    });

    it('should render close button', () => {
      open({ name: 'Test' });

      const closeBtn = document.querySelector('[data-share-close]');
      expect(closeBtn).not.toBeNull();
      expect(closeBtn?.textContent).toBe('×');
    });

    it('should dispatch koppen:share-opened event', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:share-opened', eventListener);

      open({ name: 'Test' });

      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail).toHaveProperty('url');
      expect(eventListener.mock.calls[0][0].detail).toHaveProperty('urlSize');

      document.removeEventListener('koppen:share-opened', eventListener);
    });

    it('should dispatch koppen:close-panels event', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:close-panels', eventListener);

      open({ name: 'Test' });

      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail.except).toBe('share');

      document.removeEventListener('koppen:close-panels', eventListener);
    });

    it('should show URL size in meta info', () => {
      open({ name: 'Test' });

      const meta = document.querySelector('.share-modal__meta-item');
      expect(meta).not.toBeNull();
      expect(meta?.textContent).toContain('URL Size:');
      expect(meta?.textContent).toContain('characters');
    });

    it('should show warning for long URLs (> 1500 chars)', () => {
      // Mock generateURL to return a long URL
      vi.mocked(generateURL).mockReturnValueOnce('x'.repeat(1600));

      open({ name: 'Test' });

      const warning = document.querySelector('.share-modal__warning');
      expect(warning).not.toBeNull();
      expect(warning?.textContent).toContain('URL is getting long');
    });

    it('should not show warning for short URLs', () => {
      open({ name: 'Test' });

      const warning = document.querySelector('.share-modal__warning');
      expect(warning).toBeNull();
    });

    it('should handle generateURL errors gracefully', async () => {
      vi.mocked(generateURL).mockImplementationOnce(() => {
        throw new Error('Encoding failed');
      });

      mockShowError.mockResolvedValue(undefined);

      const eventListener = vi.fn();
      document.addEventListener('koppen:share-failed', eventListener);

      await open({ name: 'Test' });

      expect(mockShowError).toHaveBeenCalledWith(
        'Failed to generate share URL: Encoding failed',
        { title: 'Share Error' },
      );
      expect(eventListener).toHaveBeenCalled();
      expect(isModalOpen()).toBe(false);

      document.removeEventListener('koppen:share-failed', eventListener);
    });

    it('should store current URL', () => {
      open({ name: 'Test' });

      const url = getCurrentURL();
      expect(url).not.toBeNull();
      expect(url).toContain('https://example.com/');
    });
  });

  describe('close', () => {
    beforeEach(() => {
      open({ name: 'Test' });
    });

    it('should hide modal', () => {
      close();

      const modal = document.getElementById('share-modal');
      expect(modal?.classList.contains('share-modal--active')).toBe(false);
      expect(isModalOpen()).toBe(false);
    });

    it('should set aria-hidden to true', () => {
      close();

      const modal = document.getElementById('share-modal');
      expect(modal?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should clear current URL', () => {
      expect(getCurrentURL()).not.toBeNull();

      close();

      expect(getCurrentURL()).toBeNull();
    });

    it('should dispatch koppen:share-closed event', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:share-closed', eventListener);

      close();

      expect(eventListener).toHaveBeenCalled();

      document.removeEventListener('koppen:share-closed', eventListener);
    });

    it('should do nothing if not open', () => {
      close();
      expect(isModalOpen()).toBe(false);

      // Should not throw
      expect(() => close()).not.toThrow();
    });
  });

  describe('close button interactions', () => {
    it('should close modal when close button clicked', () => {
      open({ name: 'Test' });

      const closeBtn = document.querySelector('[data-share-close]') as HTMLButtonElement;
      closeBtn?.click();

      expect(isModalOpen()).toBe(false);
    });

    it('should close modal when backdrop clicked', () => {
      open({ name: 'Test' });

      const backdrop = document.querySelector('.share-modal__backdrop') as HTMLDivElement;
      backdrop?.click();

      expect(isModalOpen()).toBe(false);
    });
  });

  describe('URL input interactions', () => {
    it('should select all text when URL input clicked', () => {
      open({ name: 'Test' });

      const urlInput = document.querySelector('[data-share-url]') as HTMLInputElement;
      const selectSpy = vi.spyOn(urlInput, 'select');

      urlInput?.click();

      expect(selectSpy).toHaveBeenCalled();
    });
  });

  describe('copy to clipboard', () => {
    it('should copy URL using Clipboard API', async () => {
      open({ name: 'Test' });

      const copyBtn = document.querySelector('[data-share-copy]') as HTMLButtonElement;
      copyBtn?.click();

      // Wait for async operation
      await vi.waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it('should dispatch koppen:url-copied event on success', async () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:url-copied', eventListener);

      open({ name: 'Test' });

      const copyBtn = document.querySelector('[data-share-copy]') as HTMLButtonElement;
      copyBtn?.click();

      await vi.waitFor(() => {
        expect(eventListener).toHaveBeenCalled();
        expect(eventListener.mock.calls[0][0].detail).toHaveProperty('url');
      });

      document.removeEventListener('koppen:url-copied', eventListener);
    });

    it('should show success feedback after copying', async () => {
      open({ name: 'Test' });

      const copyBtn = document.querySelector('[data-share-copy]') as HTMLButtonElement;
      const originalText = copyBtn.textContent;

      copyBtn?.click();

      await vi.waitFor(() => {
        expect(copyBtn.textContent).toContain('Copied!');
        expect(copyBtn.classList.contains('share-modal__copy-btn--success')).toBe(true);
      });
    });

    it('should revert button text after success feedback', async () => {
      vi.useFakeTimers();

      open({ name: 'Test' });

      const copyBtn = document.querySelector('[data-share-copy]') as HTMLButtonElement;
      copyBtn?.click();

      // Wait for click handler
      await Promise.resolve();

      // Advance past the 2000ms timeout
      vi.advanceTimersByTime(2100);

      expect(copyBtn.textContent).not.toContain('Copied!');
      expect(copyBtn.classList.contains('share-modal__copy-btn--success')).toBe(false);

      vi.useRealTimers();
    });

    it('should use execCommand fallback when Clipboard API unavailable', async () => {
      // Remove clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock execCommand since jsdom doesn't have it
      const execCommandMock = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;

      open({ name: 'Test' });

      const copyBtn = document.querySelector('[data-share-copy]') as HTMLButtonElement;
      copyBtn?.click();

      expect(execCommandMock).toHaveBeenCalledWith('copy');
    });

    it('should show error feedback on copy failure', async () => {
      // Make clipboard API fail
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
        },
        writable: true,
        configurable: true,
      });

      const eventListener = vi.fn();
      document.addEventListener('koppen:url-copy-failed', eventListener);

      open({ name: 'Test' });

      const copyBtn = document.querySelector('[data-share-copy]') as HTMLButtonElement;
      copyBtn?.click();

      await vi.waitFor(() => {
        expect(copyBtn.textContent).toContain('Failed');
        expect(copyBtn.classList.contains('share-modal__copy-btn--error')).toBe(true);
        expect(eventListener).toHaveBeenCalled();
      });

      document.removeEventListener('koppen:url-copy-failed', eventListener);
    });
  });

  describe('destroy', () => {
    it('should remove modal from DOM', () => {
      open({ name: 'Test' });
      expect(document.getElementById('share-modal')).not.toBeNull();

      destroy();

      expect(document.getElementById('share-modal')).toBeNull();
    });

    it('should reset state', () => {
      open({ name: 'Test' });

      destroy();

      expect(isModalOpen()).toBe(false);
      expect(getCurrentURL()).toBeNull();
    });

    it('should handle destroy when no modal exists', () => {
      expect(() => destroy()).not.toThrow();
    });
  });

  describe('isModalOpen', () => {
    it('should return false initially', () => {
      expect(isModalOpen()).toBe(false);
    });

    it('should return true when open', () => {
      open({ name: 'Test' });
      expect(isModalOpen()).toBe(true);
    });

    it('should return false after close', () => {
      open({ name: 'Test' });
      close();
      expect(isModalOpen()).toBe(false);
    });
  });

  describe('getCurrentURL', () => {
    it('should return null when no URL generated', () => {
      expect(getCurrentURL()).toBeNull();
    });

    it('should return URL when modal open', () => {
      open({ name: 'Test' });

      const url = getCurrentURL();
      expect(url).not.toBeNull();
      expect(typeof url).toBe('string');
    });

    it('should return null after modal closed', () => {
      open({ name: 'Test' });
      close();

      expect(getCurrentURL()).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labelledby', () => {
      open({ name: 'Test' });

      const modal = document.getElementById('share-modal');
      expect(modal?.getAttribute('aria-labelledby')).toBe('share-modal-title');
    });

    it('should have aria-label on URL input', () => {
      open({ name: 'Test' });

      const urlInput = document.querySelector('[data-share-url]');
      expect(urlInput?.getAttribute('aria-label')).toBe('Shareable URL');
    });

    it('should have aria-label on copy button', () => {
      open({ name: 'Test' });

      const copyBtn = document.querySelector('[data-share-copy]');
      expect(copyBtn?.getAttribute('aria-label')).toBe('Copy URL to clipboard');
    });

    it('should have aria-label on close button', () => {
      open({ name: 'Test' });

      const closeBtn = document.querySelector('[data-share-close]');
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close share modal');
    });
  });

  describe('Modal content structure', () => {
    beforeEach(() => {
      open({ name: 'Test' });
    });

    it('should have backdrop element', () => {
      expect(document.querySelector('.share-modal__backdrop')).not.toBeNull();
    });

    it('should have content container', () => {
      expect(document.querySelector('.share-modal__content')).not.toBeNull();
    });

    it('should have header section', () => {
      expect(document.querySelector('.share-modal__header')).not.toBeNull();
    });

    it('should have body section', () => {
      expect(document.querySelector('.share-modal__body')).not.toBeNull();
    });

    it('should have description text', () => {
      const description = document.querySelector('.share-modal__description');
      expect(description).not.toBeNull();
      expect(description?.textContent).toContain('Copy the link below');
    });

    it('should have URL container', () => {
      expect(document.querySelector('.share-modal__url-container')).not.toBeNull();
    });
  });

  describe('Re-opening modal', () => {
    it('should update content when reopened with different state', () => {
      open({ name: 'First' });
      close();

      vi.mocked(generateURL).mockReturnValueOnce('https://example.com/?name=Second');
      open({ name: 'Second' });

      const urlInput = document.querySelector('[data-share-url]') as HTMLInputElement;
      expect(urlInput.value).toContain('Second');
    });

    it('should reuse existing modal element', () => {
      open({ name: 'First' });
      const firstModal = document.getElementById('share-modal');
      close();

      open({ name: 'Second' });
      const secondModal = document.getElementById('share-modal');

      expect(firstModal).toBe(secondModal);
    });
  });
});
