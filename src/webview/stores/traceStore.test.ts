/**
 * Tests for traceStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { traceStore, setTrace, clearTrace } from './traceStore';
import type { Trace } from '../../models/trace.types';

describe('traceStore', () => {
  const testTrace: Trace = {
    traceId: 'test-trace-123',
    spans: [
      {
        traceId: 'test-trace-123',
        spanId: 'span-1',
        parentSpanId: null,
        name: 'root-span',
        spanType: 'agent_run',
        startedAt: '2026-02-11T10:00:00Z',
        status: 'success',
      },
    ],
  };

  beforeEach(() => {
    clearTrace();
  });

  describe('initial state', () => {
    it('should start with null', () => {
      expect(get(traceStore)).toBeNull();
    });
  });

  describe('setTrace', () => {
    it('should set the trace', () => {
      setTrace(testTrace);
      expect(get(traceStore)).toEqual(testTrace);
    });

    it('should replace existing trace', () => {
      const secondTrace: Trace = {
        traceId: 'trace-456',
        spans: [],
      };

      setTrace(testTrace);
      setTrace(secondTrace);
      
      expect(get(traceStore)).toEqual(secondTrace);
    });
  });

  describe('clearTrace', () => {
    it('should clear the trace', () => {
      setTrace(testTrace);
      clearTrace();
      expect(get(traceStore)).toBeNull();
    });

    it('should work on already empty store', () => {
      clearTrace();
      expect(get(traceStore)).toBeNull();
    });
  });

  describe('reactivity', () => {
    it('should notify subscribers when trace changes', () => {
      const values: (Trace | null)[] = [];
      const unsubscribe = traceStore.subscribe((value) => {
        values.push(value);
      });

      setTrace(testTrace);
      clearTrace();

      unsubscribe();

      expect(values).toHaveLength(3); // initial null, trace, null
      expect(values[0]).toBeNull();
      expect(values[1]).toEqual(testTrace);
      expect(values[2]).toBeNull();
    });
  });
});
