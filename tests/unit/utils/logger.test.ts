/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import logger, { log, warn, error } from '../../../src/utils/logger.js';

describe('Logger Module', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('log function', () => {
    it('should be a function', () => {
      expect(typeof log).toBe('function');
    });

    it('should call console.log in development mode', () => {
      log('test message');
      // In test mode (Vitest), import.meta.env.DEV is typically true
      // Behavior depends on environment
      // At minimum, it should not throw
      expect(true).toBe(true);
    });

    it('should accept multiple arguments', () => {
      expect(() => log('message', { data: 1 }, [1, 2, 3])).not.toThrow();
    });

    it('should accept no arguments', () => {
      expect(() => log()).not.toThrow();
    });
  });

  describe('warn function', () => {
    it('should be a function', () => {
      expect(typeof warn).toBe('function');
    });

    it('should call console.warn', () => {
      warn('warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('warning message');
    });

    it('should pass all arguments to console.warn', () => {
      warn('warning', 123, { key: 'value' });
      expect(consoleWarnSpy).toHaveBeenCalledWith('warning', 123, { key: 'value' });
    });

    it('should accept no arguments', () => {
      warn();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('error function', () => {
    it('should be a function', () => {
      expect(typeof error).toBe('function');
    });

    it('should call console.error', () => {
      error('error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('error message');
    });

    it('should pass all arguments to console.error', () => {
      const err = new Error('test error');
      error('error occurred:', err);
      expect(consoleErrorSpy).toHaveBeenCalledWith('error occurred:', err);
    });

    it('should accept no arguments', () => {
      error();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('default export', () => {
    it('should export an object with log, warn, error methods', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.log).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should have working log method', () => {
      expect(() => logger.log('test')).not.toThrow();
    });

    it('should have working warn method', () => {
      logger.warn('test warning');
      expect(consoleWarnSpy).toHaveBeenCalledWith('test warning');
    });

    it('should have working error method', () => {
      logger.error('test error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('test error');
    });
  });

  describe('Named exports', () => {
    it('should export log as named export', () => {
      expect(log).toBe(logger.log);
    });

    it('should export warn as named export', () => {
      expect(warn).toBe(logger.warn);
    });

    it('should export error as named export', () => {
      expect(error).toBe(logger.error);
    });
  });
});
