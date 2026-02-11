/**
 * WebviewState - State that persists per-trace tab for UX continuity
 * 
 * Used for preserving expand/collapse state, scroll position, and selection
 * when switching between trace tabs.
 */

/**
 * Serializable webview state for message passing between extension and webview
 */
export interface WebviewState {
  /** Array of expanded span IDs (serialized from Set) */
  expandedSpans: string[];
  
  /** Scroll offset in pixels */
  scrollPosition: number;
  
  /** Currently selected span ID, or null if none */
  selectedSpanId: string | null;
}

/**
 * Default state for new trace panels
 */
export const DEFAULT_WEBVIEW_STATE: WebviewState = {
  expandedSpans: [],
  scrollPosition: 0,
  selectedSpanId: null
};
