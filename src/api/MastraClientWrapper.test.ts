import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MastraClientWrapper } from './MastraClientWrapper';
import { MastraApiError } from '../models/errors.types';
import type { Trace } from '../models/trace.types';

// Create mock functions that we can control
const mockListTraces = vi.fn();
const mockGetTrace = vi.fn();

// Mock @mastra/client-js
vi.mock('@mastra/client-js', () => {
  return {
    MastraClient: class MockMastraClient {
      listTraces = mockListTraces;
      getTrace = mockGetTrace;
      constructor(_config: any) {
        // Mock constructor
      }
    },
  };
});

describe('MastraClientWrapper', () => {
  let wrapper: MastraClientWrapper;
  const mockEndpoint = 'http://localhost:4111';

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockListTraces.mockReset();
    mockGetTrace.mockReset();
    
    // Create wrapper - mock is already set up
    wrapper = new MastraClientWrapper(mockEndpoint);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with endpoint', () => {
      expect(wrapper).toBeDefined();
      expect(wrapper).toBeInstanceOf(MastraClientWrapper);
    });

    it('should store endpoint URL', () => {
      expect(wrapper.getEndpoint()).toBe(mockEndpoint);
    });
  });

  describe('testConnection', () => {
    it('should return true when connection succeeds', async () => {
      mockListTraces.mockResolvedValueOnce({ spans: [] });

      const result = await wrapper.testConnection();

      expect(result).toBe(true);
      expect(mockListTraces).toHaveBeenCalledTimes(1);
    });

    it('should throw NETWORK error on connection failure', async () => {
      const networkError = new Error('connect ECONNREFUSED');
      (networkError as any).code = 'ECONNREFUSED';
      mockListTraces.mockRejectedValueOnce(networkError);

      await expect(wrapper.testConnection()).rejects.toMatchObject({
        code: 'NETWORK',
      });
    });

    it('should throw TIMEOUT error on timeout', async () => {
      const timeoutError = new Error('timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockListTraces.mockRejectedValueOnce(timeoutError);

      await expect(wrapper.testConnection()).rejects.toMatchObject({
        code: 'TIMEOUT',
      });
    });
  });

  describe('fetchTraces', () => {
    it('should return paginated traces on success', async () => {
      // API returns individual spans that get grouped by traceId
      const mockSpans = [
        {
          traceId: 'trace-1',
          spanId: 'span-1',
          parentSpanId: null,
          name: 'test span',
          spanType: 'agent_run',
          startedAt: '2026-02-11T10:00:00Z',
        },
        {
          traceId: 'trace-1',
          spanId: 'span-2',
          parentSpanId: 'span-1',
          name: 'child span',
          spanType: 'llm_call',
          startedAt: '2026-02-11T10:00:01Z',
        },
        {
          traceId: 'trace-2',
          spanId: 'span-3',
          parentSpanId: null,
          name: 'another trace',
          spanType: 'agent_run',
          startedAt: '2026-02-11T10:01:00Z',
        },
      ];

      const mockPagination = {
        total: 100,
        page: 1,
        perPage: 50,
        hasMore: true,
      };

      mockListTraces.mockResolvedValueOnce({ 
        spans: mockSpans,
        pagination: mockPagination,
      });

      const result = await wrapper.fetchTraces();

      // Should group spans into traces and include pagination
      expect(result.traces).toHaveLength(2);
      expect(result.traces[0].traceId).toBe('trace-1');
      expect(result.traces[0].spans).toHaveLength(2);
      expect(result.traces[1].traceId).toBe('trace-2');
      expect(result.traces[1].spans).toHaveLength(1);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.hasMore).toBe(true);
      expect(mockListTraces).toHaveBeenCalledTimes(1);
    });

    it('should pass pagination params to API', async () => {
      mockListTraces.mockResolvedValueOnce({ 
        spans: [],
        pagination: { total: 0, page: 2, perPage: 25, hasMore: false },
      });

      await wrapper.fetchTraces({ page: 2, perPage: 25 });

      expect(mockListTraces).toHaveBeenCalledWith({
        pagination: {
          page: 2,
          perPage: 25,
        },
      });
    });

    it('should throw NETWORK error on connection refused', async () => {
      const networkError = new Error('connect ECONNREFUSED');
      (networkError as any).code = 'ECONNREFUSED';
      mockListTraces.mockRejectedValueOnce(networkError);

      try {
        await wrapper.fetchTraces();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(MastraApiError);
        expect((error as MastraApiError).code).toBe('NETWORK');
        expect((error as MastraApiError).message).toContain('Cannot connect');
      }
    });

    it('should throw TIMEOUT error on timeout', async () => {
      const timeoutError = new Error('timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockListTraces.mockRejectedValueOnce(timeoutError);

      await expect(wrapper.fetchTraces()).rejects.toMatchObject({
        code: 'TIMEOUT',
        message: 'Request timed out',
      });
    });

    it('should throw INVALID_DATA error for malformed response', async () => {
      // Return non-array data
      mockListTraces.mockResolvedValueOnce({ spans: 'invalid data' });

      await expect(wrapper.fetchTraces()).rejects.toMatchObject({
        code: 'INVALID_DATA',
        message: expect.stringContaining('Invalid trace data format'),
      });
    });

    it('should throw INVALID_DATA error for array with invalid trace objects', async () => {
      // Missing traceId
      mockListTraces.mockResolvedValueOnce({ spans: [{ invalid: 'trace' }] });

      await expect(wrapper.fetchTraces()).rejects.toMatchObject({
        code: 'INVALID_DATA',
      });
    });

    it('should throw API_ERROR for HTTP error responses', async () => {
      const apiError = new Error('API Error');
      (apiError as any).response = {
        status: 500,
        data: { message: 'Internal Server Error' },
      };
      mockListTraces.mockRejectedValueOnce(apiError);

      await expect(wrapper.fetchTraces()).rejects.toMatchObject({
        code: 'API_ERROR',
        statusCode: 500,
        message: 'Internal Server Error',
      });
    });
  });

  describe('fetchTraceById', () => {
    it('should return single trace on success', async () => {
      // API returns trace with spans array
      const mockSpans = [
        {
          traceId: 'trace-123',
          spanId: 'span-1',
          parentSpanId: null,
          name: 'agent run',
          spanType: 'agent_run',
          startedAt: '2026-02-11T10:00:00Z',
          endedAt: '2026-02-11T10:00:05Z',
        },
      ];

      mockGetTrace.mockResolvedValueOnce({ spans: mockSpans });

      const result = await wrapper.fetchTraceById('trace-123');

      expect(result.traceId).toBe('trace-123');
      expect(result.spans).toEqual(mockSpans);
      expect(mockGetTrace).toHaveBeenCalledWith('trace-123');
    });

    it('should throw INVALID_DATA error for non-existent trace', async () => {
      mockGetTrace.mockResolvedValueOnce(null);

      await expect(wrapper.fetchTraceById('non-existent')).rejects.toMatchObject({
        code: 'INVALID_DATA',
        message: expect.stringContaining('not found'),
      });
    });

    it('should throw INVALID_DATA error for invalid trace structure', async () => {
      mockGetTrace.mockResolvedValueOnce({ invalid: 'data' });

      await expect(wrapper.fetchTraceById('trace-123')).rejects.toMatchObject({
        code: 'INVALID_DATA',
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('ENOTFOUND');
      (networkError as any).code = 'ENOTFOUND';
      mockGetTrace.mockRejectedValueOnce(networkError);

      await expect(wrapper.fetchTraceById('trace-123')).rejects.toMatchObject({
        code: 'NETWORK',
      });
    });
  });

  describe('error transformation', () => {
    it('should pass through MastraApiError instances unchanged', async () => {
      const customError = new MastraApiError('Custom error', 'API_ERROR', 400);
      mockListTraces.mockRejectedValueOnce(customError);

      await expect(wrapper.fetchTraces()).rejects.toBe(customError);
    });

    it('should transform generic errors to API_ERROR', async () => {
      const genericError = new Error('Something went wrong');
      mockListTraces.mockRejectedValueOnce(genericError);

      await expect(wrapper.fetchTraces()).rejects.toMatchObject({
        code: 'API_ERROR',
        message: 'Something went wrong',
      });
    });

    it('should handle non-Error objects', async () => {
      mockListTraces.mockRejectedValueOnce('string error');

      await expect(wrapper.fetchTraces()).rejects.toMatchObject({
        code: 'API_ERROR',
        message: 'Unknown error',
      });
    });
  });
});
