/**
 * Utility functions for search result highlighting
 */

import type { SpanTreeNode } from '../../models/tree.types';

/**
 * Count hidden search matches in collapsed children subtree.
 * When a node is collapsed, all its children and descendants are hidden.
 * This function counts how many of those hidden spans match the search.
 *
 * @param children - Direct children of the collapsed parent node
 * @param searchResults - Array of matching spanIds from search
 * @returns Number of matches in the collapsed subtree
 */
export function countHiddenMatches(
  children: SpanTreeNode[],
  searchResults: string[]
): number {
  if (children.length === 0 || searchResults.length === 0) return 0;

  // Convert to Set for O(1) lookup (optimization for large result sets)
  const resultsSet = new Set(searchResults);

  let count = 0;
  function traverse(nodes: SpanTreeNode[]): void {
    for (const node of nodes) {
      if (resultsSet.has(node.spanId)) {
        count++;
      }
      if (node.children.length > 0) {
        traverse(node.children);
      }
    }
  }
  traverse(children);
  return count;
}

/**
 * Check if a spanId is in the search results
 * Uses Set for O(1) lookup performance
 *
 * @param spanId - The span ID to check
 * @param resultsSet - Set of matching spanIds
 * @returns true if span matches search
 */
export function isSpanMatch(spanId: string, resultsSet: Set<string>): boolean {
  return resultsSet.has(spanId);
}

/**
 * Create a Set from search results array for efficient lookups
 * Call once when results change, then use for multiple isSpanMatch checks
 *
 * @param results - Array of matching spanIds
 * @returns Set for O(1) lookups
 */
export function createResultsSet(results: string[]): Set<string> {
  return new Set(results);
}
