/**
 * Builder Module - Classification builder UI
 * @module builder
 */

import presetLoader from './preset-loader.js';
import thresholdSliders from './threshold-sliders.js';

let builderPanel = null;
let isOpen = false;
let dataLoaded = false;
let eventListeners = []; // Track event listeners for cleanup

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Toggle builder
  const toggleHandler = () => toggle();
  document.addEventListener('koppen:toggle-builder', toggleHandler);
  eventListeners.push({ event: 'koppen:toggle-builder', handler: toggleHandler });

  // Close panels event
  const closePanelsHandler = (e) => {
    if (e.detail?.except !== 'builder') close();
  };
  document.addEventListener('koppen:close-panels', closePanelsHandler);
  eventListeners.push({ event: 'koppen:close-panels', handler: closePanelsHandler });

  // Data loaded event
  const dataLoadedHandler = () => {
    dataLoaded = true;
    render();
  };
  document.addEventListener('koppen:data-loaded', dataLoadedHandler);
  eventListeners.push({ event: 'koppen:data-loaded', handler: dataLoadedHandler });

  // Keyboard: Escape closes builder
  const keydownHandler = (e) => {
    if (e.key === 'Escape' && isOpen) close();
  };
  document.addEventListener('keydown', keydownHandler);
  eventListeners.push({ event: 'keydown', handler: keydownHandler });
}

/**
 * Render the builder panel UI
 */
function render() {
  if (!builderPanel) return;

  // Clear existing content safely
  while (builderPanel.firstChild) {
    builderPanel.removeChild(builderPanel.firstChild);
  }

  // Create header
  const header = createHeader();
  builderPanel.appendChild(header);

  // Create content area
  const content = document.createElement('div');
  content.className = 'builder-panel__content';

  if (dataLoaded) {
    content.appendChild(createStartOptions());
  } else {
    content.appendChild(createLoadingState());
  }

  builderPanel.appendChild(content);
}

/**
 * Create panel header with title, name input, and close button
 */
function createHeader() {
  const header = document.createElement('div');
  header.className = 'builder-panel__header';

  const titleRow = document.createElement('div');
  titleRow.className = 'builder-panel__title-row';

  const title = document.createElement('h2');
  title.id = 'builder-title';
  title.className = 'builder-panel__title';
  title.textContent = 'Create Classification';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'builder-panel__close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close builder');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => close());

  titleRow.appendChild(title);
  titleRow.appendChild(closeBtn);
  header.appendChild(titleRow);

  // Name input (Story 4.5)
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'classification-name';
  nameInput.className = 'builder-panel__name-input';
  nameInput.placeholder = 'My Classification';
  nameInput.maxLength = 50;
  nameInput.setAttribute('aria-label', 'Classification name');

  nameInput.addEventListener('input', (e) => {
    const name = e.target.value;
    document.dispatchEvent(new CustomEvent('koppen:classification-named', {
      detail: { name },
    }));
  });

  header.appendChild(nameInput);

  return header;
}

/**
 * Create start options (Köppen and Scratch buttons)
 */
function createStartOptions() {
  const container = document.createElement('div');

  const intro = document.createElement('p');
  intro.className = 'builder-panel__intro';
  intro.textContent = "Choose how you'd like to start building your classification system:";
  container.appendChild(intro);

  const options = document.createElement('div');
  options.className = 'builder-panel__options';

  // Köppen option (primary)
  const koppenBtn = createOption({
    id: 'start-from-koppen',
    icon: '🗺️',
    title: 'Start from Köppen',
    description: 'Begin with standard Köppen-Geiger classification and modify it',
    primary: true,
  });

  // Scratch option
  const scratchBtn = createOption({
    id: 'start-from-scratch',
    icon: '✨',
    title: 'Start from Scratch',
    description: 'Build a completely custom classification system',
    primary: false,
  });

  options.appendChild(koppenBtn);
  options.appendChild(scratchBtn);
  container.appendChild(options);

  // Wire up click handlers
  koppenBtn.addEventListener('click', () => startFromKoppen());
  scratchBtn.addEventListener('click', () => startFromScratch());

  return container;
}

/**
 * Create a single start option button
 */
function createOption({ id, icon, title, description, primary }) {
  const button = document.createElement('button');
  button.id = id;
  button.type = 'button';
  button.className = 'builder-panel__option';
  if (primary) {
    button.classList.add('builder-panel__option--primary');
  }

  const iconSpan = document.createElement('span');
  iconSpan.className = 'builder-panel__option-icon';
  iconSpan.setAttribute('aria-hidden', 'true');
  iconSpan.textContent = icon;

  const titleSpan = document.createElement('span');
  titleSpan.className = 'builder-panel__option-title';
  titleSpan.textContent = title;

  const descSpan = document.createElement('span');
  descSpan.className = 'builder-panel__option-desc';
  descSpan.textContent = description;

  button.appendChild(iconSpan);
  button.appendChild(titleSpan);
  button.appendChild(descSpan);

  return button;
}

