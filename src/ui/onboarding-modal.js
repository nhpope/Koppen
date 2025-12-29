/**
 * Onboarding Modal - First-time user guidance
 * @module ui/onboarding-modal
 */

const STORAGE_KEY = 'koppen-onboarding-seen';
let modalElement = null;

/**
 * Initialize onboarding modal
 */
export function init() {
  // Check if user has seen onboarding before
  const hasSeenOnboarding = localStorage.getItem(STORAGE_KEY);

  if (!hasSeenOnboarding) {
    // Show onboarding after a brief delay to let the map load
    setTimeout(() => {
      show();
    }, 1000);
  }

  console.log('[Koppen] Onboarding modal initialized');
}

/**
 * Show the onboarding modal
 */
export function show() {
  if (modalElement) return; // Already showing

  modalElement = document.createElement('div');
  modalElement.className = 'onboarding-modal';
  modalElement.setAttribute('role', 'dialog');
  modalElement.setAttribute('aria-labelledby', 'onboarding-title');
  modalElement.setAttribute('aria-modal', 'true');

  modalElement.innerHTML = `
    <div class="onboarding-modal__backdrop" aria-hidden="true"></div>
    <div class="onboarding-modal__content">
      <h2 id="onboarding-title" class="onboarding-modal__title">Welcome to Köppen Climate Explorer</h2>

      <div class="onboarding-modal__steps">
        <div class="onboarding-modal__step">
          <div class="onboarding-modal__step-icon">🗺️</div>
          <div class="onboarding-modal__step-text">
            <h3>Explore the Map</h3>
            <p>Click anywhere on the map to see climate zones. Use your mouse wheel or pinch to zoom.</p>
          </div>
        </div>

        <div class="onboarding-modal__step">
          <div class="onboarding-modal__step-icon">⌨️</div>
          <div class="onboarding-modal__step-text">
            <h3>Keyboard Navigation</h3>
            <p>Use <kbd>Arrow keys</kbd> to pan the map. Press <kbd>+</kbd>/<kbd>-</kbd> to zoom in/out.</p>
          </div>
        </div>

        <div class="onboarding-modal__step">
          <div class="onboarding-modal__step-icon">🎨</div>
          <div class="onboarding-modal__step-text">
            <h3>Customize Classifications</h3>
            <p>Click <strong>Create</strong> to adjust Köppen-Geiger thresholds and see how classifications change.</p>
          </div>
        </div>

        <div class="onboarding-modal__step">
          <div class="onboarding-modal__step-icon">📊</div>
          <div class="onboarding-modal__step-text">
            <h3>Filter by Type</h3>
            <p>Click any climate type in the legend to filter the map and focus on specific zones.</p>
          </div>
        </div>
      </div>

      <div class="onboarding-modal__actions">
        <label class="onboarding-modal__checkbox">
          <input type="checkbox" id="onboarding-dont-show">
          <span>Don't show this again</span>
        </label>
        <button class="onboarding-modal__button" id="onboarding-close">
          Get Started
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalElement);

  // Focus the close button for accessibility
  setTimeout(() => {
    const closeButton = modalElement.querySelector('#onboarding-close');
    if (closeButton) {
      closeButton.focus();
    }
  }, 100);

  // Setup event listeners
  setupEventListeners();

  // Trap focus within modal
  trapFocus(modalElement);
}

/**
 * Hide the onboarding modal
 */
export function hide() {
  if (!modalElement) return;

  // Check if user wants to hide permanently
  const dontShowCheckbox = modalElement.querySelector('#onboarding-dont-show');
  if (dontShowCheckbox && dontShowCheckbox.checked) {
    localStorage.setItem(STORAGE_KEY, 'true');
  }

  modalElement.classList.add('onboarding-modal--closing');

  setTimeout(() => {
    if (modalElement) {
      modalElement.remove();
      modalElement = null;
    }
  }, 300);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  if (!modalElement) return;

  const closeButton = modalElement.querySelector('#onboarding-close');
  const backdrop = modalElement.querySelector('.onboarding-modal__backdrop');

  if (closeButton) {
    closeButton.addEventListener('click', hide);
  }

  if (backdrop) {
    backdrop.addEventListener('click', hide);
  }

  // ESC key to close
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      hide();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

/**
 * Trap focus within the modal for accessibility
 * @param {HTMLElement} element - Modal element
 */
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  });
}

/**
 * Destroy onboarding modal
 */
export function destroy() {
  if (modalElement) {
    modalElement.remove();
    modalElement = null;
  }
}

export default {
  init,
  show,
  hide,
  destroy,
};
