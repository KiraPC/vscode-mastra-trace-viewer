<script lang="ts">
  /**
   * App.svelte - Root component for trace viewer webview
   * Handles message communication with extension and state management
   */
  import { onMount, tick } from 'svelte';
  import { get } from 'svelte/store';
  import { traceStore, setTrace, clearTrace } from './stores/traceStore';
  import { 
    loadingStore, 
    loadingMessageStore, 
    errorStore, 
    selectedSpanId,
    expandedSpans,
    viewMode,
    setLoading, 
    setError, 
    clearUIState,
    expandAll,
    setSelectedSpan,
    getState,
    restoreState
  } from './stores/uiStore';
  import { onMessage, sendMessage } from './utils/messageHandler';
  import { initStateHandler } from './utils/stateHandler';
  import { buildTree } from '../utils/spanTreeBuilder';
  import { flattenVisibleNodes } from './utils/flattenTree';
  import type { SpanTreeNode } from '../models/tree.types';
  import LoadingSpinner from './components/LoadingSpinner.svelte';
  import ErrorDisplay from './components/ErrorDisplay.svelte';
  import SpanTree from './components/SpanTree.svelte';
  import TraceToolbar from './components/TraceToolbar.svelte';
  import TraceSearch from './components/TraceSearch.svelte';
  import SpanDetails from './components/SpanDetails.svelte';
  import JsonViewer from './components/JsonViewer.svelte';
  
  // Build tree from trace spans (cached via $derived)
  const spanTree = $derived<SpanTreeNode[]>(
    $traceStore?.spans ? buildTree($traceStore.spans) : []
  );
  
  /**
   * Find a span node in the tree by spanId
   */
  function findSpanInTree(nodes: SpanTreeNode[], spanId: string): SpanTreeNode | null {
    for (const node of nodes) {
      if (node.spanId === spanId) {
        return node;
      }
      if (node.children.length > 0) {
        const found = findSpanInTree(node.children, spanId);
        if (found) return found;
      }
    }
    return null;
  }
  
  // Get selected span from tree
  const selectedSpan = $derived<SpanTreeNode | null>(
    $selectedSpanId ? findSpanInTree(spanTree, $selectedSpanId) : null
  );
  
  /**
   * Collect root span IDs for initial expand state
   */
  function collectRootSpanIds(nodes: SpanTreeNode[]): string[] {
    return nodes.filter(n => n.children.length > 0).map(n => n.spanId);
  }
  
  /**
   * Find the path (ancestor IDs) to a specific span in the tree
   * Returns array of parent span IDs from root to parent of target
   */
  function findPathToSpan(nodes: SpanTreeNode[], targetId: string, path: string[] = []): string[] | null {
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
  
  // Item height for virtual scrolling (must match SpanTree)
  const ITEM_HEIGHT = 32;
  
  /**
   * Navigate to a span: expand path, scroll into view, and select
   */
  async function handleNavigateToSpan(spanId: string): Promise<void> {
    // 1. Find path to the span and expand all ancestors
    const path = findPathToSpan(spanTree, spanId);
    if (path && path.length > 0) {
      const currentExpanded = get(expandedSpans);
      const newExpanded = new Set([...currentExpanded, ...path]);
      expandedSpans.set(newExpanded);
    }
    
    // 2. Wait for DOM to update after expansion
    await tick();
    
    // 3. Calculate scroll position based on flattened list
    const currentExpanded = get(expandedSpans);
    const flatItems = flattenVisibleNodes(spanTree, currentExpanded);
    const index = flatItems.findIndex(item => item.node.spanId === spanId);
    
    if (index >= 0) {
      // Find the scroll container
      const scrollContainer = document.querySelector('.span-tree [style*="overflow"]') as HTMLElement;
      if (scrollContainer) {
        const scrollTop = index * ITEM_HEIGHT;
        // Center the item in view if possible
        const containerHeight = scrollContainer.clientHeight;
        const centeredScroll = Math.max(0, scrollTop - containerHeight / 2 + ITEM_HEIGHT / 2);
        scrollContainer.scrollTop = centeredScroll;
      }
    }
    
    // 4. Select the span
    setSelectedSpan(spanId);
  }
  
  // Threshold for showing large trace warning
  const LARGE_TRACE_THRESHOLD = 1000;
  
  /**
   * Check if trace is large and show warning to user
   */
  function checkLargeTrace(spanCount: number): void {
    if (spanCount > LARGE_TRACE_THRESHOLD) {
      sendMessage({
        type: 'showWarning',
        payload: {
          message: `Large trace detected (${spanCount} spans). Some features may be slower.`
        }
      });
    }
  }
  
  onMount(() => {
    // Initialize state handler for tab state preservation
    const cleanupStateHandler = initStateHandler(getState, restoreState);
    
    // Subscribe to messages from extension
    const unsubscribe = onMessage((message) => {
      switch (message.type) {
        case 'loadTrace':
          const { trace, selectedSpanId: initialSpanId } = message.payload;
          setTrace(trace);
          clearUIState();
          // Build tree and set up initial expand state
          const tree = trace.spans ? buildTree(trace.spans) : [];
          const rootIds = collectRootSpanIds(tree);
          
          // Check for large trace and show warning
          const spanCount = trace.spans?.length || 0;
          checkLargeTrace(spanCount);
          
          if (initialSpanId) {
            // If a specific span is targeted, expand path to it and select it
            const pathToSpan = findPathToSpan(tree, initialSpanId) || [];
            const idsToExpand = [...new Set([...rootIds, ...pathToSpan])];
            if (idsToExpand.length > 0) {
              expandAll(idsToExpand);
            }
            setSelectedSpan(initialSpanId);
          } else if (rootIds.length > 0) {
            // Otherwise just expand root spans
            expandAll(rootIds);
          }
          break;
        case 'error':
          setError(message.payload.message);
          break;
        case 'loading':
          setLoading(message.payload.message);
          break;
      }
    });
    
    // Signal to extension that webview is ready
    sendMessage({ type: 'ready' });
    
    return () => {
      unsubscribe();
      cleanupStateHandler();
    };
  });
</script>

<main class="app">
  {#if $loadingStore}
    <LoadingSpinner message={$loadingMessageStore} />
  {:else if $errorStore}
    <ErrorDisplay message={$errorStore} />
  {:else if $traceStore}
    <div class="trace-layout">
      <div class="tree-panel">
        {#if $viewMode === 'tree'}
          <TraceSearch spans={$traceStore.spans || []} onNavigate={handleNavigateToSpan} />
        {/if}
        <TraceToolbar tree={spanTree} />
        {#if $viewMode === 'tree'}
          <SpanTree tree={spanTree} />
        {:else}
          <div class="json-panel">
            <JsonViewer data={$traceStore} label="Trace" maxLength={10000} />
          </div>
        {/if}
      </div>
      {#if $viewMode === 'tree'}
        <div class="details-panel">
          <SpanDetails span={selectedSpan} />
        </div>
      {/if}
    </div>
  {:else}
    <div class="empty-state">
      <p>No trace loaded</p>
    </div>
  {/if}
</main>

<style>
  .app {
    height: 100vh;
    width: 100%;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    overflow: hidden;
    background-color: var(--vscode-editor-background, #1e1e1e);
    color: var(--vscode-editor-foreground, #cccccc);
    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
    font-size: var(--vscode-font-size, 13px);
  }

  .trace-layout {
    display: flex;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  .tree-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 300px;
    overflow: hidden;
    padding: 8px 12px 16px 12px;
  }

  .details-panel {
    width: 400px;
    flex-shrink: 0;
    overflow: hidden;
    padding-bottom: 16px;
  }

  .json-panel {
    flex: 1;
    overflow: auto;
    padding: 8px 8px 16px 8px;
    background-color: var(--vscode-editor-background, #1e1e1e);
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    color: var(--vscode-descriptionForeground, #8b8b8b);
  }
</style>
