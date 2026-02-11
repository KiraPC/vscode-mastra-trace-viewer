/**
 * TraceCache - LRU (Least Recently Used) cache for trace data
 *
 * Implements an in-memory cache with automatic eviction of least recently
 * accessed entries when capacity is exceeded. Uses JavaScript Map for O(1)
 * operations and insertion order preservation.
 */

import type { Trace } from '../models/trace.types';

export class TraceCache {
  private cache: Map<string, Trace> = new Map();
  private readonly maxSize: number;

  /**
   * Create a new TraceCache instance
   * @param maxSize Maximum number of traces to cache (default: 100)
   */
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Retrieve a trace from the cache by ID
   * Updates LRU order by moving accessed item to end
   * @param id The trace ID to retrieve
   * @returns The cached trace or undefined if not found
   */
  get(id: string): Trace | undefined {
    const trace = this.cache.get(id);
    if (trace) {
      // Move to end (most recently used) by delete + re-add
      this.cache.delete(id);
      this.cache.set(id, trace);
    }
    return trace;
  }

  /**
   * Store a trace in the cache
   * Evicts oldest entry if capacity is exceeded
   * @param id The trace ID to use as key
   * @param trace The trace data to cache
   */
  set(id: string, trace: Trace): void {
    // If exists, delete first to update order
    if (this.cache.has(id)) {
      this.cache.delete(id);
    }

    // Evict oldest (first in map) if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }

    this.cache.set(id, trace);
  }

  /**
   * Check if a trace exists in the cache
   * Does NOT update LRU order
   * @param id The trace ID to check
   * @returns true if trace is cached, false otherwise
   */
  has(id: string): boolean {
    return this.cache.has(id);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Current number of cached entries
   */
  get size(): number {
    return this.cache.size;
  }
}
