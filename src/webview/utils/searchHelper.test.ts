/**
 * Tests for searchHelper
 */

import { describe, it, expect } from 'vitest';
import { searchSpans, escapeRegexChars } from './searchHelper';
import type { Span } from '../../models/trace.types';

// Helper to create minimal span for testing
function createSpan(overrides: Partial<Span> & { spanId: string }): Span {
  return {
    traceId: 'trace-1',
    parentSpanId: null,
    name: 'Test Span',
    spanType: 'custom',
    startedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('searchHelper', () => {
  describe('searchSpans', () => {
    describe('empty/invalid queries', () => {
      it('should return empty array for empty query', () => {
        const spans = [createSpan({ spanId: 'span-1' })];
        expect(searchSpans('', spans)).toEqual([]);
      });

      it('should return empty array for whitespace-only query', () => {
        const spans = [createSpan({ spanId: 'span-1' })];
        expect(searchSpans('   ', spans)).toEqual([]);
      });

      it('should return empty array for empty spans array', () => {
        expect(searchSpans('test', [])).toEqual([]);
      });
    });

    describe('name matching', () => {
      it('should match span by name', () => {
        const spans = [
          createSpan({ spanId: 'span-1', name: 'User Authentication' }),
          createSpan({ spanId: 'span-2', name: 'Database Query' }),
        ];
        const results = searchSpans('auth', spans);
        expect(results).toEqual(['span-1']);
      });

      it('should be case-insensitive for name', () => {
        const spans = [createSpan({ spanId: 'span-1', name: 'User Authentication' })];
        expect(searchSpans('AUTH', spans)).toEqual(['span-1']);
        expect(searchSpans('Auth', spans)).toEqual(['span-1']);
        expect(searchSpans('auth', spans)).toEqual(['span-1']);
      });
    });

    describe('spanType matching', () => {
      it('should match span by spanType', () => {
        const spans = [
          createSpan({ spanId: 'span-1', spanType: 'llm_call' }),
          createSpan({ spanId: 'span-2', spanType: 'agent_run' }),
        ];
        const results = searchSpans('llm', spans);
        expect(results).toEqual(['span-1']);
      });

      it('should be case-insensitive for spanType', () => {
        const spans = [createSpan({ spanId: 'span-1', spanType: 'agent_run' })];
        expect(searchSpans('AGENT', spans)).toEqual(['span-1']);
      });
    });

    describe('input matching', () => {
      it('should match string input', () => {
        const spans = [
          createSpan({ spanId: 'span-1', input: 'Hello World' }),
          createSpan({ spanId: 'span-2', input: 'Goodbye' }),
        ];
        const results = searchSpans('hello', spans);
        expect(results).toEqual(['span-1']);
      });

      it('should match object input (deep search)', () => {
        const spans = [
          createSpan({
            spanId: 'span-1',
            input: { prompt: 'Tell me about TypeScript', temperature: 0.5 },
          }),
          createSpan({
            spanId: 'span-2',
            input: { prompt: 'Tell me about Python', temperature: 0.7 },
          }),
        ];
        const results = searchSpans('typescript', spans);
        expect(results).toEqual(['span-1']);
      });

      it('should match nested object input', () => {
        const spans = [
          createSpan({
            spanId: 'span-1',
            input: { config: { model: 'gpt-4', settings: { stream: true } } },
          }),
        ];
        const results = searchSpans('gpt-4', spans);
        expect(results).toEqual(['span-1']);
      });

      it('should match array input', () => {
        const spans = [
          createSpan({
            spanId: 'span-1',
            input: ['item1', 'searchable-item', 'item3'],
          }),
        ];
        const results = searchSpans('searchable', spans);
        expect(results).toEqual(['span-1']);
      });
    });

    describe('output matching', () => {
      it('should match string output', () => {
        const spans = [
          createSpan({ spanId: 'span-1', output: 'Generated response text' }),
        ];
        const results = searchSpans('response', spans);
        expect(results).toEqual(['span-1']);
      });

      it('should match object output', () => {
        const spans = [
          createSpan({
            spanId: 'span-1',
            output: { result: 'success', data: { message: 'Operation completed' } },
          }),
        ];
        const results = searchSpans('completed', spans);
        expect(results).toEqual(['span-1']);
      });
    });

    describe('attributes matching', () => {
      it('should match attributes', () => {
        const spans = [
          createSpan({
            spanId: 'span-1',
            attributes: { userId: 'user-123', action: 'login' },
          }),
        ];
        const results = searchSpans('user-123', spans);
        expect(results).toEqual(['span-1']);
      });

      it('should match nested attributes', () => {
        const spans = [
          createSpan({
            spanId: 'span-1',
            attributes: { context: { environment: 'production' }, severity: 'high' },
          }),
        ];
        const results = searchSpans('production', spans);
        expect(results).toEqual(['span-1']);
      });
    });

    describe('multiple matches', () => {
      it('should return all matching spans', () => {
        const spans = [
          createSpan({ spanId: 'span-1', name: 'User Service' }),
          createSpan({ spanId: 'span-2', name: 'Product Service' }),
          createSpan({ spanId: 'span-3', name: 'User Profile' }),
        ];
        const results = searchSpans('user', spans);
        expect(results).toEqual(['span-1', 'span-3']);
      });

      it('should match across different fields', () => {
        const spans = [
          createSpan({ spanId: 'span-1', name: 'API Call' }),
          createSpan({ spanId: 'span-2', input: 'API request data' }),
          createSpan({ spanId: 'span-3', output: { api: 'response' } }),
          createSpan({ spanId: 'span-4', spanType: 'api_call' }),
        ];
        const results = searchSpans('api', spans);
        expect(results).toEqual(['span-1', 'span-2', 'span-3', 'span-4']);
      });
    });

    describe('special characters and edge cases', () => {
      it('should handle spaces in query', () => {
        const spans = [
          createSpan({ spanId: 'span-1', name: 'User Authentication Service' }),
        ];
        const results = searchSpans('authentication service', spans);
        expect(results).toEqual(['span-1']);
      });

      it('should handle special characters in query', () => {
        const spans = [
          createSpan({ spanId: 'span-1', input: 'Path: /api/v1/users?id=123' }),
        ];
        const results = searchSpans('/api/v1', spans);
        expect(results).toEqual(['span-1']);
      });

      it('should handle query with regex special chars', () => {
        const spans = [
          createSpan({ spanId: 'span-1', name: 'Test (function)' }),
          createSpan({ spanId: 'span-2', input: 'price: $100.00' }),
        ];
        expect(searchSpans('(function)', spans)).toEqual(['span-1']);
        expect(searchSpans('$100', spans)).toEqual(['span-2']);
      });

      it('should handle null/undefined input gracefully', () => {
        const spans = [
          createSpan({ spanId: 'span-1', input: null }),
          createSpan({ spanId: 'span-2', input: undefined }),
          createSpan({ spanId: 'span-3', name: 'Valid Span' }),
        ];
        const results = searchSpans('valid', spans);
        expect(results).toEqual(['span-3']);
      });
    });

    describe('performance', () => {
      it('should complete in under 100ms for 500 spans', () => {
        const spans: Span[] = [];
        for (let i = 0; i < 500; i++) {
          spans.push(
            createSpan({
              spanId: `span-${i}`,
              name: `Span ${i} - Some Operation Name`,
              spanType: i % 2 === 0 ? 'llm_call' : 'agent_run',
              input: { data: `Input data for span ${i}`, nested: { value: i } },
              output: { result: `Output for span ${i}` },
              attributes: { index: i, category: `category-${i % 10}` },
            })
          );
        }

        const startTime = performance.now();
        // Search for a unique string that only matches span 250
        const results = searchSpans('Span 250 -', spans);
        const endTime = performance.now();

        expect(results).toEqual(['span-250']);
        expect(endTime - startTime).toBeLessThan(100);
      });
    });
  });

  describe('escapeRegexChars', () => {
    it('should escape all regex special characters', () => {
      expect(escapeRegexChars('.*+?^${}()|[]\\'))
        .toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });

    it('should leave normal characters unchanged', () => {
      expect(escapeRegexChars('hello world')).toBe('hello world');
    });

    it('should handle mixed content', () => {
      expect(escapeRegexChars('test(value)'))
        .toBe('test\\(value\\)');
    });

    it('should handle empty string', () => {
      expect(escapeRegexChars('')).toBe('');
    });
  });
});
