/**
 * Confirm Dialog Component - C.3 Remediation
 * Replaces native alert() and confirm() with accessible custom dialogs
 * @module ui/confirm-dialog
 */

import logger from '../utils/logger.js';

let activeDialog = null;

/**
 * Create the dialog element structure
 * @param {Object} options - Dialog options
 * @returns {HTMLElement} Dialog element
 */
function createDialogElement(options) {
  const {
    title = 'Confirm',
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = false,
    type = 'info', // 'info', 'warning', 'error', 'success'
  } = options;

  const dialog = document.createElement('div');
  dialog.className = `confirm-dialog confirm-dialog--${type}`;
  dialog.setAttribute('role', 'alertdialog');
  dialog.setAttribute('aria-labelledby', 'confirm-dialog-title');
  dialog.setAttribute('aria-describedby', 'confirm-dialog-message');
  dialog.setAttribute('aria-modal', 'true');

  // Icon based on type
  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅',
  };

  // Security note: icons[type] is safe (internal enum), user inputs are escaped via escapeHtml()
  /* eslint-disable security/detect-object-injection */
  const iconHtml = icons[type] || icons.info;
  /* eslint-enable security/detect-object-injection */

  dialog.innerHTML = `
    <div class="confirm-dialog__backdrop" aria-hidden="true"></div>
    <div class="confirm-dialog__content">
      <div class="confirm-dialog__header">
        <span class="confirm-dialog__icon" aria-hidden="true">${iconHtml}</span>
        <h2 id="confirm-dialog-title" class="confirm-dialog__title">${escapeHtml(title)}</h2>
      </div>
      <p id="confirm-dialog-message" class="confirm-dialog__message">${escapeHtml(message)}</p>
      <div class="confirm-dialog__actions">
        ${showCancel ? `<button type="button" class="confirm-dialog__btn confirm-dialog__btn--cancel">${escapeHtml(cancelText)}</button>` : ''}
        <button type="button" class="confirm-dialog__btn confirm-dialog__btn--confirm">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  return dialog;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show dialog and return promise
 * @param {Object} options - Dialog options
 * @returns {Promise<boolean>} Resolves true if confirmed, false if cancelled
 */
function showDialog(options) {
  return new Promise((resolve) => {
    // Close any existing dialog
    if (activeDialog) {
      closeDialog(activeDialog, false);
    }

    const dialog = createDialogElement(options);
    document.body.appendChild(dialog);
    activeDialog = dialog;

    // Get buttons
    const confirmBtn = dialog.querySelector('.confirm-dialog__btn--confirm');
    const cancelBtn = dialog.querySelector('.confirm-dialog__btn--cancel');
    const backdrop = dialog.querySelector('.confirm-dialog__backdrop');

    // Focus trap - focus confirm button
    setTimeout(() => {
      confirmBtn.focus();
    }, 10);

    // Handle confirm
    confirmBtn.addEventListener('click', () => {
      closeDialog(dialog, true);
      resolve(true);
    });

    // Handle cancel
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        closeDialog(dialog, false);
        resolve(false);
      });
    }

    // Handle backdrop click (cancel)
    backdrop.addEventListener('click', () => {
      closeDialog(dialog, false);
      resolve(false);
    });

    // Handle Escape key
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeDialog(dialog, false);
        resolve(false);
      }
      // Trap tab focus within dialog
      if (e.key === 'Tab') {
        const focusableElements = dialog.querySelectorAll('button');
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);

    // Store cleanup function
    dialog._cleanup = () => {
      document.removeEventListener('keydown', handleKeydown);
    };

    // Animate in
    requestAnimationFrame(() => {
      dialog.classList.add('confirm-dialog--visible');
    });

    logger.log('[Koppen] Confirm dialog shown:', options.title);
  });
}

/**
 * Close dialog
 * @param {HTMLElement} dialog - Dialog element
 * @param {boolean} confirmed - Whether user confirmed
 */
function closeDialog(dialog, confirmed) {
  if (!dialog) return;

  // Run cleanup
  if (dialog._cleanup) {
    dialog._cleanup();
  }

  // Animate out
  dialog.classList.remove('confirm-dialog--visible');

  // Remove after animation
  setTimeout(() => {
    if (dialog.parentNode) {
      dialog.parentNode.removeChild(dialog);
    }
    if (activeDialog === dialog) {
      activeDialog = null;
    }
  }, 200);

  logger.log('[Koppen] Confirm dialog closed:', confirmed ? 'confirmed' : 'cancelled');
}

/**
 * Show an alert dialog (info message with OK button)
 * Replacement for native alert()
 * @param {string} message - Message to display
 * @param {Object} [options] - Additional options
 * @returns {Promise<void>} Resolves when dismissed
 */
export async function showAlert(message, options = {}) {
  await showDialog({
    title: options.title || 'Alert',
    message,
    confirmText: options.confirmText || 'OK',
    showCancel: false,
    type: options.type || 'info',
  });
}

/**
 * Show an error alert
 * @param {string} message - Error message
 * @param {Object} [options] - Additional options
 * @returns {Promise<void>}
 */
export async function showError(message, options = {}) {
  await showAlert(message, {
    title: options.title || 'Error',
    type: 'error',
    ...options,
  });
}

/**
 * Show a confirm dialog (message with OK/Cancel)
 * Replacement for native confirm()
 * @param {string} message - Message to display
 * @param {Object} [options] - Additional options
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
export async function showConfirm(message, options = {}) {
  return showDialog({
    title: options.title || 'Confirm',
    message,
    confirmText: options.confirmText || 'OK',
    cancelText: options.cancelText || 'Cancel',
    showCancel: true,
    type: options.type || 'warning',
  });
}

/**
 * Initialize confirm dialog module
 */
export function init() {
  logger.log('[Koppen] Confirm dialog module initialized');
}

/**
 * Destroy confirm dialog (cleanup)
 */
export function destroy() {
  if (activeDialog) {
    closeDialog(activeDialog, false);
  }
}

export default {
  init,
  destroy,
  showAlert,
  showError,
  showConfirm,
};
