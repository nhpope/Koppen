/**
 * Shared Info Bar Component - Story 6.4
 * Displays notification when viewing a shared classification from URL
 * @module ui/shared-info-bar
 */

import builder from '../builder/index.js';  // Story 6.6

let infoBar = null;
let isVisible = false;
let currentSharedClassification = null; // Store shared classification for forking

/**
 * Sanitize classification name to prevent XSS
 * @param {string} name - Classification name
 * @returns {string} Sanitized name
 */
function sanitizeName(name) {
  if (typeof name !== 'string') return 'Shared Classification';

  // Remove HTML tags and control characters
  return name
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 100) || 'Shared Classification';
}

/**
 * Create info bar element
 * @returns {HTMLElement} Info bar element
 */
function createInfoBarElement() {
  const bar = document.createElement('div');
  bar.id = 'shared-info-bar';
  bar.className = 'shared-info-bar';
  bar.setAttribute('role', 'status');
  bar.setAttribute('aria-live', 'polite');

  return bar;
}

/**
 * Render info bar content
 * @param {string} classificationName - Name of shared classification
 */
function renderContent(classificationName) {
  if (!infoBar) return;

  // Clear existing content
  while (infoBar.firstChild) {
    infoBar.removeChild(infoBar.firstChild);
  }

  // Sanitize name
  const safeName = sanitizeName(classificationName);

  // Icon
  const icon = document.createElement('span');
  icon.className = 'shared-info-bar__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '🔗';

  // Text
  const text = document.createElement('span');
  text.className = 'shared-info-bar__text';
  text.textContent = `Viewing: ${safeName} by Anonymous`;

  // Fork button (Story 6.6)
  const forkBtn = document.createElement('button');
  forkBtn.type = 'button';
  forkBtn.className = 'shared-info-bar__fork-btn';
  forkBtn.setAttribute('data-fork-classification', '');
  forkBtn.setAttribute('aria-label', 'Create your own editable version of this classification');
  forkBtn.textContent = 'Create Your Own Version';
  forkBtn.addEventListener('click', async () => {
    await handleFork(forkBtn);
  });

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'shared-info-bar__close';
  closeBtn.setAttribute('aria-label', 'Dismiss notification');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => dismiss());

  // Assemble
  infoBar.appendChild(icon);
  infoBar.appendChild(text);
  infoBar.appendChild(forkBtn);
  infoBar.appendChild(closeBtn);
}

/**
 * Handle fork button click (Story 6.6)
 * @param {HTMLButtonElement} forkBtn - Fork button element
 */
async function handleFork(forkBtn) {
  try {
    if (!currentSharedClassification) {
      console.error('[Koppen] No shared classification to fork');
      return;
    }

    // Disable button during fork
    forkBtn.disabled = true;
    forkBtn.textContent = 'Creating...';

    // Get source URL
    const sourceURL = window.location.href;

    // Fork classification using builder
    builder.forkClassification(currentSharedClassification, sourceURL);

    // Dismiss info bar (user is now editing their fork)
    dismiss();

    // Show success feedback
    console.log('[Koppen] Fork completed successfully');

    // Fire fork completed event
    document.dispatchEvent(new CustomEvent('koppen:fork-completed', {
      detail: { sourceURL },
    }));

  } catch (error) {
    console.error('[Koppen] Fork failed:', error);

    // Re-enable button
    forkBtn.disabled = false;
    forkBtn.textContent = 'Create Your Own Version';

    // Show error
    alert(`Failed to create your own version: ${error.message}`);
  }
}

/**
 * Show info bar with classification name
 * @param {string} classificationName - Name of shared classification
 * @param {Object} [classification=null] - Full classification object for forking
 */
export function show(classificationName = 'Shared Classification', classification = null) {
  // Check if user previously dismissed (session storage)
  const dismissed = sessionStorage.getItem('koppen:shared-info-dismissed');
  if (dismissed === 'true') {
    return;
  }

  // Store classification for forking (Story 6.6)
  currentSharedClassification = classification;

  // Create bar if doesn't exist
  if (!infoBar) {
    infoBar = createInfoBarElement();
    document.body.appendChild(infoBar);
  }

  // Render content
  renderContent(classificationName);

  // Show bar
  isVisible = true;
  infoBar.classList.add('shared-info-bar--visible');

  // Fire event
  document.dispatchEvent(new CustomEvent('koppen:shared-info-shown', {
    detail: { name: classificationName },
  }));
}

/**
 * Dismiss info bar
 */
export function dismiss() {
  if (!infoBar || !isVisible) return;

  isVisible = false;
  infoBar.classList.remove('shared-info-bar--visible');

  // Store dismissal in session
  sessionStorage.setItem('koppen:shared-info-dismissed', 'true');

  // Fire event
  document.dispatchEvent(new CustomEvent('koppen:shared-info-dismissed'));
}

/**
 * Check if info bar is visible
 * @returns {boolean} True if visible
 */
export function isInfoBarVisible() {
  return isVisible;
}

/**
 * Initialize shared info bar
 */
export function init() {
  // Listen for shared classification loaded
  document.addEventListener('koppen:rules-loaded', (e) => {
    if (e.detail?.source === 'url') {
      show(e.detail.name);
    }
  });

  console.log('[Koppen] Shared info bar initialized');
}

/**
 * Destroy shared info bar
 */
export function destroy() {
  if (infoBar && infoBar.parentNode) {
    infoBar.parentNode.removeChild(infoBar);
  }
  infoBar = null;
  isVisible = false;
}

export default {
  init,
  show,
  dismiss,
  destroy,
  isInfoBarVisible,
};
