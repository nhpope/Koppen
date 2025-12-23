/**
 * Export Utilities - Story 6.1
 * Filename generation and blob download helpers
 * @module export/utils
 */

/**
 * Generate sanitized filename for export
 * @param {string} [classificationName='koppen'] - Classification name
 * @returns {string} Filename in format: koppen-[name]-[YYYY-MM-DD].png
 */
export function generateFilename(classificationName = 'koppen') {
  const sanitized = classificationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return `koppen-${sanitized}-${date}.png`;
}

/**
 * Download blob as file
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Filename for download
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Clean up object URL after delay
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
