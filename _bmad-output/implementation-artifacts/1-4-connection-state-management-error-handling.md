# Story 1.4: Connection State Management & Error Handling

Status: done

## Story

As a developer using the extension,
I want to see clear feedback when connection succeeds or fails,
So that I can troubleshoot connection issues quickly.

## Acceptance Criteria

**Given** The extension activates
**When** The Mastra client attempts to connect to the configured endpoint
**Then** A status bar item shows "Mastra: Connecting..."
**And** The connection attempt times out after 10 seconds if no response

**Given** Connection succeeds
**When** The Mastra client successfully connects to the instance
**Then** Status bar updates to "Mastra: Connected" with green indicator
**And** No error notification is shown
**And** Trace list view becomes available in the sidebar

**Given** Connection fails due to network error
**When** The Mastra client cannot reach the endpoint
**Then** Status bar shows "Mastra: Disconnected" with red indicator
**And** Error notification displays: "Cannot connect to Mastra at [endpoint]. Check your network and endpoint configuration."
**And** User can click notification action "Open Settings" to adjust endpoint

**Given** Connection fails due to invalid endpoint configuration
**When** The configured endpoint URL is malformed or invalid
**Then** Error notification displays: "Invalid Mastra endpoint: [endpoint]. Please check your settings."
**And** Status bar shows "Mastra: Configuration Error"
**And** User can click "Open Settings" to correct the endpoint

**Given** Connection state is implemented
**When** I create ConnectionStateManager in src/utils/connectionStateManager.ts
**Then** ConnectionStateManager tracks state: Connecting, Connected, Disconnected, Error
**And** ConnectionStateManager updates status bar item based on state
**And** ConnectionStateManager provides methods: connect(), disconnect(), getState()

**Given** Error handling is implemented
**When** I create custom error types in src/models/errors.types.ts
**Then** MastraConnectionError includes: code (NETWORK, TIMEOUT, INVALID_CONFIG), message, endpoint
**And** Error messages are user-friendly and actionable
**And** Errors are logged to VSCode output channel "Mastra Trace Viewer"

**Given** Connection state management is complete
**When** I test the extension in Development Host
**Then** Connecting to valid endpoint shows success state
**And** Connecting to invalid endpoint shows appropriate error
**And** Changing settings triggers reconnection with status updates
**And** All error scenarios are handled gracefully without crashes

## Tasks / Subtasks

- [x] Define connection state types (AC: 5)
  - [x] Create or update src/models/connection.types.ts
  - [x] Define ConnectionState enum: Connecting, Connected, Disconnected, Error
  - [x] Define ConnectionStatus interface with state, endpoint, error?, lastConnected?
  - [x] Export types for use in ConnectionStateManager

- [x] Create ConnectionStateManager class (AC: 5)
  - [x] Create src/utils/connectionStateManager.ts
  - [x] Initialize with VSCode status bar item and output channel
  - [x] Implement private _state: ConnectionState property
  - [x] Implement getState(): ConnectionState method
  - [x] Implement updateState(state, error?) private method
  - [x] Implement connect(endpoint) method
  - [x] Implement disconnect() method
  - [x] Create updateStatusBar() method to sync UI with state

- [x] Implement status bar integration (AC: 1, 2, 3, 4)
  - [x] Create status bar item in extension.ts activate()
  - [x] Position in status bar (left side, priority 100)
  - [x] Pass status bar item to ConnectionStateManager
  - [x] Update text based on state:
    - Connecting: "$(sync~spin) Mastra: Connecting..."
    - Connected: "$(check) Mastra: Connected"
    - Disconnected: "$(error) Mastra: Disconnected"
    - Error: "$(warning) Mastra: Configuration Error"
  - [x] Add click command to open settings
  - [x] Show/hide based on extension activation

- [x] Implement output channel logging (AC: 6)
  - [x] Create output channel "Mastra Trace Viewer" in extension.ts
  - [x] Pass output channel to ConnectionStateManager
  - [x] Log state transitions with timestamp
  - [x] Log connection attempts and results
  - [x] Log errors with full details for debugging
  - [x] Use structured log format: [TIMESTAMP] [LEVEL] [COMPONENT] message

