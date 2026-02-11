# Story 3.4: Expand/Collapse Span Nodes

Status: done

## Story

As a developer,
I want to expand and collapse span nodes,
So that I can focus on relevant parts of the trace.

## Acceptance Criteria

**Given** The span tree is rendered
**When** A span has children
**Then** An expand/collapse icon appears next to the span
**And** The icon indicates current state (▶ collapsed, ▼ expanded)

**Given** A span is collapsed by default
**When** I click on the expand icon
**Then** The span's children become visible
**And** The icon changes to indicate expanded state
**And** Animation smoothly reveals the children

**Given** A span is expanded
**When** I click on the collapse icon
**Then** The span's children are hidden
**And** The icon changes to indicate collapsed state
**And** Animation smoothly hides the children

**Given** UI state needs to be tracked
**When** I create src/webview/stores/uiStore.ts
**Then** uiStore includes expandedSpans: writable<Set<string>>
**And** expandedSpans stores spanIds of currently expanded nodes
**And** SpanNode component reads from and updates expandedSpans

**Given** Nested spans exist (grandchildren, great-grandchildren)
**When** I collapse a parent span
**Then** All descendant spans are hidden
**And** Their expanded state is preserved (when parent re-expands, children state is maintained)

**Given** A large tree exists
**When** I want to expand all nodes
**Then** A "Expand All" button is available in the toolbar
**And** Clicking it expands all spans in the tree

**Given** All nodes are expanded
**When** I want to collapse all nodes
**Then** A "Collapse All" button is available in the toolbar
**And** Clicking it collapses all spans to show only root level

**Given** Expand/collapse state is working
**When** I test keyboard navigation
**Then** Arrow keys navigate between spans
**And** Right arrow expands collapsed spans
**And** Left arrow collapses expanded spans
**And** Up/Down arrows move between visible spans

## Tasks / Subtasks

- [x] Update uiStore with expanded spans state (AC: 4)
  - [x] Update src/webview/stores/uiStore.ts
  - [x] Add expandedSpans: writable<Set<string>> initialized with empty Set
  - [x] Export helper functions: toggleExpand(spanId), expandAll(spanIds), collapseAll()
  - [x] Export isExpanded(spanId) derived check

- [x] Add expand/collapse toggle to SpanNode (AC: 1, 2, 3)
  - [x] Update src/webview/components/SpanNode.svelte
  - [x] Add chevron icon before span name (▶ collapsed, ▼ expanded)
  - [x] Only show chevron if node.children.length > 0
  - [x] Subscribe to expandedSpans store to determine current state
  - [x] Add click handler on chevron to toggle expand state

- [x] Implement toggle functionality (AC: 2, 3)
  - [x] On chevron click, call toggleExpand(node.spanId)
  - [x] Update expandedSpans Set (add if collapsed, remove if expanded)
  - [x] Trigger reactive update in SpanNode

