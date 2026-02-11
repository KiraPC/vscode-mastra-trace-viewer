# Story 5.1: Client-Side Search Implementation

Status: review

## Story

As a developer,
I want to search for text within a trace,
So that I can find specific spans or data quickly.

## Acceptance Criteria

1. **Given** A trace is open in the webview
   **When** I create src/webview/components/TraceSearch.svelte
   **Then** A search input box appears at the top of the trace viewer
   **And** Search box has placeholder text "Search spans..."
   **And** Search box is styled consistently with VSCode UI

2. **Given** Search component exists
   **When** I create src/webview/utils/searchHelper.ts
   **Then** searchHelper provides searchSpans(query, spans) function
   **And** searchSpans performs case-insensitive full-text search
   **And** Search examines: span name, type, input, output, attributes

3. **Given** Search helper is implemented
   **When** I type in the search box
   **Then** Search is debounced with 300ms delay
   **And** Search doesn't execute on every keystroke
   **And** Previous search requests are cancelled if new input arrives

4. **Given** I enter a search query
   **When** searchSpans executes
   **Then** Function returns array of matching spanIds
   **And** Function completes in under 100ms for traces with 500 spans
   **And** Empty query returns empty results (no matches)

5. **Given** Search results are found
   **When** I create src/webview/stores/searchStore.ts
   **Then** searchStore holds: query (string), results (spanId[]), currentIndex (number)
   **And** searchStore is reactive and updates components automatically
   **And** searchStore provides helper functions: hasResults(), getResultCount()

6. **Given** Search examines span data
   **When** A span's name contains the query → The span is included in results
   **When** A span's input JSON contains the query → The span is included in results
   **When** A span's output JSON contains the query → The span is included in results  
   **When** A span's attributes contain the query → The span is included in results

7. **Given** Search query is complex
   **When** Query includes special characters or spaces
   **Then** Special characters are escaped properly
   **And** Spaces are treated as part of the search term
   **And** No regex errors occur

## Tasks / Subtasks

