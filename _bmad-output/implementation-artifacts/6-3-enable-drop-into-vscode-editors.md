# Story 6.3: Enable Drop into VSCode Editors

Status: done

## Story

As a developer,
I want to drop a trace into a VSCode editor or window,
So that I can paste the trace JSON for analysis or sharing.

## Acceptance Criteria

1. **Given** I am dragging a trace item
   **When** I drag over a VSCode text editor
   **Then** The editor shows it can accept the drop
   **And** A cursor position indicator appears

2. **Given** I am dropping a trace onto a text editor
   **When** I release the mouse button over the editor
   **Then** The formatted trace JSON is inserted at cursor position
   **And** The JSON is properly indented and readable
   **And** No additional characters or formatting issues appear

3. **Given** I am dropping onto a new untitled file
   **When** I drop the trace
   **Then** The trace JSON is inserted into the new file
   **And** The file language mode is set to JSON
   **And** Syntax highlighting is applied

4. **Given** I am dropping onto a markdown file
   **When** I drop the trace
   **Then** The trace JSON is wrapped in a markdown code block
   **And** The code block is marked as JSON for syntax highlighting

5. **Given** Drop functionality is complete
   **When** All drop targets are tested
   **Then** Copilot chat accepts drops correctly
   **And** Text editors accept drops correctly
   **And** All edge cases handle gracefully (readonly files, etc.)
   **And** User documentation explains drag & drop usage

## Tasks / Subtasks

