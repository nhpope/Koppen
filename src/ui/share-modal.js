/**
 * Share Modal Component - Story 6.3
 * Modal for sharing classification via URL with clipboard copy
 * @module ui/share-modal
 */

import { generateURL } from '../export/url-encoder.js';
import logger from '../utils/logger.js';

let modalElement = null;
let isOpen = false;
let currentURL = null;
let copyButton = null;

/**
 * Create share modal element
 * @returns {HTMLElement} Modal element
 */
function createModalElement() {
  const modal = document.createElement('div');
  modal.id = 'share-modal';
  modal.className = 'share-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'share-modal-title');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-hidden', 'true');

  // Modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'share-modal__backdrop';
  backdrop.addEventListener('click', () => close());

  // Modal content
  const content = document.createElement('div');
  content.className = 'share-modal__content';

  modal.appendChild(backdrop);
  modal.appendChild(content);

  return modal;
}

/**
 * Render modal content
 * @param {string} url - Shareable URL
 * @param {number} urlSize - URL size in characters
 */
function renderContent(url, urlSize) {
  if (!modalElement) return;

  const content = modalElement.querySelector('.share-modal__content');
  if (!content) return;

  // Clear existing content
  while (content.firstChild) {
    content.removeChild(content.firstChild);
  }

  // Header
  const header = document.createElement('div');
  header.className = 'share-modal__header';

  const title = document.createElement('h2');
  title.id = 'share-modal-title';
  title.className = 'share-modal__title';
  title.textContent = 'Share Classification';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'share-modal__close';
  closeBtn.setAttribute('aria-label', 'Close share modal');
  closeBtn.setAttribute('data-share-close', '');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => close());

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Body
  const body = document.createElement('div');
  body.className = 'share-modal__body';

  const description = document.createElement('p');
  description.className = 'share-modal__description';
  description.textContent = 'Copy the link below to share your custom classification. Anyone with this link can view and modify your settings.';

  // URL container
  const urlContainer = document.createElement('div');
  urlContainer.className = 'share-modal__url-container';

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.className = 'share-modal__url-input';
  urlInput.value = url;
  urlInput.readOnly = true;
  urlInput.setAttribute('aria-label', 'Shareable URL');
  urlInput.setAttribute('data-share-url', '');
  urlInput.addEventListener('click', () => {
    urlInput.select();
  });

  copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.className = 'share-modal__copy-btn';
  copyButton.setAttribute('data-share-copy', '');
  copyButton.setAttribute('aria-label', 'Copy URL to clipboard');
  copyButton.textContent = '📋 Copy';
  copyButton.addEventListener('click', () => copyToClipboard(url));

  urlContainer.appendChild(urlInput);
  urlContainer.appendChild(copyButton);

  // Meta info
  const meta = document.createElement('div');
  meta.className = 'share-modal__meta';

  const metaItem = document.createElement('span');
  metaItem.className = 'share-modal__meta-item';
  metaItem.textContent = `URL Size: ${urlSize} / 2000 characters`;

  meta.appendChild(metaItem);

  if (urlSize > 1500) {
    const warning = document.createElement('span');
    warning.className = 'share-modal__warning';
    warning.textContent = '⚠️ URL is getting long';
    meta.appendChild(warning);
  }

  // Assemble body
  body.appendChild(description);
  body.appendChild(urlContainer);
  body.appendChild(meta);

  // Assemble modal
  content.appendChild(header);
  content.appendChild(body);

  // Focus the copy button when modal opens
  setTimeout(() => {
    if (copyButton) copyButton.focus();
  }, 100);
}

/**
 * Copy URL to clipboard
 * Uses Clipboard API with fallback
 * @param {string} url - URL to copy
 */
