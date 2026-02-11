# Story 5.3: Navigate Through Search Results

Status: review

## Story

As a developer,
I want to navigate between search matches with prev/next buttons,
So that I can review all matches systematically.

## Acceptance Criteria

1. **Given** Search results exist
   **When** TraceSearch component renders
   **Then** Result count is displayed (e.g., "5 of 42 matches")
   **And** Previous button (↑) and Next button (↓) are visible
   **And** Buttons are positioned next to the search input

2. **Given** Search results exist
   **When** I click the Next button
   **Then** searchStore.currentIndex increments
   **And** The next matching span is focused and scrolled into view
   **And** Current match has distinct styling (e.g., orange vs yellow for other matches)

3. **Given** I'm on the last search result
   **When** I click the Next button
   **Then** Navigation wraps to the first result
   **And** searchStore.currentIndex resets to 0
   **And** User feedback indicates wrap (e.g., brief message "Wrapped to first result")

4. **Given** Search results exist
   **When** I click the Previous button
   **Then** searchStore.currentIndex decrements
   **And** The previous matching span is focused and scrolled into view
   **And** Current match is highlighted distinctly

5. **Given** I'm on the first search result
   **When** I click the Previous button
   **Then** Navigation wraps to the last result
   **And** searchStore.currentIndex sets to results.length - 1
   **And** User feedback indicates wrap

6. **Given** Current match is in a collapsed section
   **When** Navigation moves to that match
   **Then** Parent spans are automatically expanded to reveal the match
   **And** Match is scrolled into view
   **And** Expanded spans remain expanded after navigation

7. **Given** Keyboard shortcuts are expected
   **When** I press Enter in the search box → Navigation moves to next match
   **When** I press Shift+Enter → Navigation moves to previous match
   **And** Focus remains in search box for continued typing

8. **Given** No search results exist
   **When** TraceSearch component renders empty results
   **Then** Result count shows "0 matches"
   **And** Previous and Next buttons are disabled
   **And** Message displays "No results found" below search box

9. **Given** Search query is active
   **When** I press Escape key
   **Then** Search query is cleared
   **And** Focus returns to the trace tree
   **And** All highlights are removed

10. **Given** Navigation is working
    **When** I navigate through results multiple times
    **Then** Performance remains smooth (no lag)
    **And** Virtual scrolling handles scroll-to-match efficiently
    **And** UI updates are instant and responsive

## Tasks / Subtasks