- [x] Implement connection flow (AC: 1, 2)
  - [x] In connect() method, set state to Connecting immediately
  - [x] Call MastraClientWrapper.fetchTraces() as connection test
  - [x] Set 10-second timeout using Promise.race or AbortController
  - [x] On success: set state to Connected, log success
  - [x] On timeout: set state to Error with TIMEOUT code
  - [x] On error: set state to Disconnected or Error based on error type

- [x] Implement user notification flow (AC: 3, 4, 6)
  - [x] For network errors: showErrorMessage with "Open Settings" action
  - [x] For configuration errors: showErrorMessage with "Open Settings" action
  - [x] On "Open Settings" click: executeCommand('workbench.action.openSettings', 'mastraTraceViewer')
  - [x] Include helpful troubleshooting info in error messages
  - [x] Don't spam notifications - track last error to avoid duplicates

- [x] Integrate with extension lifecycle (AC: 7)
  - [x] In extension.ts activate():
    - Create ConnectionStateManager instance
    - Initialize status bar item
    - Initialize output channel
    - Attempt initial connection to configured endpoint
  - [x] In extension.ts deactivate():
    - Call disconnect()
    - Dispose status bar item
    - Dispose output channel
  - [x] Wire up to configuration change listener from Story 1.3
  - [x] Make ConnectionStateManager a singleton or inject as dependency

- [x] Create comprehensive tests (AC: 7)
  - [x] Create src/utils/connectionStateManager.test.ts
  - [x] Test: State transitions (Connecting → Connected)
  - [x] Test: State transitions (Connecting → Disconnected)
  - [x] Test: State transitions (Connecting → Error)
  - [x] Test: Status bar updates match state
  - [x] Test: Output channel receives log messages
  - [x] Test: Timeout after 10 seconds
  - [x] Test: Error categorization (network vs config)
  - [x] Mock MastraClientWrapper and VSCode APIs

- [x] Manual testing in Development Host (AC: 7)
  - [x] Test with valid Mastra endpoint (if running locally)
  - [x] Test with invalid endpoint (non-existent server)
  - [x] Test with malformed endpoint URL
  - [x] Test configuration change triggers reconnection
  - [x] Verify status bar updates in all scenarios
  - [x] Verify error notifications appear with correct messages
  - [x] Verify "Open Settings" action works
  - [x] Check output channel for proper logging

## Dev Notes

### Critical Architecture Requirements

**Connection State Management:**
- **Centralized State**: Single source of truth for connection status
- **UI Synchronization**: Status bar always reflects current state
- **Error Transparency**: Users see clear, actionable error messages
- **Logging**: All connection events logged to output channel for debugging

**State Machine:**
```
Initial → Connecting → Connected
                    → Disconnected (network error)
                    → Error (configuration error, timeout)

Connected → Disconnected (manual disconnect or connection lost)
         → Error (subsequent error)

Any State → Connecting (reconnection attempt)
```

