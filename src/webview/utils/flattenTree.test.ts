/**
 * Tests for flattenTree utility
 */

import { describe, it, expect } from 'vitest';
import { flattenVisibleNodes, type FlatSpanItem } from './flattenTree';
import type { SpanTreeNode } from '../../models/tree.types';

// Helper to create a mock span node
function createMockNode(
  spanId: string,
  name: string,
  children: SpanTreeNode[] = [],
  depth = 0
): SpanTreeNode {
  return {
    spanId,
    parentSpanId: null,
    name,
    spanType: 'test',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    children,
    depth,
    originalSpan: {
      spanId,
      parentSpanId: null,
      name,
      traceId: 'test-trace',
      spanType: 'test',
      startedAt: new Date().toISOString(),
      scope: 'test',
      createdAt: new Date().toISOString(),
    },
  };
}

describe('flattenVisibleNodes', () => {
  it('should return empty array for empty tree', () => {
    const result = flattenVisibleNodes([], new Set());
    expect(result).toEqual([]);
  });

  it('should flatten a single root node', () => {
    const root = createMockNode('span-1', 'Root Span');
    const result = flattenVisibleNodes([root], new Set());

    expect(result).toHaveLength(1);
    expect(result[0].node.spanId).toBe('span-1');
    expect(result[0].depth).toBe(0);
    expect(result[0].isExpanded).toBe(false);
    expect(result[0].hasChildren).toBe(false);
  });

  it('should include multiple root nodes', () => {
    const roots = [
      createMockNode('span-1', 'Root 1'),
      createMockNode('span-2', 'Root 2'),
      createMockNode('span-3', 'Root 3'),
    ];
    const result = flattenVisibleNodes(roots, new Set());

    expect(result).toHaveLength(3);
    expect(result.map((r: FlatSpanItem) => r.node.spanId)).toEqual(['span-1', 'span-2', 'span-3']);
  });

  it('should not include children when parent is collapsed', () => {
    const child = createMockNode('child-1', 'Child', [], 1);
    const root = createMockNode('parent-1', 'Parent', [child]);

    const result = flattenVisibleNodes([root], new Set());

    expect(result).toHaveLength(1);
    expect(result[0].node.spanId).toBe('parent-1');
    expect(result[0].hasChildren).toBe(true);
    expect(result[0].isExpanded).toBe(false);
  });

  it('should include children when parent is expanded', () => {
    const child = createMockNode('child-1', 'Child', [], 1);
    const root = createMockNode('parent-1', 'Parent', [child]);

    const expandedIds = new Set(['parent-1']);
    const result = flattenVisibleNodes([root], expandedIds);

    expect(result).toHaveLength(2);
    expect(result[0].node.spanId).toBe('parent-1');
    expect(result[0].isExpanded).toBe(true);
    expect(result[1].node.spanId).toBe('child-1');
    expect(result[1].depth).toBe(1);
  });

  it('should handle deep nesting with proper depths', () => {
    const grandchild = createMockNode('grandchild', 'Grandchild', [], 2);
    const child = createMockNode('child', 'Child', [grandchild], 1);
    const root = createMockNode('root', 'Root', [child]);

    const expandedIds = new Set(['root', 'child']);
    const result = flattenVisibleNodes([root], expandedIds);

    expect(result).toHaveLength(3);
    expect(result[0].depth).toBe(0);
    expect(result[1].depth).toBe(1);
    expect(result[2].depth).toBe(2);
  });

  it('should track path correctly for nested nodes', () => {
    const grandchild = createMockNode('grandchild', 'Grandchild', [], 2);
    const child = createMockNode('child', 'Child', [grandchild], 1);
    const root = createMockNode('root', 'Root', [child]);

    const expandedIds = new Set(['root', 'child']);
    const result = flattenVisibleNodes([root], expandedIds);

    expect(result[0].path).toEqual(['root']);
    expect(result[1].path).toEqual(['root', 'child']);
    expect(result[2].path).toEqual(['root', 'child', 'grandchild']);
  });

  it('should only show first level when nested parent is collapsed', () => {
    const grandchild = createMockNode('grandchild', 'Grandchild', [], 2);
    const child = createMockNode('child', 'Child', [grandchild], 1);
    const root = createMockNode('root', 'Root', [child]);

    // Only root is expanded, child is not
    const expandedIds = new Set(['root']);
    const result = flattenVisibleNodes([root], expandedIds);

    expect(result).toHaveLength(2);
    expect(result[0].node.spanId).toBe('root');
    expect(result[1].node.spanId).toBe('child');
    expect(result[1].hasChildren).toBe(true);
    expect(result[1].isExpanded).toBe(false);
  });

  it('should handle multiple children at same level', () => {
    const child1 = createMockNode('child-1', 'Child 1', [], 1);
    const child2 = createMockNode('child-2', 'Child 2', [], 1);
    const child3 = createMockNode('child-3', 'Child 3', [], 1);
    const root = createMockNode('root', 'Root', [child1, child2, child3]);

    const expandedIds = new Set(['root']);
    const result = flattenVisibleNodes([root], expandedIds);

    expect(result).toHaveLength(4);
    expect(result.map((r: FlatSpanItem) => r.node.spanId)).toEqual(['root', 'child-1', 'child-2', 'child-3']);
  });

  it('should correctly identify hasChildren for leaf nodes', () => {
    const child = createMockNode('child', 'Child', [], 1);
    const root = createMockNode('root', 'Root', [child]);

    const expandedIds = new Set(['root']);
    const result = flattenVisibleNodes([root], expandedIds);

    expect(result[0].hasChildren).toBe(true);
    expect(result[1].hasChildren).toBe(false);
  });

  it('should handle a tree with 100+ nodes efficiently', () => {
    // Create a flat tree with 100 children
    const children = Array.from({ length: 100 }, (_, i) =>
      createMockNode(`child-${i}`, `Child ${i}`, [], 1)
    );
    const root = createMockNode('root', 'Root', children);

    const expandedIds = new Set(['root']);
    const start = performance.now();
    const result = flattenVisibleNodes([root], expandedIds);
    const duration = performance.now() - start;

    expect(result).toHaveLength(101);
    expect(duration).toBeLessThan(50); // Should complete in under 50ms
  });

  it('should preserve node order', () => {
    const children = [
      createMockNode('a', 'A', [], 1),
      createMockNode('b', 'B', [], 1),
      createMockNode('c', 'C', [], 1),
    ];
    const root = createMockNode('root', 'Root', children);

    const expandedIds = new Set(['root']);
    const result = flattenVisibleNodes([root], expandedIds);

    const names = result.map((r: FlatSpanItem) => r.node.name);
    expect(names).toEqual(['Root', 'A', 'B', 'C']);
  });

  describe('edge cases', () => {
    it('should handle very deep nesting (20+ levels)', () => {
      // Create a deeply nested tree
      let current = createMockNode('leaf', 'Leaf', [], 20);
      const expandedIds = new Set<string>();

      for (let i = 19; i >= 0; i--) {
        const parentId = `level-${i}`;
        expandedIds.add(parentId);
        current = createMockNode(parentId, `Level ${i}`, [current], i);
      }

      const result = flattenVisibleNodes([current], expandedIds);

      expect(result).toHaveLength(21); // 20 levels + leaf
      expect(result[0].depth).toBe(0);
      expect(result[20].depth).toBe(20);
    });

    it('should handle nodes with empty children array', () => {
      const node = createMockNode('span', 'Span', []);
      const result = flattenVisibleNodes([node], new Set(['span']));

      expect(result).toHaveLength(1);
      expect(result[0].hasChildren).toBe(false);
      expect(result[0].isExpanded).toBe(true); // Expanded but no children
    });

    it('should handle rapid expand/collapse by recomputing correctly', () => {
      const child = createMockNode('child', 'Child', [], 1);
      const root = createMockNode('root', 'Root', [child]);

      // First collapsed
      let result = flattenVisibleNodes([root], new Set());
      expect(result).toHaveLength(1);

      // Then expanded
      result = flattenVisibleNodes([root], new Set(['root']));
      expect(result).toHaveLength(2);

      // Then collapsed again
      result = flattenVisibleNodes([root], new Set());
      expect(result).toHaveLength(1);

      // Then expanded again
      result = flattenVisibleNodes([root], new Set(['root']));
      expect(result).toHaveLength(2);
    });

    it('should handle tree with 500+ spans efficiently', () => {
      // Create a tree with 500 children (simulating large trace)
      const children = Array.from({ length: 500 }, (_, i) =>
        createMockNode(`child-${i}`, `Child ${i}`, [], 1)
      );
      const root = createMockNode('root', 'Root', children);

      const expandedIds = new Set(['root']);
      const start = performance.now();
      const result = flattenVisibleNodes([root], expandedIds);
      const duration = performance.now() - start;

      expect(result).toHaveLength(501);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle mixed expanded/collapsed siblings', () => {
      const grandchild1 = createMockNode('gc1', 'GC1', [], 2);
      const grandchild2 = createMockNode('gc2', 'GC2', [], 2);
      const child1 = createMockNode('child1', 'Child1', [grandchild1], 1);
      const child2 = createMockNode('child2', 'Child2', [grandchild2], 1);
      const root = createMockNode('root', 'Root', [child1, child2]);

      // Only child1 is expanded, child2 is collapsed
      const expandedIds = new Set(['root', 'child1']);
      const result = flattenVisibleNodes([root], expandedIds);

      expect(result).toHaveLength(4); // root, child1, gc1, child2
      expect(result.map((r: FlatSpanItem) => r.node.spanId)).toEqual(['root', 'child1', 'gc1', 'child2']);
    });
  });
});
