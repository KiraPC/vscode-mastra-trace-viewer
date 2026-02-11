/**
 * Message types for Extension ↔ Webview communication
 * 
 * Uses discriminated union types for type-safe message handling
 */

import type { Trace } from './trace.types';

/**
 * Messages from Extension to Webview
 */
export type ExtensionMessage =
  | { type: 'loadTrace'; payload: { trace: Trace; selectedSpanId?: string } }
  | { type: 'error'; payload: { message: string } }
  | { type: 'loading'; payload: { message: string } };

/**
 * Messages from Webview to Extension
 */
export type WebviewMessage =
  | { type: 'retry' }
  | { type: 'ready' };