- [x] Task 1: Create searchStore.ts (AC: #5)
  - [x] Create src/webview/stores/searchStore.ts
  - [x] Implement writable stores: query, results, currentIndex
  - [x] Add helper functions: hasResults(), getResultCount(), setQuery(), setResults(), clearSearch()
  - [x] Add nextResult(), prevResult() for navigation prep (story 5.3)
  - [x] Create searchStore.test.ts with unit tests

- [x] Task 2: Create searchHelper.ts (AC: #2, #4, #6, #7)
  - [x] Create src/webview/utils/searchHelper.ts
  - [x] Implement searchSpans(query: string, spans: Span[]): string[]
  - [x] Handle case-insensitive matching
  - [x] Search span fields: name, spanType, input, output, attributes
  - [x] Escape special regex characters in query
  - [x] Handle complex objects (JSON.stringify for deep search)
  - [x] Create searchHelper.test.ts with tests for edge cases

- [x] Task 3: Create TraceSearch.svelte component (AC: #1, #3)
  - [x] Create src/webview/components/TraceSearch.svelte
  - [x] Add search input with placeholder "Search spans..."
  - [x] Style with VSCode CSS variables for theme consistency
  - [x] Implement 300ms debounce on input
  - [x] Connect to searchStore for reactive updates
  - [x] Show result count when results exist

- [x] Task 4: Integrate TraceSearch into App.svelte
  - [x] Import TraceSearch component in App.svelte
  - [x] Place TraceSearch above TraceToolbar
  - [x] Pass tree/spans data to TraceSearch for search execution
  - [x] Ensure search clears on trace change

- [x] Task 5: Unit tests and integration verification
  - [x] Verify all unit tests pass (npm run test:unit)
  - [x] Verify no lint/compile errors (npm run compile)
  - [x] Manual test with trace.json fixture

## Dev Notes

### Critical Architecture Requirements

**From Architecture Document:**
- **Decision 4.2 - Search Implementation**: "Client-side full-text search with 300ms debouncing. In-memory search across all span properties is instant for MVP trace sizes."
- **Performance Requirement NFR1**: "Search operations must be fast and responsive"
- **State Management Pattern**: Use Svelte stores (writable from svelte/store)
- **Component Structure**: All components in src/webview/components/, stores in src/webview/stores/, utils in src/webview/utils/

**From PRD:**
- FR3: "Search functionality within trace tree"
- "The time from 'run agent' to 'understand behavior' should be minimized"

### Existing Patterns to Follow

**Store Pattern (from uiStore.ts):**
```typescript
import { writable, get } from 'svelte/store';

export const storeValue = writable<Type>(initialValue);

export function helperFunction(): void {
  storeValue.update(current => /* transform */);
}
```

**Component Pattern (from TraceToolbar.svelte):**
```svelte
<script lang="ts">
  interface Props {
    propName: PropType;
  }
  
  let { propName }: Props = $props();
</script>

<div class="component-name">
  <!-- content -->
</div>

<style>
  .component-name {
    /* VSCode CSS variables */
  }
</style>
```

**Test Pattern (from existing .test.ts files):**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ModuleName', () => {
  beforeEach(() => {
    // reset state
  });

  it('should do expected behavior', () => {
    expect(result).toBe(expected);
  });
});
```

### Project Structure Notes

**Files to Create:**
- [src/webview/stores/searchStore.ts](src/webview/stores/searchStore.ts) - Search state management
- [src/webview/stores/searchStore.test.ts](src/webview/stores/searchStore.test.ts) - Store tests
- [src/webview/utils/searchHelper.ts](src/webview/utils/searchHelper.ts) - Search logic
- [src/webview/utils/searchHelper.test.ts](src/webview/utils/searchHelper.test.ts) - Helper tests
- [src/webview/components/TraceSearch.svelte](src/webview/components/TraceSearch.svelte) - UI component

**Files to Modify:**
- [src/webview/App.svelte](src/webview/App.svelte) - Import and integrate TraceSearch

**Existing Files for Reference:**
- [src/webview/stores/uiStore.ts](src/webview/stores/uiStore.ts) - Store patterns
- [src/webview/components/TraceToolbar.svelte](src/webview/components/TraceToolbar.svelte) - Component/styling patterns
- [src/models/trace.types.ts](src/models/trace.types.ts) - Span interface definition

### Technical Implementation Details

**Span Interface Fields to Search (from trace.types.ts):**
```typescript
interface Span {
  name: string;
  spanType: string;
  input?: unknown;   // JSON.stringify for search
  output?: unknown;  // JSON.stringify for search
  attributes?: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  error?: unknown;
  // ... other fields
}
```

**searchHelper.ts Implementation Approach:**
```typescript
export function searchSpans(query: string, spans: Span[]): string[] {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  const results: string[] = [];
  
  for (const span of spans) {
    if (spanMatchesQuery(span, lowerQuery)) {
      results.push(span.spanId);
    }
  }
  
  return results;
}

function spanMatchesQuery(span: Span, query: string): boolean {
  // Check name
  if (span.name?.toLowerCase().includes(query)) return true;
  
  // Check spanType
  if (span.spanType?.toLowerCase().includes(query)) return true;
  
  // Check input (stringify if object)
  if (span.input && stringifyAndSearch(span.input, query)) return true;
  
  // Check output
  if (span.output && stringifyAndSearch(span.output, query)) return true;
  
  // Check attributes
  if (span.attributes && stringifyAndSearch(span.attributes, query)) return true;
  
  return false;
}

function stringifyAndSearch(value: unknown, query: string): boolean {
  try {
    return JSON.stringify(value).toLowerCase().includes(query);
  } catch {
    return false;
  }
}
```

**Debounce Implementation (300ms):**
```typescript
let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
  
  debounceTimeout = setTimeout(() => {
    // Execute search
    const results = searchSpans(value, spans);
    setResults(results);
    setQuery(value);
  }, 300);
}
```

**VSCode Styling Variables to Use:**
- `--vscode-input-background` - Input background
- `--vscode-input-foreground` - Input text color
- `--vscode-input-border` - Input border
- `--vscode-input-placeholderForeground` - Placeholder color
- `--vscode-focusBorder` - Focus ring color
- `--vscode-badge-background` - Result count badge background
- `--vscode-badge-foreground` - Result count badge text

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1] - Full acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 4.2] - Search implementation decision
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] - Naming conventions
- [Source: src/webview/stores/uiStore.ts] - Store patterns to follow
- [Source: src/webview/components/TraceToolbar.svelte] - Component styling patterns
- [Source: src/models/trace.types.ts] - Span interface definition

### Previous Story Intelligence

**From Story 4.3 (Tab State Preservation):**
- State persistence pattern using stores
- Debounce pattern used for scroll tracking (100ms) - search uses 300ms
- State restoration via message passing for webview reload
- retainContextWhenHidden: true preserves state between tabs

**Patterns Established:**
- Store functions for state updates (e.g., setScrollPosition, restoreState)
- Test files co-located with implementation
- VSCode CSS variables for theming
- Props interface pattern with $props() in Svelte 5

### Performance Considerations

- 300ms debounce prevents excessive re-renders during typing
- JSON.stringify called only when searching complex objects
- Results stored as spanId[] to minimize memory footprint
- Search function should complete in <100ms for 500 spans (O(n) complexity is acceptable)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

### Completion Notes List

- Task 1: Created searchStore.ts with writable stores (query, results, currentIndex) and helper functions (hasResults, getResultCount, setQuery, setResults, clearSearch, nextResult, prevResult, getCurrentResultSpanId). 25 unit tests pass.
- Task 2: Created searchHelper.ts implementing searchSpans() with case-insensitive full-text search across span name, spanType, input, output, and attributes. Handles JSON.stringify for deep object search. Includes escapeRegexChars utility. 26 unit tests pass including performance test (<100ms for 500 spans).
- Task 3: Created TraceSearch.svelte component with search input, 300ms debounce, VSCode CSS variable styling, result count badge, and clear button. Connected to searchStore for reactive updates.
- Task 4: Integrated TraceSearch into App.svelte above TraceToolbar, passing spans data for search. Component clears search on trace change via $effect.
- Task 5: All 296 unit tests pass. Compile succeeds with no errors.

### File List

**Created:**
- src/webview/stores/searchStore.ts
- src/webview/stores/searchStore.test.ts
- src/webview/utils/searchHelper.ts
- src/webview/utils/searchHelper.test.ts
- src/webview/components/TraceSearch.svelte

**Modified:**
- src/webview/App.svelte