- [x] Conditionally render children (AC: 2, 3, 5)
  - [x] Check if node.spanId is in expandedSpans
  - [x] If expanded, render children recursively
  - [x] If collapsed, hide children (don't render)
  - [x] Preserve child expanded state when parent collapses/expands

- [x] Add expand/collapse animation (AC: 2, 3)
  - [x] Use Svelte transitions (slide or fade)
  - [x] Apply transition to children container
  - [x] Keep animation smooth and performant
  - [x] Consider disabling for large trees (performance)

- [x] Create toolbar with Expand All / Collapse All (AC: 6, 7)
  - [x] Create src/webview/components/TraceToolbar.svelte
  - [x] Add "Expand All" button with icon
  - [x] Add "Collapse All" button with icon
  - [x] Position toolbar above span tree

- [x] Implement Expand All functionality (AC: 6)
  - [x] Collect all spanIds from tree recursively
  - [x] Set expandedSpans to contain all spanIds
  - [x] Tree updates reactively to show all nodes

- [x] Implement Collapse All functionality (AC: 7)
  - [x] Clear expandedSpans Set
  - [x] Only root nodes remain visible
  - [x] Tree updates reactively

- [x] Implement keyboard navigation (AC: 8)
  - [x] Add tabindex to SpanNode for focus
  - [x] Track focused span in uiStore: focusedSpanId
  - [x] Up arrow: focus previous visible span
  - [x] Down arrow: focus next visible span
  - [x] Right arrow: expand current span (if collapsed and has children)
  - [x] Left arrow: collapse current span (if expanded) or focus parent

- [x] Calculate visible spans for navigation (AC: 8)
  - [x] Create getVisibleSpans(tree, expandedSpans) utility
  - [x] Returns flat array of visible spanIds in display order
  - [x] Use for Up/Down arrow navigation

- [x] Add focus styling (AC: 8)
  - [x] Highlight focused span with outline or background
  - [x] Use --vscode-focusBorder color
  - [x] Ensure visible in both light and dark themes

- [x] Set default expanded state (AC: 1)
  - [x] Decide on default: all collapsed or first level expanded
  - [x] Recommendation: root spans expanded, children collapsed
  - [x] Initialize expandedSpans with root spanIds on trace load

## Dev Notes

### Critical Architecture Requirements

**State Management:**
- Per architecture.md: "Svelte stores for UI state"
- expandedSpans tracked in Svelte writable store
- State persists within webview panel lifetime

**Performance:**
- For large trees (500+ spans), consider not rendering collapsed subtrees
- Conditional rendering is more performant than CSS hide
- Animation may need to be disabled for very large trees

**Accessibility:**
- Keyboard navigation follows ARIA tree pattern
- Focus management is important for accessibility
- Use semantic roles if possible

### Implementation Pattern

**UI Store Update:**
```typescript
// src/webview/stores/uiStore.ts
import { writable, derived } from 'svelte/store';

export const expandedSpans = writable<Set<string>>(new Set());
export const focusedSpanId = writable<string | null>(null);

export function toggleExpand(spanId: string): void {
  expandedSpans.update(set => {
    const newSet = new Set(set);
    if (newSet.has(spanId)) {
      newSet.delete(spanId);
    } else {
      newSet.add(spanId);
    }
    return newSet;
  });
}

export function expandAll(spanIds: string[]): void {
  expandedSpans.set(new Set(spanIds));
}

export function collapseAll(): void {
  expandedSpans.set(new Set());
}

export function isExpanded(spanId: string): boolean {
  let result = false;
  expandedSpans.subscribe(set => {
    result = set.has(spanId);
  })();
  return result;
}
```

**SpanNode with Expand/Collapse:**
```svelte
<script lang="ts">
  import { slide } from 'svelte/transition';
  import { expandedSpans, toggleExpand, focusedSpanId } from '../stores/uiStore';
  import type { SpanTreeNode } from '../../models/tree.types';
  
  export let node: SpanTreeNode;
  export let depth = 0;
  
  $: isExpanded = $expandedSpans.has(node.spanId);
  $: hasChildren = node.children.length > 0;
  $: isFocused = $focusedSpanId === node.spanId;
  
  function handleChevronClick(e: Event) {
    e.stopPropagation();
    toggleExpand(node.spanId);
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' && hasChildren && !isExpanded) {
      toggleExpand(node.spanId);
    } else if (e.key === 'ArrowLeft' && isExpanded) {
      toggleExpand(node.spanId);
    }
    // Up/Down handled at tree level
  }
</script>

<div 
  class="span-node" 
  class:focused={isFocused}
  style="padding-left: {depth * 16}px"
  tabindex="0"
  on:keydown={handleKeydown}
>
  {#if hasChildren}
    <button class="chevron" on:click={handleChevronClick}>
      {isExpanded ? '▼' : '▶'}
    </button>
  {:else}
    <span class="chevron-placeholder"></span>
  {/if}
  
  <span class="span-icon">{getSpanIcon(node.spanType)}</span>
  <span class="span-name">{node.name}</span>
  <span class="span-duration">{formatDuration(node.startedAt, node.endedAt)}</span>
</div>

{#if hasChildren && isExpanded}
  <div class="children" transition:slide={{ duration: 150 }}>
    {#each node.children as child (child.spanId)}
      <svelte:self node={child} depth={depth + 1} />
    {/each}
  </div>
{/if}

<style>
  .span-node {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    cursor: pointer;
    user-select: none;
  }
  
  .span-node:hover {
    background: var(--vscode-list-hoverBackground);
  }
  
  .span-node.focused {
    outline: 1px solid var(--vscode-focusBorder);
  }
  
  .chevron {
    width: 16px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--vscode-foreground);
    padding: 0;
  }
  
  .chevron-placeholder {
    width: 16px;
  }
</style>
```

**Visible Spans Utility:**
```typescript
export function getVisibleSpans(
  tree: SpanTreeNode[],
  expandedSpans: Set<string>
): string[] {
  const visible: string[] = [];
  
  function traverse(nodes: SpanTreeNode[]) {
    for (const node of nodes) {
      visible.push(node.spanId);
      if (expandedSpans.has(node.spanId) && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }
  
  traverse(tree);
  return visible;
}
```

### Testing Notes

- Test expand/collapse toggle
- Test keyboard navigation (arrow keys)
- Test Expand All / Collapse All buttons
- Test state preservation when parent collapses
- Test animation performance with large trees

### Project Structure Notes

- Update: src/webview/stores/uiStore.ts
- Update: src/webview/components/SpanNode.svelte
- New file: src/webview/components/TraceToolbar.svelte
- New utility function for visible spans calculation

### References

- [Story 3.3: Span Tree Display](./3-3-hierarchical-span-tree-display.md)
- [Architecture: Webview State Management](../_bmad-output/planning-artifacts/architecture.md#decision-1-2-webview-state-management)
- [Svelte Transitions](https://svelte.dev/docs#run-time-svelte-transition)

## Dev Agent Record

### Agent Model Used



### Debug Log References

### Completion Notes List

### File List
