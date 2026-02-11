/**
 * Tests for spanTreeBuilder utility
 */

import { describe, it, expect } from 'vitest';
import { buildTree, formatDuration, getSpanTypeIcon, getSpanTypeColor, countNodes } from './spanTreeBuilder';
import type { Span } from '../models/trace.types';

describe('spanTreeBuilder', () => {
  describe('buildTree', () => {
    it('should return empty array for null input', () => {
      expect(buildTree(null as unknown as Span[])).toEqual([]);
    });

    it('should return empty array for empty spans array', () => {
      expect(buildTree([])).toEqual([]);
    });

    it('should build tree with single root span', () => {
      const spans: Span[] = [
        {
          traceId: 'trace-1',
          spanId: 'span-1',
          parentSpanId: null,
          name: 'root-span',
          spanType: 'agent_run',
          startedAt: '2026-02-11T10:00:00Z',
        },
      ];

      const tree = buildTree(spans);

      expect(tree).toHaveLength(1);
      expect(tree[0].spanId).toBe('span-1');
      expect(tree[0].name).toBe('root-span');
      expect(tree[0].children).toEqual([]);
      expect(tree[0].depth).toBe(0);
    });

    it('should build tree with nested children', () => {
      const spans: Span[] = [
        {
          traceId: 'trace-1',
          spanId: 'root',
          parentSpanId: null,
          name: 'root',
          spanType: 'agent_run',
          startedAt: '2026-02-11T10:00:00Z',
        },
        {
          traceId: 'trace-1',
          spanId: 'child-1',
          parentSpanId: 'root',
          name: 'child-1',
          spanType: 'processor_run',
          startedAt: '2026-02-11T10:00:01Z',
        },
        {
          traceId: 'trace-1',
          spanId: 'grandchild',
          parentSpanId: 'child-1',
          name: 'grandchild',
          spanType: 'llm_call',
          startedAt: '2026-02-11T10:00:02Z',
        },
      ];

      const tree = buildTree(spans);

      expect(tree).toHaveLength(1);
      expect(tree[0].spanId).toBe('root');
      expect(tree[0].depth).toBe(0);
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].spanId).toBe('child-1');
      expect(tree[0].children[0].depth).toBe(1);
      expect(tree[0].children[0].children).toHaveLength(1);
      expect(tree[0].children[0].children[0].spanId).toBe('grandchild');
      expect(tree[0].children[0].children[0].depth).toBe(2);
    });

    it('should handle multiple root spans', () => {
      const spans: Span[] = [
        {
          traceId: 'trace-1',
          spanId: 'root-1',
          parentSpanId: null,
          name: 'root-1',
          spanType: 'agent_run',
          startedAt: '2026-02-11T10:00:00Z',
        },
        {
          traceId: 'trace-1',
          spanId: 'root-2',
          parentSpanId: null,
          name: 'root-2',
          spanType: 'agent_run',
          startedAt: '2026-02-11T10:00:01Z',
        },
      ];

      const tree = buildTree(spans);

      expect(tree).toHaveLength(2);
      expect(tree[0].spanId).toBe('root-1');
      expect(tree[1].spanId).toBe('root-2');
    });

    it('should handle orphaned spans (parent not found)', () => {
      const spans: Span[] = [
        {
          traceId: 'trace-1',
          spanId: 'orphan',
          parentSpanId: 'non-existent-parent',
          name: 'orphan',
          spanType: 'agent_run',
          startedAt: '2026-02-11T10:00:00Z',
        },
      ];

      const tree = buildTree(spans);

      // Orphaned span should become a root
      expect(tree).toHaveLength(1);
      expect(tree[0].spanId).toBe('orphan');
      expect(tree[0].depth).toBe(0);
    });

    it('should sort children by startedAt', () => {
      const spans: Span[] = [
        {
          traceId: 'trace-1',
          spanId: 'root',
          parentSpanId: null,
          name: 'root',
          spanType: 'agent_run',
          startedAt: '2026-02-11T10:00:00Z',
        },
        {
          traceId: 'trace-1',
          spanId: 'child-2',
          parentSpanId: 'root',
          name: 'child-2',
          spanType: 'processor_run',
          startedAt: '2026-02-11T10:00:10Z', // Later
        },
        {
          traceId: 'trace-1',
          spanId: 'child-1',
          parentSpanId: 'root',
          name: 'child-1',
          spanType: 'processor_run',
          startedAt: '2026-02-11T10:00:05Z', // Earlier
        },
      ];

      const tree = buildTree(spans);

      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].spanId).toBe('child-1'); // Earlier first
      expect(tree[0].children[1].spanId).toBe('child-2'); // Later second
    });

    it('should preserve original span reference', () => {
      const spans: Span[] = [
        {
          traceId: 'trace-1',
          spanId: 'span-1',
          parentSpanId: null,
          name: 'test',
          spanType: 'agent_run',
          startedAt: '2026-02-11T10:00:00Z',
          input: { test: 'input' },
          output: { test: 'output' },
        },
      ];

      const tree = buildTree(spans);

      expect(tree[0].originalSpan).toBe(spans[0]);
      expect(tree[0].input).toEqual({ test: 'input' });
      expect(tree[0].output).toEqual({ test: 'output' });
    });
  });

  describe('formatDuration', () => {
    it('should return "running" for null endedAt', () => {
      expect(formatDuration('2026-02-11T10:00:00Z', null)).toBe('running');
    });

    it('should return "running" for undefined endedAt', () => {
      expect(formatDuration('2026-02-11T10:00:00Z', undefined)).toBe('running');
    });

    it('should format milliseconds correctly', () => {
      const start = '2026-02-11T10:00:00.000Z';
      const end = '2026-02-11T10:00:00.500Z';
      expect(formatDuration(start, end)).toBe('500ms');
    });

    it('should format seconds correctly', () => {
      const start = '2026-02-11T10:00:00.000Z';
      const end = '2026-02-11T10:00:02.500Z';
      expect(formatDuration(start, end)).toBe('2.50s');
    });

    it('should format minutes correctly', () => {
      const start = '2026-02-11T10:00:00.000Z';
      const end = '2026-02-11T10:02:30.000Z';
      expect(formatDuration(start, end)).toBe('2m 30s');
    });

    it('should handle negative duration', () => {
      const start = '2026-02-11T10:00:01.000Z';
      const end = '2026-02-11T10:00:00.000Z';
      expect(formatDuration(start, end)).toBe('0ms');
    });

    it('should handle Date objects', () => {
      const start = new Date('2026-02-11T10:00:00.000Z');
      const end = new Date('2026-02-11T10:00:00.250Z');
      expect(formatDuration(start, end)).toBe('250ms');
    });
  });

  describe('getSpanTypeIcon', () => {
    it('should return person for agent_run', () => {
      expect(getSpanTypeIcon('agent_run')).toBe('person');
    });

    it('should return gear for processor_run', () => {
      expect(getSpanTypeIcon('processor_run')).toBe('gear');
    });

    it('should return tools for tool_streaming', () => {
      expect(getSpanTypeIcon('tool_streaming')).toBe('tools');
    });

    it('should return sparkle for llm_call', () => {
      expect(getSpanTypeIcon('llm_call')).toBe('sparkle');
    });

    it('should return circle-outline for unknown types', () => {
      expect(getSpanTypeIcon('unknown')).toBe('circle-outline');
      expect(getSpanTypeIcon('custom')).toBe('circle-outline');
    });
  });

  describe('getSpanTypeColor', () => {
    it('should return agent-run color variable', () => {
      expect(getSpanTypeColor('agent_run')).toBe('var(--span-color-agent-run)');
    });

    it('should return processor-run color variable', () => {
      expect(getSpanTypeColor('processor_run')).toBe('var(--span-color-processor-run)');
    });

    it('should return tool-streaming color variable', () => {
      expect(getSpanTypeColor('tool_streaming')).toBe('var(--span-color-tool-streaming)');
    });

    it('should return llm-call color variable', () => {
      expect(getSpanTypeColor('llm_call')).toBe('var(--span-color-llm-call)');
    });

    it('should return custom color for unknown types', () => {
      expect(getSpanTypeColor('unknown')).toBe('var(--span-color-custom)');
      expect(getSpanTypeColor('custom')).toBe('var(--span-color-custom)');
    });
  });

  describe('countNodes', () => {
    it('should return 0 for empty array', () => {
      expect(countNodes([])).toBe(0);
    });

    it('should count flat nodes', () => {
      const spans: Span[] = [
        { traceId: 't', spanId: '1', parentSpanId: null, name: 'a', spanType: 'agent_run', startedAt: '' },
        { traceId: 't', spanId: '2', parentSpanId: null, name: 'b', spanType: 'agent_run', startedAt: '' },
      ];
      const tree = buildTree(spans);
      expect(countNodes(tree)).toBe(2);
    });

    it('should count nested nodes', () => {
      const spans: Span[] = [
        { traceId: 't', spanId: 'root', parentSpanId: null, name: 'root', spanType: 'agent_run', startedAt: '2026-02-11T10:00:00Z' },
        { traceId: 't', spanId: 'child', parentSpanId: 'root', name: 'child', spanType: 'processor_run', startedAt: '2026-02-11T10:00:01Z' },
        { traceId: 't', spanId: 'gc', parentSpanId: 'child', name: 'gc', spanType: 'llm_call', startedAt: '2026-02-11T10:00:02Z' },
      ];
      const tree = buildTree(spans);
      expect(countNodes(tree)).toBe(3);
    });
  });
});
