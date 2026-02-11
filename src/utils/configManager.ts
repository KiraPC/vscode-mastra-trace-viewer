/**
 * ConfigurationManager - Manages VSCode configuration for Mastra Trace Viewer
 * Provides typed access to extension settings with validation
 */

import * as vscode from 'vscode';
import { MastraApiError } from '../models/errors.types';

export class ConfigurationManager {
  private static readonly CONFIG_SECTION = 'mastraTraceViewer';
  private static readonly ENDPOINT_KEY = 'endpoint';
  private static readonly DEFAULT_ENDPOINT = 'http://localhost:4111';

  /**
   * Get the configured Mastra endpoint URL
   * Priority: workspace settings > user settings > default
   * @returns Validated endpoint URL
   * @throws MastraApiError if endpoint is invalid
   */
  static getEndpoint(): string {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    const endpoint = config.get<string>(this.ENDPOINT_KEY, this.DEFAULT_ENDPOINT);

    return this.validateEndpoint(endpoint);
  }

  /**
   * Validate and normalize endpoint URL
   * @param endpoint URL to validate
   * @returns Normalized URL string
   * @throws MastraApiError if URL is invalid
   */
  static validateEndpoint(endpoint: string): string {
    // Trim whitespace
    const trimmed = endpoint.trim();

    // Check for empty
    if (!trimmed) {
      throw new MastraApiError(
        'Mastra endpoint cannot be empty',
        'INVALID_CONFIG'
      );
    }

    // Check for protocol
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      throw new MastraApiError(
        `Invalid Mastra endpoint: ${trimmed}. URL must start with http:// or https://`,
        'INVALID_CONFIG'
      );
    }

    // Validate URL structure
    try {
      const url = new globalThis.URL(trimmed);
      // Return without trailing slash for consistency
      return url.toString().replace(/\/$/, '');
    } catch (error) {
      throw new MastraApiError(
        `Malformed Mastra endpoint: ${trimmed}. Please check the URL format.`,
        'INVALID_CONFIG',
        undefined,
        error
      );
    }
  }

  /**
   * Check if workspace has custom endpoint configured
   * (Different from user/default settings)
   */
  static hasWorkspaceEndpoint(): boolean {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    const inspect = config.inspect<string>(this.ENDPOINT_KEY);
    return inspect?.workspaceValue !== undefined;
  }

  /**
   * Get the default endpoint value
   */
  static getDefaultEndpoint(): string {
    return this.DEFAULT_ENDPOINT;
  }
}
