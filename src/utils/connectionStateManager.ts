/**
 * ConnectionStateManager - Manages connection state to Mastra instance
 * Handles status bar updates, logging, and user notifications
 */

import * as vscode from 'vscode';
import { MastraClientWrapper } from '../api/MastraClientWrapper';
import { MastraApiError } from '../models/errors.types';
import { ConnectionState, ConnectionStatus } from '../models/connection.types';

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

  /**
   * Attempt to connect to Mastra endpoint
   * @param endpoint Mastra API endpoint URL
   */
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

  /**
   * Disconnect from Mastra instance
   */
  disconnect(): void {
    this.updateState(ConnectionState.Disconnected);
    this._error = undefined;
    this.log('INFO', 'Disconnected from Mastra');
  }

  /**
   * Get current connection status
   */
  getState(): ConnectionStatus {
    return {
      state: this._state,
      endpoint: this._endpoint,
      error: this._error,
      lastConnected: this._lastConnected
    };
  }

  /**
   * Test connection with timeout
   * @param timeoutMs Timeout in milliseconds
   */
  private async testConnectionWithTimeout(timeoutMs: number): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      globalThis.setTimeout(() => {
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

  /**
   * Handle connection errors and update state appropriately
   */
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

  /**
   * Show user-friendly error notification with action button
   */
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

  /**
   * Update internal state and synchronize UI
   */
  private updateState(state: ConnectionState): void {
    this._state = state;
    this.updateStatusBar();
  }

  /**
   * Update status bar item to reflect current state
   */
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

  /**
   * Log message to output channel
   */
  private log(level: 'INFO' | 'WARN' | 'ERROR', message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [ConnectionManager] ${message}`;
    
    this.outputChannel.appendLine(logMessage);
    
    if (error && level === 'ERROR') {
      this.outputChannel.appendLine(`  Details: ${JSON.stringify(error, null, 2)}`);
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
