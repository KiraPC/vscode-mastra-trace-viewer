/**
 * Trace and Span data models for Mastra telemetry
 * Based on actual Mastra trace JSON structure
 */

export enum SpanType {
  AgentRun = 'agent_run',
  ProcessorRun = 'processor_run',
  ToolStreaming = 'tool_streaming',
  LlmCall = 'llm_call',
  Custom = 'custom',
}

export type SpanStatus = 'success' | 'error' | 'running' | 'pending';

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  name: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  spanType: string; // Using string to match actual data structure
  startedAt: string | Date;
  endedAt?: string | Date | null;
  input?: unknown; // JSON-serializable
  output?: unknown; // JSON-serializable
  error?: unknown;
  attributes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  tags?: string[] | null;
  links?: unknown[] | null;
  userId?: string | null;
  organizationId?: string | null;
  resourceId?: string | null;
  runId?: string | null;
  sessionId?: string | null;
  threadId?: string | null;
  requestId?: string | null;
  environment?: string | null;
  source?: string | null;
  serviceName?: string | null;
  scope?: string | null;
  isEvent?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date | null;
  status?: string;
}

export interface Trace {
  traceId: string;
  exportedAt?: string;
  baseUrl?: string;
  trace?: {
    traceId: string;
    spans: Span[];
  };
  spans?: Span[]; // Direct spans array or nested
}

/**
 * Pagination information from Mastra API
 */
export interface PaginationInfo {
  total: number;
  page: number;
  perPage: number | false;
  hasMore: boolean;
}

/**
 * Paginated traces response
 */
export interface TracesPage {
  traces: Trace[];
  pagination: PaginationInfo;
}

/**
 * Parameters for fetching traces with pagination
 */
export interface FetchTracesParams {
  page?: number;
  perPage?: number;
  name?: string;
  spanType?: string;
  entityId?: string;
  entityType?: 'agent' | 'workflow';
}

/**
 * Type guard to validate trace data structure
 */
export function isValidTrace(data: unknown): data is Trace {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const trace = data as Trace;

  // Must have traceId
  if (typeof trace.traceId !== 'string') {
    return false;
  }

  // Must have spans array (either direct or nested)
  const spans = trace.spans || trace.trace?.spans;
  if (!Array.isArray(spans)) {
    return false;
  }

  return true;
}

/**
 * Type guard to validate span data structure
 */
export function isValidSpan(data: unknown): data is Span {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const span = data as Span;

  return (
    typeof span.spanId === 'string' &&
    typeof span.traceId === 'string' &&
    typeof span.name === 'string' &&
    typeof span.spanType === 'string'
  );
}

/**
 * Extract spans array from trace (handles both direct and nested structures)
 */
export function getTraceSpans(trace: Trace): Span[] {
  return trace.spans || trace.trace?.spans || [];
}
