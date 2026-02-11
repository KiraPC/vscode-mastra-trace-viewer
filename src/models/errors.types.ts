/**
 * Custom error types for Mastra API interactions
 */

export type MastraApiErrorCode = 'NETWORK' | 'TIMEOUT' | 'API_ERROR' | 'INVALID_DATA' | 'INVALID_CONFIG';

export class MastraApiError extends Error {
  public readonly code: MastraApiErrorCode;
  public readonly statusCode?: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: MastraApiErrorCode,
    statusCode?: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'MastraApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MastraApiError);
    }
  }
}

/**
 * Type guard to check if error is MastraApiError
 */
export function isMastraApiError(error: unknown): error is MastraApiError {
  return error instanceof MastraApiError;
}
