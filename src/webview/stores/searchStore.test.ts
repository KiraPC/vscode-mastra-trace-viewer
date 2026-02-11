/**
 * Tests for searchStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  query,
  results,
  currentIndex,
  hasResults,
  getResultCount,
  setQuery,
  setResults,
  clearSearch,
  nextResult,
  prevResult,
  getCurrentResultSpanId,
} from './searchStore';

describe('searchStore', () => {
  beforeEach(() => {
    clearSearch();
  });

  describe('query store', () => {
    it('should start empty', () => {
      expect(get(query)).toBe('');
    });

    it('should update via setQuery', () => {
      setQuery('test search');
      expect(get(query)).toBe('test search');
    });

    it('should be empty after clearSearch', () => {
      setQuery('test');
      clearSearch();
      expect(get(query)).toBe('');
    });
  });

  describe('results store', () => {
    it('should start as empty array', () => {
      expect(get(results)).toEqual([]);
    });

    it('should update via setResults', () => {
      setResults(['span-1', 'span-2', 'span-3']);
      expect(get(results)).toEqual(['span-1', 'span-2', 'span-3']);
    });

    it('should be empty after clearSearch', () => {
      setResults(['span-1']);
      clearSearch();
      expect(get(results)).toEqual([]);
    });
  });

  describe('currentIndex store', () => {
    it('should start as -1', () => {
      expect(get(currentIndex)).toBe(-1);
    });

    it('should be 0 when results are set', () => {
      setResults(['span-1', 'span-2']);
      expect(get(currentIndex)).toBe(0);
    });

    it('should be -1 when empty results are set', () => {
      setResults(['span-1']);
      setResults([]);
      expect(get(currentIndex)).toBe(-1);
    });

    it('should be -1 after clearSearch', () => {
      setResults(['span-1', 'span-2']);
      clearSearch();
      expect(get(currentIndex)).toBe(-1);
    });
  });

  describe('hasResults', () => {
    it('should return false when no results', () => {
      expect(hasResults()).toBe(false);
    });

    it('should return true when results exist', () => {
      setResults(['span-1']);
      expect(hasResults()).toBe(true);
    });
  });

  describe('getResultCount', () => {
    it('should return 0 when no results', () => {
      expect(getResultCount()).toBe(0);
    });

    it('should return correct count', () => {
      setResults(['span-1', 'span-2', 'span-3']);
      expect(getResultCount()).toBe(3);
    });
  });

  describe('nextResult', () => {
    it('should return false when no results', () => {
      const wrapped = nextResult();
      expect(wrapped).toBe(false);
      expect(get(currentIndex)).toBe(-1);
    });

    it('should increment currentIndex and return false', () => {
      setResults(['span-1', 'span-2', 'span-3']);
      expect(get(currentIndex)).toBe(0);
      const wrapped1 = nextResult();
      expect(wrapped1).toBe(false);
      expect(get(currentIndex)).toBe(1);
      const wrapped2 = nextResult();
      expect(wrapped2).toBe(false);
      expect(get(currentIndex)).toBe(2);
    });

    it('should wrap around to 0 at end and return true', () => {
      setResults(['span-1', 'span-2']);
      nextResult(); // 0 -> 1
      const wrapped = nextResult(); // 1 -> 0 (wrap)
      expect(wrapped).toBe(true);
      expect(get(currentIndex)).toBe(0);
    });
  });

  describe('prevResult', () => {
    it('should return false when no results', () => {
      const wrapped = prevResult();
      expect(wrapped).toBe(false);
      expect(get(currentIndex)).toBe(-1);
    });

    it('should decrement currentIndex and return false', () => {
      setResults(['span-1', 'span-2', 'span-3']);
      nextResult(); // 0 -> 1
      nextResult(); // 1 -> 2
      const wrapped = prevResult(); // 2 -> 1
      expect(wrapped).toBe(false);
      expect(get(currentIndex)).toBe(1);
    });

    it('should wrap around to last at beginning and return true', () => {
      setResults(['span-1', 'span-2', 'span-3']);
      expect(get(currentIndex)).toBe(0);
      const wrapped = prevResult(); // 0 -> 2 (wrap)
      expect(wrapped).toBe(true);
      expect(get(currentIndex)).toBe(2);
    });
  });

  describe('getCurrentResultSpanId', () => {
    it('should return null when no results', () => {
      expect(getCurrentResultSpanId()).toBeNull();
    });

    it('should return first span after setResults', () => {
      setResults(['span-1', 'span-2', 'span-3']);
      expect(getCurrentResultSpanId()).toBe('span-1');
    });

    it('should return correct span after navigation', () => {
      setResults(['span-1', 'span-2', 'span-3']);
      nextResult();
      expect(getCurrentResultSpanId()).toBe('span-2');
      nextResult();
      expect(getCurrentResultSpanId()).toBe('span-3');
    });

    it('should return null after clearSearch', () => {
      setResults(['span-1']);
      clearSearch();
      expect(getCurrentResultSpanId()).toBeNull();
    });
  });

  describe('clearSearch', () => {
    it('should reset all state', () => {
      setQuery('test query');
      setResults(['span-1', 'span-2']);
      nextResult();

      clearSearch();

      expect(get(query)).toBe('');
      expect(get(results)).toEqual([]);
      expect(get(currentIndex)).toBe(-1);
    });
  });
});
