/**
 * Builder Module - Classification builder UI
 * @module builder
 */

/* eslint-disable sonarjs/no-duplicate-string --
 * CSS class names and UI element identifiers are intentionally repeated for code clarity.
 */

import presetLoader from './preset-loader.js';
import thresholdSliders from './threshold-sliders.js';
import comparison from './comparison.js';
import shareModal from '../ui/share-modal.js';  // Story 6.3
import exportModule from '../export/index.js';  // Story 6.5
import stateManager from '../utils/state-manager.js';  // Story 6.6
import { CustomRulesEngine } from '../climate/custom-rules.js';  // Custom rules
import CategoryManager from './category-manager.js';  // Custom rules UI
import logger from '../utils/logger.js';
import { getFeatures as getClimateFeatures } from '../map/climate-layer.js';  // Static import to avoid dynamic import warning
import { showError, showConfirm } from '../ui/confirm-dialog.js';  // C.3: Replace native alert/confirm

let builderPanel = null;
let isOpen = false;
let dataLoaded = false;
let eventListeners = []; // Track event listeners for cleanup

// Classification mode: 'koppen' (threshold-based) or 'custom' (rule-based)
// eslint-disable-next-line no-unused-vars -- State tracking for future mode-dependent features
let classificationMode = 'koppen';
let customRulesEngine = null;
let categoryManager = null;