/**
 * Create loading state UI
 * @param {string} message - Optional custom loading message
 */
function createLoadingState(message = 'Loading climate data...') {
  const container = document.createElement('div');
  container.className = 'builder-panel__loading';

  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.setAttribute('role', 'status');
  spinner.setAttribute('aria-label', message);

  const text = document.createElement('p');
  text.textContent = message;

  container.appendChild(spinner);
  container.appendChild(text);

  return container;
}

/**
 * Render loading state with custom message
 * @param {string} message - Loading message
 */
function renderLoadingState(message) {
  if (!builderPanel) return;

  const content = builderPanel.querySelector('.builder-panel__content');
  if (!content) return;

  // Clear content
  while (content.firstChild) {
    content.removeChild(content.firstChild);
  }

  content.appendChild(createLoadingState(message));
}

/**
 * Render error state with retry/fallback options
 * @param {Object} options - Error options
 * @param {string} options.message - Error message
 * @param {string} options.error - Error details
 * @param {Array} options.actions - Action buttons [{label, handler}]
 */
function renderError({ message, error, actions }) {
  if (!builderPanel) return;

  const content = builderPanel.querySelector('.builder-panel__content');
  if (!content) return;

  // Clear content
  while (content.firstChild) {
    content.removeChild(content.firstChild);
  }

  const container = document.createElement('div');
  container.className = 'builder-panel__error';

  const icon = document.createElement('div');
  icon.className = 'builder-panel__error-icon';
  icon.textContent = '⚠️';
  icon.setAttribute('aria-hidden', 'true');

  const heading = document.createElement('h3');
  heading.className = 'builder-panel__error-heading';
  heading.textContent = message;

  const details = document.createElement('p');
  details.className = 'builder-panel__error-details';
  details.textContent = error;

  container.appendChild(icon);
  container.appendChild(heading);
  container.appendChild(details);

  // Add action buttons
  if (actions && actions.length > 0) {
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'builder-panel__error-actions';

    actions.forEach(({ label, handler }, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'builder-panel__error-action';
      if (index === 0) {
        button.classList.add('builder-panel__error-action--primary');
      }
      button.textContent = label;
      button.addEventListener('click', handler);
      buttonGroup.appendChild(button);
    });

    container.appendChild(buttonGroup);
  }

  content.appendChild(container);
}

/**
 * Start from Köppen preset (Story 4.2)
 */
async function startFromKoppen() {
  try {
    // Show loading state
    renderLoadingState('Loading Köppen preset...');

    // Load preset
    const preset = await presetLoader.loadKoppenPreset();

    // Initialize threshold sliders
    thresholdSliders.init(preset);

    // Clear content and render threshold editor
    const content = builderPanel.querySelector('.builder-panel__content');
    if (content) {
      while (content.firstChild) {
        content.removeChild(content.firstChild);
      }

      // Show preset attribution
      const attribution = createPresetAttribution(preset);
      content.appendChild(attribution);

      // Render threshold sliders
      const sliders = thresholdSliders.render(preset);
      content.appendChild(sliders);
    }
  } catch (error) {
    // Show error with retry option
    renderError({
      message: 'Failed to load Köppen preset',
      error: error.message,
      actions: [
        { label: 'Retry', handler: () => startFromKoppen() },
        { label: 'Start from Scratch', handler: () => startFromScratch() },
      ],
    });
  }
}

/**
 * Start from scratch (Story 4.6)
 */
function startFromScratch() {
  try {
    // Import scratch preset
    import('../climate/presets.js').then(({ SCRATCH_PRESET }) => {
      // Initialize threshold sliders
      thresholdSliders.init(SCRATCH_PRESET);

      // Clear content and render scratch mode
      const content = builderPanel.querySelector('.builder-panel__content');
      if (content) {
        while (content.firstChild) {
          content.removeChild(content.firstChild);
        }

        // Show help message
        const helpMessage = createHelpMessage();
        content.appendChild(helpMessage);

        // Render threshold sliders
        const sliders = thresholdSliders.render(SCRATCH_PRESET);
        content.appendChild(sliders);

        // Show reset to Köppen button
        const resetSection = createResetSection();
        content.appendChild(resetSection);
      }

      // Dispatch event
      document.dispatchEvent(new CustomEvent('koppen:scratch-mode-started'));
    });
  } catch (error) {
    // Show error with fallback option
    renderError({
      message: 'Failed to start scratch mode',
      error: error.message,
      actions: [
        { label: 'Start from Köppen', handler: () => startFromKoppen() },
      ],
    });
  }
}

/**
 * Create help message for scratch mode (Story 4.6)
 * @returns {HTMLElement} Help message element
 */
function createHelpMessage() {
  const help = document.createElement('div');
  help.className = 'builder-panel__help';
  help.setAttribute('role', 'status');
  help.setAttribute('aria-live', 'polite');

  const icon = document.createElement('span');
  icon.className = 'builder-panel__help-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '💡';

  const text = document.createElement('p');
  text.className = 'builder-panel__help-text';
  text.textContent = 'Define thresholds to classify regions. Adjust sliders below to see regions change classification in real-time.';

  help.appendChild(icon);
  help.appendChild(text);

  return help;
}