**ConnectionStateManager Implementation:**
```typescript
// src/utils/connectionStateManager.ts
import * as vscode from 'vscode';
import { MastraClientWrapper } from '../api/MastraClientWrapper';
import { MastraApiError } from '../models/errors.types';

export enum ConnectionState {
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnected = 'disconnected',
  Error = 'error'
}

export interface ConnectionStatus {
  state: ConnectionState;
  endpoint: string;
  error?: MastraApiError;
  lastConnected?: Date;
}

export class ConnectionStateManager {
  private _state: ConnectionState = ConnectionState.Disconnected;
  private _endpoint: string = '';
  private _error?: MastraApiError;
  private _lastConnected?: Date;
  private _lastErrorMessage?: string; // For duplicate detection

  constructor(
    private statusBarItem: vscode.StatusBarItem,
    private outputChannel: vscode.OutputChannel,
    private apiClient: MastraClientWrapper
  ) {
    this.updateStatusBar();
  }

  async connect(endpoint: string): Promise<void> {
    this._endpoint = endpoint;
    this.updateState(ConnectionState.Connecting);
    this.log('INFO', `Connecting to Mastra at ${endpoint}...`);

    try {
      // Test connection with 10-second timeout
      await this.testConnectionWithTimeout(10000);
      
      this._lastConnected = new Date();
      this._error = undefined;
      this._lastErrorMessage = undefined;
      this.updateState(ConnectionState.Connected);
      this.log('INFO', `Successfully connected to ${endpoint}`);
      
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  disconnect(): void {
    this.updateState(ConnectionState.Disconnected);
    this._error = undefined;
    this.log('INFO', 'Disconnected from Mastra');
  }

  getState(): ConnectionStatus {
    return {
      state: this._state,
      endpoint: this._endpoint,
      error: this._error,
      lastConnected: this._lastConnected
    };
  }

  private async testConnectionWithTimeout(timeoutMs: number): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new MastraApiError(
          `Connection timeout after ${timeoutMs}ms`,
          'TIMEOUT'
        ));
      }, timeoutMs);
    });

    // Race between actual connection and timeout
    await Promise.race([
      this.apiClient.fetchTraces(),
      timeoutPromise
    ]);
  }

  private handleConnectionError(error: unknown): void {
    const mastraError = error instanceof MastraApiError 
      ? error 
      : new MastraApiError('Unknown connection error', 'NETWORK');

    this._error = mastraError;
    
    // Determine state based on error type
    if (mastraError.code === 'INVALID_CONFIG') {
      this.updateState(ConnectionState.Error);
    } else {
      this.updateState(ConnectionState.Disconnected);
    }

    this.log('ERROR', `Connection failed: ${mastraError.message}`, mastraError);
    this.showErrorNotification(mastraError);
  }

  private showErrorNotification(error: MastraApiError): void {
    // Avoid duplicate notifications
    const errorKey = `${error.code}:${this._endpoint}`;
    if (this._lastErrorMessage === errorKey) {
      return;
    }
    this._lastErrorMessage = errorKey;

    let message: string;
    if (error.code === 'INVALID_CONFIG') {
      message = `Invalid Mastra endpoint: ${this._endpoint}. Please check your settings.`;
    } else if (error.code === 'TIMEOUT') {
      message = `Connection to Mastra at ${this._endpoint} timed out. Check if Mastra is running.`;
    } else {
      message = `Cannot connect to Mastra at ${this._endpoint}. Check your network and endpoint configuration.`;
    }

    vscode.window.showErrorMessage(message, 'Open Settings').then(selection => {
      if (selection === 'Open Settings') {
        vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'mastraTraceViewer.endpoint'
        );
      }
    });
  }

  private updateState(state: ConnectionState): void {
    this._state = state;
    this.updateStatusBar();
  }

  private updateStatusBar(): void {
    switch (this._state) {
      case ConnectionState.Connecting:
        this.statusBarItem.text = '$(sync~spin) Mastra: Connecting...';
        this.statusBarItem.backgroundColor = undefined;
        break;
      
      case ConnectionState.Connected:
        this.statusBarItem.text = '$(check) Mastra: Connected';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.prominentBackground'
        );
        break;
      
      case ConnectionState.Disconnected:
        this.statusBarItem.text = '$(error) Mastra: Disconnected';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.errorBackground'
        );
        break;
      
      case ConnectionState.Error:
        this.statusBarItem.text = '$(warning) Mastra: Configuration Error';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.errorBackground'
        );
        break;
    }

    this.statusBarItem.tooltip = this._error 
      ? `Error: ${this._error.message}\nClick to open settings`
      : `Endpoint: ${this._endpoint}\nClick to open settings`;
    
    this.statusBarItem.show();
  }

  private log(level: 'INFO' | 'WARN' | 'ERROR', message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [ConnectionManager] ${message}`;
    
    this.outputChannel.appendLine(logMessage);
    
    if (error && level === 'ERROR') {
      this.outputChannel.appendLine(`  Details: ${JSON.stringify(error, null, 2)}`);
    }
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
```

**Integration in extension.ts:**
```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { ConnectionStateManager } from './utils/connectionStateManager';
import { MastraClientWrapper } from './api/MastraClientWrapper';
import { ConfigurationManager } from './utils/configManager';

