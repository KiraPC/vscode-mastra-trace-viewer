/**
 * Tests for performance logger utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logPerformance, measureRender, measureFlatten, logScrollMetrics, setDevMode } from './performanceLogger';

describe('performanceLogger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    setDevMode(false);
  });

  describe('logPerformance', () => {
    it('should execute the function and return its result', () => {
      const result = logPerformance('test', () => 42);
      expect(result).toBe(42);
    });

    it('should log performance in dev mode', () => {
      setDevMode(true);
      logPerformance('test operation', () => {});
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should not log in production mode', () => {
      setDevMode(false);
      logPerformance('test operation', () => {});
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('measureRender', () => {
    it('should log render metrics in dev mode', () => {
      setDevMode(true);
      measureRender(100, 15.5);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rendered 100 spans')
      );
    });

    it('should not log render metrics in production mode', () => {
      setDevMode(false);
      measureRender(100, 15.5);
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('measureFlatten', () => {
    it('should log flatten metrics in dev mode', () => {
      setDevMode(true);
      measureFlatten(100, 50, 2.5);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should not log flatten metrics in production mode', () => {
      setDevMode(false);
      measureFlatten(100, 50, 2.5);
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('logScrollMetrics', () => {
    it('should log scroll metrics in dev mode', () => {
      setDevMode(true);
      logScrollMetrics(0, 20, 100);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should not log scroll metrics in production mode', () => {
      setDevMode(false);
      logScrollMetrics(0, 20, 100);
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
