/**
 * State handler for preserving webview state across tab switches
 * 
 * Manages saving and restoring: expandedSpans, scrollPosition, selectedSpanId
 */

import { sendMessage } from './messageHandler';
import type { WebviewState } from '../../models/webviewState.types';

let saveStateTimeout: ReturnType<typeof setTimeout> | null = null;
let stateGetter: (() => WebviewState) | null = null;

/**
 * Initialize state handler with callbacks for getting and restoring state
 * @param getState Function to get current state from stores
 * @param restoreStateFn Function to restore state to stores
 */
export function initStateHandler(
  getState: () => WebviewState,
  restoreStateFn: (state: WebviewState) => void
): () => void {
  stateGetter = getState;

  // Listen for state restoration from extension
  const messageListener = (event: MessageEvent) => {
    const message = event.data;
    if (message.type === 'restoreState' && message.payload) {
      restoreStateFn(message.payload);
    }
  };
  window.addEventListener('message', messageListener);

  // Save state on visibility change (tab switch)
  const visibilityListener = () => {
    if (document.visibilityState === 'hidden') {
      saveStateNow();
    }
  };
  document.addEventListener('visibilitychange', visibilityListener);

  // Periodic state save (every 5 seconds)
  const intervalId = setInterval(() => {
    saveStateDebounced();
  }, 5000);

  // Save state before unload
  const beforeUnloadListener = () => {
    saveStateNow();
  };
  window.addEventListener('beforeunload', beforeUnloadListener);

  // Return cleanup function
  return () => {
    window.removeEventListener('message', messageListener);
    document.removeEventListener('visibilitychange', visibilityListener);
    window.removeEventListener('beforeunload', beforeUnloadListener);
    clearInterval(intervalId);
    if (saveStateTimeout) {
      clearTimeout(saveStateTimeout);
    }
  };
}

/**
 * Save state immediately
 */
function saveStateNow(): void {
  if (stateGetter) {
    sendMessage({
      type: 'saveState',
      payload: stateGetter()
    });
  }
}

/**
 * Save state with debounce (500ms)
 */
function saveStateDebounced(): void {
  if (saveStateTimeout) {
    clearTimeout(saveStateTimeout);
  }
  saveStateTimeout = setTimeout(() => {
    saveStateNow();
    saveStateTimeout = null;
  }, 500);
}

/**
 * Manually trigger state save (call on significant UI changes)
 */
export function triggerStateSave(): void {
  saveStateDebounced();
}
