/**
 * Tests for TraceViewerPanel
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TraceViewerPanel, WebviewMessage, ExtensionMessage } from './TraceViewerPanel';
import type { Trace } from '../models/trace.types';

// Mock vscode module
const mockPostMessage = vi.fn();
const mockDispose = vi.fn();
const mockReveal = vi.fn();
const mockOnDidDispose = vi.fn();
const mockOnDidReceiveMessage = vi.fn();
const mockOnDidChangeViewState = vi.fn();

const mockWebviewPanel = {
  webview: {
    html: '',
    postMessage: mockPostMessage,
    asWebviewUri: vi.fn((uri) => uri),
    cspSource: 'test-csp-source',
    onDidReceiveMessage: mockOnDidReceiveMessage,
  },
  dispose: mockDispose,
  reveal: mockReveal,
  onDidDispose: mockOnDidDispose,
  onDidChangeViewState: mockOnDidChangeViewState,
  iconPath: undefined as any,
  visible: true,
};

vi.mock('vscode', () => ({
  window: {
    createWebviewPanel: vi.fn(() => mockWebviewPanel),
  },
  ViewColumn: {
    One: 1,
  },
  Uri: {
    joinPath: vi.fn((...args) => args.join('/')),
  },
  ThemeIcon: class ThemeIcon {
    public id: string;
    constructor(id: string) {
      this.id = id;
    }
  },
}));

describe('TraceViewerPanel', () => {
  const mockExtensionUri = { fsPath: '/test/extension' } as any;
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
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear static panels map
    (TraceViewerPanel as any).panels = new Map();
    
    // Reset mock implementations
    mockOnDidDispose.mockImplementation((callback) => {
      return { dispose: vi.fn() };
    });
    mockOnDidReceiveMessage.mockImplementation((callback) => {
      return { dispose: vi.fn() };
    });
    mockOnDidChangeViewState.mockImplementation((callback) => {
      return { dispose: vi.fn() };
    });
    // Reset iconPath
    mockWebviewPanel.iconPath = undefined;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrShow', () => {
    it('should create a new panel for a new traceId', () => {
      const panel = TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      
      expect(panel).toBeDefined();
      expect(panel.traceId).toBe(testTraceId);
      expect(panel.isDisposed).toBe(false);
    });

    it('should return existing panel for same traceId', () => {
      const panel1 = TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      const panel2 = TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      
      expect(panel1).toBe(panel2);
      expect(mockReveal).toHaveBeenCalled();
    });

    it('should create different panels for different traceIds', () => {
      const panel1 = TraceViewerPanel.createOrShow('trace-1', mockExtensionUri);
      const panel2 = TraceViewerPanel.createOrShow('trace-2', mockExtensionUri);
      
      expect(panel1).not.toBe(panel2);
      expect(panel1.traceId).toBe('trace-1');
      expect(panel2.traceId).toBe('trace-2');
    });

    it('should set iconPath on panel', () => {
      TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      
      expect(mockWebviewPanel.iconPath).toBeDefined();
      expect(mockWebviewPanel.iconPath.id).toBe('telescope');
    });
  });

  describe('getPanel', () => {
    it('should return undefined for non-existent panel', () => {
      const panel = TraceViewerPanel.getPanel('non-existent');
      expect(panel).toBeUndefined();
    });

    it('should return existing panel', () => {
      const created = TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      const retrieved = TraceViewerPanel.getPanel(testTraceId);
      
      expect(retrieved).toBe(created);
    });
  });

  describe('disposeAll', () => {
    it('should dispose all open panels', () => {
      // Create multiple panels
      TraceViewerPanel.createOrShow('trace-1', mockExtensionUri);
      TraceViewerPanel.createOrShow('trace-2', mockExtensionUri);
      TraceViewerPanel.createOrShow('trace-3', mockExtensionUri);
      
      expect(TraceViewerPanel.panelCount).toBe(3);
      
      // Dispose all
      TraceViewerPanel.disposeAll();
      
      expect(TraceViewerPanel.panelCount).toBe(0);
      expect(TraceViewerPanel.getPanel('trace-1')).toBeUndefined();
      expect(TraceViewerPanel.getPanel('trace-2')).toBeUndefined();
      expect(TraceViewerPanel.getPanel('trace-3')).toBeUndefined();
    });

    it('should work when no panels are open', () => {
      expect(TraceViewerPanel.panelCount).toBe(0);
      
      // Should not throw
      TraceViewerPanel.disposeAll();
      
      expect(TraceViewerPanel.panelCount).toBe(0);
    });
  });

  describe('panelCount', () => {
    it('should return 0 when no panels are open', () => {
      expect(TraceViewerPanel.panelCount).toBe(0);
    });

    it('should return correct count of open panels', () => {
      TraceViewerPanel.createOrShow('trace-1', mockExtensionUri);
      expect(TraceViewerPanel.panelCount).toBe(1);
      
      TraceViewerPanel.createOrShow('trace-2', mockExtensionUri);
      expect(TraceViewerPanel.panelCount).toBe(2);
    });

    it('should not increase count for same traceId', () => {
      TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      expect(TraceViewerPanel.panelCount).toBe(1);
      
      TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      expect(TraceViewerPanel.panelCount).toBe(1);
    });
  });

  describe('sendTrace', () => {
    it('should send loadTrace message to webview', () => {
      const panel = TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      panel.sendTrace(testTrace);
      
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'loadTrace',
        payload: { trace: testTrace, selectedSpanId: undefined },
      });
    });

    it('should send loadTrace message with selectedSpanId', () => {
      const panel = TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      panel.sendTrace(testTrace, 'span-1');
      
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'loadTrace',
        payload: { trace: testTrace, selectedSpanId: 'span-1' },
      });
    });
  });

  describe('sendLoading', () => {
    it('should send loading message with default text', () => {
      const panel = TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      panel.sendLoading();
      
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'loading',
        payload: { message: 'Loading trace...' },
      });
    });

    it('should send loading message with custom text', () => {
      const panel = TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      panel.sendLoading('Fetching data...');
      
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'loading',
        payload: { message: 'Fetching data...' },
      });
    });
  });

  describe('sendError', () => {
    it('should send error message to webview', () => {
      const panel = TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      panel.sendError('Connection failed');
      
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'error',
        payload: { message: 'Connection failed' },
      });
    });
  });

  describe('onRetry', () => {
    it('should register retry callback', () => {
      const panel = TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      const retryCallback = vi.fn();
      
      panel.onRetry(retryCallback);
      
      // Simulate receiving retry message
      const messageHandler = mockOnDidReceiveMessage.mock.calls[0][0];
      messageHandler({ type: 'retry' });
      
      expect(retryCallback).toHaveBeenCalled();
    });
  });

  describe('reveal', () => {
    it('should reveal the panel', () => {
      const panel = TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      vi.clearAllMocks();
      
      panel.reveal();
      
      expect(mockReveal).toHaveBeenCalled();
    });
  });

  describe('HTML generation', () => {
    it('should generate HTML with proper structure', () => {
      TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      
      const html = mockWebviewPanel.webview.html;
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('Content-Security-Policy');
      expect(html).toContain('nonce-');
      expect(html).toContain(`Trace: ${testTraceId}`);
      expect(html).toContain('<div id="app">');
    });

    it('should include CSP with correct sources', () => {
      TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      
      const html = mockWebviewPanel.webview.html;
      
      expect(html).toContain("default-src 'none'");
      expect(html).toContain('script-src');
      expect(html).toContain('style-src');
    });
  });

  describe('viewType', () => {
    it('should have correct viewType', () => {
      expect(TraceViewerPanel.viewType).toBe('mastraTraceViewer');
    });
  });

  describe('state preservation', () => {
    it('should initialize with default state', () => {
      const panel = TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      
      const state = panel.state;
      expect(state.expandedSpans).toEqual([]);
      expect(state.scrollPosition).toBe(0);
      expect(state.selectedSpanId).toBeNull();
    });

    it('should save state when receiving saveState message', () => {
      TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      
      // Get the message handler
      const messageHandler = mockOnDidReceiveMessage.mock.calls[0][0];
      
      // Simulate saveState message
      messageHandler({
        type: 'saveState',
        payload: {
          expandedSpans: ['span-a', 'span-b'],
          scrollPosition: 200,
          selectedSpanId: 'span-a'
        }
      });
      
      const panel = TraceViewerPanel.getPanel(testTraceId);
      expect(panel?.state.expandedSpans).toContain('span-a');
      expect(panel?.state.scrollPosition).toBe(200);
      expect(panel?.state.selectedSpanId).toBe('span-a');
    });

    it('should send restoreState on ready message', () => {
      TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      
      // Get the message handler
      const messageHandler = mockOnDidReceiveMessage.mock.calls[0][0];
      
      // Clear previous calls
      mockPostMessage.mockClear();
      
      // Simulate ready message
      messageHandler({ type: 'ready' });
      
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'restoreState',
        payload: expect.objectContaining({
          expandedSpans: expect.any(Array),
          scrollPosition: expect.any(Number),
        })
      });
    });

    it('should register onDidChangeViewState handler', () => {
      TraceViewerPanel.createOrShow(testTraceId, mockExtensionUri);
      
      expect(mockOnDidChangeViewState).toHaveBeenCalled();
    });
  });
});
