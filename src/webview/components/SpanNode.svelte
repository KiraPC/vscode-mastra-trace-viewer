<script lang="ts">
  /**
   * SpanNode component - Renders a single span in the tree
   * Recursively renders children with increasing depth (when not in virtual mode)
   * Supports expand/collapse functionality and selection
   */
  import type { SpanTreeNode } from '../../models/tree.types';
  import { formatDuration, getSpanTypeIcon, getSpanTypeColor } from '../../utils/spanTreeBuilder';
  import { expandedSpans, toggleExpand, selectedSpanId, setSelectedSpan } from '../stores/uiStore';
  import { results, currentIndex } from '../stores/searchStore';
  import SpanNode from './SpanNode.svelte';
  
  interface Props {
    node: SpanTreeNode;
    depth?: number;
    /** Virtual mode disables recursive rendering and internal indentation (handled by virtual list wrapper) */
    virtualMode?: boolean;
    /** Override hasChildren check when in virtual mode */
    hasChildrenOverride?: boolean;
    /** Override isExpanded check when in virtual mode */
    isExpandedOverride?: boolean;
  }
  
  let { 
    node, 
    depth = 0, 
    virtualMode = false,
    hasChildrenOverride,
    isExpandedOverride
  }: Props = $props();
  
  // Calculate indentation based on depth (skip in virtual mode - handled by wrapper)
  const indentPx = $derived(virtualMode ? 0 : depth * 20);
  
  // Format duration for display
  const duration = $derived(formatDuration(node.startedAt, node.endedAt));
  
  // Get icon for span type
  const icon = $derived(getSpanTypeIcon(node.spanType));
  
  // Get color for span type
  const spanColor = $derived(getSpanTypeColor(node.spanType));
  
  // Determine status class for styling
  const statusClass = $derived(
    node.status === 'error' ? 'error' : 
    node.status === 'running' ? 'running' : 
    'success'
  );
  
  // Check if this node has children (use override in virtual mode)
  const hasChildren = $derived(
    hasChildrenOverride !== undefined ? hasChildrenOverride : node.children.length > 0
  );
  
  // Check if this node is expanded (use override in virtual mode, otherwise reactive to store)
  let isExpanded = $derived(
    isExpandedOverride !== undefined ? isExpandedOverride : $expandedSpans.has(node.spanId)
  );
  
  // Whether to show children (never in virtual mode - handled by virtual list)
  const showChildren = $derived(!virtualMode && hasChildren && isExpanded);
  
  // Check if this span matches the current search
  const isMatch = $derived($results.includes(node.spanId));
  
  // Check if this is the currently focused search result
  const isCurrentMatch = $derived(
    isMatch && $currentIndex >= 0 && $results[$currentIndex] === node.spanId
  );
  
  /**
   * Count hidden matches in collapsed children
   */
  function countHiddenMatches(
    children: SpanTreeNode[],
    searchResults: string[],
    expanded: Set<string>
  ): number {
    if (children.length === 0) return 0;
    
    let count = 0;
    function traverse(nodes: SpanTreeNode[]): void {
      for (const n of nodes) {
        if (searchResults.includes(n.spanId)) count++;
        // Only traverse children if this node is NOT expanded
        if (n.children.length > 0 && !expanded.has(n.spanId)) {
          traverse(n.children);
        } else if (n.children.length > 0 && expanded.has(n.spanId)) {
          // If expanded, still count but we need to check if children are collapsed
          traverse(n.children);
        }
      }
    }
    traverse(children);
    return count;
  }
  
  // Calculate hidden match count when this node is collapsed
  const hiddenMatchCount = $derived(
    !isExpanded && hasChildren 
      ? countHiddenMatches(node.children, $results, $expandedSpans)
      : 0
  );

  // Check if this node is selected
  let isSelected = $derived($selectedSpanId === node.spanId);
  
  // Handle chevron toggle click (only toggle, don't select)
  function handleChevronClick(event: MouseEvent): void {
    event.stopPropagation();
    if (hasChildren) {
      toggleExpand(node.spanId);
    }
  }
  
  // Handle row click (select the span)
  function handleRowClick(): void {
    setSelectedSpan(node.spanId);
  }
  
  // Handle keyboard events
  function handleKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        setSelectedSpan(node.spanId);
        break;
      case ' ':
        if (hasChildren) {
          event.preventDefault();
          toggleExpand(node.spanId);
        }
        break;
      case 'ArrowRight':
        // Expand if collapsed and has children
        if (hasChildren && !isExpanded) {
          event.preventDefault();
          event.stopPropagation();
          toggleExpand(node.spanId);
        }
        break;
      case 'ArrowLeft':
        // Collapse if expanded
        if (hasChildren && isExpanded) {
          event.preventDefault();
          event.stopPropagation();
          toggleExpand(node.spanId);
        }
        break;
    }
  }
</script>