async function copyToClipboard(url) {
  if (!copyButton) return;

  try {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      showCopySuccess();
    } else {
      // Fallback: select and copy
      const urlInput = modalElement.querySelector('[data-share-url]');
      if (urlInput) {
        urlInput.select();
        document.execCommand('copy');
        showCopySuccess();
      } else {
        throw new Error('No input element found');
      }
    }

    // Fire success event
    document.dispatchEvent(new CustomEvent('koppen:url-copied', {
      detail: { url },
    }));
  } catch (error) {
    console.error('[Koppen] Failed to copy URL:', error);
    showCopyError();

    // Fire error event
    document.dispatchEvent(new CustomEvent('koppen:url-copy-failed', {
      detail: { error: error.message },
    }));
  }
}

/**
 * Show copy success feedback
 */
function showCopySuccess() {
  if (!copyButton) return;

  const originalText = copyButton.textContent;
  copyButton.textContent = '✓ Copied!';
  copyButton.classList.add('share-modal__copy-btn--success');

  setTimeout(() => {
    copyButton.textContent = originalText;
    copyButton.classList.remove('share-modal__copy-btn--success');
  }, 2000);
}

/**
 * Show copy error feedback
 */
function showCopyError() {
  if (!copyButton) return;

  const originalText = copyButton.textContent;
  copyButton.textContent = '✗ Failed';
  copyButton.classList.add('share-modal__copy-btn--error');

  setTimeout(() => {
    copyButton.textContent = originalText;
    copyButton.classList.remove('share-modal__copy-btn--error');
  }, 2000);
}

/**
 * Open share modal with classification state
 * @param {Object} state - Classification state
 * @param {string} state.name - Classification name
 * @param {Object} state.thresholds - Threshold values
 */
export function open(state) {
  if (isOpen) return;

  try {
    // Generate shareable URL
    const url = generateURL(state);
    const urlSize = url.length;

    // Create modal if doesn't exist
    if (!modalElement) {
      modalElement = createModalElement();
      document.body.appendChild(modalElement);
    }

    // Render content
    renderContent(url, urlSize);
    currentURL = url;

    // Show modal
    isOpen = true;
    modalElement.classList.add('share-modal--active');
    modalElement.setAttribute('aria-hidden', 'false');

    // Close other panels
    document.dispatchEvent(new CustomEvent('koppen:close-panels', {
      detail: { except: 'share' },
    }));

    // Fire event
    document.dispatchEvent(new CustomEvent('koppen:share-opened', {
      detail: { url, urlSize },
    }));
  } catch (error) {
    console.error('[Koppen] Failed to open share modal:', error);

    // Show error to user
    alert(`Failed to generate share URL: ${error.message}`);

    // Fire error event
    document.dispatchEvent(new CustomEvent('koppen:share-failed', {
      detail: { error: error.message },
    }));
  }
}

/**
 * Close share modal
 */
export function close() {
  if (!isOpen || !modalElement) return;

  isOpen = false;
  modalElement.classList.remove('share-modal--active');
  modalElement.setAttribute('aria-hidden', 'true');
  currentURL = null;
  copyButton = null;

  // Fire event
  document.dispatchEvent(new CustomEvent('koppen:share-closed'));
}

/**
 * Initialize share modal
 */
export function init() {
  // Listen for ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  });

  // Listen for close-panels event
  document.addEventListener('koppen:close-panels', (e) => {
    if (e.detail?.except !== 'share') {
      close();
    }
  });

  logger.log('[Koppen] Share modal initialized');
}

/**
 * Destroy share modal
 */
export function destroy() {
  if (modalElement && modalElement.parentNode) {
    modalElement.parentNode.removeChild(modalElement);
  }
  modalElement = null;
  isOpen = false;
  currentURL = null;
  copyButton = null;
}

/**
 * Check if modal is open
 * @returns {boolean} True if open
 */
export function isModalOpen() {
  return isOpen;
}

/**
 * Get current shareable URL
 * @returns {string|null} Current URL or null
 */
export function getCurrentURL() {
  return currentURL;
}

export default {
  init,
  open,
  close,
  destroy,
  isModalOpen,
  getCurrentURL,
};
