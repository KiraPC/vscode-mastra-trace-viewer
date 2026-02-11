# Story 3.1: Open Trace in Webview Tab

Status: done

## Story

As a developer,
I want to click on a trace in the sidebar to open it in a new tab,
So that I can view the trace details.

## Acceptance Criteria

**Given** Traces are displayed in the sidebar
**When** I click on a trace item
**Then** The mastra-trace-viewer.open-trace command is executed with traceId parameter
**And** A new webview panel opens with title "Trace: [traceId]"

**Given** The open-trace command is triggered
**When** The trace is already in TraceCache
**Then** The cached trace data is used immediately
**And** No API call is made

**Given** The trace is not in cache
**When** The open-trace command is triggered
**Then** MastraClientWrapper.fetchTraceById(traceId) is called
**And** A loading indicator shows "Loading trace..." in the webview
**And** Once loaded, the trace is stored in TraceCache

**Given** The trace data is fetched
**When** I create TraceViewerPanel in src/providers/TraceViewerPanel.ts
**Then** TraceViewerPanel manages webview panel lifecycle
**And** TraceViewerPanel creates webview with HTML content
**And** TraceViewerPanel sends trace data to webview via postMessage

**Given** Trace fetch fails
**When** MastraClientWrapper.fetchTraceById() throws an error
**Then** Error notification displays: "Failed to load trace: [error message]"
**And** The webview shows error state with retry button
**And** The error is logged to output channel

## Tasks / Subtasks

- [x] Register open-trace command in extension.ts (AC: 1)
  - [x] Add command registration in activate(): `vscode.commands.registerCommand('mastra-trace-viewer.open-trace', ...)`
  - [x] Command handler receives traceId as parameter
  - [x] Add command to package.json contributions

- [x] Create TraceViewerPanel class (AC: 4)
  - [x] Create src/providers/TraceViewerPanel.ts
  - [x] Implement static `createOrShow(traceId, extensionUri)` method
  - [x] Create WebviewPanel with `vscode.window.createWebviewPanel()`
  - [x] Set panel title: `Trace: ${truncateString(traceId, 20)}`
  - [x] Configure webview options: enableScripts: true, localResourceRoots
  - [x] Implement `dispose()` for cleanup
  - [x] Track panel in static Map for multi-tab support (Epic 4 foundation)

- [x] Implement webview HTML generation (AC: 4)
  - [x] Create `getHtmlForWebview(webview)` method
  - [x] Include proper Content Security Policy (CSP)
  - [x] Link to compiled Svelte bundle from out/webview/
  - [x] Include nonce for script security
  - [x] Add meta viewport and charset

- [x] Integrate with TraceCache for cached traces (AC: 2)
  - [x] Import TraceCache from TraceListProvider or create shared instance
  - [x] In open-trace handler, check cache first: `traceCache.get(traceId)`
  - [x] If cached, use immediately without API call
  - [x] Log cache hit/miss for debugging

- [x] Implement API fallback for uncached traces (AC: 3)
  - [x] If trace not in cache, call `mastraClient.fetchTraceById(traceId)`
  - [x] Show loading state in webview before data arrives
  - [x] Cache fetched trace for future use
  - [x] Handle loading state via postMessage

- [x] Implement postMessage communication to webview (AC: 4)
  - [x] Define message type: `{ type: 'loadTrace', payload: Trace }`
  - [x] Send trace data to webview after load
  - [x] Webview receives via `window.addEventListener('message')`

- [x] Implement error handling (AC: 5)
  - [x] Wrap fetchTraceById in try/catch
  - [x] Show VSCode error notification on failure
  - [x] Send error message to webview: `{ type: 'error', payload: string }`
  - [x] Log error to output channel
  - [x] Webview displays retry button on error

- [x] Add click handler to TraceListProvider (AC: 1)
  - [x] Update TraceTreeItem to include command property
  - [x] Set command: `{ command: 'mastra-trace-viewer.open-trace', arguments: [traceId] }`
  - [x] Ensure click triggers open-trace command

## Dev Notes

### Critical Architecture Requirements

**Webview Panel Type:**
- Per architecture.md: "Custom Webview Panel (not Custom Editor API)"
- Traces are not editable files; webview panel provides flexibility for rich UI
- TraceViewerPanel class manages webview lifecycle

