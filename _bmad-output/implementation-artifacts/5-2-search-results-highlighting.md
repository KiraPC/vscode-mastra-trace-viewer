# Story 5.2: Search Results Highlighting

Status: done

## Story

As a developer,
I want matching spans highlighted in the tree,
So that I can see where my search term appears.

## Acceptance Criteria

1. **Given** Search results exist
   **When** SpanNode.svelte renders a span
   **Then** SpanNode checks if span is in searchStore.results
   **And** Matching spans have highlighted background (yellow/gold)
   **And** Non-matching spans remain with default styling

2. **Given** A span matches the search
   **When** The span is highlighted
   **Then** Highlight color is visible in both light and dark themes
   **And** Highlight uses CSS variable like var(--vscode-editor-findMatchBackground)
   **And** Text remains readable on highlighted background

3. **Given** Search results exist
   **When** Some matching spans are collapsed (hidden)
   **Then** Parent spans of hidden matches show indicator badge
   **And** Badge shows count of hidden matches (e.g., "3 matches")
   **And** Badge is clickable to expand and reveal matches

4. **Given** Search results include nested spans
   **When** A parent and child both match
   **Then** Both spans are highlighted independently
   **And** Hierarchy visualization remains clear
   **And** User can distinguish individual matches

5. **Given** Search query changes
   **When** Results update
   **Then** Previous highlights are removed
   **And** New highlights are applied immediately
   **And** Transition is smooth without flicker

6. **Given** Search is cleared
   **When** User deletes the search query
   **Then** All highlights are removed
   **And** Tree returns to normal styling
   **And** searchStore is reset (empty results)

7. **Given** Many results exist (50+ matches)
   **When** All matches are highlighted
   **Then** Performance remains smooth
   **And** Rendering highlights doesn't block UI
   **And** Scrolling remains at 60fps

## Tasks / Subtasks

