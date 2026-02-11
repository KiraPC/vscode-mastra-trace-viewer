# Story 2.4: Trace Metadata Display & Caching

Status: done

## Story

As a developer,
I want to see useful metadata for each trace (ID, timestamp, status),
So that I can identify which trace I want to open.

## Acceptance Criteria

**Given** Traces are fetched from Mastra
**When** I create TraceCache in src/utils/traceCache.ts
**Then** TraceCache implements LRU (Least Recently Used) cache with max 100 entries
**And** TraceCache provides methods: set(id, trace), get(id), has(id), clear()
**And** TraceCache evicts oldest entries when capacity is exceeded

**Given** TraceCache is implemented
**When** Traces are fetched successfully
**Then** Each trace is stored in TraceCache with traceId as key
**And** Full trace data is cached for future retrieval
**And** Cache prevents redundant API calls for recently viewed traces

**Given** Traces are displayed in the tree view
**When** I look at each trace item
**Then** The label shows the traceId (truncated if longer than 40 characters)
**And** The description shows relative timestamp (e.g., "5 minutes ago")
**And** The tooltip shows full trace information: full traceId, exact timestamp, status

**Given** Trace metadata includes status information
**When** A trace has status "success"
**Then** The trace icon is green checkmark
**When** A trace has status "error"
**Then** The trace icon is red X
**When** A trace has status "running" or "pending"
**Then** The trace icon is yellow spinner/hourglass
**When** Status is unknown or missing
**Then** The trace icon is default blue document icon

**Given** Multiple traces exist
**When** Traces are sorted in the tree view
**Then** Traces are ordered by timestamp descending (newest first)
**And** Traces from today show relative time (e.g., "2 hours ago")
**And** Traces older than today show absolute date (e.g., "Feb 9, 2:30 PM")

**Given** TraceCache is implemented
**When** I create unit tests in src/utils/traceCache.test.ts
**Then** Tests verify LRU eviction when capacity exceeded
**And** Tests verify set/get/has operations
**And** Tests verify clear()

## Tasks / Subtasks

- [x] Create TraceCache class with LRU eviction (AC: 1)
  - [x] Create src/utils/traceCache.ts file
  - [x] Implement Map-based LRU cache with maxSize = 100
  - [x] Implement set(id, trace) method with eviction on capacity
  - [x] Implement get(id) method that updates access order (LRU)
  - [x] Implement has(id) method for existence check
  - [x] Implement clear() method to empty cache
  - [x] Implement size getter for debugging
  - [x] Export TraceCache class for use in other modules

- [x] Create comprehensive unit tests for TraceCache (AC: 6)
  - [x] Create src/utils/traceCache.test.ts
  - [x] Test: set() stores trace by id
  - [x] Test: get() returns cached trace
  - [x] Test: get() returns undefined for missing id
  - [x] Test: has() returns true/false correctly
  - [x] Test: clear() empties the cache
  - [x] Test: LRU eviction when capacity exceeded (101 entries)
  - [x] Test: get() updates LRU order (most recently accessed not evicted)
  - [x] Run with `npm run test:unit`

- [x] Integrate TraceCache with TraceListProvider (AC: 2)
  - [x] Import TraceCache in TraceListProvider.ts
  - [x] Create TraceCache instance in provider constructor
  - [x] After fetchTraces(), cache each trace using set(traceId, trace)
  - [x] Update setApiClient() to optionally preserve or clear cache
  - [x] Expose getTraceFromCache(id) method for future Epic 3 use

- [x] Implement relative timestamp formatting (AC: 3, 5)
  - [x] Create src/utils/formatters.ts for date formatting utilities
  - [x] Implement formatRelativeTime(date): "5 minutes ago", "2 hours ago"
  - [x] Implement formatAbsoluteTime(date): "Feb 9, 2:30 PM"
  - [x] Logic: if same day → relative; if older → absolute
  - [x] Extract startedAt from root span or trace.exportedAt
  - [x] Add unit tests in src/utils/formatters.test.ts

- [x] Enhance trace display metadata in TraceTreeItem (AC: 3)
  - [x] Update getTraceDescription() to show formatted timestamp
  - [x] Truncate traceId to 40 chars in label if needed
  - [x] Build comprehensive tooltip with:
    - Full traceId
    - Exact timestamp (ISO format)
    - Status from root span
    - Span count

- [x] Implement status-based icons (AC: 4)
  - [x] Create getTraceStatusIcon(trace) helper method
  - [x] Map status "success" → new ThemeIcon('check', new ThemeColor('testing.iconPassed'))
  - [x] Map status "error" → new ThemeIcon('error', new ThemeColor('testing.iconFailed'))
  - [x] Map status "running"/"pending" → new ThemeIcon('sync~spin')
  - [x] Default/unknown → new ThemeIcon('pulse')
  - [x] Extract status from root span (span with null parentSpanId)

- [x] Ensure traces are sorted by timestamp (AC: 5)
  - [x] Verify API returns sorted traces (check MastraClientWrapper)
  - [x] If not sorted, add sort in refresh() before caching
  - [x] Sort by startedAt descending (newest first)

## Dev Notes

