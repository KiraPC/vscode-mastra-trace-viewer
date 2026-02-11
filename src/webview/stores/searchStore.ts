/**
 * Svelte stores for search state management
 * Manages search query, results, and navigation through results
 */

import { writable, get as getStore } from 'svelte/store';

/**
 * Current search query string
 */
export const query = writable<string>('');

/**
 * Array of matching span IDs from search
 */
export const results = writable<string[]>([]);

/**
 * Current index in results array for navigation (0-based)
 */
export const currentIndex = writable<number>(-1);

/**
 * Check if there are any search results
 */
export function hasResults(): boolean {
  return getStore(results).length > 0;
}

/**
 * Get the count of search results
 */
export function getResultCount(): number {
  return getStore(results).length;
}

/**
 * Set the search query
 */
export function setQuery(newQuery: string): void {
  query.set(newQuery);
}

/**
 * Set the search results and reset currentIndex
 */
export function setResults(newResults: string[]): void {
  results.set(newResults);
  currentIndex.set(newResults.length > 0 ? 0 : -1);
}

/**
 * Clear all search state
 */
export function clearSearch(): void {
  query.set('');
  results.set([]);
  currentIndex.set(-1);
}

/**
 * Navigate to the next result (wraps around)
 * @returns true if wrapped around to beginning
 */
export function nextResult(): boolean {
  const currentResults = getStore(results);
  if (currentResults.length === 0) return false;

  let wrapped = false;
  currentIndex.update(idx => {
    const next = idx + 1;
    if (next >= currentResults.length) {
      wrapped = true;
      return 0;
    }
    return next;
  });
  return wrapped;
}

/**
 * Navigate to the previous result (wraps around)
 * @returns true if wrapped around to end
 */
export function prevResult(): boolean {
  const currentResults = getStore(results);
  if (currentResults.length === 0) return false;

  let wrapped = false;
  currentIndex.update(idx => {
    const prev = idx - 1;
    if (prev < 0) {
      wrapped = true;
      return currentResults.length - 1;
    }
    return prev;
  });
  return wrapped;
}

/**
 * Get the currently focused result span ID
 */
export function getCurrentResultSpanId(): string | null {
  const currentResults = getStore(results);
  const idx = getStore(currentIndex);
  if (idx < 0 || idx >= currentResults.length) return null;
  return currentResults[idx];
}
