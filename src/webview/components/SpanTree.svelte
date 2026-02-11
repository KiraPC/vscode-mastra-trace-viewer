<script lang="ts">
  /**
   * SpanTree component - Renders the hierarchical span tree
   * Container component that renders SpanNode for each root
   */
  import type { SpanTreeNode } from '../../models/tree.types';
  import SpanNode from './SpanNode.svelte';
  
  interface Props {
    tree: SpanTreeNode[];
  }
  
  let { tree }: Props = $props();
</script>

<div class="span-tree">
  {#if tree.length === 0}
    <div class="empty">
      <p>No spans in this trace</p>
    </div>
  {:else}
    <div class="tree-container">
      {#each tree as node (node.spanId)}
        <SpanNode {node} depth={0} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .span-tree {
    height: 100%;
    overflow: auto;
    padding: 8px;
  }

  .tree-container {
    display: flex;
    flex-direction: column;
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 100px;
    color: var(--vscode-descriptionForeground, #8b8b8b);
  }
</style>
