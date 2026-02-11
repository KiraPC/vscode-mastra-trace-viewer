/**
 * Svelte stores for UI state management
 */

import { writable, get } from 'svelte/store';
import type { WebviewState } from '../../models/webviewState.types';

/**
 * Loading state - true while waiting for trace data
 */
export const loadingStore = writable<boolean>(true);

/**
 * Loading message to display
 */
export const loadingMessageStore = writable<string>('Loading trace...');

/**
 * Error state - error message or null if no error
 */
export const errorStore = writable<string | null>(null);

/**
 * Expanded spans - Set of spanIds that are currently expanded
 */
export const expandedSpans = writable<Set<string>>(new Set());

/**
 * Currently focused span ID for keyboard navigation
 */
export const focusedSpanId = writable<string | null>(null);

/**
 * Set loading state with message
 */
export function setLoading(message = 'Loading trace...'): void {
  loadingStore.set(true);
  loadingMessageStore.set(message);
  errorStore.set(null);
}

/**
 * Clear loading state
 */
export function clearLoading(): void {
  loadingStore.set(false);
}

/**
 * Set error state
 */
export function setError(message: string): void {
  errorStore.set(message);
  loadingStore.set(false);
}

/**
 * Clear error state
 */
export function clearError(): void {
  errorStore.set(null);
}

/**
 * Clear all UI state (loading and error)
 */
export function clearUIState(): void {
  loadingStore.set(false);
  errorStore.set(null);
}

/**
 * Toggle expand/collapse state for a span
 */
export function toggleExpand(spanId: string): void {
  expandedSpans.update(set => {
    const newSet = new Set(set);
    if (newSet.has(spanId)) {
      newSet.delete(spanId);
    } else {
      newSet.add(spanId);
    }
    return newSet;
  });
}

/**
 * Expand multiple spans
 */
export function expandAll(spanIds: string[]): void {
  expandedSpans.set(new Set(spanIds));
}

/**
 * Collapse all spans
 */
export function collapseAll(): void {
  expandedSpans.set(new Set());
}

/**
 * Check if a span is expanded
 */
export function isExpanded(spanId: string): boolean {
  return get(expandedSpans).has(spanId);
}

/**
 * Set focused span for keyboard navigation
 */
export function setFocusedSpan(spanId: string | null): void {
  focusedSpanId.set(spanId);
}

/**
 * Currently selected span ID for details panel
 */
export const selectedSpanId = writable<string | null>(null);

/**
 * Set selected span for details panel
 */
export function setSelectedSpan(spanId: string | null): void {
  selectedSpanId.set(spanId);
}

/**
 * Clear span selection
 */
export function clearSelection(): void {
  selectedSpanId.set(null);
}

/**
 * Scroll position in pixels for state preservation
 */
export const scrollPosition = writable<number>(0);

/**
 * Set scroll position
 */
export function setScrollPosition(position: number): void {
  scrollPosition.set(position);
}

/**
 * Get current webview state for persistence
 */
export function getState(): WebviewState {
  return {
    expandedSpans: Array.from(get(expandedSpans)),
    scrollPosition: get(scrollPosition),
    selectedSpanId: get(selectedSpanId)
  };
}

/**
 * Restore webview state from saved state
 */
export function restoreState(state: WebviewState): void {
  expandedSpans.set(new Set(state.expandedSpans));
  selectedSpanId.set(state.selectedSpanId);
  scrollPosition.set(state.scrollPosition);
}
