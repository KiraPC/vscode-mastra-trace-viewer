<script lang="ts">
  /**
   * TraceSearch component - Search input box for finding spans
   * With navigation controls for stepping through results
   */
  import type { Span } from '../../models/trace.types';
  import { searchSpans } from '../utils/searchHelper';
  import {
    query,
    results,
    currentIndex,
    setQuery,
    setResults,
    clearSearch,
    nextResult,
    prevResult,
  } from '../stores/searchStore';

  interface Props {
    spans: Span[];
    onNavigate?: (spanId: string) => void;
  }

  let { spans, onNavigate }: Props = $props();

  let inputValue = $state('');
  let inputElement: HTMLInputElement;
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  let wrapMessage = $state<string | null>(null);
  let wrapTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Cleanup timeouts on component unmount to prevent memory leaks
   */
  $effect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        debounceTimeout = null;
      }
      if (wrapTimeout) {
        clearTimeout(wrapTimeout);
        wrapTimeout = null;
      }
    };
  });

  /**
   * Handle input changes with 300ms debounce
   */
  function handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    inputValue = target.value;

    // Cancel previous timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Debounce search execution
    debounceTimeout = setTimeout(() => {
      executeSearch(inputValue);
    }, 300);
  }

  /**
   * Execute the search and update store
   */
  function executeSearch(searchQuery: string): void {
    setQuery(searchQuery);

    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const matchingIds = searchSpans(searchQuery, spans);
    setResults(matchingIds);
  }

  /**
   * Handle clear button click
   */
  function handleClear(): void {
    inputValue = '';
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    clearSearch();
  }

  /**
   * Show wrap message briefly
   */
  function showWrapMessage(message: string): void {
    wrapMessage = message;
    if (wrapTimeout) clearTimeout(wrapTimeout);
    wrapTimeout = setTimeout(() => {
      wrapMessage = null;
    }, 1500);
  }

  /**
   * Navigate to next match
   */
  function handleNext(): void {
    const wrapped = nextResult();
    if (wrapped) {
      showWrapMessage('Wrapped to first');
    }
    triggerNavigate();
  }

  /**
   * Navigate to previous match
   */
  function handlePrev(): void {
    const wrapped = prevResult();
    if (wrapped) {
      showWrapMessage('Wrapped to last');
    }
    triggerNavigate();
  }

  /**
   * Trigger navigation callback with current match
   */
  function triggerNavigate(): void {
    const currentResults = $results;
    const idx = $currentIndex;
    if (idx >= 0 && idx < currentResults.length && onNavigate) {
      onNavigate(currentResults[idx]);
    }
  }

  /**
   * Handle keyboard events
   */
  function handleKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if ($results.length > 0) {
          if (event.shiftKey) {
            handlePrev();
          } else {
            handleNext();
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        handleClear();
        // Return focus to tree
        const treeElement = document.querySelector('.span-tree');
        if (treeElement instanceof HTMLElement) {
          treeElement.focus();
        }
        break;
    }
  }

  /**
   * Clear search when spans change (new trace loaded)
   */
  $effect(() => {
    // When spans reference changes, clear search and cancel pending debounce
    if (spans) {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        debounceTimeout = null;
      }
      inputValue = '';
      clearSearch();
    }
  });
</script>

<div class="trace-search">
  <div class="search-input-wrapper">
    <span class="search-icon" aria-hidden="true">🔍</span>
    <input
      type="text"
      class="search-input"
      placeholder="Search spans..."
      value={inputValue}
      oninput={handleInput}
      onkeydown={handleKeydown}
      bind:this={inputElement}
    />
    {#if inputValue}
      <button
        type="button"
        class="clear-btn"
        onclick={handleClear}
        title="Clear search (Escape)"
        aria-label="Clear search"
      >
        ✕
      </button>
    {/if}
  </div>
  
  {#if $query}
    <div class="search-nav">
      {#if $results.length > 0}
        <span class="result-count">
          {$currentIndex + 1} of {$results.length}
        </span>
      {:else}
        <span class="result-count no-match">0 matches</span>
      {/if}
      <button 
        type="button"
        class="nav-btn"
        disabled={$results.length === 0}
        onclick={handlePrev}
        title="Previous match (Shift+Enter)"
        aria-label="Previous match"
      >↑</button>
      <button 
        type="button"
        class="nav-btn"
        disabled={$results.length === 0}
        onclick={handleNext}
        title="Next match (Enter)"
        aria-label="Next match"
      >↓</button>
    </div>
  {/if}
  
  {#if wrapMessage}
    <div class="wrap-toast" role="status" aria-live="polite">
      {wrapMessage}
    </div>
  {/if}
</div>

{#if $query && $results.length === 0}
  <div class="no-results-message">
    No results found for "{$query}"
  </div>
{/if}

<style>
  .trace-search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid var(--vscode-panel-border, #454545);
    margin-bottom: 8px;
    position: relative;
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    flex: 1;
    max-width: 300px;
    background-color: var(--vscode-input-background, #3c3c3c);
    border: 1px solid var(--vscode-input-border, #3c3c3c);
    border-radius: 4px;
    padding: 0 8px;
    transition: border-color 0.1s;
  }

  .search-input-wrapper:focus-within {
    border-color: var(--vscode-focusBorder, #007acc);
  }

  .search-icon {
    font-size: 12px;
    opacity: 0.7;
    margin-right: 6px;
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--vscode-input-foreground, #cccccc);
    font-size: 13px;
    padding: 6px 0;
    outline: none;
  }

  .search-input::placeholder {
    color: var(--vscode-input-placeholderForeground, #8c8c8c);
  }

  .clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--vscode-input-foreground, #cccccc);
    cursor: pointer;
    font-size: 12px;
    padding: 2px 4px;
    margin-left: 4px;
    border-radius: 2px;
    opacity: 0.7;
  }

  .clear-btn:hover {
    opacity: 1;
    background-color: var(--vscode-toolbar-hoverBackground, rgba(90, 93, 94, 0.31));
  }

  .search-nav {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .result-count {
    font-size: 12px;
    color: var(--vscode-descriptionForeground, #8b8b8b);
    white-space: nowrap;
    min-width: 70px;
  }

  .result-count.no-match {
    color: var(--vscode-errorForeground, #f48771);
  }

  .nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 4px;
    background-color: var(--vscode-button-secondaryBackground, #3a3d41);
    color: var(--vscode-button-secondaryForeground, #cccccc);
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
  }

  .nav-btn:hover:not(:disabled) {
    background-color: var(--vscode-button-secondaryHoverBackground, #45494e);
  }

  .nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .nav-btn:focus {
    outline: 1px solid var(--vscode-focusBorder, #007acc);
    outline-offset: 1px;
  }

  .wrap-toast {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    padding: 4px 8px;
    font-size: 11px;
    background-color: var(--vscode-badge-background, #4d4d4d);
    color: var(--vscode-badge-foreground, #ffffff);
    border-radius: 4px;
    animation: fadeInOut 1.5s ease-in-out;
  }

  @keyframes fadeInOut {
    0% { opacity: 0; }
    10% { opacity: 1; }
    80% { opacity: 1; }
    100% { opacity: 0; }
  }

  .no-results-message {
    padding: 4px 8px;
    font-size: 12px;
    color: var(--vscode-errorForeground, #f48771);
    margin-bottom: 8px;
  }
</style>