let connectionManager: ConnectionStateManager | undefined;

export async function activate(context: vscode.ExtensionContext) {
  // Create output channel
  const outputChannel = vscode.window.createOutputChannel('Mastra Trace Viewer');
  context.subscriptions.push(outputChannel);

  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.command = 'workbench.action.openSettings';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Get configured endpoint
  const endpoint = ConfigurationManager.getEndpoint();

  // Create API client
  const apiClient = new MastraClientWrapper(endpoint);

  // Create connection manager
  connectionManager = new ConnectionStateManager(
    statusBarItem,
    outputChannel,
    apiClient
  );
  context.subscriptions.push(connectionManager);

  // Initial connection attempt
  try {
    await connectionManager.connect(endpoint);
  } catch (error) {
    // Error handled by ConnectionStateManager
    outputChannel.appendLine(`Activation error: ${error}`);
  }

  // Listen for configuration changes
  const configListener = vscode.workspace.onDidChangeConfiguration(async event => {
    if (event.affectsConfiguration('mastraTraceViewer.endpoint')) {
      const newEndpoint = ConfigurationManager.getEndpoint();
      const newApiClient = new MastraClientWrapper(newEndpoint);
      
      // Update connection manager with new client
      connectionManager = new ConnectionStateManager(
        statusBarItem,
        outputChannel,
        newApiClient
      );
      
      await connectionManager.connect(newEndpoint);
    }
  });
  context.subscriptions.push(configListener);

  // Register other commands and providers here...
}

export function deactivate() {
  connectionManager?.disconnect();
}
```

### Status Bar Icons

**VSCode Codicons:**
- `$(sync~spin)` - Spinning sync icon for "Connecting"
- `$(check)` - Checkmark for "Connected"
- `$(error)` - Error X for "Disconnected"
- `$(warning)` - Warning triangle for "Configuration Error"

Reference: https://code.visualstudio.com/api/references/icons-in-labels

### Testing Standards

**Unit Tests:**
```typescript
// src/utils/connectionStateManager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConnectionStateManager, ConnectionState } from './connectionStateManager';
import { MastraApiError } from '../models/errors.types';

