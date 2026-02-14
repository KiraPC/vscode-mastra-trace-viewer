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
  static readonly mimeTypes: readonly string[] = ['application/json', 'text/plain'];

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
    // Try to get JSON content directly (most reliable for remote environments)
    const jsonItem = dataTransfer.get('application/json');
    const plainTextItem = dataTransfer.get('text/plain');
    
    let content: string | undefined;
    
    if (jsonItem) {
      content = await jsonItem.asString();
    } else if (plainTextItem) {
      content = await plainTextItem.asString();
    }

    // Check cancellation after async operation
    if (token.isCancellationRequested) {
      return undefined;
    }

    // Validate we have content
    if (!content) {
      return undefined;
    }

    // Insert JSON content directly
    const dropEdit = new vscode.DocumentDropEdit(content);
    dropEdit.title = 'Insert Trace JSON';
    return dropEdit;
  }
}