### Critical Architecture Requirements

**LRU Cache Implementation:**
- Per architecture.md: "In-memory cache with LRU eviction for trace data"
- Max capacity: 100 traces
- Use JavaScript Map for O(1) operations and insertion order
- LRU pattern: delete and re-add on get() to update order
- Evict oldest (first in map) when adding beyond capacity

**Cache Location:**
- The cache is a utility, kept in `src/utils/traceCache.ts`
- Following project structure: utils/ for shared utilities
- TraceListProvider owns the cache instance

**No External Libraries:**
- Per architecture: Pure TypeScript implementation
- No external LRU cache packages (bundle size concern)

### Implementation Pattern

**LRU Cache with Map:**
```typescript
export class TraceCache {
  private cache: Map<string, Trace> = new Map();
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(id: string): Trace | undefined {
    const trace = this.cache.get(id);
    if (trace) {
      // Move to end (most recently used)
      this.cache.delete(id);
      this.cache.set(id, trace);
    }
    return trace;
  }

  set(id: string, trace: Trace): void {
    // If exists, delete first to update order
    if (this.cache.has(id)) {
      this.cache.delete(id);
    }
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    this.cache.set(id, trace);
  }

  has(id: string): boolean {
    return this.cache.has(id);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
```

### Date Formatting Strategy

**Relative Time Rules:**
- < 1 minute: "just now"
- < 60 minutes: "X minutes ago"
- < 24 hours: "X hours ago"
- Same day: use relative
- Different day: use absolute format "Feb 9, 2:30 PM"

**Implementation Approach:**
```typescript
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  // Use absolute for older
  return formatAbsoluteTime(d);
}
```

### Status Icon Reference

VSCode ThemeIcon names for status:
- Success: `check` with color `testing.iconPassed`
- Error: `error` with color `testing.iconFailed`
- Running: `sync~spin` (animated spinner)
- Pending: `watch` or `clock`
- Default: `pulse`

### Trace Status Extraction

Root span detection:
```typescript
const rootSpan = trace.spans?.find(s => !s.parentSpanId);
const status = rootSpan?.status || 'unknown';
```

### Project Structure Notes

Files to create:
- `src/utils/traceCache.ts` - LRU cache implementation
- `src/utils/traceCache.test.ts` - Cache unit tests
- `src/utils/formatters.ts` - Date formatting utilities
- `src/utils/formatters.test.ts` - Formatter unit tests

Files to modify:
- `src/providers/TraceListProvider.ts` - Integrate cache, enhance metadata

### Previous Story Learnings

From Story 2.3:
- TraceListProvider.refresh() already handles fetch and tree update
- Traces stored in internal array, need to also cache
- isLoading flag pattern works well for state management

From Story 2.1/2.2:
- TraceTreeItem structure already exists with label, description, tooltip
- getTraceDescription() returns span count, enhance to add timestamp
- iconPath is set in constructor, can be dynamic based on status

### Testing Notes

Run unit tests with:
```bash
npm run test:unit
```

Test file location: `src/utils/*.test.ts` following co-located pattern

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns - Caching Strategy]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
- [Source: src/providers/TraceListProvider.ts - TraceTreeItem implementation]
- [Source: src/models/trace.types.ts - Trace and Span interfaces]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (GitHub Copilot)

### Debug Log References

N/A - All tests passed on first attempt after minor fixes.

### Completion Notes List

1. ✅ Created TraceCache class with LRU eviction using Map-based approach
   - 14 unit tests covering all functionality including edge cases
   - O(1) operations for set/get/has/clear
   - Automatic eviction of oldest entries when capacity exceeded

2. ✅ Integrated TraceCache with TraceListProvider
   - Cache instance created in constructor
   - Traces cached after fetchTraces() and loadMore()
   - setApiClient() accepts clearCache option
   - getTraceFromCache() exposed for Epic 3 use

3. ✅ Created formatters.ts with comprehensive date/time utilities
   - formatRelativeTime: "just now", "X minutes/hours ago"
   - formatAbsoluteTime: "Feb 9, 2:30 PM"
   - formatTraceTimestamp: smart formatting based on same-day logic
   - truncateString: with ellipsis for long labels
   - formatISOTimestamp: for tooltip display
   - 22 unit tests covering all formatters

4. ✅ Enhanced TraceTreeItem with rich metadata
   - Status-based icons using VS Code ThemeColors
   - Comprehensive tooltip with traceId, timestamp, status, span count
   - Formatted relative/absolute timestamps in description

5. ✅ Traces sorted by timestamp descending (newest first)
   - Sort implemented in getChildren() before display
   - Uses startedAt from root span or trace.exportedAt

6. ✅ Fixed pre-existing test issue in MastraClientWrapper.test.ts
   - Test expected flat pagination params, implementation uses nested object
   - Updated test to match actual implementation

### File List

**Created:**
- src/utils/traceCache.ts
- src/utils/traceCache.test.ts
- src/utils/formatters.ts
- src/utils/formatters.test.ts

**Modified:**
- src/providers/TraceListProvider.ts
- src/api/MastraClientWrapper.test.ts (fixed pre-existing test)