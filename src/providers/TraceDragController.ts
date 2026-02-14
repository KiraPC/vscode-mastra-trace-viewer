/**
 * TraceDragController - TreeDragAndDropController for trace drag operations
 * Story 6.1: Implement TreeView Drag Support
 */

import * as vscode from 'vscode';
import { TraceTreeItem } from './TraceListProvider';
import type { TraceListProvider } from './TraceListProvider';

/**
 * Controller implementing drag support for trace items in the TreeView.
 * Enables dragging traces to Copilot chat, text editors, and other drop targets.
 * Uses extension globalStorageUri for file storage (works in remote environments).
 */
export class TraceDragController implements vscode.TreeDragAndDropController<TraceTreeItem> {
  /**
   * MIME types supported for drop operations (empty - no drop into tree)
   */
  readonly dropMimeTypes: readonly string[] = [];

  /**
   * MIME types provided during drag operations
   * Multiple formats for maximum compatibility:
   * - text/uri-list: File URI for drop targets that open files
   * - application/json: JSON content directly
   * - text/plain: JSON content as plain text fallback
   */
  readonly dragMimeTypes: readonly string[] = [
    'text/uri-list',
    'application/json', 
    'text/plain'
  ];

  private storageUri: vscode.Uri;

  constructor(
    private traceListProvider: TraceListProvider,
    storageUri: vscode.Uri
  ) {
    this.storageUri = storageUri;
  }

  /**
   * Handle drag operation by creating a temp JSON file and populating DataTransfer
   * @param source Array of dragged tree items
   * @param dataTransfer DataTransfer object to populate
   * @param token Cancellation token
   */
  async handleDrag(
    source: readonly TraceTreeItem[],
    dataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<void> {
    // Filter to only trace items (not spans or load-more)
    const traceItems = source.filter(
      (item) => item.trace && !item.span && !item.isLoadMore
    );

    if (traceItems.length === 0) {
      return;
    }

    // Check cancellation before proceeding
    if (token.isCancellationRequested) {
      return;
    }

    // For MVP, handle single trace drag (first item)
    const item = traceItems[0];
    const traceId = item.trace!.traceId;

    // Get full trace (from cache or fetch)
    let fullTrace = this.traceListProvider.getTraceFromCache(traceId);

    // If cache has incomplete trace (0 or 1 span), fetch full trace
    if (!fullTrace || (fullTrace.spans?.length || 0) <= 1) {
      fullTrace = await this.traceListProvider.fetchFullTrace(traceId);
    }

    // Check cancellation after async operation
    if (token.isCancellationRequested) {
      return;
    }

    // If no trace data available, don't populate DataTransfer
    if (!fullTrace) {
      return;
    }

    try {
      // Serialize trace to pretty-printed JSON (2-space indent)
      const jsonString = JSON.stringify(fullTrace, null, 2);

      // Create file in extension globalStorageUri (guaranteed to work in remote environments)
      const fileName = `trace-${traceId.slice(0, 8)}.json`;
      const fileUri = vscode.Uri.joinPath(this.storageUri, fileName);
      
      // Write file using vscode.workspace.fs (handles remote file systems correctly)
      await vscode.workspace.fs.writeFile(fileUri, Buffer.from(jsonString, 'utf-8'));

      // Build correct URI for remote environments
      let uriForDrop: string;
      if (vscode.env.remoteName && fileUri.scheme === 'file') {
        // In remote environment with file:// scheme, construct vscode-remote URI
        const remoteUri = vscode.Uri.from({
          scheme: 'vscode-remote',
          authority: `${vscode.env.remoteName}+default`,
          path: fileUri.path,
        });
        uriForDrop = remoteUri.toString();
      } else {
        uriForDrop = fileUri.toString();
      }

      // Set file URI for drop targets that want to open files
      dataTransfer.set('text/uri-list', new vscode.DataTransferItem(uriForDrop));
      
      // Also include JSON content directly for providers that prefer content
      dataTransfer.set('application/json', new vscode.DataTransferItem(jsonString));
      dataTransfer.set('text/plain', new vscode.DataTransferItem(jsonString));
    } catch (error) {
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Failed to create trace file for drag: ${errorMessage}`);
      return;
    }
  }

  /**
   * Handle drop operation (not supported - drag-only)
   */
  handleDrop(): void | Thenable<void> {
    return undefined;
  }
}