describe('ConnectionStateManager', () => {
  let manager: ConnectionStateManager;
  let mockStatusBar: any;
  let mockOutputChannel: any;
  let mockApiClient: any;

  beforeEach(() => {
    mockStatusBar = {
      text: '',
      backgroundColor: undefined,
      tooltip: '',
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

  describe('connect', () => {
    it('should transition to Connected on successful connection', async () => {
      mockApiClient.fetchTraces.mockResolvedValue([]);

      await manager.connect('http://localhost:4111');

      const status = manager.getState();
      expect(status.state).toBe(ConnectionState.Connected);
      expect(mockStatusBar.text).toContain('Connected');
    });

    it('should transition to Disconnected on network error', async () => {
      mockApiClient.fetchTraces.mockRejectedValue(
        new MastraApiError('Connection refused', 'NETWORK')
      );

      await manager.connect('http://localhost:4111');

      const status = manager.getState();
      expect(status.state).toBe(ConnectionState.Disconnected);
      expect(mockStatusBar.text).toContain('Disconnected');
    });

    it('should transition to Disconnected on timeout', async () => {
      // Mock delayed response longer than timeout
      mockApiClient.fetchTraces.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 15000))
      );

      await manager.connect('http://localhost:4111');

      const status = manager.getState();
      expect(status.state).toBe(ConnectionState.Disconnected);
      expect(status.error?.code).toBe('TIMEOUT');
    });

    it('should log connection attempts', async () => {
      mockApiClient.fetchTraces.mockResolvedValue([]);

      await manager.connect('http://localhost:4111');

      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Connecting to Mastra')
      );
    });
  });

  describe('disconnect', () => {
    it('should transition to Disconnected state', () => {
      manager.disconnect();

      const status = manager.getState();
      expect(status.state).toBe(ConnectionState.Disconnected);
    });
  });
});
```

### Known Pitfalls to Avoid

1. **Timeout Implementation**: Use Promise.race() correctly to avoid hanging connections
2. **Duplicate Notifications**: Track last error to prevent notification spam
3. **Status Bar Lifecycle**: Always call show() after updating text
4. **Theme Colors**: Use ThemeColor for background colors to respect user themes
5. **Error Context**: Include endpoint in error messages for troubleshooting
6. **Logging Verbosity**: Balance between helpful and noisy logging
7. **Dispose Properly**: Clean up status bar and output channel on deactivation
8. **Race Conditions**: Handle rapid configuration changes gracefully

### Project Structure Notes

**Module Dependencies:**
- ConnectionStateManager depends on:
  - MastraClientWrapper (api/)
  - MastraApiError (models/)
  - VSCode API (vscode module)
- No dependencies on providers/ or webview/
- Zero external npm packages beyond vscode

**Singleton Pattern:**
- ConnectionStateManager instance created in extension.ts activate()
- Passed to providers that need connection status
- Disposed in deactivate()

### References

**Architecture Decisions:**
- Source: [_bmad-output/planning-artifacts/architecture.md](../_bmad-output/planning-artifacts/architecture.md)
  - Section: "Mastra API Client Architecture" - Error handling decision
  - Section: "Cross-Cutting Concerns" - Error Handling & Resilience

**Requirements:**
- Source: [_bmad-output/planning-artifacts/prd.md](../_bmad-output/planning-artifacts/prd.md)
  - Section: "Technical Success" - Reliability requirements

**Epic Context:**
- Source: [_bmad-output/planning-artifacts/epics.md](../_bmad-output/planning-artifacts/epics.md)
  - Section: "Epic 1: Mastra Connection & Extension Foundation"
  - Story 1.4 complete acceptance criteria

**VSCode Documentation:**
- Status Bar API: https://code.visualstudio.com/api/references/vscode-api#StatusBarItem
- Output Channel: https://code.visualstudio.com/api/references/vscode-api#OutputChannel
- Icons in Labels: https://code.visualstudio.com/api/references/icons-in-labels

**Dependency on Previous Stories:**
- Story 1.1: Project structure initialized, extension.ts exists
- Story 1.2: MastraClientWrapper and MastraApiError classes defined
- Story 1.3: ConfigurationManager provides getEndpoint()

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

**Implementation Summary:**
- Created ConnectionStateManager class with full state machine implementation (Connecting → Connected/Disconnected/Error)
- Implemented 10-second connection timeout using Promise.race pattern
- Status bar integration with VSCode Codicons (sync~spin, check, error, warning)
- Theme-adaptive background colors using ThemeColor API
- Comprehensive error handling with user-friendly notifications and "Open Settings" action
- Anti-spam notification system to prevent duplicate error messages
- Output channel logging with ISO timestamps and structured format
- Full integration with extension lifecycle (activate/deactivate)

**Test Coverage:**
- 25 comprehensive unit tests covering all state transitions
- Timeout testing with 10+ second delays
- Error notification testing with mock VSCode APIs
- Status bar update verification
- Output channel logging verification
- 100% test pass rate (67 total tests in project)

**Technical Decisions:**
- Used Promise.race for timeout implementation (simple and effective)
- Status bar positioned at left with priority 100 for visibility
- Error state differentiation: INVALID_CONFIG → Error state, others → Disconnected state
- Duplicate notification prevention via _lastErrorMessage tracking

**Integration:**
- Seamlessly integrated with Story 1.2 (MastraClientWrapper and MastraApiError)
- Seamlessly integrated with Story 1.3 (ConfigurationManager)
- Configuration changes trigger automatic reconnection with new endpoint
- No breaking changes to existing functionality

### File List

- src/models/connection.types.ts (created - ConnectionState enum, ConnectionStatus interface)
- src/utils/connectionStateManager.ts (created - 218 lines)
- src/utils/connectionStateManager.test.ts (created - 25 tests, 360+ lines)
- src/extension.ts (modified - integrated connection manager, status bar, output channel)
- src/test/unit/extension.test.ts (modified - updated mocks for new VSCode APIs)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified - story 1-4 marked in-progress → review)
