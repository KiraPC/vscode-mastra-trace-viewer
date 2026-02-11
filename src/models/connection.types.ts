/**
 * Connection state types for Mastra extension
 */

import { MastraApiError } from './errors.types';

/**
 * Possible connection states for Mastra client
 */
export enum ConnectionState {
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnected = 'disconnected',
  Error = 'error'
}

/**
 * Complete connection status information
 */
export interface ConnectionStatus {
  state: ConnectionState;
  endpoint: string;
  error?: MastraApiError;
  lastConnected?: Date;
}
