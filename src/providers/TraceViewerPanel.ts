/**
 * TraceViewerPanel - Webview panel for displaying trace details
 * 
 * Manages webview panel lifecycle and communication with Svelte webview.
 * Uses singleton pattern per traceId for multi-tab support.
 */

import * as vscode from 'vscode';
import type { Trace } from '../models/trace.types';
import type { WebviewState } from '../models/webviewState.types';
import { DEFAULT_WEBVIEW_STATE } from '../models/webviewState.types';
import type { ExtensionMessage, WebviewMessage } from '../models/messages.types';
import { truncateString } from '../utils/formatters';

// Re-export message types for backwards compatibility
export type { ExtensionMessage, WebviewMessage } from '../models/messages.types';

export class TraceViewerPanel {
  /**
   * Track all open panels by traceId for singleton pattern
   */
  private static panels: Map<string, TraceViewerPanel> = new Map();

  /**
   * Viewtype identifier for webview panel
   */
  public static readonly viewType = 'mastraTraceViewer';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _traceId: string;
  private readonly _extensionUri: vscode.Uri;
  private _disposed = false;
  private _disposables: vscode.Disposable[] = [];
  
  /**
   * State preservation for tab switching
   */
  private _state: WebviewState = { ...DEFAULT_WEBVIEW_STATE };

  /**
   * Callback for retry requests from webview
   */
  private _onRetry?: () => void;

  /**
   * Create or reveal an existing panel for a trace
   * @param traceId The trace identifier
   * @param extensionUri Extension root URI for resource loading
   * @returns TraceViewerPanel instance
   */
  public static createOrShow(
    traceId: string,
    extensionUri: vscode.Uri
  ): TraceViewerPanel {
    const existing = TraceViewerPanel.panels.get(traceId);
    if (existing && !existing._disposed) {
      existing._panel.reveal(vscode.ViewColumn.One);
      return existing;
    }

    const panel = new TraceViewerPanel(traceId, extensionUri);
    TraceViewerPanel.panels.set(traceId, panel);
    return panel;
  }

  /**
   * Get existing panel for a trace if it exists
   */
  public static getPanel(traceId: string): TraceViewerPanel | undefined {
    const panel = TraceViewerPanel.panels.get(traceId);
    return panel && !panel._disposed ? panel : undefined;
  }

  /**
   * Dispose all open panels (call on extension deactivation)
   */
  public static disposeAll(): void {
    for (const panel of TraceViewerPanel.panels.values()) {
      panel._dispose();
    }
    TraceViewerPanel.panels.clear();
  }

  /**
   * Get count of open panels
   */
  public static get panelCount(): number {
    return TraceViewerPanel.panels.size;
  }

  /**
   * Private constructor - use createOrShow() instead
   */
  private constructor(traceId: string, extensionUri: vscode.Uri) {
    this._traceId = traceId;
    this._extensionUri = extensionUri;

    // Create webview panel
    this._panel = vscode.window.createWebviewPanel(
      TraceViewerPanel.viewType,
      `Trace: ${truncateString(traceId, 20)}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'out', 'webview')
        ],
        retainContextWhenHidden: true
      }
    );

    // Set panel icon (uses VSCode ThemeIcon)
    this._panel.iconPath = new vscode.ThemeIcon('telescope');

    // Set initial HTML content
    this._panel.webview.html = this._getHtmlForWebview();

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => this._handleWebviewMessage(message),
      null,
      this._disposables
    );

    // Handle panel disposal
    this._panel.onDidDispose(
      () => this._dispose(),
      null,
      this._disposables
    );

    // Handle visibility changes for state restoration
    // Note: With retainContextWhenHidden: true, webview state persists naturally.
    // We only restore on 'ready' message (webview reload).
    // This handler is kept for potential future use or if retainContextWhenHidden is disabled.
    this._panel.onDidChangeViewState(
      (e) => this._handleViewStateChange(e),
      null,
      this._disposables
    );
  }

  /**
   * Handle panel visibility changes
   * With retainContextWhenHidden: true, we don't need to restore state
   * because the webview keeps its state. We only restore on webview reload
   * (handled by 'ready' message).
   */
  private _handleViewStateChange(_e: vscode.WebviewPanelOnDidChangeViewStateEvent): void {
    // Intentionally empty - state is preserved by retainContextWhenHidden
    // State restoration only happens on 'ready' message (webview reload)
  }

  /**
   * Send saved state to webview for restoration
   */
  private _restoreState(): void {
    if (!this._disposed) {
      const message: ExtensionMessage = { type: 'restoreState', payload: this._state };
      this._panel.webview.postMessage(message);
    }
  }

  /**
   * Get the current saved state for this panel
   */
  public get state(): WebviewState {
    return { ...this._state };
  }

  /**
   * Send trace data to webview
   * @param trace The trace data to display
   * @param selectedSpanId Optional span ID to auto-select and scroll to
   */
  public sendTrace(trace: Trace, selectedSpanId?: string): void {
    if (!this._disposed) {
      const message: ExtensionMessage = { type: 'loadTrace', payload: { trace, selectedSpanId } };
      this._panel.webview.postMessage(message);
    }
  }

  /**
   * Send loading state to webview
   */
  public sendLoading(message = 'Loading trace...'): void {
    if (!this._disposed) {
      const msg: ExtensionMessage = { type: 'loading', payload: { message } };
      this._panel.webview.postMessage(msg);
    }
  }

  /**
   * Send error state to webview
   */
  public sendError(message: string): void {
    if (!this._disposed) {
      const msg: ExtensionMessage = { type: 'error', payload: { message } };
      this._panel.webview.postMessage(msg);
    }
  }

  /**
   * Set callback for retry requests
   */
  public onRetry(callback: () => void): void {
    this._onRetry = callback;
  }

  /**
   * Reveal the panel
   */
  public reveal(): void {
    if (!this._disposed) {
      this._panel.reveal(vscode.ViewColumn.One);
    }
  }

  /**
   * Check if panel is disposed
   */
  public get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Get the trace ID for this panel
   */
  public get traceId(): string {
    return this._traceId;
  }

  /**
   * Handle messages from webview
   */
  private _handleWebviewMessage(message: WebviewMessage): void {
    switch (message.type) {
      case 'retry':
        this._onRetry?.();
        break;
      case 'ready':
        // Webview is ready to receive messages, restore state
        this._restoreState();
        break;
      case 'showWarning':
        vscode.window.showWarningMessage(message.payload.message);
        break;
      case 'saveState':
        // Webview is saving its state
        this._state = message.payload;
        break;
    }
  }

  /**
   * Generate HTML content for webview
   */
  private _getHtmlForWebview(): string {
    const webview = this._panel.webview;

    // Generate nonce for script security
    const nonce = this._getNonce();

    // Get URI for compiled Svelte bundle
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'main.js')
    );

    // Get URI for stylesheet (if exists)
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'main.css')
    );

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'none'; 
                 style-src ${webview.cspSource} 'unsafe-inline'; 
                 script-src 'nonce-${nonce}';
                 font-src ${webview.cspSource};">
  <link href="${styleUri}" rel="stylesheet">
  <title>Trace: ${this._traceId}</title>
</head>
<body>
  <div id="app">
    <div class="loading">
      <p>Loading trace...</p>
    </div>
  </div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * Generate cryptographic nonce for CSP
   */
  private _getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /**
   * Clean up resources
   */
  private _dispose(): void {
    TraceViewerPanel.panels.delete(this._traceId);
    this._disposed = true;

    // Dispose of panel
    this._panel.dispose();

    // Dispose of all disposables
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
