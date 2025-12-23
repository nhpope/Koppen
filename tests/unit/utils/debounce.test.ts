/**
 * Unit Tests: Debounce Utility - Story 6.7
 * Tests for debounce and throttle functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle } from '../../../src/utils/debounce.js';

describe('Debounce Utility - Story 6.7', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('debounce', () => {
    it('should delay function execution until after wait period', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 500);

      debouncedFunc();
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(499);
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on subsequent calls', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 500);

      debouncedFunc();
      vi.advanceTimersByTime(300);

      debouncedFunc(); // Reset timer
      vi.advanceTimersByTime(300);
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(200);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should only call function once after multiple rapid calls', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 500);

      // Call 10 times rapidly
      for (let i = 0; i < 10; i++) {
        debouncedFunc();
        vi.advanceTimersByTime(50);
      }

      // Function should not have been called yet
      expect(func).not.toHaveBeenCalled();

      // Wait for debounce period
      vi.advanceTimersByTime(500);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to debounced function', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc('arg1', 'arg2', 123);
      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });

    it('should preserve context (this)', () => {
      const obj = {
        value: 42,
        func: vi.fn(function (this: any) {
          return this.value;
        }),
      };

      const debouncedFunc = debounce(obj.func, 100);
      obj.debouncedFunc = debouncedFunc;

      obj.debouncedFunc();
      vi.advanceTimersByTime(100);

      expect(obj.func).toHaveBeenCalled();
    });

    it('should use default wait time of 300ms when not specified', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func);

      debouncedFunc();
      vi.advanceTimersByTime(299);
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(func).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should call function immediately on first invocation', () => {
      const func = vi.fn();
      const throttledFunc = throttle(func, 500);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should prevent function calls within throttle period', () => {
      const func = vi.fn();
      const throttledFunc = throttle(func, 500);

      throttledFunc(); // Call 1 (immediate)
      expect(func).toHaveBeenCalledTimes(1);

      throttledFunc(); // Ignored (within throttle period)
      throttledFunc(); // Ignored
      expect(func).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(500);

      throttledFunc(); // Call 2 (after throttle period)
      expect(func).toHaveBeenCalledTimes(2);
    });

    it('should allow function calls after throttle period expires', () => {
      const func = vi.fn();
      const throttledFunc = throttle(func, 300);

      throttledFunc(); // Call 1
      expect(func).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(300);

      throttledFunc(); // Call 2
      expect(func).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(300);

      throttledFunc(); // Call 3
      expect(func).toHaveBeenCalledTimes(3);
    });

    it('should pass arguments to throttled function', () => {
      const func = vi.fn();
      const throttledFunc = throttle(func, 100);

      throttledFunc('test', 42);
      expect(func).toHaveBeenCalledWith('test', 42);
    });

    it('should preserve context (this)', () => {
      const obj = {
        value: 42,
        func: vi.fn(function (this: any) {
          return this.value;
        }),
      };

      const throttledFunc = throttle(obj.func, 100);
      obj.throttledFunc = throttledFunc;

      obj.throttledFunc();
      expect(obj.func).toHaveBeenCalled();
    });

    it('should use default limit of 300ms when not specified', () => {
      const func = vi.fn();
      const throttledFunc = throttle(func);

      throttledFunc(); // Call 1
      expect(func).toHaveBeenCalledTimes(1);

      throttledFunc(); // Ignored
      expect(func).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(300);

      throttledFunc(); // Call 2
      expect(func).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid calls correctly', () => {
      const func = vi.fn();
      const throttledFunc = throttle(func, 500);

      // Call 100 times rapidly over 1000ms (10ms intervals)
      // At t=0: Call 1 executes
      // At t=500: Throttle expires, Call 51 executes
      // At t=1000: Throttle expires again, but we stop before calling
      for (let i = 0; i < 100; i++) {
        throttledFunc();
        vi.advanceTimersByTime(10);
      }

      // Two calls should have executed (at t=0 and t=500)
      expect(func).toHaveBeenCalledTimes(2);

      // Wait for throttle to expire
      vi.advanceTimersByTime(500);

      // Next call should execute
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(3);
    });
  });

  describe('Debounce vs Throttle Comparison', () => {
    it('debounce waits for silence, throttle limits frequency', () => {
      const debouncedFunc = vi.fn();
      const throttledFunc = vi.fn();

      const debounced = debounce(debouncedFunc, 500);
      const throttled = throttle(throttledFunc, 500);

      // Call both 10 times over 1 second
      for (let i = 0; i < 10; i++) {
        debounced();
        throttled();
        vi.advanceTimersByTime(100);
      }

      // Debounced: not called yet (no silence)
      expect(debouncedFunc).not.toHaveBeenCalled();

      // Throttled: called immediately (1st call) and once more after 500ms (2nd call)
      expect(throttledFunc).toHaveBeenCalledTimes(2);

      // Wait for debounce to fire
      vi.advanceTimersByTime(500);

      // Debounced: now called once (after silence)
      expect(debouncedFunc).toHaveBeenCalledTimes(1);

      // Throttled: no additional calls
      expect(throttledFunc).toHaveBeenCalledTimes(2);
    });
  });
});
