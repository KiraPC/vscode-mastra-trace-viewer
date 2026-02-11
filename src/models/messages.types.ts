/**
 * Message types for Extension ↔ Webview communication
 * 
 * Uses discriminated union types for type-safe message handling
 */

import type { Trace } from './trace.types';
import type { WebviewState } from './webviewState.types';

/**
 * Messages from Extension to Webview
 */
export type ExtensionMessage =
  | { type: 'loadTrace'; payload: { trace: Trace; selectedSpanId?: string } }
  | { type: 'error'; payload: { message: string } }
  | { type: 'loading'; payload: { message: string } }
  | { type: 'restoreState'; payload: WebviewState };

/**
 * Messages from Webview to Extension
 */
export type WebviewMessage =
  | { type: 'retry' }
  | { type: 'ready' }
  | { type: 'showWarning'; payload: { message: string } }
  | { type: 'saveState'; payload: WebviewState };
