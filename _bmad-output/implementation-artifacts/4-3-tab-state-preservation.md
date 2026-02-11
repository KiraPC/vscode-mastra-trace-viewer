# Story 4.3: Tab State Preservation

Status: done

## Story

As a developer,
I want my expanded nodes and scroll position preserved per trace,
So that switching between tabs maintains my context.

## Acceptance Criteria

**Given** A trace is open and I've expanded some nodes
**When** I switch to a different trace tab
**Then** The expanded state is preserved in memory
**And** Returning to the first tab shows the same expanded nodes

**Given** uiStore maintains expanded spans state
**When** I implement state preservation in the webview
**Then** expandedSpans Set is part of the webview's state
**And** State persists for the lifetime of the webview panel
**And** State is properly initialized when webview loads

**Given** I've scrolled to a specific position in a trace
**When** I switch to another trace tab
**Then** Scroll position is saved
**And** Returning to the first tab restores the scroll position
**And** Selected span (if any) remains selected

**Given** State needs to survive webview reload
**When** VSCode reloads the webview (e.g., window background/foreground)
**Then** Extension sends current state via postMessage on reload
**And** Webview restores: expandedSpans, scrollPosition, selectedSpanId
**And** User sees no difference after reload

**Given** State restoration is implemented
**When** I create a state persistence mechanism
**Then** TraceViewerPanel tracks state per traceId
**And** State includes: Set<spanId> expandedSpans, number scrollPosition, string selectedSpanId
**And** State is serializable for message passing

**Given** Webview receives state restoration message
**When** Message type is 'restoreState' with state payload
**Then** uiStore.expandedSpans is updated with provided Set
**And** Virtual scrolling component scrolls to saved position
**And** Selected span is re-highlighted

**Given** Multiple tabs exist with preserved state
**When** I close and reopen a trace
**Then** State is not preserved (fresh start for reopened trace)
**And** User starts with default collapsed state
**And** This is expected behavior (no persistent storage in MVP)

**Given** State preservation is working
**When** I expand many nodes then switch tabs multiple times
**Then** No memory leaks occur from state tracking
**And** State updates are efficient (no unnecessary re-renders)
**And** User experience is smooth and responsive

## Tasks / Subtasks

- [x] Define WebviewState interface (AC: 5)
  - [x] Create src/models/webviewState.types.ts
  - [x] Define WebviewState interface with:
    - expandedSpans: string[] (serialized Set)
    - scrollPosition: number
    - selectedSpanId: string | null
  - [x] Export interface for use in extension and webview

- [x] Add state tracking to TraceViewerPanel (AC: 5)
  - [x] Add private state: WebviewState property
  - [x] Initialize state with defaults on panel creation
  - [x] State is per-panel instance (tied to traceId)

- [x] Implement state capture from webview (AC: 1, 3)
  - [x] Define 'saveState' message type from webview to extension
  - [x] Webview sends current state on:
    - beforeunload event
    - visibility change (tab switch)
    - periodic interval (every 5 seconds)
  - [x] Extension stores received state in panel instance

- [x] Implement state restoration on webview focus (AC: 1, 3, 4)
  - [x] Track panel visibility with onDidChangeViewState
  - [x] When panel becomes visible, send 'restoreState' message
  - [x] Include saved state in message payload
  - [x] Webview applies state on receive

- [x] Handle webview reload (AC: 4)
  - [x] Detect webview reload via 'ready' message from webview
  - [x] Extension sends 'restoreState' with saved state
  - [x] Webview applies state after initialization

- [x] Update uiStore for state restoration (AC: 2, 6)
  - [x] Add restoreState(state: WebviewState) function to uiStore
  - [x] Function updates expandedSpans from serialized array
  - [x] Function updates selectedSpanId
  - [x] Trigger reactive updates in components

- [x] Implement scroll position tracking in webview (AC: 3)
  - [x] Track scroll position on virtual list scroll event
  - [x] Debounce scroll tracking (100ms)
  - [x] Include scrollPosition in saveState message

- [x] Implement scroll position restoration (AC: 3, 6)
  - [x] On restoreState receive, set scroll position
  - [x] Use virtual list scrollTo API if available
  - [x] Or set scrollTop on container element
  - [x] Handle case where position is beyond current content

- [x] Handle selectedSpanId preservation (AC: 3, 6)
  - [x] Include selectedSpanId in WebviewState
  - [x] On restore, update selectedSpanId in uiStore
  - [x] SpanNode component reacts to selection change
  - [x] Scroll to selected span if not visible

- [x] Test with retainContextWhenHidden (AC: 1, 2)
  - [x] Verify state preserved with retainContextWhenHidden: true
  - [x] Tab switch should not destroy webview
  - [x] State should persist automatically
  - [x] Minimal message passing needed

