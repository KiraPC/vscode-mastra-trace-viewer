<script lang="ts">
  /**
   * VirtualSpanRow component - Renders a single span row in the virtual list
   * Wrapper component that provides indentation and delegates to SpanNode in virtual mode
   */
  import SpanNode from './SpanNode.svelte';
  import type { FlatSpanItem } from '../utils/flattenTree';
  
  interface Props {
    item: FlatSpanItem;
  }
  
  let { item }: Props = $props();
  
  const INDENT_SIZE = 20; // pixels per depth level (matching SpanNode)
  
  // Calculate indentation based on depth
  const indent = $derived(item.depth * INDENT_SIZE);
</script>

<div 
  class="virtual-row" 
  style="padding-left: {indent}px"
>
  <SpanNode 
    node={item.node} 
    depth={0}
    virtualMode={true}
    hasChildrenOverride={item.hasChildren}
    isExpandedOverride={item.isExpanded}
  />
</div>

<style>
  .virtual-row {
    min-height: 32px;
    display: flex;
    align-items: center;
  }
</style>
