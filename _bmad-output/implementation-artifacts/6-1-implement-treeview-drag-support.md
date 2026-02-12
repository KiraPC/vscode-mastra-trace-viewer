# Story 6.1: Implement TreeView Drag Support

Status: done

## Story

As a developer,
I want to drag a trace item from the sidebar TreeView,
So that I can quickly transfer trace data to other applications.

## Acceptance Criteria

1. **Given** I have traces displayed in the Mastra Traces sidebar
   **When** I click and hold on a trace item
   **Then** A visual drag indicator appears
   **And** The cursor changes to indicate dragging is active
   **And** The trace item visual feedback shows it is being dragged

2. **Given** TraceListProvider is implemented
   **When** I implement TreeDragAndDropController interface
   **Then** handleDrag method is called when drag starts
   **And** DataTransfer object is populated with trace data
   **And** dragMimeTypes include 'application/json' and 'text/plain'

3. **Given** A trace item is being dragged
   **When** The drag starts
   **Then** Full trace JSON is serialized and attached to DataTransfer
   **And** JSON is formatted for readability (pretty-printed)
   **And** Performance remains acceptable for typical trace sizes (50-200 spans)

4. **Given** Drag is in progress
   **When** I move the cursor over valid drop targets
   **Then** Visual feedback indicates drop is possible
   **And** Extension does not crash or freeze
   **And** Drag operation can be cancelled with ESC

5. **Given** Drag controller is implemented
   **When** I create unit tests for drag functionality
   **Then** Tests verify DataTransfer contains valid JSON
   **And** Tests verify mime types are correctly set
   **And** All drag tests pass

## Tasks / Subtasks