- [x] Test without retainContextWhenHidden (fallback) (AC: 4)
  - [x] Set retainContextWhenHidden: false
  - [x] Verify state save/restore mechanism works
  - [x] Webview reloads but state is restored
  - [x] Document tradeoffs

- [x] Handle fresh trace open (AC: 7)
  - [x] New panel starts with default empty state
  - [x] No state to restore for first open
  - [x] Default: all nodes collapsed, scroll at top, no selection

- [x] Clean up state on panel dispose (AC: 8)
  - [x] Clear state when panel is disposed
  - [x] No memory leaks from orphaned state
  - [x] State map cleaned properly

- [x] Performance testing (AC: 8)
  - [x] Open 10 traces with different expanded states
  - [x] Switch between tabs rapidly
  - [x] Verify no lag or memory growth
  - [x] Check DevTools Performance/Memory

## Dev Notes

### Critical Architecture Requirements

**State Preservation (per PRD/Architecture):**
- "Preservation of expand/collapse state per trace"
- "Tab navigation via keyboard shortcuts" (state must persist)
- Key UX requirement for developer workflow

**State Scope:**
- In-memory only (no persistent storage for MVP)
- Per-trace per-session
- Lost on trace close, extension reload, VSCode restart

### Implementation Pattern

**WebviewState Interface:**
```typescript
// src/models/webviewState.types.ts

export interface WebviewState {
  expandedSpans: string[];  // Array of spanIds (serializable)
  scrollPosition: number;   // Scroll offset in pixels
  selectedSpanId: string | null;  // Currently selected span
}

export const DEFAULT_WEBVIEW_STATE: WebviewState = {
  expandedSpans: [],
  scrollPosition: 0,
  selectedSpanId: null
};
```

**TraceViewerPanel State Tracking:**
```typescript
// Updates to src/providers/TraceViewerPanel.ts

import { WebviewState, DEFAULT_WEBVIEW_STATE } from '../models/webviewState.types';

export class TraceViewerPanel {
  // ... existing properties ...
  private state: WebviewState = { ...DEFAULT_WEBVIEW_STATE };
  
  private constructor(/*...*/) {
    // ... existing setup ...
    
    // Track visibility changes
    this.panel.onDidChangeViewState(
      e => this.handleViewStateChange(e),
      null,
      this.disposables
    );
  }
  
  private handleViewStateChange(e: vscode.WebviewPanelOnDidChangeViewStateEvent): void {
    if (e.webviewPanel.visible) {
      // Panel became visible, restore state
      this.restoreState();
    }
  }
  
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'ready':
        // Webview loaded/reloaded, send state
        this.restoreState();
        break;
      case 'saveState':
        // Webview sending current state
        this.state = message.payload as WebviewState;
        break;
      // ... other cases ...
    }
  }
  
  private restoreState(): void {
    this.panel.webview.postMessage({
      type: 'restoreState',
      payload: this.state
    });
  }
}
```

**Webview State Handler:**
```typescript
// src/webview/utils/stateHandler.ts

import { sendMessage } from './messageHandler';
import type { WebviewState } from '../../models/webviewState.types';

let saveStateTimeout: number | null = null;

export function initStateHandler(
  getState: () => WebviewState,
  restoreState: (state: WebviewState) => void
): void {
  // Listen for state restoration from extension
  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'restoreState') {
      restoreState(message.payload);
    }
  });
  
  // Save state on visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveStateNow(getState);
    }
  });
  
  // Periodic state save (every 5 seconds)
  setInterval(() => {
    saveStateDebounced(getState);
  }, 5000);
  
  // Save state before unload
  window.addEventListener('beforeunload', () => {
    saveStateNow(getState);
  });
}

function saveStateNow(getState: () => WebviewState): void {
  sendMessage({
    type: 'saveState',
    payload: getState()
  });
}

function saveStateDebounced(getState: () => WebviewState): void {
  if (saveStateTimeout) {
    clearTimeout(saveStateTimeout);
  }
  saveStateTimeout = window.setTimeout(() => {
    saveStateNow(getState);
    saveStateTimeout = null;
  }, 500);
}
```

**uiStore with State Restoration:**
```typescript
// src/webview/stores/uiStore.ts

import { writable, get } from 'svelte/store';
import type { WebviewState } from '../../models/webviewState.types';

export const expandedSpans = writable<Set<string>>(new Set());
export const selectedSpanId = writable<string | null>(null);
export const scrollPosition = writable<number>(0);

export function getState(): WebviewState {
  return {
    expandedSpans: Array.from(get(expandedSpans)),
    scrollPosition: get(scrollPosition),
    selectedSpanId: get(selectedSpanId)
  };
}

export function restoreState(state: WebviewState): void {
  expandedSpans.set(new Set(state.expandedSpans));
  selectedSpanId.set(state.selectedSpanId);
  scrollPosition.set(state.scrollPosition);
}

// Helper for toggling expansion
export function toggleExpanded(spanId: string): void {
  expandedSpans.update(current => {
    const next = new Set(current);
    if (next.has(spanId)) {
      next.delete(spanId);
    } else {
      next.add(spanId);
    }
    return next;
  });
}
```

