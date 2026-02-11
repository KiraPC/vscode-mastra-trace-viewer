/**
 * Tree structure types for hierarchical span display
 */

import type { Span } from './trace.types';

/**
 * A span node in the hierarchical tree structure
 * Contains span data plus children array for tree rendering
 */
export interface SpanTreeNode {
  /** Unique span identifier */
  spanId: string;
  
  /** Parent span identifier (null for root spans) */
  parentSpanId: string | null;
  
  /** Human-readable span name */
  name: string;
  
  /** Type of span (agent_run, processor_run, tool_streaming, llm_call, etc.) */
  spanType: string;
  
  /** When the span started */
  startedAt: string | Date;
  
  /** When the span ended (null if still running) */
  endedAt?: string | Date | null;
  
  /** Input data to the span */
  input?: unknown;
  
  /** Output data from the span */
  output?: unknown;
  
  /** Additional span attributes */
  attributes?: Record<string, unknown>;
  
  /** Span execution status */
  status?: string;
  
  /** Child spans in the hierarchy */
  children: SpanTreeNode[];
  
  /** Depth level in the tree (0 for roots) */
  depth: number;
  
  /** Reference to the original Span object for full data access */
  originalSpan: Span;
}
