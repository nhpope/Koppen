/**
 * Vitest Smoke Test
 * Validates that Vitest is configured correctly
 */

import { describe, it, expect } from 'vitest';

describe('Vitest Setup', () => {
  it('should run basic assertions', () => {
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
  });

  it('should have jsdom environment available', () => {
    expect(document).toBeDefined();
    expect(window).toBeDefined();
    expect(navigator).toBeDefined();
  });

  it('should have clean DOM between tests', () => {
    document.body.textContent = 'test content';
    expect(document.body.textContent).toBe('test content');
    // Cleanup happens automatically via tests/setup.ts afterEach
  });

  it('should support async tests', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  it('should support timers', () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    setTimeout(callback, 1000);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });
});
