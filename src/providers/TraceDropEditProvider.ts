/**
 * TraceDropEditProvider - DocumentDropEditProvider for dropping traces into editors
 * Story 6.3: Enable Drop into VSCode Editors
 */

import * as vscode from 'vscode';

/**
 * Provider implementing drop support for trace files into text editors.
 * Handles plain text, JSON, and markdown files with appropriate formatting.
 */
export class TraceDropEditProvider implements vscode.DocumentDropEditProvider {
  /**
   * MIME types this provider can handle
   */
  static readonly mimeTypes: readonly string[] = ['text/uri-list', 'text/plain'];

  /**
   * Provide document drop edits when a trace file is dropped onto an editor
   * @param document The target document
   * @param position The drop position
   * @param dataTransfer The data being dropped
   * @param token Cancellation token
   */
  async provideDocumentDropEdits(
    document: vscode.TextDocument,
    _position: vscode.Position,
    dataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<vscode.DocumentDropEdit | undefined> {
    // Extract file path from DataTransfer
    const uriListItem = dataTransfer.get('text/uri-list');
    const plainTextItem = dataTransfer.get('text/plain');
    
    let filePath: string | undefined;
    
    if (uriListItem) {
      const uriString = await uriListItem.asString();
      if (uriString) {
        // Parse file:// URI to get path
        try {
          const uri = vscode.Uri.parse(uriString);
          filePath = uri.fsPath;
        } catch {
          filePath = uriString;
        }
      }
    } else if (plainTextItem) {
      filePath = await plainTextItem.asString();
    }

    // Check cancellation after async operation
    if (token.isCancellationRequested) {
      return undefined;
    }

    // Validate we have a file path
    if (!filePath) {
      return undefined;
    }

    // Insert file path for all file types
    const dropEdit = new vscode.DocumentDropEdit(filePath);
    dropEdit.title = 'Insert Trace File Path';
    return dropEdit;
  }
}