// Fork state management (Story 6.6)
let currentClassification = null;
let originalClassification = null; // Store original for comparison
let _IS_FORK_MODE = false; // Reserved for future fork mode tracking

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

  // Data loaded event (listen for both legacy and hybrid events)
  const dataLoadedHandler = () => {
    dataLoaded = true;
    render();
  };
  document.addEventListener('koppen:data-loaded', dataLoadedHandler);
  eventListeners.push({ event: 'koppen:data-loaded', handler: dataLoadedHandler });

  // Hybrid layer ready event (new hybrid loading system)
  document.addEventListener('koppen:layer-ready', dataLoadedHandler);
  eventListeners.push({ event: 'koppen:layer-ready', handler: dataLoadedHandler });

  // Keyboard: Escape closes builder
  const keydownHandler = (e) => {
    if (e.key === 'Escape' && isOpen) close();
  };
  document.addEventListener('keydown', keydownHandler);
  eventListeners.push({ event: 'keydown', handler: keydownHandler });

  // Fork classification event (Story 6.6)
  const forkHandler = (e) => {
    const { classification, sourceURL } = e.detail || {};
    if (classification) {
      forkClassification(classification, sourceURL);
    }
  };
  document.addEventListener('koppen:fork-requested', forkHandler);
  eventListeners.push({ event: 'koppen:fork-requested', handler: forkHandler });
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

  // Share button (Story 6.3)
  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className = 'builder-panel__share-btn';
  shareBtn.setAttribute('data-share-classification', '');
  shareBtn.setAttribute('aria-label', 'Share classification via URL');
  shareBtn.textContent = '🔗 Share';

  shareBtn.addEventListener('click', () => {
    // Get current classification state
    const name = nameInput.value || 'My Classification';
    const thresholds = thresholdSliders.getAllValues();

    // Open share modal
    shareModal.open({ name, thresholds });
  });

  header.appendChild(shareBtn);

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

    // Initialize comparison module with Köppen classification
    comparison.init({
      koppenClassification: preset.classification || preset,
    });

    // Clear content and render threshold editor
    const content = builderPanel.querySelector('.builder-panel__content');
    if (content) {
      while (content.firstChild) {
        content.removeChild(content.firstChild);
      }

      // Show preset attribution
      const attribution = createPresetAttribution(preset);
      content.appendChild(attribution);

      // Add comparison tabs (Story 5.1)
      const comparisonTabs = comparison.createUI();
      content.appendChild(comparisonTabs);

      // Render threshold sliders
      const sliders = thresholdSliders.render(preset);
      content.appendChild(sliders);

      // Add export/import section (Story 6.5)
      const exportSection = createExportSection();
      content.appendChild(exportSection);
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
 * Start from scratch with custom rules (Story 4.6 - Enhanced)
 * Uses the new rule-based classification system
 */
function startFromScratch() {
  try {
    // Guard against null builderPanel (module destroyed during async operation)
    if (!builderPanel) {
      console.warn('[Koppen] Builder panel not available');
      return;
    }

    // Set mode to custom rules
    classificationMode = 'custom';

    // Initialize empty custom rules engine
    customRulesEngine = new CustomRulesEngine([]);

    // Clear content and render custom rules mode
    const content = builderPanel.querySelector('.builder-panel__content');
    if (content) {
      while (content.firstChild) {
        content.removeChild(content.firstChild);
      }

      // Show help message for custom rules mode
      const helpMessage = createCustomRulesHelpMessage();
      content.appendChild(helpMessage);

      // Create category manager container
      const categoryContainer = document.createElement('div');
      categoryContainer.id = 'category-manager-container';
      categoryContainer.className = 'builder-panel__category-manager';
      content.appendChild(categoryContainer);

      // Initialize category manager
      categoryManager = new CategoryManager(
        categoryContainer,
        customRulesEngine,
        handleCustomRulesUpdate,
      );

      // Add export/import section for custom rules
      const exportSection = createCustomRulesExportSection();
      content.appendChild(exportSection);

      // Show switch to Köppen button
      const switchSection = createSwitchToKoppenSection();
      content.appendChild(switchSection);
    }

    // Dispatch mode changed event
    document.dispatchEvent(new CustomEvent('koppen:mode-changed', {
      detail: { mode: 'custom' },
    }));

    // Dispatch scratch mode event
    document.dispatchEvent(new CustomEvent('koppen:scratch-mode-started'));

    // Trigger initial classification (all unclassified)
    handleCustomRulesUpdate();

  } catch (error) {
    console.error('[Koppen] Failed to start scratch mode:', error);
    // Show error with fallback option
    renderError({
      message: 'Failed to start scratch mode',
      error: error.message,
      actions: [
        { label: 'Start from Koppen', handler: () => startFromKoppen() },
      ],
    });
  }
}

/**
 * Create help message for custom rules mode
 * @returns {HTMLElement} Help message element
 */
function createCustomRulesHelpMessage() {
  const help = document.createElement('div');
  help.className = 'builder-panel__help builder-panel__help--custom';
  help.setAttribute('role', 'status');
  help.setAttribute('aria-live', 'polite');

  const icon = document.createElement('span');
  icon.className = 'builder-panel__help-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '\u2728'; // Sparkles

  const text = document.createElement('div');
  text.className = 'builder-panel__help-text';
  text.innerHTML = `
    <strong>Custom Rules Mode</strong><br>
    Create categories and define rules to classify regions. Features only appear classified when they match your rules.
  `;

  help.appendChild(icon);
  help.appendChild(text);

  return help;
}

/**
 * Handle updates from custom rules engine
 * Triggers reclassification and updates the map
 */
function handleCustomRulesUpdate() {
  if (!customRulesEngine) return;

  // Dispatch event to trigger reclassification with custom rules
  document.dispatchEvent(new CustomEvent('koppen:custom-rules-changed', {
    detail: {
      engine: customRulesEngine,
      categories: customRulesEngine.getSortedCategories(),
    },
  }));
}

/**
 * Create export section for custom rules
 * @returns {HTMLElement} Export section element
 */
function createCustomRulesExportSection() {
  const section = document.createElement('div');
  section.className = 'builder-panel__export-section';

  const heading = document.createElement('h3');
  heading.className = 'builder-panel__export-heading';
  heading.textContent = 'Export & Import';

  // Export JSON button
  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className = 'builder-panel__export-json-btn';
  exportBtn.setAttribute('aria-label', 'Export custom rules as JSON file');

  const exportIcon = document.createElement('span');
  exportIcon.setAttribute('aria-hidden', 'true');
  exportIcon.textContent = '\uD83D\uDCE5'; // Inbox tray
  exportBtn.appendChild(exportIcon);
  exportBtn.appendChild(document.createTextNode(' Export Rules'));

  exportBtn.addEventListener('click', async () => {
    try {
      if (!customRulesEngine) return;

      const nameInput = document.getElementById('classification-name');
      const name = nameInput?.value || 'My Custom Classification';

      const jsonString = customRulesEngine.exportJSON(name);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/[^a-z0-9]/gi, '_')}.json`;
      a.click();

      URL.revokeObjectURL(url);

      // Show success feedback
      exportBtn.textContent = '\u2713 Exported!';
      setTimeout(() => {
        exportBtn.innerHTML = '';
        const icon = document.createElement('span');
        icon.textContent = '\uD83D\uDCE5';
        exportBtn.appendChild(icon);
        exportBtn.appendChild(document.createTextNode(' Export Rules'));
      }, 2000);

    } catch (error) {
      console.error('[Koppen] Export failed:', error);
      await showError(`Export failed: ${error.message}`, { title: 'Export Error' });
    }
  });

  // Import JSON button
  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.className = 'builder-panel__import-json-btn';
  importBtn.setAttribute('aria-label', 'Import custom rules from JSON file');

  const importIcon = document.createElement('span');
  importIcon.setAttribute('aria-hidden', 'true');
  importIcon.textContent = '\uD83D\uDCE4'; // Outbox tray
  importBtn.appendChild(importIcon);
  importBtn.appendChild(document.createTextNode(' Import Rules'));

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.style.display = 'none';

  importBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      importBtn.disabled = true;
      importBtn.textContent = 'Importing...';

      const text = await file.text();
      const imported = CustomRulesEngine.importJSON(text);

      // Replace current engine
      customRulesEngine = imported;

      // Re-render category manager
      const container = document.getElementById('category-manager-container');
      if (container && categoryManager) {
        categoryManager.destroy();
        categoryManager = new CategoryManager(
          container,
          customRulesEngine,
          handleCustomRulesUpdate,
        );
      }

      // Update name if present in imported data
      try {
        const data = JSON.parse(text);
        if (data.name) {
          const nameInput = document.getElementById('classification-name');
          if (nameInput) nameInput.value = data.name;
        }
      } catch {
        // Ignore parse error for name extraction
      }

      // Trigger reclassification
      handleCustomRulesUpdate();

      // Show success
      importBtn.textContent = '\u2713 Imported!';
      setTimeout(() => {
        importBtn.innerHTML = '';
        const icon = document.createElement('span');
        icon.textContent = '\uD83D\uDCE4';
        importBtn.appendChild(icon);
        importBtn.appendChild(document.createTextNode(' Import Rules'));
        importBtn.disabled = false;
      }, 2000);

      fileInput.value = '';

    } catch (error) {
      console.error('[Koppen] Import failed:', error);
      await showError(`Import failed: ${error.message}`, { title: 'Import Error' });
      importBtn.innerHTML = '';
      const icon = document.createElement('span');
      icon.textContent = '\uD83D\uDCE4';
      importBtn.appendChild(icon);
      importBtn.appendChild(document.createTextNode(' Import Rules'));
      importBtn.disabled = false;
      fileInput.value = '';
    }
  });

  section.appendChild(heading);
  section.appendChild(exportBtn);
  section.appendChild(importBtn);
  section.appendChild(fileInput);

  return section;
}

/**
 * Create section with button to switch to Koppen mode
 * @returns {HTMLElement} Switch section element
 */
function createSwitchToKoppenSection() {
  const section = document.createElement('div');
  section.className = 'builder-panel__reset-section';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'builder-panel__reset-to-koppen';
  button.textContent = 'Switch to Koppen Mode';
  button.addEventListener('click', async () => {
    const confirmed = await showConfirm(
      'Switch to Koppen mode? This will discard your custom categories and rules.',
      { title: 'Switch Mode', type: 'warning' }
    );
    if (confirmed) {
      // Clean up custom rules
      if (categoryManager) {
        categoryManager.destroy();
        categoryManager = null;
      }
      customRulesEngine = null;
      classificationMode = 'koppen';

      // Dispatch mode change
      document.dispatchEvent(new CustomEvent('koppen:mode-changed', {
        detail: { mode: 'koppen' },
      }));

      // Start Koppen mode
      startFromKoppen();
    }
  });

  section.appendChild(button);

  return section;
}

/**
 * Create export section with JSON export/import buttons (Story 6.5)
 * @returns {HTMLElement} Export section element
 */
function createExportSection() {
  const section = document.createElement('div');
  section.className = 'builder-panel__export-section';

  const heading = document.createElement('h3');
  heading.className = 'builder-panel__export-heading';
  heading.textContent = 'Export & Import';

  // Export JSON button
  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className = 'builder-panel__export-json-btn';
  exportBtn.setAttribute('data-export-json', '');
  exportBtn.setAttribute('aria-label', 'Export classification as JSON file');

  const exportIcon = document.createElement('span');
  exportIcon.setAttribute('aria-hidden', 'true');
  exportIcon.textContent = '📥';
  exportBtn.appendChild(exportIcon);
  exportBtn.appendChild(document.createTextNode(' Export JSON'));

  exportBtn.addEventListener('click', async () => {
    try {
      // Get current classification state
      const nameInput = document.getElementById('classification-name');
      const name = nameInput?.value || 'My Classification';
      const thresholds = thresholdSliders.getAllValues();

      // Get current map view (lat, lon, zoom)
      const view = null; // TODO: Get from map module when available

      // Export JSON file
      await exportModule.exportJSONFile({ name, thresholds, view });

      // Show success feedback
      exportBtn.textContent = '✓ Exported!';
      setTimeout(() => {
        exportBtn.textContent = '';
        const icon = document.createElement('span');
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '📥';
        exportBtn.appendChild(icon);
        exportBtn.appendChild(document.createTextNode(' Export JSON'));
      }, 2000);
    } catch (error) {
      console.error('[Koppen] Export failed:', error);
      await showError(`Export failed: ${error.message}`, { title: 'Export Error' });
    }
  });

  // Import JSON button and hidden file input
  const importBtn = document.createElement('button');
  importBtn.type = 'button';
  importBtn.className = 'builder-panel__import-json-btn';
  importBtn.setAttribute('data-import-json', '');
  importBtn.setAttribute('aria-label', 'Import classification from JSON file');

  const importIcon = document.createElement('span');
  importIcon.setAttribute('aria-hidden', 'true');
  importIcon.textContent = '📤';
  importBtn.appendChild(importIcon);
  importBtn.appendChild(document.createTextNode(' Import JSON'));

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.style.display = 'none';
  fileInput.setAttribute('aria-label', 'Select JSON file to import');

  // Click import button triggers file picker
  importBtn.addEventListener('click', () => {
    fileInput.click();
  });

  // Handle file selection
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      importBtn.disabled = true;
      importBtn.textContent = 'Importing...';

      // Import and parse JSON
      const classification = await exportModule.importJSONFile(file);

      // Apply imported classification
      const nameInput = document.getElementById('classification-name');
      if (nameInput) {
        nameInput.value = classification.name;
      }

      // Load thresholds into sliders
      thresholdSliders.setValues(classification.thresholds);

      // Show success feedback
      importBtn.textContent = '✓ Imported!';
      setTimeout(() => {
        importBtn.textContent = '';
        const icon = document.createElement('span');
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '📤';
        importBtn.appendChild(icon);
        importBtn.appendChild(document.createTextNode(' Import JSON'));
        importBtn.disabled = false;
      }, 2000);

      // Reset file input
      fileInput.value = '';

      // Fire classification-imported event
      document.dispatchEvent(new CustomEvent('koppen:classification-imported', {
        detail: { name: classification.name, version: classification.version },
      }));
    } catch (error) {
      console.error('[Koppen] Import failed:', error);
      await showError(`Import failed: ${error.message}`, { title: 'Import Error' });

      importBtn.textContent = '';
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '📤';
      importBtn.appendChild(icon);
      importBtn.appendChild(document.createTextNode(' Import JSON'));
      importBtn.disabled = false;

      // Reset file input
      fileInput.value = '';
    }
  });

  section.appendChild(heading);
  section.appendChild(exportBtn);
  section.appendChild(importBtn);
  section.appendChild(fileInput);

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
    const confirmed = await showConfirm(
      'Reset all thresholds to Köppen defaults?',
      { title: 'Reset Thresholds', type: 'warning' }
    );
    if (confirmed) {
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
 * Render placeholder message (reserved for future use)
 * @param {string} message - Placeholder text
 */
function _RENDER_PLACEHOLDER(message) {
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
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
    }),
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

/**
 * Fork a shared classification and enter edit mode (Story 6.6)
 * @param {Object} classification - Shared classification to fork
 * @param {string} [sourceURL=null] - Original URL (optional)
 */
function forkClassification(classification, sourceURL = null) {
  logger.log('[Koppen] Forking classification:', classification.name);

  try {
    // Create fork with metadata
    const forked = stateManager.forkClassification(classification, sourceURL);

    // Store original for comparison
    originalClassification = stateManager.deepClone(classification);

    // Store current classification
    currentClassification = forked;

    // Mark as fork mode
    _IS_FORK_MODE = true;

    // Update name field
    const nameInput = document.getElementById('classification-name');
    if (nameInput) {
      nameInput.value = forked.name;
    }

    // Load thresholds into sliders
    if (forked.thresholds) {
      thresholdSliders.setValues(forked.thresholds);
    }

    // Show builder panel if hidden
    if (!isOpen) {
      open();
    }

    // Show fork indicator
    showForkIndicator(forked, originalClassification);

    // Fire classification-forked event
    document.dispatchEvent(new CustomEvent('koppen:classification-forked', {
      detail: {
        original: classification,
        forked,
        sourceURL,
      },
    }));

    logger.log('[Koppen] Fork created:', forked.name);

  } catch (error) {
    console.error('[Koppen] Fork failed:', error);

    // Fire error event
    document.dispatchEvent(new CustomEvent('koppen:fork-failed', {
      detail: { error: error.message },
    }));

    throw error;
  }
}

/**
 * Show fork indicator in builder panel (Story 6.6)
 * @param {Object} forked - Forked classification
 * @param {Object} original - Original classification
 */
function showForkIndicator(forked, original) {
  if (!builderPanel) return;

  // Remove existing indicator
  const existingIndicator = builderPanel.querySelector('.builder-fork-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  // Create new indicator
  const indicator = document.createElement('div');
  indicator.className = 'builder-fork-indicator';

  const icon = document.createElement('span');
  icon.className = 'builder-fork-indicator__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '🔀';

  const text = document.createElement('span');
  text.className = 'builder-fork-indicator__text';
  text.textContent = `Forked from: ${original.name}`;

  indicator.appendChild(icon);
  indicator.appendChild(text);

  // Insert at top of builder panel content
  const content = builderPanel.querySelector('.builder-panel__content');
  if (content && content.firstChild) {
    content.insertBefore(indicator, content.firstChild);
  }
}

/**
 * Get current classification state (Story 6.6)
 * @returns {Object} Current classification with current threshold values
 */
function getCurrentClassification() {
  if (!currentClassification) {
    // Return default classification if none loaded
    const nameInput = document.getElementById('classification-name');
    return {
      name: nameInput?.value || 'My Classification',
      thresholds: thresholdSliders.getAllValues(),
    };
  }

  // Return current classification with latest threshold values
  return {
    ...currentClassification,
    thresholds: thresholdSliders.getAllValues(),
    metadata: {
      ...(currentClassification.metadata || {}),
      modified: originalClassification
        ? stateManager.isModified(
            { thresholds: thresholdSliders.getAllValues() },
            originalClassification,
          )
        : false,
    },
  };
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

    // Check if data is already loaded (layer initialized before builder)
    // Use setTimeout to ensure module is fully loaded
    setTimeout(() => {
      try {
        const features = getClimateFeatures();
        if (features && features.length > 0) {
          logger.log('[Koppen] Climate data already loaded:', features.length, 'features');
          dataLoaded = true;
          render();
        } else {
          logger.log('[Koppen] No features loaded yet, waiting for event');
        }
      } catch (err) {
        logger.log('[Koppen] Waiting for climate data event:', err.message);
      }
    }, 100);
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
   * Fork a shared classification (Story 6.6)
   */
  forkClassification,

  /**
   * Get current classification state (Story 6.6)
   */
  getCurrentClassification,

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
