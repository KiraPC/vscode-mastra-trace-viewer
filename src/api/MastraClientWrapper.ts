/**
 * MastraClientWrapper - Wrapper around official Mastra client
 * Provides typed interface for fetching trace telemetry data
 */

import { MastraClient } from '@mastra/client-js';
import type { Trace, Span, TracesPage, FetchTracesParams, PaginationInfo } from '../models/trace.types';
import { MastraApiError } from '../models/errors.types';
import { isValidSpan } from '../models/trace.types';

/**
 * Node.js error with code property
 */
interface NodeError extends Error {
  code?: string;
}

export class MastraClientWrapper {
  private client: MastraClient;
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.client = new MastraClient({
      baseUrl: endpoint,
      retries: 3,
      backoffMs: 300,
      maxBackoffMs: 5000,
    });
  }

  /**
   * Get the configured endpoint URL
   */
  getEndpoint(): string {
    return this.endpoint;
  }

  /**
   * Test connection to Mastra server
   * @returns Promise<boolean> true if connection successful
   * @throws MastraApiError on connection failure
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.listTraces();
      return true;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Fetch all traces from Mastra telemetry API with pagination
   * @param params Optional pagination and filter parameters
   * @returns Promise<TracesPage> Paginated traces with pagination info
   * @throws MastraApiError on network, timeout, or data validation errors
   */
  async fetchTraces(params?: FetchTracesParams): Promise<TracesPage> {
    try {
      const response = await this.client.listTraces({
        pagination: {
          page: params?.page ?? 0,
          perPage: params?.perPage ?? 50,
        }
      });

      // Extract spans array from response (Mastra API returns spans, not traces)
      const spans = response.spans || [];
      const pagination: PaginationInfo = response.pagination || {
        total: spans.length,
        page: params?.page ?? 0,
        perPage: params?.perPage ?? 50,
        hasMore: false,
      };

      // Validate response is an array
      if (!Array.isArray(spans)) {
        throw new MastraApiError(
          'Invalid trace data format - expected array',
          'INVALID_DATA',
          undefined,
          response
        );
      }

      // Validate each span object
      for (const span of spans) {
        if (!isValidSpan(span)) {
          throw new MastraApiError(
            'Invalid span object in response',
            'INVALID_DATA',
            undefined,
            span
          );
        }
      }

      // Group spans by traceId to create Trace objects
      return {
        traces: this.groupSpansIntoTraces(spans as Span[]),
        pagination,
      };
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Group spans by traceId to create Trace objects
   */
  private groupSpansIntoTraces(spans: Span[]): Trace[] {
    const traceMap = new Map<string, Span[]>();

    for (const span of spans) {
      const existing = traceMap.get(span.traceId) || [];
      existing.push(span);
      traceMap.set(span.traceId, existing);
    }

    return Array.from(traceMap.entries()).map(([traceId, traceSpans]) => ({
      traceId,
      spans: traceSpans,
    }));
  }

  /**
   * Fetch single trace by ID from Mastra telemetry API
   * @param traceId Trace identifier
   * @returns Promise<Trace> Single trace object
   * @throws MastraApiError if trace not found or invalid
   */
  async fetchTraceById(traceId: string): Promise<Trace> {
    try {
      const response = await this.client.getTrace(traceId);

      // Check if response exists
      if (!response || typeof response !== 'object') {
        throw new MastraApiError(
          `Trace ${traceId} not found or invalid response`,
          'INVALID_DATA'
        );
      }

      // Response should contain spans array
      const spans = (response as { spans?: unknown[] }).spans;
      if (!Array.isArray(spans)) {
        throw new MastraApiError(
          `Invalid trace structure for ${traceId} - missing spans`,
          'INVALID_DATA',
          undefined,
          response
        );
      }

      // Validate each span
      for (const span of spans) {
        if (!isValidSpan(span)) {
          throw new MastraApiError(
            `Invalid span in trace ${traceId}`,
            'INVALID_DATA',
            undefined,
            span
          );
        }
      }

      return {
        traceId,
        spans: spans as Span[],
      };
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Transform various error types into MastraApiError
   * @param error Unknown error from Mastra client or network
   * @returns MastraApiError with appropriate code
   */
  private transformError(error: unknown): MastraApiError {
    // Pass through if already MastraApiError
    if (error instanceof MastraApiError) {
      return error;
    }

    // Handle timeout errors
    if (this.isTimeoutError(error)) {
      return new MastraApiError('Request timed out', 'TIMEOUT');
    }

    // Handle network errors
    if (this.isNetworkError(error)) {
      return new MastraApiError(
        `Cannot connect to Mastra at ${this.endpoint}`,
        'NETWORK'
      );
    }

    // Handle HTTP API errors with response
    if (this.hasHttpResponse(error)) {
      const statusCode = error.response.status;
      const message =
        error.response.data?.message || 'API request failed';
      return new MastraApiError(message, 'API_ERROR', statusCode, error.response.data);
    }

    // Generic error fallback
    if (error instanceof Error) {
      return new MastraApiError(error.message, 'API_ERROR');
    }

    // Unknown error type
    return new MastraApiError('Unknown error', 'API_ERROR');
  }

  /**
   * Check if error is a timeout error
   */
  private isTimeoutError(error: unknown): boolean {
    if (!this.isNodeError(error)) {
      return false;
    }
    return error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED';
  }

  /**
   * Check if error is a network connection error
   */
  private isNetworkError(error: unknown): boolean {
    if (!this.isNodeError(error)) {
      return false;
    }
    return error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND';
  }

  /**
   * Type guard to check if error is a Node.js error with code
   */
  private isNodeError(error: unknown): error is NodeError {
    return (
      typeof error === 'object' &&
      error !== null &&
      error instanceof Error &&
      'code' in error
    );
  }

  /**
   * Check if error has HTTP response (API error)
   */
  private hasHttpResponse(error: unknown): error is {
    response: { status: number; data?: any };
  } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as any).response === 'object' &&
      typeof (error as any).response.status === 'number'
    );
  }
}