<div class="span-node" style="padding-left: {indentPx}px">
  <div 
    class="span-row {statusClass}"
    class:selected={isSelected}
    class:search-match={isMatch}
    class:current-match={isCurrentMatch}
    style="border-left-color: {spanColor};"
    role="treeitem"
    tabindex={0}
    aria-expanded={hasChildren ? isExpanded : undefined}
    aria-selected={isSelected}
    onclick={handleRowClick}
    onkeydown={handleKeydown}
  >
    {#if hasChildren}
      <button 
        type="button"
        class="chevron-btn" 
        class:expanded={isExpanded} 
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
        onclick={handleChevronClick}
      >▶</button>
    {:else}
      <span class="chevron-placeholder" aria-hidden="true"></span>
    {/if}
    <span class="icon icon-{icon}" style="color: {spanColor};" aria-hidden="true"></span>
    <span class="name" title={node.name}>{node.name}</span>
    <span class="type" style="background-color: {spanColor};">{node.spanType}</span>
    <span class="duration">{duration}</span>
    {#if node.status === 'error'}
      <span class="error-indicator" title="Error">⚠</span>
    {/if}
    {#if hiddenMatchCount > 0}
      <button 
        type="button"
        class="match-badge"
        onclick={handleChevronClick}
        title="{hiddenMatchCount} match{hiddenMatchCount > 1 ? 'es' : ''} in collapsed children"
        aria-label="{hiddenMatchCount} hidden search matches, click to expand"
      >
        {hiddenMatchCount}
      </button>
    {/if}
  </div>
  
  {#if showChildren}
    <div class="children">
      {#each node.children as child (child.spanId)}
        <SpanNode node={child} depth={depth + 1} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .span-node {
    font-size: 13px;
  }

  .span-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.1s;
    border-left: 3px solid transparent;
  }

  .span-row:hover {
    background-color: var(--vscode-list-hoverBackground, rgba(255, 255, 255, 0.05));
  }

  .span-row:focus {
    outline: 1px solid var(--vscode-focusBorder, #007acc);
    outline-offset: -1px;
  }

  .span-row.selected {
    background-color: var(--vscode-list-activeSelectionBackground, #094771);
    color: var(--vscode-list-activeSelectionForeground, #ffffff);
  }

  .span-row.selected:hover {
    background-color: var(--vscode-list-activeSelectionBackground, #094771);
  }

  /* Search result highlighting */
  .span-row.search-match {
    background-color: var(--vscode-editor-findMatchBackground, rgba(234, 92, 0, 0.33));
  }

  .span-row.search-match:hover {
    background-color: var(--vscode-editor-findMatchBackground, rgba(234, 92, 0, 0.45));
  }

  .span-row.current-match {
    background-color: var(--vscode-editor-findMatchHighlightBackground, rgba(255, 140, 0, 0.5));
    outline: 1px solid var(--vscode-editor-findMatchHighlightBorder, #ffb700);
    outline-offset: -1px;
  }

  .span-row.current-match:hover {
    background-color: var(--vscode-editor-findMatchHighlightBackground, rgba(255, 140, 0, 0.6));
  }

  /* Selection takes precedence over search highlight */
  .span-row.selected.search-match,
  .span-row.selected.current-match {
    background-color: var(--vscode-list-activeSelectionBackground, #094771);
    outline: none;
  }

  .span-row.error {
    border-left-color: var(--span-color-error, #ef5350) !important;
  }

  .span-row.running {
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .chevron-btn {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: var(--vscode-foreground, #cccccc);
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  .chevron-btn:hover {
    color: var(--vscode-textLink-foreground, #3794ff);
  }

  .chevron-btn.expanded {
    transform: rotate(90deg);
  }

  .chevron-placeholder {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  /* Codicon-like icons using unicode */
  .icon-person::before { content: '👤'; font-size: 12px; }
  .icon-gear::before { content: '⚙️'; font-size: 12px; }
  .icon-tools::before { content: '🔧'; font-size: 12px; }
  .icon-sparkle::before { content: '✨'; font-size: 12px; }
  .icon-circle-outline::before { content: '○'; font-size: 14px; }

  .name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--vscode-foreground, #cccccc);
    font-weight: 500;
  }

  .selected .name {
    color: var(--vscode-list-activeSelectionForeground, #ffffff);
  }

  .type {
    color: #fff;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 10px;
    flex-shrink: 0;
    opacity: 0.9;
  }

  .duration {
    color: var(--vscode-descriptionForeground, #8b8b8b);
    font-size: 12px;
    font-family: var(--vscode-editor-font-family, monospace);
    flex-shrink: 0;
    min-width: 60px;
    text-align: right;
  }

  .error-indicator {
    color: var(--span-color-error, #ef5350);
    font-size: 14px;
    flex-shrink: 0;
  }

  .children {
    border-left: 1px solid var(--vscode-editorIndentGuide-background, #404040);
    margin-left: 8px;
  }

  .match-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    font-size: 11px;
    font-weight: 600;
    background-color: var(--vscode-badge-background, #4d4d4d);
    color: var(--vscode-badge-foreground, #ffffff);
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    margin-left: 4px;
    transition: filter 0.1s;
  }

  .match-badge:hover {
    filter: brightness(1.2);
  }

  .match-badge:focus {
    outline: 1px solid var(--vscode-focusBorder, #007acc);
    outline-offset: 1px;
  }
</style>
