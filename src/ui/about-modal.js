/**
 * About Modal Component
 * Shows getting started instructions and project information
 */

import logger from '../utils/logger.js';

let modalElement = null;
let isOpen = false;

function createModalElement() {
  const modal = document.createElement('div');
  modal.id = 'about-modal';
  modal.className = 'about-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'about-modal-title');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-hidden', 'true');

  const backdrop = document.createElement('div');
  backdrop.className = 'about-modal__backdrop';
  backdrop.addEventListener('click', () => close());

  const content = document.createElement('div');
  content.className = 'about-modal__content';

  modal.appendChild(backdrop);
  modal.appendChild(content);

  return modal;
}

function renderContent() {
  if (!modalElement) return;

  const content = modalElement.querySelector('.about-modal__content');
  if (!content) return;

  // Clear existing
  while (content.firstChild) {
    content.removeChild(content.firstChild);
  }

  // Header
  const header = document.createElement('div');
  header.className = 'about-modal__header';

  const title = document.createElement('h2');
  title.id = 'about-modal-title';
  title.className = 'about-modal__title';
  title.textContent = 'About Köppen Climate Classification';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'about-modal__close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.setAttribute('data-about-close', '');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => close());

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Body
  const body = document.createElement('div');
  body.className = 'about-modal__body';

  // Static content - safe to use innerHTML for formatting
  /* eslint-disable-next-line no-unsanitized/property -- Static content, no user input */
  body.innerHTML = `
    <section class="about-section">
      <h3>Getting Started</h3>
      <p>Explore and customize climate classifications with two modes:</p>
      <ul>
        <li><strong>Start from Köppen:</strong> Modify the standard Köppen-Geiger classification by adjusting temperature and precipitation thresholds</li>
        <li><strong>Create from Scratch:</strong> Build your own classification system with custom categories and rules</li>
      </ul>
    </section>

    <section class="about-section">
      <h3>Features</h3>
      <ul>
        <li><strong>Interactive Map:</strong> Click regions to see climate data</li>
        <li><strong>Legend:</strong> Filter by climate type, view classifications</li>
        <li><strong>Export:</strong> Download high-resolution maps as PNG</li>
        <li><strong>Share:</strong> Generate shareable URLs with your custom classifications</li>
      </ul>
    </section>

    <section class="about-section">
      <h3>About Köppen Classification</h3>
      <p>The Köppen-Geiger system classifies climates based on temperature and precipitation patterns. It divides climates into five main groups: Tropical (A), Arid (B), Temperate (C), Continental (D), and Polar (E).</p>
    </section>

    <section class="about-section">
      <h3>Support This Project</h3>
      <p>If you find this tool useful, consider <a href="https://ko-fi.com/nathanpope_koppen_io" target="_blank" rel="noopener noreferrer">supporting the project on Ko-fi</a>.</p>
    </section>
  `;

  content.appendChild(header);
  content.appendChild(body);
}

export function open() {
  if (isOpen) return;

  if (!modalElement) {
    modalElement = createModalElement();
    document.body.appendChild(modalElement);
  }

  renderContent();

  isOpen = true;
  modalElement.classList.add('about-modal--active');
  modalElement.setAttribute('aria-hidden', 'false');

  // Close other panels
  document.dispatchEvent(new CustomEvent('koppen:close-panels', {
    detail: { except: 'about' },
  }));

  logger.log('[Koppen] About modal opened');
}

export function close() {
  if (!isOpen || !modalElement) return;

  isOpen = false;
  modalElement.classList.remove('about-modal--active');
  modalElement.setAttribute('aria-hidden', 'true');

  logger.log('[Koppen] About modal closed');
}

export function init() {
  // Listen for ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  });

  // Listen for show-about event
  document.addEventListener('koppen:show-about', () => {
    open();
  });

  // Listen for close-panels event
  document.addEventListener('koppen:close-panels', (e) => {
    if (e.detail?.except !== 'about') {
      close();
    }
  });

  logger.log('[Koppen] About modal initialized');
}

export function destroy() {
  if (modalElement && modalElement.parentNode) {
    modalElement.parentNode.removeChild(modalElement);
  }
  modalElement = null;
  isOpen = false;
}

export default {
  init,
  open,
  close,
  destroy,
};