/**
 * Create reset section with button to switch to Köppen (Story 4.6)
 * @returns {HTMLElement} Reset section element
 */
function createResetSection() {
  const section = document.createElement('div');
  section.className = 'builder-panel__reset-section';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'builder-panel__reset-to-koppen';
  button.textContent = 'Switch to Köppen Preset';
  button.addEventListener('click', () => {
    if (confirm('Switch to Köppen preset? This will replace your current thresholds.')) {
      startFromKoppen();
    }
  });

  section.appendChild(button);

  return section;
}

/**
 * Create preset attribution badge (Story 4.2)
 * @param {Object} preset - Preset data
 * @returns {HTMLElement} Attribution element
 */
function createPresetAttribution(preset) {
  const attribution = document.createElement('div');
  attribution.className = 'builder-panel__attribution';

  const label = document.createElement('span');
  label.className = 'builder-panel__attribution-label';
  label.textContent = 'Based on:';

  const name = document.createElement('strong');
  name.textContent = `${preset.name} (${preset.version})`;

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'builder-panel__reset-btn';
  reset.textContent = 'Reset to Original';
  reset.addEventListener('click', async () => {
    if (confirm('Reset all thresholds to Köppen defaults?')) {
      const freshPreset = await presetLoader.resetToKoppen();
      thresholdSliders.reset(freshPreset);
    }
  });

  attribution.appendChild(label);
  attribution.appendChild(name);
  attribution.appendChild(reset);

  return attribution;
}

/**
 * Render placeholder message
 * @param {string} message - Placeholder text
 */
function renderPlaceholder(message) {
  if (!builderPanel) return;

  const content = builderPanel.querySelector('.builder-panel__content');
  if (!content) return;

  const placeholder = document.createElement('div');
  placeholder.className = 'builder-panel__placeholder';

  const text = document.createElement('p');
  text.textContent = message;

  placeholder.appendChild(text);
  content.appendChild(placeholder);
}

/**
 * Trap focus within the builder panel
 */
function trapFocus() {
  if (!builderPanel) return;

  const focusable = builderPanel.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusable.length > 0) {
    focusable[0].focus();
  }
}

/**
 * Release focus trap and return focus to Create button
 */
function releaseFocus() {
  const createBtn = document.getElementById('create-btn');
  if (createBtn) createBtn.focus();
}

/**
 * Open the builder panel
 */
function open() {
  if (isOpen) return; // Prevent double-open

  // Close other panels first
  document.dispatchEvent(
    new CustomEvent('koppen:close-panels', {
      detail: { except: 'builder' },
    })
  );

  isOpen = true;
  builderPanel.classList.add('builder-panel--active');
  builderPanel.setAttribute('aria-hidden', 'false');

  // Update header button
  const createBtn = document.getElementById('create-btn');
  if (createBtn) {
    createBtn.textContent = 'Editing...';
    createBtn.setAttribute('aria-pressed', 'true');
  }

  // Implement focus trap
  trapFocus();

  // Fire event
  document.dispatchEvent(new CustomEvent('koppen:builder-opened'));
}

/**
 * Close the builder panel
 */
function close() {
  if (!isOpen) return;

  isOpen = false;
  builderPanel.classList.remove('builder-panel--active');
  builderPanel.setAttribute('aria-hidden', 'true');

  // Reset header button
  const createBtn = document.getElementById('create-btn');
  if (createBtn) {
    createBtn.textContent = 'Create';
    createBtn.setAttribute('aria-pressed', 'false');
  }

  // Release focus trap
  releaseFocus();

  // Fire event
  document.dispatchEvent(new CustomEvent('koppen:builder-closed'));
}

/**
 * Toggle the builder panel
 */
function toggle() {
  isOpen ? close() : open();
}

export default {
  /**
   * Initialize the builder module
   * @param {Object} _options - Configuration options
   */
  init(_options = {}) {
    builderPanel = document.getElementById('builder-panel');

    if (!builderPanel) {
      const error = new Error('[Koppen] Builder panel element #builder-panel not found in DOM');
      console.error(error.message);
      throw error;
    }

    // Set initial aria-hidden
    builderPanel.setAttribute('aria-hidden', 'true');

    // Set up event listeners
    setupEventListeners();

    // Render initial UI
    render();
  },

  /**
   * Open the builder panel
   */
  open,

  /**
   * Close the builder panel
   */
  close,

  /**
   * Toggle the builder panel
   */
  toggle,

  /**
   * Check if builder is open
   * @returns {boolean}
   */
  isOpen() {
    return isOpen;
  },

  /**
   * Destroy the module
   */
  destroy() {
    // Remove all event listeners
    eventListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    eventListeners = [];

    builderPanel = null;
    isOpen = false;
    dataLoaded = false;
  },
};
