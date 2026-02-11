# Story 2.2: Fetch and Display Trace List

Status: done

## Story

As a developer,
I want to see the list of available traces from my Mastra instance,
So that I know what traces are available to analyze.

## Acceptance Criteria

**Given** The Mastra Traces view is visible
**When** I click the refresh button in the view toolbar
**Then** The extension calls MastraClientWrapper.fetchTraces()
**And** A loading indicator appears while fetching

**Given** The Mastra client is connected
**When** fetchTraces() successfully retrieves trace data
**Then** Each trace is transformed into a TraceTreeItem
**And** TraceTreeItem contains: id, label (traceId), timestamp, iconPath
**And** The tree view displays all traces in reverse chronological order (newest first)

**Given** Traces are displayed
**When** I look at the trace list
**Then** Each trace item shows the traceId as the label
**And** The timestamp is formatted in a human-readable way (e.g., "2 hours ago", "Jan 10, 3:45 PM")
**And** Each trace has an appropriate icon indicating its status

**Given** The fetch request fails
**When** MastraClientWrapper.fetchTraces() throws a connection error
**Then** An error notification displays: "Failed to fetch traces: [error message]"
**And** The tree view shows an empty state with "Failed to load. Click refresh to retry."
**And** The error is logged to the output channel

**Given** No traces exist
**When** fetchTraces() returns an empty array
**Then** The tree view displays message "No traces found. Run your Mastra agents to generate traces."
**And** No error is shown (this is a valid state)

## Tasks / Subtasks

- [x] Implement trace fetching in TraceListProvider (AC: 1, 2)
  - [x] Add refresh() method that calls apiClient.fetchTraces()
  - [x] Pass pagination parameters (page, perPage)
  - [x] Store returned traces in internal array
  - [x] Store pagination info for "load more" functionality
  - [x] Fire _onDidChangeTreeData to trigger UI update

- [x] Handle loading state (AC: 1)
  - [x] Add isLoading flag to TraceListProvider
  - [x] Set isLoading=true before fetch starts
  - [x] Return "Loading..." tree item when isLoading
  - [x] Set isLoading=false after fetch completes (success or error)

- [x] Transform traces to tree items (AC: 2, 3)
  - [x] In getChildren() at root level, map traces to TraceTreeItem
  - [x] Use root span name as label, fallback to traceId
  - [x] Set collapsibleState based on span count
  - [x] Add span count in description (e.g., "3 spans")
  - [x] Configure appropriate pulse icon for traces

- [x] Handle child spans (AC: 2)
  - [x] When getChildren(element) has element.trace
  - [x] Return spans from trace.spans array
  - [x] Create TraceTreeItem for each span
  - [x] Show span name as label
  - [x] Show span status in description
  - [x] Use span-type-specific icons (hubot, comment-discussion, tools)

- [x] Implement "Load More" functionality (AC: 2)
  - [x] Check pagination.hasMore flag
  - [x] Add "Load More" item at end of trace list
  - [x] Show current count and total (e.g., "50 of 150")
  - [x] Register loadMore command in extension.ts
  - [x] Implement loadMore() method in provider
  - [x] Append new traces to existing array

- [x] Handle error states (AC: 4)
  - [x] Wrap fetch in try-catch block
  - [x] On error, clear traces array
  - [x] Reset pagination info
  - [x] Let ConnectionStateManager handle error display
  - [x] Fire tree data change to show empty state

- [x] Handle empty state (AC: 5)
  - [x] Check if traces array is empty after fetch
  - [x] Return "No traces found" tree item
  - [x] Use appropriate styling (non-collapsible)

## Dev Notes

### Implementation Details

**Fetch Flow:**
1. User clicks refresh or extension activates
2. TraceListProvider.refresh() called
3. isLoading set to true, tree fires update
4. apiClient.fetchTraces() called with pagination
5. Response stored in traces array and pagination info
6. isLoading set to false, tree fires update
7. getChildren() returns TraceTreeItem array

**Pagination Support:**
- Default page size: 50 traces
- currentPage tracked for "load more"
- loadMore() appends to existing traces array
- isLoadingMore flag prevents duplicate requests
- "Load More" item shows progress (e.g., "50 of 150")

**Error Handling Strategy:**
- API errors caught in refresh()/loadMore()
- ConnectionStateManager handles user notifications
- Tree view shows empty state gracefully
- loadMore errors revert currentPage counter

**Tree Item Structure:**
```typescript
// Trace level
new TraceTreeItem(
  rootSpanName || traceId,
  hasSpans ? Collapsed : None,
  trace
)

// Span level
new TraceTreeItem(
  span.name,
  None,
  trace,
  span
)

// Load More
new TraceTreeItem(
  "Load more (50 of 150)",
  None,
  undefined,
  undefined,
  true // isLoadMore
)
```

### Key Files Modified

- `src/providers/TraceListProvider.ts` - Fetch and display logic
- `src/extension.ts` - loadMore command registration

### Testing Notes

- Verified trace list populates after refresh
- Pagination "Load More" works correctly
- Empty state displays when no traces
- Loading indicator shows during fetch
- Span expansion displays child items
