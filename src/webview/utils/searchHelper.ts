/**
 * Search helper utilities for searching spans
 * Provides full-text search across span properties
 */

import type { Span } from '../../models/trace.types';

/**
 * Search spans for matching query text
 * Performs case-insensitive full-text search across:
 * - span name
 * - span type
 * - input (JSON stringified)
 * - output (JSON stringified)
 * - attributes (JSON stringified)
 *
 * @param query - Search query string
 * @param spans - Array of spans to search
 * @returns Array of matching spanIds
 */
export function searchSpans(query: string, spans: Span[]): string[] {
  if (!query || !query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const results: string[] = [];

  for (const span of spans) {
    if (spanMatchesQuery(span, lowerQuery)) {
      results.push(span.spanId);
    }
  }

  return results;
}

/**
 * Check if a span matches the query
 */
function spanMatchesQuery(span: Span, query: string): boolean {
  // Check name
  if (span.name && span.name.toLowerCase().includes(query)) {
    return true;
  }

  // Check spanType
  if (span.spanType && span.spanType.toLowerCase().includes(query)) {
    return true;
  }

  // Check input (stringify if object)
  if (span.input !== undefined && span.input !== null) {
    if (stringifyAndSearch(span.input, query)) {
      return true;
    }
  }

  // Check output
  if (span.output !== undefined && span.output !== null) {
    if (stringifyAndSearch(span.output, query)) {
      return true;
    }
  }

  // Check attributes
  if (span.attributes) {
    if (stringifyAndSearch(span.attributes, query)) {
      return true;
    }
  }

  return false;
}

/**
 * Stringify a value and search for the query
 * Handles complex objects by JSON stringifying them
 */
function stringifyAndSearch(value: unknown, query: string): boolean {
  try {
    if (typeof value === 'string') {
      return value.toLowerCase().includes(query);
    }
    return JSON.stringify(value).toLowerCase().includes(query);
  } catch {
    return false;
  }
}

/**
 * Escape special regex characters in a string
 * Utility function for future regex-based search features.
 * Note: Current searchSpans() uses String.includes() which handles
 * special characters natively, but this is kept for:
 * - Potential regex search mode
 * - Highlighting search matches in UI (story 5.2)
 * @param str - String to escape
 * @returns Escaped string safe for use in RegExp
 */
export function escapeRegexChars(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