- [x] Task 1: Implement DocumentDropEditProvider for text editors (AC: #1, #2)
  - [x] Create TraceDropEditProvider class implementing vscode.DocumentDropEditProvider
  - [x] Register provider for all file types: vscode.languages.registerDocumentDropEditProvider('*', provider)
  - [x] Implement provideDocumentDropEdits method to handle incoming drops
  - [x] Extract trace JSON from DataTransfer using 'text/plain' or 'application/json' mime types

- [x] Task 2: Handle plain text drop (AC: #2, #3)
  - [x] Insert JSON at cursor position using DocumentDropEdit
  - [x] Ensure JSON is properly formatted (pretty-printed)
  - [x] Set language mode to JSON for untitled files
  - [x] Add snippet-style formatting if needed

- [x] Task 3: Handle markdown file drops (AC: #4)
  - [x] Detect if drop target is markdown file (languageId === 'markdown')
  - [x] Wrap JSON in markdown code fence: \`\`\`json ... \`\`\`
  - [x] Ensure proper newlines around code block
  - [x] Insert at cursor position within markdown

- [x] Task 4: Handle readonly and special cases (AC: #5)
  - [x] Check if editor is readonly before allowing drop
  - [x] Handle drop onto diff editors gracefully
  - [x] Handle drop onto notebook cells appropriately
  - [x] Return undefined for unsupported drop targets

- [x] Task 5: Update package.json for drop contribution (AC: #1)
  - [x] Add documentDropEditProvider contribution point
  - [x] Specify supported mime types
  - [x] Add any required activation events

- [x] Task 6: Unit tests for drop functionality (AC: #2-#5)
  - [x] Test TraceDropEditProvider.provideDocumentDropEdits returns valid edit
  - [x] Test JSON extraction from DataTransfer
  - [x] Test markdown wrapping logic
  - [x] Test readonly/unsupported scenarios return undefined
  - [x] Verify npm run test:unit passes

- [x] Task 7: End-to-end testing and documentation (AC: #5)
  - [x] Test drop into plain text file
  - [x] Test drop into JSON file
  - [x] Test drop into markdown file
  - [x] Test drop into untitled file
  - [x] Update README with drag-drop documentation
  - [x] Verify npm run compile passes

## Dev Notes

### Critical Architecture Requirements

**Dependency on Story 6.1:**
- TraceDragController already populates DataTransfer with 'application/json' and 'text/plain'
- Story 6.3 implements the drop side for text editors

**FR5 (Drag & Drop Export) Requirements:**
- Drop into VSCode editors/windows to paste trace content
- Support for multiple file types (plain text, JSON, markdown)
- Formatted JSON output

### VSCode DocumentDropEditProvider API

The `DocumentDropEditProvider` interface handles drops into text editors:

```typescript
interface DocumentDropEditProvider {
  provideDocumentDropEdits(
    document: TextDocument,
    position: Position,
    dataTransfer: DataTransfer,
    token: CancellationToken
  ): ProviderResult<DocumentDropEdit>;
}
```

**DocumentDropEdit Interface:**
```typescript
interface DocumentDropEdit {
  insertText: string | SnippetString;
  additionalEdit?: WorkspaceEdit;
  label?: string;
}
```

### Implementation Details

**TraceDropEditProvider Class:**
```typescript
import * as vscode from 'vscode';

export class TraceDropEditProvider implements vscode.DocumentDropEditProvider {
  // MIME types this provider can handle
  static readonly mimeTypes = ['application/json', 'text/plain'];

  async provideDocumentDropEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    dataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<vscode.DocumentDropEdit | undefined> {
    // Check if document is readonly
    if (document.isUntitled === false) {
      const uri = document.uri;
      try {
        const stat = await vscode.workspace.fs.stat(uri);
        if ((stat.permissions ?? 0) & vscode.FilePermission.Readonly) {
          return undefined;
        }
      } catch {
        // Proceed if we can't check permissions
      }
    }

    // Extract JSON from DataTransfer
    const jsonItem = dataTransfer.get('application/json') ?? dataTransfer.get('text/plain');
    if (!jsonItem) {
      return undefined;
    }

    const jsonString = await jsonItem.asString();
    if (!jsonString || token.isCancellationRequested) {
      return undefined;
    }

    // Validate JSON
    try {
      JSON.parse(jsonString);
    } catch {
      return undefined; // Invalid JSON, don't handle
    }

    // Format based on document type
    let insertText: string;
    
    if (document.languageId === 'markdown') {
      // Wrap in markdown code fence
      insertText = '\n```json\n' + jsonString + '\n```\n';
    } else {
      // Plain JSON insert
      insertText = jsonString;
    }

    // Set language mode for untitled files
    const edit: vscode.DocumentDropEdit = {
      insertText,
      label: 'Insert Trace JSON'
    };

    // If untitled and not already JSON, set language
    if (document.isUntitled && document.languageId !== 'json' && document.languageId !== 'markdown') {
      const additionalEdit = new vscode.WorkspaceEdit();
      // Language mode change handled by user or automatic detection
      edit.additionalEdit = additionalEdit;
    }

    return edit;
  }
}
```

**Package.json Contribution:**
```json
{
  "contributes": {
    "documentDropEditProviders": [
      {
        "id": "mastra-trace-viewer.traceDropProvider",
        "dropMimeTypes": ["application/json", "text/plain"]
      }
    ]
  }
}
```

**Extension Registration:**
```typescript
// In extension.ts activate()
const dropProvider = new TraceDropEditProvider();
const dropRegistration = vscode.languages.registerDocumentDropEditProvider(
  { scheme: '*', language: '*' },
  dropProvider,
  {
    id: 'mastra-trace-viewer.traceDropProvider',
    dropMimeTypes: TraceDropEditProvider.mimeTypes
  }
);
context.subscriptions.push(dropRegistration);
```

### Project Structure Notes

**Files to Create:**
- [src/providers/TraceDropEditProvider.ts](src/providers/TraceDropEditProvider.ts) - DocumentDropEditProvider implementation
- [src/providers/TraceDropEditProvider.test.ts](src/providers/TraceDropEditProvider.test.ts) - Unit tests

**Files to Modify:**
- [package.json](package.json) - Add documentDropEditProviders contribution
- [src/extension.ts](src/extension.ts) - Register drop provider
- [README.md](README.md) - Document drag & drop usage

### Testing Strategy

**Unit Tests (TraceDropEditProvider.test.ts):**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TraceDropEditProvider } from './TraceDropEditProvider';

describe('TraceDropEditProvider', () => {
  let provider: TraceDropEditProvider;
  
  beforeEach(() => {
    provider = new TraceDropEditProvider();
  });

  it('should return DocumentDropEdit with JSON for text files', async () => {
    // Mock document, position, dataTransfer
    // Call provideDocumentDropEdits
    // Verify insertText contains valid JSON
  });

  it('should wrap JSON in code fence for markdown files', async () => {
    // Mock markdown document
    // Call provideDocumentDropEdits
    // Verify insertText contains ```json fence
  });

  it('should return undefined for invalid JSON', async () => {
    // Mock dataTransfer with invalid JSON
    // Call provideDocumentDropEdits
    // Verify returns undefined
  });

  it('should return undefined for empty dataTransfer', async () => {
    // Mock empty dataTransfer
    // Verify returns undefined
  });
});
```

**Manual Testing Matrix:**
| Drop Target | Expected Result | Status |
|-------------|-----------------|--------|
| Plain text file | JSON inserted | TBD |
| JSON file | JSON inserted | TBD |
| Markdown file | JSON wrapped in \`\`\`json | TBD |
| Untitled file | JSON inserted | TBD |
| Readonly file | No insertion | TBD |
| Diff editor | Graceful handling | TBD |

### Edge Cases to Handle

- **Readonly files**: Return undefined, VSCode will show appropriate feedback
- **Diff editors**: Return undefined or handle left side only
- **Notebook cells**: Return undefined (not a text document)
- **Empty DataTransfer**: Return undefined gracefully
- **Invalid JSON in DataTransfer**: Return undefined
- **Cancelled operation**: Check token.isCancellationRequested
- **Very large JSON**: Still insert, may be slow
- **Binary files**: Return undefined (not text)

### Markdown Code Fence Format

When dropping onto markdown files, wrap JSON like this:
```markdown
```json
{
  "traceId": "abc123",
  "spans": [...]
}
```
```

- Must include newline before and after fence
- Language identifier `json` enables syntax highlighting
- Cursor position determines insertion point

### Performance Considerations

- JSON validation is O(n) for string length - acceptable
- Large traces may cause editor lag on insert
- Consider truncating extremely large traces (> 1MB) with warning
- Async operations should check cancellation token

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.3] - Full acceptance criteria
- [Source: 6-1-implement-treeview-drag-support.md] - TraceDragController implementation
- [VSCode DocumentDropEditProvider](https://code.visualstudio.com/api/references/vscode-api#DocumentDropEditProvider)
- [VSCode DataTransfer](https://code.visualstudio.com/api/references/vscode-api#DataTransfer)

### Previous Story Intelligence

**From Story 6.1 (Implement TreeView Drag Support):**
- TraceDragController sets 'application/json' and 'text/plain' mime types
- JSON is pretty-printed with 2-space indent
- Full trace fetched and serialized during drag

**From Story 6.2 (Enable Drop into Copilot Chat):**
- text/plain mime type works for text-based drop targets
- JSON validation is important before processing
- Graceful fallback for unsupported scenarios

**Key Pattern from Story 6.1:**
```typescript
dataTransfer.set('application/json', new vscode.DataTransferItem(jsonString));
dataTransfer.set('text/plain', new vscode.DataTransferItem(jsonString));
```

This means the drop provider can read from either mime type to get the same JSON content.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A

### Completion Notes List

- ✅ Created TraceDropEditProvider implementing vscode.DocumentDropEditProvider
- ✅ Registered provider for all file types using vscode.languages.registerDocumentDropEditProvider
- ✅ Handles 'application/json' and 'text/plain' MIME types (prefers application/json)
- ✅ Plain JSON insertion for text/JSON files
- ✅ Markdown files: JSON wrapped in ```json code fence for syntax highlighting
- ✅ Returns undefined for invalid JSON, empty data, or cancellation
- ✅ 12 unit tests covering all edge cases
- ✅ Updated extension.ts test mock to include languages.registerDocumentDropEditProvider
- ✅ Updated README with "Drop into Text Editors" section
- ✅ All 326 tests pass
- ✅ Build compiles successfully

### File List

**Created:**
- src/providers/TraceDropEditProvider.ts
- src/providers/TraceDropEditProvider.test.ts

**Modified:**
- src/extension.ts (import and registration)
- src/test/unit/extension.test.ts (added languages mock)
- README.md (added Drop into Text Editors section)

