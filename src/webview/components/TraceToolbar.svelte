<script lang="ts">
  /**
   * TraceToolbar component - Provides expand/collapse all and view mode toggle
   */
  import type { SpanTreeNode } from '../../models/tree.types';
  import { expandAll, collapseAll, viewMode, toggleViewMode } from '../stores/uiStore';
  
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
  
  function handleToggleViewMode(): void {
    toggleViewMode();
  }
</script>

<div class="trace-toolbar">
  <div class="toolbar-group">
    <button 
      type="button"
      class="toolbar-btn"
      onclick={handleExpandAll}
      title="Expand all spans"
      disabled={$viewMode === 'json'}
    >
      <span class="btn-icon" aria-hidden="true">⊞</span>
      Expand All
    </button>
    <button 
      type="button"
      class="toolbar-btn"
      onclick={handleCollapseAll}
      title="Collapse all spans"
      disabled={$viewMode === 'json'}
    >
      <span class="btn-icon" aria-hidden="true">⊟</span>
      Collapse All
    </button>
  </div>
  <div class="toolbar-divider"></div>
  <button 
    type="button"
    class="toolbar-btn view-toggle"
    onclick={handleToggleViewMode}
    title={$viewMode === 'tree' ? 'Switch to JSON view' : 'Switch to tree view'}
  >
    <span class="btn-icon" aria-hidden="true">{$viewMode === 'tree' ? '{ }' : '🌲'}</span>
    {$viewMode === 'tree' ? 'View JSON' : 'View Tree'}
  </button>
</div>

<style>
  .trace-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--vscode-panel-border, #454545);
    margin-bottom: 8px;
  }

  .toolbar-group {
    display: flex;
    gap: 8px;
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background-color: var(--vscode-panel-border, #454545);
    margin: 0 4px;
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

  .toolbar-btn:hover:not(:disabled) {
    background-color: var(--vscode-button-secondaryHoverBackground, #45494e);
  }

  .toolbar-btn:focus {
    outline: 1px solid var(--vscode-focusBorder, #007acc);
    outline-offset: 1px;
  }

  .toolbar-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .toolbar-btn.view-toggle {
    margin-left: auto;
  }

  .btn-icon {
    font-size: 14px;
  }
</style>
