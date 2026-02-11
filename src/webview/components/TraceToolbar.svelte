<script lang="ts">
  /**
   * TraceToolbar component - Provides expand/collapse all buttons
   */
  import type { SpanTreeNode } from '../../models/tree.types';
  import { expandAll, collapseAll } from '../stores/uiStore';
  
  interface Props {
    tree: SpanTreeNode[];
  }
  
  let { tree }: Props = $props();
  
  /**
   * Collect all span IDs from the tree recursively
   */
  function collectAllSpanIds(nodes: SpanTreeNode[]): string[] {
    const ids: string[] = [];
    function traverse(nodeList: SpanTreeNode[]): void {
      for (const node of nodeList) {
        if (node.children.length > 0) {
          ids.push(node.spanId);
          traverse(node.children);
        }
      }
    }
    traverse(nodes);
    return ids;
  }
  
  function handleExpandAll(): void {
    const allIds = collectAllSpanIds(tree);
    expandAll(allIds);
  }
  
  function handleCollapseAll(): void {
    collapseAll();
  }
</script>

<div class="trace-toolbar">
  <button 
    type="button"
    class="toolbar-btn"
    onclick={handleExpandAll}
    title="Expand all spans"
  >
    <span class="btn-icon" aria-hidden="true">⊞</span>
    Expand All
  </button>
  <button 
    type="button"
    class="toolbar-btn"
    onclick={handleCollapseAll}
    title="Collapse all spans"
  >
    <span class="btn-icon" aria-hidden="true">⊟</span>
    Collapse All
  </button>
</div>

<style>
  .trace-toolbar {
    display: flex;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid var(--vscode-panel-border, #454545);
    margin-bottom: 8px;
  }

  .toolbar-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    background-color: var(--vscode-button-secondaryBackground, #3a3d41);
    color: var(--vscode-button-secondaryForeground, #cccccc);
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.1s;
  }

  .toolbar-btn:hover {
    background-color: var(--vscode-button-secondaryHoverBackground, #45494e);
  }

  .toolbar-btn:focus {
    outline: 1px solid var(--vscode-focusBorder, #007acc);
    outline-offset: 1px;
  }

  .btn-icon {
    font-size: 14px;
  }
</style>
