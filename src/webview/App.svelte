<script lang="ts">
  /**
   * App.svelte - Root component for trace viewer webview
   * Handles message communication with extension and state management
   */
  import { onMount } from 'svelte';
  import { traceStore, setTrace, clearTrace } from './stores/traceStore';
  import { 
    loadingStore, 
    loadingMessageStore, 
    errorStore, 
    selectedSpanId,
    setLoading, 
    setError, 
    clearUIState,
    expandAll,
    setSelectedSpan
  } from './stores/uiStore';
  import { onMessage, sendMessage } from './utils/messageHandler';
  import { buildTree } from '../utils/spanTreeBuilder';
  import type { SpanTreeNode } from '../models/tree.types';
  import LoadingSpinner from './components/LoadingSpinner.svelte';
  import ErrorDisplay from './components/ErrorDisplay.svelte';
  import SpanTree from './components/SpanTree.svelte';
  import TraceToolbar from './components/TraceToolbar.svelte';
  import SpanDetails from './components/SpanDetails.svelte';
  
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
  
  onMount(() => {
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
    
    return unsubscribe;
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
        <TraceToolbar tree={spanTree} />
        <SpanTree tree={spanTree} />
      </div>
      <div class="details-panel">
        <SpanDetails span={selectedSpan} />
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <p>No trace loaded</p>
    </div>
  {/if}
</main>

<style>
  .app {
    height: 100%;
    min-height: 100vh;
    background-color: var(--vscode-editor-background, #1e1e1e);
    color: var(--vscode-editor-foreground, #cccccc);
    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
    font-size: var(--vscode-font-size, 13px);
  }

  .trace-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .tree-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 300px;
    overflow: hidden;
  }

  .details-panel {
    width: 400px;
    flex-shrink: 0;
    overflow: hidden;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
    color: var(--vscode-descriptionForeground, #8b8b8b);
  }
</style>
