/**
 * Expandable Term Component
 * Provides inline glossary definitions for technical terms
 */

/* eslint-disable security/detect-object-injection --
 * This file accesses GLOSSARY using term keys passed from internal components.
 * Keys are not user-controlled; they are hardcoded in climate-info.js and similar.
 * See docs/orchestration/checkpoints/security-review.md for full analysis.
 */

/* eslint-disable sonarjs/no-duplicate-string --
 * CSS class names for expandable terms are intentionally repeated for clarity.
 */

import { GLOSSARY } from '../climate/glossary.js';

/**
 * Create an expandable term HTML element
 * @param {string} termKey - Key in the GLOSSARY object
 * @returns {string} HTML string for the expandable term
 */
export function createExpandableTerm(termKey) {
  const entry = GLOSSARY[termKey];
  if (!entry) {
    return `<span class="term">${termKey}</span>`;
  }

  return `
    <button class="expandable-term"
            aria-expanded="false"
            data-term="${termKey}"
            type="button">
      <span class="expandable-term__text">${entry.term}</span>
    </button>
  `;
}

/**
 * Create the expansion content for a term
 * @param {string} termKey - Key in the GLOSSARY object
 * @returns {string} HTML string for the definition
 */
export function createTermDefinition(termKey) {
  const entry = GLOSSARY[termKey];
  if (!entry) return '';

  /* eslint-disable no-secrets/no-secrets */
  return `
    <div class="expandable-term__definition">
      <strong>${entry.fullName}</strong>
      <p>${entry.definition}</p>
      ${entry.formula ? `<code class="expandable-term__formula">${entry.formula}</code>` : ''}
    </div>
  `;
  /* eslint-enable no-secrets/no-secrets */
}

/**
 * Initialize expandable term interactions within a container
 * @param {HTMLElement} container - Container element
 */
export function initExpandableTerms(container) {
  if (!container) return;

  container.querySelectorAll('.expandable-term').forEach(term => {
    // Remove any existing listeners (in case of re-init)
    const newTerm = term.cloneNode(true);
    term.parentNode.replaceChild(newTerm, term);

    newTerm.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTerm(newTerm);
    });

    newTerm.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        toggleTerm(newTerm);
      }
    });
  });
}

/**
 * Toggle a term's expanded state
 * @param {HTMLElement} termElement - The expandable term button
 */
function toggleTerm(termElement) {
  const isExpanded = termElement.getAttribute('aria-expanded') === 'true';
  const termKey = termElement.dataset.term;

  // Find or create the definition element
  let definition = termElement.nextElementSibling;
  if (!definition || !definition.classList.contains('expandable-term__definition')) {
    // Create the definition
    const definitionHTML = createTermDefinition(termKey);
    termElement.insertAdjacentHTML('afterend', definitionHTML);
    definition = termElement.nextElementSibling;
  }

  // Toggle state
  if (isExpanded) {
    termElement.setAttribute('aria-expanded', 'false');
    definition.classList.remove('expandable-term__definition--visible');
    setTimeout(() => {
      if (termElement.getAttribute('aria-expanded') === 'false') {
        definition.remove();
      }
    }, 200);
  } else {
    termElement.setAttribute('aria-expanded', 'true');
    // Trigger reflow for animation
    definition.offsetHeight;
    definition.classList.add('expandable-term__definition--visible');
  }
}

/**
 * Collapse all expanded terms in a container
 * @param {HTMLElement} container - Container element
 */
export function collapseAllTerms(container) {
  if (!container) return;

  container.querySelectorAll('.expandable-term[aria-expanded="true"]').forEach(term => {
    term.setAttribute('aria-expanded', 'false');
    const definition = term.nextElementSibling;
    if (definition && definition.classList.contains('expandable-term__definition')) {
      definition.remove();
    }
  });
}

export default {
  createExpandableTerm,
  createTermDefinition,
  initExpandableTerms,
  collapseAllTerms,
};