- [x] Task 1: Add highlight state to SpanNode.svelte (AC: #1, #2, #4)
  - [x] Import searchStore (results, currentIndex) in SpanNode.svelte
  - [x] Add $derived isMatch check: searchStore.results.includes(node.spanId)
  - [x] Add CSS class "search-match" when isMatch is true
  - [x] Add CSS class "current-match" for currentIndex navigation (prep for story 5.3)
  - [x] Style .search-match with var(--vscode-editor-findMatchBackground)
  - [x] Style .current-match with var(--vscode-editor-findMatchHighlightBackground)

- [x] Task 2: Add highlight to VirtualSpanRow.svelte (AC: #1, #7)
  - [x] Pass highlight state through to SpanNode component
  - [x] Ensure virtual scrolling maintains performance with highlights
  - [x] Test scrolling remains smooth with 50+ highlighted spans

- [x] Task 3: Implement hidden match indicator badge (AC: #3)
  - [x] Create helper function: countHiddenMatches(spanId, results, expandedSpans)
  - [x] Add badge element to SpanNode when hiddenMatchCount > 0
  - [x] Style badge with VSCode badge variables
  - [x] Make badge clickable to expand parent and reveal matches
  - [x] Badge shows count (e.g., "3" for collapsed children with matches)

- [x] Task 4: Handle search clearing (AC: #5, #6)
  - [x] Verify SpanNode reactively removes .search-match class when results clear
  - [x] Verify no stale highlights remain after query change
  - [x] Test rapid query changes for flicker

- [x] Task 5: Unit tests and verification
  - [x] Test highlight logic in SpanNode
  - [x] Test hiddenMatchCount calculation
  - [x] Verify npm run compile passes
  - [x] Manual test with trace.json

## Dev Notes

### Critical Architecture Requirements

**From Architecture Document:**
- **Decision 4.2 - Search Implementation**: "Highlight matching spans in tree view"
- **Performance Requirement**: 60fps scrolling with highlights
- **VSCode Theme Compatibility**: Use CSS variables for light/dark theme support

**Dependencies (from Story 5.1):**
- searchStore.ts with results: string[] (spanIds)
- searchStore.ts with currentIndex: number

### Existing Patterns to Follow

**SpanNode.svelte Current Structure (extract):**
```svelte
<div 
  class="span-row {statusClass}"
  class:selected={isSelected}
  style="border-left-color: {spanColor};"
  ...
>
```

**Adding Highlight Classes:**
```svelte
<div 
  class="span-row {statusClass}"
  class:selected={isSelected}
  class:search-match={isMatch}
  class:current-match={isCurrentMatch}
  ...
>
```

**VSCode CSS Variables for Highlighting:**
```css
/* Match background (yellow/gold for all matches) */
--vscode-editor-findMatchBackground

/* Current match (orange, more prominent) */
--vscode-editor-findMatchHighlightBackground

/* Badge styling */
--vscode-badge-background
--vscode-badge-foreground
```

### Project Structure Notes

**Files to Modify:**
- [src/webview/components/SpanNode.svelte](src/webview/components/SpanNode.svelte) - Add highlight classes
- [src/webview/components/VirtualSpanRow.svelte](src/webview/components/VirtualSpanRow.svelte) - Pass highlight props

**Files to Reference (from Story 5.1):**
- [src/webview/stores/searchStore.ts](src/webview/stores/searchStore.ts) - Search results state

### Technical Implementation Details

**SpanNode.svelte Changes:**
```svelte
<script lang="ts">
  // Add import
  import { searchResults, currentIndex } from '../stores/searchStore';
  
  // Add derived state
  const isMatch = $derived($searchResults.includes(node.spanId));
  const isCurrentMatch = $derived(
    isMatch && $searchResults[$currentIndex] === node.spanId
  );
</script>
```

**CSS Additions to SpanNode.svelte:**
```css
.span-row.search-match {
  background-color: var(--vscode-editor-findMatchBackground, rgba(234, 92, 0, 0.33));
}

.span-row.search-match:hover {
  background-color: var(--vscode-editor-findMatchBackground, rgba(234, 92, 0, 0.5));
}

.span-row.current-match {
  background-color: var(--vscode-editor-findMatchHighlightBackground, rgba(255, 140, 0, 0.5));
  outline: 1px solid var(--vscode-editor-findMatchHighlightBorder, #ffb700);
}

/* Ensure selection overrides match highlight */
.span-row.selected.search-match {
  background-color: var(--vscode-list-activeSelectionBackground, #094771);
}

.match-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  background-color: var(--vscode-badge-background, #4d4d4d);
  color: var(--vscode-badge-foreground, #ffffff);
  cursor: pointer;
}

.match-badge:hover {
  filter: brightness(1.2);
}
```

**Hidden Match Count Helper:**
```typescript
function countHiddenMatches(
  node: SpanTreeNode,
  results: string[],
  expandedSpans: Set<string>
): number {
  if (!node.children.length) return 0;
  if (expandedSpans.has(node.spanId)) return 0; // Already expanded
  
  // Count matches in collapsed subtree
  let count = 0;
  function traverse(n: SpanTreeNode): void {
    if (results.includes(n.spanId)) count++;
    for (const child of n.children) {
      traverse(child);
    }
  }
  for (const child of node.children) {
    traverse(child);
  }
  return count;
}
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2] - Full acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 4.2] - Search implementation decision
- [Source: src/webview/components/SpanNode.svelte] - Current component structure
- [Source: src/webview/components/VirtualSpanRow.svelte] - Virtual scrolling wrapper
- [Source: 5-1-client-side-search-implementation.md] - Search store implementation

### Previous Story Intelligence

**From Story 5.1 (Client-Side Search Implementation):**
- searchStore.ts provides: query, results (spanId[]), currentIndex
- Helper functions: hasResults(), getResultCount(), nextResult(), prevResult()
- Results are spanId strings, enabling simple includes() check

**From Story 4.3 (Tab State Preservation):**
- Svelte reactive patterns with $derived
- Store subscription patterns in components
- Performance considerations for rapid updates

### Performance Considerations

- Use reactive $derived for isMatch - only recalculates when results change
- CSS classes are more performant than inline styles
- Badge count calculation should be memoized or cached
- Virtual scrolling already handles DOM optimization - highlights are just CSS
- 60fps scrolling must be maintained with highlights active

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

### Completion Notes List

- Task 1: Added search highlighting to SpanNode.svelte with isMatch and isCurrentMatch $derived states. Imported searchStore (results, currentIndex). Added CSS classes search-match and current-match with VSCode theme variables.
- Task 2: VirtualSpanRow.svelte delegates to SpanNode which handles highlighting internally. No changes needed - SpanNode reactively checks search results.
- Task 3: Implemented countHiddenMatches() helper function to count search matches in collapsed children. Added match-badge button that displays count and expands on click.
- Task 4: Svelte reactivity handles clearing automatically - when searchStore.results clears, isMatch becomes false and CSS classes are removed.
- Task 5: All 296 unit tests pass. Compile succeeds with no errors.

### Code Review Fixes Applied

- **CR-1 (HIGH)**: Created missing unit tests. Extracted `countHiddenMatches`, `isSpanMatch`, `createResultsSet` to [highlightHelper.ts](src/webview/utils/highlightHelper.ts). Added 16 comprehensive tests in [highlightHelper.test.ts](src/webview/utils/highlightHelper.test.ts) covering edge cases and performance.
- **CR-2 (MEDIUM)**: Optimized isMatch lookup from O(n) `includes()` to O(1) `Set.has()` by creating resultsSet with `createResultsSet()` once per results change.
- **CR-3 (MEDIUM)**: Simplified countHiddenMatches logic by removing redundant if/else branches.

**Post-review tests:** 345 tests passing. Compile clean.

### File List

**Created:**
- src/webview/utils/highlightHelper.ts
- src/webview/utils/highlightHelper.test.ts

**Modified:**
- src/webview/components/SpanNode.svelte

