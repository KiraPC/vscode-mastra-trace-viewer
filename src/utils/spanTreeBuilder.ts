/**
 * Span Tree Builder utility
 * 
 * Converts a flat array of spans into a hierarchical tree structure
 * based on parentSpanId relationships. Optimized for O(n) construction.
 */

import type { Span } from '../models/trace.types';
import type { SpanTreeNode } from '../models/tree.types';

/**
 * Build a hierarchical tree from a flat array of spans
 * @param spans Array of spans from a trace
 * @returns Array of root SpanTreeNodes with nested children
 */
export function buildTree(spans: Span[]): SpanTreeNode[] {
  if (!spans || spans.length === 0) {
    return [];
  }

  // First pass: create node map for O(1) lookups
  const nodeMap = new Map<string, SpanTreeNode>();
  
  for (const span of spans) {
    nodeMap.set(span.spanId, {
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      name: span.name,
      spanType: span.spanType,
      startedAt: span.startedAt,
      endedAt: span.endedAt,
      input: span.input,
      output: span.output,
      attributes: span.attributes,
      status: span.status,
      children: [],
      depth: 0,
      originalSpan: span,
    });
  }

  // Second pass: link children to parents and identify roots
  const roots: SpanTreeNode[] = [];
  
  for (const node of nodeMap.values()) {
    if (node.parentSpanId && nodeMap.has(node.parentSpanId)) {
      // Has a valid parent - add as child
      const parent = nodeMap.get(node.parentSpanId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      // Root span or orphaned (parent not found)
      roots.push(node);
    }
  }

  // Sort children by startedAt timestamp (recursively)
  sortChildrenByStartTime(roots);

  return roots;
}

/**
 * Recursively sort children arrays by startedAt timestamp
 */
function sortChildrenByStartTime(nodes: SpanTreeNode[]): void {
  nodes.sort((a, b) => {
    const startA = new Date(a.startedAt).getTime();
    const startB = new Date(b.startedAt).getTime();
    return startA - startB;
  });

  for (const node of nodes) {
    if (node.children.length > 0) {
      sortChildrenByStartTime(node.children);
    }
  }
}

/**
 * Format duration between start and end times
 * @param startedAt Start timestamp
 * @param endedAt End timestamp (optional, shows "running" if not provided)
 * @returns Formatted duration string
 */
export function formatDuration(
  startedAt: string | Date,
  endedAt?: string | Date | null
): string {
  if (!endedAt) {
    return 'running';
  }

  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const durationMs = end - start;

  if (durationMs < 0) {
    return '0ms';
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  } else if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Get icon identifier for a span type
 * @param spanType The type of span
 * @returns Icon identifier (for use with VSCode codicons or custom icons)
 */
export function getSpanTypeIcon(spanType: string): string {
  switch (spanType) {
    case 'agent_run':
      return 'person';
    case 'processor_run':
      return 'gear';
    case 'tool_streaming':
      return 'tools';
    case 'llm_call':
      return 'sparkle';
    default:
      return 'circle-outline';
  }
}

/**
 * Get CSS variable name for a span type color
 * @param spanType The type of span
 * @returns CSS variable name for the span type color
 */
export function getSpanTypeColor(spanType: string): string {
  switch (spanType) {
    case 'agent_run':
      return 'var(--span-color-agent-run)';
    case 'processor_run':
      return 'var(--span-color-processor-run)';
    case 'tool_streaming':
      return 'var(--span-color-tool-streaming)';
    case 'llm_call':
      return 'var(--span-color-llm-call)';
    default:
      return 'var(--span-color-custom)';
  }
}

/**
 * Get the total count of nodes in a tree (including nested)
 */
export function countNodes(nodes: SpanTreeNode[]): number {
  let count = nodes.length;
  for (const node of nodes) {
    if (node.children.length > 0) {
      count += countNodes(node.children);
    }
  }
  return count;
}
