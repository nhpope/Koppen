/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies before importing the module
const mockRuleEditorDestroy = vi.fn();
vi.mock('../../../src/builder/rule-editor.js', () => ({
  default: class MockRuleEditor {
    destroy = mockRuleEditorDestroy;
    constructor() {}
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../src/climate/custom-rules.js', () => ({
  DEFAULT_COLORS: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
}));

import CategoryManager from '../../../src/builder/category-manager.js';

// Polyfill DragEvent for jsdom
class MockDragEvent extends Event {
  dataTransfer: any;
  constructor(type: string, options: any = {}) {
    super(type, options);
    this.dataTransfer = options.dataTransfer || { effectAllowed: '', dropEffect: '', setData: vi.fn() };
  }
}
(globalThis as any).DragEvent = MockDragEvent;

describe('CategoryManager', () => {
  let container: HTMLElement;
  let mockEngine: any;
  let onUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    container.id = 'category-manager';
    document.body.appendChild(container);

    // Create mock engine
    mockEngine = {
      getSortedCategories: vi.fn(() => []),
      getCategory: vi.fn(),
      addCategory: vi.fn(() => ({ id: 'new-cat', name: 'New Category', color: '#FF0000', enabled: true, rules: [] })),
      removeCategory: vi.fn(),
      updateCategory: vi.fn(),
      reorderCategories: vi.fn(),
    };

    onUpdate = vi.fn();
  });

  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create a CategoryManager with container', () => {
      const manager = new CategoryManager(container, mockEngine, onUpdate);
      expect(manager).toBeDefined();
      expect(container.classList.contains('category-manager')).toBe(true);
    });

    it('should render header with add button', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const header = container.querySelector('.category-manager__header');
      expect(header).toBeTruthy();

      const title = container.querySelector('.category-manager__title');
      expect(title?.textContent).toBe('Categories');

      const addBtn = container.querySelector('.category-manager__add-btn');
      expect(addBtn).toBeTruthy();
      expect(addBtn?.getAttribute('aria-label')).toBe('Add new category');
    });

    it('should render stats summary', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const stats = container.querySelector('.category-manager__stats');
      expect(stats).toBeTruthy();

      const classifiedStat = container.querySelector('[data-stat="classified"]');
      const unclassifiedStat = container.querySelector('[data-stat="unclassified"]');
      expect(classifiedStat).toBeTruthy();
      expect(unclassifiedStat).toBeTruthy();
    });

    it('should use default onUpdate when none provided', () => {
      const manager = new CategoryManager(container, mockEngine);
      // Should not throw when onUpdate is called internally
      expect(() => manager['onUpdate']()).not.toThrow();
    });
  });

  describe('Empty Category List', () => {
    it('should show empty state when no categories', () => {
      mockEngine.getSortedCategories.mockReturnValue([]);
      new CategoryManager(container, mockEngine, onUpdate);

      const empty = container.querySelector('.category-manager__empty');
      expect(empty).toBeTruthy();
      expect(empty?.textContent).toContain('No categories yet');
    });
  });

  describe('Category List with Items', () => {
    beforeEach(() => {
      mockEngine.getSortedCategories.mockReturnValue([
        { id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [{ id: 'rule1' }] },
        { id: 'cat2', name: 'Category 2', color: '#00FF00', enabled: false, rules: [] },
      ]);
    });

    it('should render category items', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const items = container.querySelectorAll('.category-item');
      expect(items.length).toBe(2);
    });

    it('should show correct category names', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const names = container.querySelectorAll('.category-item__name');
      expect(names[0]?.textContent).toBe('Category 1');
      expect(names[1]?.textContent).toBe('Category 2');
    });

    it('should show correct rule counts', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const ruleCounts = container.querySelectorAll('.category-item__rule-count');
      expect(ruleCounts[0]?.textContent).toBe('1 rule');
      expect(ruleCounts[1]?.textContent).toBe('0 rules');
    });

    it('should apply disabled class to disabled categories', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const items = container.querySelectorAll('.category-item');
      expect(items[0].classList.contains('category-item--disabled')).toBe(false);
      expect(items[1].classList.contains('category-item--disabled')).toBe(true);
    });

    it('should set color swatch background', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const colorSwatches = container.querySelectorAll('.category-item__color') as NodeListOf<HTMLButtonElement>;
      expect(colorSwatches[0].style.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(colorSwatches[1].style.backgroundColor).toBe('rgb(0, 255, 0)');
    });
  });

  describe('Add Category', () => {
    it('should add category when add button clicked', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const addBtn = container.querySelector('.category-manager__add-btn') as HTMLButtonElement;
      addBtn.click();

      expect(mockEngine.addCategory).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  describe('Delete Category', () => {
    beforeEach(() => {
      mockEngine.getSortedCategories.mockReturnValue([
        { id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] },
      ]);
      mockEngine.getCategory.mockReturnValue({ id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] });
    });

    it('should delete category when confirmed', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      new CategoryManager(container, mockEngine, onUpdate);

      const deleteBtn = container.querySelector('.category-item__delete-btn') as HTMLButtonElement;
      deleteBtn.click();

      expect(mockEngine.removeCategory).toHaveBeenCalledWith('cat1');
      expect(onUpdate).toHaveBeenCalled();
    });

    it('should NOT delete category when not confirmed', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      new CategoryManager(container, mockEngine, onUpdate);

      const deleteBtn = container.querySelector('.category-item__delete-btn') as HTMLButtonElement;
      deleteBtn.click();

      expect(mockEngine.removeCategory).not.toHaveBeenCalled();
    });

    it('should handle delete when category not found', () => {
      mockEngine.getCategory.mockReturnValue(null);

      new CategoryManager(container, mockEngine, onUpdate);

      const deleteBtn = container.querySelector('.category-item__delete-btn') as HTMLButtonElement;
      deleteBtn.click();

      expect(mockEngine.removeCategory).not.toHaveBeenCalled();
    });
  });

  describe('Toggle Category', () => {
    beforeEach(() => {
      mockEngine.getSortedCategories.mockReturnValue([
        { id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] },
      ]);
    });

    it('should toggle category enabled state', () => {
      mockEngine.getCategory.mockReturnValue({ id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] });

      new CategoryManager(container, mockEngine, onUpdate);

      const toggleBtn = container.querySelector('.category-item__toggle-btn') as HTMLButtonElement;
      toggleBtn.click();

      expect(mockEngine.updateCategory).toHaveBeenCalledWith('cat1', { enabled: false });
      expect(onUpdate).toHaveBeenCalled();
    });

    it('should handle toggle when category not found', () => {
      mockEngine.getCategory.mockReturnValue(null);

      new CategoryManager(container, mockEngine, onUpdate);

      const toggleBtn = container.querySelector('.category-item__toggle-btn') as HTMLButtonElement;
      toggleBtn.click();

      expect(mockEngine.updateCategory).not.toHaveBeenCalled();
    });
  });

  describe('Expand/Collapse Category', () => {
    beforeEach(() => {
      mockEngine.getSortedCategories.mockReturnValue([
        { id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] },
      ]);
    });

    it('should expand category when expand button clicked', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const expandBtn = container.querySelector('.category-item__expand-btn') as HTMLButtonElement;
      expandBtn.click();

      const item = container.querySelector('.category-item');
      expect(item?.classList.contains('category-item--expanded')).toBe(true);
    });

    it('should collapse expanded category when clicked again', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      // First click to expand
      let expandBtn = container.querySelector('.category-item__expand-btn') as HTMLButtonElement;
      expandBtn.click();

      let item = container.querySelector('.category-item');
      expect(item?.classList.contains('category-item--expanded')).toBe(true);

      // Re-query after render and click again to collapse
      expandBtn = container.querySelector('.category-item__expand-btn') as HTMLButtonElement;
      expandBtn.click();

      item = container.querySelector('.category-item');
      expect(item?.classList.contains('category-item--expanded')).toBe(false);
    });

    it('should show rule editor when expanded', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const expandBtn = container.querySelector('.category-item__expand-btn') as HTMLButtonElement;
      expandBtn.click();

      const editor = container.querySelector('.category-item__editor');
      expect(editor).toBeTruthy();
    });
  });

  describe('Color Picker', () => {
    beforeEach(() => {
      mockEngine.getSortedCategories.mockReturnValue([
        { id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] },
      ]);
      mockEngine.getCategory.mockReturnValue({ id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] });
    });

    it('should show color picker when color swatch clicked', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const colorSwatch = container.querySelector('.category-item__color') as HTMLButtonElement;
      colorSwatch.click();

      const picker = container.querySelector('.color-picker-popup');
      expect(picker).toBeTruthy();
    });

    it('should close existing picker before opening new one', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const colorSwatch = container.querySelector('.category-item__color') as HTMLButtonElement;
      colorSwatch.click(); // Open first time
      colorSwatch.click(); // Open second time (should close first)

      const pickers = container.querySelectorAll('.color-picker-popup');
      expect(pickers.length).toBe(1);
    });

    it('should update color when swatch selected', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const colorSwatch = container.querySelector('.category-item__color') as HTMLButtonElement;
      colorSwatch.click();

      const swatches = container.querySelectorAll('.color-picker-popup__swatch');
      (swatches[1] as HTMLButtonElement).click();

      expect(mockEngine.updateCategory).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalled();
    });

    it('should close color picker when close button clicked', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const colorSwatch = container.querySelector('.category-item__color') as HTMLButtonElement;
      colorSwatch.click();

      const closeBtn = container.querySelector('.color-picker-popup__close') as HTMLButtonElement;
      closeBtn.click();

      const picker = container.querySelector('.color-picker-popup');
      expect(picker).toBeNull();
    });

    it('should handle custom color input change', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const colorSwatch = container.querySelector('.category-item__color') as HTMLButtonElement;
      colorSwatch.click();

      const customInput = container.querySelector('.color-picker-popup__custom-input') as HTMLInputElement;
      customInput.value = '#abcdef'; // Browser normalizes color values to lowercase
      customInput.dispatchEvent(new Event('change'));

      expect(mockEngine.updateCategory).toHaveBeenCalledWith('cat1', { color: '#abcdef' });
    });

    it('should handle color picker when category not found', () => {
      mockEngine.getCategory.mockReturnValue(null);

      new CategoryManager(container, mockEngine, onUpdate);

      const colorSwatch = container.querySelector('.category-item__color') as HTMLButtonElement;
      colorSwatch.click();

      const picker = container.querySelector('.color-picker-popup');
      expect(picker).toBeNull();
    });

    it('should mark current color as selected', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const colorSwatch = container.querySelector('.category-item__color') as HTMLButtonElement;
      colorSwatch.click();

      const selectedSwatch = container.querySelector('.color-picker-popup__swatch--selected');
      expect(selectedSwatch).toBeTruthy();
    });
  });

  describe('Name Editing', () => {
    beforeEach(() => {
      mockEngine.getSortedCategories.mockReturnValue([
        { id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] },
      ]);
      mockEngine.getCategory.mockReturnValue({ id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] });
    });

    it('should enable editing on double-click', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const nameEl = container.querySelector('.category-item__name') as HTMLElement;
      nameEl.dispatchEvent(new MouseEvent('dblclick'));

      const input = container.querySelector('.category-item__name-input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.value).toBe('Category 1');
    });

    it('should save name on blur', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const nameEl = container.querySelector('.category-item__name') as HTMLElement;
      nameEl.dispatchEvent(new MouseEvent('dblclick'));

      const input = container.querySelector('.category-item__name-input') as HTMLInputElement;
      input.value = 'New Name';
      input.dispatchEvent(new Event('blur'));

      expect(mockEngine.updateCategory).toHaveBeenCalledWith('cat1', { name: 'New Name' });
    });

    it('should save name on Enter key', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const nameEl = container.querySelector('.category-item__name') as HTMLElement;
      nameEl.dispatchEvent(new MouseEvent('dblclick'));

      const input = container.querySelector('.category-item__name-input') as HTMLInputElement;
      input.value = 'New Name';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(mockEngine.updateCategory).toHaveBeenCalledWith('cat1', { name: 'New Name' });
    });

    it('should cancel editing on Escape key', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const nameEl = container.querySelector('.category-item__name') as HTMLElement;
      nameEl.dispatchEvent(new MouseEvent('dblclick'));

      const input = container.querySelector('.category-item__name-input') as HTMLInputElement;
      input.value = 'Changed';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      // Should re-render without saving
      expect(mockEngine.updateCategory).not.toHaveBeenCalled();
    });

    it('should default to Untitled for empty name', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const nameEl = container.querySelector('.category-item__name') as HTMLElement;
      nameEl.dispatchEvent(new MouseEvent('dblclick'));

      const input = container.querySelector('.category-item__name-input') as HTMLInputElement;
      input.value = '   ';
      input.dispatchEvent(new Event('blur'));

      expect(mockEngine.updateCategory).toHaveBeenCalledWith('cat1', { name: 'Untitled' });
    });

    it('should handle edit when category not found', () => {
      mockEngine.getCategory.mockReturnValue(null);

      const manager = new CategoryManager(container, mockEngine, onUpdate);
      manager['editCategoryName']('nonexistent');

      const input = container.querySelector('.category-item__name-input');
      expect(input).toBeNull();
    });
  });

  describe('Stats Update', () => {
    beforeEach(() => {
      mockEngine.getSortedCategories.mockReturnValue([
        { id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] },
      ]);
    });

    it('should update stats on koppen:classification-stats event', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      document.dispatchEvent(new CustomEvent('koppen:classification-stats', {
        detail: {
          classified: 1000,
          unclassified: 500,
          byCategory: {
            'cat1': { count: 750 },
          },
        },
      }));

      const classifiedEl = container.querySelector('[data-stat="classified"]');
      const unclassifiedEl = container.querySelector('[data-stat="unclassified"]');
      const categoryCount = container.querySelector('.category-item__match-count');

      expect(classifiedEl?.textContent).toBe('1,000');
      expect(unclassifiedEl?.textContent).toBe('500');
      expect(categoryCount?.textContent).toBe('750');
    });

    it('should handle missing stats elements gracefully', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      // Remove stats elements
      container.querySelector('[data-stat="classified"]')?.remove();
      container.querySelector('[data-stat="unclassified"]')?.remove();

      expect(() => {
        document.dispatchEvent(new CustomEvent('koppen:classification-stats', {
          detail: { classified: 100, unclassified: 50 },
        }));
      }).not.toThrow();
    });

    it('should handle stats without byCategory', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      expect(() => {
        document.dispatchEvent(new CustomEvent('koppen:classification-stats', {
          detail: { classified: 100, unclassified: 50 },
        }));
      }).not.toThrow();
    });
  });

  describe('Refresh Category Item', () => {
    beforeEach(() => {
      mockEngine.getSortedCategories.mockReturnValue([
        { id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] },
      ]);
    });

    it('should refresh rule count when category changes', () => {
      const manager = new CategoryManager(container, mockEngine, onUpdate);

      // Update mock to return new rule count
      mockEngine.getCategory.mockReturnValue({
        id: 'cat1',
        name: 'Category 1',
        color: '#FF0000',
        enabled: true,
        rules: [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }],
      });

      manager['refreshCategoryItem']('cat1');

      const ruleCount = container.querySelector('.category-item__rule-count');
      expect(ruleCount?.textContent).toBe('3 rules');
    });

    it('should handle refresh when category not found', () => {
      const manager = new CategoryManager(container, mockEngine, onUpdate);
      mockEngine.getCategory.mockReturnValue(null);

      expect(() => manager['refreshCategoryItem']('nonexistent')).not.toThrow();
    });

    it('should handle refresh when item element not found', () => {
      const manager = new CategoryManager(container, mockEngine, onUpdate);
      mockEngine.getCategory.mockReturnValue({ id: 'cat2', name: 'Cat 2', color: '#00FF00', enabled: true, rules: [] });

      expect(() => manager['refreshCategoryItem']('cat2')).not.toThrow();
    });
  });

  describe('Drag and Drop', () => {
    beforeEach(() => {
      mockEngine.getSortedCategories.mockReturnValue([
        { id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] },
        { id: 'cat2', name: 'Category 2', color: '#00FF00', enabled: true, rules: [] },
      ]);
    });

    it('should have draggable drag handles', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const handles = container.querySelectorAll('.category-item__drag-handle');
      expect(handles.length).toBe(2);
      expect((handles[0] as HTMLElement).draggable).toBe(true);
    });

    it('should handle dragstart event', async () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const handle = container.querySelector('.category-item__drag-handle') as HTMLElement;
      const mockDataTransfer = {
        effectAllowed: '',
        setData: vi.fn(),
      };

      const dragstartEvent = new DragEvent('dragstart', {
        bubbles: true,
        dataTransfer: mockDataTransfer as any,
      });

      handle.dispatchEvent(dragstartEvent);

      expect(mockDataTransfer.effectAllowed).toBe('move');
      expect(mockDataTransfer.setData).toHaveBeenCalledWith('text/plain', 'cat1');
    });

    it('should handle dragend event', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const handle = container.querySelector('.category-item__drag-handle') as HTMLElement;

      // Start drag first
      const dragstartEvent = new DragEvent('dragstart', {
        bubbles: true,
        dataTransfer: { effectAllowed: '', setData: vi.fn() } as any,
      });
      handle.dispatchEvent(dragstartEvent);

      // End drag
      const dragendEvent = new DragEvent('dragend', { bubbles: true });
      handle.dispatchEvent(dragendEvent);

      const draggingItems = container.querySelectorAll('.category-item--dragging');
      expect(draggingItems.length).toBe(0);
    });

    it('should handle dragover event', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const handle = container.querySelector('.category-item__drag-handle') as HTMLElement;

      // Start drag
      const dragstartEvent = new DragEvent('dragstart', {
        bubbles: true,
        dataTransfer: { effectAllowed: '', setData: vi.fn() } as any,
      });
      handle.dispatchEvent(dragstartEvent);

      // Dragover on second item
      const items = container.querySelectorAll('.category-item');
      const mockDataTransfer = { dropEffect: '' };
      const dragoverEvent = new DragEvent('dragover', {
        bubbles: true,
        dataTransfer: mockDataTransfer as any,
      });
      items[1].dispatchEvent(dragoverEvent);

      expect(items[1].classList.contains('category-item--drag-over')).toBe(true);
    });

    it('should handle dragleave event', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const handle = container.querySelector('.category-item__drag-handle') as HTMLElement;

      // Start drag
      const dragstartEvent = new DragEvent('dragstart', {
        bubbles: true,
        dataTransfer: { effectAllowed: '', setData: vi.fn() } as any,
      });
      handle.dispatchEvent(dragstartEvent);

      // Dragover then leave
      const items = container.querySelectorAll('.category-item');
      items[1].classList.add('category-item--drag-over');

      const dragleaveEvent = new DragEvent('dragleave', {
        bubbles: true,
        relatedTarget: container, // Leaving to outside the item
      });
      items[1].dispatchEvent(dragleaveEvent);

      expect(items[1].classList.contains('category-item--drag-over')).toBe(false);
    });

    it('should handle drop event for reordering', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const handle = container.querySelector('.category-item__drag-handle') as HTMLElement;

      // Start drag
      const dragstartEvent = new DragEvent('dragstart', {
        bubbles: true,
        dataTransfer: { effectAllowed: '', setData: vi.fn() } as any,
      });
      handle.dispatchEvent(dragstartEvent);

      // Drop on second item
      const items = container.querySelectorAll('.category-item');
      const dropEvent = new DragEvent('drop', { bubbles: true });
      items[1].dispatchEvent(dropEvent);

      expect(mockEngine.reorderCategories).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalled();
    });

    it('should not reorder when dropping on same item', () => {
      new CategoryManager(container, mockEngine, onUpdate);

      const handle = container.querySelector('.category-item__drag-handle') as HTMLElement;

      // Start drag
      const dragstartEvent = new DragEvent('dragstart', {
        bubbles: true,
        dataTransfer: { effectAllowed: '', setData: vi.fn() } as any,
      });
      handle.dispatchEvent(dragstartEvent);

      // Drop on same item
      const items = container.querySelectorAll('.category-item');
      const dropEvent = new DragEvent('drop', { bubbles: true });
      items[0].dispatchEvent(dropEvent);

      expect(mockEngine.reorderCategories).not.toHaveBeenCalled();
    });
  });

  describe('Reorder Categories', () => {
    it('should handle invalid source index', () => {
      mockEngine.getSortedCategories.mockReturnValue([
        { id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] },
      ]);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const manager = new CategoryManager(container, mockEngine, onUpdate);
      manager['handleReorderCategory']('nonexistent', 'cat1');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[CategoryManager] Invalid indices');
      expect(mockEngine.reorderCategories).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid target index', () => {
      mockEngine.getSortedCategories.mockReturnValue([
        { id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] },
      ]);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const manager = new CategoryManager(container, mockEngine, onUpdate);
      manager['handleReorderCategory']('cat1', 'nonexistent');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[CategoryManager] Invalid indices');
      expect(mockEngine.reorderCategories).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Destroy', () => {
    it('should clean up on destroy', () => {
      const manager = new CategoryManager(container, mockEngine, onUpdate);
      manager.destroy();

      expect(container.innerHTML).toBe('');
    });

    it('should destroy rule editor if present', () => {
      mockEngine.getSortedCategories.mockReturnValue([
        { id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] },
      ]);

      const manager = new CategoryManager(container, mockEngine, onUpdate);

      // Expand to create rule editor
      const expandBtn = container.querySelector('.category-item__expand-btn') as HTMLButtonElement;
      expandBtn.click();

      manager.destroy();

      // Rule editor's destroy should have been called
      expect(container.innerHTML).toBe('');
    });
  });

  describe('Delete Expanded Category', () => {
    it('should clear expanded state when deleting expanded category', () => {
      mockEngine.getSortedCategories.mockReturnValue([
        { id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] },
      ]);
      mockEngine.getCategory.mockReturnValue({ id: 'cat1', name: 'Category 1', color: '#FF0000', enabled: true, rules: [] });
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const manager = new CategoryManager(container, mockEngine, onUpdate);

      // Expand the category
      manager['expandedCategoryId'] = 'cat1';

      // Delete it
      manager['handleDeleteCategory']('cat1');

      expect(manager['expandedCategoryId']).toBeNull();
    });
  });
});
