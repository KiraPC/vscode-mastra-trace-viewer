/**
 * Unit tests for TraceCache
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TraceCache } from './traceCache';
import type { Trace } from '../models/trace.types';

// Helper to create a mock trace
function createMockTrace(id: string): Trace {
  return {
    traceId: id,
    spans: [
      {
        traceId: id,
        spanId: `span-${id}`,
        parentSpanId: null,
        name: `Test Span ${id}`,
        spanType: 'agent_run',
        startedAt: new Date().toISOString(),
      },
    ],
  };
}

describe('TraceCache', () => {
  let cache: TraceCache;

  beforeEach(() => {
    cache = new TraceCache(5); // Small cache for testing
  });

  describe('set()', () => {
    it('stores trace by id', () => {
      const trace = createMockTrace('trace-1');
      cache.set('trace-1', trace);
      expect(cache.size).toBe(1);
    });

    it('updates existing trace without increasing size', () => {
      const trace1 = createMockTrace('trace-1');
      const trace2 = createMockTrace('trace-1');
      trace2.exportedAt = 'updated';

      cache.set('trace-1', trace1);
      cache.set('trace-1', trace2);

      expect(cache.size).toBe(1);
      expect(cache.get('trace-1')?.exportedAt).toBe('updated');
    });
  });

  describe('get()', () => {
    it('returns cached trace', () => {
      const trace = createMockTrace('trace-1');
      cache.set('trace-1', trace);
      const retrieved = cache.get('trace-1');
      expect(retrieved).toEqual(trace);
    });

    it('returns undefined for missing id', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('updates LRU order when accessed', () => {
      // Fill cache with 5 items
      for (let i = 1; i <= 5; i++) {
        cache.set(`trace-${i}`, createMockTrace(`trace-${i}`));
      }

      // Access trace-1 (moves it to most recently used)
      cache.get('trace-1');

      // Add trace-6, should evict trace-2 (oldest now)
      cache.set('trace-6', createMockTrace('trace-6'));

      // trace-1 should still exist (was recently accessed)
      expect(cache.has('trace-1')).toBe(true);
      // trace-2 should be evicted
      expect(cache.has('trace-2')).toBe(false);
      // trace-6 should exist
      expect(cache.has('trace-6')).toBe(true);
    });
  });

  describe('has()', () => {
    it('returns true for existing id', () => {
      cache.set('trace-1', createMockTrace('trace-1'));
      expect(cache.has('trace-1')).toBe(true);
    });

    it('returns false for missing id', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });
  });

  describe('clear()', () => {
    it('empties the cache', () => {
      cache.set('trace-1', createMockTrace('trace-1'));
      cache.set('trace-2', createMockTrace('trace-2'));
      expect(cache.size).toBe(2);

      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.has('trace-1')).toBe(false);
      expect(cache.has('trace-2')).toBe(false);
    });
  });

  describe('LRU eviction', () => {
    it('evicts oldest entry when capacity exceeded', () => {
      // Fill cache to capacity (5)
      for (let i = 1; i <= 5; i++) {
        cache.set(`trace-${i}`, createMockTrace(`trace-${i}`));
      }
      expect(cache.size).toBe(5);

      // Add one more - should evict trace-1
      cache.set('trace-6', createMockTrace('trace-6'));
      expect(cache.size).toBe(5);
      expect(cache.has('trace-1')).toBe(false);
      expect(cache.has('trace-6')).toBe(true);
    });

    it('correctly evicts when adding 101 entries to default cache', () => {
      const bigCache = new TraceCache(); // default maxSize = 100
      
      // Add 101 traces
      for (let i = 1; i <= 101; i++) {
        bigCache.set(`trace-${i}`, createMockTrace(`trace-${i}`));
      }

      expect(bigCache.size).toBe(100);
      // First trace should be evicted
      expect(bigCache.has('trace-1')).toBe(false);
      // Last trace should exist
      expect(bigCache.has('trace-101')).toBe(true);
      // Second trace should also be evicted after 101 entries
      expect(bigCache.has('trace-2')).toBe(true);
    });

    it('get() updates LRU order preventing eviction', () => {
      const cache3 = new TraceCache(3);

      // Add 3 traces
      cache3.set('a', createMockTrace('a'));
      cache3.set('b', createMockTrace('b'));
      cache3.set('c', createMockTrace('c'));

      // Access 'a' - moves it to MRU position
      cache3.get('a');

      // Add 'd' - should evict 'b' (now oldest)
      cache3.set('d', createMockTrace('d'));

      expect(cache3.has('a')).toBe(true); // Recently accessed
      expect(cache3.has('b')).toBe(false); // Evicted
      expect(cache3.has('c')).toBe(true);
      expect(cache3.has('d')).toBe(true);
    });
  });

  describe('size', () => {
    it('returns 0 for empty cache', () => {
      expect(cache.size).toBe(0);
    });

    it('returns correct count after adds', () => {
      cache.set('trace-1', createMockTrace('trace-1'));
      expect(cache.size).toBe(1);

      cache.set('trace-2', createMockTrace('trace-2'));
      expect(cache.size).toBe(2);
    });

    it('does not exceed maxSize', () => {
      for (let i = 1; i <= 10; i++) {
        cache.set(`trace-${i}`, createMockTrace(`trace-${i}`));
      }
      expect(cache.size).toBe(5); // maxSize for test cache
    });
  });
});
