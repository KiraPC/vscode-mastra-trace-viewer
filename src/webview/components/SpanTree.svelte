<script lang="ts">
  /**
   * SpanTree component - Renders the hierarchical span tree with virtual scrolling
   * Uses svelte-virtual-list for efficient rendering of large traces
   */
  import { onMount } from 'svelte';
  import type { SpanTreeNode } from '../../models/tree.types';
  import VirtualList from 'svelte-virtual-list';
  import VirtualSpanRow from './VirtualSpanRow.svelte';
  import { flattenVisibleNodes } from '../utils/flattenTree';
  import { expandedSpans, scrollPosition, setScrollPosition } from '../stores/uiStore';
  import { triggerStateSave } from '../utils/stateHandler';
  
  interface Props {
    tree: SpanTreeNode[];
  }
  
  let { tree }: Props = $props();
  
  // Reactive flattening when tree or expanded state changes
  const flatItems = $derived(flattenVisibleNodes(tree, $expandedSpans));
  
  // Item height for virtual scrolling
  const ITEM_HEIGHT = 32;
  
  // Reference to the container element for scroll tracking
  let containerElement: HTMLElement;
  let hasRestoredScroll = false;
  let scrollDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
  
  /**
   * Handle scroll events and update store with debounce
   */
  function handleScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    
    // Debounce scroll position updates (100ms)
    if (scrollDebounceTimeout) {
      clearTimeout(scrollDebounceTimeout);
    }
    scrollDebounceTimeout = setTimeout(() => {
      setScrollPosition(scrollTop);
      triggerStateSave();
    }, 100);
  }
  
  /**
   * Restore scroll position when content is ready
   */
  function restoreScrollPosition(): void {
    if (containerElement && $scrollPosition > 0 && !hasRestoredScroll) {
      // Find the scrollable element within VirtualList
      const scrollable = containerElement.querySelector('[style*="overflow"]') || containerElement;
      if (scrollable instanceof HTMLElement) {
        scrollable.scrollTop = $scrollPosition;
        hasRestoredScroll = true;
      }
    }
  }
  
  // Effect to restore scroll after content renders
  $effect(() => {
    // Depend on flatItems to know when content is ready
    if (flatItems.length > 0 && $scrollPosition > 0) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        restoreScrollPosition();
      });
    }
  });
  
  onMount(() => {
    // Set up scroll listener on the container
    if (containerElement) {
      const scrollable = containerElement.querySelector('[style*="overflow"]') || containerElement;
      if (scrollable instanceof HTMLElement) {
        scrollable.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
          scrollable.removeEventListener('scroll', handleScroll);
          if (scrollDebounceTimeout) {
            clearTimeout(scrollDebounceTimeout);
          }
        };
      }
    }
  });
</script>

<div class="span-tree" bind:this={containerElement}>
  {#if flatItems.length === 0}
    <div class="empty">
      <p>No spans in this trace</p>
    </div>
  {:else}
    <div class="tree-container">
      <VirtualList 
        items={flatItems} 
        itemHeight={ITEM_HEIGHT}
        let:item
      >
        <VirtualSpanRow {item} />
      </VirtualList>
    </div>
  {/if}
</div>

<style>
  .span-tree {
    height: 100%;
    overflow: hidden;
    padding: 8px;
  }

  .tree-container {
    height: 100%;
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