**Communication Protocol:**
- Per architecture.md: "Typed PostMessage with discriminated union types"
- Extension → Webview: `{ type: 'loadTrace', payload: Trace } | { type: 'error', payload: string }`
- All messages must be type-safe via TypeScript

**Cache Integration:**
- TraceCache already exists in src/utils/traceCache.ts (Story 2.4)
- Use existing getTraceFromCache() from TraceListProvider
- Cache check prevents redundant API calls

**File Structure:**
- New file: `src/providers/TraceViewerPanel.ts`
- Follows existing pattern: `TraceListProvider.ts` in same directory

### Implementation Pattern

**TraceViewerPanel Singleton per Trace:**
```typescript
export class TraceViewerPanel {
  private static panels: Map<string, TraceViewerPanel> = new Map();
  private readonly _panel: vscode.WebviewPanel;
  private readonly _traceId: string;
  private _disposed = false;

  public static createOrShow(
    traceId: string,
    extensionUri: vscode.Uri,
    trace?: Trace
  ): TraceViewerPanel {
    const existing = TraceViewerPanel.panels.get(traceId);
    if (existing) {
      existing._panel.reveal();
      return existing;
    }

    const panel = new TraceViewerPanel(traceId, extensionUri);
    TraceViewerPanel.panels.set(traceId, panel);
    return panel;
  }

  private constructor(traceId: string, extensionUri: vscode.Uri) {
    this._traceId = traceId;
    this._panel = vscode.window.createWebviewPanel(
      'mastraTraceViewer',
      `Trace: ${truncateString(traceId, 20)}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out', 'webview')],
        retainContextWhenHidden: true
      }
    );

    this._panel.webview.html = this.getHtmlForWebview();
    this._panel.onDidDispose(() => this.dispose());
  }

  public sendTrace(trace: Trace): void {
    this._panel.webview.postMessage({ type: 'loadTrace', payload: trace });
  }

  public sendError(message: string): void {
    this._panel.webview.postMessage({ type: 'error', payload: message });
  }

  private dispose(): void {
    TraceViewerPanel.panels.delete(this._traceId);
    this._disposed = true;
  }
}
```

**Content Security Policy:**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'none'; 
               style-src ${webview.cspSource} 'unsafe-inline'; 
               script-src 'nonce-${nonce}';
               font-src ${webview.cspSource};">
```

### Testing Notes

- Test command registration and execution
- Test cache hit scenario (no API call)
- Test cache miss scenario (API called)
- Test error handling with mock API failure
- Verify webview receives message

### Project Structure Notes

- Alignment with existing providers/ directory structure
- TraceViewerPanel follows same pattern as TraceListProvider
- Shared TraceCache instance needed (consider exporting from traceCache.ts or creating shared context)

### References

- [Architecture: Webview Pattern](../_bmad-output/planning-artifacts/architecture.md#decision-5-3-webview-type)
- [Architecture: Message Protocol](../_bmad-output/planning-artifacts/architecture.md#decision-2-1-message-protocol)
- [Existing TraceCache](../src/utils/traceCache.ts)
- [Existing TraceListProvider](../src/providers/TraceListProvider.ts)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- Cache hit/miss logging in open-trace command handler
- Error logging to output channel on trace fetch failure

### Completion Notes List

1. Created TraceViewerPanel class with singleton pattern per traceId for multi-tab support
2. Implemented webview HTML generation with proper CSP and nonce for security
3. Defined typed message protocol: WebviewMessage and ExtensionMessage discriminated unions
4. Integrated with existing TraceCache via TraceListProvider.getTraceFromCache()
5. Added API fallback using TraceListProvider.fetchFullTrace() for uncached traces
6. Implemented retry mechanism allowing webview to request trace reload on error
7. Updated TraceTreeItem to use new open-trace command instead of openJson for traces
8. Added 14 unit tests for TraceViewerPanel covering all public methods and message handling
9. All 118 tests passing, compilation successful

### File List

- src/providers/TraceViewerPanel.ts (new)
- src/providers/TraceViewerPanel.test.ts (new)
- src/providers/TraceListProvider.ts (modified - command change in TraceTreeItem)
- src/extension.ts (modified - open-trace command, TraceViewerPanel import)
- package.json (modified - added open-trace command contribution)
