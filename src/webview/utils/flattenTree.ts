/**
 * Utility for flattening a span tree into a visible list for virtual scrolling
 * Only includes nodes whose parents are expanded
 */

import type { SpanTreeNode } from '../../models/tree.types';

/**
 * Represents a flattened span item for virtual scrolling
 */
export interface FlatSpanItem {
  /** The span tree node */
  node: SpanTreeNode;
  /** Depth level in the tree (0 for roots) */
  depth: number;
  /** Whether this node is currently expanded */
  isExpanded: boolean;
  /** Whether this node has children */
  hasChildren: boolean;
  /** Path of spanIds from root to this node (inclusive) */
  path: string[];
}

/**
 * Flattens a span tree into a list of visible nodes
 * Only includes nodes whose parents are all expanded
 *
 * @param roots - The root nodes of the tree
 * @param expandedIds - Set of spanIds that are currently expanded
 * @returns Array of flattened span items in display order
 */
export function flattenVisibleNodes(
  roots: SpanTreeNode[],
  expandedIds: Set<string>
): FlatSpanItem[] {
  const result: FlatSpanItem[] = [];

  function traverse(node: SpanTreeNode, depth: number, parentPath: string[]): void {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.spanId);
    const path = [...parentPath, node.spanId];

    result.push({
      node,
      depth,
      isExpanded,
      hasChildren,
      path,
    });

    // Only traverse children if this node is expanded
    if (isExpanded && hasChildren) {
      for (const child of node.children) {
        traverse(child, depth + 1, path);
      }
    }
  }

  for (const root of roots) {
    traverse(root, 0, []);
  }

  return result;
}
