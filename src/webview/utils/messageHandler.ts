/**
 * Message handler utilities for Extension ↔ Webview communication
 */

import type { ExtensionMessage, WebviewMessage } from '../../models/messages.types';

/**
 * VSCode webview API type
 */
interface VsCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

/**
 * Acquire VSCode API (available in webview context)
 */
declare function acquireVsCodeApi(): VsCodeApi;

/**
 * Cached VSCode API instance
 */
let vsCodeApi: VsCodeApi | null = null;

/**
 * Get the VSCode API instance (lazy initialization)
 */
function getVsCodeApi(): VsCodeApi {
  if (!vsCodeApi) {
    vsCodeApi = acquireVsCodeApi();
  }
  return vsCodeApi;
}

/**
 * Send a message to the extension
 * @param message The message to send
 */
export function sendMessage(message: WebviewMessage): void {
  getVsCodeApi().postMessage(message);
}

/**
 * Subscribe to messages from the extension
 * @param handler Callback for handling incoming messages
 * @returns Unsubscribe function
 */
export function onMessage(handler: (message: ExtensionMessage) => void): () => void {
  const listener = (event: MessageEvent<ExtensionMessage>) => {
    handler(event.data);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