- [x] Task 1: Implement TreeDragAndDropController interface (AC: #2)
  - [x] Create TraceDragController class implementing vscode.TreeDragAndDropController<TraceTreeItem>
  - [x] Define dragMimeTypes: ['application/json', 'text/plain']
  - [x] Implement handleDrag method with DataTransfer population
  - [x] Return undefined for handleDrop (drag-only, no drop into tree)

- [x] Task 2: Register drag controller with TreeView (AC: #1, #2)
  - [x] Update extension.ts to create TraceDragController instance
  - [x] Pass dragAndDropController option to registerTreeDataProvider or createTreeView
  - [x] Ensure controller receives correct TraceListProvider reference

- [x] Task 3: Implement trace serialization for DataTransfer (AC: #3)
  - [x] Fetch full trace if needed (may only have metadata in tree item)
  - [x] Serialize trace to pretty-printed JSON (JSON.stringify with 2-space indent)
  - [x] Set application/json mime type with JSON data
  - [x] Set text/plain mime type with formatted JSON for text editors
  - [x] Handle serialization errors gracefully

- [x] Task 4: Optimize for large traces (AC: #3, #4)
  - [x] Test with trace.json fixture (realistic span count)
  - [x] Ensure serialization completes without blocking UI
  - [x] Consider async serialization if needed for very large traces
  - [x] Verify no memory issues during drag operations

- [x] Task 5: Handle drag cancellation and error states (AC: #4)
  - [x] Verify ESC cancels drag operation (VSCode default)
  - [x] Handle case where trace fetch fails during drag
  - [x] Log errors to output channel without crashing
  - [x] Graceful fallback if DataTransfer fails

- [x] Task 6: Unit tests for drag functionality (AC: #5)
  - [x] Test TraceDragController.handleDrag populates DataTransfer
  - [x] Test JSON serialization is valid and pretty-printed
  - [x] Test mime types are correctly set
  - [x] Test drag with empty/undefined trace handles gracefully
  - [x] Verify npm run test:unit passes

## Dev Notes

### Critical Architecture Requirements

**From Architecture Document:**
- VSCode TreeDragAndDropController is the standard pattern for drag operations
- DataTransfer uses MIME types for data format negotiation
- Extension lifecycle must properly clean up drag controller

**FR5 (Drag & Drop Export) Requirements:**
- Drag traces from sidebar TreeView with visual drag indicator
- Full JSON trace data attached to drag operation
- Support for Copilot chat drop target (Story 6.2)
- Support for text editor drop targets (Story 6.3)

### VSCode TreeDragAndDropController API

The `TreeDragAndDropController<T>` interface has two main methods:

```typescript
interface TreeDragAndDropController<T> {
  readonly dropMimeTypes: readonly string[];
  readonly dragMimeTypes: readonly string[];
  handleDrag?(source: readonly T[], dataTransfer: DataTransfer, token: CancellationToken): void | Thenable<void>;
  handleDrop?(target: T | undefined, dataTransfer: DataTransfer, token: CancellationToken): void | Thenable<void>;
}
```

For Story 6.1, we only implement `handleDrag` (drag-only). `handleDrop` returns undefined since we don't support dropping into the trace list.

### MIME Types Strategy

| MIME Type | Purpose | Consumer |
|-----------|---------|----------|
| `application/json` | Structured data | Copilot chat (Story 6.2) |
| `text/plain` | Plain text paste | Text editors (Story 6.3) |

### Existing Code Patterns

**TraceListProvider (src/providers/TraceListProvider.ts):**
- Already has TraceTreeItem with trace?: Trace property
- getTraceFromCache(id) for quick cache lookup
- fetchFullTrace(traceId) for complete trace with all spans
- Uses TraceCache for LRU caching

**TraceTreeItem:**
```typescript
export class TraceTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly trace?: Trace,
    public readonly span?: Span,
    public readonly isLoadMore?: boolean
  ) { ... }
}
```

### Implementation Details

**TraceDragController Class:**
```typescript
import * as vscode from 'vscode';
import { TraceTreeItem } from './TraceListProvider';
import type { TraceListProvider } from './TraceListProvider';

export class TraceDragController implements vscode.TreeDragAndDropController<TraceTreeItem> {
  readonly dropMimeTypes: readonly string[] = [];
  readonly dragMimeTypes: readonly string[] = ['application/json', 'text/plain'];

  constructor(private traceListProvider: TraceListProvider) {}

  async handleDrag(
    source: readonly TraceTreeItem[],
    dataTransfer: vscode.DataTransfer,
    token: vscode.CancellationToken
  ): Promise<void> {
    // Only handle trace items (not spans or load-more)
    const traceItems = source.filter(item => item.trace && !item.span && !item.isLoadMore);
    if (traceItems.length === 0) return;

    // For MVP, handle single trace drag
    const item = traceItems[0];
    const traceId = item.trace!.traceId;

    // Get full trace (from cache or fetch)
    let fullTrace = this.traceListProvider.getTraceFromCache(traceId);
    if (!fullTrace || (fullTrace.spans?.length || 0) <= 1) {
      fullTrace = await this.traceListProvider.fetchFullTrace(traceId);
    }

    if (!fullTrace || token.isCancellationRequested) return;

    // Serialize trace to JSON
    const jsonString = JSON.stringify(fullTrace, null, 2);

    // Set data for both mime types
    dataTransfer.set('application/json', new vscode.DataTransferItem(jsonString));
    dataTransfer.set('text/plain', new vscode.DataTransferItem(jsonString));
  }

  handleDrop(): void | Thenable<void> {
    // No drop support into tree
    return undefined;
  }
}
```

**Extension Registration:**
```typescript
// In extension.ts activate()
const traceListProvider = new TraceListProvider(apiClient);
const dragController = new TraceDragController(traceListProvider);

const treeView = vscode.window.createTreeView('mastraTraceList', {
  treeDataProvider: traceListProvider,
  dragAndDropController: dragController,
  canSelectMany: false
});

context.subscriptions.push(treeView);
```

### Project Structure Notes

**Files to Create:**
- [src/providers/TraceDragController.ts](src/providers/TraceDragController.ts) - TreeDragAndDropController implementation
- [src/providers/TraceDragController.test.ts](src/providers/TraceDragController.test.ts) - Unit tests

**Files to Modify:**
- [src/extension.ts](src/extension.ts) - Register drag controller with tree view
- [src/providers/TraceListProvider.ts](src/providers/TraceListProvider.ts) - No changes needed, already has required methods

### Testing Strategy

**Unit Tests (TraceDragController.test.ts):**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TraceDragController } from './TraceDragController';
import { TraceTreeItem } from './TraceListProvider';

describe('TraceDragController', () => {
  it('should define correct dragMimeTypes', () => {
    const controller = new TraceDragController(mockProvider);
    expect(controller.dragMimeTypes).toContain('application/json');
    expect(controller.dragMimeTypes).toContain('text/plain');
  });

  it('should define empty dropMimeTypes', () => {
    const controller = new TraceDragController(mockProvider);
    expect(controller.dropMimeTypes).toEqual([]);
  });

  it('should populate DataTransfer with JSON on drag', async () => {
    // Create mock trace item and DataTransfer
    // Call handleDrag
    // Verify DataTransfer.set called with correct data
  });

  it('should skip non-trace items', async () => {
    // Test with span items and load-more items
    // Verify DataTransfer is not populated
  });

  it('should handle missing trace gracefully', async () => {
    // Test with trace fetch failure
    // Verify no exception thrown
  });
});
```

### Performance Considerations

- Trace serialization is O(n) for span count - acceptable for 50-500 spans
- Cache lookup is O(1) - fast path when trace is cached
- Full fetch is async - doesn't block UI
- CancellationToken checked before serialization - respects ESC cancel
- JSON.stringify with indent adds ~15% overhead vs compact - acceptable for DX

### Edge Cases to Handle

- Empty trace (no spans) → serialize minimal JSON
- Trace with null/undefined fields → JSON.stringify handles gracefully
- Very large trace (1000+ spans) → still serialize, may be slow but functional
- Multi-select drag → MVP handles only first trace
- Drag span item (not trace) → ignore, don't attach data
- Drag "Load More" item → ignore
- Network error during fetch → silently fail, don't populate DataTransfer

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1] - Full acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md] - Extension patterns
- [Source: src/providers/TraceListProvider.ts] - Existing trace provider implementation
- [Source: src/models/trace.types.ts] - Trace and Span type definitions
- [VSCode API: TreeDragAndDropController](https://code.visualstudio.com/api/references/vscode-api#TreeDragAndDropController)
- [VSCode API: DataTransfer](https://code.visualstudio.com/api/references/vscode-api#DataTransfer)

### Previous Story Intelligence

**From Epic 5 Stories (Search Implementation):**
- TraceListProvider.getTraceFromCache() and fetchFullTrace() are reliable
- Async operations should always check cancellation token
- Error handling should be silent for non-critical failures

**From Story 4.2 (Multiple Trace Tabs Management):**
- Trace objects are large - serialize thoughtfully
- Cache hits are common - optimize for cached case first

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A

### Completion Notes List

- ✅ Created TraceDragController implementing vscode.TreeDragAndDropController<TraceTreeItem>
- ✅ Registered drag controller with TreeView in extension.ts using dragAndDropController option
- ✅ Implemented handleDrag with cache lookup and async full trace fetch fallback
- ✅ Serialization uses JSON.stringify(fullTrace, null, 2) for pretty-printed output
- ✅ Both 'application/json' and 'text/plain' MIME types populated
- ✅ CancellationToken checked before/after async operations
- ✅ Errors silently caught to prevent drag operation crashes
- ✅ 14 unit tests written covering all AC requirements
- ✅ All 314 project tests pass
- ✅ Build compiles successfully

### File List

**Created:**
- src/providers/TraceDragController.ts
- src/providers/TraceDragController.test.ts

**Modified:**
- src/extension.ts (added import and drag controller registration)

