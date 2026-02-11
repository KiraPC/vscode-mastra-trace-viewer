import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define hoisted mocks that can be used in vi.mock
const { mockOnDidChangeConfiguration, mockCreateOutputChannel, mockCreateStatusBarItem, mockCreateTreeView, mockRegisterCommand } = vi.hoisted(() => ({
  mockOnDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
  mockCreateOutputChannel: vi.fn(() => ({
    appendLine: vi.fn(),
    dispose: vi.fn(),
  })),
  mockCreateStatusBarItem: vi.fn(() => ({
    text: '',
    show: vi.fn(),
    dispose: vi.fn(),
  })),
  mockCreateTreeView: vi.fn(() => ({
    dispose: vi.fn(),
  })),
  mockRegisterCommand: vi.fn(() => ({ dispose: vi.fn() })),
}));

// Mock vscode module before importing extension
vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn(() => 'http://localhost:4111'),
      inspect: vi.fn(),
    })),
    onDidChangeConfiguration: mockOnDidChangeConfiguration,
  },
  window: {
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    createOutputChannel: mockCreateOutputChannel,
    createStatusBarItem: mockCreateStatusBarItem,
    createTreeView: mockCreateTreeView,
  },
  commands: {
    executeCommand: vi.fn(),
    registerCommand: mockRegisterCommand,
  },
  StatusBarAlignment: {
    Left: 1,
  },
  ThemeColor: class ThemeColor {
    constructor(public id: string) {}
  },
  ThemeIcon: class ThemeIcon {
    constructor(public id: string) {}
  },
  TreeItem: class TreeItem {
    label: string;
    collapsibleState: number;
    constructor(label: string, collapsibleState?: number) {
      this.label = label;
      this.collapsibleState = collapsibleState || 0;
    }
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  EventEmitter: class EventEmitter {
    event = vi.fn();
    fire = vi.fn();
  },
}));

// Mock MastraClientWrapper
vi.mock('../../api/MastraClientWrapper', () => ({
  MastraClientWrapper: class MastraClientWrapper {
    constructor(public endpoint: string) {}
    async fetchTraces() {
      return { traces: [], pagination: { total: 0, page: 1, perPage: 50, hasMore: false } };
    }
  },
}));

// Mock ConnectionStateManager
vi.mock('../../utils/connectionStateManager', () => ({
  ConnectionStateManager: class ConnectionStateManager {
    constructor(_statusBar: any, _output: any, _client: any) {}
    async connect() {}
    disconnect() {}
    dispose() {}
  },
}));

// Mock TraceListProvider
vi.mock('../../providers/TraceListProvider', () => ({
  TraceListProvider: class TraceListProvider {
    constructor(_client: any) {}
    async refresh() {}
    setApiClient(_client: any) {}
  },
}));

import { activate, deactivate } from '../../extension.js';

/**
 * Unit tests for extension activation
 * Tests the lightweight activation function that runs when mastraTraceList view is opened
 */
describe('Extension Activation', () => {
  let mockSubscriptions: any[];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscriptions = [];
  });

  it('should export activate function', () => {
    expect(activate).toBeDefined();
    expect(typeof activate).toBe('function');
  });

  it('should export deactivate function', () => {
    expect(deactivate).toBeDefined();
    expect(typeof deactivate).toBe('function');
  });

  it('activate function should accept ExtensionContext parameter', async () => {
    const mockContext = {
      subscriptions: mockSubscriptions,
      workspaceState: {},
      globalState: {},
      extensionPath: '/test/path'
    };
    
    // Should not throw error when called with context
    await expect(activate(mockContext as any)).resolves.not.toThrow();
  });

  it('should register configuration change listener on activation', async () => {
    const mockContext = {
      subscriptions: mockSubscriptions,
      workspaceState: {},
      globalState: {},
      extensionPath: '/test/path'
    };

    await activate(mockContext as any);

    expect(mockOnDidChangeConfiguration).toHaveBeenCalledTimes(1);
    expect(mockSubscriptions.length).toBeGreaterThan(0);
  });

  it('should create output channel and status bar on activation', async () => {
    const mockContext = {
      subscriptions: mockSubscriptions,
      workspaceState: {},
      globalState: {},
      extensionPath: '/test/path'
    };

    await activate(mockContext as any);

    expect(mockCreateOutputChannel).toHaveBeenCalledWith('Mastra Trace Viewer');
    expect(mockCreateStatusBarItem).toHaveBeenCalled();
  });
});