**App.svelte Integration:**
```svelte
<!-- src/webview/App.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { initStateHandler } from './utils/stateHandler';
  import { getState, restoreState, scrollPosition } from './stores/uiStore';
  import SpanTree from './components/SpanTree.svelte';
  
  onMount(() => {
    // Initialize state handler
    initStateHandler(getState, restoreState);
    
    // Notify extension we're ready
    sendMessage({ type: 'ready' });
  });
  
  // Subscribe to scroll position changes for restoration
  $: if ($scrollPosition > 0) {
    // Will be handled by SpanTree component
  }
</script>
```

**SpanTree Scroll Restoration:**
```svelte
<!-- In SpanTree.svelte -->
<script lang="ts">
  import { scrollPosition } from '../stores/uiStore';
  import { onMount, afterUpdate } from 'svelte';
  
  let container: HTMLElement;
  let hasRestoredScroll = false;
  
  // Restore scroll position after content renders
  afterUpdate(() => {
    if ($scrollPosition > 0 && !hasRestoredScroll) {
      container.scrollTop = $scrollPosition;
      hasRestoredScroll = true;
    }
  });
  
  // Track scroll position changes
  function handleScroll() {
    scrollPosition.set(container.scrollTop);
  }
</script>

<div 
  class="span-tree-container" 
  bind:this={container}
  on:scroll={handleScroll}
>
  <!-- ... VirtualList ... -->
</div>
```

### retainContextWhenHidden Consideration

With `retainContextWhenHidden: true` (set in Story 4.2):
- Webview is kept alive when tab is hidden
- State is automatically preserved (no save/restore needed)
- State handler still useful for reload scenarios

If `retainContextWhenHidden: false`:
- Webview is destroyed when tab loses focus
- State save/restore mechanism is essential
- More message passing overhead

**Recommendation:** Keep `retainContextWhenHidden: true` for MVP, but implement state handler for robustness.

### Testing Notes

- Expand multiple nodes, switch tabs, return - verify expanded
- Scroll down, switch tabs, return - verify scroll position
- Select span, switch tabs, return - verify selection
- Reload webview (Developer: Reload Webview) - verify state restored
- Close tab, reopen same trace - verify fresh state
- Test with 10+ open tabs - verify no performance issues

### Project Structure Notes

- New file: src/models/webviewState.types.ts
- New file: src/webview/utils/stateHandler.ts
- Update: src/webview/stores/uiStore.ts (add state functions)
- Update: src/providers/TraceViewerPanel.ts (add state tracking)
- Update: src/webview/App.svelte (init state handler)
- Update: src/webview/components/SpanTree.svelte (scroll tracking)

### References

- [Architecture: State Preservation](../_bmad-output/planning-artifacts/architecture.md)
- [Story 4.2: Multiple Trace Tabs](./4-2-multiple-trace-tabs-management.md)
- [Story 3.4: Expand/Collapse](./3-4-expand-collapse-span-nodes.md)
- [VSCode Webview Persistence](https://code.visualstudio.com/api/extension-guides/webview#persistence)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- All tests pass (245/245)
- Compilation successful

### Completion Notes List

- Created WebviewState interface in src/models/webviewState.types.ts
- Updated TraceViewerPanel with state tracking (_state property), onDidChangeViewState handler, and restoreState method
- Added saveState/restoreState message types to messages.types.ts and TraceViewerPanel.ts
- Updated uiStore with scrollPosition store, getState(), restoreState() functions
- Created stateHandler.ts for webview-side state management (init, save on visibility change, periodic save, beforeunload)
- Updated App.svelte to initialize state handler on mount
- Updated SpanTree.svelte with scroll position tracking and restoration
- Added comprehensive tests for uiStore state functions, TraceViewerPanel state preservation, and stateHandler
- All 8 ACs satisfied with retainContextWhenHidden: true + fallback mechanism

### File List

- src/models/webviewState.types.ts (new)
- src/models/messages.types.ts (modified)
- src/providers/TraceViewerPanel.ts (modified)
- src/providers/TraceViewerPanel.test.ts (modified)
- src/webview/stores/uiStore.ts (modified)
- src/webview/stores/uiStore.test.ts (modified)
- src/webview/utils/stateHandler.ts (new)
- src/webview/utils/stateHandler.test.ts (new)
- src/webview/App.svelte (modified)
- src/webview/components/SpanTree.svelte (modified)
- src/webview/components/SpanNode.svelte (modified)

