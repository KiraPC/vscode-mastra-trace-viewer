/**
 * Tests for highlightHelper utilities
 */

import { describe, it, expect } from 'vitest';
import {
  countHiddenMatches,
  isSpanMatch,
  createResultsSet,
} from './highlightHelper';
import type { SpanTreeNode } from '../../models/tree.types';
import type { Span } from '../../models/trace.types';

// Helper to create minimal SpanTreeNode for testing
function createNode(spanId: string, children: SpanTreeNode[] = []): SpanTreeNode {
  const originalSpan: Span = {
    traceId: 'trace-1',
    spanId,
    parentSpanId: null,
    name: `Span ${spanId}`,
    spanType: 'custom',
    startedAt: new Date().toISOString(),
  };
  return {
    spanId,
    parentSpanId: null,
    name: `Span ${spanId}`,
    spanType: 'custom',
    startedAt: new Date().toISOString(),
    children,
    depth: 0,
    originalSpan,
  };
}

describe('highlightHelper', () => {
  describe('countHiddenMatches', () => {
    it('should return 0 for empty children', () => {
      expect(countHiddenMatches([], ['span-1'])).toBe(0);
    });

    it('should return 0 for empty search results', () => {
      const children = [createNode('span-1')];
      expect(countHiddenMatches(children, [])).toBe(0);
    });

    it('should count single match in direct children', () => {
      const children = [
        createNode('span-1'),
        createNode('span-2'),
        createNode('span-3'),
      ];
      expect(countHiddenMatches(children, ['span-2'])).toBe(1);
    });

    it('should count multiple matches in direct children', () => {
      const children = [
        createNode('span-1'),
        createNode('span-2'),
        createNode('span-3'),
      ];
      expect(countHiddenMatches(children, ['span-1', 'span-3'])).toBe(2);
    });

    it('should count matches in nested children', () => {
      const children = [
        createNode('span-1', [
          createNode('span-1a'),
          createNode('span-1b'),
        ]),
        createNode('span-2'),
      ];
      expect(countHiddenMatches(children, ['span-1a'])).toBe(1);
    });

    it('should count matches at all levels of nesting', () => {
      const children = [
        createNode('span-1', [
          createNode('span-1a', [
            createNode('span-1a1'),
          ]),
        ]),
      ];
      expect(countHiddenMatches(children, ['span-1', 'span-1a', 'span-1a1'])).toBe(3);
    });

    it('should count matches across multiple branches', () => {
      const children = [
        createNode('span-1', [
          createNode('span-1a'),
          createNode('span-1b'),
        ]),
        createNode('span-2', [
          createNode('span-2a'),
        ]),
      ];
      expect(countHiddenMatches(children, ['span-1a', 'span-2a'])).toBe(2);
    });

    it('should not double-count spans', () => {
      const children = [
        createNode('span-1'),
        createNode('span-2'),
      ];
      // Same spanId in results multiple times should still count as 1
      expect(countHiddenMatches(children, ['span-1', 'span-1'])).toBe(1);
    });

    it('should handle deep nesting efficiently', () => {
      // Create a deeply nested tree (10 levels)
      let deepNode = createNode('deep-10');
      for (let i = 9; i >= 1; i--) {
        deepNode = createNode(`deep-${i}`, [deepNode]);
      }
      const children = [deepNode];

      expect(countHiddenMatches(children, ['deep-5', 'deep-10'])).toBe(2);
    });

    describe('performance', () => {
      it('should handle 500 spans with 50 matches efficiently', () => {
        // Create flat children list
        const children: SpanTreeNode[] = [];
        for (let i = 0; i < 500; i++) {
          children.push(createNode(`span-${i}`));
        }

        // Create 50 matches (every 10th span)
        const searchResults = [];
        for (let i = 0; i < 500; i += 10) {
          searchResults.push(`span-${i}`);
        }

        const startTime = performance.now();
        const count = countHiddenMatches(children, searchResults);
        const endTime = performance.now();

        expect(count).toBe(50);
        expect(endTime - startTime).toBeLessThan(50); // Should complete in <50ms
      });
    });
  });

  describe('isSpanMatch', () => {
    it('should return true for matching span', () => {
      const resultsSet = new Set(['span-1', 'span-2', 'span-3']);
      expect(isSpanMatch('span-2', resultsSet)).toBe(true);
    });

    it('should return false for non-matching span', () => {
      const resultsSet = new Set(['span-1', 'span-2']);
      expect(isSpanMatch('span-3', resultsSet)).toBe(false);
    });

    it('should return false for empty results set', () => {
      const resultsSet = new Set<string>();
      expect(isSpanMatch('span-1', resultsSet)).toBe(false);
    });
  });

  describe('createResultsSet', () => {
    it('should create Set from array', () => {
      const results = ['span-1', 'span-2', 'span-3'];
      const set = createResultsSet(results);

      expect(set.has('span-1')).toBe(true);
      expect(set.has('span-2')).toBe(true);
      expect(set.has('span-3')).toBe(true);
      expect(set.has('span-4')).toBe(false);
    });

    it('should handle empty array', () => {
      const set = createResultsSet([]);
      expect(set.size).toBe(0);
    });

    it('should deduplicate array', () => {
      const results = ['span-1', 'span-1', 'span-2'];
      const set = createResultsSet(results);
      expect(set.size).toBe(2);
    });
  });
});