- [x] Task 1: Add navigation controls to TraceSearch.svelte (AC: #1, #8)
  - [x] Add result count display "X of Y matches" using searchStore
  - [x] Add Previous (↑) and Next (↓) buttons
  - [x] Disable buttons when no results
  - [x] Show "0 matches" when empty
  - [x] Show "No results found" message below input when query has no matches

- [x] Task 2: Implement next/prev navigation in searchStore (AC: #2, #3, #4, #5)
  - [x] Add nextResult() function with wrap-around
  - [x] Add prevResult() function with wrap-around
  - [x] Return boolean indicating if wrapped (for user feedback)
  - [x] Update currentIndex correctly

- [x] Task 3: Scroll to current match (AC: #2, #4, #6)
  - [x] Create scrollToSpan(spanId) utility function
  - [x] Calculate span index in flattened virtual list
  - [x] Use virtual list scrollTo API or scrollIntoView
  - [x] Handle case where span is not visible (collapsed)

- [x] Task 4: Auto-expand to reveal match (AC: #6)
  - [x] Use findPathToSpan() helper from App.svelte
  - [x] Expand all ancestors of target span
  - [x] Scroll after expansion is complete
  - [x] Preserve other expanded spans

- [x] Task 5: Implement keyboard shortcuts (AC: #7, #9)
  - [x] Add onkeydown handler to search input
  - [x] Enter → call nextResult() and scroll
  - [x] Shift+Enter → call prevResult() and scroll
  - [x] Escape → clearSearch() and return focus to tree

- [x] Task 6: Wrap-around feedback (AC: #3, #5)
  - [x] Show brief toast/message when navigation wraps
  - [x] Message auto-dismisses after 1.5 seconds
  - [x] Optional: use VSCode CSS for toast styling

- [x] Task 7: Integration and testing
  - [x] Verify all interactions work with virtual scrolling
  - [x] Test with trace.json fixture
  - [x] Verify npm run compile passes
  - [x] Verify npm run test:unit passes

## Dev Notes

### Critical Architecture Requirements

**From Architecture Document:**
- **Decision 4.2 - Search Implementation**: "Prev/Next navigation through results"
- **Performance**: Navigation must work efficiently with virtual scrolling
- **Virtual Scrolling**: svelte-virtual-list is used - must integrate scroll-to functionality

**Dependencies (from Story 5.1 and 5.2):**
- searchStore.ts with results[], currentIndex, nextResult(), prevResult()
- TraceSearch.svelte component with search input
- SpanNode.svelte with current-match highlighting

### Existing Patterns to Follow

**findPathToSpan() from App.svelte:**
```typescript
function findPathToSpan(
  nodes: SpanTreeNode[], 
  targetId: string, 
  path: string[] = []
): string[] | null {
  for (const node of nodes) {
    if (node.spanId === targetId) {
      return path;
    }
    if (node.children.length > 0) {
      const found = findPathToSpan(node.children, targetId, [...path, node.spanId]);
      if (found) return found;
    }
  }
  return null;
}
```

**expandAll() from uiStore.ts:**
```typescript
export function expandAll(spanIds: string[]): void {
  expandedSpans.set(new Set(spanIds));
}
```

### Project Structure Notes

**Files to Modify:**
- [src/webview/components/TraceSearch.svelte](src/webview/components/TraceSearch.svelte) - Add nav controls (from Story 5.1)
- [src/webview/stores/searchStore.ts](src/webview/stores/searchStore.ts) - Add navigation functions (from Story 5.1)
- [src/webview/App.svelte](src/webview/App.svelte) - Wire up scrollToSpan, expose findPathToSpan

**Files to Create:**
- [src/webview/utils/scrollHelper.ts](src/webview/utils/scrollHelper.ts) - Scroll-to-span utility (optional)

**Files to Reference:**
- [src/webview/components/SpanTree.svelte](src/webview/components/SpanTree.svelte) - Virtual list access
- [src/webview/utils/flattenTree.ts](src/webview/utils/flattenTree.ts) - FlatSpanItem structure

### Technical Implementation Details

**TraceSearch.svelte Navigation UI:**
```svelte
<div class="search-container">
  <input 
    type="text"
    class="search-input"
    placeholder="Search spans..."
    bind:value={query}
    oninput={handleInput}
    onkeydown={handleKeydown}
  />
  
  {#if $searchQuery}
    <div class="search-nav">
      <span class="result-count">
        {#if $searchResults.length > 0}
          {$currentIndex + 1} of {$searchResults.length}
        {:else}
          0 matches
        {/if}
      </span>
      <button 
        class="nav-btn"
        disabled={$searchResults.length === 0}
        onclick={handlePrev}
        title="Previous match (Shift+Enter)"
      >↑</button>
      <button 
        class="nav-btn"
        disabled={$searchResults.length === 0}
        onclick={handleNext}
        title="Next match (Enter)"
      >↓</button>
    </div>
  {/if}
</div>

{#if $searchQuery && $searchResults.length === 0}
  <div class="no-results">No results found</div>
{/if}
```

**Keyboard Handler:**
```typescript
function handleKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'Enter':
      event.preventDefault();
      if (event.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
      break;
    case 'Escape':
      event.preventDefault();
      clearSearch();
      // Return focus to tree
      document.querySelector('.span-tree')?.focus();
      break;
  }
}
```

**Scroll to Span Implementation:**
```typescript
async function scrollToCurrentMatch(): Promise<void> {
  const currentSpanId = get(searchResults)[get(currentIndex)];
  if (!currentSpanId) return;
  
  // 1. Expand path to span
  const path = findPathToSpan(spanTree, currentSpanId);
  if (path) {
    const currentExpanded = get(expandedSpans);
    const newExpanded = new Set([...currentExpanded, ...path]);
    expandedSpans.set(newExpanded);
  }
  
  // 2. Wait for DOM update
  await tick();
  
  // 3. Find span in flattened list and scroll
  const flatItems = flattenVisibleNodes(spanTree, get(expandedSpans));
  const index = flatItems.findIndex(item => item.node.spanId === currentSpanId);
  
  if (index >= 0) {
    // Calculate scroll position based on item height
    const scrollTop = index * ITEM_HEIGHT;
    // Scroll virtual list container
    scrollContainer.scrollTop = scrollTop;
  }
}
```

**CSS for Navigation Controls:**
```css
.search-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.result-count {
  font-size: 12px;
  color: var(--vscode-descriptionForeground, #8b8b8b);
  white-space: nowrap;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background-color: var(--vscode-button-secondaryBackground, #3a3d41);
  color: var(--vscode-button-secondaryForeground, #cccccc);
  cursor: pointer;
  font-size: 12px;
}

.nav-btn:hover:not(:disabled) {
  background-color: var(--vscode-button-secondaryHoverBackground, #45494e);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-results {
  padding: 4px 8px;
  font-size: 12px;
  color: var(--vscode-errorForeground, #f48771);
}
```

**Wrap Feedback Toast:**
```typescript
let wrapMessage = $state<string | null>(null);
let wrapTimeout: ReturnType<typeof setTimeout> | null = null;

function showWrapMessage(message: string): void {
  wrapMessage = message;
  if (wrapTimeout) clearTimeout(wrapTimeout);
  wrapTimeout = setTimeout(() => {
    wrapMessage = null;
  }, 1500);
}

function handleNext(): void {
  const wrapped = nextResult();
  if (wrapped) {
    showWrapMessage('Wrapped to first result');
  }
  scrollToCurrentMatch();
}
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3] - Full acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 4.2] - Search implementation decision
- [Source: src/webview/App.svelte#findPathToSpan] - Path finding utility
- [Source: src/webview/stores/uiStore.ts#expandAll] - Expand function
- [Source: src/webview/utils/flattenTree.ts] - Virtual list data structure
- [Source: src/webview/components/SpanTree.svelte] - Virtual list component
- [Source: 5-1-client-side-search-implementation.md] - Search store implementation
- [Source: 5-2-search-results-highlighting.md] - Current match highlighting

### Previous Story Intelligence

**From Story 5.1 (Client-Side Search Implementation):**
- TraceSearch.svelte component with debounced input
- searchStore.ts with query, results, currentIndex
- searchSpans() helper function

**From Story 5.2 (Search Results Highlighting):**
- SpanNode.svelte has current-match CSS class
- Highlighting uses var(--vscode-editor-findMatchHighlightBackground)
- hiddenMatchCount badge can indicate collapsed matches

**From Story 4.1 (Virtual Scrolling Large Traces):**
- svelte-virtual-list with ITEM_HEIGHT = 32px
- flattenVisibleNodes() returns FlatSpanItem[]
- Scroll position is tracked in uiStore

### Performance Considerations

- Scroll-to-span calculation is O(n) for flattened list - acceptable for 500 spans
- Use await tick() to ensure DOM updates before scrolling
- Expansion triggers re-flatten - cache if needed
- Navigation should feel instant (<50ms response time)
- Wrap message uses simple state, no external toast library

### Edge Cases to Handle

- Empty search results → disable buttons, show "0 matches"
- Single result → still allow next/prev (cycles to self)
- Match in deeply nested collapsed section → expand full path
- Match at end of trace → scroll position near bottom
- Rapid next/prev clicks → debounce or queue scrolls
- Focus management → Escape returns focus to tree correctly

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

### Completion Notes List

- Task 1: Added navigation UI to TraceSearch.svelte with "X of Y" result count, Previous (↑) and Next (↓) buttons. Buttons disabled when no results. Shows "0 matches" and "No results found" message when query returns empty.
- Task 2: Updated searchStore nextResult() and prevResult() to return boolean indicating wrap-around. Tests updated accordingly.
- Task 3: Implemented handleNavigateToSpan() in App.svelte that calculates scroll position from flattened list and scrolls virtual list container.
- Task 4: handleNavigateToSpan() expands path to target span using findPathToSpan() before scrolling, preserving existing expanded spans.
- Task 5: Added handleKeydown() to TraceSearch with Enter (next), Shift+Enter (prev), and Escape (clear + focus tree) support.
- Task 6: Added wrapMessage state with 1.5s auto-dismiss toast showing "Wrapped to first/last" using CSS animation.
- Task 7: All 296 unit tests pass. Compile succeeds with no errors.

### File List

**Modified:**
- src/webview/stores/searchStore.ts - nextResult/prevResult return wrap boolean
- src/webview/stores/searchStore.test.ts - Updated tests for wrap return value
- src/webview/components/TraceSearch.svelte - Added navigation controls, keyboard shortcuts, wrap toast
- src/webview/App.svelte - Added handleNavigateToSpan, onNavigate prop passed to TraceSearch

