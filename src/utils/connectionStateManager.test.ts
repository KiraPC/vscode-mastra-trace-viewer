/**
 * Tests for ConnectionStateManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConnectionStateManager } from './connectionStateManager';
import { ConnectionState } from '../models/connection.types';
import { MastraApiError } from '../models/errors.types';

// Mock vscode module
vi.mock('vscode', () => ({
  window: {
    showErrorMessage: vi.fn().mockResolvedValue(undefined),
  },
  commands: {
    executeCommand: vi.fn(),
  },
  ThemeColor: class ThemeColor {
    constructor(public id: string) {}
  },
  StatusBarAlignment: {
    Left: 1,
  },
}));

describe('ConnectionStateManager', () => {
  let manager: ConnectionStateManager;
  let mockStatusBar: any;
  let mockOutputChannel: any;
  let mockApiClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const vscode = await import('vscode');
    (vscode.window.showErrorMessage as any).mockClear();
    (vscode.commands.executeCommand as any).mockClear();
    
    mockStatusBar = {
      text: '',
      backgroundColor: undefined,
      tooltip: '',
      command: '',
      show: vi.fn(),
      dispose: vi.fn()
    };

    mockOutputChannel = {
      appendLine: vi.fn()
    };

    mockApiClient = {
      fetchTraces: vi.fn()
    };

    manager = new ConnectionStateManager(
      mockStatusBar,
      mockOutputChannel,
      mockApiClient
    );
  });

  describe('initial state', () => {
    it('should start in Disconnected state', () => {
      const status = manager.getState();
      expect(status.state).toBe(ConnectionState.Disconnected);
    });

    it('should update status bar on initialization', () => {
      expect(mockStatusBar.show).toHaveBeenCalled();
      expect(mockStatusBar.text).toContain('Disconnected');
    });
  });

  describe('connect', () => {
    it('should transition to Connected on successful connection', async () => {
      mockApiClient.fetchTraces.mockResolvedValue({ traces: [], pagination: { total: 0, page: 1, perPage: 50, hasMore: false } });

      await manager.connect('http://localhost:4111');

      const status = manager.getState();
      expect(status.state).toBe(ConnectionState.Connected);
      expect(status.endpoint).toBe('http://localhost:4111');
      expect(mockStatusBar.text).toContain('Connected');
      expect(mockStatusBar.text).toContain('$(check)');
    });

    it('should transition to Disconnected on network error', async () => {
      mockApiClient.fetchTraces.mockRejectedValue(
        new MastraApiError('Connection refused', 'NETWORK')
      );

      await manager.connect('http://localhost:4111');

      const status = manager.getState();
      expect(status.state).toBe(ConnectionState.Disconnected);
      expect(status.error?.code).toBe('NETWORK');
      expect(mockStatusBar.text).toContain('Disconnected');
      expect(mockStatusBar.text).toContain('$(error)');
    });

    it('should transition to Error state on invalid config', async () => {
      mockApiClient.fetchTraces.mockRejectedValue(
        new MastraApiError('Invalid endpoint URL', 'INVALID_CONFIG')
      );

      await manager.connect('http://localhost:4111');

      const status = manager.getState();
      expect(status.state).toBe(ConnectionState.Error);
      expect(status.error?.code).toBe('INVALID_CONFIG');
      expect(mockStatusBar.text).toContain('Configuration Error');
      expect(mockStatusBar.text).toContain('$(warning)');
    });

    it('should transition to Disconnected on timeout', async () => {
      // Mock delayed response longer than timeout
      mockApiClient.fetchTraces.mockImplementation(
        () => new Promise(resolve => globalThis.setTimeout(resolve, 15000))
      );

      await manager.connect('http://localhost:4111');

      const status = manager.getState();
      expect(status.state).toBe(ConnectionState.Disconnected);
      expect(status.error?.code).toBe('TIMEOUT');
    }, 15000);

    it('should show Connecting state during connection attempt', async () => {
      let resolveConnection: any;
      mockApiClient.fetchTraces.mockReturnValue(
        new Promise(resolve => { resolveConnection = resolve; })
      );

      const connectPromise = manager.connect('http://localhost:4111');

      // Check state during connection
      const status = manager.getState();
      expect(status.state).toBe(ConnectionState.Connecting);
      expect(mockStatusBar.text).toContain('Connecting...');
      expect(mockStatusBar.text).toContain('$(sync~spin)');

      // Resolve connection
      resolveConnection([]);
      await connectPromise;
    });

    it('should log connection attempts', async () => {
      mockApiClient.fetchTraces.mockResolvedValue({ traces: [], pagination: { total: 0, page: 1, perPage: 50, hasMore: false } });

      await manager.connect('http://localhost:4111');

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Connecting to Mastra at http://localhost:4111')
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Successfully connected')
      );
    });

    it('should log errors on connection failure', async () => {
      mockApiClient.fetchTraces.mockRejectedValue(
        new MastraApiError('Connection refused', 'NETWORK')
      );

      await manager.connect('http://localhost:4111');

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Connection failed')
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Details:')
      );
    });

    it('should update lastConnected timestamp on success', async () => {
      mockApiClient.fetchTraces.mockResolvedValue({ traces: [], pagination: { total: 0, page: 1, perPage: 50, hasMore: false } });

      const beforeConnect = new Date();
      await manager.connect('http://localhost:4111');
      const afterConnect = new Date();

      const status = manager.getState();
      expect(status.lastConnected).toBeDefined();
      expect(status.lastConnected!.getTime()).toBeGreaterThanOrEqual(beforeConnect.getTime());
      expect(status.lastConnected!.getTime()).toBeLessThanOrEqual(afterConnect.getTime());
    });

    it('should clear previous error on successful connection', async () => {
      // First connection fails
      mockApiClient.fetchTraces.mockRejectedValueOnce(
        new MastraApiError('Connection refused', 'NETWORK')
      );
      await manager.connect('http://localhost:4111');
      
      // Second connection succeeds
      mockApiClient.fetchTraces.mockResolvedValue({ traces: [], pagination: { total: 0, page: 1, perPage: 50, hasMore: false } });
      await manager.connect('http://localhost:4111');

      const status = manager.getState();
      expect(status.error).toBeUndefined();
    });
  });

  describe('disconnect', () => {
    it('should transition to Disconnected state', () => {
      manager.disconnect();

      const status = manager.getState();
      expect(status.state).toBe(ConnectionState.Disconnected);
      expect(mockStatusBar.text).toContain('Disconnected');
    });

    it('should log disconnection', () => {
      manager.disconnect();

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Disconnected from Mastra')
      );
    });

    it('should clear error state', async () => {
      // Connection fails
      mockApiClient.fetchTraces.mockRejectedValue(
        new MastraApiError('Connection refused', 'NETWORK')
      );
      await manager.connect('http://localhost:4111');

      // Disconnect
      manager.disconnect();

      const status = manager.getState();
      expect(status.error).toBeUndefined();
    });
  });

  describe('error notifications', () => {
    it('should show error message for network errors', async () => {
      const vscode = await import('vscode');
      (vscode.window.showErrorMessage as any).mockResolvedValue(undefined);
      mockApiClient.fetchTraces.mockRejectedValue(
        new MastraApiError('Connection refused', 'NETWORK')
      );

      await manager.connect('http://localhost:4111');

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Cannot connect to Mastra'),
        'Open Settings'
      );
    });

    it('should show error message for timeout', async () => {
      const vscode = await import('vscode');
      (vscode.window.showErrorMessage as any).mockResolvedValue(undefined);
      mockApiClient.fetchTraces.mockImplementation(
        () => new Promise(resolve => globalThis.setTimeout(resolve, 15000))
      );

      await manager.connect('http://localhost:4111');

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('timed out'),
        'Open Settings'
      );
    }, 15000);

    it('should show error message for invalid config', async () => {
      const vscode = await import('vscode');
      (vscode.window.showErrorMessage as any).mockResolvedValue(undefined);
      mockApiClient.fetchTraces.mockRejectedValue(
        new MastraApiError('Invalid endpoint', 'INVALID_CONFIG')
      );

      await manager.connect('http://localhost:4111');

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Invalid Mastra endpoint'),
        'Open Settings'
      );
    });

    it('should not show duplicate error notifications', async () => {
      const vscode = await import('vscode');
      (vscode.window.showErrorMessage as any).mockResolvedValue(undefined);
      mockApiClient.fetchTraces.mockRejectedValue(
        new MastraApiError('Connection refused', 'NETWORK')
      );

      // Connect twice with same error
      await manager.connect('http://localhost:4111');
      await manager.connect('http://localhost:4111');

      // Should only show notification once
      expect(vscode.window.showErrorMessage).toHaveBeenCalledTimes(1);
    });

    it('should open settings when user clicks Open Settings', async () => {
      const vscode = await import('vscode');
      (vscode.window.showErrorMessage as any).mockResolvedValue('Open Settings');
      (vscode.commands.executeCommand as any).mockResolvedValue(undefined);
      mockApiClient.fetchTraces.mockRejectedValue(
        new MastraApiError('Connection refused', 'NETWORK')
      );

      await manager.connect('http://localhost:4111');

      // Wait for promise chain to resolve
      await new Promise(resolve => globalThis.setTimeout(resolve, 0));

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'workbench.action.openSettings',
        'mastraTraceViewer.endpoint'
      );
    });
  });

  describe('status bar updates', () => {
    it('should show tooltip with endpoint', async () => {
      mockApiClient.fetchTraces.mockResolvedValue({ traces: [], pagination: { total: 0, page: 1, perPage: 50, hasMore: false } });

      await manager.connect('http://localhost:4111');

      expect(mockStatusBar.tooltip).toContain('http://localhost:4111');
    });

    it('should show tooltip with error message on failure', async () => {
      mockApiClient.fetchTraces.mockRejectedValue(
        new MastraApiError('Connection refused', 'NETWORK')
      );

      await manager.connect('http://localhost:4111');

      expect(mockStatusBar.tooltip).toContain('Error:');
      expect(mockStatusBar.tooltip).toContain('Connection refused');
    });

    it('should set background color for Connected state', async () => {
      mockApiClient.fetchTraces.mockResolvedValue({ traces: [], pagination: { total: 0, page: 1, perPage: 50, hasMore: false } });

      await manager.connect('http://localhost:4111');

      expect(mockStatusBar.backgroundColor).toBeDefined();
    });

    it('should set background color for error states', async () => {
      mockApiClient.fetchTraces.mockRejectedValue(
        new MastraApiError('Connection refused', 'NETWORK')
      );

      await manager.connect('http://localhost:4111');

      expect(mockStatusBar.backgroundColor).toBeDefined();
    });
  });

  describe('dispose', () => {
    it('should dispose status bar item', () => {
      manager.dispose();

      expect(mockStatusBar.dispose).toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    it('should return complete connection status', async () => {
      mockApiClient.fetchTraces.mockResolvedValue({ traces: [], pagination: { total: 0, page: 1, perPage: 50, hasMore: false } });

      await manager.connect('http://localhost:4111');

      const status = manager.getState();
      expect(status).toHaveProperty('state');
      expect(status).toHaveProperty('endpoint');
      expect(status).toHaveProperty('error');
      expect(status).toHaveProperty('lastConnected');
    });
  });
});
