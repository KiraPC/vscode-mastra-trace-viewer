/**
 * TraceDragController - TreeDragAndDropController for trace drag operations
 * Story 6.1: Implement TreeView Drag Support
 */

import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import { TraceTreeItem } from './TraceListProvider';
import type { TraceListProvider } from './TraceListProvider';

/**
 * Controller implementing drag support for trace items in the TreeView.
 * Enables dragging traces to Copilot chat, text editors, and other drop targets.
 * Creates temporary JSON files for drag operations.
 */
export class TraceDragController implements vscode.TreeDragAndDropController<TraceTreeItem> {
  /**
   * MIME types supported for drop operations (empty - no drop into tree)
   */
  readonly dropMimeTypes: readonly string[] = [];

  /**
   * MIME types provided during drag operations
   * Multiple formats for compatibility with different drop targets:
   * - files: Native file drag format
   * - resourceurls: VSCode explorer format (JSON array of URIs)
   * - application/vnd.code.uri-list: VSCode internal URI format
   * - text/uri-list: Standard file URI for editors
   * - application/json: JSON content directly
   * - text/plain: File path as plain text
   */
  readonly dragMimeTypes: readonly string[] = [
    'files',
    'resourceurls',
    'application/vnd.code.uri-list', 
    'text/uri-list',
    'application/json', 
    'text/plain'
  ];

  constructor(private traceListProvider: TraceListProvider) {}

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

      // Create temp file with trace JSON
      const tempDir = os.tmpdir();
      const fileName = `trace-${traceId.slice(0, 8)}.json`;
      const filePath = path.join(tempDir, fileName);
      const fileUri = vscode.Uri.file(filePath);

      // Write JSON to temp file
      await vscode.workspace.fs.writeFile(fileUri, Buffer.from(jsonString, 'utf-8'));

      // Set file URI for drag in multiple formats for maximum compatibility
      
      // VSCode explorer format (resourceurls) - JSON array of URIs
      dataTransfer.set('resourceurls', new vscode.DataTransferItem(JSON.stringify([fileUri.toString()])));
      
      // VSCode internal format (for Copilot Chat and other VSCode features)
      dataTransfer.set('application/vnd.code.uri-list', new vscode.DataTransferItem(fileUri.toString()));
      
      // Standard URI list format
      dataTransfer.set('text/uri-list', new vscode.DataTransferItem(fileUri.toString()));
      
      // Include JSON content directly as fallback
      dataTransfer.set('application/json', new vscode.DataTransferItem(jsonString));
      
      // Plain text fallback with file path
      dataTransfer.set('text/plain', new vscode.DataTransferItem(filePath));
    } catch {
      // Silently fail on errors - don't crash drag operation
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
