/**
 * Tests for TraceDragController
 * Story 6.1: Implement TreeView Drag Support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TraceDragController } from './TraceDragController';
import { TraceTreeItem } from './TraceListProvider';
import type { Trace, Span } from '../models/trace.types';

// Mock storage URI for tests
const mockStorageUri = {
  fsPath: '/mock/storage',
  path: '/mock/storage',
  scheme: 'file',
  toString: () => 'file:///mock/storage',
};

// Mock vscode module
vi.mock('vscode', () => ({
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  ThemeIcon: class ThemeIcon {
    public id: string;
    constructor(id: string) {
      this.id = id;
    }
  },
  ThemeColor: class ThemeColor {
    public id: string;
    constructor(id: string) {
      this.id = id;
    }
  },
  TreeItem: class TreeItem {
    label: string;
    collapsibleState: number;
    constructor(label: string, collapsibleState: number) {
      this.label = label;
      this.collapsibleState = collapsibleState;
    }
  },
  DataTransferItem: class DataTransferItem {
    public value: string;
    constructor(value: string) {
      this.value = value;
    }
  },
  Uri: {
    file: vi.fn((filePath: string) => ({
      fsPath: filePath,
      path: filePath,
      scheme: 'file',
      toString: () => `file://${filePath}`,
    })),
    joinPath: vi.fn((base: { fsPath: string }, ...segments: string[]) => {
      const path = [base.fsPath, ...segments].join('/');
      return {
        fsPath: path,
        path: path,
        scheme: 'file',
        toString: () => `file://${path}`,
      };
    }),
    from: vi.fn((components: { scheme: string; authority: string; path: string }) => ({
      scheme: components.scheme,
      authority: components.authority,
      path: components.path,
      fsPath: components.path,
      toString: () => `${components.scheme}://${components.authority}${components.path}`,
    })),
  },
  env: {
    remoteName: undefined,
  },
  workspace: {
    fs: {
      writeFile: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

// Create mock TraceListProvider
const createMockProvider = (cacheTrace?: Trace, fetchedTrace?: Trace) => ({
  getTraceFromCache: vi.fn().mockReturnValue(cacheTrace),
  fetchFullTrace: vi.fn().mockResolvedValue(fetchedTrace),
});

// Create mock DataTransfer
const createMockDataTransfer = () => {
  const data = new Map<string, { value: string }>();
  return {
    set: vi.fn((mimeType: string, item: { value: string }) => {
      data.set(mimeType, item);
    }),
    get: (mimeType: string) => data.get(mimeType),
    getData: () => data,
  };
};

// Create mock CancellationToken
const createMockCancellationToken = (isCancelled = false) => ({
  isCancellationRequested: isCancelled,
  onCancellationRequested: vi.fn(),
});

describe('TraceDragController', () => {
  const testTraceId = 'test-trace-123';
  const testTrace: Trace = {
    traceId: testTraceId,
    spans: [
      {
        traceId: testTraceId,
        spanId: 'span-1',
        parentSpanId: null,
        name: 'root-span',
        spanType: 'agent_run',
        startedAt: '2026-02-11T10:00:00Z',
        status: 'success',
        input: { query: 'test' },
        output: { result: 'ok' },
      },
      {
        traceId: testTraceId,
        spanId: 'span-2',
        parentSpanId: 'span-1',
        name: 'child-span',
        spanType: 'llm_call',
        startedAt: '2026-02-11T10:00:01Z',
        status: 'success',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('dragMimeTypes', () => {
    it('should define text/uri-list for file URI drag', () => {
      const mockProvider = createMockProvider();
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      
      expect(controller.dragMimeTypes).toContain('text/uri-list');
    });

    it('should define application/json for JSON content', () => {
      const mockProvider = createMockProvider();
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      
      expect(controller.dragMimeTypes).toContain('application/json');
    });

    it('should define text/plain for plain text fallback', () => {
      const mockProvider = createMockProvider();
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      
      expect(controller.dragMimeTypes).toContain('text/plain');
    });

    it('should have exactly 3 mime types', () => {
      const mockProvider = createMockProvider();
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      
      expect(controller.dragMimeTypes).toHaveLength(3);
    });
  });

  describe('dropMimeTypes', () => {
    it('should define empty dropMimeTypes (drag-only)', () => {
      const mockProvider = createMockProvider();
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      
      expect(controller.dropMimeTypes).toEqual([]);
    });
  });

  describe('handleDrag', () => {
    it('should create temp file and populate DataTransfer with file path', async () => {
      const mockProvider = createMockProvider(testTrace);
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      const dataTransfer = createMockDataTransfer();
      const token = createMockCancellationToken();

      // Create trace tree item
      const treeItem = new TraceTreeItem(
        'test-trace',
        0, // TreeItemCollapsibleState.None
        testTrace
      );

      await controller.handleDrag([treeItem], dataTransfer as any, token as any);

      // Verify DataTransfer.set was called for text/uri-list
      expect(dataTransfer.set).toHaveBeenCalledWith(
        'text/uri-list',
        expect.objectContaining({ value: expect.stringContaining('file://') })
      );

      // Verify DataTransfer.set was called for text/plain with JSON content (for remote compatibility)
      expect(dataTransfer.set).toHaveBeenCalledWith(
        'text/plain',
        expect.objectContaining({ value: expect.stringContaining('traceId') })
      );
    });

    it('should use trace ID in filename', async () => {
      const mockProvider = createMockProvider(testTrace);
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      const dataTransfer = createMockDataTransfer();
      const token = createMockCancellationToken();

      const treeItem = new TraceTreeItem('test-trace', 0, testTrace);
      await controller.handleDrag([treeItem], dataTransfer as any, token as any);

      // Get the URI that was set
      const uriItem = dataTransfer.getData().get('text/uri-list');
      expect(uriItem).toBeDefined();
      
      // Should contain first 8 chars of trace ID in filename
      expect(uriItem!.value).toContain('trace-test-tra');
      expect(uriItem!.value).toContain('.json');
    });

    it('should fetch full trace if cache has incomplete data', async () => {
      // Cache has trace with only 1 span (incomplete)
      const incompleteTrace: Trace = {
        traceId: testTraceId,
        spans: [{ traceId: testTraceId, spanId: 'span-1', parentSpanId: null, name: 'root', spanType: 'agent_run', startedAt: '' }],
      };
      const mockProvider = createMockProvider(incompleteTrace, testTrace);
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      const dataTransfer = createMockDataTransfer();
      const token = createMockCancellationToken();

      const treeItem = new TraceTreeItem('test-trace', 0, incompleteTrace);
      await controller.handleDrag([treeItem], dataTransfer as any, token as any);

      // Should have called fetchFullTrace since cache had <= 1 span
      expect(mockProvider.fetchFullTrace).toHaveBeenCalledWith(testTraceId);
    });

    it('should skip non-trace items (span items)', async () => {
      const mockProvider = createMockProvider(testTrace);
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      const dataTransfer = createMockDataTransfer();
      const token = createMockCancellationToken();

      const span: Span = {
        traceId: testTraceId,
        spanId: 'span-1',
        parentSpanId: null,
        name: 'root-span',
        spanType: 'agent_run',
        startedAt: '',
      };

      // Create span tree item (has both trace and span)
      const spanItem = new TraceTreeItem('span', 0, testTrace, span);
      await controller.handleDrag([spanItem], dataTransfer as any, token as any);

      // DataTransfer should not be populated for span items
      expect(dataTransfer.set).not.toHaveBeenCalled();
    });

    it('should skip load-more items', async () => {
      const mockProvider = createMockProvider(testTrace);
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      const dataTransfer = createMockDataTransfer();
      const token = createMockCancellationToken();

      // Create load-more tree item
      const loadMoreItem = new TraceTreeItem(
        'Load More',
        0,
        undefined,
        undefined,
        true // isLoadMore
      );
      await controller.handleDrag([loadMoreItem], dataTransfer as any, token as any);

      // DataTransfer should not be populated
      expect(dataTransfer.set).not.toHaveBeenCalled();
    });

    it('should handle missing trace gracefully', async () => {
      const mockProvider = createMockProvider(undefined, undefined);
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      const dataTransfer = createMockDataTransfer();
      const token = createMockCancellationToken();

      // Create tree item with trace that has no cached data
      const treeItem = new TraceTreeItem('test-trace', 0, testTrace);
      
      // Should not throw
      await expect(controller.handleDrag([treeItem], dataTransfer as any, token as any)).resolves.not.toThrow();

      // DataTransfer should not be populated when fetch fails
      expect(dataTransfer.set).not.toHaveBeenCalled();
    });

    it('should respect cancellation token', async () => {
      const mockProvider = createMockProvider(undefined, testTrace);
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      const dataTransfer = createMockDataTransfer();
      const token = createMockCancellationToken(true); // cancelled

      const treeItem = new TraceTreeItem('test-trace', 0, testTrace);
      await controller.handleDrag([treeItem], dataTransfer as any, token as any);

      // DataTransfer should not be populated when cancelled
      expect(dataTransfer.set).not.toHaveBeenCalled();
    });

    it('should handle empty source array', async () => {
      const mockProvider = createMockProvider(testTrace);
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      const dataTransfer = createMockDataTransfer();
      const token = createMockCancellationToken();

      await expect(controller.handleDrag([], dataTransfer as any, token as any)).resolves.not.toThrow();
      expect(dataTransfer.set).not.toHaveBeenCalled();
    });

    it('should use first trace item when multiple are selected', async () => {
      const trace2: Trace = { traceId: 'trace-2', spans: [] };
      const mockProvider = createMockProvider(testTrace);
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      const dataTransfer = createMockDataTransfer();
      const token = createMockCancellationToken();

      const item1 = new TraceTreeItem('trace-1', 0, testTrace);
      const item2 = new TraceTreeItem('trace-2', 0, trace2);

      await controller.handleDrag([item1, item2], dataTransfer as any, token as any);

      // Should use first trace
      expect(mockProvider.getTraceFromCache).toHaveBeenCalledWith(testTraceId);
      expect(dataTransfer.set).toHaveBeenCalled();
    });
  });

  describe('handleDrop', () => {
    it('should return undefined (no drop support)', () => {
      const mockProvider = createMockProvider();
      const controller = new TraceDragController(mockProvider as any, mockStorageUri as any);
      
      const result = controller.handleDrop();
      expect(result).toBeUndefined();
    });
  });
});
