/**
 * Svelte store for trace data
 */

import { writable } from 'svelte/store';
import type { Trace } from '../../models/trace.types';

/**
 * Store holding the current trace (or null if none loaded)
 */
export const traceStore = writable<Trace | null>(null);

/**
 * Set the current trace
 * @param trace The trace to display
 */
export function setTrace(trace: Trace): void {
  traceStore.set(trace);
}

/**
 * Clear the current trace
 */
export function clearTrace(): void {
  traceStore.set(null);
}
